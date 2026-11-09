<template>
  <q-page class="module-page medications-page">
    <div class="module-content">
      <div class="page-heading">
        <div>
          <div class="page-eyebrow">ORGANIZA TU TRATAMIENTO</div>
          <h1>Medicamentos</h1>
          <p
            >Ten a mano la información de tu tratamiento y marca lo que ya no
            usas.</p
          >
        </div>
        <q-btn
          unelevated
          rounded
          no-caps
          class="btn-action-custom"
          icon="add"
          label="Añadir medicamento"
          @click="openCreate"
        />
      </div>

      <q-banner rounded class="medication-info q-mb-lg">
        <template #avatar><q-icon name="info_outline" /></template>
        Usa este espacio para organizar la información indicada por tu
        profesional de salud. Vitalia no cambia ni prescribe tratamientos.
      </q-banner>

      <div class="row items-center justify-between q-mb-md">
        <div class="list-heading"
          >Mi lista <span>{{ health.medications.length }}</span></div
        >
        <q-select
          v-model="filter"
          :options="filterOptions"
          emit-value
          map-options
          outlined
          dense
          label="Mostrar"
          class="filter-select"
        />
      </div>

      <div v-if="visibleMedications.length" class="medication-grid">
        <q-card
          v-for="medication in visibleMedications"
          :key="medication.id"
          class="medication-card"
        >
          <q-card-section>
            <div class="medication-top">
              <div class="medication-icon" aria-hidden="true">
                <q-icon name="medication" />
              </div>
              <q-badge
                :color="isActive(medication) ? 'positive' : 'grey-6'"
                rounded
              >
                {{ isActive(medication) ? 'En uso' : 'Pausado' }}
              </q-badge>
              <q-space />
              <q-btn
                flat
                round
                dense
                icon="more_vert"
                aria-label="Acciones del medicamento"
              >
                <q-menu>
                  <q-list dense style="min-width: 150px">
                    <q-item
                      v-close-popup
                      clickable
                      @click="openEdit(medication)"
                    >
                      <q-item-section avatar
                        ><q-icon name="edit"
                      /></q-item-section>
                      <q-item-section>Editar</q-item-section>
                    </q-item>
                    <q-item
                      v-close-popup
                      clickable
                      @click="toggleStatus(medication)"
                    >
                      <q-item-section avatar
                        ><q-icon
                          :name="isActive(medication) ? 'pause' : 'play_arrow'"
                      /></q-item-section>
                      <q-item-section>{{
                        isActive(medication) ? 'Pausar' : 'Reactivar'
                      }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item
                      v-close-popup
                      clickable
                      class="text-negative"
                      @click="removeMedication(medication)"
                    >
                      <q-item-section avatar
                        ><q-icon name="delete_outline"
                      /></q-item-section>
                      <q-item-section>Eliminar</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
            <div class="medication-name">{{ medication.name }}</div>
            <div class="medication-dose">{{
              medication.dosage || 'Dosis no especificada'
            }}</div>
            <q-separator class="q-my-md" />
            <div class="medication-detail">
              <q-icon name="schedule" />
              <span>{{
                medication.frequency || 'Frecuencia no especificada'
              }}</span>
            </div>
            <div v-if="medication.notes" class="medication-notes">{{
              medication.notes
            }}</div>
            <q-toggle
              :model-value="isActive(medication)"
              label="En tratamiento"
              color="positive"
              class="q-mt-sm"
              @update:model-value="toggleStatus(medication)"
            />
          </q-card-section>
        </q-card>
      </div>
      <q-card v-else class="empty-card">
        <q-icon class="empty-emoji" name="medication" aria-hidden="true" />
        <div class="empty-title">{{
          filter === 'active'
            ? 'No tienes medicamentos activos'
            : 'Aún no has añadido medicamentos'
        }}</div>
        <div class="empty-caption"
          >Puedes guardar el nombre, la dosis y la frecuencia indicada.</div
        >
        <q-btn
          class="q-mt-md btn-action-custom"
          unelevated
          rounded
          no-caps
          icon="add"
          label="Añadir medicamento"
          @click="openCreate"
        />
      </q-card>
    </div>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card class="form-dialog">
        <q-card-section>
          <div class="text-h6 text-weight-bold text-dark-rose">{{
            editingId ? 'Editar medicamento' : 'Añadir medicamento'
          }}</div>
          <div class="text-caption text-grey-7"
            >Guarda los datos de tu indicación médica.</div
          >
        </q-card-section>
        <q-form class="q-px-md q-pb-md" @submit.prevent="saveMedication">
          <q-input
            v-model.trim="form.name"
            label="Nombre del medicamento"
            outlined
            autofocus
            maxlength="100"
            :rules="[value => Boolean(value) || 'Escribe el nombre']"
          />
          <q-input
            v-model.trim="form.dosage"
            label="Dosis (por ejemplo, 1 tableta)"
            outlined
            maxlength="100"
            class="q-mt-sm"
          />
          <q-input
            v-model.trim="form.frequency"
            label="Frecuencia (por ejemplo, cada 12 horas)"
            outlined
            maxlength="120"
            class="q-mt-sm"
          />
          <q-input
            v-model.trim="form.notes"
            label="Notas (opcional)"
            type="textarea"
            autogrow
            maxlength="300"
            outlined
            class="q-mt-sm"
          />
          <q-toggle
            v-model="form.active"
            label="Actualmente lo estoy usando"
            color="positive"
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
              :label="editingId ? 'Guardar cambios' : 'Guardar'"
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
const dialogOpen = ref(false)
const saving = ref(false)
const editingId = ref(null)
const filter = ref('all')
const filterOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'En uso', value: 'active' },
  { label: 'Pausados', value: 'paused' }
]
const form = ref({
  name: '',
  dosage: '',
  frequency: '',
  notes: '',
  active: true
})
const isActive = medication => medication.active !== false
const visibleMedications = computed(() => {
  if (filter.value === 'active') return health.medications.filter(isActive)
  if (filter.value === 'paused')
    return health.medications.filter(item => !isActive(item))
  return health.medications
})

const openCreate = () => {
  editingId.value = null
  form.value = { name: '', dosage: '', frequency: '', notes: '', active: true }
  dialogOpen.value = true
}

const openEdit = medication => {
  editingId.value = medication.id
  form.value = {
    name: medication.name,
    dosage: medication.dosage || '',
    frequency: medication.frequency || '',
    notes: medication.notes || '',
    active: isActive(medication)
  }
  dialogOpen.value = true
}

const saveMedication = async () => {
  saving.value = true
  try {
    if (editingId.value) {
      await health.updateMedication(editingId.value, form.value)
    } else {
      await health.addMedication(form.value)
    }
    dialogOpen.value = false
    $q.notify({
      type: 'positive',
      message: 'Medicamento guardado.',
      position: 'top'
    })
  } catch (error) {
    console.error('No se pudo guardar el medicamento:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo guardar el medicamento.',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

const toggleStatus = async medication => {
  try {
    await health.toggleMedication(medication.id)
  } catch (error) {
    console.error('No se pudo actualizar el medicamento:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo actualizar el medicamento.',
      position: 'top'
    })
  }
}

const removeMedication = medication => {
  $q.dialog({
    title: 'Eliminar medicamento',
    message: `¿Quieres eliminar ${medication.name} de tu lista?`,
    cancel: { flat: true, label: 'Cancelar', noCaps: true },
    ok: { color: 'negative', label: 'Eliminar', noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await health.deleteMedication(medication.id)
      $q.notify({
        type: 'positive',
        message: 'Medicamento eliminado.',
        position: 'top'
      })
    } catch (error) {
      console.error('No se pudo eliminar el medicamento:', error)
      $q.notify({
        type: 'negative',
        message: error.message || 'No se pudo eliminar el medicamento.',
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
    console.error('No se pudo cargar la lista de medicamentos:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo cargar la lista.',
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

.medication-info {
  color: #8c4c55;
  background: #fdf0f2;
  border: 1px solid #f9d8dd;
  font-size: 12px;
  line-height: 1.6;
}

.list-heading {
  color: #3a2226;
  font-size: 15px;
  font-weight: 700;
}

.list-heading span {
  margin-left: 5px;
  color: #a38287;
  font-size: 11px;
}

.filter-select {
  width: 140px;
}

.medication-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.medication-card,
.empty-card {
  border: 1px solid #f7e2e5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(216, 107, 122, 0.04);
}

.medication-top {
  display: flex;
  align-items: center;
  gap: 9px;
}

.medication-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  color: #c05867;
  background: #fbe3e6;
  font-size: 20px;
}

.medication-name {
  margin-top: 16px;
  color: #3a2226;
  font-size: 16px;
  font-weight: 700;
}

.medication-dose {
  margin-top: 4px;
  color: #8c6e73;
  font-size: 12px;
}

.medication-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a38287;
  font-size: 11px;
}

.medication-notes {
  margin-top: 9px;
  color: #8c6e73;
  font-size: 11px;
  line-height: 1.5;
}

.empty-card {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 25px;
  text-align: center;
}

.empty-card > .q-icon {
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

.text-dark-rose {
  color: #3a2226;
}

@media (max-width: 850px) {
  .medication-grid {
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

  .medication-grid {
    grid-template-columns: 1fr;
  }

  .filter-select {
    width: 125px;
  }
}
</style>
