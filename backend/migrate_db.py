"""
Script para migrar la base de datos y agregar las nuevas columnas a la tabla companies
"""
from sqlalchemy import text
from database import engine

def migrate_companies_table():
    """Agregar columnas identifier y business_logic a la tabla companies"""
    with engine.connect() as conn:
        try:
            # Verificar si las columnas ya existen
            result = conn.execute(text("PRAGMA table_info(companies)"))
            columns = [row[1] for row in result]
            
            # Agregar identifier si no existe
            if 'identifier' not in columns:
                print("Agregando columna 'identifier'...")
                conn.execute(text("ALTER TABLE companies ADD COLUMN identifier TEXT"))
                conn.commit()
                print("✓ Columna 'identifier' agregada")
            else:
                print("Columna 'identifier' ya existe")
            
            # Agregar business_logic si no existe
            if 'business_logic' not in columns:
                print("Agregando columna 'business_logic'...")
                conn.execute(text("ALTER TABLE companies ADD COLUMN business_logic TEXT"))
                conn.commit()
                print("✓ Columna 'business_logic' agregada")
            else:
                print("Columna 'business_logic' ya existe")
            
            # Crear índice único para identifier si no existe
            try:
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_companies_identifier ON companies(identifier)"))
                conn.commit()
                print("✓ Índice único para 'identifier' creado")
            except Exception as e:
                print(f"Nota sobre índice: {e}")
            
            print("\n✓ Migración completada exitosamente")
            
        except Exception as e:
            print(f"Error durante la migración: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("Iniciando migración de base de datos...")
    migrate_companies_table()
    print("\nBase de datos actualizada correctamente.")

