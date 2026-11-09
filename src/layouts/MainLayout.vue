<template>
  <q-layout view="hHh Lpr lFf" class="main-layout-bg">
    <q-header elevated class="custom-header text-grey-9">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Abrir navegación"
          @click="drawerOpen = !drawerOpen"
          class="text-pink-custom"
        />
        <q-toolbar-title class="text-weight-bold tracking-wide text-pink-title">
          Vitalia
        </q-toolbar-title>
        <div class="gt-sm q-mr-md text-weight-medium text-grey-7">
          {{ auth.currentUser?.name }}
        </div>
        <q-btn
          flat
          round
          icon="logout"
          aria-label="Cerrar sesión"
          @click="onLogout"
          class="text-grey-7 logout-btn"
        >
          <q-tooltip>Cerrar sesión</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      show-if-above
      bordered
      :breakpoint="1024"
      :width="260"
      class="custom-drawer"
    >
      <q-list padding class="q-gutter-y-xs">
        <q-item-label
          header
          class="text-weight-bold text-uppercase text-grey-6 text-caption"
          >Menú</q-item-label
        >
        <q-item
          v-for="link in navigation"
          :key="link.to"
          v-close-popup
          clickable
          :to="link.to"
          active-class="menu-item-active"
          class="menu-item"
          @click="closeDrawerOnMobile"
        >
          <q-item-section avatar>
            <q-icon :name="link.icon" />
          </q-item-section>
          <q-item-section class="text-weight-medium">{{
            link.label
          }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useHealthStore } from '../stores/health.js'

const auth = useAuthStore()
const health = useHealthStore()
const router = useRouter()
const $q = useQuasar()
const drawerOpen = ref(false)
let reminderTimer

const navigation = [
  { label: 'Inicio', icon: 'dashboard', to: '/' },
  { label: 'Glucemia', icon: 'water_drop', to: '/glucose' },
  { label: 'Presión arterial', icon: 'favorite_border', to: '/pressure' },
  { label: 'Medicamentos', icon: 'medication', to: '/medications' },
  { label: 'Recordatorios', icon: 'notifications', to: '/reminders' },
  { label: 'Alimentación', icon: 'restaurant', to: '/nutrition' },
  { label: 'Educación', icon: 'school', to: '/education' },
  { label: 'Registros', icon: 'bar_chart', to: '/reports' },
  { label: 'Perfil', icon: 'person', to: '/profile' }
]

const closeDrawerOnMobile = () => {
  if ($q.screen.lt.md) {
    drawerOpen.value = false
  }
}

onMounted(() => {
  checkReminders()
  reminderTimer = window.setInterval(checkReminders, 30_000)
})

onBeforeUnmount(() => {
  window.clearInterval(reminderTimer)
})

const checkReminders = () => {
  if (
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const labels = {
    glucose: 'Es momento de registrar tu glucemia.',
    pressure: 'Recuerda guardar tu lectura de presión.',
    medication: 'Consulta tu tratamiento programado.',
    meal: 'Puedes anotar tus comidas en Vitalia.'
  }

  for (const [key, reminder] of Object.entries(health.reminders)) {
    if (!reminder?.enabled || reminder.time !== currentTime || !labels[key]) {
      continue
    }

    const storageKey = `vitalia_reminder_${key}_${today}`
    try {
      if (localStorage.getItem(storageKey) === 'shown') continue
      new Notification('Vitalia', {
        body: labels[key],
        icon: '/icons/favicon-128x128.png'
      })
      localStorage.setItem(storageKey, 'shown')
    } catch (error) {
      console.error('No se pudo mostrar el recordatorio de Vitalia:', error)
    }
  }
}

const onLogout = async () => {
  try {
    await auth.logout()
    await router.replace('/login')
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error ? error.message : 'No se pudo cerrar la sesión.',
      position: 'top'
    })
  }
}
</script>

<style scoped>
/* Fondo general suave */
.main-layout-bg {
  background-color: #fcf9f9;
}

/* Barra superior limpia en blanco con borde sutil rosado y sombra fina */
.custom-header {
  background-color: #ffffff !important;
  border-bottom: 1px solid rgba(216, 107, 122, 0.15);
  box-shadow: 0 2px 12px rgba(216, 107, 122, 0.06) !important;
}

.text-pink-title {
  color: #c05867;
  letter-spacing: 0.05em;
}

.text-pink-custom {
  color: #d86b7a;
}

/* Panel lateral (Drawer) limpio */
.custom-drawer {
  background-color: #ffffff;
  border-right: 1px solid rgba(216, 107, 122, 0.1);
}

/* Elementos del menú */
.menu-item {
  color: #6e7c76;
  border-radius: 0 24px 24px 0;
  margin-right: 12px;
  margin-bottom: 4px;
  transition: all 0.2s ease;
}

.menu-item:hover {
  background-color: #fef2f4;
  color: #d86b7a;
}

/* Ítem activo del menú con toque rosa suave pero equilibrado */
.menu-item-active {
  background-color: #fbe6e9 !important;
  color: #c05867 !important;
  font-weight: 600;
}

.logout-btn:hover {
  background-color: #fef2f4;
  color: #d86b7a !important;
}
</style>
