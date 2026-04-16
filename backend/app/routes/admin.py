from fastapi import APIRouter, Depends
from bson import ObjectId
from ..config import db
from ..auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/customers")
async def get_customers(admin=Depends(require_admin)):
    customers = []
    async for u in db.users.find({"role": "customer"}):
        customers.append({"id": str(u["_id"]), "name": u["name"], "email": u["email"]})
    return customers


@router.get("/customers/{customer_id}/cart")
async def get_customer_cart(customer_id: str, admin=Depends(require_admin)):
    cart = await db.carts.find_one({"user_id": customer_id})
    if not cart or not cart.get("items"):
        return {"items": [], "total": 0}

    items = []
    total = 0
    for item in cart["items"]:
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            line = {
                "product_id": item["product_id"],
                "product_name": product["name"],
                "price": product["price"],
                "quantity": item["quantity"],
                "image_url": product.get("image_url", ""),
            }
            items.append(line)
            total += product["price"] * item["quantity"]
    return {"items": items, "total": round(total, 2)}


@router.get("/orders")
async def get_all_orders(admin=Depends(require_admin)):
    orders = []
    async for o in db.orders.find().sort("created_at", -1):
        orders.append({
            "id": str(o["_id"]),
            "user_name": o.get("user_name", ""),
            "user_email": o.get("user_email", ""),
            "items": o.get("items", []),
            "total": o.get("total", 0),
            "status": o.get("status", ""),
            "created_at": o.get("created_at", ""),
        })
    return orders


@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, body: dict, admin=Depends(require_admin)):
    status = body.get("status", "")
    if status not in ("pending", "paid", "shipped", "delivered", "cancelled"):
        return {"error": "Invalid status"}
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status}}
    )
    return {"message": "Status updated", "status": status}


@router.get("/customers/{customer_id}/orders")
async def get_customer_orders(customer_id: str, admin=Depends(require_admin)):
    orders = []
    async for o in db.orders.find({"user_id": customer_id}).sort("created_at", -1):
        orders.append({
            "id": str(o["_id"]),
            "items": o.get("items", []),
            "total": o.get("total", 0),
            "status": o.get("status", ""),
            "created_at": o.get("created_at", ""),
        })
    return orders
