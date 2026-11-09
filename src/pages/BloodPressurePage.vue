<template>
  <q-page class="module-page pressure-page">
    <div class="module-content">
      <div class="module-heading">
        <div>
          <div class="page-eyebrow">SEGUIMIENTO PERSONAL</div>
          <h1>Presión arterial</h1>
          <p
            >Guarda tus lecturas y consulta tu historial cuando lo necesites.</p
          >
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-action-custom"
          icon="add"
          label="Nueva lectura"
          @click="openCreate"
        />
      </div>

      <div class="pressure-summary">
        <q-card class="summary-tile">
          <q-card-section>
            <div class="tile-icon tile-rose" aria-hidden="true">
              <q-icon name="favorite_border" />
            </div>
            <div class="tile-label">Última presión</div>
            <div class="tile-value">
              {{ latest ? `${latest.systolic}/${latest.diastolic}` : '—' }}
              <span v-if="latest">mmHg</span>
            </div>
            <div class="tile-caption">
              {{
                latest
                  ? formatDate(latest.measured_at || latest.date)
                  : 'Sin lecturas registradas'
              }}
            </div>
          </q-card-section>
        </q-card>
        <q-card class="summary-tile">
          <q-card-section>
            <div class="tile-icon tile-soft-pink" aria-hidden="true">
              <q-icon name="show_chart" />
            </div>
            <div class="tile-label">Lecturas registradas</div>
            <div class="tile-value">{{
              health.bloodPressureRecords.length
            }}</div>
            <div class="tile-caption">En tu historial personal</div>
          </q-card-section>
        </q-card>
        <q-card class="pressure-note">
          <q-card-section>
            <q-icon name="info_outline" />
            <p>
              Registra las cifras tal como aparecen en tu tensiómetro. Estos
              datos ayudan a llevar un seguimiento y no sustituyen la
              orientación de un profesional de salud.
            </p>
          </q-card-section>
        </q-card>
      </div>

      <q-card class="history-card">
        <q-card-section class="history-title">
          <div>
            <h2>Historial de lecturas</h2>
            <p>Usa el filtro para encontrar una fecha específica.</p>
          </div>
          <q-input
            v-model="dateFilter"
            type="date"
            label="Filtrar por fecha"
            outlined
            dense
            clearable
            class="date-filter"
          >
            <template #prepend><q-icon name="event" /></template>
          </q-input>
        </q-card-section>
        <q-table
          :rows="filteredRecords"
          :columns="columns"
          row-key="id"
          flat
          :loading="health.isLoading"
          :pagination="{ rowsPerPage: 8 }"
          no-data-label="Aún no tienes lecturas de presión."
          no-results-label="No hay lecturas para esta fecha."
        >
          <template #body-cell-date="props">
            <q-td :props="props">{{ formatDate(props.row.date) }}</q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                dense
                icon="edit"
                class="text-pink-custom"
                aria-label="Editar lectura"
                @click="openEdit(props.row)"
              />
              <q-btn
                flat
                round
                dense
                icon="delete_outline"
                color="negative"
                aria-label="Eliminar lectura"
                @click="removeRecord(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="form-dialog">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-dark-rose">{{
            editingId ? 'Editar lectura' : 'Registrar presión'
          }}</div>
          <div class="text-caption text-grey-7"
            >Ingresa las cifras indicadas por tu monitor.</div
          >
        </q-card-section>
        <q-form class="q-px-md q-pb-md" @submit.prevent="saveRecord">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input
                v-model.number="form.systolic"
                label="Sistólica"
                suffix="mmHg"
                type="number"
                min="50"
                max="300"
                outlined
                autofocus
                :rules="[
                  value =>
                    (Number(value) >= 50 && Number(value) <= 300) ||
                    'Ingresa un valor válido'
                ]"
              />
            </div>
            <div class="col-6">
              <q-input
                v-model.number="form.diastolic"
                label="Diastólica"
                suffix="mmHg"
                type="number"
                min="30"
                max="200"
                outlined
                :rules="[
                  value =>
                    (Number(value) >= 30 && Number(value) <= 200) ||
                    'Ingresa un valor válido'
                ]"
              />
            </div>
          </div>
          <q-input
            v-model.number="form.pulse"
            label="Pulso (opcional)"
            suffix="lpm"
            type="number"
            min="20"
            max="250"
            outlined
            clearable
            class="q-mt-sm"
            :rules="[
              value =>
                value == null ||
                value === '' ||
                (Number(value) >= 20 && Number(value) <= 250) ||
                'Ingresa un valor válido'
            ]"
          />
          <q-input
            v-model.trim="form.notes"
            label="Nota (opcional)"
            type="textarea"
            autogrow
            maxlength="300"
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
              :label="editingId ? 'Guardar cambios' : 'Guardar lectura'"
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

const $q = useQuasar()
const auth = useAuthStore()
const health = useHealthStore()
const dateFilter = ref('')
const dialogOpen = ref(false)
const saving = ref(false)
const editingId = ref(null)
const form = ref({ systolic: null, diastolic: null, pulse: null, notes: '' })
const columns = [
  {
    name: 'date',
    label: 'Fecha y hora',
    field: 'date',
    align: 'left',
    sortable: true
  },
  {
    name: 'systolic',
    label: 'Sistólica',
    field: row => `${row.systolic} mmHg`,
    align: 'left',
    sortable: true
  },
  {
    name: 'diastolic',
    label: 'Diastólica',
    field: row => `${row.diastolic} mmHg`,
    align: 'left',
    sortable: true
  },
  {
    name: 'pulse',
    label: 'Pulso',
    field: row => (row.pulse ? `${row.pulse} lpm` : '—'),
    align: 'left'
  },
  { name: 'notes', label: 'Nota', field: 'notes', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' }
]

const records = computed(() => health.bloodPressureRecords)
const latest = computed(() => records.value[0])
const localDate = value => {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}
const filteredRecords = computed(() => {
  if (!dateFilter.value) return records.value
  return records.value.filter(
    record => localDate(record.date) === dateFilter.value
  )
})

const formatDate = value =>
  value
    ? new Intl.DateTimeFormat('es', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(value))
    : 'Fecha no disponible'

const openCreate = () => {
  editingId.value = null
  form.value = { systolic: null, diastolic: null, pulse: null, notes: '' }
  dialogOpen.value = true
}

const openEdit = record => {
  editingId.value = record.id
  form.value = {
    systolic: record.systolic,
    diastolic: record.diastolic,
    pulse: record.pulse,
    notes: record.notes || ''
  }
  dialogOpen.value = true
}

const saveRecord = async () => {
  saving.value = true
  try {
    const payload = {
      systolic: Number(form.value.systolic),
      diastolic: Number(form.value.diastolic),
      pulse: form.value.pulse ? Number(form.value.pulse) : null,
      notes: form.value.notes
    }
    if (editingId.value) {
      await health.updateBloodPressure(editingId.value, payload)
    } else {
      await health.addBloodPressure(payload)
    }
    dialogOpen.value = false
    $q.notify({
      type: 'positive',
      message: 'Lectura guardada correctamente.',
      position: 'top'
    })
  } catch (error) {
    console.error('No se pudo guardar la lectura de presión:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo guardar la lectura.',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

const removeRecord = record => {
  $q.dialog({
    title: 'Eliminar lectura',
    message: '¿Quieres eliminar esta lectura del historial?',
    cancel: { flat: true, label: 'Cancelar', noCaps: true },
    ok: { color: 'negative', label: 'Eliminar', noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await health.deleteBloodPressure(record.id)
      $q.notify({
        type: 'positive',
        message: 'Lectura eliminada.',
        position: 'top'
      })
    } catch (error) {
      console.error('No se pudo eliminar la lectura:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'No se pudo eliminar la lectura.',
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
    console.error('No se pudo cargar el historial de presión:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo cargar el historial.',
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
  width: min(1120px, 100%);
  margin: 0 auto;
}

.module-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;
}

.page-eyebrow {
  color: #d86b7a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.module-heading h1 {
  margin: 6px 0 5px;
  color: #3a2226;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
  letter-spacing: -0.035em;
}

.module-heading p,
.history-title p {
  margin: 0;
  color: #8c6e73;
  font-size: 12px;
}

.pressure-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)) 1.5fr;
  gap: 14px;
  margin-bottom: 22px;
}

.summary-tile,
.pressure-note,
.history-card {
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(216, 107, 122, 0.04);
}

.tile-icon {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 11px;
  font-size: 19px;
}

.tile-rose {
  color: #c05867;
  background: #fbe3e6;
}

.tile-soft-pink {
  color: #d86b7a;
  background: #fdf0f2;
}

.tile-label {
  color: #8c6e73;
  font-size: 11px;
}

.tile-value {
  margin-top: 3px;
  color: #3a2226;
  font-size: 25px;
  font-weight: 700;
}

.tile-value span {
  color: #a38287;
  font-size: 10px;
  font-weight: 500;
}

.tile-caption {
  margin-top: 4px;
  color: #a38287;
  font-size: 10px;
}

.pressure-note .q-card__section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.pressure-note .q-icon {
  color: #c05867;
  font-size: 20px;
}

.pressure-note p {
  margin: 0;
  color: #8c6e73;
  font-size: 11px;
  line-height: 1.65;
}

.history-card {
  overflow: hidden;
}

.history-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 22px 14px;
}

.history-title h2 {
  margin: 0 0 4px;
  color: #3a2226;
  font-size: 16px;
  font-weight: 700;
}

.date-filter {
  width: min(100%, 220px);
}

.form-dialog {
  width: min(480px, 100%);
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

@media (max-width: 760px) {
  .pressure-summary {
    grid-template-columns: 1fr 1fr;
  }

  .pressure-note {
    grid-column: 1 / -1;
  }
}

@media (max-width: 560px) {
  .module-page {
    padding: 19px 14px 32px;
  }

  .module-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-title {
    align-items: flex-start;
    flex-direction: column;
    padding: 17px;
  }

  .date-filter {
    width: 100%;
  }
}
</style>
