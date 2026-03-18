from fastapi import FastAPI, Request, Form, HTTPException, Depends
from fastapi.responses import JSONResponse, Response, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from supabase import create_client, Client
import os
import re
from dotenv import load_dotenv
from datetime import datetime, timezone

# Load environment variables
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

app = FastAPI(title="Technodium 2026 API")

# Allow CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✓ Connected to Supabase successfully")
    except Exception as e:
        print(f"Warning: Could not connect to Supabase: {e}")
else:
    print("Warning: Supabase credentials not found in environment variables")


# ── Auth helpers ────────────────────────────────────────────
def get_current_user(request: Request):
    """Return the current authenticated user dict or None."""
    access_token = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")
    if not access_token or not supabase:
        return None
    try:
        resp = supabase.auth.get_user(access_token)
        if resp and resp.user:
            meta = resp.user.user_metadata or {}
            return {
                "email": resp.user.email,
                "id": resp.user.id,
                "name": meta.get("full_name", resp.user.email),
            }
    except Exception:
        if refresh_token:
            try:
                session = supabase.auth.refresh_session(refresh_token)
                if session and session.user:
                    meta = session.user.user_metadata or {}
                    return {
                        "email": session.user.email,
                        "id": session.user.id,
                        "name": meta.get("full_name", session.user.email),
                        "_new_access": session.session.access_token,
                        "_new_refresh": session.session.refresh_token,
                    }
            except Exception:
                pass
    return None

def set_auth_cookies(response: Response, session):
    is_prod = os.getenv("ENV", "development") == "production"
    response.set_cookie(
        "access_token",
        session.access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    response.set_cookie(
        "refresh_token",
        session.refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

def has_existing_registration(email: str) -> bool:
    if not supabase:
        return False
    try:
        result = supabase.table("registrations").select("id").eq("registered_by", email).limit(1).execute()
        if result.data:
            return True
        result = supabase.table("registrations").select("id").eq("leader_email", email).limit(1).execute()
        return bool(result.data)
    except Exception:
        return False

def get_existing_registration(email: str):
    if not supabase:
        return None
    try:
        result = supabase.table("registrations").select("*").eq("registered_by", email).limit(1).execute()
        if result.data:
            return result.data[0]
        result = supabase.table("registrations").select("*").eq("leader_email", email).limit(1).execute()
        return result.data[0] if result.data else None
    except Exception:
        return None

def get_problem_statement_counts():
    if not supabase:
        return {}
    try:
        result = supabase.table("registrations").select("problem_statement").execute()
        counts = {}
        for row in result.data:
            ps = row["problem_statement"]
            counts[ps] = counts.get(ps, 0) + 1
        return counts
    except Exception as e:
        print(f"Error fetching PS counts: {e}")
        return {}

# ── API Models ──────────────────────────────────────────────
class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    access_token: str
    refresh_token: str = ""
    password: str
    confirm_password: str

class RegistrationRequest(BaseModel):
    team_name: str
    university: str
    team_size: int
    problem_statement: str
    m1_name: str
    m1_email: str
    m1_phone: str
    m2_name: str = ""
    m2_email: str = ""
    m2_phone: str = ""
    m3_name: str = ""
    m3_email: str = ""
    m3_phone: str = ""
    m4_name: str = ""
    m4_email: str = ""
    m4_phone: str = ""

# ── API Routes ──────────────────────────────────────────────

@app.get("/api/user")
async def api_get_user(request: Request):
    user = get_current_user(request)
    if user:
        return {"authenticated": True, "user": user}
    return {"authenticated": False, "user": None}

@app.get("/api/ps-counts")
async def api_ps_counts():
    counts = get_problem_statement_counts()
    return {"counts": counts}

@app.get("/api/registration")
async def api_get_registration(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    reg = get_existing_registration(user["email"])
    if reg:
        return {"registered": True, "registration": reg}
    return {"registered": False, "registration": None}

@app.post("/api/signup")
async def api_signup(req: SignupRequest):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    
    password_pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$"
    if not re.match(password_pattern, req.password):
        raise HTTPException(status_code=400, detail="Password does not meet requirements.")

    if not supabase:
        raise HTTPException(status_code=500, detail="Auth service unavailable.")
    
    try:
        res = supabase.auth.sign_up(
            {"email": req.email, "password": req.password, "options": {"data": {"full_name": req.full_name}}}
        )
        if res.session:
            response = JSONResponse({"success": True, "message": "Signup successful!"})
            set_auth_cookies(response, res.session)
            return response
        return {"success": True, "message": "Account created! Check your email to confirm."}
    except Exception as e:
        msg = str(e)
        if "already registered" in msg.lower():
            msg = "An account with this email already exists."
        raise HTTPException(status_code=400, detail=msg)

@app.post("/api/login")
async def api_login(req: LoginRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Auth service unavailable.")
    try:
        res = supabase.auth.sign_in_with_password({"email": req.email, "password": req.password})
        response = JSONResponse({"success": True, "message": "Login successful!"})
        set_auth_cookies(response, res.session)
        return response
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid email or password.")

@app.post("/api/logout")
async def api_logout(request: Request):
    response = JSONResponse({"success": True, "message": "Logged out."})
    clear_auth_cookies(response)
    try:
        token = request.cookies.get("access_token")
        if token and supabase:
            supabase.auth.sign_out()
    except Exception:
        pass
    return response

@app.post("/api/forgot-password")
async def api_forgot_password(req: ForgotPasswordRequest, request: Request):
    if not supabase:
        raise HTTPException(status_code=500, detail="Auth service unavailable.")
    try:
        origin = request.headers.get("origin") or str(request.base_url).rstrip("/")
        redirect_url = f"{origin}/reset-password"
        supabase.auth.reset_password_email(req.email, {"redirect_to": redirect_url})
    except Exception as e:
        pass
    return {"success": True, "message": "If an account with that email exists, you will receive a reset link shortly."}

@app.post("/api/reset-password")
async def api_reset_password(req: ResetPasswordRequest):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    password_pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$"
    if not re.match(password_pattern, req.password):
        raise HTTPException(status_code=400, detail="Password does not meet requirements.")
    if not supabase:
        raise HTTPException(status_code=500, detail="Auth service unavailable.")
    try:
        supabase.auth.set_session(req.access_token, req.refresh_token)
        supabase.auth.update_user({"password": req.password})
        supabase.auth.sign_out()
        return {"success": True, "message": "Password updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Reset link expired or invalid.")

@app.post("/api/register")
async def api_submit_registration(req: RegistrationRequest, request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if has_existing_registration(user["email"]):
        raise HTTPException(status_code=400, detail="You have already registered a team.")
    
    team_size = max(1, min(4, req.team_size))
    members = [(req.m1_name, req.m1_email, req.m1_phone)]
    if team_size >= 2: members.append((req.m2_name, req.m2_email, req.m2_phone))
    if team_size >= 3: members.append((req.m3_name, req.m3_email, req.m3_phone))
    if team_size >= 4: members.append((req.m4_name, req.m4_email, req.m4_phone))
    
    email_re = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")
    phone_re = re.compile(r"^[\d\s\+\-()]{7,20}$")
    
    for name, email, phone in members:
        if not name.strip():
            raise HTTPException(status_code=400, detail="All member names are required.")
        if not email_re.match(email):
            raise HTTPException(status_code=400, detail=f"Invalid email: {email}")
        if not phone_re.match(phone):
            raise HTTPException(status_code=400, detail=f"Invalid phone number for {name}.")

    ps_counts = get_problem_statement_counts()
    if ps_counts.get(req.problem_statement, 0) >= 10:
        raise HTTPException(status_code=400, detail=f"Problem Statement {req.problem_statement} has reached its maximum capacity of 10 teams.")

    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        data = {
            "team_name": req.team_name,
            "university": req.university,
            "problem_statement": req.problem_statement,
            "team_size": team_size,
            "leader_name": req.m1_name, "leader_email": req.m1_email, "leader_phone": req.m1_phone,
            "member2_name": req.m2_name if team_size >= 2 else None, "member2_email": req.m2_email if team_size >= 2 else None, "member2_phone": req.m2_phone if team_size >= 2 else None,
            "member3_name": req.m3_name if team_size >= 3 else None, "member3_email": req.m3_email if team_size >= 3 else None, "member3_phone": req.m3_phone if team_size >= 3 else None,
            "member4_name": req.m4_name if team_size >= 4 else None, "member4_email": req.m4_email if team_size >= 4 else None, "member4_phone": req.m4_phone if team_size >= 4 else None,
            "registered_by": user["email"],
            "registered_at": datetime.now(timezone.utc).isoformat(),
        }
        supabase.table("registrations").insert(data).execute()
        return {"success": True, "message": "Registration successful!"}
    except Exception as e:
        print(f"Registration Error: {e}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.put("/api/register")
async def api_edit_registration(req: RegistrationRequest, request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    registration = get_existing_registration(user["email"])
    if not registration:
        raise HTTPException(status_code=404, detail="No registration found.")
    
    team_size = max(1, min(4, req.team_size))
    members = [(req.m1_name, req.m1_email, req.m1_phone)]
    if team_size >= 2: members.append((req.m2_name, req.m2_email, req.m2_phone))
    if team_size >= 3: members.append((req.m3_name, req.m3_email, req.m3_phone))
    if team_size >= 4: members.append((req.m4_name, req.m4_email, req.m4_phone))
    
    email_re = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")
    phone_re = re.compile(r"^[\d\s\+\-()]{7,20}$")
    
    for name, email, phone in members:
        if not name.strip():
            raise HTTPException(status_code=400, detail="All member names are required.")
        if not email_re.match(email):
            raise HTTPException(status_code=400, detail=f"Invalid email: {email}")
        if not phone_re.match(phone):
            raise HTTPException(status_code=400, detail=f"Invalid phone number for {name}.")

    old_ps = registration.get("problem_statement")
    if req.problem_statement != old_ps:
        ps_counts = get_problem_statement_counts()
        if ps_counts.get(req.problem_statement, 0) >= 10:
            raise HTTPException(status_code=400, detail=f"Problem Statement {req.problem_statement} has reached its maximum capacity of 10 teams.")

    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        update_data = {
            "team_name": req.team_name,
            "university": req.university,
            "problem_statement": req.problem_statement,
            "team_size": team_size,
            "leader_name": req.m1_name, "leader_email": req.m1_email, "leader_phone": req.m1_phone,
            "member2_name": req.m2_name if team_size >= 2 else None, "member2_email": req.m2_email if team_size >= 2 else None, "member2_phone": req.m2_phone if team_size >= 2 else None,
            "member3_name": req.m3_name if team_size >= 3 else None, "member3_email": req.m3_email if team_size >= 3 else None, "member3_phone": req.m3_phone if team_size >= 3 else None,
            "member4_name": req.m4_name if team_size >= 4 else None, "member4_email": req.m4_email if team_size >= 4 else None, "member4_phone": req.m4_phone if team_size >= 4 else None,
        }
        supabase.table("registrations").update(update_data).eq("id", registration["id"]).execute()
        return {"success": True, "message": "Registration updated successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Update failed.")

@app.get("/health")
async def health_check():
    return {"status": "ok", "supabase_connected": supabase is not None}

# ── Static / React Catch-all ────────────────────────────────
# Mount assets
if os.path.exists(os.path.join(FRONTEND_DIST, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(FRONTEND_DIST, "static")), name="static")
elif os.path.exists(os.path.join(BASE_DIR, "static")):
    app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
    
if os.path.exists(os.path.join(FRONTEND_DIST, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    file_path = os.path.join(FRONTEND_DIST, full_path)
    
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return JSONResponse(status_code=404, content={"detail": "Not Found"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)