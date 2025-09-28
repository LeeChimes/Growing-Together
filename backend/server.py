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

# Plot Inspections Models
class Plot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    number: str
    holder_user_id: Optional[str] = None
    size: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Inspection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plot_id: str
    assessor_user_id: str
    date: datetime = Field(default_factory=datetime.utcnow)
    use_status: str  # active, partial, not_used
    upkeep: str  # good, fair, poor
    issues: List[str] = []
    notes: Optional[str] = None
    photos: List[str] = []
    score: int
    action: str = "none"  # none, advisory, warning, final_warning, recommend_removal
    reinspect_by: Optional[datetime] = None
    shared_with_member: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class InspectionCreate(BaseModel):
    plot_id: str
    use_status: str
    upkeep: str
    issues: List[str] = []
    notes: Optional[str] = None
    photos: List[str] = []
    action: str = "none"
    reinspect_by: Optional[str] = None

class MemberNotice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    inspection_id: Optional[str] = None
    title: str
    body: str
    status: str = "open"  # open, acknowledged, closed
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Rules System Models
class RulesDoc(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    version: str
    markdown: str
    published_at: datetime = Field(default_factory=datetime.utcnow)
    summary: Optional[str] = None
    created_by: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RulesCreate(BaseModel):
    version: str
    markdown: str
    summary: Optional[str] = None

class RuleAcknowledgement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rule_id: str
    user_id: str
    acknowledged_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AcknowledgeRules(BaseModel):
    rule_id: str

# Documents System Models
class UserDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    type: str  # contract, id, other
    file_url: str
    file_name: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    uploaded_by_user_id: str
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentUpload(BaseModel):
    title: str
    type: str
    file_name: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    expires_at: Optional[str] = None

# Inspection utilities
def calculate_inspection_score(use_status: str, upkeep: str) -> int:
    """Calculate inspection score based on use status and upkeep"""
    use_points = {
        "active": 60,
        "partial": 30,
        "not_used": 0,
    }
    
    upkeep_points = {
        "good": 40,
        "fair": 20,
        "poor": 0,
    }
    
    return use_points.get(use_status, 0) + upkeep_points.get(upkeep, 0)

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

# Plot Inspections API
@api_router.get("/plots", response_model=List[Plot])
async def get_plots(current_user: User = Depends(get_current_user)):
    plots = await db.plots.find().sort("number", 1).to_list(100)
    return [Plot(**plot) for plot in plots]

@api_router.get("/inspections", response_model=List[Inspection])
async def get_inspections(current_user: User = Depends(get_admin_user)):
    inspections = await db.inspections.find().sort("date", -1).to_list(100)
    return [Inspection(**inspection) for inspection in inspections]

@api_router.post("/inspections", response_model=Inspection)
async def create_inspection(inspection_data: InspectionCreate, current_user: User = Depends(get_admin_user)):
    # Calculate score
    score = calculate_inspection_score(inspection_data.use_status, inspection_data.upkeep)
    
    # Parse reinspect_by if provided
    reinspect_by = None
    if inspection_data.reinspect_by:
        try:
            reinspect_by = datetime.fromisoformat(inspection_data.reinspect_by.replace('Z', '+00:00'))
        except:
            pass
    
    inspection = Inspection(
        assessor_user_id=current_user.id,
        score=score,
        reinspect_by=reinspect_by,
        **inspection_data.dict(exclude={'reinspect_by'})
    )
    
    await db.inspections.insert_one(inspection.dict())
    
    # Create member notice if action is required
    if inspection.action != "none":
        plot = await db.plots.find_one({"id": inspection.plot_id})
        if plot and plot.get("holder_user_id"):
            notice = MemberNotice(
                user_id=plot["holder_user_id"],
                inspection_id=inspection.id,
                title=f"Plot {plot.get('number', 'N/A')} Inspection - {inspection.action.title()}",
                body=f"Your plot has been inspected with result: {inspection.action}. {inspection.notes or ''}"
            )
            await db.member_notices.insert_one(notice.dict())
    
    return inspection

@api_router.get("/inspections/my-plot", response_model=List[Inspection])
async def get_my_plot_inspections(current_user: User = Depends(get_current_user)):
    # Find user's plot
    plot = await db.plots.find_one({"holder_user_id": current_user.id})
    if not plot:
        return []
    
    inspections = await db.inspections.find({
        "plot_id": plot["id"], 
        "shared_with_member": True
    }).sort("date", -1).to_list(100)
    
    return [Inspection(**inspection) for inspection in inspections]

@api_router.get("/member-notices", response_model=List[MemberNotice])
async def get_member_notices(current_user: User = Depends(get_current_user)):
    notices = await db.member_notices.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [MemberNotice(**notice) for notice in notices]

@api_router.patch("/member-notices/{notice_id}/acknowledge")
async def acknowledge_notice(notice_id: str, current_user: User = Depends(get_current_user)):
    await db.member_notices.update_one(
        {"id": notice_id, "user_id": current_user.id},
        {"$set": {"status": "acknowledged", "updated_at": datetime.utcnow()}}
    )
    return {"message": "Notice acknowledged"}

# Rules System API
@api_router.get("/rules", response_model=RulesDoc)
async def get_active_rules():
    rules = await db.rules.find_one({"is_active": True})
    if not rules:
        raise HTTPException(status_code=404, detail="No active rules found")
    return RulesDoc(**rules)

@api_router.post("/rules", response_model=RulesDoc)
async def create_rules(rules_data: RulesCreate, current_user: User = Depends(get_admin_user)):
    # Deactivate all existing rules
    await db.rules.update_many({}, {"$set": {"is_active": False}})
    
    rules = RulesDoc(
        created_by=current_user.id,
        **rules_data.dict()
    )
    
    await db.rules.insert_one(rules.dict())
    return rules

@api_router.post("/rules/acknowledge", response_model=RuleAcknowledgement)
async def acknowledge_rules(acknowledge_data: AcknowledgeRules, current_user: User = Depends(get_current_user)):
    # Check if already acknowledged
    existing = await db.rule_acknowledgements.find_one({
        "rule_id": acknowledge_data.rule_id,
        "user_id": current_user.id
    })
    
    if existing:
        return RuleAcknowledgement(**existing)
    
    acknowledgement = RuleAcknowledgement(
        rule_id=acknowledge_data.rule_id,
        user_id=current_user.id
    )
    
    await db.rule_acknowledgements.insert_one(acknowledgement.dict())
    return acknowledgement

@api_router.get("/rules/acknowledgements")
async def get_rule_acknowledgements(rule_id: Optional[str] = None, current_user: User = Depends(get_admin_user)):
    query = {}
    if rule_id:
        query["rule_id"] = rule_id
    
    acknowledgements = await db.rule_acknowledgements.find(query).sort("acknowledged_at", -1).to_list(1000)
    # Convert to proper format, excluding MongoDB _id field
    result = []
    for ack in acknowledgements:
        ack_dict = dict(ack)
        if '_id' in ack_dict:
            del ack_dict['_id']
        result.append(ack_dict)
    return result

@api_router.get("/rules/my-acknowledgement")
async def get_my_rule_acknowledgement(rule_id: str, current_user: User = Depends(get_current_user)):
    acknowledgement = await db.rule_acknowledgements.find_one({
        "rule_id": rule_id,
        "user_id": current_user.id
    })
    
    if not acknowledgement:
        return {"acknowledged": False}
    
    return {"acknowledged": True, "acknowledgement": acknowledgement}

# Documents System API
@api_router.get("/documents", response_model=List[UserDocument])
async def get_user_documents(current_user: User = Depends(get_current_user)):
    documents = await db.user_documents.find({"user_id": current_user.id}).sort("created_at", -1).to_list(100)
    return [UserDocument(**doc) for doc in documents]

@api_router.post("/documents/upload", response_model=UserDocument)
async def upload_document(document_data: DocumentUpload, current_user: User = Depends(get_current_user)):
    # Parse expires_at if provided
    expires_at = None
    if document_data.expires_at:
        try:
            expires_at = datetime.fromisoformat(document_data.expires_at.replace('Z', '+00:00'))
        except:
            pass
    
    document = UserDocument(
        user_id=current_user.id,
        uploaded_by_user_id=current_user.id,
        file_url=f"placeholder_url_{uuid.uuid4()}",  # In real implementation, this would be actual file URL
        expires_at=expires_at,
        **document_data.dict(exclude={'expires_at'})
    )
    
    await db.user_documents.insert_one(document.dict())
    return document

@api_router.get("/admin/documents")
async def get_all_user_documents(current_user: User = Depends(get_admin_user)):
    # Get all users with their documents
    pipeline = [
        {
            "$lookup": {
                "from": "user_documents",
                "localField": "id",
                "foreignField": "user_id",
                "as": "documents"
            }
        },
        {
            "$project": {
                "_id": 0,  # Exclude MongoDB _id field
                "id": 1,
                "username": 1,
                "email": 1,
                "plot_number": 1,
                "documents": 1
            }
        }
    ]
    
    users_with_docs = await db.users.aggregate(pipeline).to_list(1000)
    # Clean up any remaining ObjectId fields in documents
    for user in users_with_docs:
        if 'documents' in user:
            for doc in user['documents']:
                if '_id' in doc:
                    del doc['_id']
    return users_with_docs

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str, current_user: User = Depends(get_current_user)):
    # Check if user owns the document or is admin
    document = await db.user_documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if document["user_id"] != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    
    await db.user_documents.delete_one({"id": document_id})
    return {"message": "Document deleted"}

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
    
    # Initialize sample plots
    sample_plots_count = await db.plots.count_documents({})
    if sample_plots_count == 0:
        sample_plots = []
        for i in range(1, 21):  # Create 20 sample plots
            plot = Plot(
                number=str(i),
                size="10m x 5m",
                notes=f"Standard allotment plot {i}"
            )
            sample_plots.append(plot)
        
        for plot in sample_plots:
            await db.plots.insert_one(plot.dict())
        logger.info("Sample plots added")
    
    # Initialize default rules if none exist
    rules_count = await db.rules.count_documents({})
    if rules_count == 0:
        default_rules = RulesDoc(
            version="1.0",
            markdown="""# Growing Together Allotment Community Rules

## 1. Plot Use
- Plots must be actively cultivated for growing food or flowers
- No subletting or commercial use of plots
- Keep paths and communal areas clear and accessible
- Notify the secretary if you will be away for extended periods

## 2. Structures and Buildings
- All structures require committee approval before construction
- Maximum shed size: 8ft x 6ft
- Greenhouses and polytunnels must be appropriately sited
- Use appropriate materials - no corrugated iron or unsightly materials

## 3. Compost and Waste
- Green waste only in designated compost areas
- No household rubbish or non-compostable materials
- Dispose of diseased plants appropriately
- Keep compost areas tidy and well-maintained

## 4. Water Usage
- Use water butts and collection systems where possible
- No hoses left running unattended
- Report any leaks or water system issues immediately
- Be considerate of water usage during dry periods

## 5. Community and Respect
- Respect your neighbors and their plots
- Quiet hours: 8 PM - 8 AM on weekdays, 8 PM - 9 AM on weekends
- Resolve disputes through committee mediation
- Participate in community events and work days when possible""",
            summary="Initial community rules and guidelines",
            created_by="admin"  # Will be replaced with actual admin ID if needed
        )
        
        await db.rules.insert_one(default_rules.dict())
        logger.info("Default rules added")