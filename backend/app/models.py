# backend/app/models.py
from sqlalchemy import Boolean
from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(Text, unique=True, nullable=False)
    email = Column(Text)
    password_hash = Column(Text, nullable=False)
    first_name = Column(Text)
    last_name = Column(Text)
    role = Column(Text, default="student")
    temp_password = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    year_level = Column(Integer)
    contact = Column(Text)
    address = Column(Text)
    user = relationship("User", back_populates="student")


class EnrollRequest(Base):
    __tablename__ = "enroll_requests"
    id = Column(Integer, primary_key=True)
    first_name = Column(Text)
    last_name = Column(Text)
    email = Column(Text)
    program = Column(Text)
    year_level = Column(Text)
    contact = Column(Text)
    address = Column(Text)
    status = Column(Text, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
