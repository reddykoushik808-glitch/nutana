from pymongo import MongoClient
from pymongo.database import Database
from app.core.config import settings
from app.core.logging import logger

_mongo_client: MongoClient | None = None

def get_mongo_client() -> MongoClient:
    global _mongo_client
    if _mongo_client is None:
        logger.info(f"Connecting to MongoDB...")
        _mongo_client = MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
    return _mongo_client

def get_database() -> Database:
    client = get_mongo_client()
    return client[settings.MONGODB_DATABASE]

def close_mongo_client():
    global _mongo_client
    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
        logger.info("MongoDB connection closed.")
