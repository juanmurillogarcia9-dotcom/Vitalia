<template>
  <q-page class="module-page profile-page">
    <div class="module-content">
      <div class="page-heading">
        <div>
          <div class="page-eyebrow">TU CUENTA PERSONAL</div>
          <h1>Mi perfil</h1>
          <p>Administra la información básica asociada a tu cuenta.</p>
        </div>
      </div>

      <div class="profile-layout">
        <q-card class="profile-card">
          <q-card-section class="profile-cover">
            <q-avatar size="76px" class="profile-avatar">
              {{ firstLetter }}
            </q-avatar>
            <div class="profile-name">{{ auth.currentUser?.name }}</div>
            <div class="profile-email">{{ auth.currentUser?.email }}</div>
          </q-card-section>
          <q-card-section class="profile-form-section">
            <div class="section-title">Información personal</div>
            <q-form class="q-gutter-md q-mt-md" @submit.prevent="saveProfile">
              <q-input
                v-model.trim="form.name"
                label="Nombre completo"
                autocomplete="name"
                outlined
                :rules="[value => Boolean(value) || 'Escribe tu nombre']"
              >
                <template #prepend><q-icon name="person_outline" /></template>
              </q-input>
              <q-input
                v-model.number="form.age"
                label="Edad"
                type="number"
                min="1"
                max="120"
                outlined
                :rules="[
                  value =>
                    (Number.isInteger(Number(value)) &&
                      Number(value) >= 1 &&
                      Number(value) <= 120) ||
                    'Ingresa una edad entre 1 y 120'
                ]"
              >
                <template #prepend><q-icon name="calendar_today" /></template>
              </q-input>
              <q-input
                :model-value="auth.currentUser?.email || ''"
                label="Correo electrónico"
                type="email"
                outlined
                readonly
                hint="El correo identifica tu cuenta y no puede modificarse aquí."
              >
                <template #prepend><q-icon name="email" /></template>
              </q-input>
              <div class="row justify-end">
                <q-btn
                  unelevated
                  rounded
                  no-caps
                  class="btn-action-custom"
                  icon="check"
                  label="Guardar perfil"
                  type="submit"
                  :loading="saving"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <div class="profile-aside">
          <q-card class="account-card">
            <q-card-section>
              <div class="aside-icon" aria-hidden="true">
                <q-icon name="lock" />
              </div>
              <div class="aside-title">Seguridad de la cuenta</div>
              <p
                >Si necesitas cambiar tu contraseña, solicita un enlace de
                recuperación para tu correo.</p
              >
              <q-btn
                flat
                no-caps
                class="text-pink-custom text-weight-bold"
                label="Enviar enlace de recuperación"
                icon-right="arrow_forward"
                :loading="recovering"
                @click="sendRecoveryLink"
              />
            </q-card-section>
          </q-card>
          <q-card class="account-card">
            <q-card-section>
              <div class="aside-icon aside-rose" aria-hidden="true">
                <q-icon name="cloud_done" />
              </div>
              <div class="aside-title">Tus datos sincronizados</div>
              <p
                >Tu historial personal se asocia a esta cuenta y puedes
                consultarlo al iniciar sesión en otro dispositivo.</p
              >
              <q-btn
                flat
                no-caps
                class="text-pink-custom text-weight-bold"
                label="Ver mis reportes"
                icon-right="arrow_forward"
                to="/reports"
              />
            </q-card-section>
          </q-card>
          <q-card class="privacy-note">
            <q-card-section>
              <q-icon name="verified_user" />
              <span>Recuerda cerrar sesión si compartes este dispositivo.</span>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="profile-shortcuts">
        <div class="section-title">Accesos rápidos</div>
        <div class="shortcut-grid">
          <q-btn outline no-caps label="Recordatorios" to="/reminders" class="btn-shortcut" />
          <q-btn outline no-caps label="Educación" to="/education" class="btn-shortcut" />
          <q-btn outline no-caps label="Alimentación" to="/nutrition" class="btn-shortcut" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth.js'

const $q = useQuasar()
const auth = useAuthStore()
const saving = ref(false)
const recovering = ref(false)
const form = reactive({ name: '', age: null })
const firstLetter = computed(
  () => auth.currentUser?.name?.slice(0, 1).toUpperCase() || 'V'
)

const saveProfile = async () => {
  saving.value = true
  try {
    await auth.updateProfile(form)
    $q.notify({
      type: 'positive',
      message: 'Tu perfil se actualizó correctamente.',
      position: 'top'
    })
  } catch (error) {
    console.error('No se pudo actualizar el perfil:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo actualizar tu perfil.',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

const sendRecoveryLink = async () => {
  recovering.value = true
  try {
    await auth.requestPasswordReset(auth.currentUser?.email || '')
    $q.notify({
      type: 'positive',
      message:
        'Si el correo está registrado, recibirás un enlace para cambiar tu contraseña.',
      timeout: 7000,
      position: 'top'
    })
  } catch (error) {
    console.error('No se pudo enviar el enlace de recuperación:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo enviar el enlace.',
      position: 'top'
    })
  } finally {
    recovering.value = false
  }
}

onMounted(async () => {
  try {
    await auth.initialize()
  } catch (error) {
    console.error('No se pudo cargar el perfil:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'No se pudo cargar tu perfil.',
      position: 'top'
    })
  }
  form.name = auth.currentUser?.name || ''
  form.age = auth.currentUser?.age || null
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

.profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(260px, 0.8fr);
  align-items: start;
  gap: 16px;
}

.profile-card,
.account-card,
.privacy-note {
  border: 1px solid #f7e2e5;
  border-radius: 19px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(216, 107, 122, 0.04);
}

.profile-cover {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 27px 22px 23px;
  border-radius: 18px 18px 0 0;
  background: linear-gradient(130deg, #fde8eb, #faf0e6);
}

.profile-avatar {
  color: #fff;
  background: #d86b7a;
  font-size: 27px;
  font-weight: 700;
}

.profile-name {
  margin-top: 12px;
  color: #3a2226;
  font-size: 18px;
  font-weight: 700;
}

.profile-email {
  margin-top: 4px;
  color: #8c6e73;
  font-size: 11px;
}

.profile-form-section {
  padding: 22px 26px 26px;
}

.section-title {
  color: #3a2226;
  font-size: 14px;
  font-weight: 700;
}

.profile-aside {
  display: grid;
  gap: 13px;
}

.aside-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  margin-bottom: 12px;
  border-radius: 12px;
  color: #8173a0;
  background: #efebf7;
  font-size: 20px;
}

.aside-rose {
  color: #c05867;
  background: #fbe3e6;
}

.aside-title {
  color: #3a2226;
  font-size: 13px;
  font-weight: 700;
}

.account-card p {
  margin: 7px 0 9px;
  color: #8c6e73;
  font-size: 10px;
  line-height: 1.6;
}

.privacy-note .q-card__section {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8c6e73;
  font-size: 10px;
  line-height: 1.5;
}

.privacy-note .q-icon {
  color: #d86b7a;
}

.profile-shortcuts {
  margin-top: 23px;
}

.shortcut-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.btn-shortcut {
  border-color: #f7e2e5 !important;
  border-radius: 12px;
  color: #c05867 !important;
  background: #fff;
}

.btn-shortcut:hover {
  background: #fdf0f2;
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
  .module-page {
    padding: 19px 14px 32px;
  }

  .profile-layout {
    grid-template-columns: 1fr;
  }

  .profile-form-section {
    padding: 18px;
  }

  .profile-aside {
    grid-template-columns: 1fr;
  }
}
</style>
