import asyncio
from app.config import db

async def check():
    count = await db.products.count_documents({})
    print(f"Product count: {count}")
    async for p in db.products.find().limit(2):
        print(p)

asyncio.run(check())
