# backend/tools/create_admin.py
import asyncio
import os
from dotenv import load_dotenv

# load backend/.env so DATABASE_URL and other settings are available
project_root = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(project_root, ".env"))

from app.db import AsyncSessionLocal  # correct name from your db.py
from app import models, utils

async def create_admin(username="admin", email="admin@csta.local", password="Admin1234567890!"):
    async with AsyncSessionLocal() as session:
        # check exists
        q = await session.execute(models.User.__table__.select().where(models.User.username == username))
        existing = q.first()
        if existing:
            print(f"User '{username}' already exists. Exiting.")
            return

        password_hash = utils.hash_password(password)
        admin = models.User(
            username=username,
            email=email,
            password_hash=password_hash,
            role="admin",
            temp_password=False
        )
        session.add(admin)
        await session.commit()
        print(f"✅ Admin account created: username='{username}', password='{password}'")

if __name__ == "__main__":
    asyncio.run(create_admin())
