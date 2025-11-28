import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/api'
import './VoiceChat.css'

function VoiceChat() {
  const navigate = useNavigate()
  const [companyIdentifier, setCompanyIdentifier] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState([])
  const [currentCallId, setCurrentCallId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [recordingStatus, setRecordingStatus] = useState('')
  const [audioSize, setAudioSize] = useState(0)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioPlayerRef = useRef(null)
  const recordingIntervalRef = useRef(null)
  const streamRef = useRef(null)
  const recordingStartTimeRef = useRef(null)
  const minimumRecordingTime = 500 // Mínimo 500ms de grabación

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startCall = () => {
    if (!companyIdentifier.trim()) {
      alert('Por favor ingresa el identificador de la empresa')
      return
    }
    setHasStarted(true)
  }

  const startRecording = async () => {
    // Prevenir múltiples inicios
    if (isRecording || isProcessing) {
      return
    }

    if (!hasStarted || !companyIdentifier.trim()) {
      alert('Por favor ingresa el identificador de la empresa primero')
      return
    }

    try {
      // Si ya hay un stream activo, usarlo
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      
      const stream = streamRef.current
      
      // Si ya hay un MediaRecorder activo y está grabando, no crear uno nuevo
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        return
      }
      
      // Si existe un MediaRecorder pero está inactivo, limpiar la referencia
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current = null
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('Error en MediaRecorder:', event)
        setIsRecording(false)
        setRecordingStatus('')
      }

      mediaRecorder.onstop = async () => {
        // Limpiar intervalo
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }
        
        // Verificar tiempo mínimo de grabación
        const recordingDuration = recordingStartTimeRef.current ? Date.now() - recordingStartTimeRef.current : 0
        
        // Esperar un momento para asegurar que todos los chunks se hayan recibido
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        console.log('Audio capturado:', {
          blobSize: audioBlob.size,
          chunksCount: audioChunksRef.current.length,
          duration: recordingDuration,
          chunksSizes: audioChunksRef.current.map(c => c.size)
        })
        
        // Validar que el audio tenga contenido suficiente
        if (!audioBlob || audioBlob.size === 0 || audioChunksRef.current.length === 0) {
          setRecordingStatus('')
          setIsRecording(false)
          mediaRecorderRef.current = null
          recordingStartTimeRef.current = null
          alert('No se grabó audio. Por favor, mantén presionado el botón mientras hablas al menos 1 segundo.')
          return
        }
        
        // Validar tamaño mínimo (reducido a 50 bytes para capturar incluso audio muy corto)
        if (audioBlob.size < 50) {
          setRecordingStatus('')
          setIsRecording(false)
          mediaRecorderRef.current = null
          recordingStartTimeRef.current = null
          alert('El audio es demasiado corto. Por favor, graba al menos 1 segundo hablando.')
          return
        }
        
        // Validar duración mínima
        if (recordingDuration < minimumRecordingTime) {
          setRecordingStatus('')
          setIsRecording(false)
          mediaRecorderRef.current = null
          recordingStartTimeRef.current = null
          alert(`La grabación es muy corta (${(recordingDuration / 1000).toFixed(1)}s). Mantén presionado el botón al menos 1 segundo.`)
          return
        }
        
        setRecordingStatus(`Audio capturado: ${(audioBlob.size / 1024).toFixed(1)} KB - Procesando...`)
        setIsRecording(false)
        
        // NO limpiar la referencia todavía, esperar a que se procese el audio
        // mediaRecorderRef.current = null
        recordingStartTimeRef.current = null
        
        // Limpiar chunks después de crear el blob
        const chunksToProcess = [...audioChunksRef.current]
        audioChunksRef.current = []
        
        await processAudio(audioBlob)
        
        // Ahora sí limpiar la referencia del MediaRecorder
        mediaRecorderRef.current = null
        setRecordingStatus('')
      }

      // Iniciar grabación con timeslice para emitir chunks cada 100ms (más frecuente)
      mediaRecorder.start(100)
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now()
      setRecordingStatus('🎤 Micrófono activo - Grabando...')
      setAudioSize(0)
      
      // Mostrar actualización periódica del estado
      recordingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + (chunk?.size || 0), 0)
          if (totalSize > 0) {
            setRecordingStatus(`🎤 Grabando... ${(totalSize / 1024).toFixed(1)} KB`)
          } else {
            setRecordingStatus('🎤 Micrófono activo - Esperando audio...')
          }
        } else {
          // Si el recorder se detuvo inesperadamente, limpiar
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current)
            recordingIntervalRef.current = null
          }
        }
      }, 300)
    } catch (error) {
      console.error('Error accediendo al micrófono:', error)
      setIsRecording(false)
      setRecordingStatus('')
      alert('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }

  const stopRecording = () => {
    // Solo detener si realmente está grabando
    if (!isRecording || !mediaRecorderRef.current) {
      return
    }
    
    // Verificar que haya pasado el tiempo mínimo de grabación
    if (recordingStartTimeRef.current) {
      const recordingDuration = Date.now() - recordingStartTimeRef.current
      if (recordingDuration < minimumRecordingTime) {
        console.log(`Grabación muy corta (${recordingDuration}ms), esperando más tiempo...`)
        // Esperar el tiempo restante antes de detener
        const remainingTime = minimumRecordingTime - recordingDuration
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            stopRecording()
          }
        }, remainingTime + 100) // +100ms de margen
        return
      }
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Deteniendo grabación...', {
        chunksCount: audioChunksRef.current.length,
        totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + (chunk?.size || 0), 0)
      })
      mediaRecorderRef.current.stop()
      // NO detener el stream aquí, solo el recorder
      // El stream se mantiene vivo para futuras grabaciones
    }
  }

  const processAudio = async (audioBlob) => {
    if (!companyIdentifier || !companyIdentifier.trim()) {
      alert('Error: No se ha especificado el identificador de la empresa')
      setIsProcessing(false)
      return
    }
    
    setIsProcessing(true)
    
    try {
      const response = await api.processVoice(audioBlob, currentCallId, companyIdentifier.trim())
      
      // Validar que la respuesta tenga los datos necesarios
      if (!response || !response.data) {
        throw new Error('Respuesta inválida del servidor')
      }
      
      const { call_id, transcript, response_text, audio_response, call_ended } = response.data

      // Validar datos requeridos
      if (!transcript || !response_text) {
        throw new Error('Faltan datos en la respuesta del servidor')
      }

      // Siempre actualizar el call_id para mantener la conversación continua
      if (call_id) {
        setCurrentCallId(call_id)
        console.log('Call ID actualizado:', call_id)
      }
      
      console.log('Conversación continuada. Call ID:', call_id)

      // Agregar mensajes
      setMessages(prev => {
        const newMessages = [
          ...prev,
          { role: 'client', content: transcript },
          { role: 'assistant', content: response_text }
        ]
        console.log('Total mensajes:', newMessages.length)
        return newMessages
      })

      // Reproducir audio de respuesta (WAV desde Groq)
      if (audio_response) {
        try {
          const audioData = atob(audio_response)
          const audioArray = new Uint8Array(audioData.length)
          for (let i = 0; i < audioData.length; i++) {
            audioArray[i] = audioData.charCodeAt(i)
          }
            // El backend envía WAV desde Groq PlayAI TTS (response_format="wav")
          const audioBlob = new Blob([audioArray], { type: 'audio/wav' })
          const audioUrl = URL.createObjectURL(audioBlob)
          
          if (audioPlayerRef.current) {
            audioPlayerRef.current.src = audioUrl
            audioPlayerRef.current.play().catch(err => {
              console.error('Error reproduciendo audio:', err)
            })
          }
        } catch (audioError) {
          console.error('Error procesando audio de respuesta:', audioError)
          // No bloquear la conversación si falla la reproducción de audio
        }
      }

      // Si el usuario quiere terminar la conversación, finalizar automáticamente
      if (call_ended) {
        setTimeout(() => {
          alert('La conversación ha terminado. ¡Gracias por usar nuestro servicio!')
          endCall()
        }, 2000) // Esperar 2 segundos para que el usuario escuche la última respuesta
      }
    } catch (error) {
      console.error('Error procesando audio:', error)
      console.error('Error completo:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      })
      
      let errorMessage = 'Error al procesar el audio. Por favor, intenta de nuevo.'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      console.error('Error detallado:', error)
      alert(errorMessage)
      setRecordingStatus('')
      
      // Si es un error de red o servidor, permitir reintentar
      if (!error.response) {
        console.warn('Error de conexión. Verifica que el servidor esté ejecutándose.')
      }
    } finally {
      setIsProcessing(false)
      // NO limpiar el MediaRecorder aquí, se limpia después de procesar
      // Solo limpiar los chunks después de procesar exitosamente
      console.log('Procesamiento completado. Listo para siguiente grabación.')
    }
  }

  const endCall = () => {
    // Detener grabación si está activa
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    // Detener stream y limpiar
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
      recordingIntervalRef.current = null
    }
    
    setHasStarted(false)
    setMessages([])
    setCurrentCallId(null)
    setCompanyIdentifier('')
    setIsRecording(false)
    setRecordingStatus('')
    audioChunksRef.current = []
  }

  return (
    <div className="voice-chat-container">
      <div className="voice-chat-header">
        <h1>Asistente de Voz</h1>
        {hasStarted && (
          <button className="end-call-btn" onClick={endCall}>
            Finalizar Llamada
          </button>
        )}
      </div>

      {/* Formulario de identificador - siempre visible */}
      <div className="company-identifier-section">
        <label htmlFor="company-identifier-input" className="identifier-label">
          Identificador de la Empresa:
        </label>
        <div className="identifier-input-group">
          <input
            id="company-identifier-input"
            type="text"
            value={companyIdentifier}
            onChange={(e) => setCompanyIdentifier(e.target.value)}
            placeholder="Ej: mi-empresa-123"
            className="identifier-input"
            disabled={hasStarted && messages.length > 0}
            autoFocus={!hasStarted}
          />
          {!hasStarted ? (
            <button 
              onClick={startCall} 
              className="start-call-btn"
              disabled={!companyIdentifier.trim()}
            >
              Iniciar Llamada
            </button>
          ) : (
            <div className="company-info-display-inline">
              <span>✓ <strong>{companyIdentifier}</strong></span>
            </div>
          )}
        </div>
        {companyIdentifier && hasStarted && messages.length > 0 && (
          <div className="company-info-display">
            <span>✓ Empresa activa: <strong>{companyIdentifier}</strong></span>
          </div>
        )}
      </div>

      <div className="voice-chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>Presiona el botón para comenzar a hablar</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className="message-role-label">
                {msg.role === 'assistant' ? 'Agente' : 'Tú'}
              </div>
              <div className="message-text">{msg.content}</div>
            </div>
          ))
        )}

        {isRecording && recordingStatus && (
          <div className="recording-indicator">
            <div className="recording-pulse"></div>
            <p>{recordingStatus}</p>
          </div>
        )}

        {isProcessing && (
          <div className="processing-indicator">
            <div className="spinner"></div>
            <p>Procesando...</p>
          </div>
        )}
      </div>

      {hasStarted && (
        <div className="voice-chat-controls">
          <button
            className={`record-btn ${isRecording ? 'recording' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault()
              startRecording()
            }}
            onMouseUp={(e) => {
              e.preventDefault()
              stopRecording()
            }}
            onMouseLeave={(e) => {
              // NO detener automáticamente cuando el mouse sale, solo cuando se suelta el botón
              // Esto evita detener la grabación accidentalmente
            }}
            onTouchStart={(e) => {
              e.preventDefault()
              startRecording()
            }}
            onTouchEnd={(e) => {
              e.preventDefault()
              stopRecording()
            }}
            disabled={isProcessing || !hasStarted}
          >
            {isRecording ? '🎤 Grabando...' : '🎤 Presiona para hablar'}
          </button>
        </div>
      )}

      <audio ref={audioPlayerRef} style={{ display: 'none' }} />
    </div>
  )
}

export default VoiceChat

