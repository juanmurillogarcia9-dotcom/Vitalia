import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js'

const LAST_EMAIL_KEY = 'vitalia_last_email'

const toCurrentUser = user => {
  if (!user) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name:
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'Usuario Vitalia',
    age: user.user_metadata?.age ? Number(user.user_metadata.age) : null
  }
}

const getLegacyUser = (email, password) => {
  try {
    const savedState = JSON.parse(
      localStorage.getItem('vitalia_auth') || 'null'
    )
    return savedState?.users?.find(
      user =>
        user.email?.toLowerCase() === email.toLowerCase() &&
        user.password === password
    )
  } catch (error) {
    console.error('No se pudo validar la cuenta local anterior:', error)
    return null
  }
}

const saveLastEmail = email => {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email)
  } catch (error) {
    console.error('No se pudo recordar el correo en este dispositivo:', error)
  }
}

const clearLegacyCredentials = email => {
  try {
    const savedState = JSON.parse(
      localStorage.getItem('vitalia_auth') || 'null'
    )
    if (!Array.isArray(savedState?.users)) {
      return
    }

    savedState.users = savedState.users.filter(
      user => user.email?.toLowerCase() !== email.toLowerCase()
    )
    if (savedState.currentUser?.email?.toLowerCase() === email.toLowerCase()) {
      savedState.currentUser = null
    }

    if (savedState.users.length) {
      localStorage.setItem('vitalia_auth', JSON.stringify(savedState))
    } else {
      localStorage.removeItem('vitalia_auth')
    }
  } catch (error) {
    console.error(
      'No se pudieron limpiar las credenciales locales anteriores:',
      error
    )
  }
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref(null)
  const isInitialized = ref(false)
  const isConfigured = computed(() => isSupabaseConfigured)
  let initialization
  let authSubscription

  const initialize = async () => {
    if (!isSupabaseConfigured) {
      isInitialized.value = true
      return null
    }

    if (isInitialized.value) {
      return currentUser.value
    }
    if (initialization) {
      return initialization
    }

    initialization = (async () => {
      const client = await getSupabase()
      const { data, error } = await client.auth.getSession()
      if (error) {
        throw error
      }

      currentUser.value = toCurrentUser(data.session?.user)
      authSubscription = client.auth.onAuthStateChange((_event, session) => {
        currentUser.value = toCurrentUser(session?.user)
      }).data.subscription
      isInitialized.value = true
      return currentUser.value
    })()

    try {
      return await initialization
    } finally {
      initialization = undefined
    }
  }

  const login = async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message:
          'El servicio compartido no está configurado. Revisa la guía de Supabase.'
      }
    }

    const normalizedEmail = email.trim().toLowerCase()
    saveLastEmail(normalizedEmail)
    const client = await getSupabase()
    const { data, error } = await client.auth.signInWithPassword({
      email: normalizedEmail,
      password
    })

    if (!error) {
      currentUser.value = toCurrentUser(data.user)
      isInitialized.value = true
      saveLastEmail(normalizedEmail)
      clearLegacyCredentials(normalizedEmail)
      return { success: true, message: '¡Bienvenida de nuevo!' }
    }

    const legacyUser = getLegacyUser(normalizedEmail, password)
    if (legacyUser) {
      const migration = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: legacyUser.name || normalizedEmail.split('@')[0] }
        }
      })

      const migrationHasAccount =
        Boolean(migration.data?.user) &&
        migration.data.user.identities?.length !== 0
      if (!migration.error && migrationHasAccount) {
        currentUser.value = toCurrentUser(migration.data.session?.user)
        isInitialized.value = true
        saveLastEmail(normalizedEmail)
        clearLegacyCredentials(normalizedEmail)
        return {
          success: true,
          requiresConfirmation: !migration.data.session,
          migrated: true,
          message: migration.data.session
            ? 'Tu cuenta anterior se conectó correctamente. Ya puedes continuar.'
            : 'Tu cuenta se conectó. Confirma tu correo para iniciar sesión.'
        }
      }
    }

    if (
      error.code === 'email_not_confirmed' ||
      error.message === 'Email not confirmed'
    ) {
      return {
        success: false,
        message:
          'Supabase aún no confirmó este correo. Para iniciar sin enlace, desactiva “Confirm email” en Authentication → Providers → Email; esta cuenta podría requerir confirmación manual en Authentication → Users.'
      }
    }

    if (error.code === 'invalid_credentials') {
      return {
        success: false,
        message:
          'Ese correo y contraseña no coinciden con una cuenta de este proyecto. Si tu cuenta solo estaba guardada en otro navegador, créala aquí con el mismo correo y su historial se podrá migrar desde ese dispositivo.'
      }
    }

    if (
      error instanceof TypeError ||
      error.name === 'AuthRetryableFetchError' ||
      error.message.toLowerCase().includes('fetch')
    ) {
      return {
        success: false,
        message:
          'No se pudo conectar con el servicio de cuentas. Revisa tu conexión e inténtalo otra vez.'
      }
    }

    return {
      success: false,
      message:
        'No se pudo iniciar sesión. Verifica los datos e inténtalo otra vez.'
    }
  }

  const register = async (email, password, name, age) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message:
          'El servicio compartido no está configurado. Revisa la guía de Supabase.'
      }
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = name.trim()

    if (
      !normalizedEmail ||
      !normalizedName ||
      password.length < 8 ||
      !Number.isInteger(Number(age)) ||
      Number(age) < 1 ||
      Number(age) > 120
    ) {
      return {
        success: false,
        message:
          'Completa tus datos, una edad válida y una contraseña de al menos 8 caracteres.'
      }
    }

    const client = await getSupabase()
    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { full_name: normalizedName, age: Number(age) }
      }
    })

    if (error) {
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists')
      ) {
        return {
          success: false,
          message:
            'Ya existe una cuenta con ese correo. Inicia sesión con ella.'
        }
      }
      throw error
    }

    if (data.user?.identities?.length === 0) {
      return {
        success: false,
        message: 'Ya existe una cuenta con ese correo. Inicia sesión con ella.'
      }
    }

    saveLastEmail(normalizedEmail)
    clearLegacyCredentials(normalizedEmail)
    currentUser.value = toCurrentUser(data.session?.user)
    isInitialized.value = true

    return {
      success: true,
      requiresConfirmation: !data.session,
      message: data.session
        ? '¡Cuenta creada! Ya puedes empezar tu seguimiento.'
        : 'Te enviamos un correo para confirmar tu cuenta antes de iniciar sesión.'
    }
  }

  const requestPasswordReset = async email => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'El servicio compartido no está configurado. Revisa la guía de Supabase.'
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      throw new Error(
        'Escribe tu correo para enviarte el enlace de recuperación.'
      )
    }

    const client = await getSupabase()
    const redirectTo = `${window.location.origin}/?flow=recovery#/login?recovery=1`
    const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo
    })

    if (error) {
      throw error
    }

    saveLastEmail(normalizedEmail)
  }

  const updatePassword = async password => {
    if (!isSupabaseConfigured || password.length < 8) {
      throw new Error('La nueva contraseña debe tener al menos 8 caracteres.')
    }

    const client = await getSupabase()
    const { data, error } = await client.auth.updateUser({ password })
    if (error) {
      throw error
    }

    currentUser.value = toCurrentUser(data.user)
    isInitialized.value = true
  }

  const updateProfile = async ({ name, age }) => {
    const normalizedName = String(name ?? '').trim()
    const normalizedAge = Number(age)
    if (
      !normalizedName ||
      !Number.isInteger(normalizedAge) ||
      normalizedAge < 1 ||
      normalizedAge > 120
    ) {
      throw new Error('Escribe un nombre y una edad válida entre 1 y 120.')
    }

    if (!isSupabaseConfigured || !currentUser.value?.id) {
      throw new Error('Inicia sesión para actualizar tu perfil.')
    }

    const client = await getSupabase()
    const { data, error } = await client.auth.updateUser({
      data: { full_name: normalizedName, age: normalizedAge }
    })
    if (error) {
      throw error
    }

    currentUser.value = toCurrentUser(data.user)
    return currentUser.value
  }

  const logout = async () => {
    if (!isSupabaseConfigured) {
      currentUser.value = null
      return
    }

    const client = await getSupabase()
    const { error } = await client.auth.signOut()
    if (error) {
      throw error
    }
    currentUser.value = null
  }

  const dispose = () => {
    authSubscription?.unsubscribe()
    authSubscription = undefined
  }

  return {
    currentUser,
    isInitialized,
    isConfigured,
    initialize,
    login,
    register,
    requestPasswordReset,
    updatePassword,
    updateProfile,
    logout,
    dispose
  }
})
