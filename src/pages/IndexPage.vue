<template>
  <q-page class="dashboard-page">
    <div class="dashboard-content">
      <div class="row items-center justify-between q-mb-xl page-heading">
        <div>
          <div class="heading-kicker">TU SALUD, EN EQUILIBRIO</div>
          <div class="text-h4 text-weight-bold page-title">Glucemia</div>
          <div class="text-subtitle1 heading-subtitle">
            Registra tus niveles y consulta tu historial.
          </div>
        </div>
        <div class="row q-gutter-sm heading-actions">
          <q-btn
            unelevated
            rounded
            no-caps
            class="btn-action-custom q-mt-sm"
            icon="add"
            label="Registrar lectura"
            @click="openNewRecord"
          />
          <q-btn
            outline
            rounded
            no-caps
            class="bluetooth-action q-mt-sm"
            :icon="
              bluetoothConnected ? 'bluetooth_connected' : 'bluetooth_searching'
            "
            :label="
              bluetoothConnected ? 'Desconectar sensor' : 'Conectar glucómetro'
            "
            :disable="
              (!bluetoothAvailable && !bluetoothConnected) || bluetoothLoading
            "
            :loading="bluetoothLoading"
            @click="toggleBluetooth"
          />
        </div>
      </div>
      <div class="bluetooth-hint q-mb-lg">
        Solo se muestran medidores que anuncian el perfil estándar BLE de
        glucosa; los teléfonos y dispositivos incompatibles quedan excluidos.
        Vitalia guarda la última lectura y las nuevas notificaciones que envíe
        el sensor mientras siga conectado y la página esté abierta. Web
        Bluetooth funciona en Chrome para Android, pero no en Safari para
        iPhone/iPad.
      </div>
      <q-banner
        v-if="bluetoothConnected"
        rounded
        class="bluetooth-status q-mb-lg"
      >
        <template #avatar><q-icon name="bluetooth_connected" /></template>
        Conectado a {{ bluetoothDeviceName }}. Las lecturas compatibles se
        guardan automáticamente.
      </q-banner>

      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-4">
          <q-card class="summary-card">
            <q-card-section>
              <div class="row items-center justify-between">
                <div>
                  <div class="summary-label">Última lectura</div>
                  <div v-if="latestRecord" class="summary-value">
                    {{ latestRecord.val }} <span>mg/dL</span>
                  </div>
                  <div v-else class="summary-empty">Sin mediciones</div>
                </div>
                <q-avatar class="kpi-icon kpi-icon-primary" aria-hidden="true">
                  <q-icon name="opacity" />
                </q-avatar>
              </div>
              <q-badge
                v-if="latestRecord"
                :color="statusColor(latestRecord.status)"
                class="q-mt-sm"
                rounded
              >
                {{ statusLabel(latestRecord.status) }}
              </q-badge>
              <div v-else class="text-caption text-grey-6 q-mt-sm"
                >Registra tu primera lectura</div
              >
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="summary-card">
            <q-card-section>
              <div class="row items-center justify-between">
                <div>
                  <div class="summary-label">Promedio de hoy</div>
                  <div v-if="todayAverage !== null" class="summary-value">
                    {{ todayAverage }} <span>mg/dL</span>
                  </div>
                  <div v-else class="summary-empty">Sin lecturas hoy</div>
                </div>
                <q-avatar class="kpi-icon kpi-icon-accent" aria-hidden="true">
                  <q-icon name="show_chart" />
                </q-avatar>
              </div>
              <div class="text-caption text-grey-6 q-mt-sm"
                >Calculado con tus mediciones de hoy</div
              >
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="summary-card">
            <q-card-section>
              <div class="row items-center justify-between">
                <div>
                  <div class="summary-label">Registros totales</div>
                  <div class="summary-value">{{
                    glucose.userRecords.length
                  }}</div>
                </div>
                <q-avatar class="kpi-icon kpi-icon-positive" aria-hidden="true">
                  <q-icon name="assignment" />
                </q-avatar>
              </div>
              <div class="text-caption text-grey-6 q-mt-sm"
                >Tu historial personal</div
              >
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card class="history-card">
        <q-card-section
          class="row items-center justify-between q-col-gutter-md"
        >
          <div class="col-12 col-md history-heading">
            <div class="text-h6 text-weight-bold page-title"
              >Historial de mediciones</div
            >
            <div class="text-caption text-grey-6"
              >Tus lecturas, organizadas en un solo lugar</div
            >
          </div>
          <div class="col-12 col-md-3">
            <q-input
              v-model="dateFilter"
              type="date"
              label="Filtrar por fecha"
              outlined
              dense
              clearable
            >
              <template #prepend><q-icon name="event" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="momentFilter"
              :options="momentFilterOptions"
              label="Filtrar por momento"
              outlined
              dense
              clearable
              emit-value
              map-options
            />
          </div>
        </q-card-section>

        <q-table
          :rows="filteredRecords"
          :columns="columns"
          row-key="id"
          flat
          :loading="glucose.isLoading"
          :pagination="{ rowsPerPage: 8 }"
          no-data-label="Aún no tienes mediciones registradas."
          no-results-label="No hay mediciones que coincidan con los filtros."
          class="history-table"
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.row.status)" rounded>
                {{ statusLabel(props.row.status) }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-date="props">
            <q-td :props="props">{{ formatDate(props.row.date) }}</q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                dense
                class="text-pink-custom"
                icon="edit"
                aria-label="Editar medición"
                @click="openEditRecord(props.row)"
              />
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete_outline"
                aria-label="Eliminar medición"
                @click="removeRecord(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card>
    </div>

    <q-dialog v-model="formOpen" persistent>
      <q-card class="measurement-dialog">
        <q-card-section>
          <div class="text-h6 text-weight-bold page-title">
            {{ editingId ? 'Editar medición' : 'Registrar medición' }}
          </div>
          <div class="text-caption text-grey-7"
            >Anota tu lectura para mantener tu historial al día.</div
          >
        </q-card-section>

        <q-form class="q-px-md q-pb-md" @submit.prevent="saveRecord">
          <q-input
            v-model.number="form.val"
            type="number"
            label="Glucemia (mg/dL)"
            min="1"
            outlined
            autofocus
            :rules="[
              value =>
                (Number.isFinite(Number(value)) && Number(value) > 0) ||
                'Ingresa un valor mayor que cero'
            ]"
          >
            <template #prepend
              ><q-icon name="opacity" class="text-pink-custom"
            /></template>
          </q-input>
          <q-select
            v-model="form.moment"
            :options="momentOptions"
            label="Momento de la medición"
            outlined
            class="q-mt-md"
            :rules="[value => Boolean(value) || 'Selecciona un momento']"
          >
            <template #prepend
              ><q-icon name="schedule" class="text-pink-custom"
            /></template>
          </q-select>
          <div class="row justify-end q-gutter-sm q-mt-lg">
            <q-btn v-close-popup flat label="Cancelar" color="grey-8" />
            <q-btn
              type="submit"
              unelevated
              rounded
              no-caps
              class="btn-action-custom"
              label="Guardar"
              :loading="saving"
            />
          </div>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import {
  automaticGlucoseMoment,
  glucoseMoments,
  useGlucoseStore
} from '../stores/glucose.js'
import { useAuthStore } from '../stores/auth.js'
import { connectGlucoseBluetooth } from '../services/glucoseBluetooth.js'

const $q = useQuasar()
const glucose = useGlucoseStore()
const auth = useAuthStore()
const momentOptions = glucoseMoments
const momentFilterOptions = [...glucoseMoments, automaticGlucoseMoment]
const dateFilter = ref('')
const momentFilter = ref(null)
const formOpen = ref(false)
const saving = ref(false)
const bluetoothLoading = ref(false)
const bluetoothConnected = ref(false)
const bluetoothDeviceName = ref('')
const editingId = ref(null)
let bluetoothSession = null
const savedBluetoothReadings = new Set()
const form = reactive({ val: null, moment: glucoseMoments[0] })
const bluetoothAvailable = computed(
  () =>
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.bluetooth)
)
const columns = [
  {
    name: 'val',
    label: 'Glucemia',
    field: 'val',
    align: 'left',
    sortable: true,
    format: value => `${value} mg/dL`
  },
  {
    name: 'moment',
    label: 'Momento',
    field: 'moment',
    align: 'left',
    sortable: true
  },
  {
    name: 'date',
    label: 'Fecha y hora',
    field: 'date',
    align: 'left',
    sortable: true
  },
  { name: 'status', label: 'Estado', field: 'status', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' }
]

onMounted(async () => {
  try {
    await auth.initialize()
    const migratedCount = await glucose.fetchRecords()
    if (migratedCount) {
      $q.notify({
        type: 'positive',
        message: 'Tu historial anterior se sincronizó con tu cuenta.',
        position: 'top'
      })
    }
  } catch (error) {
    console.error('No se pudieron cargar las mediciones de Vitalia:', error)
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar tus mediciones. Intenta de nuevo.',
      position: 'top'
    })
  }
})

onBeforeUnmount(() => {
  bluetoothSession?.disconnect()
})

const todayRecords = computed(() => {
  const today = new Date().toDateString()
  return glucose.userRecords.filter(
    record => new Date(record.date).toDateString() === today
  )
})
const latestRecord = computed(() => glucose.userRecords[0] || null)
const todayAverage = computed(() => {
  if (!todayRecords.value.length) {
    return null
  }
  const average =
    todayRecords.value.reduce((sum, record) => sum + record.val, 0) /
    todayRecords.value.length
  return Math.round(average)
})
const filteredRecords = computed(() =>
  glucose.userRecords.filter(record => {
    const matchesDate =
      !dateFilter.value || toLocalDateInput(record.date) === dateFilter.value
    const matchesMoment =
      !momentFilter.value || record.moment === momentFilter.value
    return matchesDate && matchesMoment
  })
)

const toLocalDateInput = value => {
  const date = new Date(value)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

const formatDate = value =>
  new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))

const statusColor = status =>
  ({ low: 'pink-5', normal: 'positive', high: 'negative' })[status]
const statusLabel = status =>
  ({ low: 'Bajo', normal: 'Normal', high: 'Elevado' })[status]

const openNewRecord = () => {
  editingId.value = null
  form.val = null
  form.moment = glucoseMoments[0]
  formOpen.value = true
}

const saveBluetoothReading = async reading => {
  const readingDate = reading.measuredAt || new Date().toISOString()
  const fingerprint = `${reading.deviceName}:${reading.sequenceNumber}:${reading.measuredAt || reading.val}`
  if (savedBluetoothReadings.has(fingerprint)) return

  const alreadySaved = glucose.userRecords.some(
    record =>
      Number(record.val) === reading.val &&
      new Date(record.date).getTime() === new Date(readingDate).getTime()
  )
  savedBluetoothReadings.add(fingerprint)
  if (alreadySaved) return

  try {
    await glucose.addRecord({
      val: reading.val,
      moment: automaticGlucoseMoment,
      date: readingDate
    })
    $q.notify({
      type: 'positive',
      message: `${reading.deviceName}: ${reading.val} mg/dL guardados automáticamente.`,
      position: 'top'
    })
  } catch (error) {
    savedBluetoothReadings.delete(fingerprint)
    throw error
  }
}

const disconnectBluetooth = () => {
  bluetoothSession?.disconnect()
  bluetoothSession = null
  bluetoothConnected.value = false
  bluetoothDeviceName.value = ''
}

const toggleBluetooth = async () => {
  if (bluetoothConnected.value) {
    disconnectBluetooth()
    return
  }

  bluetoothLoading.value = true
  try {
    bluetoothSession = await connectGlucoseBluetooth({
      onMeasurement: saveBluetoothReading,
      onError: error =>
        $q.notify({
          type: 'negative',
          message: error.message || 'No se pudo leer el glucómetro.',
          position: 'top'
        }),
      onDisconnect: error => {
        bluetoothSession = null
        bluetoothConnected.value = false
        bluetoothDeviceName.value = ''
        if (error) {
          $q.notify({
            type: 'warning',
            message: error.message,
            position: 'top'
          })
        }
      }
    })
    bluetoothDeviceName.value = bluetoothSession.deviceName
    bluetoothConnected.value = true
    $q.notify({
      type: 'positive',
      message: `Conectado a ${bluetoothDeviceName.value}.`,
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo conectar con el glucómetro.',
      position: 'top'
    })
  } finally {
    bluetoothLoading.value = false
  }
}

const openEditRecord = record => {
  editingId.value = record.id
  form.val = record.val
  form.moment = record.moment
  formOpen.value = true
}

const saveRecord = async () => {
  saving.value = true
  try {
    if (editingId.value) {
      await glucose.updateRecord(editingId.value, form)
    } else {
      await glucose.addRecord(form)
    }
    formOpen.value = false
    $q.notify({
      type: 'positive',
      message: 'Medición guardada correctamente.',
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la medición.',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

const removeRecord = async record => {
  try {
    await glucose.deleteRecord(record.id)
    $q.notify({
      type: 'positive',
      message: 'Medición eliminada.',
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar la medición.',
      position: 'top'
    })
  }
}
</script>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 50px);
  padding: 40px 30px 56px;
  background-color: #fdf8f8;
}

.dashboard-content {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
}

.page-heading {
  min-height: 100px;
  align-content: center;
  padding: 8px 0 16px;
}

.heading-kicker {
  margin-bottom: 8px;
  color: #d86b7a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.page-title {
  color: #3a2226;
  letter-spacing: -0.025em;
}

.heading-subtitle {
  margin-top: 5px;
  color: #8c6e73;
  font-size: 14px;
}

.summary-card,
.history-card {
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(216, 107, 122, 0.045);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.summary-card {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.summary-card::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #d86b7a, #c05867);
  content: '';
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 13px 30px rgba(216, 107, 122, 0.08);
}

.summary-card :deep(.q-card__section) {
  padding: 22px 23px;
}

.summary-label {
  color: #8c6e73;
  font-size: 12px;
  font-weight: 500;
}

.summary-value {
  margin-top: 7px;
  color: #3a2226;
  font-size: 29px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.summary-value span {
  color: #a38287;
  font-size: 13px;
  font-weight: 400;
}

.summary-empty {
  margin-top: 11px;
  color: #a38287;
  font-size: 16px;
}

.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  font-size: 19px;
}

.kpi-icon-primary {
  color: #c05867;
  background: #fbe3e6;
}

.kpi-icon-accent {
  color: #d86b7a;
  background: #fdf0f2;
}

.kpi-icon-positive {
  color: #c05867;
  background: #fbe3e6;
}

.history-card {
  overflow: hidden;
}

.history-heading {
  padding-bottom: 12px;
}

.history-card :deep(.q-card__section:first-child) {
  padding: 24px 24px 16px;
}

.history-table :deep(thead tr) {
  background: #fdf0f2;
  color: #8c4c55;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.history-table :deep(tbody td) {
  height: 58px;
  border-color: #faeaec;
  color: #3a2226;
  font-size: 13px;
}

.history-table :deep(tbody tr:hover) {
  background: #fdf8f8;
}

.measurement-dialog {
  width: min(440px, 95vw);
  border: 1px solid #f7e2e5;
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(216, 107, 122, 0.16);
}

.btn-action-custom {
  background-color: #d86b7a;
  color: #fff;
  font-weight: 600;
}

.btn-action-custom:hover {
  background-color: #c05867;
}

.bluetooth-action {
  color: #a64e5b;
  border-color: #d86b7a;
}

.bluetooth-hint {
  color: #8c6e73;
  font-size: 12px;
}

.bluetooth-status {
  color: #8c4c55;
  background: #fdf0f2;
  border: 1px solid #f9d8dd;
  font-size: 12px;
}

.text-pink-custom {
  color: #d86b7a;
}

@media (max-width: 600px) {
  .dashboard-page {
    padding: 27px 15px 40px;
  }

  .page-title {
    font-size: 24px;
  }

  .page-heading {
    margin-bottom: 20px;
    align-items: flex-start;
  }

  .heading-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .heading-actions :deep(.q-btn) {
    flex: 1 1 100%;
  }

  .summary-card :deep(.q-card__section) {
    padding: 18px;
  }

  .history-card :deep(.q-card__section:first-child) {
    padding: 20px 17px 12px;
  }
}
</style>
