import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import './Dashboard.css'

function Dashboard() {
  const { user, logout } = useAuth()
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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A'
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diff = Math.floor((end - start) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="dashboard-container">
      {/* Panel Izquierdo */}
      <div className="left-panel">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">I</div>
            <div className="logo-text">ISPEAK</div>
          </div>
          <div className="welcome-text">Bienvenido</div>
        </div>

        <div className="call-center-card">
          <div className="user-info">
            <div className="profile-icon">{getInitials(user?.name)}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'Usuario'}</div>
              <div className="user-role">{getRoleTitle()}</div>
            </div>
          </div>

          <div className="line-status">
            <div className="status-indicator">
              <span className="status-dot green"></span>
              <span>En línea</span>
            </div>
          </div>

          <div className="navigation">
            <a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
              <span className="nav-icon">📞</span>
              <span>Llamadas</span>
            </a>
            {user?.role === 'client' && (
              <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/chat'); }}>
                <span className="nav-icon">💬</span>
                <span>Nueva Llamada</span>
              </a>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {user?.role === 'client' && (
          <button className="assistant-btn" onClick={() => navigate('/chat')}>
            <div className="assistant-icon">🤖</div>
            <span>Asistente de Voz</span>
          </button>
        )}
      </div>

      {/* Panel Derecho */}
      <div className="right-panel">
        <h1 className="panel-title">Historial de Llamadas</h1>

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
          <div className="call-history-section">
            <h2 className="section-title">Llamadas Recientes</h2>
            <div className="history-list">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="history-item"
                  onClick={() => navigate(`/calls/${call.id}`)}
                >
                  <div className="history-details">
                    <div className="history-name">Llamada #{call.id}</div>
                    <div className="history-phone">
                      Inicio: {formatDate(call.start_time)}
                      {call.end_time && ` • Fin: ${formatDate(call.end_time)}`}
                    </div>
                  </div>
                  <div className="history-status">
                    {call.rating && (
                      <div className="rating" style={{ marginBottom: '4px' }}>
                        ⭐ {call.rating}/5
                      </div>
                    )}
                    <div className="history-duration">
                      {calculateDuration(call.start_time, call.end_time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

