from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import requests
import json
import base64
import asyncio
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Growing Together API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'growing-together-secret-key')
JOIN_CODE = os.environ.get('JOIN_CODE', 'GROW2024')

# LLM Integration
EMERGENT_LLM_KEY = 'sk-emergent-13f73B6A44a8cEd496'

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    username: str
    password_hash: str
    role: str = "member"  # admin, member, guest
    plot_number: Optional[str] = None
    join_date: datetime = Field(default_factory=datetime.utcnow)
    is_approved: bool = False
    profile: Optional[Dict[str, Any]] = {}

class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    join_code: str
    plot_number: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class DiaryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    plot_number: str
    entry_type: str  # sowing, watering, harvest, maintenance, general
    title: str
    content: str
    photos: List[str] = []
    date: datetime = Field(default_factory=datetime.utcnow)
    weather: Optional[str] = None
    tags: List[str] = []

class DiaryEntryCreate(BaseModel):
    plot_number: str
    entry_type: str
    title: str
    content: str
    photos: List[str] = []
    tags: List[str] = []

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    date: datetime
    location: str
    bring_list: List[str] = []
    cover_photo: Optional[str] = None
    created_by: str
    rsvp_list: List[str] = []
    comments: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EventCreate(BaseModel):
    title: str
    description: str
    date: datetime
    location: str
    bring_list: List[str] = []
    cover_photo: Optional[str] = None

class CommunityPost(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    content: str
    photos: List[str] = []
    reactions: Dict[str, List[str]] = {}  # reaction_type: [user_ids]
    comments: List[Dict[str, Any]] = []
    is_pinned: bool = False
    is_announcement: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PostCreate(BaseModel):
    content: str
    photos: List[str] = []

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    task_type: str  # personal, site
    assigned_to: Optional[str] = None  # user_id
    due_date: Optional[datetime] = None
    completed: bool = False
    completed_by: Optional[str] = None
    completed_at: Optional[datetime] = None
    proof_photo: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: str
    task_type: str
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None

class Plant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    scientific_name: Optional[str] = None
    category: str
    description: str
    care_instructions: Dict[str, Any] = {}
    planting_guide: Dict[str, Any] = {}
    harvest_info: Dict[str, Any] = {}
    common_issues: List[str] = []
    image_url: Optional[str] = None

class AIQueryRequest(BaseModel):
    plant_name: Optional[str] = None
    question: str
    photo_base64: Optional[str] = None

# Auth utilities
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_jwt_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = verify_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": payload['user_id']})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# API Routes

# Authentication
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    if user_data.join_code != JOIN_CODE:
        raise HTTPException(status_code=400, detail="Invalid join code")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        plot_number=user_data.plot_number,
        is_approved=False  # Requires admin approval
    )
    
    await db.users.insert_one(user.dict())
    return {"message": "Registration successful. Awaiting admin approval.", "user_id": user.id}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user['is_approved']:
        raise HTTPException(status_code=403, detail="Account pending admin approval")
    
    token = create_jwt_token(user['id'], user['role'])
    user_data = User(**user)
    return {
        "token": token,
        "user": {
            "id": user_data.id,
            "email": user_data.email,
            "username": user_data.username,
            "role": user_data.role,
            "plot_number": user_data.plot_number
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role,
        "plot_number": current_user.plot_number
    }

# Weather API
@api_router.get("/weather")
async def get_weather():
    # Mock weather data - in production, integrate with real weather API
    return {
        "location": "Stafford Road Allotment",
        "current": {
            "temperature": 22,
            "condition": "Partly Cloudy",
            "humidity": 65,
            "wind": "5 mph NE"
        },
        "forecast": [
            {"day": "Today", "high": 24, "low": 15, "condition": "Sunny"},
            {"day": "Tomorrow", "high": 21, "low": 13, "condition": "Cloudy"},
            {"day": "Thursday", "high": 19, "low": 11, "condition": "Light Rain"}
        ]
    }

# Diary Entries
@api_router.post("/diary", response_model=DiaryEntry)
async def create_diary_entry(entry_data: DiaryEntryCreate, current_user: User = Depends(get_current_user)):
    entry = DiaryEntry(
        user_id=current_user.id,
        **entry_data.dict()
    )
    await db.diary_entries.insert_one(entry.dict())
    return entry

@api_router.get("/diary", response_model=List[DiaryEntry])
async def get_diary_entries(plot_number: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if plot_number:
        query["plot_number"] = plot_number
    elif current_user.role != "admin":
        query["user_id"] = current_user.id
    
    entries = await db.diary_entries.find(query).sort("date", -1).to_list(100)
    return [DiaryEntry(**entry) for entry in entries]

# Events
@api_router.post("/events", response_model=Event)
async def create_event(event_data: EventCreate, current_user: User = Depends(get_admin_user)):
    event = Event(
        created_by=current_user.id,
        **event_data.dict()
    )
    await db.events.insert_one(event.dict())
    return event

@api_router.get("/events", response_model=List[Event])
async def get_events(current_user: User = Depends(get_current_user)):
    events = await db.events.find().sort("date", 1).to_list(100)
    return [Event(**event) for event in events]

@api_router.post("/events/{event_id}/rsvp")
async def rsvp_event(event_id: str, current_user: User = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user.id in event['rsvp_list']:
        # Remove RSVP
        await db.events.update_one(
            {"id": event_id},
            {"$pull": {"rsvp_list": current_user.id}}
        )
        return {"message": "RSVP removed", "rsvp": False}
    else:
        # Add RSVP
        await db.events.update_one(
            {"id": event_id},
            {"$addToSet": {"rsvp_list": current_user.id}}
        )
        return {"message": "RSVP confirmed", "rsvp": True}

# Community Posts
@api_router.post("/posts", response_model=CommunityPost)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    post = CommunityPost(
        user_id=current_user.id,
        username=current_user.username,
        **post_data.dict()
    )
    await db.posts.insert_one(post.dict())
    return post

@api_router.get("/posts", response_model=List[CommunityPost])
async def get_posts(current_user: User = Depends(get_current_user)):
    posts = await db.posts.find().sort("created_at", -1).to_list(100)
    return [CommunityPost(**post) for post in posts]

# Tasks
@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, current_user: User = Depends(get_current_user)):
    task = Task(
        created_by=current_user.id,
        **task_data.dict()
    )
    await db.tasks.insert_one(task.dict())
    return task

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(task_type: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if task_type:
        query["task_type"] = task_type
    if current_user.role != "admin" and task_type == "personal":
        query["assigned_to"] = current_user.id
    
    tasks = await db.tasks.find(query).sort("created_at", -1).to_list(100)
    return [Task(**task) for task in tasks]

@api_router.patch("/tasks/{task_id}/complete")
async def complete_task(task_id: str, proof_photo: Optional[str] = None, current_user: User = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {
        "completed": True,
        "completed_by": current_user.id,
        "completed_at": datetime.utcnow()
    }
    if proof_photo:
        update_data["proof_photo"] = proof_photo
    
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": update_data}
    )
    return {"message": "Task completed"}

# Plants Library
@api_router.get("/plants", response_model=List[Plant])
async def get_plants(current_user: User = Depends(get_current_user)):
    plants = await db.plants.find().to_list(100)
    return [Plant(**plant) for plant in plants]

@api_router.post("/plants/ai-advice")
async def get_ai_plant_advice(query: AIQueryRequest, current_user: User = Depends(get_current_user)):
    try:
        # Initialize LLM Chat with Emergent LLM key
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"plant_advice_{uuid.uuid4()}",
            system_message="You are an expert gardener helping allotment holders with plant care advice. Provide practical, actionable advice in a friendly tone. Include specific steps they can take."
        ).with_model("openai", "gpt-4o-mini")
        
        # Prepare the query message
        prompt = f"Question: {query.question}"
        
        if query.plant_name:
            prompt += f"\nPlant: {query.plant_name}"
        
        # Create user message with optional image
        file_contents = []
        if query.photo_base64:
            prompt += "\n\nI've attached a photo of my plant. Please analyze any visible issues and provide specific advice based on what you can see."
            # Add image content for vision models
            image_content = ImageContent(image_base64=query.photo_base64)
            file_contents.append(image_content)
        
        user_message = UserMessage(
            text=prompt,
            file_contents=file_contents if file_contents else None
        )
        
        # Get AI response
        response = await chat.send_message(user_message)
        
        return {
            "advice": response,
            "can_save_as_task": True,
            "suggested_actions": []
        }
        
    except Exception as e:
        print(f"AI advice error: {e}")
        return {
            "advice": "I'm having trouble connecting to the AI service right now. Here's some general advice: Check your plant's leaves for signs of disease, ensure proper watering (soil should be moist but not waterlogged), and make sure it's getting adequate sunlight for its species. Please try the AI assistant again later.",
            "can_save_as_task": False,
            "suggested_actions": ["Check soil moisture", "Inspect leaves for pests", "Verify sunlight requirements"]
        }

# Admin Routes
@api_router.get("/admin/users")
async def get_pending_users(current_user: User = Depends(get_admin_user)):
    users = await db.users.find({"is_approved": False}).to_list(100)
    return [{"id": user['id'], "email": user['email'], "username": user['username'], "plot_number": user.get('plot_number')} for user in users]

@api_router.get("/admin/analytics")
async def get_analytics(current_user: User = Depends(get_admin_user)):
    """Get comprehensive analytics for admin dashboard"""
    try:
        # Get user statistics
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"is_approved": True})
        pending_users = await db.users.count_documents({"is_approved": False})
        
        # Get content statistics
        total_diary_entries = await db.diary_entries.count_documents({})
        total_events = await db.events.count_documents({})
        total_posts = await db.posts.count_documents({})
        total_tasks = await db.tasks.count_documents({})
        completed_tasks = await db.tasks.count_documents({"completed": True})
        
        # Get recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_entries = await db.diary_entries.count_documents({"date": {"$gte": seven_days_ago}})
        recent_posts = await db.posts.count_documents({"created_at": {"$gte": seven_days_ago}})
        
        # Get plot statistics
        plots_with_entries = await db.diary_entries.distinct("plot_number")
        active_plots = len(plots_with_entries)
        
        # Monthly activity for the last 6 months
        monthly_stats = []
        for i in range(6):
            month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=31)
            
            month_entries = await db.diary_entries.count_documents({
                "date": {"$gte": month_start, "$lt": month_end}
            })
            month_posts = await db.posts.count_documents({
                "created_at": {"$gte": month_start, "$lt": month_end}
            })
            
            monthly_stats.append({
                "month": month_start.strftime("%Y-%m"),
                "entries": month_entries,
                "posts": month_posts
            })
        
        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "pending": pending_users
            },
            "content": {
                "diary_entries": total_diary_entries,
                "events": total_events,
                "posts": total_posts,
                "tasks": total_tasks,
                "completed_tasks": completed_tasks
            },
            "activity": {
                "recent_entries": recent_entries,
                "recent_posts": recent_posts,
                "active_plots": active_plots
            },
            "monthly_stats": monthly_stats
        }
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        return {"error": "Failed to fetch analytics"}

@api_router.get("/admin/export-data")
async def export_community_data(current_user: User = Depends(get_admin_user)):
    """Export community data for backup/analysis"""
    try:
        # Helper function to convert ObjectId to string
        def convert_objectid(data):
            if isinstance(data, list):
                return [convert_objectid(item) for item in data]
            elif isinstance(data, dict):
                result = {}
                for key, value in data.items():
                    if key == '_id' and hasattr(value, '__str__'):
                        result[key] = str(value)
                    else:
                        result[key] = convert_objectid(value)
                return result
            else:
                return data
        
        # Get all data
        users_data = await db.users.find({}, {"password_hash": 0}).to_list(1000)
        diary_data = await db.diary_entries.find().to_list(1000)
        events_data = await db.events.find().to_list(1000)
        posts_data = await db.posts.find().to_list(1000)
        tasks_data = await db.tasks.find().to_list(1000)
        
        # Convert ObjectIds to strings
        users_data = convert_objectid(users_data)
        diary_data = convert_objectid(diary_data)
        events_data = convert_objectid(events_data)
        posts_data = convert_objectid(posts_data)
        tasks_data = convert_objectid(tasks_data)
        
        export_data = {
            "export_date": datetime.utcnow().isoformat(),
            "users": users_data,
            "diary_entries": diary_data,
            "events": events_data,
            "posts": posts_data,
            "tasks": tasks_data
        }
        
        return export_data
    except Exception as e:
        logger.error(f"Export error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export data")

@api_router.patch("/admin/users/{user_id}/approve")
async def approve_user(user_id: str, current_user: User = Depends(get_admin_user)):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_approved": True}}
    )
    return {"message": "User approved"}

@api_router.get("/")
async def root():
    return {"message": "Growing Together API", "version": "1.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Initialize sample data
@app.on_event("startup")
async def initialize_db():
    # Create admin user if doesn't exist
    admin = await db.users.find_one({"role": "admin"})
    if not admin:
        admin_user = User(
            email="admin@staffordallotment.com",
            username="Admin",
            password_hash=hash_password("admin123"),
            role="admin",
            is_approved=True
        )
        await db.users.insert_one(admin_user.dict())
        logger.info("Admin user created")
    
    # Initialize sample plants
    sample_plants_count = await db.plants.count_documents({})
    if sample_plants_count == 0:
        sample_plants = [
            Plant(
                name="Tomatoes",
                scientific_name="Solanum lycopersicum",
                category="Vegetables",
                description="Popular garden vegetable, perfect for allotments",
                care_instructions={
                    "watering": "Regular deep watering, avoid getting leaves wet",
                    "sunlight": "Full sun, 6-8 hours daily",
                    "soil": "Well-draining, rich in organic matter"
                },
                planting_guide={
                    "sowing_time": "March-May indoors, May-June outdoors",
                    "spacing": "45-60cm apart",
                    "depth": "1cm deep"
                }
            ),
            Plant(
                name="Carrots",
                scientific_name="Daucus carota",
                category="Root Vegetables",
                description="Easy to grow root vegetable",
                care_instructions={
                    "watering": "Keep soil consistently moist",
                    "sunlight": "Full sun to partial shade",
                    "soil": "Light, sandy soil, stone-free"
                }
            ),
            Plant(
                name="Lettuce",
                scientific_name="Lactuca sativa",
                category="Leafy Greens",
                description="Quick-growing salad crop",
                care_instructions={
                    "watering": "Regular light watering",
                    "sunlight": "Partial shade in summer",
                    "soil": "Moist, fertile soil"
                }
            )
        ]
        
        for plant in sample_plants:
            await db.plants.insert_one(plant.dict())
        logger.info("Sample plants added")