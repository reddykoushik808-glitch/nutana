from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId format")

# --- AUTH & USER ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    shop_name: str = Field(..., min_length=2, max_length=150)
    shop_type: str = Field(default="Kirana Store")
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    shop_id: str
    is_active: bool
    created_at: datetime

# --- SHOP ---
class ShopUpdate(BaseModel):
    name: Optional[str] = None
    shop_type: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    expiry_warning_days: Optional[int] = None
    expiry_critical_days: Optional[int] = None

class ShopResponse(BaseModel):
    id: str
    name: str
    shop_type: str
    owner_user_id: str
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    timezone: str = "Asia/Kolkata"
    currency: str = "INR"
    expiry_warning_days: int = 7
    expiry_critical_days: int = 3
    created_at: datetime
    updated_at: datetime

# --- PRODUCT ---
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: str = Field(default="General")
    brand: Optional[str] = None
    unit: str = Field(default="unit") # kg, g, l, ml, packet, piece, box
    selling_price: float = Field(..., ge=0)
    minimum_stock_threshold: float = Field(default=5.0, ge=0)
    notes: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    selling_price: Optional[float] = Field(None, ge=0)
    minimum_stock_threshold: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: str
    shop_id: str
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category: str
    brand: Optional[str] = None
    unit: str
    selling_price: float
    minimum_stock_threshold: float
    total_quantity: float = 0.0
    reserved_quantity: float = 0.0
    available_quantity: float = 0.0
    batch_count: int = 0
    nearest_expiry: Optional[datetime] = None
    stock_status: str = "Out of Stock" # In Stock, Low Stock, Expiring Soon, Out of Stock
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

# --- BATCH ---
class BatchCreate(BaseModel):
    product_id: Optional[str] = None
    batch_number: Optional[str] = None
    quantity_received: float = Field(..., gt=0)
    unit_purchase_cost: float = Field(..., ge=0)
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    supplier: Optional[str] = None
    notes: Optional[str] = None

class BatchAdjustment(BaseModel):
    adjustment_type: str # 'manual_count', 'damage_write_off', 'spoilage'
    quantity_delta: float # positive or negative
    reason: str

class BatchResponse(BaseModel):
    id: str
    shop_id: str
    product_id: str
    product_name: Optional[str] = None
    batch_number: Optional[str] = None
    quantity_received: float
    quantity_available: float
    quantity_reserved: float
    unit_purchase_cost: float
    purchase_date: datetime
    expiry_date: Optional[datetime] = None
    supplier: Optional[str] = None
    status: str # active, exhausted, expired, written_off
    days_until_expiry: Optional[int] = None
    created_at: datetime
    updated_at: datetime

# --- SALES ---
class SaleLineItemInput(BaseModel):
    product_id: str
    quantity: float = Field(..., gt=0)
    unit_selling_price: Optional[float] = Field(None, ge=0)
    discount: float = Field(default=0.0, ge=0)

class SaleCreate(BaseModel):
    line_items: List[SaleLineItemInput]
    receipt_reference: Optional[str] = None
    notes: Optional[str] = None

class SaleLineItemResponse(BaseModel):
    product_id: str
    product_name: str
    unit: str
    quantity: float
    unit_selling_price: float
    discount: float
    subtotal: float
    batch_deductions: List[Dict[str, Any]] = []

class SaleResponse(BaseModel):
    id: str
    shop_id: str
    sale_reference: str
    sold_at: datetime
    line_items: List[SaleLineItemResponse]
    gross_total: float
    discount_total: float
    net_total: float
    status: str # completed, cancelled
    created_by: str
    created_at: datetime

# --- RECOMMENDATION ---
class RecommendationResponse(BaseModel):
    id: str
    shop_id: str
    recommendation_type: str # markdown, transfer, replenishment, freshness_alert
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    batch_id: Optional[str] = None
    suggested_action: str
    evidence: str
    assumptions: str
    confidence: float # 0.0 - 1.0
    estimated_benefit: Optional[str] = None
    status: str # pending, approved, rejected, dismissed
    created_at: datetime
    updated_at: datetime

class RecommendationDecision(BaseModel):
    decision: str # 'approved', 'rejected', 'dismissed'
    notes: Optional[str] = None

# --- EXCHANGE & TRANSACTIONS ---
class ExchangeOfferCreate(BaseModel):
    product_id: str
    batch_id: Optional[str] = None
    quantity: float = Field(..., gt=0)
    asking_price: float = Field(..., ge=0)
    notes: Optional[str] = None

class ExchangeRequestCreate(BaseModel):
    offer_id: Optional[str] = None
    target_shop_id: str
    product_id: str
    quantity: float = Field(..., gt=0)
    offered_price: float = Field(..., ge=0)
    terms: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    sender_shop_id: str
    sender_shop_name: str
    receiver_shop_id: str
    receiver_shop_name: str
    product_id: str
    product_name: str
    quantity: float
    unit: str
    agreed_price: float
    total_amount: float
    status: str # draft, requested, accepted, rejected, ready_for_handover, completed, cancelled
    terms: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# --- PURCHASE ORDERS / REPLENISHMENT ---
class PurchaseOrderItem(BaseModel):
    product_id: str
    product_name: str
    suggested_quantity: float
    ordered_quantity: float
    estimated_unit_cost: float

class PurchaseOrderCreate(BaseModel):
    supplier_name: Optional[str] = None
    items: List[PurchaseOrderItem]
    notes: Optional[str] = None

class PurchaseOrderResponse(BaseModel):
    id: str
    shop_id: str
    order_reference: str
    supplier_name: Optional[str] = None
    items: List[Dict[str, Any]]
    total_estimated_cost: float
    status: str # draft, placed, received, cancelled
    created_at: datetime
    updated_at: datetime

class PurchaseOrderReceive(BaseModel):
    items_received: List[Dict[str, Any]] # product_id, quantity_received, unit_cost, expiry_date, batch_number

# --- FEEDBACK ---
class FeedbackCreate(BaseModel):
    recommendation_id: Optional[str] = None
    decision: str # accepted, rejected, edited
    rating: int = Field(default=5, ge=1, le=5)
    comment: Optional[str] = None
    actual_outcome: Optional[str] = None
