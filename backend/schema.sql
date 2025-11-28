-- ============================================
-- Esquema de Base de Datos - Voice Assistant
-- ============================================
-- Este archivo representa el estado completo de la base de datos
-- después de ejecutar todas las migraciones e inicializaciones
-- ============================================

-- Tabla: users
-- Almacena información de usuarios (super_admin, company_admin, client)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    role TEXT NOT NULL,  -- 'super_admin', 'company_admin', 'client'
    company_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Índices para users
CREATE INDEX IF NOT EXISTS ix_users_id ON users(id);
CREATE INDEX IF NOT EXISTS ix_users_email ON users(email);

-- Tabla: companies
-- Almacena información de empresas
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    identifier TEXT UNIQUE NOT NULL,  -- Identificador único para llamadas públicas
    business_logic TEXT,  -- Lógica de negocio, personalidad, catálogo, ofertas
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índices para companies
CREATE INDEX IF NOT EXISTS ix_companies_id ON companies(id);
CREATE INDEX IF NOT EXISTS ix_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS ix_companies_identifier ON companies(identifier);

-- Tabla: documents
-- Almacena documentos asociados a empresas
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Índices para documents
CREATE INDEX IF NOT EXISTS ix_documents_id ON documents(id);

-- Tabla: calls
-- Almacena información de llamadas
CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    client_id INTEGER,  -- Nullable para llamadas anónimas
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    rating INTEGER,  -- 1-5
    conversation_context TEXT,  -- JSON con contexto de conversación para GPT OSS 120B
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (client_id) REFERENCES users(id)
);

-- Índices para calls
CREATE INDEX IF NOT EXISTS ix_calls_id ON calls(id);

-- Tabla: call_messages
-- Almacena los mensajes de cada llamada
CREATE TABLE IF NOT EXISTS call_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id INTEGER NOT NULL,
    role TEXT NOT NULL,  -- 'client' o 'assistant'
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- Índices para call_messages
CREATE INDEX IF NOT EXISTS ix_call_messages_id ON call_messages(id);
CREATE INDEX IF NOT EXISTS ix_call_messages_call_id ON call_messages(call_id);

-- ============================================
-- Datos Iniciales
-- ============================================

-- Usuario administrador inicial (creado por init_db.py)
-- Email: admin@example.com
-- Password: admin123 (hash bcrypt)
-- NOTA: El hash real se genera con get_password_hash() en init_db.py
INSERT OR IGNORE INTO users (email, password_hash, name, role) 
VALUES (
    'admin@example.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqJqJqJqJq',  -- Hash de ejemplo, se genera dinámicamente
    'Administrador',
    'super_admin'
);

-- ============================================
-- Notas
-- ============================================
-- 
-- init_db.py:
--    - Crea el usuario super_admin si no existe
--    - Email: admin@example.com
--    - Password: admin123
--
-- ============================================

