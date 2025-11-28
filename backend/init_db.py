"""
Script para inicializar la base de datos y crear el primer usuario administrador
"""
from database import SessionLocal, engine, Base
from models import User
from auth import get_password_hash

Base.metadata.create_all(bind=engine)

def create_super_admin():
    db = SessionLocal()
    try:
        # Verificar si ya existe un admin
        existing_admin = db.query(User).filter(User.role == "super_admin").first()
        if existing_admin:
            print("Ya existe un administrador supremo en la base de datos.")
            return
        
        # Crear administrador supremo
        admin = User(
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            name="Administrador",
            role="super_admin"
        )
        db.add(admin)
        db.commit()
        print("✓ Administrador supremo creado exitosamente")
        print("  Email: admin@example.com")
        print("  Password: admin123")
        print("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión")
    except Exception as e:
        print(f"Error creando administrador: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Inicializando base de datos...")
    create_super_admin()
    print("\nBase de datos inicializada correctamente.")

