import { boot } from 'quasar/wrappers'
import axios from 'axios'

// Configuración de la URL base del backend Node.js
const api = axios.create({ 
  baseURL: 'http://localhost:4000/api' 
})

export default boot(({ app }) => {
  // Adjuntar el token JWT automáticamente en cada petición si existe
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('vitalia_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }