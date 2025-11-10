# backend/app/main.py

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import secrets
from sqlalchemy import select
from datetime import datetime
import secrets

from app.db import get_db
from app.models import User, Student, EnrollRequest
from app.utils import hash_password
from app.auth import router as auth_router
from app.auth import get_current_user, require_admin


app = FastAPI(title="CSTA Backend (Simplified)")
app.include_router(auth_router)

# Allow frontend requests from Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------
# Health check
# -------------------------------------------------------
@app.get("/api/health")
async def health():
    return {"status": "ok"}


# -------------------------------------------------------
# Enrollment form (public)
# -------------------------------------------------------
@app.post("/api/enroll")
async def enroll(form: dict, db: AsyncSession = Depends(get_db)):
    """Anyone can submit enrollment info"""
    new_req = EnrollRequest(
        first_name=form.get("first_name"),
        last_name=form.get("last_name"),
        email=form.get("email"),
        program=form.get("program"),
        year_level=form.get("year_level"),
        contact=form.get("contact"),
        address=form.get("address"),
        status="pending",
    )
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return {"status": "ok", "id": new_req.id}


# -------------------------------------------------------
# Student profile (requires token)
# -------------------------------------------------------
@app.get("/api/student/me")
async def get_student_me(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return student info for the logged-in user"""
    q = await db.execute(select(Student).where(Student.user_id == current_user["id"]))
    student = q.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    return {
        "user": current_user,
        "student": {
            "id": student.id,
            "year_level": student.year_level,
            "contact": student.contact,
            "address": student.address,
        },
    }


# -------------------------------------------------------
# Admin endpoints
# -------------------------------------------------------
@app.get("/api/admin/enroll_requests")
async def list_enroll_requests(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = await db.execute(select(EnrollRequest))
    data = q.scalars().all()
    return [
        {
            "id": r.id,
            "first_name": r.first_name,
            "last_name": r.last_name,
            "email": r.email,
            "program": r.program,
            "year_level": r.year_level,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in data
    ]


@app.post("/api/admin/enroll_requests/{request_id}/accept")
async def accept_enroll_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    admin = Depends(require_admin),
):
    """Accept an enrollment request and create a student user (defensive + robust)."""
    q = await db.execute(select(EnrollRequest).where(EnrollRequest.id == request_id))
    req = q.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail="Already processed")

    # base username from email local-part, fallback to 'user'
    base = (req.email.split("@")[0] if getattr(req, "email", None) else "user").strip()
    if not base:
        base = "user"
    username = base
    temp_pw = secrets.token_urlsafe(8)
    hashed_pw = hash_password(temp_pw)

    # Try to create a unique username (username, username1, username2, ...)
    counter = 0
    user = None
    while True:
        try:
            user = User(
                username=username,
                email=getattr(req, "email", None),
                password_hash=hashed_pw,
                first_name=getattr(req, "first_name", None),
                last_name=getattr(req, "last_name", None),
                role="student",
                temp_password=True,
            )
            db.add(user)
            await db.flush()  # may raise IntegrityError on unique constraint
            break
        except IntegrityError:
            # username/email collision - rollback and try a new username
            await db.rollback()
            counter += 1
            username = f"{base}{counter}"
            if counter > 20:
                raise HTTPException(status_code=500, detail="Could not generate unique username; manual intervention required")
        except SQLAlchemyError as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error while creating user: {str(e)}")

    # Safe conversion of year_level to integer (DB column is INT)
    year_level_val = None
    try:
        raw = getattr(req, "year_level", None)
        if raw is not None and raw != "":
            if isinstance(raw, int):
                year_level_val = raw
            else:
                s = str(raw).strip()
                # allow "1" or "1.0" etc.
                year_level_val = int(float(s))
    except Exception:
        year_level_val = None

    contact = getattr(req, "contact", None)
    address = getattr(req, "address", None)

    try:
        student = Student(
            user_id=user.id,
            year_level=year_level_val,
            contact=contact,
            address=address,
        )
        db.add(student)
        req.status = "accepted"
        await db.commit()

        # refresh to get IDs set
        await db.refresh(user)
        await db.refresh(student)
    except SQLAlchemyError as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error while creating student: {str(e)}")

    return {
        "username": username,
        "temp_password": temp_pw,
        "user_id": user.id,
        "student_id": student.id,
    }



@app.post("/api/admin/enroll_requests/{request_id}/reject")
async def reject_enroll_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    q = await db.execute(select(EnrollRequest).where(EnrollRequest.id == request_id))
    req = q.scalars().first()
    if not req:
        raise HTTPException(404, "Enrollment not found")
    if req.status != "pending":
        raise HTTPException(400, "Already processed")

    req.status = "rejected"
    await db.commit()
    return {"status": "ok", "message": "Request rejected"}
