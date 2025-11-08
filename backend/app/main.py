import os
from typing import Optional
from datetime import date

import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# Load backend/.env (run uvicorn from backend/ so load_dotenv() finds backend/.env)
load_dotenv()



DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set in backend/.env")

app = FastAPI(title="CSTA Backend (dev)")

# Allow Vite dev server origin(s)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for enroll form
class EnrollForm(BaseModel):
    first_name: str
    last_name: str
    email: str
    birthdate: Optional[date] = None
    program: Optional[str] = None
    year_level: Optional[str] = None
    contact: Optional[str] = None
    address: Optional[str] = None
    remarks: Optional[str] = None

# Create a connection pool and ensure table exists on startup
@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=4)

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS enroll_requests (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      birthdate DATE,
      program TEXT,
      year_level TEXT,
      contact TEXT,
      address TEXT,
      remarks TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    """
    async with app.state.db.acquire() as conn:
        await conn.execute(create_table_sql)

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()

@app.get("/api/health")
async def health():
    # return whether pool exists (True if created)
    return {"status": "ok", "db": bool(getattr(app.state, "db", None))}

@app.post("/api/enroll/online")
async def enroll(form: EnrollForm):
    insert_sql = """
    INSERT INTO enroll_requests
      (first_name, last_name, email, birthdate, program, year_level, contact, address, remarks)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING id, created_at;
    """
    async with app.state.db.acquire() as conn:
        try:
            row = await conn.fetchrow(
                insert_sql,
                form.first_name,
                form.last_name,
                form.email,
                form.birthdate,
                form.program,
                form.year_level,
                form.contact,
                form.address,
                form.remarks,
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    return {"status": "ok", "id": row["id"], "created_at": row["created_at"]}



from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from .db import get_db
from . import crud
import secrets

@app.post("/api/admin/enroll_requests/{request_id}/accept")
async def accept_enroll_request(request_id: int, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        enroll_req = await crud.get_enroll_request(db, request_id)
        if not enroll_req:
            return {"error": "Enrollment request not found."}
        if enroll_req.status != "pending":
            return {"error": f"Cannot accept enrollment with status '{enroll_req.status}'."}

        # Generate username + temp password
        base_username = enroll_req.email.split("@")[0]
        username = base_username
        temp_password = secrets.token_hex(4)

        # Create user + student
        user = await crud.create_user(
            db,
            username=username,
            email=enroll_req.email,
            first_name=enroll_req.first_name,
            last_name=enroll_req.last_name,
            password=temp_password,
            role="student"
        )
        student = await crud.create_student(db, user.id, year_level=int(enroll_req.year_level or 1))

        # Update request + log
        await crud.update_enroll_request_status(db, request_id, "accepted", handler_user_id=1)
        await crud.create_audit_log(
            db,
            actor_user_id=1,
            entity="enroll_requests",
            entity_id=enroll_req.id,
            action="accept",
            new_value={"username": username, "student_id": student.id}
        )

    await db.commit()
    return {
        "status": "ok",
        "username": username,
        "temp_password": temp_password,
        "user_id": user.id,
        "student_id": student.id
    }



