import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from './auth.js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js'

const LEGACY_STORAGE_KEY = 'vitalia_glucose'

export const glucoseMoments = [
  'Ayunas',
  'Antes de comer',
  'Después de comer',
  'Noche'
]
export const automaticGlucoseMoment = 'Automática'

export const getGlucoseStatus = value => {
  if (value < 70) {
    return 'low'
  }
  if (value <= 140) {
    return 'normal'
  }
  return 'high'
}

export const useGlucoseStore = defineStore('glucose', () => {
  const auth = useAuthStore()
  const records = ref([])
  const isLoading = ref(false)
  const userRecords = computed(() =>
    [...records.value].sort(
      (first, second) => new Date(second.date) - new Date(first.date)
    )
  )

  const validateMeasurement = ({ val, moment }) => {
    const numericValue = Number(val)
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      throw new Error('Ingresa un valor de glucemia mayor que cero.')
    }
    if (!glucoseMoments.includes(moment) && moment !== automaticGlucoseMoment) {
      throw new Error('Selecciona un momento válido para la medición.')
    }
    if (!auth.currentUser?.id) {
      throw new Error('Inicia sesión para guardar una medición.')
    }
    if (!isSupabaseConfigured) {
      throw new Error(
        'El servicio de almacenamiento compartido no está configurado.'
      )
    }
    return numericValue
  }

  const migrateLegacyRecords = async () => {
    const user = auth.currentUser
    const migrationKey = `vitalia_glucose_migrated_${user.id}`

    if (localStorage.getItem(migrationKey)) {
      return []
    }

    const client = await getSupabase()
    const savedRecords = localStorage.getItem(LEGACY_STORAGE_KEY)
    const legacyRecords = savedRecords ? JSON.parse(savedRecords) : []
    if (!Array.isArray(legacyRecords)) {
      throw new Error('El historial local anterior no tiene un formato válido.')
    }

    const userLegacyRecords = legacyRecords.filter(
      record => record.userEmail?.toLowerCase() === user.email.toLowerCase()
    )

    if (!userLegacyRecords.length) {
      localStorage.setItem(migrationKey, 'true')
      return []
    }

    const { data, error } = await client
      .from('glucose_records')
      .insert(
        userLegacyRecords.map(record => ({
          user_id: user.id,
          val: Number(record.val),
          moment: record.moment,
          date: record.date
        }))
      )
      .select()

    if (error) {
      throw error
    }

    localStorage.setItem(migrationKey, 'true')
    localStorage.setItem(
      LEGACY_STORAGE_KEY,
      JSON.stringify(
        legacyRecords.filter(
          record => record.userEmail?.toLowerCase() !== user.email.toLowerCase()
        )
      )
    )
    return data
  }

  const fetchRecords = async () => {
    if (!auth.currentUser?.id) {
      throw new Error('Inicia sesión para consultar tus mediciones.')
    }
    if (!isSupabaseConfigured) {
      throw new Error(
        'El servicio de almacenamiento compartido no está configurado.'
      )
    }

    isLoading.value = true
    try {
      const client = await getSupabase()
      const { data, error } = await client
        .from('glucose_records')
        .select('id, user_id, val, moment, date, status')
        .eq('user_id', auth.currentUser.id)
        .order('date', { ascending: false })

      if (error) {
        throw error
      }

      records.value = data
      const importedRecords = await migrateLegacyRecords()
      if (importedRecords.length) {
        records.value = [...importedRecords, ...records.value]
      }

      return importedRecords.length
    } finally {
      isLoading.value = false
    }
  }

  const addRecord = async measurement => {
    const val = validateMeasurement(measurement)
    const client = await getSupabase()
    const { data, error } = await client
      .from('glucose_records')
      .insert({
        user_id: auth.currentUser.id,
        val,
        moment: measurement.moment,
        ...(measurement.date ? { date: measurement.date } : {})
      })
      .select('id, user_id, val, moment, date, status')
      .single()

    if (error) {
      throw error
    }
    records.value.push(data)
    return data
  }

  const updateRecord = async (id, measurement) => {
    const val = validateMeasurement(measurement)
    const client = await getSupabase()
    const { data, error } = await client
      .from('glucose_records')
      .update({ val, moment: measurement.moment })
      .eq('id', id)
      .eq('user_id', auth.currentUser.id)
      .select('id, user_id, val, moment, date, status')
      .single()

    if (error) {
      throw error
    }
    const recordIndex = records.value.findIndex(record => record.id === id)
    if (recordIndex === -1) {
      records.value.push(data)
    } else {
      records.value[recordIndex] = data
    }
    return data
  }

  const deleteRecord = async id => {
    if (!auth.currentUser?.id || !isSupabaseConfigured) {
      throw new Error('Inicia sesión para eliminar una medición.')
    }

    const client = await getSupabase()
    const { error } = await client
      .from('glucose_records')
      .delete()
      .eq('id', id)
      .eq('user_id', auth.currentUser.id)

    if (error) {
      throw error
    }
    records.value = records.value.filter(record => record.id !== id)
  }

  return {
    records,
    userRecords,
    isLoading,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord
  }
})
