from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
import os
from dotenv import load_dotenv

from database import SessionLocal, engine, Base
from models import User, Company, Document, Call, CallMessage
from schemas import (
    UserCreate, UserLogin, CompanyUserCreate, CompanyCreate, CompanyUpdate, DocumentCreate,
    CallCreate, CallMessageCreate, CallResponse, CallDetailResponse, UserResponse
)
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from groq_service import GroqService
from twilio_service import TwilioService
from fastapi.responses import Response

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Voice Assistant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

groq_service = GroqService()
twilio_service = TwilioService()

# ==================== AUTH ====================

@app.post("/api/auth/register")
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Crear usuario
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role,
        company_id=user_data.company_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "role": user.role,
            "company_id": user.company_id
        }
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
            "role": user.role,
            "company_id": user.company_id
        }
    }

@app.get("/api/auth/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "phone": current_user.phone,
        "role": current_user.role,
        "company_id": current_user.company_id
    }

# ==================== USERS ====================

@app.post("/api/users")
async def create_user(
    user_data: CompanyUserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un usuario de empresa (solo super_admin)"""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Verificar si el email ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Verificar que la empresa existe
    company = db.query(Company).filter(Company.id == user_data.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Validar el rol (solo company_admin o client)
    role = user_data.role or "company_admin"
    if role not in ["company_admin", "client"]:
        raise HTTPException(status_code=400, detail="Rol inválido. Debe ser 'company_admin' o 'client'")
    
    # Crear usuario con el rol especificado
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        password_hash=hashed_password,
        name=user_data.name,
        phone=user_data.phone,
        role=role,
        company_id=user_data.company_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        role=user.role,
        company_id=user.company_id
    )

@app.get("/api/users")
async def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    company_id: Optional[int] = None
):
    """Listar usuarios (solo super_admin)"""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    query = db.query(User)
    if company_id:
        query = query.filter(User.company_id == company_id)
    
    users = query.all()
    return [UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone,
        role=user.role,
        company_id=user.company_id
    ) for user in users]

# ==================== COMPANIES ====================

@app.get("/api/companies")
async def get_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    companies = db.query(Company).all()
    return companies

@app.post("/api/companies")
async def create_company(
    company_data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Verificar si el identifier ya existe
    existing_company = db.query(Company).filter(Company.identifier == company_data.identifier).first()
    if existing_company:
        raise HTTPException(status_code=400, detail="El identificador ya está en uso")
    
    company = Company(**company_data.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@app.get("/api/companies/{company_id}")
async def get_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar permisos
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    return company

@app.patch("/api/companies/{company_id}")
async def update_company(
    company_id: int,
    company_data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar empresa (solo super_admin o company_admin de esa empresa)"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    
    # Verificar permisos
    if current_user.role != "super_admin" and current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    # Actualizar solo los campos proporcionados
    update_data = company_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        # Validar que el campo existe en el modelo Company
        if hasattr(company, field):
            setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    return company

# ==================== DOCUMENTS ====================

@app.post("/api/documents")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "company_admin":
        raise HTTPException(status_code=403, detail="Solo administradores de empresa pueden subir documentos")
    
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="Usuario no asociado a una empresa")
    
    # Leer contenido del archivo
    content = await file.read()
    content_text = content.decode('utf-8')
    
    # Crear documento
    document = Document(
        company_id=current_user.company_id,
        filename=file.filename,
        content=content_text
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document

@app.get("/api/documents")
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "super_admin":
        documents = db.query(Document).all()
    elif current_user.role == "company_admin" and current_user.company_id:
        documents = db.query(Document).filter(Document.company_id == current_user.company_id).all()
    else:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    return documents

# ==================== CALLS ====================

@app.post("/api/calls")
async def create_call(
    call_data: CallCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "client":
        raise HTTPException(status_code=403, detail="Solo clientes pueden crear llamadas")
    
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="Cliente no asociado a una empresa")
    
    call = Call(
        company_id=current_user.company_id,
        client_id=current_user.id,
        start_time=call_data.start_time
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    
    return call

@app.get("/api/calls")
async def get_calls(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "super_admin":
        calls = db.query(Call).all()
    elif current_user.role == "company_admin" and current_user.company_id:
        calls = db.query(Call).filter(Call.company_id == current_user.company_id).order_by(Call.start_time.desc()).all()
    elif current_user.role == "client":
        calls = db.query(Call).filter(Call.client_id == current_user.id).order_by(Call.start_time.desc()).all()
    else:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    from schemas import CallResponse
    return [CallResponse(
        id=call.id,
        company_id=call.company_id,
        client_id=call.client_id,
        start_time=call.start_time,
        end_time=call.end_time,
        rating=call.rating
    ) for call in calls]

@app.get("/api/calls/{call_id}")
async def get_call_detail(
    call_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Llamada no encontrada")
    
    # Verificar permisos
    if current_user.role == "client" and call.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if current_user.role == "company_admin" and call.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    messages = db.query(CallMessage).filter(CallMessage.call_id == call_id).order_by(CallMessage.timestamp).all()
    
    from schemas import CallMessageResponse
    return CallDetailResponse(
        id=call.id,
        company_id=call.company_id,
        client_id=call.client_id,
        start_time=call.start_time,
        end_time=call.end_time,
        rating=call.rating,
        conversation_context=getattr(call, 'conversation_context', None),
        client_name=call.client.name if call.client else None,
        client_phone=call.client.phone if call.client else None,
        messages=[CallMessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            timestamp=msg.timestamp
        ) for msg in messages]
    )

@app.post("/api/calls/{call_id}/messages")
async def add_message(
    call_id: int,
    message_data: CallMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Llamada no encontrada")
    
    message = CallMessage(
        call_id=call_id,
        role=message_data.role,
        content=message_data.content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message

@app.patch("/api/calls/{call_id}/end")
async def end_call(
    call_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    rating: int = Query(None)
):
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Llamada no encontrada")
    
    from datetime import datetime
    call.end_time = datetime.utcnow()
    if rating is not None:
        call.rating = rating
    db.commit()
    db.refresh(call)
    
    return call

# ==================== VOICE ASSISTANT ====================

@app.post("/api/voice/process")
async def process_voice(
    audio_file: UploadFile = File(...),
    call_id: Optional[str] = Form(None),
    company_identifier: str = Form(...),  # ID o nombre de la empresa - REQUERIDO
    db: Session = Depends(get_db)
):
    """Endpoint público para procesar audio. No requiere autenticación."""
    
    if not company_identifier or not company_identifier.strip():
        raise HTTPException(status_code=400, detail="company_identifier es requerido")
    
    # Buscar la empresa por identificador único, ID o nombre
    company = None
    # Primero buscar por identifier (campo único)
    company = db.query(Company).filter(Company.identifier == company_identifier.strip()).first()
    
    if not company:
        # Si no se encuentra por identifier, intentar por ID
        try:
            company_id = int(company_identifier)
            company = db.query(Company).filter(Company.id == company_id).first()
        except ValueError:
            pass
    
    if not company:
        # Si no se encuentra por ID, buscar por nombre
        company = db.query(Company).filter(Company.name == company_identifier).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Empresa no encontrada. Verifica el identificador.")
    
    # Convertir call_id a int si existe
    call_id_int = None
    if call_id and call_id.strip():
        try:
            call_id_int = int(call_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="call_id inválido")
    
    # Obtener o crear llamada (sin cliente asociado)
    if call_id_int is None:
        from datetime import datetime
        call = Call(
            company_id=company.id,
            client_id=None,  # Llamada anónima
            start_time=datetime.utcnow()
        )
        db.add(call)
        db.commit()
        db.refresh(call)
        call_id_int = call.id
    else:
        call = db.query(Call).filter(Call.id == call_id_int).first()
        if not call:
            raise HTTPException(status_code=404, detail="Llamada no encontrada")
        # Verificar que la llamada pertenece a la empresa correcta
        if call.company_id != company.id:
            raise HTTPException(status_code=400, detail="La llamada no pertenece a esta empresa")
        call_id_int = call.id
    
    # Obtener lógica de negocio de la empresa
    if not company.business_logic:
        raise HTTPException(status_code=400, detail="La empresa no tiene lógica de negocio configurada")
    
    business_logic = company.business_logic
    
    # Leer audio
    audio_data = await audio_file.read()
    
    # Validar que el audio tenga contenido
    if not audio_data or len(audio_data) == 0:
        raise HTTPException(status_code=400, detail="El archivo de audio está vacío. Asegúrate de grabar audio antes de enviar.")
    
    if len(audio_data) < 100:  # Mínimo ~100 bytes (muy pequeño)
        raise HTTPException(status_code=400, detail="El archivo de audio es demasiado corto. Graba al menos 0.01 segundos de audio.")
    
    # Procesar con Groq
    try:
        # 1. Speech to Text (Whisper)
        transcript = await groq_service.speech_to_text(audio_data)
        
        # Guardar mensaje del cliente
        client_message = CallMessage(
            call_id=call_id_int,
            role="client",
            content=transcript
        )
        db.add(client_message)
        db.commit()
        db.refresh(client_message)
        
        # Obtener la llamada y su contexto JSON
        call = db.query(Call).filter(Call.id == call_id_int).first()
        
        # 2. Text to Text (GPT OSS 120B) con la lógica de negocio y el contexto JSON
        response_text, context_json, should_end_call = await groq_service.text_to_text(
            transcript, 
            business_logic,
            conversation_context_json=call.conversation_context if call else None
        )
        
        # Guardar mensaje del asistente
        assistant_message = CallMessage(
            call_id=call_id_int,
            role="assistant",
            content=response_text
        )
        db.add(assistant_message)
        
        # Actualizar el contexto JSON en la llamada
        if call:
            call.conversation_context = context_json
            
            # Si el usuario quiere terminar, marcar la llamada como finalizada
            if should_end_call:
                from datetime import datetime
                call.end_time = datetime.utcnow()
        
        db.commit()
        
        # 3. Text to Speech (PlayAI TTS)
        audio_response = await groq_service.text_to_speech(response_text)
        
        return {
            "call_id": call_id_int,
            "transcript": transcript,
            "response_text": response_text,
            "audio_response": audio_response,  # Base64 encoded audio
            "call_ended": should_end_call  # Indica si la conversación terminó
        }
    except Exception as e:
        import traceback
        error_detail = f"Error procesando audio: {str(e)}"
        print(f"Error completo: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)


# ==================== TWILIO INTEGRATION ====================

@app.post("/api/twilio/incoming")
async def twilio_incoming_call(
    From: str = Form(None),
    To: str = Form(None),
    CallSid: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint para recibir llamadas entrantes de Twilio
    Twilio llama a este endpoint cuando alguien llama al número de Twilio
    """
    try:
        # Obtener el número de teléfono del que llama
        caller_number = From or "Unknown"
        called_number = To or "Unknown"
        call_sid = CallSid or "Unknown"
        
        print(f"📞 Llamada entrante de {caller_number} a {called_number} (SID: {call_sid})")
        
        # Buscar empresa por número de teléfono de Twilio (puedes configurar qué número corresponde a qué empresa)
        # Por ahora, vamos a usar la primera empresa o una lógica específica
        # Puedes configurar un mapeo de números Twilio a empresas en la base de datos
        
        company = db.query(Company).first()  # Por ahora usar la primera empresa
        
        if not company:
            twiml = twilio_service.generate_twiml_for_call(
                "Lo sentimos, no hay empresas configuradas en el sistema.",
                gather=False
            )
            return Response(content=twiml, media_type="application/xml")
        
        # Crear una nueva llamada en la base de datos
        from datetime import datetime
        call = Call(
            company_id=company.id,
            client_id=None,  # Llamada telefónica anónima
            start_time=datetime.utcnow()
        )
        db.add(call)
        db.commit()
        db.refresh(call)
        
        # Guardar el CallSid de Twilio para referencia futura (podrías agregar un campo twilio_call_sid al modelo Call)
        print(f"✅ Llamada creada en BD: Call ID {call.id} para empresa {company.name}")
        
        # Generar mensaje de bienvenida usando la lógica de negocio
        welcome_message = f"Hola, bienvenido a {company.name}. ¿En qué puedo ayudarte hoy?"
        
        # Generar TwiML con Gather para recibir respuesta del usuario
        action_url = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/api/twilio/gather?call_id={call.id}"
        twiml = twilio_service.generate_twiml_for_call(
            welcome_message,
            gather=True,
            action_url=action_url
        )
        
        return Response(content=twiml, media_type="application/xml")
    
    except Exception as e:
        import traceback
        print(f"❌ Error en twilio_incoming_call: {traceback.format_exc()}")
        error_twiml = twilio_service.generate_twiml_for_call(
            "Lo sentimos, ha ocurrido un error. Por favor, intenta más tarde.",
            gather=False
        )
        return Response(content=error_twiml, media_type="application/xml")


@app.post("/api/twilio/gather")
async def twilio_gather_audio(
    SpeechResult: str = Form(None),
    call_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint para procesar el audio recibido de Twilio (usando speech recognition de Twilio)
    Twilio ya convierte el audio a texto usando su propio servicio de speech-to-text
    """
    try:
        # Obtener la llamada
        call = db.query(Call).filter(Call.id == call_id).first()
        if not call:
            twiml = twilio_service.generate_twiml_for_call(
                "Error: Llamada no encontrada.",
                gather=False
            )
            return Response(content=twiml, media_type="application/xml")
        
        company = db.query(Company).filter(Company.id == call.company_id).first()
        if not company or not company.business_logic:
            twiml = twilio_service.generate_twiml_for_call(
                "Error: Empresa no encontrada o sin configuración.",
                gather=False
            )
            return Response(content=twiml, media_type="application/xml")
        
        # Twilio ya convirtió el audio a texto
        user_message = SpeechResult or ""
        
        if not user_message or user_message.strip() == "":
            # Si no hay mensaje, pedir de nuevo
            action_url = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/api/twilio/gather?call_id={call_id}"
            twiml = twilio_service.generate_twiml_for_call(
                "No pude escucharte. Por favor, repite tu pregunta.",
                gather=True,
                action_url=action_url
            )
            return Response(content=twiml, media_type="application/xml")
        
        print(f"💬 Mensaje recibido de Twilio (Call {call_id}): {user_message}")
        
        # Guardar mensaje del usuario
        user_call_message = CallMessage(
            call_id=call_id,
            role="user",
            content=user_message
        )
        db.add(user_call_message)
        
        # Obtener contexto de conversación
        conversation_context_json = call.conversation_context if hasattr(call, 'conversation_context') else None
        
        # Procesar con Groq (text-to-text)
        response_text, context_json, should_end_call = await groq_service.text_to_text(
            user_message,
            company.business_logic,
            conversation_context_json=conversation_context_json
        )
        
        print(f"🤖 Respuesta del asistente: {response_text}")
        
        # Guardar mensaje del asistente
        assistant_message = CallMessage(
            call_id=call_id,
            role="assistant",
            content=response_text
        )
        db.add(assistant_message)
        
        # Actualizar contexto de conversación
        call.conversation_context = context_json
        
        # Si la conversación debe terminar, finalizar la llamada
        if should_end_call:
            from datetime import datetime
            call.end_time = datetime.utcnow()
            db.commit()
            
            twiml = twilio_service.generate_twiml_for_call(
                response_text,
                gather=False
            )
            return Response(content=twiml, media_type="application/xml")
        
        db.commit()
        
        # Generar respuesta con Gather para continuar la conversación
        action_url = f"{os.getenv('BASE_URL', 'http://localhost:8000')}/api/twilio/gather?call_id={call_id}"
        twiml = twilio_service.generate_twiml_for_call(
            response_text,
            gather=True,
            action_url=action_url
        )
        
        return Response(content=twiml, media_type="application/xml")
    
    except Exception as e:
        import traceback
        print(f"❌ Error en twilio_gather_audio: {traceback.format_exc()}")
        error_twiml = twilio_service.generate_twiml_for_call(
            "Lo sentimos, ha ocurrido un error procesando tu mensaje. Por favor, intenta de nuevo.",
            gather=False
        )
        return Response(content=error_twiml, media_type="application/xml")


@app.post("/api/twilio/status")
async def twilio_call_status(
    CallSid: str = Form(None),
    CallStatus: str = Form(None),
    CallDuration: str = Form(None),
    db: Session = Depends(get_db)
):
    """
    Webhook para recibir actualizaciones del estado de la llamada (cuando termina, etc.)
    """
    try:
        print(f"📊 Estado de llamada Twilio - SID: {CallSid}, Status: {CallStatus}, Duration: {CallDuration}")
        
        # Aquí podrías actualizar el estado de la llamada en la BD si tienes un campo para el CallSid
        # Por ahora solo logueamos
        
        return Response(content="OK", media_type="text/plain")
    
    except Exception as e:
        print(f"❌ Error en twilio_call_status: {str(e)}")
        return Response(content="OK", media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

