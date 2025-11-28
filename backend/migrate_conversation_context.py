"""
Script para migrar la base de datos y agregar el campo conversation_context a la tabla calls
"""
from sqlalchemy import text
from database import engine

def migrate_calls_table():
    """Agregar columna conversation_context a la tabla calls"""
    with engine.connect() as conn:
        try:
            # Verificar si la columna ya existe
            result = conn.execute(text("PRAGMA table_info(calls)"))
            columns = [row[1] for row in result]
            
            # Agregar conversation_context si no existe
            if 'conversation_context' not in columns:
                print("Agregando columna 'conversation_context'...")
                conn.execute(text("ALTER TABLE calls ADD COLUMN conversation_context TEXT"))
                conn.commit()
                print("✓ Columna 'conversation_context' agregada")
            else:
                print("Columna 'conversation_context' ya existe")
            
            print("\n✓ Migración completada exitosamente")
            
        except Exception as e:
            print(f"Error durante la migración: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("Iniciando migración de base de datos...")
    migrate_calls_table()
    print("\nBase de datos actualizada correctamente.")

