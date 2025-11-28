import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import './AdminPanel.css'

function AdminPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [companies, setCompanies] = useState([])
  const [users, setUsers] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    name: '', 
    identifier: '', 
    description: '',
    business_logic: ''
  })
  const [showUserForm, setShowUserForm] = useState(null) // ID de la empresa para la que se muestra el formulario
  const [userFormData, setUserFormData] = useState({ 
    email: '', 
    password: '', 
    name: '', 
    phone: '' 
  })

  useEffect(() => {
    if (user?.role === 'super_admin') {
      loadCompanies()
      loadUsers()
    }
  }, [user])

  const loadCompanies = async () => {
    try {
      const response = await api.getCompanies()
      setCompanies(response.data)
    } catch (error) {
      console.error('Error cargando empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.getUsers()
      const usersByCompany = {}
      response.data.forEach(user => {
        if (user.company_id) {
          if (!usersByCompany[user.company_id]) {
            usersByCompany[user.company_id] = []
          }
          usersByCompany[user.company_id].push(user)
        }
      })
      setUsers(usersByCompany)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.createCompany(formData)
      setFormData({ name: '', identifier: '', description: '', business_logic: '' })
      setShowForm(false)
      loadCompanies()
    } catch (error) {
      console.error('Error creando empresa:', error)
      alert('Error al crear empresa')
    }
  }

  const handleUserSubmit = async (e, companyId) => {
    e.preventDefault()
    try {
      await api.createUser({
        ...userFormData,
        company_id: companyId
      })
      setUserFormData({ email: '', password: '', name: '', phone: '' })
      setShowUserForm(null)
      loadUsers()
      alert('Usuario creado exitosamente')
    } catch (error) {
      console.error('Error creando usuario:', error)
      const message = error.response?.data?.detail || 'Error al crear usuario'
      alert(message)
    }
  }

  const getInitials = (name) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (user?.role !== 'super_admin') {
    return <div className="unauthorized">No autorizado</div>
  }

  return (
    <div className="admin-panel-container">
      {/* Panel Izquierdo */}
      <div className="left-panel">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-icon">I</div>
            <div className="logo-text">ISPEAK</div>
          </div>
          <div className="welcome-text">Administración</div>
        </div>

        <div className="call-center-card">
          <div className="user-info">
            <div className="profile-icon">{getInitials(user?.name)}</div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'Administrador'}</div>
              <div className="user-role">Super Administrador</div>
            </div>
          </div>

          <div className="navigation">
            <a href="#" className="nav-link active" onClick={(e) => { e.preventDefault(); }}>
              <span className="nav-icon">🏢</span>
              <span>Empresas</span>
            </a>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Panel Derecho */}
      <div className="right-panel">
        <div className="admin-header">
          <h1>Panel de Administración</h1>
          <button className="add-company-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancelar' : '+ Nueva Empresa'}
          </button>
        </div>

      {showForm && (
        <div className="company-form">
          <h2>Crear Nueva Empresa</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la Empresa</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Identificador Único (para llamadas públicas)</label>
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="Ej: mi-empresa-123"
                required
              />
              <small style={{ color: '#90caf9', fontSize: '12px' }}>
                Este identificador será usado por los clientes para hacer llamadas sin registrarse
              </small>
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Lógica de Negocio / Prompt del Asistente</label>
              <textarea
                value={formData.business_logic}
                onChange={(e) => setFormData({ ...formData, business_logic: e.target.value })}
                rows="20"
                placeholder="Pega aquí el prompt con la personalidad del asistente, catálogo de productos, ofertas, etc."
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
              <small style={{ color: '#90caf9', fontSize: '12px' }}>
                Este prompt define cómo se comporta el asistente de voz, qué productos puede ofrecer, y qué ofertas están disponibles
              </small>
            </div>
            <button type="submit" className="submit-btn">Crear Empresa</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="companies-list">
          {companies.map((company) => (
            <div key={company.id} className="company-card">
              <div className="company-card-header">
                <h3>{company.name}</h3>
                <button 
                  className="add-user-btn"
                  onClick={() => setShowUserForm(showUserForm === company.id ? null : company.id)}
                >
                  {showUserForm === company.id ? '✕ Cancelar' : '+ Usuario'}
                </button>
              </div>
              {company.description && <p>{company.description}</p>}
              
              {showUserForm === company.id && (
                <div className="user-form">
                  <h4>Crear Usuario de Empresa</h4>
                  <form onSubmit={(e) => handleUserSubmit(e, company.id)}>
                    <div className="form-group">
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contraseña</label>
                      <input
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Teléfono (opcional)</label>
                      <input
                        type="text"
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                      />
                    </div>
                    <button type="submit" className="submit-btn">Crear Usuario</button>
                  </form>
                </div>
              )}

              <div className="company-users">
                <h4>Usuarios de la Empresa ({users[company.id]?.length || 0})</h4>
                {users[company.id] && users[company.id].length > 0 ? (
                  <div className="users-list">
                    {users[company.id].map((user) => (
                      <div key={user.id} className="user-item">
                        <div>
                          <strong>{user.name}</strong>
                          <span className="user-email">{user.email}</span>
                        </div>
                        {user.phone && <span className="user-phone">📞 {user.phone}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-users">No hay usuarios registrados</p>
                )}
              </div>

              <div className="company-meta">
                <span>ID: {company.id}</span>
                {company.identifier && (
                  <span>Identificador: <strong style={{color: '#66bb6a'}}>{company.identifier}</strong></span>
                )}
                <span>Creada: {new Date(company.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminPanel

