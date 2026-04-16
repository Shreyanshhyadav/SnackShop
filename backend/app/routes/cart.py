from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from ..config import db
from ..models import CartItem
from ..auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Cart"])


@router.get("")
async def get_cart(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    cart = await db.carts.find_one({"user_id": user_id})
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


@router.post("/add")
async def add_to_cart(item: CartItem, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    cart = await db.carts.find_one({"user_id": user_id})

    if not cart:
        await db.carts.insert_one({"user_id": user_id, "items": [item.model_dump()]})
    else:
        existing = next((i for i in cart["items"] if i["product_id"] == item.product_id), None)
        if existing:
            await db.carts.update_one(
                {"user_id": user_id, "items.product_id": item.product_id},
                {"$inc": {"items.$.quantity": item.quantity}},
            )
        else:
            await db.carts.update_one({"user_id": user_id}, {"$push": {"items": item.model_dump()}})
    return {"message": "Added to cart"}


@router.delete("/remove/{product_id}")
async def remove_from_cart(product_id: str, user=Depends(get_current_user)):
    user_id = str(user["_id"])
    await db.carts.update_one({"user_id": user_id}, {"$pull": {"items": {"product_id": product_id}}})
    return {"message": "Removed from cart"}


@router.delete("/clear")
async def clear_cart(user=Depends(get_current_user)):
    user_id = str(user["_id"])
    await db.carts.delete_one({"user_id": user_id})
    return {"message": "Cart cleared"}
