-- =====================================================================
-- Employee Management System - Database Schema
-- Target: MySQL 8.0+ (also runs on MariaDB 10.5+)
-- Usage : mysql -u root -p < database/schema.sql
-- Safe to re-run: uses IF NOT EXISTS and never drops data.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS employee_management
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE employee_management;

-- ---------------------------------------------------------------------
-- users : login accounts (two roles only: Admin, Employee)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('Admin','Employee') NOT NULL DEFAULT 'Employee',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME     NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- departments
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- positions : job positions, each belonging to one department
--   Deleting a department removes its positions (CASCADE), but the delete
--   is blocked while employees still reference those positions/department.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS positions (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id INT UNSIGNED NOT NULL,
  title         VARCHAR(100) NOT NULL,
  description   VARCHAR(255) NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_positions_dept_title (department_id, title),
  CONSTRAINT fk_positions_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- employees
--   user_id     : optional 1-to-1 link to a login account.
--                 ON DELETE SET NULL keeps the HR record if the account goes.
--   department / position : ON DELETE RESTRICT so you cannot silently orphan
--                 employees by deleting a department or position in use.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NULL,
  employee_code VARCHAR(20)  NOT NULL,
  first_name    VARCHAR(60)  NOT NULL,
  last_name     VARCHAR(60)  NOT NULL,
  email         VARCHAR(120) NOT NULL,
  phone         VARCHAR(30)  NULL,
  address       VARCHAR(255) NULL,
  birth_date    DATE         NULL,
  gender        ENUM('Male','Female','Other') NULL,
  department_id INT UNSIGNED NULL,
  position_id   INT UNSIGNED NULL,
  date_hired    DATE         NOT NULL,
  status        ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_employees_user (user_id),
  UNIQUE KEY uq_employees_code (employee_code),
  UNIQUE KEY uq_employees_email (email),
  KEY idx_employees_name (last_name, first_name),
  KEY idx_employees_department (department_id),
  KEY idx_employees_position (position_id),
  KEY idx_employees_status (status),
  KEY idx_employees_date_hired (date_hired),
  CONSTRAINT fk_employees_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_employees_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_employees_position
    FOREIGN KEY (position_id) REFERENCES positions (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- attendance : one row per employee per day
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id     INT UNSIGNED NOT NULL,
  attendance_date DATE         NOT NULL,
  time_in         TIME         NULL,
  time_out        TIME         NULL,
  status          ENUM('Present','Late','Absent') NOT NULL,
  remarks         VARCHAR(255) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_emp_date (employee_id, attendance_date),
  KEY idx_attendance_date (attendance_date),
  KEY idx_attendance_status_date (status, attendance_date),
  CONSTRAINT chk_attendance_times
    CHECK (time_in IS NULL OR time_out IS NULL OR time_out >= time_in),
  CONSTRAINT fk_attendance_employee
    FOREIGN KEY (employee_id) REFERENCES employees (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- leaves : leave requests submitted by employees, reviewed by Admin
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leaves (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id   INT UNSIGNED NOT NULL,
  leave_type    ENUM('Vacation','Sick','Emergency','Maternity','Paternity','Other') NOT NULL DEFAULT 'Vacation',
  start_date    DATE         NOT NULL,
  end_date      DATE         NOT NULL,
  reason        VARCHAR(500) NOT NULL,
  status        ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  reviewed_by   INT UNSIGNED NULL,
  reviewed_at   DATETIME     NULL,
  admin_remarks VARCHAR(255) NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_leaves_employee_status (employee_id, status),
  KEY idx_leaves_status (status),
  KEY idx_leaves_dates (start_date, end_date),
  KEY idx_leaves_reviewed_by (reviewed_by),
  CONSTRAINT chk_leaves_dates CHECK (end_date >= start_date),
  CONSTRAINT fk_leaves_employee
    FOREIGN KEY (employee_id) REFERENCES employees (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_leaves_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;
