import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      // Redirigir según el rol
      const user = result.user || JSON.parse(localStorage.getItem('user'))
      if (user?.role === 'super_admin') {
        navigate('/admin')
      } else if (user?.role === 'company_admin') {
        navigate('/company')
      } else {
        navigate('/chat')
      }
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Logo */}
        <div className="logo-container">
          <svg className="logo-icon" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Dome/Arc shape */}
            <path d="M10 35 Q30 15 50 35" stroke="white" strokeWidth="2.5" fill="none" opacity="0.9"/>
            {/* Upward arrow/mountain peak */}
            <path d="M30 5L50 25H35V35H25V25H10L30 5Z" fill="white" opacity="0.9"/>
            {/* Starburst in center */}
            <g transform="translate(30, 40)">
              <path d="M0,-4 L1.5,-1.5 L4,0 L1.5,1.5 L0,4 L-1.5,1.5 L-4,0 L-1.5,-1.5 Z" fill="white" opacity="0.9"/>
            </g>
          </svg>
          <h1 className="logo-text">ISPEAK</h1>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                className="checkbox-input"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-text">Recordar cuenta</span>
            </label>
            <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Iniciando sesión...' : 'ACCEDER'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

