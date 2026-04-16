import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGO_URL, DB_NAME
from seed_data import products
from app.auth import hash_password


async def seed():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Clear existing products
    await db.products.delete_many({})
    print(f"Cleared existing products")

    # Insert all products
    if products:
        await db.products.insert_many(products)
    print(f"Seeded {len(products)} products")

    # Create admin user if not exists
    existing = await db.users.find_one({"email": "admin@shop.com"})
    if not existing:
        await db.users.insert_one({
            "name": "Admin",
            "email": "admin@shop.com",
            "password": hash_password("admin123"),
            "role": "admin",
        })
        print("Admin user created: admin@shop.com / admin123")
    else:
        print("Admin user already exists")

    client.close()


asyncio.run(seed())
