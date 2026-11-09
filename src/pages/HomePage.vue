<template>
  <q-page class="home-page">
    <div class="home-content">
      <section class="welcome-banner">
        <div>
          <div class="section-eyebrow">TU ESPACIO DE BIENESTAR</div>
          <h1>Hola, {{ firstName }} <span>🌸</span></h1>
          <p>Un paso a la vez. Aquí tienes todo tu cuidado en un solo lugar.</p>
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-action-custom"
          icon="add"
          label="Registrar lectura"
          to="/glucose"
        />
      </section>

      <section class="overview-grid">
        <q-card class="overview-card glucose-overview">
          <q-card-section>
            <div class="overview-top">
              <div class="overview-icon" aria-hidden="true">💧</div>
              <q-badge
                v-if="latestGlucose"
                :color="glucoseStatusColor(latestGlucose.status)"
                rounded
                class="status-badge"
              >
                {{ glucoseStatusLabel(latestGlucose.status) }}
              </q-badge>
              <q-badge v-else color="grey-5" rounded>Sin registros</q-badge>
            </div>
            <div class="overview-label">Última glucemia</div>
            <div class="overview-number">
              {{ latestGlucose?.val ?? '—'
              }}<span v-if="latestGlucose"> mg/dL</span>
            </div>
            <div class="overview-foot">
              {{
                latestGlucose
                  ? formatDate(latestGlucose.date)
                  : 'Registra tu primera lectura'
              }}
            </div>
            <q-btn
              flat
              dense
              no-caps
              class="text-pink-custom text-weight-bold q-mt-sm"
              label="Ver historial"
              icon-right="arrow_forward"
              to="/glucose"
            />
          </q-card-section>
        </q-card>

        <q-card class="overview-card pressure-overview">
          <q-card-section>
            <div class="overview-top">
              <div class="overview-icon" aria-hidden="true">💗</div>
              <span class="overview-caption">PRESIÓN</span>
            </div>
            <div class="overview-label">Última lectura</div>
            <div class="overview-number">
              {{
                latestPressure
                  ? `${latestPressure.systolic}/${latestPressure.diastolic}`
                  : '—'
              }}
              <span v-if="latestPressure"> mmHg</span>
            </div>
            <div class="overview-foot">
              {{
                latestPressure
                  ? formatDate(
                      latestPressure.measured_at || latestPressure.date
                    )
                  : 'Registra tu presión arterial'
              }}
            </div>
            <q-btn
              flat
              dense
              no-caps
              class="text-pink-custom text-weight-bold q-mt-sm"
              label="Abrir módulo"
              icon-right="arrow_forward"
              to="/pressure"
            />
          </q-card-section>
        </q-card>

        <q-card class="overview-card medication-overview">
          <q-card-section>
            <div class="overview-top">
              <div class="overview-icon" aria-hidden="true">💊</div>
              <span class="overview-caption">TRATAMIENTO</span>
            </div>
            <div class="overview-label">Medicamentos activos</div>
            <div class="overview-number">{{ activeMedicationCount }}</div>
            <div class="overview-foot">Tu tratamiento, organizado contigo</div>
            <q-btn
              flat
              dense
              no-caps
              class="text-pink-custom text-weight-bold q-mt-sm"
              label="Ver medicamentos"
              icon-right="arrow_forward"
              to="/medications"
            />
          </q-card-section>
        </q-card>
      </section>

      <section class="modules-section">
        <div class="section-heading">
          <div>
            <div class="section-eyebrow">TU RUTINA</div>
            <h2>¿Qué te gustaría revisar?</h2>
          </div>
          <div class="desktop-caption">Tus herramientas, siempre a mano</div>
        </div>

        <div class="modules-grid">
          <q-card
            v-for="module in modules"
            :key="module.to"
            class="module-card"
            :to="module.to"
            clickable
            v-ripple
          >
            <q-card-section>
              <div class="module-icon" :class="module.tone" aria-hidden="true">
                {{ module.emoji }}
              </div>
              <div class="module-title">{{ module.title }}</div>
              <div class="module-description">{{ module.description }}</div>
              <q-icon name="arrow_forward" class="module-arrow" />
            </q-card-section>
          </q-card>
        </div>
      </section>

      <section class="daily-note">
        <div class="note-icon" aria-hidden="true">🌸</div>
        <div>
          <div class="note-title">Un recordatorio amable</div>
          <div class="note-text">
            Cada registro te ayuda a conocer mejor tu bienestar. No necesitas
            hacerlo perfecto, solo continuar.
          </div>
        </div>
        <q-btn
          flat
          round
          icon="notifications_none"
          class="text-pink-custom"
          aria-label="Configurar recordatorios"
          to="/reminders"
        />
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth.js'
import { useGlucoseStore } from '../stores/glucose.js'
import { useHealthStore } from '../stores/health.js'

const $q = useQuasar()
const auth = useAuthStore()
const glucose = useGlucoseStore()
const health = useHealthStore()
const firstName = computed(
  () => auth.currentUser?.name?.split(' ')[0] || 'bienvenida'
)
const latestGlucose = computed(() => glucose.userRecords[0])
const latestPressure = computed(() => health.bloodPressureRecords[0])
const activeMedicationCount = computed(
  () =>
    health.medications.filter(medication => medication.active !== false).length
)

const modules = [
  {
    title: 'Glucemia',
    description: 'Registra y consulta tus niveles',
    emoji: '💧',
    tone: 'tone-rose',
    to: '/glucose'
  },
  {
    title: 'Presión arterial',
    description: 'Lleva el control de tus lecturas',
    emoji: '💗',
    tone: 'tone-soft-rose',
    to: '/pressure'
  },
  {
    title: 'Medicamentos',
    description: 'Organiza tu tratamiento',
    emoji: '💊',
    tone: 'tone-lilac',
    to: '/medications'
  },
  {
    title: 'Recordatorios',
    description: 'Cuida tu rutina diaria',
    emoji: '🔔',
    tone: 'tone-amber',
    to: '/reminders'
  },
  {
    title: 'Alimentación',
    description: 'Anota tus comidas y notas',
    emoji: '🍎',
    tone: 'tone-peach',
    to: '/nutrition'
  },
  {
    title: 'Educación',
    description: 'Aprende sobre autocuidado',
    emoji: '📚',
    tone: 'tone-blue',
    to: '/education'
  },
  {
    title: 'Reportes',
    description: 'Revisa tendencias y exporta',
    emoji: '📈',
    tone: 'tone-rose',
    to: '/reports'
  },
  {
    title: 'Mi perfil',
    description: 'Consulta tus datos personales',
    emoji: '👤',
    tone: 'tone-soft-rose',
    to: '/profile'
  }
]

const glucoseStatusColor = status =>
  ({ low: 'pink-4', normal: 'positive', high: 'negative' })[status] || 'grey-7'

const glucoseStatusLabel = status =>
  ({ low: 'Bajo', normal: 'En rango', high: 'Elevado' })[status] || 'Registrado'

const formatDate = value =>
  new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))

onMounted(async () => {
  try {
    await auth.initialize()
  } catch (error) {
    console.error('No se pudo restaurar la sesión:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo validar tu sesión.',
      position: 'top'
    })
    return
  }

  const results = await Promise.allSettled([
    glucose.fetchRecords(),
    health.load()
  ])
  const failed = results.find(result => result.status === 'rejected')
  if (failed) {
    console.error('No se pudieron cargar los datos de inicio:', failed.reason)
    $q.notify({
      type: 'negative',
      message: failed.reason?.message || 'No se pudieron cargar tus datos.',
      position: 'top'
    })
  }
})
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 116px);
  padding: 28px 24px 48px;
  background-color: #fdf8f8;
}

.home-content {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.welcome-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 30px 34px;
  border: 1px solid #f7e2e5;
  border-radius: 22px;
  background: linear-gradient(110deg, #fff 0%, #fde8eb 100%);
  box-shadow: 0 12px 30px rgba(216, 107, 122, 0.05);
}

.section-eyebrow {
  color: #d86b7a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
}

.welcome-banner h1 {
  margin: 6px 0 5px;
  color: #3a2226;
  font-size: clamp(24px, 4vw, 32px);
  font-weight: 700;
  letter-spacing: -0.035em;
}

.welcome-banner h1 span {
  font-size: 22px;
}

.welcome-banner p {
  margin: 0;
  color: #8c6e73;
  font-size: 13px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 35px;
}

.overview-card {
  border: 1px solid #f7e2e5;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(216, 107, 122, 0.045);
}

.overview-card .q-card__section {
  padding: 20px 22px;
}

.overview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  margin-bottom: 15px;
}

.overview-icon,
.module-icon,
.note-icon {
  display: grid;
  place-items: center;
  border-radius: 12px;
}

.overview-icon {
  width: 36px;
  height: 36px;
  color: #c05867;
  background: #fbe3e6;
  font-size: 20px;
}

.overview-caption {
  color: #a38287;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.overview-label {
  color: #8c6e73;
  font-size: 12px;
}

.overview-number {
  margin-top: 5px;
  color: #3a2226;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.overview-number span {
  color: #a38287;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0;
}

.overview-foot {
  min-height: 18px;
  margin-top: 4px;
  color: #a38287;
  font-size: 10px;
}

.modules-section {
  margin-bottom: 28px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.section-heading h2 {
  margin: 5px 0 0;
  color: #3a2226;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.desktop-caption {
  color: #a38287;
  font-size: 11px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.module-card {
  position: relative;
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(216, 107, 122, 0.035);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.module-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(216, 107, 122, 0.09);
}

.module-card .q-card__section {
  min-height: 142px;
  padding: 16px;
}

.module-icon {
  width: 36px;
  height: 36px;
  margin-bottom: 12px;
  font-size: 19px;
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
.tone-amber {
  color: #b8864a;
  background: #faf0e1;
}
.tone-peach {
  color: #ac785e;
  background: #f8ece4;
}
.tone-blue {
  color: #63839a;
  background: #e9f1f5;
}

.module-title {
  color: #3a2226;
  font-size: 13px;
  font-weight: 700;
}

.module-description {
  margin-top: 4px;
  color: #8c6e73;
  font-size: 10px;
  line-height: 1.4;
}

.module-arrow {
  position: absolute;
  right: 14px;
  bottom: 14px;
  color: #d86b7a;
  font-size: 16px;
}

.daily-note {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 19px;
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: linear-gradient(100deg, #fdf0f2, #faf0e6);
}

.note-icon {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  color: #c05867;
  background: #fbe3e6;
  font-size: 21px;
}

.note-title {
  color: #3a2226;
  font-size: 12px;
  font-weight: 700;
}

.note-text {
  margin-top: 3px;
  color: #8c6e73;
  font-size: 11px;
  line-height: 1.5;
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

@media (max-width: 850px) {
  .modules-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .home-page {
    padding: 17px 15px 32px;
  }

  .welcome-banner {
    align-items: flex-start;
    flex-direction: column;
    padding: 22px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
    gap: 11px;
    margin-bottom: 28px;
  }

  .overview-card .q-card__section {
    padding: 15px 18px;
  }

  .overview-top {
    margin-bottom: 9px;
  }

  .overview-number {
    font-size: 25px;
  }

  .desktop-caption {
    display: none;
  }

  .modules-grid {
    gap: 10px;
  }

  .module-card .q-card__section {
    min-height: 134px;
    padding: 13px;
  }

  .daily-note {
    align-items: flex-start;
    padding: 14px;
  }
}
</style>
