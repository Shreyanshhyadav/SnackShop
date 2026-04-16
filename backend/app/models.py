from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    customer = "customer"
    admin = "admin"


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = UserRole.customer


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: UserRole


class Product(BaseModel):
    name: str
    brand: str = ""
    description: str
    price: float
    originalPrice: float = 0
    discount: int = 0
    category: str
    subCategory: str = ""
    unit: str = ""
    image_url: str = ""
    stock: int = 100
    isBestSeller: bool = False
    tags: List[str] = []


class ProductOut(Product):
    id: str


class CartItem(BaseModel):
    product_id: str
    quantity: int = 1  # negative values allowed for decrement


class CartItemOut(BaseModel):
    product_id: str
    product_name: str
    price: float
    quantity: int
    image_url: str = ""


class PaymentCreate(BaseModel):
    amount: float


class PaymentVerify(BaseModel):
    order_id: str
    payment_id: str
    signature: str


class OrderOut(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_email: str
    items: List[CartItemOut]
    total: float
    status: str
    razorpay_order_id: str = ""
    created_at: str = ""
