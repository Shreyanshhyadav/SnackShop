"""Run this once to seed products and create an admin user."""
import asyncio
from config import db
from auth import hash_password

PRODUCTS = [
    {"name": "Classic Salted Chips", "description": "Crispy salted potato chips", "price": 30, "category": "chips", "image_url": "https://placehold.co/300x300?text=Salted+Chips", "stock": 100},
    {"name": "Masala Chips", "description": "Spicy masala flavored chips", "price": 35, "category": "chips", "image_url": "https://placehold.co/300x300?text=Masala+Chips", "stock": 100},
    {"name": "Cream & Onion Chips", "description": "Cream and onion flavored chips", "price": 40, "category": "chips", "image_url": "https://placehold.co/300x300?text=Cream+Onion", "stock": 100},
    {"name": "BBQ Chips", "description": "Smoky BBQ flavored chips", "price": 45, "category": "chips", "image_url": "https://placehold.co/300x300?text=BBQ+Chips", "stock": 100},
    {"name": "Chocolate Biscuits", "description": "Rich chocolate cream biscuits", "price": 25, "category": "biscuits", "image_url": "https://placehold.co/300x300?text=Choco+Biscuits", "stock": 100},
    {"name": "Butter Cookies", "description": "Crunchy butter cookies", "price": 50, "category": "biscuits", "image_url": "https://placehold.co/300x300?text=Butter+Cookies", "stock": 100},
    {"name": "Cream Biscuits", "description": "Vanilla cream filled biscuits", "price": 20, "category": "biscuits", "image_url": "https://placehold.co/300x300?text=Cream+Biscuits", "stock": 100},
    {"name": "Digestive Biscuits", "description": "Healthy whole wheat biscuits", "price": 35, "category": "biscuits", "image_url": "https://placehold.co/300x300?text=Digestive", "stock": 100},
]

ADMIN = {
    "name": "Admin",
    "email": "admin@shop.com",
    "password": hash_password("admin123"),
    "role": "admin",
}


async def seed():
    # Clear existing
    await db.products.delete_many({})

    # Seed products
    await db.products.insert_many(PRODUCTS)
    print(f"Seeded {len(PRODUCTS)} products")

    # Create admin if not exists
    existing = await db.users.find_one({"email": ADMIN["email"]})
    if not existing:
        await db.users.insert_one(ADMIN)
        print("Admin user created: admin@shop.com / admin123")
    else:
        print("Admin already exists")


if __name__ == "__main__":
    asyncio.run(seed())
