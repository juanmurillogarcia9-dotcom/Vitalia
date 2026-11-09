<template>
  <q-page class="module-page reminders-page">
    <div class="module-content">
      <div class="page-heading">
        <div>
          <div class="page-eyebrow">PEQUEÑOS RECORDATORIOS</div>
          <h1>Recordatorios</h1>
          <p>Elige qué avisos quieres recibir y a qué hora.</p>
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-action-custom"
          icon="notifications_active"
          label="Permitir notificaciones"
          :disable="
            notificationPermission === 'granted' || !supportsNotifications
          "
          @click="requestPermission"
        />
      </div>

      <q-banner rounded class="reminder-note q-mb-lg">
        <template #avatar><q-icon name="info_outline" /></template>
        Los avisos del navegador se muestran mientras Vitalia esté abierta en
        este dispositivo. No son alarmas médicas ni se ejecutan si el navegador
        está cerrado.
      </q-banner>

      <div class="reminder-list">
        <q-card
          v-for="item in reminderTypes"
          :key="item.key"
          class="reminder-card"
        >
          <q-card-section>
            <div class="reminder-icon" :class="item.tone" aria-hidden="true">
              <q-icon :name="item.icon" />
            </div>
            <div class="reminder-copy">
              <div class="reminder-title">{{ item.title }}</div>
              <div class="reminder-description">{{ item.description }}</div>
            </div>
            <q-toggle
              v-model="settings[item.key].enabled"
              color="positive"
              :aria-label="`Activar ${item.title}`"
            />
            <q-input
              v-model="settings[item.key].time"
              type="time"
              outlined
              dense
              :disable="!settings[item.key].enabled"
              class="reminder-time"
              :aria-label="`Hora de ${item.title}`"
            />
          </q-card-section>
        </q-card>
      </div>

      <div class="save-row">
        <div class="permission-state">
          <q-icon :name="notificationIcon" />
          <span>{{ notificationMessage }}</span>
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-action-custom"
          label="Guardar preferencias"
          icon="check"
          :loading="saving"
          @click="saveSettings"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth.js'
import { useHealthStore } from '../stores/health.js'

const $q = useQuasar()
const auth = useAuthStore()
const health = useHealthStore()
const saving = ref(false)
const permission = ref(
  typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
)
const supportsNotifications = computed(() => permission.value !== 'unsupported')
const notificationPermission = computed(() => permission.value)
const settings = reactive({
  glucose: { enabled: false, time: '08:00' },
  pressure: { enabled: false, time: '09:00' },
  medication: { enabled: false, time: '12:00' },
  meal: { enabled: false, time: '19:00' }
})

const reminderTypes = [
  {
    key: 'glucose',
    title: 'Medición de glucemia',
    description: 'Un momento para registrar tu nivel',
    icon: 'opacity',
    tone: 'tone-rose'
  },
  {
    key: 'pressure',
    title: 'Presión arterial',
    description: 'Recuerda guardar tu lectura',
    icon: 'favorite_border',
    tone: 'tone-soft-rose'
  },
  {
    key: 'medication',
    title: 'Medicamentos',
    description: 'Consulta tu tratamiento programado',
    icon: 'medication',
    tone: 'tone-lilac'
  },
  {
    key: 'meal',
    title: 'Registro de alimentación',
    description: 'Anota tus comidas del día',
    icon: 'restaurant',
    tone: 'tone-peach'
  }
]

const notificationIcon = computed(() =>
  permission.value === 'granted'
    ? 'notifications_active'
    : permission.value === 'denied'
      ? 'notifications_off'
      : 'notifications_none'
)
const notificationMessage = computed(() => {
  if (permission.value === 'granted')
    return 'Las notificaciones están permitidas en este dispositivo.'
  if (permission.value === 'denied')
    return 'Las notificaciones están bloqueadas en la configuración del navegador.'
  if (permission.value === 'unsupported')
    return 'Este navegador no admite notificaciones.'
  return 'Permite las notificaciones para recibir avisos mientras usas Vitalia.'
})

const requestPermission = async () => {
  if (!supportsNotifications.value) return
  try {
    permission.value = await Notification.requestPermission()
    if (permission.value === 'granted') {
      $q.notify({
        type: 'positive',
        message: 'Notificaciones habilitadas en este dispositivo.',
        position: 'top'
      })
    } else {
      $q.notify({
        type: 'warning',
        message: 'No se concedió permiso para mostrar notificaciones.',
        position: 'top'
      })
    }
  } catch (error) {
    console.error('No se pudo solicitar permiso para notificaciones:', error)
    $q.notify({
      type: 'negative',
      message:
        error.message || 'No se pudo solicitar permiso para notificaciones.',
      position: 'top'
    })
  }
}

const saveSettings = async () => {
  saving.value = true
  try {
    await health.saveReminders(JSON.parse(JSON.stringify(settings)))
    $q.notify({
      type: 'positive',
      message: 'Preferencias de recordatorios guardadas.',
      position: 'top'
    })
  } catch (error) {
    console.error('No se pudieron guardar los recordatorios:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudieron guardar los cambios.',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    await auth.initialize()
    await health.load()
    for (const item of reminderTypes) {
      const saved = health.reminders[item.key]
      if (saved && typeof saved === 'object') {
        settings[item.key].enabled = Boolean(saved.enabled)
        settings[item.key].time = /^\d{2}:\d{2}$/.test(saved.time)
          ? saved.time
          : settings[item.key].time
      }
    }
  } catch (error) {
    console.error(
      'No se pudieron cargar las preferencias de recordatorios:',
      error
    )
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudieron cargar tus preferencias.',
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
  width: min(900px, 100%);
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

.reminder-note {
  color: #8c4c55;
  background: #fdf0f2;
  border: 1px solid #f9d8dd;
  font-size: 12px;
  line-height: 1.6;
}

.reminder-list {
  display: grid;
  gap: 12px;
}

.reminder-card {
  border: 1px solid #f7e2e5;
  border-radius: 17px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(216, 107, 122, 0.04);
}

.reminder-card .q-card__section {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 17px 20px;
}

.reminder-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 13px;
  font-size: 21px;
}

.tone-rose {
  color: #c05867;
  background: #fbe3e6;
}
.tone-soft-rose {
  color: #d86b7a;
  background: #fdf0f2;
}
.tone-lilac {
  color: #8173a0;
  background: #efebf7;
}
.tone-peach {
  color: #ac785e;
  background: #f8ece4;
}

.reminder-copy {
  flex: 1 1 auto;
}

.reminder-title {
  color: #3a2226;
  font-size: 13px;
  font-weight: 700;
}

.reminder-description {
  margin-top: 4px;
  color: #8c6e73;
  font-size: 10px;
}

.reminder-time {
  width: 125px;
  flex: 0 0 auto;
}

.save-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
}

.permission-state {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8c6e73;
  font-size: 10px;
}

.permission-state .q-icon {
  color: #d86b7a;
  font-size: 18px;
}

.btn-action-custom {
  background-color: #d86b7a;
  color: #fff;
  font-weight: 600;
}

.btn-action-custom:hover {
  background-color: #c05867;
}

@media (max-width: 650px) {
  .module-page {
    padding: 19px 14px 32px;
  }

  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .reminder-card .q-card__section {
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px;
  }

  .reminder-copy {
    min-width: calc(100% - 65px);
  }

  .reminder-time {
    margin-left: auto;
  }

  .save-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
