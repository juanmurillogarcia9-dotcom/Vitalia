<template>
  <q-page class="module-page reports-page">
    <div class="module-content">
      <div class="page-heading">
        <div>
          <div class="page-eyebrow">TU HISTORIAL EN PERSPECTIVA</div>
          <h1>Mis registros</h1>
          <p>Consulta tus tendencias y descarga una copia de tus registros.</p>
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-action-custom"
          icon="download"
          label="Exportar CSV"
          :disable="!hasData"
          @click="exportCsv"
        />
      </div>

      <div class="stats-grid">
        <q-card class="stat-card">
          <q-card-section>
            <div class="stat-icon rose" aria-hidden="true">
              <q-icon name="opacity" />
            </div>
            <div class="stat-label">Lecturas de glucemia</div>
            <div class="stat-value">{{ glucose.userRecords.length }}</div>
          </q-card-section>
        </q-card>
        <q-card class="stat-card">
          <q-card-section>
            <div class="stat-icon soft-rose" aria-hidden="true">
              <q-icon name="favorite_border" />
            </div>
            <div class="stat-label">Lecturas de presión</div>
            <div class="stat-value">{{
              health.bloodPressureRecords.length
            }}</div>
          </q-card-section>
        </q-card>
        <q-card class="stat-card">
          <q-card-section>
            <div class="stat-icon peach" aria-hidden="true">
              <q-icon name="restaurant" />
            </div>
            <div class="stat-label">Comidas anotadas</div>
            <div class="stat-value">{{ health.meals.length }}</div>
          </q-card-section>
        </q-card>
        <q-card class="stat-card">
          <q-card-section>
            <div class="stat-icon lilac" aria-hidden="true">
              <q-icon name="medication" />
            </div>
            <div class="stat-label">Medicamentos guardados</div>
            <div class="stat-value">{{ health.medications.length }}</div>
          </q-card-section>
        </q-card>
      </div>

      <q-card class="chart-card q-mt-lg">
        <q-card-section class="chart-heading">
          <div>
            <div class="chart-title">Tendencia de glucemia</div>
            <div class="chart-caption"
              >Tus últimas {{ glucoseChart.count }} lecturas registradas ·
              mg/dL</div
            >
          </div>
          <q-btn
            flat
            round
            icon="opacity"
            class="text-pink-custom"
            aria-label="Glucemia"
          />
        </q-card-section>
        <q-separator />
        <div v-if="glucoseChart.count" class="chart-container">
          <svg
            viewBox="0 0 720 230"
            role="img"
            aria-label="Gráfico de lecturas de glucemia"
          >
            <g v-for="line in glucoseChart.grid" :key="line.y">
              <line
                x1="52"
                :y1="line.y"
                x2="680"
                :y2="line.y"
                stroke="#faeaec"
                stroke-width="1"
              />
              <text
                x="43"
                :y="line.y + 4"
                text-anchor="end"
                fill="#a38287"
                font-size="10"
              >
                {{ line.value }}
              </text>
            </g>
            <polyline
              :points="glucoseChart.lines[0].points"
              fill="none"
              stroke="#d86b7a"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <g v-for="point in glucoseChart.points" :key="point.key">
              <circle
                :cx="point.x"
                :cy="point.valueY"
                r="4"
                fill="#fff"
                stroke="#d86b7a"
                stroke-width="3"
              >
                <title>{{ point.label }}: {{ point.value }} mg/dL</title>
              </circle>
              <text
                :x="point.x"
                y="207"
                text-anchor="middle"
                fill="#a38287"
                font-size="9"
              >
                {{ point.shortDate }}
              </text>
            </g>
          </svg>
        </div>
        <div v-else class="chart-empty">
          <q-icon name="show_chart" />
          <span>Registra mediciones para ver aquí tu tendencia.</span>
          <q-btn
            flat
            no-caps
            class="text-pink-custom text-weight-bold"
            label="Añadir glucemia"
            to="/glucose"
          />
        </div>
      </q-card>

      <q-card class="chart-card q-mt-md">
        <q-card-section class="chart-heading">
          <div>
            <div class="chart-title">Tendencia de presión</div>
            <div class="chart-caption"
              >Últimas {{ pressureChart.count }} lecturas · mmHg</div
            >
          </div>
          <div class="chart-legend">
            <span><i class="legend-systolic" /> Sistólica</span>
            <span><i class="legend-diastolic" /> Diastólica</span>
          </div>
        </q-card-section>
        <q-separator />
        <div v-if="pressureChart.count" class="chart-container">
          <svg
            viewBox="0 0 720 230"
            role="img"
            aria-label="Gráfico de lecturas de presión arterial"
          >
            <g v-for="line in pressureChart.grid" :key="line.y">
              <line
                x1="52"
                :y1="line.y"
                x2="680"
                :y2="line.y"
                stroke="#faeaec"
                stroke-width="1"
              />
              <text
                x="43"
                :y="line.y + 4"
                text-anchor="end"
                fill="#a38287"
                font-size="10"
              >
                {{ line.value }}
              </text>
            </g>
            <polyline
              :points="pressureChart.lines[0].points"
              fill="none"
              stroke="#c05867"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              :points="pressureChart.lines[1].points"
              fill="none"
              stroke="#8173a0"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <g v-for="point in pressureChart.points" :key="point.key">
              <circle
                :cx="point.x"
                :cy="point.systolicY"
                r="3.5"
                fill="#fff"
                stroke="#c05867"
                stroke-width="2.5"
              >
                <title>
                  {{ point.label }} · Sistólica: {{ point.systolic }} mmHg
                </title>
              </circle>
              <circle
                :cx="point.x"
                :cy="point.diastolicY"
                r="3.5"
                fill="#fff"
                stroke="#8173a0"
                stroke-width="2.5"
              >
                <title>
                  {{ point.label }} · Diastólica: {{ point.diastolic }} mmHg
                </title>
              </circle>
              <text
                :x="point.x"
                y="207"
                text-anchor="middle"
                fill="#a38287"
                font-size="9"
              >
                {{ point.shortDate }}
              </text>
            </g>
          </svg>
        </div>
        <div v-else class="chart-empty">
          <q-icon name="show_chart" />
          <span>Registra lecturas de presión para ver tu tendencia.</span>
          <q-btn
            flat
            no-caps
            class="text-pink-custom text-weight-bold"
            label="Añadir presión"
            to="/pressure"
          />
        </div>
      </q-card>

      <q-banner rounded class="report-note q-mt-md">
        <template #avatar><q-icon name="info_outline" /></template>
        Estos gráficos describen tus registros y no interpretan resultados ni
        recomiendan cambios de tratamiento. Comparte las dudas con tu equipo de
        salud.
      </q-banner>
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
const hasData = computed(
  () =>
    glucose.userRecords.length > 0 ||
    health.bloodPressureRecords.length > 0 ||
    health.meals.length > 0 ||
    health.medications.length > 0
)

const dateLabel = value =>
  new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(
    new Date(value)
  )

const buildChart = (source, values) => {
  const rows = [...source]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-10)
  if (!rows.length) return { count: 0, points: [], grid: [], lines: [] }

  const allValues = rows.flatMap(row =>
    values.map(value => Number(value.get(row)))
  )
  const low = Math.min(...allValues)
  const high = Math.max(...allValues)
  const padding = Math.max((high - low) * 0.18, 8)
  const min = low - padding
  const max = high + padding
  const yFor = value => 170 - ((value - min) / (max - min)) * 120
  const xFor = index =>
    rows.length === 1 ? 366 : 52 + (index * 628) / (rows.length - 1)
  const points = rows.map((row, index) => {
    const date = new Date(row.date)
    const point = {
      key: row.id,
      x: xFor(index),
      label: date.toLocaleString('es'),
      shortDate: dateLabel(date)
    }
    for (const series of values) {
      point[series.key] = Number(series.get(row))
      point[`${series.key}Y`] = yFor(point[series.key])
    }
    return point
  })

  const lines = values.map(value => ({
    key: value.key,
    points: points
      .map(point => `${point.x},${yFor(point[value.key])}`)
      .join(' ')
  }))
  const grid = [0, 1, 2].map(index => {
    const fraction = index / 2
    return {
      y: 170 - fraction * 120,
      value: Math.round(min + fraction * (max - min))
    }
  })

  return { count: rows.length, points, lines, grid }
}

const glucoseChart = computed(() =>
  buildChart(glucose.userRecords, [{ key: 'value', get: row => row.val }])
)
const pressureChart = computed(() =>
  buildChart(health.bloodPressureRecords, [
    { key: 'systolic', get: row => row.systolic },
    { key: 'diastolic', get: row => row.diastolic }
  ])
)

const csvCell = value => {
  let text = String(value ?? '')
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

const exportCsv = () => {
  const rows = [
    ['Tipo', 'Fecha', 'Valor', 'Momento o detalle', 'Notas'],
    ...glucose.userRecords.map(record => [
      'Glucemia',
      record.date,
      `${record.val} mg/dL`,
      record.moment,
      ''
    ]),
    ...health.bloodPressureRecords.map(record => [
      'Presión arterial',
      record.date,
      `${record.systolic}/${record.diastolic} mmHg`,
      record.pulse ? `Pulso ${record.pulse} lpm` : '',
      record.notes
    ]),
    ...health.meals.map(meal => [
      'Alimentación',
      meal.date,
      meal.name,
      meal.category,
      meal.notes
    ]),
    ...health.medications.map(medication => [
      'Medicamento',
      medication.created_at,
      medication.name,
      `${medication.dosage} ${medication.frequency}`.trim(),
      medication.notes
    ])
  ]
  const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `vitalia-reporte-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  $q.notify({
    type: 'positive',
    message: 'Tu archivo CSV se descargó.',
    position: 'top'
  })
}

onMounted(async () => {
  try {
    await auth.initialize()
  } catch (error) {
    console.error('No se pudo restaurar la sesión para el reporte:', error)
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
  const failure = results.find(result => result.status === 'rejected')
  if (failure) {
    console.error(
      'No se pudieron cargar los datos del reporte:',
      failure.reason
    )
    $q.notify({
      type: 'negative',
      message: failure.reason?.message || 'No se pudieron cargar los datos.',
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-card,
.chart-card {
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 9px 22px rgba(216, 107, 122, 0.04);
}

.stat-icon {
  display: grid;
  width: 35px;
  height: 35px;
  place-items: center;
  border-radius: 11px;
  font-size: 19px;
}

.rose {
  color: #c05867;
  background: #fbe3e6;
}
.soft-rose {
  color: #d86b7a;
  background: #fdf0f2;
}
.peach {
  color: #ac785e;
  background: #f8ece4;
}
.lilac {
  color: #8173a0;
  background: #efebf7;
}

.stat-label {
  margin-top: 12px;
  color: #8c6e73;
  font-size: 10px;
}

.stat-value {
  margin-top: 3px;
  color: #3a2226;
  font-size: 24px;
  font-weight: 700;
}

.chart-card {
  overflow: hidden;
}

.chart-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 17px 20px;
}

.chart-title {
  color: #3a2226;
  font-size: 14px;
  font-weight: 700;
}

.chart-caption {
  margin-top: 4px;
  color: #a38287;
  font-size: 10px;
}

.chart-container {
  width: 100%;
  padding: 10px 12px 0;
}

.chart-container svg {
  display: block;
  width: 100%;
  overflow: visible;
}

.chart-legend {
  display: flex;
  gap: 12px;
  color: #8c6e73;
  font-size: 9px;
}

.chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.chart-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.legend-systolic {
  background: #c05867;
}

.legend-diastolic {
  background: #8173a0;
}

.chart-empty {
  display: flex;
  min-height: 180px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: #8c6e73;
  font-size: 11px;
}

.chart-empty .q-icon {
  color: #d86b7a;
  font-size: 28px;
}

.report-note {
  color: #8c4c55;
  background: #fdf0f2;
  border: 1px solid #f9d8dd;
  font-size: 11px;
  line-height: 1.6;
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

@media (max-width: 760px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .module-page {
    padding: 19px 14px 32px;
  }

  .page-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .chart-heading {
    padding: 15px;
  }

  .chart-container {
    padding: 8px 6px 0;
  }
}
</style>
