# backend/tools/reset_user_password.py
import asyncio
import os
import sys
from argparse import ArgumentParser

# Ensure backend folder is on sys.path when running directly
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from app.db import AsyncSessionLocal
from app import models, utils

async def reset_password(username=None, email=None, new_password=None, mark_temp=True):
    if not (username or email):
        print("Provide --username or --email")
        return
    if not new_password:
        print("Provide --password (must be at least 16 characters).")
        return
    if len(new_password) < 16:
        print("Password too short. It must be at least 16 characters.")
        return

    async with AsyncSessionLocal() as session:
        if username:
            q = await session.execute(models.User.__table__.select().where(models.User.username == username))
        else:
            q = await session.execute(models.User.__table__.select().where(models.User.email == email))
        row = q.first()
        if not row:
            print("User not found.")
            return
        user_id = row[0]  # first column is id (row is a RowMapping)
        # Hash and update
        hashed = utils.hash_password(new_password)
        await session.execute(
            models.User.__table__.update().where(models.User.id == user_id).values(password_hash=hashed, temp_password=mark_temp)
        )
        await session.commit()
        print(f"Password for user id={user_id} updated. New password: {new_password} (please keep it safe)")

def main():
    p = ArgumentParser()
    p.add_argument("--username", help="username to reset")
    p.add_argument("--email", help="email to reset")
    p.add_argument("--password", help="new password (16+ chars)")
    p.add_argument("--no-temp", action="store_true", help="If set, mark temp_password = false (otherwise true)")
    args = p.parse_args()

    asyncio.run(reset_password(username=args.username, email=args.email, new_password=args.password, mark_temp=not args.no_temp))

if __name__ == "__main__":
    main()
