<template>
  <main class="flex flex-center login-container">
    <q-card class="login-card">
      <q-card-section class="brand-panel">
        <div class="brand-panel-bg"></div>
        <div class="brand-content">
          <div class="brand-mark" aria-hidden="true">
            <q-icon name="spa" />
          </div>
          <div class="brand-title">VITALIA</div>
          <div class="brand-subtitle">BIENESTAR EN EQUILIBRIO</div>
          <div class="brand-divider" />
          <p class="brand-message">
            Un espacio sencillo y cercano para acompañar el cuidado de tu salud.
          </p>
          <div class="brand-note">
            <q-icon name="verified_user" />
            <span>Tu seguimiento, a tu ritmo</span>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="form-panel">
        <div class="form-kicker">CONTROL PERSONAL DE GLUCEMIA</div>
        <div class="form-title">
          {{
            isResetting
              ? 'Crea una nueva contraseña'
              : isRegistering
                ? 'Crea tu cuenta'
                : 'Qué gusto verte'
          }}
        </div>
        <div class="form-description">
          {{
            isResetting
              ? 'Elige una contraseña segura para volver a tu cuenta.'
              : isRegistering
                ? 'Regístrate para empezar a llevar tu seguimiento.'
                : 'Ingresa a tu espacio personal de bienestar.'
          }}
        </div>

        <q-banner
          v-if="!auth.isConfigured"
          class="setup-notice q-mb-md"
          rounded
        >
          <template #avatar>
            <q-icon name="cloud_off" color="warning" />
          </template>
          Falta conectar Supabase. Configura las variables del proyecto y
          ejecuta
          <code>supabase/schema.sql</code> para habilitar cuentas compartidas.
        </q-banner>

        <q-banner
          v-else-if="route.query.sessionError"
          class="setup-notice q-mb-md"
          rounded
        >
          No se pudo comprobar tu sesión. Intenta iniciar sesión de nuevo.
        </q-banner>

        <div
          v-if="!isRegistering && !isResetting && auth.isConfigured"
          class="login-hint"
        >
          <q-icon name="verified_user" />
          <span>
            Al iniciar sesión, tu acceso se conservará en este dispositivo. Usa
            el correo y la contraseña de tu cuenta.
          </span>
        </div>

        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input
            v-if="isRegistering && !isResetting"
            v-model.trim="name"
            label="Nombre completo"
            autocomplete="name"
            outlined
            dense
            :rules="[value => Boolean(value) || 'Escribe tu nombre']"
          >
            <template #prepend>
              <q-icon name="person" class="input-icon" />
            </template>
          </q-input>

          <q-input
            v-if="isRegistering && !isResetting"
            v-model.number="age"
            label="Edad"
            type="number"
            min="1"
            max="120"
            outlined
            dense
            :rules="[
              value =>
                (Number.isInteger(Number(value)) &&
                  Number(value) >= 1 &&
                  Number(value) <= 120) ||
                'Ingresa una edad entre 1 y 120'
            ]"
          >
            <template #prepend>
              <q-icon name="calendar_today" class="input-icon" />
            </template>
          </q-input>

          <q-input
            v-model.trim="email"
            label="Correo electrónico"
            type="email"
            autocomplete="email"
            outlined
            dense
            :readonly="isResetting"
            :rules="[
              value => Boolean(value) || 'Escribe tu correo',
              value => /.+@.+\..+/.test(value) || 'Escribe un correo válido'
            ]"
          >
            <template #prepend>
              <q-icon name="email" class="input-icon" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            :label="isResetting ? 'Nueva contraseña' : 'Contraseña'"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="
              isRegistering || isResetting ? 'new-password' : 'current-password'
            "
            outlined
            dense
            :rules="[
              value => Boolean(value) || 'Escribe tu contraseña',
              value =>
                !(isRegistering || isResetting) ||
                value.length >= 8 ||
                'Usa al menos 8 caracteres'
            ]"
          >
            <template #prepend>
              <q-icon name="lock" class="input-icon" />
            </template>
            <template #append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer input-icon-subtle"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-btn
            :label="
              isResetting
                ? 'GUARDAR NUEVA CONTRASEÑA'
                : isRegistering
                  ? 'CREAR CUENTA'
                  : 'INICIAR SESIÓN'
            "
            type="submit"
            class="full-width btn-main text-bold q-mt-lg"
            size="md"
            unelevated
            no-caps
            rounded
            :disable="!auth.isConfigured"
            :loading="isSubmitting"
          />
        </q-form>

        <div v-if="!isResetting" class="text-center q-mt-lg">
          <span class="text-grey-7">
            {{
              isRegistering
                ? '¿Ya tienes una cuenta?'
                : '¿Aún no tienes cuenta?'
            }}
          </span>
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            class="text-weight-bold q-ml-xs"
            :label="isRegistering ? 'Inicia sesión' : 'Crear cuenta'"
            @click="toggleMode"
          />
        </div>
        <div v-if="!isRegistering && !isResetting" class="text-center q-mt-sm">
          <q-btn
            flat
            dense
            no-caps
            class="recovery-link"
            label="¿Necesitas ayuda?"
            @click="onForgot"
          />
        </div>
      </q-card-section>
    </q-card>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isResetting = computed(() => route.query.recovery === '1')
const getSavedEmail = () => {
  try {
    return localStorage.getItem('vitalia_last_email') || ''
  } catch (error) {
    console.error('No se pudo restaurar el correo guardado:', error)
    return ''
  }
}

const email = ref(getSavedEmail())
const password = ref('')
const name = ref('')
const age = ref(null)
const showPassword = ref(false)
const isRegistering = ref(route.query.mode === 'register')
const isSubmitting = ref(false)

onMounted(async () => {
  try {
    await auth.initialize()
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : ''
    if (
      isRegistering.value &&
      (errorMessage.includes('rate limit') ||
        error?.code === 'over_email_send_rate_limit' ||
        error?.status === 429)
    ) {
      $q.notify({
        type: 'info',
        message:
          'Supabase agotó temporalmente el límite de correos. Para crear cuentas sin esperar el email, desactiva “Confirm email” en Authentication → Providers → Email. Revisa Authentication → Users antes de volver a registrarla: el intento anterior pudo haber creado la cuenta.',
        timeout: 10000,
        position: 'top'
      })
      return
    }

    $q.notify({
      type: 'negative',
      message:
        'No se pudo conectar con el servicio de cuentas. Inténtalo de nuevo.',
      position: 'top'
    })
    console.error('No se pudo iniciar la autenticación:', error)
  }
})

const toggleMode = () => {
  isRegistering.value = !isRegistering.value
  password.value = ''
}

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    if (isResetting.value) {
      await auth.updatePassword(password.value)
      password.value = ''
      $q.notify({
        type: 'positive',
        message: 'Contraseña actualizada. Ya puedes usar tu cuenta.',
        position: 'top'
      })
      await router.replace('/')
      return
    }

    const result = isRegistering.value
      ? await auth.register(email.value, password.value, name.value, age.value)
      : await auth.login(email.value, password.value)

    if (!result.success) {
      $q.notify({ type: 'negative', message: result.message, position: 'top' })
      return
    }

    if (result.requiresConfirmation) {
      isRegistering.value = false
      password.value = ''
      $q.notify({ type: 'positive', message: result.message, position: 'top' })
      return
    }

    $q.notify({ type: 'positive', message: result.message, position: 'top' })
    await router.replace(
      typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    )
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo completar la operación.',
      position: 'top'
    })
  } finally {
    isSubmitting.value = false
  }
}

const onForgot = async () => {
  if (!email.value) {
    $q.notify({
      type: 'info',
      message: 'Escribe tu correo y vuelve a seleccionar “¿Necesitas ayuda?”.',
      position: 'top'
    })
    return
  }

  isSubmitting.value = true
  try {
    await auth.requestPasswordReset(email.value)
    $q.notify({
      type: 'positive',
      message:
        'Si el correo está registrado, recibirás un enlace para crear una contraseña nueva.',
      timeout: 7000,
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message:
        error instanceof Error
          ? error.message
          : 'No se pudo enviar el enlace de recuperación.',
      position: 'top'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background:
    radial-gradient(
      ellipse at 9% 12%,
      rgba(242, 163, 175, 0.18),
      transparent 34%
    ),
    radial-gradient(
      ellipse at 90% 92%,
      rgba(232, 142, 156, 0.15),
      transparent 36%
    ),
    #fdf8f8;
  padding: 32px 20px;
}

.login-card {
  width: 100%;
  max-width: 920px;
  min-height: 560px;
  display: grid;
  grid-template-columns: 0.88fr 1.12fr;
  overflow: hidden;
  border: 1px solid rgba(216, 107, 122, 0.12);
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 28px 80px rgba(180, 90, 105, 0.13);
}

.brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 56px 48px;
  color: #fff;
  background: #d86b7a;
  overflow: hidden;
}

/* Imagen de fondo enlazada directamente desde Pinterest con opacidad de marca de agua */
.brand-panel-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://i.pinimg.com/736x/73/9a/62/739a62c29e3281bbe64faa9d0ca3c979.jpg');
  background-size: cover;
  background-position: center;
  opacity: 0.22;
  z-index: 1;
}

.brand-content {
  position: relative;
  z-index: 2;
}

.brand-mark {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  margin-bottom: 28px;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 19px;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  font-size: 26px;
}

.brand-title {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #fff;
}

.brand-subtitle {
  margin-top: 9px;
  color: #fbe3e6;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.brand-divider {
  width: 42px;
  height: 2px;
  margin: 30px 0 18px;
  background: #f8c0c8;
}

.brand-message {
  max-width: 290px;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 16px;
  line-height: 1.75;
}

.brand-note {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 46px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
}

.brand-note .q-icon {
  color: #fbe3e6;
  font-size: 18px;
}

.form-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 58px 64px;
}

.form-kicker {
  color: #d86b7a;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.form-title {
  margin-top: 10px;
  color: #3a2226;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.form-description {
  margin: 7px 0 28px;
  color: #8c6e73;
  font-size: 13px;
}

.login-hint {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 0 0 20px;
  padding: 11px 13px;
  border: 1px solid #f9e2e5;
  border-radius: 12px;
  color: #856167;
  background: #fdf5f6;
  font-size: 11px;
  line-height: 1.5;
}

.login-hint .q-icon {
  flex: 0 0 auto;
  color: #d86b7a;
  font-size: 16px;
}

.input-icon {
  color: #d86b7a;
}

.input-icon-subtle {
  color: #a38287;
}

.btn-main {
  min-height: 48px;
  color: #fff;
  background: linear-gradient(110deg, #d86b7a, #e2808f);
  box-shadow: 0 8px 18px rgba(216, 107, 122, 0.28);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.btn-main:hover {
  transform: translateY(-1px);
  box-shadow: 0 11px 22px rgba(216, 107, 122, 0.38);
}

.recovery-link {
  color: #c05867;
}

@media (max-width: 700px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    max-width: 480px;
    min-height: 0;
    grid-template-columns: 1fr;
    border-radius: 24px;
  }

  .brand-panel {
    padding: 28px 30px;
  }

  .brand-mark {
    width: 46px;
    height: 46px;
    margin-bottom: 14px;
    border-radius: 15px;
    font-size: 22px;
  }

  .brand-title {
    font-size: 28px;
  }

  .brand-divider,
  .brand-message,
  .brand-note {
    display: none;
  }

  .form-panel {
    padding: 32px 28px;
  }
}
</style>
