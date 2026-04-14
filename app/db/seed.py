from app.db.session import SessionLocal
from app.models import Product, Employee
from app.utils.security import encrypt_data

def seed_database():
    db = SessionLocal()
    try:
        # Add default Employee
        print("Seeding database with default products and admin user...")
        if not db.query(Employee).filter(Employee.email == "towntech55@gmail.com").first():
            db.add(Employee(
                first_name="Town",
                last_name="Tech",
                email="towntech55@gmail.com",
                customer_type="Owner",
                is_active=True,
                password=encrypt_data("Admin123@")
            ))
            db.commit()
            print("Database seeded with default products and admin user.")

        if db.query(Product).first():
            return
        
        db.add(Product(
            name="Chicken Burger", category="Fast Food", price=250.0,
            image="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
        ))
        db.add(Product(
            name="Veg Pizza", category="Pizza", price=400.0,
            image="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
        ))
        db.add(Product(
            name="Cola", category="Beverage", price=60.0,
            image="https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
        ))
        db.add(Product(
            name="Masala Dosa", category="South Indian", price=120.0,
            image="https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60"
        ))
        db.add(Product(
            name="Mango Lassi", category="Beverage", price=80.0,
            image="https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&auto=format&fit=crop&q=60"
        ))
        db.add(Product(
            name="Paneer Tikka", category="Starters", price=220.0,
            image="https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&auto=format&fit=crop&q=60"
        ))
        db.commit()

    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
