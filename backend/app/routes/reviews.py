from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from ..config import db
from ..auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])


@router.get("/{product_id}")
async def get_reviews(product_id: str):
    reviews = []
    async for r in db.reviews.find({"product_id": product_id}).sort("created_at", -1):
        reviews.append({
            "id": str(r["_id"]),
            "product_id": r["product_id"],
            "user_name": r["user_name"],
            "rating": r["rating"],
            "comment": r.get("comment", ""),
            "created_at": r.get("created_at", ""),
        })
    return reviews


@router.post("/{product_id}")
async def add_review(product_id: str, body: dict, user=Depends(get_current_user)):
    rating = body.get("rating", 5)
    comment = body.get("comment", "")
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    # Check if user already reviewed this product
    existing = await db.reviews.find_one({
        "product_id": product_id, "user_id": str(user["_id"])
    })
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")

    review = {
        "product_id": product_id,
        "user_id": str(user["_id"]),
        "user_name": user["name"],
        "rating": rating,
        "comment": comment,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await db.reviews.insert_one(review)

    # Update product average rating
    pipeline = [
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}}
    ]
    stats = await db.reviews.aggregate(pipeline).to_list(1)
    if stats:
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": {"avg_rating": round(stats[0]["avg"], 1), "review_count": stats[0]["count"]}}
        )

    return {"id": str(result.inserted_id), **review}
