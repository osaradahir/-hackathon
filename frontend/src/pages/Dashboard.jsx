import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import './Dashboard.css'

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirigir según el rol del usuario
    if (user?.role === 'super_admin') {
      navigate('/admin')
      return
    }
    if (user?.role === 'company_admin') {
      navigate('/company')
      return
    }
    // Si es cliente, cargar las llamadas
    loadCalls()
  }, [user, navigate])

  const loadCalls = async () => {
    try {
      const response = await api.getCalls()
      setCalls(response.data)
    } catch (error) {
      console.error('Error cargando llamadas:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
  }

  const getRoleTitle = () => {
    if (user?.role === 'super_admin') return 'Administrador'
    if (user?.role === 'company_admin') return 'Administrador de Empresa'
    return 'Cliente'
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Historial de Llamadas</h1>
        <div className="header-actions">
          {user?.role === 'client' && (
            <button className="new-call-btn" onClick={() => navigate('/chat')}>
              Nueva Llamada
            </button>
          )}
          <span className="user-info">{getRoleTitle()}: {user?.name}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : calls.length === 0 ? (
        <div className="no-calls">
          <p>No hay llamadas registradas</p>
          {user?.role === 'client' && (
            <button className="new-call-btn" onClick={() => navigate('/chat')}>
              Iniciar Primera Llamada
            </button>
          )}
        </div>
      ) : (
        <div className="calls-list">
          {calls.map((call) => (
            <div
              key={call.id}
              className="call-card"
              onClick={() => navigate(`/calls/${call.id}`)}
            >
              <div className="call-card-header">
                <h3>Llamada #{call.id}</h3>
                {call.rating && (
                  <span className="rating">⭐ {call.rating}/5</span>
                )}
              </div>
              <div className="call-card-info">
                <p><strong>Inicio:</strong> {formatDate(call.start_time)}</p>
                {call.end_time && (
                  <p><strong>Fin:</strong> {formatDate(call.end_time)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard

