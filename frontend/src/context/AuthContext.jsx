import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        try {
          const response = await axios.get('/api/auth/me')
          setUser(response.data)
        } catch (error) {
          // Token inválido, limpiar
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }
    loadUser()
  }, [token])

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { access_token, user: userData } = response.data
      localStorage.setItem('token', access_token)
      setToken(access_token)
      setUser(userData)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      return { success: true, user: userData }
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Error al iniciar sesión' }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    user,
    loading,
    login,
    logout,
    setUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

