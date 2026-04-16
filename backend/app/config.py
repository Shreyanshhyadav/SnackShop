import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = "ecommerce"
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

RAZORPAY_KEY_ID = "rzp_test_SdeuKN2N3BLCRH"
RAZORPAY_KEY_SECRET = "ZiEtqUU075CJ4fNeIFi24Ivb"


client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
