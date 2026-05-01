from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None


async def connect_to_mongo():
    global client, database
    client = AsyncIOMotorClient(settings.mongodb_uri)
    database = client[settings.mongodb_db_name]
    await create_indexes()
    print(f"Connected to MongoDB: {settings.mongodb_db_name}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


async def get_database() -> AsyncIOMotorDatabase:
    return database


async def create_indexes():
    await database["users"].create_index("email", unique=True)
    await database["events"].create_index("event_id", unique=True)
    await database["events"].create_index("status")
    await database["event_stream"].create_index([("event_id", 1), ("timestamp", -1)])
    await database["pipeline_stages"].create_index([("event_id", 1), ("stage_number", 1)])
    await database["commentary"].create_index([("event_id", 1), ("created_at", -1)])
    await database["alerts"].create_index([("user_id", 1), ("event_id", 1)])
    await database["alert_rules"].create_index([("user_id", 1), ("event_id", 1)])
    await database["event_reports"].create_index("event_id", unique=True)
    print("MongoDB indexes created")