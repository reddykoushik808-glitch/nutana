from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.database import Database
from app.core.logging import logger

def create_indexes(db: Database):
    logger.info("Ensuring database indexes...")
    try:
        # users: unique email_normalized
        db.users.create_index([("email_normalized", ASCENDING)], unique=True)
        db.users.create_index([("shop_id", ASCENDING)])

        # shops
        db.shops.create_index([("owner_user_id", ASCENDING)])
        db.shops.create_index([("locality", ASCENDING)])

        # products: shop_id + normalized_name, shop_id + sku
        db.products.create_index([("shop_id", ASCENDING), ("normalized_name", ASCENDING)])
        db.products.create_index([("shop_id", ASCENDING), ("category", ASCENDING)])
        db.products.create_index([("shop_id", ASCENDING), ("is_active", ASCENDING)])
        db.products.create_index(
            [("shop_id", ASCENDING), ("sku", ASCENDING)],
            unique=True,
            partialFilterExpression={"sku": {"$type": "string", "$gt": ""}}
        )

        # inventory_batches: shop_id + product_id, shop_id + expiry_date
        db.inventory_batches.create_index([("shop_id", ASCENDING), ("product_id", ASCENDING)])
        db.inventory_batches.create_index([("shop_id", ASCENDING), ("expiry_date", ASCENDING)])
        db.inventory_batches.create_index([("shop_id", ASCENDING), ("status", ASCENDING)])

        # sales: shop_id + sold_at
        db.sales.create_index([("shop_id", ASCENDING), ("sold_at", DESCENDING)])
        db.sales.create_index([("shop_id", ASCENDING), ("sale_reference", ASCENDING)])

        # stock_movements: shop_id + product_id, idempotency_key
        db.stock_movements.create_index([("shop_id", ASCENDING), ("product_id", ASCENDING), ("created_at", DESCENDING)])
        db.stock_movements.create_index([("idempotency_key", ASCENDING)], unique=True, sparse=True)

        # recommendations: shop_id + status
        db.recommendations.create_index([("shop_id", ASCENDING), ("status", ASCENDING)])
        db.recommendations.create_index([("shop_id", ASCENDING), ("product_id", ASCENDING)])

        # exchanges: sender/receiver shop
        db.exchanges.create_index([("sender_shop_id", ASCENDING)])
        db.exchanges.create_index([("receiver_shop_id", ASCENDING)])
        db.exchanges.create_index([("status", ASCENDING)])

        # purchase_orders: shop_id + status
        db.purchase_orders.create_index([("shop_id", ASCENDING), ("status", ASCENDING)])

        # feedback: shop_id
        db.feedback.create_index([("shop_id", ASCENDING)])

        # audit_logs: shop_id + created_at
        db.audit_logs.create_index([("shop_id", ASCENDING), ("created_at", DESCENDING)])

        logger.info("Indexes successfully ensured.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")
