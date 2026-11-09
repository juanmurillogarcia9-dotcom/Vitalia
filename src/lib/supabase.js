const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.QCLI_SUPABASE_URL
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.QCLI_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
let clientPromise

export const getSupabase = () => {
  if (!isSupabaseConfigured) {
    throw new Error('El servicio de cuentas no está configurado.')
  }

  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      })
    )
  }

  return clientPromise
}
