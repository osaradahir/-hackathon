from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    COMPANY_ADMIN = "company_admin"
    CLIENT = "client"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    name = Column(String)
    phone = Column(String, nullable=True)
    role = Column(String)  # super_admin, company_admin, client
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="users")
    calls = relationship("Call", back_populates="client")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    identifier = Column(String, unique=True, index=True)  # Identificador único para llamadas públicas
    description = Column(Text, nullable=True)
    business_logic = Column(Text, nullable=True)  # Lógica de negocio, personalidad, catálogo, ofertas
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="company")
    documents = relationship("Document", back_populates="company")
    calls = relationship("Call", back_populates="company")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    filename = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="documents")

class Call(Base):
    __tablename__ = "calls"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    client_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable para llamadas anónimas
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    rating = Column(Integer, nullable=True)  # 1-5
    conversation_context = Column(Text, nullable=True)  # JSON con el contexto de conversación para GPT OSS 120B
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="calls")
    client = relationship("User", back_populates="calls")
    messages = relationship("CallMessage", back_populates="call", cascade="all, delete-orphan")

class CallMessage(Base):
    __tablename__ = "call_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"))
    role = Column(String)  # client, assistant
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    call = relationship("Call", back_populates="messages")

