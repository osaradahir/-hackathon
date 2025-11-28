# Asistente de Voz IA

Sistema de asistente de voz inteligente que permite a empresas configurar su lógica de negocio y ofrecer asistencia por voz a sus clientes usando modelos de Groq.

## 🚀 Características

- 🎤 **Asistente de Voz**: Conversación por voz usando Speech-to-Text, Text-to-Text y Text-to-Speech
- 🏢 **Multi-empresa**: Sistema que soporta múltiples empresas con su propia lógica de negocio
- 📄 **Documentos de Negocio**: Las empresas pueden subir documentos con la lógica de cómo debe actuar la IA
- 📊 **Historial de Llamadas**: Registro completo de todas las conversaciones con transcripciones
- 📞 **Integración Twilio**: Soporte para recibir llamadas telefónicas reales (opcional)
- 👥 **Roles de Usuario**: 
  - **Administrador Supremo**: Gestiona empresas y usuarios
  - **Administrador de Empresa**: Sube documentos y ve llamadas de su empresa
  - **Cliente**: Usa el asistente de voz

## 🛠️ Tecnologías

### Backend
- **FastAPI** (Python) - Framework web
- **SQLAlchemy** (ORM) - Base de datos
- **Groq API** - Servicios de IA:
  - Whisper Large v3 (Speech-to-Text)
  - GPT OSS 120B (Text-to-Text)
  - PlayAI TTS (Text-to-Speech)
- **JWT** - Autenticación
- **Twilio** (Opcional) - Llamadas telefónicas

### Frontend
- **React** - Framework UI
- **Vite** - Build tool
- **React Router** - Navegación
- **Axios** - Cliente HTTP

## 📋 Requisitos Previos

- Python 3.8+ 
- Node.js 16+ y npm
- Cuenta de Groq con API Key (obtén una en [console.groq.com](https://console.groq.com))
- (Opcional) Cuenta de Twilio para llamadas telefónicas

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd hackaton
```

### 2. Configurar Backend

#### Paso 1: Navegar a la carpeta backend
```bash
cd backend
```

#### Paso 2: Crear entorno virtual
```bash
# Windows
python -m venv venv

# Linux/Mac
python3 -m venv venv
```

#### Paso 3: Activar entorno virtual
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

#### Paso 4: Instalar dependencias
```bash
pip install -r requirements.txt
```

#### Paso 5: Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# Requerido: API Key de Groq
GROQ_API_KEY=tu_api_key_de_groq

# Requerido: Secret key para JWT (genera una clave segura)
SECRET_KEY=tu_secret_key_segura_y_aleatoria

# Opcional: URL de base de datos (por defecto usa SQLite)
DATABASE_URL=sqlite:///./voice_assistant.db

# Opcional: Twilio (solo si quieres usar llamadas telefónicas)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_PHONE_NUMBER=tu_numero_twilio

# Opcional: URL base para webhooks de Twilio
BASE_URL=http://localhost:8000
```

**⚠️ IMPORTANTE**: 
- Obtén tu API Key de Groq en [console.groq.com](https://console.groq.com)
- Para usar PlayAI TTS, debes aceptar los términos en [console.groq.com/playground?model=playai-tts](https://console.groq.com/playground?model=playai-tts)
- Genera una `SECRET_KEY` segura (puedes usar: `openssl rand -hex 32`)

#### Paso 6: Inicializar base de datos

```bash
python init_db.py
```

Esto creará:
- La base de datos SQLite (`voice_assistant.db`)
- Un usuario administrador supremo con:
  - **Email**: `admin@example.com`
  - **Password**: `admin123`

**⚠️ IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión.

#### Paso 7: Ejecutar servidor backend

```bash
python main.py
```

El servidor estará disponible en `http://localhost:8000`

Puedes ver la documentación de la API en `http://localhost:8000/docs`

### 3. Configurar Frontend

#### Paso 1: Navegar a la carpeta frontend
```bash
cd frontend
```

#### Paso 2: Instalar dependencias
```bash
npm install
```

#### Paso 3: Ejecutar servidor de desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🎯 Uso

### Flujo de Trabajo

1. **Administrador Supremo**:
   - Inicia sesión con `admin@example.com` / `admin123`
   - Crea empresas desde el panel de administración
   - Crea usuarios administradores de empresa o clientes

2. **Administrador de Empresa**:
   - Se registra o es creado por el admin supremo
   - Sube un documento con la lógica de negocio de su empresa
   - Ve el historial de llamadas de su empresa

3. **Cliente**:
   - Se registra asociado a una empresa
   - Inicia una llamada desde el chat de voz
   - Graba audio, la IA procesa y responde con audio
   - Puede ver el historial de sus llamadas

### Documento de Lógica de Negocio

Las empresas deben subir un documento de texto (`.txt` o `.md`) con la lógica de negocio. Este documento debe contener:

- Instrucciones generales para el asistente
- Información sobre productos/servicios
- Políticas de la empresa
- Promociones actuales
- Información de contacto
- Cualquier contexto relevante para que la IA responda correctamente

**Ejemplo de estructura**:
```
Eres el asistente de voz de [Nombre de la Empresa].

Productos:
- Producto 1: Descripción y precio
- Producto 2: Descripción y precio

Políticas:
- Horarios de atención: Lunes a Viernes 9am-6pm
- Métodos de pago: Efectivo, tarjeta, transferencia

Promociones:
- Descuento del 20% en productos seleccionados

Contacto:
- Teléfono: +1234567890
- Email: contacto@empresa.com
```

La IA usará este documento para generar respuestas contextualizadas a las preguntas de los clientes.

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `GET /api/users` - Listar usuarios (solo super_admin)
- `POST /api/users` - Crear usuario (solo super_admin)

### Empresas
- `GET /api/companies` - Listar empresas (solo super_admin)
- `POST /api/companies` - Crear empresa (solo super_admin)
- `GET /api/companies/{id}` - Obtener empresa
- `PATCH /api/companies/{id}` - Actualizar empresa

### Documentos
- `POST /api/documents` - Subir documento (admin empresa)
- `GET /api/documents` - Listar documentos

### Llamadas
- `GET /api/calls` - Listar llamadas
- `GET /api/calls/{id}` - Detalle de llamada
- `POST /api/calls` - Crear llamada
- `PATCH /api/calls/{id}/end` - Finalizar llamada
- `POST /api/calls/{id}/messages` - Agregar mensaje

### Voz
- `POST /api/voice/process` - Procesar audio y obtener respuesta (público)
  - Requiere: `audio_file` (WebM), `company_identifier` (ID o nombre de empresa)
  - Opcional: `call_id` (para continuar una conversación)

### Twilio (Opcional)
- `POST /api/twilio/incoming` - Webhook para llamadas entrantes
- `POST /api/twilio/gather` - Procesar audio de Twilio
- `POST /api/twilio/status` - Estado de llamada

## 📁 Estructura del Proyecto

```
hackaton/
├── backend/
│   ├── main.py              # API principal FastAPI
│   ├── models.py            # Modelos de base de datos (SQLAlchemy)
│   ├── schemas.py           # Esquemas Pydantic para validación
│   ├── auth.py              # Autenticación JWT
│   ├── database.py          # Configuración de base de datos
│   ├── groq_service.py      # Servicio de integración con Groq
│   ├── twilio_service.py    # Servicio de integración con Twilio
│   ├── init_db.py           # Script para inicializar BD
│   ├── requirements.txt     # Dependencias Python
│   ├── .env                 # Variables de entorno (crear manualmente)
│   └── voice_assistant.db   # Base de datos SQLite (se crea automáticamente)
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── CompanyPanel.jsx
│   │   │   ├── VoiceChat.jsx
│   │   │   └── CallDetail.jsx
│   │   ├── api/
│   │   │   └── api.js        # Cliente API
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── main.jsx          # Punto de entrada
│   ├── package.json
│   └── vite.config.js       # Configuración de Vite
├── .gitignore
└── README.md
```

## 🔐 Seguridad

- Las contraseñas se almacenan con hash bcrypt
- Autenticación mediante JWT tokens
- Los tokens expiran después de 30 días
- El endpoint de voz es público pero requiere `company_identifier` válido

## ⚙️ Configuración Avanzada

### Cambiar Base de Datos

Para usar PostgreSQL en lugar de SQLite, actualiza `DATABASE_URL` en `.env`:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/voice_assistant
```

### Configurar Twilio

1. Crea una cuenta en [Twilio](https://www.twilio.com)
2. Obtén tu `Account SID` y `Auth Token`
3. Compra un número de teléfono
4. Configura los webhooks en Twilio:
   - Voice URL: `https://tu-dominio.com/api/twilio/incoming`
   - Status Callback: `https://tu-dominio.com/api/twilio/status`
5. Agrega las variables al `.env`

### Despliegue

#### Backend
- Usa un servidor WSGI como Gunicorn con Uvicorn workers
- Configura variables de entorno en producción
- Usa una base de datos PostgreSQL para producción

#### Frontend
```bash
cd frontend
npm run build
```

Los archivos estáticos estarán en `frontend/dist/`

## 🐛 Solución de Problemas

### Error: "GROQ_API_KEY no está configurada"
- Verifica que el archivo `.env` existe en `backend/`
- Asegúrate de que `GROQ_API_KEY` está configurada correctamente

### Error: "Error code: 401 - Invalid API Key" o "invalid_api_key"
Este error indica que tu API Key de Groq es inválida, ha expirado, o no tiene los permisos necesarios.

**Solución:**
1. Ve a [console.groq.com/keys](https://console.groq.com/keys) y verifica tu API Key
2. Si no tienes una, crea una nueva API Key
3. Abre el archivo `backend/.env` y actualiza la línea:
   ```env
   GROQ_API_KEY=tu_nueva_api_key_aqui
   ```
4. **Importante**: Asegúrate de que no haya espacios antes o después de la clave
5. Guarda el archivo `.env`
6. **Reinicia el servidor backend** completamente (detén y vuelve a iniciar)
7. Verifica que la API Key tenga acceso a los modelos necesarios:
   - `whisper-large-v3` (Speech-to-Text)
   - `openai/gpt-oss-120b` (Text-to-Text)
   - `playai-tts` (Text-to-Speech)

**Nota**: Si acabas de crear o actualizar la API Key, siempre reinicia el servidor backend para que los cambios surtan efecto.

### Error: "El modelo playai-tts requiere aceptar términos"
- Ve a [console.groq.com/playground?model=playai-tts](https://console.groq.com/playground?model=playai-tts)
- Acepta los términos de uso del modelo

### Error: "El archivo de audio está vacío"
- Asegúrate de grabar audio antes de enviar
- Verifica que el navegador tiene permisos de micrófono

### Error de CORS
- Verifica que el frontend está corriendo en `http://localhost:3000`
- El backend permite CORS desde `http://localhost:3000` y `http://localhost:5173`

## 📝 Notas Importantes

- **API Keys**: El sistema usa exclusivamente Groq para todos los servicios (Speech-to-Text, Text-to-Text, Text-to-Speech)
- **Base de Datos**: La base de datos se crea automáticamente al iniciar el servidor por primera vez
- **Formato de Audio**: El sistema acepta audio en formato WebM desde el navegador
- **Contexto de Conversación**: El sistema mantiene contexto JSON de la conversación para respuestas coherentes
- **Finalización de Llamadas**: El sistema detecta automáticamente cuando el usuario quiere terminar la conversación

## 📄 Licencia

Este proyecto es parte de un hackathon.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Desarrollado con ❤️ para el hackathon**
