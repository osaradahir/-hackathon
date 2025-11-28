import axios from 'axios'

const API_BASE_URL = '/api'

// Interceptor para logging de todas las peticiones
axios.interceptors.request.use(
  (config) => {
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    })
    return config
  },
  (error) => {
    console.error('[API REQUEST ERROR]', error)
    return Promise.reject(error)
  }
)

// Interceptor para logging de todas las respuestas
axios.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error(`[API RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    return Promise.reject(error)
  }
)

export const api = {
  // Auth
  login: (email, password) => axios.post(`${API_BASE_URL}/auth/login`, { email, password }),
  register: (userData) => axios.post(`${API_BASE_URL}/auth/register`, userData),
  getCurrentUser: () => axios.get(`${API_BASE_URL}/auth/me`),

  // Companies
  getCompanies: () => axios.get(`${API_BASE_URL}/companies`),
  createCompany: (companyData) => axios.post(`${API_BASE_URL}/companies`, companyData),
  getCompany: (id) => axios.get(`${API_BASE_URL}/companies/${id}`),
  updateCompany: (id, companyData) => axios.patch(`${API_BASE_URL}/companies/${id}`, companyData),

  // Users
  getUsers: (companyId) => {
    const params = companyId ? { company_id: companyId } : {}
    return axios.get(`${API_BASE_URL}/users`, { params })
  },
  createUser: (userData) => axios.post(`${API_BASE_URL}/users`, userData),

  // Documents
  uploadDocument: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return axios.post(`${API_BASE_URL}/documents`, formData)
  },
  getDocuments: () => axios.get(`${API_BASE_URL}/documents`),

  // Calls
  getCalls: () => axios.get(`${API_BASE_URL}/calls`),
  getCallDetail: (id) => axios.get(`${API_BASE_URL}/calls/${id}`),
  createCall: (callData) => axios.post(`${API_BASE_URL}/calls`, callData),
  endCall: (id, rating) => axios.patch(`${API_BASE_URL}/calls/${id}/end`, null, { params: { rating } }),

  // Voice
  processVoice: (audioFile, callId, companyIdentifier) => {
    const formData = new FormData()
    formData.append('audio_file', audioFile)
    formData.append('company_identifier', companyIdentifier)  // Identificador de empresa requerido
    if (callId) {
      formData.append('call_id', callId.toString())
    }
    // No establecer Content-Type manualmente, axios lo maneja automáticamente con FormData
    // Endpoint público, no requiere autenticación
    return axios.post(`${API_BASE_URL}/voice/process`, formData)
  }
}

