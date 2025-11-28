"""
Script para actualizar empresas existentes con identificadores únicos
"""
from sqlalchemy import text
from database import engine

def update_existing_companies():
    """Agregar identificadores a empresas que no los tienen"""
    with engine.connect() as conn:
        try:
            # Obtener empresas sin identifier
            result = conn.execute(text("SELECT id, name FROM companies WHERE identifier IS NULL OR identifier = ''"))
            companies = result.fetchall()
            
            if not companies:
                print("Todas las empresas ya tienen identificadores")
                return
            
            print(f"Encontradas {len(companies)} empresas sin identificador")
            
            for company_id, company_name in companies:
                # Generar un identificador basado en el nombre (slug)
                import re
                identifier = re.sub(r'[^a-z0-9]+', '-', company_name.lower().strip())
                identifier = re.sub(r'-+', '-', identifier).strip('-')
                identifier = identifier[:50]  # Limitar longitud
                
                # Si está vacío, usar el ID
                if not identifier:
                    identifier = f"empresa-{company_id}"
                
                # Asegurar que sea único
                counter = 1
                original_identifier = identifier
                while True:
                    check = conn.execute(
                        text("SELECT COUNT(*) FROM companies WHERE identifier = :identifier"),
                        {"identifier": identifier}
                    ).scalar()
                    if check == 0:
                        break
                    identifier = f"{original_identifier}-{counter}"
                    counter += 1
                
                # Actualizar la empresa
                conn.execute(
                    text("UPDATE companies SET identifier = :identifier WHERE id = :id"),
                    {"identifier": identifier, "id": company_id}
                )
                print(f"✓ Empresa '{company_name}' (ID: {company_id}) -> identificador: '{identifier}'")
            
            conn.commit()
            print(f"\n✓ {len(companies)} empresas actualizadas exitosamente")
            
        except Exception as e:
            print(f"Error actualizando empresas: {e}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("Actualizando empresas existentes...")
    update_existing_companies()
    print("\nProceso completado.")

