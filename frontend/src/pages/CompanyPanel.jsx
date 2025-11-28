import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import axios from 'axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import './CompanyPanel.css'

function CompanyPanel() {
  console.log('🎬 CompanyPanel - Componente iniciado')
  
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  // Debug: Log inicial del componente
  console.log('🎬 CompanyPanel renderizado', { 
    user, 
    authLoading, 
    userRole: user?.role,
    companyId: user?.company_id,
    timestamp: new Date().toISOString() 
  })
  const [calls, setCalls] = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('calls')
  const [businessLogic, setBusinessLogic] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    console.log('=== CompanyPanel useEffect ===', { 
      user, 
      authLoading, 
      userRole: user?.role,
      companyId: user?.company_id 
    })
    
    // Si aún está cargando la autenticación, esperar
    if (authLoading) {
      console.log('⏳ Esperando autenticación...')
      return
    }
    
    // Si no hay usuario o no es company_admin, no cargar datos
    if (!user) {
      console.log('❌ No hay usuario')
      setLoading(false)
      return
    }
    
    if (user?.role !== 'company_admin') {
      console.log('❌ Usuario no es company_admin:', user?.role)
      setLoading(false)
      return
    }
    
    // Si el usuario es company_admin, cargar datos
    console.log('✅ Usuario es company_admin, cargando datos...')
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const loadData = async () => {
    console.log('🚀 loadData() llamado')
    
    if (!user?.company_id) {
      console.error('❌ Usuario no tiene company_id:', user)
      setLoading(false)
      alert('Error: El usuario no está asociado a una empresa')
      return
    }
    
    try {
      console.log('📡 Iniciando peticiones API...')
      console.log('Company ID:', user.company_id)
      
      // Hacer las peticiones de forma secuencial para mejor debugging
      console.log('1️⃣ Llamando a api.getCalls()...')
      const callsResponse = await api.getCalls()
      console.log('✅ Respuesta de getCalls:', callsResponse.data)
      
      console.log('2️⃣ Llamando a api.getCompany()...')
      const companyResponse = await api.getCompany(user.company_id)
      console.log('✅ Respuesta de getCompany:', companyResponse.data)
      console.log('Respuesta de llamadas:', callsResponse.data)
      console.log('Número de llamadas:', callsResponse.data?.length || 0)
      
      // Asegurarse de que sea un array
      const callsArray = Array.isArray(callsResponse.data) ? callsResponse.data : []
      console.log('📊 Llamadas procesadas:', callsArray.length)
      console.log('📊 Array de llamadas:', callsArray)
      
      setCalls(callsArray)
      setCompany(companyResponse.data)
      setBusinessLogic(companyResponse.data.business_logic || '')
      
      console.log('✅ Estado actualizado - calls:', callsArray.length, 'company:', companyResponse.data?.name)
    } catch (error) {
      console.error('Error cargando datos:', error)
      console.error('Error completo:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      })
      alert(`Error al cargar las llamadas: ${error.response?.data?.detail || error.message}`)
      setCalls([]) // Asegurar que sea un array vacío en caso de error
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBusinessLogic = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.updateCompany(user.company_id, { business_logic: businessLogic })
      await loadData()
      alert('Lógica de negocio actualizada exitosamente')
    } catch (error) {
      console.error('Error guardando lógica de negocio:', error)
      const message = error.response?.data?.detail || 'Error al guardar'
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es })
  }

  // Esperar a que la autenticación termine
  if (authLoading) {
    console.log('⏳ CompanyPanel - Esperando autenticación (authLoading=true)')
    return <div className="loading">Cargando autenticación...</div>
  }

  // Verificar autorización
  console.log('🔍 CompanyPanel - Verificando autorización', { user, role: user?.role })
  if (!user) {
    console.log('❌ CompanyPanel - No hay usuario')
    return <div className="unauthorized">No hay usuario. Por favor, inicia sesión.</div>
  }
  
  if (user?.role !== 'company_admin') {
    console.log('❌ CompanyPanel - Usuario no es company_admin. Rol:', user?.role)
    return <div className="unauthorized">No autorizado. Por favor, inicia sesión como administrador de empresa. (Rol actual: {user?.role})</div>
  }
  
  console.log('✅ CompanyPanel - Usuario autorizado, renderizando panel')

  return (
    <div className="company-panel-container">
      <div className="company-header">
        <h1>Panel de Empresa</h1>
        <span className="user-info">{user?.name}</span>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveTab('calls')}
        >
          Llamadas
        </button>
        <button
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Configuración
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          {activeTab === 'calls' && (
            <div className="calls-section">
              <h2>Historial de Llamadas</h2>
              {console.log('🔍 Renderizando llamadas - calls.length:', calls.length, 'calls:', calls)}
              {calls.length === 0 ? (
                <div className="no-data">
                  No hay llamadas registradas
                  <br />
                  <small style={{ color: '#90caf9', fontSize: '12px' }}>
                    (Estado: {loading ? 'Cargando...' : 'Cargado'} | Total: {calls.length})
                  </small>
                </div>
              ) : (
                <div className="calls-list">
                  {calls.map((call) => (
                    <div
                      key={call.id}
                      className="call-card"
                      onClick={() => navigate(`/calls/${call.id}`, { state: { from: 'company' } })}
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
          )}

          {activeTab === 'config' && (
            <div className="config-section">
              <h2>Lógica de Negocio / Prompt del Asistente</h2>
              <p style={{ color: '#90caf9', marginBottom: '20px' }}>
                Edita aquí el prompt que define cómo se comporta el asistente de voz, qué productos puede ofrecer, y qué ofertas están disponibles.
              </p>
              
              <form onSubmit={handleSaveBusinessLogic} className="business-logic-form">
                <div className="form-group">
                  <textarea
                    value={businessLogic}
                    onChange={(e) => setBusinessLogic(e.target.value)}
                    rows="25"
                    placeholder="Pega aquí el prompt con la personalidad del asistente, catálogo de productos, ofertas, etc."
                    style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '13px',
                      width: '100%',
                      padding: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <button type="submit" disabled={saving} className="save-btn">
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CompanyPanel

