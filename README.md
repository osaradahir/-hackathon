# Asistente de Voz IA

Sistema de asistente de voz inteligente que permite a empresas configurar su lógica de negocio y ofrecer asistencia por voz a sus clientes usando modelos de Groq.

## Características

- 🎤 **Asistente de Voz**: Conversación por voz usando Speech-to-Text, Text-to-Text y Text-to-Speech
- 🏢 **Multi-empresa**: Sistema que soporta múltiples empresas con su propia lógica de negocio
- 📄 **Documentos de Negocio**: Las empresas pueden subir documentos con la lógica de cómo debe actuar la IA
- 📊 **Historial de Llamadas**: Registro completo de todas las conversaciones con transcripciones
- 👥 **Roles de Usuario**: 
  - Administrador Supremo: Gestiona empresas
  - Administrador de Empresa: Sube documentos y ve llamadas de su empresa
  - Cliente: Usa el asistente de voz

## Tecnologías

### Backend
- FastAPI (Python)
- SQLAlchemy (ORM)
- Groq API (Whisper Large v3, GPT OSS 120B, PlayAI TTS)
- JWT para autenticación

### Frontend
- React
- Vite
- React Router
- Axios

## Instalación

### Backend

1. Navega a la carpeta backend:
```bash
cd backend
```

2. Crea un entorno virtual:
```bash
python -m venv venv
```

3. Activa el entorno virtual:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Instala las dependencias:
```bash
pip install -r requirements.txt
```

5. Crea un archivo `.env` en la carpeta backend:
```env
GROQ_API_KEY=tu_api_key_de_groq
SECRET_KEY=tu_secret_key_segura
DATABASE_URL=sqlite:///./voice_assistant.db
```

**Nota**: Solo necesitas la API key de Groq. El sistema usa Groq para todos los servicios (Speech-to-Text, Text-to-Text con GPT OSS 120B, y Text-to-Speech).

6. Ejecuta el servidor:
```bash
python main.py
```

El servidor estará disponible en `http://localhost:8000`

### Frontend

1. Navega a la carpeta frontend:
```bash
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Ejecuta el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Uso

### Inicializar Base de Datos

Primero, inicializa la base de datos y crea el primer usuario administrador:

```bash
cd backend
python init_db.py
```

Esto creará un usuario administrador supremo con:
- Email: `admin@example.com`
- Password: `admin123`

**⚠️ IMPORTANTE**: Cambia la contraseña después del primer inicio de sesión.

### Alternativa: Crear Usuario Administrador Manualmente

También puedes crear un usuario administrador usando el endpoint de registro:

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "name": "Admin",
    "role": "super_admin"
  }'
```

### Flujo de Trabajo

1. **Administrador Supremo**:
   - Inicia sesión
   - Crea empresas desde el panel de administración

2. **Administrador de Empresa**:
   - Se registra o es creado por el admin supremo
   - Sube un documento con la lógica de negocio de su empresa
   - Ve el historial de llamadas de su empresa

3. **Cliente**:
   - Se registra asociado a una empresa
   - Inicia una llamada desde el chat de voz
   - Graba audio, la IA procesa y responde con audio
   - Puede ver el historial de sus llamadas

## Estructura del Proyecto

```
hackaton/
├── backend/
│   ├── main.py              # API principal
│   ├── models.py            # Modelos de base de datos
│   ├── schemas.py           # Esquemas Pydantic
│   ├── auth.py              # Autenticación JWT
│   ├── database.py          # Configuración de BD
│   ├── groq_service.py      # Servicio de integración con Groq
│   └── requirements.txt     # Dependencias Python
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas de la aplicación
│   │   ├── components/      # Componentes reutilizables
│   │   ├── api/             # Cliente API
│   │   └── context/         # Contextos de React
│   └── package.json
└── README.md
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Empresas
- `GET /api/companies` - Listar empresas (solo admin)
- `POST /api/companies` - Crear empresa (solo admin)
- `GET /api/companies/{id}` - Obtener empresa

### Documentos
- `POST /api/documents` - Subir documento (admin empresa)
- `GET /api/documents` - Listar documentos

### Llamadas
- `GET /api/calls` - Listar llamadas
- `GET /api/calls/{id}` - Detalle de llamada
- `POST /api/calls` - Crear llamada
- `PATCH /api/calls/{id}/end` - Finalizar llamada

### Voz
- `POST /api/voice/process` - Procesar audio y obtener respuesta

## Notas Importantes

- **API Keys**: El sistema usa exclusivamente Groq para todos los servicios. Solo necesitas configurar `GROQ_API_KEY` en tu archivo `.env`. El sistema intenta usar el modelo GPT OSS 120B para las respuestas de texto.
- **Base de Datos**: La base de datos se crea automáticamente al iniciar el servidor por primera vez.
- **Documentos de Negocio**: Las empresas deben subir un documento de texto (.txt, .md) con la lógica de negocio. Puedes usar `backend/example_business_logic.txt` como referencia.
- **Formato de Audio**: El sistema acepta audio en formato WebM. Asegúrate de que el navegador soporte la grabación de audio.

## Ejemplo de Documento de Lógica de Negocio

El archivo `backend/example_business_logic.txt` contiene un ejemplo de cómo estructurar el documento que las empresas deben subir. Este documento debe contener:
- Instrucciones generales para el asistente
- Información sobre productos/servicios
- Políticas de la empresa
- Promociones actuales
- Información de contacto

La IA usará este documento para generar respuestas contextualizadas a las preguntas de los clientes.

## Licencia

Este proyecto es parte de un hackathon.

