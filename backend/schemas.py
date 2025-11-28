from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: str
    company_id: Optional[int] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    phone: Optional[str]
    role: str
    company_id: Optional[int]
    
    class Config:
        from_attributes = True

class CompanyUserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    company_id: int
    role: Optional[str] = "company_admin"  # Por defecto company_admin, pero puede ser "client"

# Company Schemas
class CompanyCreate(BaseModel):
    name: str
    identifier: str  # Identificador único para llamadas públicas (ej: "mi-empresa-123")
    business_logic: Optional[str] = None  # Lógica de negocio, personalidad, catálogo, ofertas

class CompanyResponse(BaseModel):
    id: int
    name: str
    identifier: str
    business_logic: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    business_logic: Optional[str] = None

# Document Schemas
class DocumentCreate(BaseModel):
    filename: str
    content: str

class DocumentResponse(BaseModel):
    id: int
    company_id: int
    filename: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Call Schemas
class CallCreate(BaseModel):
    start_time: Optional[datetime] = None

class CallMessageCreate(BaseModel):
    role: str
    content: str

class CallMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

class CallResponse(BaseModel):
    id: int
    company_id: int
    client_id: Optional[int]  # Opcional para llamadas anónimas
    start_time: datetime
    end_time: Optional[datetime]
    rating: Optional[int]
    
    class Config:
        from_attributes = True

class CallDetailResponse(BaseModel):
    id: int
    company_id: int
    client_id: Optional[int]
    start_time: datetime
    end_time: Optional[datetime]
    rating: Optional[int]
    conversation_context: Optional[str]  # JSON con el contexto de conversación para GPT OSS 120B
    client_name: Optional[str]
    client_phone: Optional[str]
    messages: List[CallMessageResponse]

