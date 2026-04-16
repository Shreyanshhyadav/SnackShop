from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from ..config import db
from ..models import Product
from ..auth import require_admin

router = APIRouter(prefix="/api/products", tags=["Products"])


def serialize_product(p):
    return {
        "id": str(p["_id"]),
        "name": p["name"],
        "brand": p.get("brand", ""),
        "description": p["description"],
        "price": p["price"],
        "originalPrice": p.get("originalPrice", 0),
        "discount": p.get("discount", 0),
        "category": p["category"],
        "subCategory": p.get("subCategory", ""),
        "unit": p.get("unit", ""),
        "image_url": p.get("image_url", ""),
        "stock": p.get("stock", 0),
        "avg_rating": p.get("avg_rating", 0),
        "review_count": p.get("review_count", 0),
        "isBestSeller": p.get("isBestSeller", False),
        "tags": p.get("tags", []),
    }


@router.get("")
async def get_products():
    products = []
    async for p in db.products.find():
        products.append(serialize_product(p))
    return products


@router.get("/{product_id}")
async def get_product(product_id: str):
    p = await db.products.find_one({"_id": ObjectId(product_id)})
    if not p:
        return {"error": "Not found"}
    return serialize_product(p)


@router.post("")
async def create_product(product: Product, admin=Depends(require_admin)):
    result = await db.products.insert_one(product.model_dump())
    return {"id": str(result.inserted_id), **product.model_dump()}


@router.put("/{product_id}")
async def update_product(product_id: str, product: Product, admin=Depends(require_admin)):
    result = await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": product.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    p = await db.products.find_one({"_id": ObjectId(product_id)})
    return serialize_product(p)


@router.delete("/{product_id}")
async def delete_product(product_id: str, admin=Depends(require_admin)):
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}
