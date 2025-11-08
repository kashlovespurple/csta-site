# models.py
# Put SQLAlchemy models here when you add database support.

# backend/app/models.py
from sqlalchemy import (
    Column, Integer, String, Text, Date, Boolean, DateTime, ForeignKey, UniqueConstraint, JSON, Numeric
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(Text, unique=True, nullable=False)
    email = Column(Text, unique=True)
    password_hash = Column(Text, nullable=False)
    first_name = Column(Text)
    last_name = Column(Text)
    role = Column(Text, nullable=False, default="student")  # student, faculty, admin, dean, superadmin
    temp_password = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("Student", back_populates="user", uselist=False)
    # faculty/admin relationships can be added later


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    student_number = Column(Text, unique=True)
    program_id = Column(Integer, ForeignKey("programs.id"))
    year_level = Column(Integer)
    birthdate = Column(Date)
    contact = Column(Text)
    status = Column(Text, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="student")
    program = relationship("Program", back_populates="students")


class EnrollRequest(Base):
    __tablename__ = "enroll_requests"
    id = Column(Integer, primary_key=True)
    first_name = Column(Text, nullable=False)
    last_name = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    birthdate = Column(Date)
    program = Column(Text)
    year_level = Column(Text)
    contact = Column(Text)
    address = Column(Text)
    remarks = Column(Text)
    status = Column(Text, default="pending")  # pending / accepted / rejected
    handled_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    handled_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True)
    code = Column(Text, unique=True, nullable=False)
    name = Column(Text, nullable=False)
    college_name = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    students = relationship("Student", back_populates="program")


class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)
    code = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    units = Column(Integer, default=3)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("code", name="ux_courses_code"),)


class SchoolYear(Base):
    __tablename__ = "school_years"
    id = Column(Integer, primary_key=True)
    academic_year = Column(Text, nullable=False)  # e.g. '2025-2026'
    semester = Column(Text, nullable=False)       # '1st', '2nd', 'Summer'
    start_date = Column(Date)
    end_date = Column(Date)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CourseOffering(Base):
    __tablename__ = "course_offerings"
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    faculty_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    school_year_id = Column(Integer, ForeignKey("school_years.id", ondelete="SET NULL"))
    section = Column(Text)
    schedule_info = Column(JSON)  # JSONB in PG; SQLAlchemy will use JSON
    room = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course")
    school_year = relationship("SchoolYear")


class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_offering_id = Column(Integer, ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=False)
    status = Column(Text, default="enrolled")
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("student_id", "course_offering_id", name="ux_enrollment_student_offering"),)


class Grade(Base):
    __tablename__ = "grades"
    id = Column(Integer, primary_key=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id", ondelete="CASCADE"), nullable=False)
    quiz_scores = Column(JSON, default=[])  # JSON array
    exam_scores = Column(JSON, default=[])
    pre_grade = Column(Numeric(6, 2))
    mid_grade = Column(Numeric(6, 2))
    final_grade = Column(Numeric(6, 2))
    official = Column(Boolean, default=False)
    updated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    actor_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    entity = Column(Text, nullable=False)   # table name
    entity_id = Column(Integer)
    action = Column(Text, nullable=False)   # create/update/delete/accept
    old_value = Column(JSON)
    new_value = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
