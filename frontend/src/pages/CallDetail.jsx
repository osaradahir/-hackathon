import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../api/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import './CallDetail.css'

function CallDetail() {
  const { callId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [call, setCall] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Detectar desde dónde se navegó para volver correctamente
  const getBackPath = () => {
    // Si viene del panel de empresa, volver ahí
    if (location.state?.from === 'company' || location.pathname.includes('/company')) {
      return '/company'
    }
    // Si viene del dashboard, volver ahí
    return '/'
  }

  useEffect(() => {
    loadCallDetail()
  }, [callId])

  const loadCallDetail = async () => {
    try {
      const response = await api.getCallDetail(callId)
      setCall(response.data)
      console.log('Llamada cargada:', response.data)
      console.log('Mensajes:', response.data.messages?.length || 0)
    } catch (error) {
      console.error('Error cargando detalle de llamada:', error)
      if (error.response?.status === 403) {
        alert('No tienes permisos para ver esta llamada')
        navigate(getBackPath())
      } else if (error.response?.status === 404) {
        alert('Llamada no encontrada')
        navigate(getBackPath())
      } else {
        alert('Error al cargar la llamada. Por favor, intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = () => {
    if (!call || !call.start_time || !call.end_time) return '00:00:00'
    const start = new Date(call.start_time)
    const end = new Date(call.end_time)
    const diff = Math.floor((end - start) / 1000)
    const hours = Math.floor(diff / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy 'a las' hh:mm a", { locale: es })
  }

  const downloadPDF = () => {
    // Implementar descarga de PDF
    console.log('Descargar PDF de la llamada')
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!call) {
    return <div className="error">Llamada no encontrada</div>
  }

  return (
    <div className="call-detail-container">
      <div className="call-detail-left">
        <h1 className="call-detail-title">Detalle de Llamada</h1>
        
        <div className="call-info-section">
          <h2 className="info-label">ID de Llamada</h2>
          <p className="info-value">#{call.id}</p>
        </div>
        
        <div className="call-info-section">
          <h2 className="info-label">Usuario</h2>
          <p className="info-value">{call.client_name || 'Llamada anónima'}</p>
        </div>

        <div className="call-info-section">
          <h2 className="info-label">Duración</h2>
          <p className="info-value">{calculateDuration()}</p>
        </div>

        <div className="call-info-section">
          <h2 className="info-label">Teléfono</h2>
          <p className="info-value">{call.client_phone || 'N/A'}</p>
        </div>
        
        {call.messages && call.messages.length > 0 && (
          <div className="call-info-section">
            <h2 className="info-label">Total Mensajes</h2>
            <p className="info-value">{call.messages.length}</p>
          </div>
        )}

        <div className="call-info-section">
          <h2 className="info-label">Fecha y Hora</h2>
          <p className="info-value">{formatDateTime(call.start_time)}</p>
        </div>
      </div>

      <div className="call-detail-right">
        <div className="transcription-panel">
          <div className="transcription-header">
            <h2 className="transcription-title">Transcripción IA</h2>
            <button className="download-pdf-btn" onClick={downloadPDF}>
              Descargar PDF
            </button>
          </div>

          <div className="transcription-content">
            {call.messages && call.messages.length > 0 ? (
              call.messages.map((message, index) => (
                <div key={message.id || index} className={`message ${message.role}`}>
                  <div className="message-header">
                    <div className="message-role">
                      {message.role === 'assistant' ? '🤖 Agente' : '👤 Cliente'}
                    </div>
                    {message.timestamp && (
                      <div className="message-time">
                        {format(new Date(message.timestamp), "HH:mm:ss", { locale: es })}
                      </div>
                    )}
                  </div>
                  <div className="message-content">{message.content}</div>
                </div>
              ))
            ) : (
              <p className="no-messages">No hay mensajes en esta llamada</p>
            )}
          </div>
        </div>
      </div>

      <button className="history-btn" onClick={() => navigate(getBackPath())}>
        ← Volver al Historial
      </button>
    </div>
  )
}

export default CallDetail

