# crud.py
# Put CRUD helper functions for interacting with DB here later.

# backend/app/crud.py
import logging
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.hash import pbkdf2_sha256  # use pbkdf2 (no bcrypt dependency)
from .models import User, Student, EnrollRequest, AuditLog

logger = logging.getLogger(__name__)

# --- Enroll Requests ---
async def get_enroll_request(db: AsyncSession, request_id: int):
    q = await db.execute(select(EnrollRequest).where(EnrollRequest.id == request_id))
    return q.scalar_one_or_none()

async def update_enroll_request_status(db: AsyncSession, request_id: int, status: str, handler_user_id: int):
    stmt = (
        update(EnrollRequest)
        .where(EnrollRequest.id == request_id)
        .values(status=status, handled_by=handler_user_id, handled_at=datetime.utcnow())
    )
    await db.execute(stmt)

# --- Users ---
async def create_user(db: AsyncSession, username: str, email: str,
                      first_name: str, last_name: str, password: str,
                      role: str = "student"):
    # Ensure password is a str
    if password is None:
        password = ""
    if not isinstance(password, str):
        password = str(password)

    # Truncate to 72 bytes at bytes level (keeps parity with previous bcrypt approach)
    pw_bytes = password.encode("utf-8", errors="ignore")
    if len(pw_bytes) > 72:
        pw_bytes = pw_bytes[:72]
        password = pw_bytes.decode("utf-8", errors="ignore")

    logger.debug("Creating user %s with temp password length %d bytes", username, len(password.encode("utf-8")))

    # Use pbkdf2_sha256 (no external bcrypt dependency). Reasonable secure for dev.
    hashed_pw = pbkdf2_sha256.hash(password)

    user = User(
        username=username,
        email=email,
        first_name=first_name,
        last_name=last_name,
        password_hash=hashed_pw,
        role=role,
        temp_password=True
    )
    db.add(user)
    await db.flush()  # assigns user.id
    return user

# --- Students ---
async def create_student(db: AsyncSession, user_id: int, program_id: int = None, year_level: int = None):
    student = Student(
        user_id=user_id,
        program_id=program_id,
        year_level=year_level
    )
    db.add(student)
    await db.flush()
    return student

# --- Audit Logs ---
async def create_audit_log(db: AsyncSession, actor_user_id: int, entity: str, entity_id: int, action: str, new_value: dict):
    log = AuditLog(
        actor_user_id=actor_user_id,
        entity=entity,
        entity_id=entity_id,
        action=action,
        new_value=new_value,
    )
    db.add(log)
