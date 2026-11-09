import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js'
import { useAuthStore } from './auth.js'

const recordColumns =
  'id, user_id, systolic, diastolic, pulse, notes, date, created_at'
const medicationColumns =
  'id, user_id, name, dosage, frequency, schedules, notes, active, created_at, updated_at'
const mealColumns =
  'id, user_id, name, category, calories, protein, carbohydrates, potassium, notes, date, created_at'

const requireText = (value, label) => {
  const text = String(value ?? '').trim()
  if (!text) {
    throw new Error(`${label} es obligatorio.`)
  }
  return text
}

const requirePositiveNumber = (value, label, { optional = false } = {}) => {
  if (optional && (value === null || value === undefined || value === '')) {
    return null
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${label} debe ser un número mayor que cero.`)
  }
  return number
}

const optionalNonNegativeNumber = (value, label) => {
  if (value === null || value === undefined || value === '') {
    return null
  }
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${label} debe ser un número igual o mayor que cero.`)
  }
  return number
}

const normalizeDate = (value, label = 'La fecha') => {
  if (value === undefined || value === null || value === '') {
    return undefined
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} no es válida.`)
  }
  return date.toISOString()
}

const normalizeBloodPressure = input => {
  const result = {
    systolic: requirePositiveNumber(input.systolic, 'La presión sistólica'),
    diastolic: requirePositiveNumber(input.diastolic, 'La presión diastólica'),
    pulse: requirePositiveNumber(input.pulse ?? input.heart_rate, 'El pulso', {
      optional: true
    }),
    notes: String(input.notes ?? '').trim()
  }
  const date = normalizeDate(
    input.date ?? input.measured_at ?? input.recorded_at
  )
  if (date) {
    result.date = date
  }
  return result
}

const normalizeMedication = input => {
  const schedules = input.schedules ?? input.schedule ?? []
  if (
    schedules === null ||
    (typeof schedules !== 'object' && !Array.isArray(schedules))
  ) {
    throw new Error(
      'Los horarios del medicamento deben ser una lista u objeto.'
    )
  }
  return {
    name: requireText(input.name, 'El nombre del medicamento'),
    dosage: String(input.dosage ?? '').trim(),
    frequency: String(input.frequency ?? '').trim(),
    schedules,
    notes: String(input.notes ?? '').trim(),
    active: typeof input.active === 'boolean' ? input.active : true
  }
}

const normalizeMeal = input => {
  const name = input.name ?? input.meal ?? input.title
  const result = {
    name: requireText(name, 'El nombre de la comida'),
    category: String(
      input.category ?? input.meal_type ?? input.type ?? ''
    ).trim(),
    calories: optionalNonNegativeNumber(input.calories, 'Las calorías'),
    protein: optionalNonNegativeNumber(input.protein, 'La proteína'),
    carbohydrates: optionalNonNegativeNumber(
      input.carbohydrates ?? input.carbs,
      'Los carbohidratos'
    ),
    potassium: optionalNonNegativeNumber(input.potassium, 'El potasio'),
    notes: String(input.notes ?? '').trim()
  }
  const date = normalizeDate(
    input.date ?? input.eaten_at,
    'La fecha de la comida'
  )
  if (date) {
    result.date = date
  }
  return result
}

export const useHealthStore = defineStore('health', () => {
  const auth = useAuthStore()
  const bloodPressureRecords = ref([])
  const medications = ref([])
  const meals = ref([])
  const reminders = ref({})
  const isLoading = ref(false)

  const getContext = async action => {
    if (!auth.currentUser?.id) {
      throw new Error(`Inicia sesión para ${action}.`)
    }
    if (!isSupabaseConfigured) {
      throw new Error(
        'El servicio de almacenamiento compartido no está configurado.'
      )
    }
    return {
      client: await getSupabase(),
      userId: auth.currentUser.id
    }
  }

  const load = async () => {
    isLoading.value = true
    try {
      const { client, userId } = await getContext(
        'consultar tus datos de salud'
      )
      const [
        bloodPressureResult,
        medicationsResult,
        remindersResult,
        mealsResult
      ] = await Promise.all([
        client
          .from('blood_pressure_records')
          .select(recordColumns)
          .eq('user_id', userId)
          .order('date', { ascending: false }),
        client
          .from('medications')
          .select(medicationColumns)
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        client
          .from('reminder_preferences')
          .select('settings')
          .eq('user_id', userId)
          .maybeSingle(),
        client
          .from('meal_records')
          .select(mealColumns)
          .eq('user_id', userId)
          .order('date', { ascending: false })
      ])

      for (const result of [
        bloodPressureResult,
        medicationsResult,
        remindersResult,
        mealsResult
      ]) {
        if (result.error) {
          throw result.error
        }
      }

      bloodPressureRecords.value = bloodPressureResult.data
      medications.value = medicationsResult.data
      reminders.value = remindersResult.data?.settings ?? {}
      meals.value = mealsResult.data
      return {
        bloodPressureRecords: bloodPressureRecords.value,
        medications: medications.value,
        reminders: reminders.value,
        meals: meals.value
      }
    } finally {
      isLoading.value = false
    }
  }

  const addBloodPressure = async input => {
    const values = normalizeBloodPressure(input)
    const { client, userId } = await getContext('guardar una medición')
    const { data, error } = await client
      .from('blood_pressure_records')
      .insert({ ...values, user_id: userId })
      .select(recordColumns)
      .single()

    if (error) {
      throw error
    }
    bloodPressureRecords.value.unshift(data)
    return data
  }

  const updateBloodPressure = async (id, input) => {
    const { client, userId } = await getContext('actualizar una medición')
    const current = bloodPressureRecords.value.find(record => record.id === id)
    if (!current) {
      throw new Error(
        'No se encontró la medición. Carga tus datos e inténtalo de nuevo.'
      )
    }
    const values = normalizeBloodPressure({ ...current, ...input })
    const { data, error } = await client
      .from('blood_pressure_records')
      .update(values)
      .eq('id', id)
      .eq('user_id', userId)
      .select(recordColumns)
      .single()

    if (error) {
      throw error
    }
    bloodPressureRecords.value = bloodPressureRecords.value.map(record =>
      record.id === id ? data : record
    )
    return data
  }

  const deleteBloodPressure = async id => {
    const { client, userId } = await getContext('eliminar una medición')
    const { data, error } = await client
      .from('blood_pressure_records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (error) {
      throw error
    }
    bloodPressureRecords.value = bloodPressureRecords.value.filter(
      record => record.id !== data.id
    )
  }

  const addMedication = async input => {
    const values = normalizeMedication(input)
    const { client, userId } = await getContext('agregar un medicamento')
    const { data, error } = await client
      .from('medications')
      .insert({ ...values, user_id: userId })
      .select(medicationColumns)
      .single()

    if (error) {
      throw error
    }
    medications.value.unshift(data)
    return data
  }

  const updateMedication = async (id, input) => {
    const { client, userId } = await getContext('actualizar un medicamento')
    const current = medications.value.find(medication => medication.id === id)
    if (!current) {
      throw new Error(
        'No se encontró el medicamento. Carga tus datos e inténtalo de nuevo.'
      )
    }
    const values = normalizeMedication({ ...current, ...input })
    const { data, error } = await client
      .from('medications')
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select(medicationColumns)
      .single()

    if (error) {
      throw error
    }
    medications.value = medications.value.map(medication =>
      medication.id === id ? data : medication
    )
    return data
  }

  const toggleMedication = async id => {
    const medication = medications.value.find(item => item.id === id)
    if (!medication) {
      throw new Error(
        'No se encontró el medicamento. Carga tus datos e inténtalo de nuevo.'
      )
    }
    return updateMedication(id, { active: !medication.active })
  }

  const deleteMedication = async id => {
    const { client, userId } = await getContext('eliminar un medicamento')
    const { data, error } = await client
      .from('medications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (error) {
      throw error
    }
    medications.value = medications.value.filter(item => item.id !== data.id)
  }

  const saveReminders = async input => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Las preferencias de recordatorios deben ser un objeto.')
    }
    const { client, userId } = await getContext('guardar tus recordatorios')
    const { data, error } = await client
      .from('reminder_preferences')
      .upsert(
        {
          user_id: userId,
          settings: input,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      )
      .select('settings')
      .single()

    if (error) {
      throw error
    }
    reminders.value = data.settings
    return reminders.value
  }

  const addMeal = async input => {
    const values = normalizeMeal(input)
    const { client, userId } = await getContext('guardar una comida')
    const { data, error } = await client
      .from('meal_records')
      .insert({ ...values, user_id: userId })
      .select(mealColumns)
      .single()

    if (error) {
      throw error
    }
    meals.value.unshift(data)
    return data
  }

  const updateMeal = async (id, input) => {
    const { client, userId } = await getContext('actualizar una comida')
    const current = meals.value.find(meal => meal.id === id)
    if (!current) {
      throw new Error(
        'No se encontró la comida. Carga tus datos e inténtalo de nuevo.'
      )
    }
    const values = normalizeMeal({ ...current, ...input })
    const { data, error } = await client
      .from('meal_records')
      .update(values)
      .eq('id', id)
      .eq('user_id', userId)
      .select(mealColumns)
      .single()

    if (error) {
      throw error
    }
    meals.value = meals.value.map(meal => (meal.id === id ? data : meal))
    return data
  }

  const deleteMeal = async id => {
    const { client, userId } = await getContext('eliminar una comida')
    const { data, error } = await client
      .from('meal_records')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (error) {
      throw error
    }
    meals.value = meals.value.filter(meal => meal.id !== data.id)
  }

  return {
    bloodPressureRecords,
    medications,
    meals,
    reminders,
    isLoading,
    load,
    addBloodPressure,
    updateBloodPressure,
    deleteBloodPressure,
    addMedication,
    updateMedication,
    toggleMedication,
    deleteMedication,
    saveReminders,
    addMeal,
    updateMeal,
    deleteMeal
  }
})
