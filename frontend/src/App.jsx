import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CallDetail from './pages/CallDetail'
import VoiceChat from './pages/VoiceChat'
import AdminPanel from './pages/AdminPanel'
import CompanyPanel from './pages/CompanyPanel'
import { AuthProvider, useAuth } from './context/AuthContext'
import './App.css'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Cargando...</div>
  }
  
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/calls/:callId" element={<PrivateRoute><CallDetail /></PrivateRoute>} />
      <Route path="/chat" element={<VoiceChat />} />
      <Route path="/admin" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />
      <Route path="/company" element={<PrivateRoute><CompanyPanel /></PrivateRoute>} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

