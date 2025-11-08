-- Phase 1 migration: core 10 tables for CSTA MVP
-- Run this against your csta_dev database

BEGIN;

-- 1) users
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL,
  email           TEXT UNIQUE,
  password_hash   TEXT NOT NULL,
  first_name      TEXT,
  last_name       TEXT,
  role            TEXT NOT NULL DEFAULT 'student', -- student, faculty, admin, dean, superadmin
  temp_password   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2) students
CREATE TABLE IF NOT EXISTS students (
  id              SERIAL PRIMARY KEY,
  user_id         INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_number  TEXT UNIQUE,
  program_id      INT, -- FK to programs table (added below)
  year_level      INT,
  birthdate       DATE,
  contact_no      TEXT,
  status          TEXT DEFAULT 'active', -- active / inactive
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);

-- 3) enroll_requests
CREATE TABLE IF NOT EXISTS enroll_requests (
  id              SERIAL PRIMARY KEY,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  birthdate       DATE,
  program_applied TEXT,
  year_level      TEXT,
  contact_no      TEXT,
  address         TEXT,
  remarks         TEXT,
  status          TEXT DEFAULT 'pending', -- pending / accepted / rejected
  handled_by      INT REFERENCES users(id) ON DELETE SET NULL,
  handled_at      TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enroll_requests_status ON enroll_requests(status);
CREATE INDEX IF NOT EXISTS idx_enroll_requests_email ON enroll_requests(email);

-- 4) programs
CREATE TABLE IF NOT EXISTS programs (
  id              SERIAL PRIMARY KEY,
  code            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  college_name    TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5) courses
CREATE TABLE IF NOT EXISTS courses (
  id              SERIAL PRIMARY KEY,
  code            TEXT NOT NULL,
  title           TEXT NOT NULL,
  units           INT DEFAULT 3,
  description     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- 6) school_years
CREATE TABLE IF NOT EXISTS school_years (
  id              SERIAL PRIMARY KEY,
  academic_year   TEXT NOT NULL, -- e.g. '2025-2026'
  semester        TEXT NOT NULL, -- '1st', '2nd', 'Summer'
  start_date      DATE,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_years_active ON school_years(is_active);

-- 7) course_offerings
CREATE TABLE IF NOT EXISTS course_offerings (
  id                  SERIAL PRIMARY KEY,
  course_id           INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  faculty_user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  school_year_id      INT REFERENCES school_years(id) ON DELETE SET NULL,
  section             TEXT,
  schedule_info       JSONB,
  room                TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_offerings_course ON course_offerings(course_id);

-- 8) enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id                  SERIAL PRIMARY KEY,
  student_id          INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_offering_id  INT NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
  status              TEXT DEFAULT 'enrolled', -- enrolled/dropped/completed
  enrolled_at         TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_enrollment_student_offering ON enrollments(student_id, course_offering_id);

-- 9) grades
CREATE TABLE IF NOT EXISTS grades (
  id                  SERIAL PRIMARY KEY,
  enrollment_id       INT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  quiz_scores         JSONB DEFAULT '[]'::jsonb,
  exam_scores         JSONB DEFAULT '[]'::jsonb,
  pre_grade           NUMERIC(6,2),
  mid_grade           NUMERIC(6,2),
  final_grade         NUMERIC(6,2),
  official            BOOLEAN DEFAULT FALSE,
  updated_by          INT REFERENCES users(id) ON DELETE SET NULL,
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grades_enrollment ON grades(enrollment_id);

-- 10) audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id                  SERIAL PRIMARY KEY,
  actor_user_id       INT REFERENCES users(id) ON DELETE SET NULL,
  entity              TEXT NOT NULL, -- table name e.g., 'grades'
  entity_id           INT,           -- id of the record that changed
  action              TEXT NOT NULL, -- create/update/delete/accept
  old_value           JSONB,
  new_value           JSONB,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);

COMMIT;
