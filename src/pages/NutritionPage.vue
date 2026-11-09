<template>
  <q-page class="module-page nutrition-page">
    <div class="module-content">
      <div class="page-heading">
        <div>
          <div class="page-eyebrow">DIARIO DE ALIMENTACIÓN</div>
          <h1>Alimentación</h1>
          <p
            >Registra lo que comiste y añade notas para tu seguimiento
            personal.</p
          >
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-action-custom"
          icon="add"
          label="Registrar comida"
          @click="openCreate"
        />
      </div>

      <q-banner rounded class="nutrition-note q-mb-lg">
        <template #avatar><q-icon name="info_outline" /></template>
        Este diario es una herramienta de observación personal. No ofrece
        recomendaciones alimentarias ni reemplaza la guía de tu equipo de salud.
        Los valores nutricionales son aproximados y pueden variar según el
        alimento y su preparación.
      </q-banner>

      <q-card class="estimate-card q-mb-lg">
        <q-card-section>
          <div class="list-heading">Estimación nutricional por porción</div>
          <div class="list-caption q-mb-md">
            Busca un alimento para ver una referencia estándar y registrarla
            rápidamente.
          </div>
          <q-input
            v-model="foodSearch"
            outlined
            clearable
            label="Buscar alimento"
            placeholder="Ej. mango, manzana, pollo"
            @update:model-value="onFoodSearchChange"
          >
            <template #prepend><q-icon name="search" /></template>
          </q-input>
          <div class="row items-center q-gutter-sm q-mt-sm">
            <q-btn
              outline
              rounded
              no-caps
              icon="center_focus_weak"
              label="Simular escaneo"
              class="scan-button"
              :disable="quickSaving"
              @click="simulateFoodScan"
            />
            <span class="scan-caption">
              Demostración: elige un alimento de ejemplo; no usa la cámara.
            </span>
          </div>

          <q-list
            v-if="!selectedFood && foodSearch && foodSearch.trim()"
            bordered
            separator
            class="food-results q-mt-sm"
          >
            <q-item
              v-for="food in matchingFoods"
              :key="food.id"
              clickable
              @click="selectFood(food)"
            >
              <q-item-section>
                <q-item-label>{{ food.name }}</q-item-label>
                <q-item-label caption>{{ food.serving }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" />
              </q-item-section>
            </q-item>
            <q-item v-if="!matchingFoods.length">
              <q-item-section class="text-grey-7">
                No hay coincidencias. Puedes registrar el alimento manualmente.
              </q-item-section>
            </q-item>
          </q-list>

          <div v-if="selectedFood" class="estimate-details q-mt-md">
            <q-badge
              v-if="scanWasSimulated"
              color="blue-1"
              text-color="blue-9"
              rounded
              class="q-mb-sm"
            >
              Escaneo simulado
            </q-badge>
            <div class="row items-center justify-between q-col-gutter-md">
              <div class="col">
                <div class="meal-name">{{ selectedFood.name }}</div>
                <div class="list-caption">
                  Porción de referencia: {{ selectedFood.serving }}
                </div>
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="portions"
                  type="number"
                  min="0.25"
                  max="10"
                  step="0.25"
                  label="Porciones"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="quickCategory"
                  :options="categories"
                  label="Tipo de comida"
                  outlined
                  dense
                />
              </div>
            </div>
            <div v-if="nutritionEstimate" class="estimate-nutrients q-mt-md">
              <div
                ><strong>{{ nutritionEstimate.calories }}</strong> kcal</div
              >
              <div
                ><strong>{{ nutritionEstimate.protein }}</strong> g
                proteína</div
              >
              <div>
                <strong>{{ nutritionEstimate.carbohydrates }}</strong> g
                carbohidratos
              </div>
              <div>
                <strong>{{ nutritionEstimate.potassium }}</strong> mg potasio
              </div>
            </div>
            <div class="row justify-end q-mt-md">
              <q-btn
                unelevated
                rounded
                no-caps
                icon="add"
                label="Registrar esta porción"
                class="btn-action-custom"
                :loading="quickSaving"
                :disable="!nutritionEstimate"
                @click="saveQuickFood"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card class="history-card">
        <q-card-section class="history-toolbar">
          <div>
            <div class="list-heading">Historial de comidas</div>
            <div class="list-caption"
              >{{ filteredMeals.length }} registro(s)</div
            >
          </div>
          <div class="filters">
            <q-input
              v-model="dateFilter"
              type="date"
              label="Fecha"
              outlined
              dense
              clearable
            >
              <template #prepend><q-icon name="event" /></template>
            </q-input>
            <q-select
              v-model="categoryFilter"
              :options="categoryFilters"
              label="Tipo"
              outlined
              dense
              clearable
              class="category-filter"
            />
          </div>
        </q-card-section>
        <q-separator />
        <div v-if="filteredMeals.length" class="meal-list">
          <div v-for="meal in filteredMeals" :key="meal.id" class="meal-row">
            <div class="meal-icon" aria-hidden="true">
              <q-icon :name="mealIcon(meal)" />
            </div>
            <div class="meal-main">
              <div class="meal-name">{{ meal.name }}</div>
              <div class="meal-meta">
                {{ formatDate(meal.date) }}
                <q-badge
                  v-if="meal.category"
                  color="pink-1"
                  text-color="pink-9"
                  rounded
                  >{{ meal.category }}</q-badge
                >
              </div>
              <div v-if="meal.notes" class="meal-notes">{{ meal.notes }}</div>
            </div>
            <div class="meal-nutrition">
              <span v-if="meal.calories !== null">
                {{ meal.calories }} kcal</span
              >
              <span v-if="meal.protein !== null">
                {{ meal.protein }} g proteína</span
              >
              <span v-if="meal.carbohydrates !== null">
                {{ meal.carbohydrates }} g carb.</span
              >
              <span v-if="meal.potassium !== null">
                {{ meal.potassium }} mg potasio</span
              >
            </div>
            <div class="meal-actions">
              <q-btn
                flat
                round
                dense
                icon="edit"
                class="text-pink-custom"
                aria-label="Editar comida"
                @click="openEdit(meal)"
              />
              <q-btn
                flat
                round
                dense
                icon="delete_outline"
                color="negative"
                aria-label="Eliminar comida"
                @click="removeMeal(meal)"
              />
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <q-icon class="empty-emoji" name="restaurant" aria-hidden="true" />
          <div class="empty-title">{{
            health.meals.length
              ? 'No hay comidas para esos filtros'
              : 'Aún no has registrado comidas'
          }}</div>
          <div class="empty-caption"
            >Puedes guardar el nombre, el tipo, valores opcionales y una
            nota.</div
          >
          <q-btn
            unelevated
            rounded
            no-caps
            icon="add"
            label="Registrar comida"
            class="q-mt-md btn-action-custom"
            @click="openCreate"
          />
        </div>
      </q-card>
    </div>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="form-dialog">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-dark-rose">{{
            editingId ? 'Editar comida' : 'Registrar comida'
          }}</div>
          <div class="text-caption text-grey-7"
            >Guarda solo la información que quieras llevar.</div
          >
        </q-card-section>
        <q-form class="q-px-md q-pb-md" @submit.prevent="saveMeal">
          <q-input
            v-model.trim="form.name"
            label="Nombre de la comida o alimento"
            outlined
            maxlength="120"
            autofocus
            :rules="[value => Boolean(value) || 'Escribe el nombre']"
          />
          <q-select
            v-model="form.category"
            :options="categories"
            label="Tipo de comida"
            outlined
            clearable
            class="q-mt-sm"
          />
          <q-input
            v-model="form.date"
            type="datetime-local"
            label="Fecha y hora"
            outlined
            class="q-mt-sm"
            :rules="[value => Boolean(value) || 'Selecciona la fecha']"
          />
          <div class="row q-col-gutter-md q-mt-xs">
            <div class="col-6">
              <q-input
                v-model.number="form.calories"
                type="number"
                min="0"
                label="Calorías (opcional)"
                outlined
                :rules="[
                  value =>
                    value == null ||
                    value === '' ||
                    Number(value) >= 0 ||
                    'Usa un valor igual o mayor a 0'
                ]"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="form.carbohydrates"
                type="number"
                min="0"
                label="Carbohidratos (g)"
                outlined
                :rules="[
                  value =>
                    value == null ||
                    value === '' ||
                    Number(value) >= 0 ||
                    'Usa un valor igual o mayor a 0'
                ]"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="form.protein"
                type="number"
                min="0"
                label="Proteína (g)"
                outlined
                :rules="[
                  value =>
                    value == null ||
                    value === '' ||
                    Number(value) >= 0 ||
                    'Usa un valor igual o mayor a 0'
                ]"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="form.potassium"
                type="number"
                min="0"
                label="Potasio (mg)"
                outlined
                :rules="[
                  value =>
                    value == null ||
                    value === '' ||
                    Number(value) >= 0 ||
                    'Usa un valor igual o mayor a 0'
                ]"
              />
            </div>
          </div>
          <q-input
            v-model.trim="form.notes"
            label="Notas (opcional)"
            type="textarea"
            autogrow
            maxlength="400"
            outlined
            class="q-mt-sm"
          />
          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn flat no-caps label="Cancelar" v-close-popup />
            <q-btn
              unelevated
              rounded
              no-caps
              class="btn-action-custom"
              type="submit"
              :label="editingId ? 'Guardar cambios' : 'Guardar comida'"
              :loading="saving"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth.js'
import { useHealthStore } from '../stores/health.js'
import {
  estimateNutrition,
  findFoodForScan,
  searchFoods
} from '../services/nutrition.js'

const $q = useQuasar()
const auth = useAuthStore()
const health = useHealthStore()
const dialogOpen = ref(false)
const saving = ref(false)
const quickSaving = ref(false)
const editingId = ref(null)
const dateFilter = ref('')
const categoryFilter = ref(null)
const foodSearch = ref('')
const selectedFood = ref(null)
const scanWasSimulated = ref(false)
const portions = ref(1)
const quickCategory = ref('Otro')
const categories = ['Desayuno', 'Almuerzo', 'Cena', 'Refrigerio', 'Otro']
const categoryFilters = categories
const form = ref({
  name: '',
  category: null,
  calories: null,
  protein: null,
  carbohydrates: null,
  potassium: null,
  notes: '',
  date: ''
})
const matchingFoods = computed(() => searchFoods(foodSearch.value).slice(0, 6))
const nutritionEstimate = computed(() => {
  const quantity = Number(portions.value)
  if (
    !selectedFood.value ||
    !Number.isFinite(quantity) ||
    quantity < 0.25 ||
    quantity > 10
  ) {
    return null
  }
  return estimateNutrition(selectedFood.value, portions.value)
})

const localDate = value => {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const filteredMeals = computed(() =>
  health.meals.filter(meal => {
    const matchesDate =
      !dateFilter.value || localDate(meal.date) === dateFilter.value
    const matchesCategory =
      !categoryFilter.value || meal.category === categoryFilter.value
    return matchesDate && matchesCategory
  })
)

const localDateTime = value => {
  const date = value ? new Date(value) : new Date()
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const formatDate = value =>
  new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))

const mealIcon = () => 'restaurant'

const selectFood = food => {
  selectedFood.value = food
  scanWasSimulated.value = false
  foodSearch.value = food.name
  portions.value = 1
}

const onFoodSearchChange = () => {
  selectedFood.value = null
  scanWasSimulated.value = false
}

const simulateFoodScan = () => {
  const query = String(foodSearch.value ?? '').trim()
  if (!query) {
    $q.notify({
      type: 'info',
      message: 'Escribe el nombre del alimento antes de simular el escaneo.',
      position: 'top'
    })
    return
  }

  const food = findFoodForScan(query)
  if (!food) {
    const matches = searchFoods(query)
    $q.notify({
      type: 'warning',
      message: matches.length
        ? 'Hay varios resultados. Selecciona el alimento correcto de la lista.'
        : 'No encontramos ese alimento en el catálogo. Prueba otro nombre o selecciónalo de la lista.',
      position: 'top'
    })
    return
  }

  selectFood(food)
  scanWasSimulated.value = true
  $q.notify({
    type: 'info',
    message: `Alimento de ejemplo seleccionado: ${food.name}. No se realizó un escaneo con cámara.`,
    position: 'top'
  })
}

const saveQuickFood = async () => {
  if (!selectedFood.value || !nutritionEstimate.value) return

  quickSaving.value = true
  try {
    await health.addMeal({
      name: selectedFood.value.name,
      category: quickCategory.value,
      ...nutritionEstimate.value,
      notes: `Estimación aproximada: ${portions.value} porción(es) de ${selectedFood.value.serving}.`,
      date: new Date().toISOString()
    })
    $q.notify({
      type: 'positive',
      message: 'Porción estimada registrada en tu diario.',
      position: 'top'
    })
    selectedFood.value = null
    foodSearch.value = ''
    portions.value = 1
    quickCategory.value = 'Otro'
  } catch (error) {
    console.error('No se pudo registrar la porción estimada:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo registrar la porción estimada.',
      position: 'top'
    })
  } finally {
    quickSaving.value = false
  }
}

const openCreate = () => {
  editingId.value = null
  form.value = {
    name: '',
    category: null,
    calories: null,
    protein: null,
    carbohydrates: null,
    potassium: null,
    notes: '',
    date: localDateTime()
  }
  dialogOpen.value = true
}

const openEdit = meal => {
  editingId.value = meal.id
  form.value = {
    name: meal.name,
    category: meal.category || null,
    calories: meal.calories,
    protein: meal.protein,
    carbohydrates: meal.carbohydrates,
    potassium: meal.potassium,
    notes: meal.notes || '',
    date: localDateTime(meal.date)
  }
  dialogOpen.value = true
}

const saveMeal = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      calories: form.value.calories === '' ? null : form.value.calories,
      protein: form.value.protein === '' ? null : form.value.protein,
      carbohydrates:
        form.value.carbohydrates === '' ? null : form.value.carbohydrates,
      potassium: form.value.potassium === '' ? null : form.value.potassium
    }
    if (editingId.value) {
      await health.updateMeal(editingId.value, payload)
    } else {
      await health.addMeal(payload)
    }
    dialogOpen.value = false
    $q.notify({
      type: 'positive',
      message: 'Comida guardada.',
      position: 'top'
    })
  } catch (error) {
    console.error('No se pudo guardar la comida:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo guardar la comida.',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

const removeMeal = meal => {
  $q.dialog({
    title: 'Eliminar comida',
    message: `¿Quieres eliminar “${meal.name}” de tu diario?`,
    cancel: { flat: true, label: 'Cancelar', noCaps: true },
    ok: { color: 'negative', label: 'Eliminar', noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await health.deleteMeal(meal.id)
      $q.notify({
        type: 'positive',
        message: 'Comida eliminada.',
        position: 'top'
      })
    } catch (error) {
      console.error('No se pudo eliminar la comida:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'No se pudo eliminar la comida.',
        position: 'top'
      })
    }
  })
}

onMounted(async () => {
  try {
    await auth.initialize()
    await health.load()
  } catch (error) {
    console.error('No se pudo cargar el diario de alimentación:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo cargar tu diario.',
      position: 'top'
    })
  }
})
</script>

<style scoped>
.module-page {
  min-height: calc(100vh - 116px);
  padding: 28px 24px 48px;
  background-color: #fdf8f8;
}

.module-content {
  width: min(1050px, 100%);
  margin: 0 auto;
}

.page-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 20px;
}

.page-eyebrow {
  color: #d86b7a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.page-heading h1 {
  margin: 6px 0 5px;
  color: #3a2226;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
}

.page-heading p {
  margin: 0;
  color: #8c6e73;
  font-size: 12px;
}

.nutrition-note {
  color: #8c4c55;
  background: #fdf0f2;
  border: 1px solid #f9d8dd;
  font-size: 12px;
  line-height: 1.6;
}

.estimate-card {
  border: 1px solid #f7e2e5;
  border-radius: 19px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(216, 107, 122, 0.04);
}

.food-results {
  overflow: hidden;
  border-color: #f7e2e5;
  border-radius: 12px;
}

.scan-button {
  color: #a64e5b;
  border-color: #d86b7a;
}

.scan-caption {
  color: #8c6e73;
  font-size: 11px;
}

.estimate-details {
  padding: 16px;
  border: 1px solid #f7e2e5;
  border-radius: 14px;
  background: #fdf8f8;
}

.estimate-nutrients {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  color: #8c6e73;
  font-size: 11px;
}

.estimate-nutrients > div {
  padding: 10px;
  border-radius: 10px;
  background: #fff;
}

.estimate-nutrients strong {
  color: #3a2226;
}

.history-card {
  overflow: hidden;
  border: 1px solid #f7e2e5;
  border-radius: 19px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(216, 107, 122, 0.04);
}

.history-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 19px 22px;
}

.list-heading {
  color: #3a2226;
  font-size: 15px;
  font-weight: 700;
}

.list-caption {
  margin-top: 4px;
  color: #a38287;
  font-size: 10px;
}

.filters {
  display: flex;
  gap: 10px;
}

.filters .q-input {
  width: 170px;
}

.category-filter {
  width: 145px;
}

.meal-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 20px;
  border-bottom: 1px solid #faeaec;
}

.meal-row:last-child {
  border-bottom: 0;
}

.meal-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  color: #c05867;
  background: #fbe3e6;
  font-size: 19px;
}

.meal-main {
  min-width: 0;
  flex: 1;
}

.meal-name {
  color: #3a2226;
  font-size: 13px;
  font-weight: 700;
}

.meal-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
  color: #8c6e73;
  font-size: 10px;
}

.meal-notes {
  margin-top: 6px;
  color: #8c6e73;
  font-size: 10px;
  line-height: 1.5;
}

.meal-nutrition {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #a38287;
  font-size: 10px;
  white-space: nowrap;
}

.meal-actions {
  flex: 0 0 auto;
}

.empty-state {
  display: flex;
  min-height: 260px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25px;
  text-align: center;
}

.empty-state > .q-icon {
  color: #d86b7a;
  font-size: 32px;
}

.empty-title {
  margin-top: 12px;
  color: #3a2226;
  font-size: 15px;
  font-weight: 700;
}

.empty-caption {
  margin-top: 5px;
  color: #8c6e73;
  font-size: 11px;
}

.form-dialog {
  width: min(500px, 100%);
  border-radius: 20px;
}

.btn-action-custom {
  background-color: #d86b7a;
  color: #fff;
  font-weight: 600;
}

.btn-action-custom:hover {
  background-color: #c05867;
}

.text-pink-custom {
  color: #d86b7a;
}

.text-dark-rose {
  color: #3a2226;
}

@media (max-width: 700px) {
  .module-page {
    padding: 19px 14px 32px;
  }

  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-toolbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px;
  }

  .filters {
    width: 100%;
  }

  .filters .q-input {
    min-width: 0;
    flex: 1;
  }

  .meal-row {
    align-items: flex-start;
    gap: 10px;
    padding: 13px;
  }

  .meal-nutrition {
    display: none;
  }

  .meal-actions {
    display: flex;
    flex-direction: column;
  }
}
</style>
