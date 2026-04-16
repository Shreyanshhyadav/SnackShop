import hmac
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
import razorpay
from ..config import db, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
from ..models import PaymentCreate, PaymentVerify
from ..auth import get_current_user

router = APIRouter(prefix="/api/payment", tags=["Payment"])

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@router.post("/create-order")
async def create_order(data: PaymentCreate, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    cart = await db.carts.find_one({"user_id": user_id})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Calculate total from cart
    total = 0
    items = []
    for item in cart["items"]:
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            total += product["price"] * item["quantity"]
            items.append({
                "product_id": item["product_id"],
                "product_name": product["name"],
                "price": product["price"],
                "quantity": item["quantity"],
                "image_url": product.get("image_url", ""),
            })

    amount_paise = int(round(total, 2) * 100)

    # Create real Razorpay order
    razorpay_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "payment_capture": 1,
    })

    # Save order to DB
    order = {
        "user_id": user_id,
        "user_name": user["name"],
        "user_email": user["email"],
        "items": items,
        "total": round(total, 2),
        "amount_paise": amount_paise,
        "razorpay_order_id": razorpay_order["id"],
        "status": "created",
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.orders.insert_one(order)

    return {
        "order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
        "db_order_id": str(result.inserted_id),
    }


@router.post("/verify")
async def verify_payment(data: PaymentVerify, user=Depends(get_current_user)):
    user_id = str(user["_id"])

    # Verify Razorpay signature
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.order_id,
            "razorpay_payment_id": data.payment_id,
            "razorpay_signature": data.signature,
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment verification failed")

    # Mark order as paid
    await db.orders.update_one(
        {"razorpay_order_id": data.order_id},
        {"$set": {"status": "paid", "razorpay_payment_id": data.payment_id}},
    )

    # Decrement stock for each item
    order = await db.orders.find_one({"razorpay_order_id": data.order_id})
    if order:
        for item in order.get("items", []):
            await db.products.update_one(
                {"_id": ObjectId(item["product_id"])},
                {"$inc": {"stock": -item["quantity"]}}
            )

    # Clear cart
    await db.carts.delete_one({"user_id": user_id})

    return {"message": "Payment successful", "status": "paid"}


@router.get("/orders")
async def get_my_orders(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    orders = []
    async for o in db.orders.find({"user_id": user_id}).sort("created_at", -1):
        orders.append({
            "id": str(o["_id"]),
            "user_id": o.get("user_id", ""),
            "user_name": o.get("user_name", ""),
            "user_email": o.get("user_email", ""),
            "items": o.get("items", []),
            "total": o.get("total", 0),
            "status": o.get("status", ""),
            "razorpay_order_id": o.get("razorpay_order_id", ""),
            "created_at": o.get("created_at", ""),
        })
    return orders
