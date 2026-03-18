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

load_dotenv()

app = FastAPI(title="Technodium 2026 API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

def get_current_user(request: Request):
    access_token = request.cookies.get("access_token")
    if not access_token or not supabase: return None
    try:
        resp = supabase.auth.get_user(access_token)
        if resp and resp.user:
            meta = resp.user.user_metadata or {}
            return {"email": resp.user.email, "id": resp.user.id, "name": meta.get("full_name", resp.user.email)}
    except: pass
    return None

@app.get("/api/user")
async def api_get_user(request: Request):
    user = get_current_user(request)
    return {"authenticated": bool(user), "user": user}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "supabase_connected": supabase is not None}
