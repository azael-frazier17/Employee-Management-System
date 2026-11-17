-- =====================================================================
-- Employee Management System - Sample Data (single company)
-- Usage : mysql -u root -p < database/seed.sql      (run schema.sql first)
--
-- WARNING: this script TRUNCATES all tables so it can be re-run. Use it on
--          development / demo databases only, never on live data.
--
-- Demo logins
--   Admin    : admin       / Admin@123
--   Employee : jdelacruz, areyes, cmendoza, lgarcia, mvillanueva,
--              gbautista, pramos, raquino   / Employee@123
--   (btorres is an inactive account and cannot log in)
--
-- Attendance and leave dates are relative to CURDATE(), so the demo data
-- always looks recent. Today is intentionally left without attendance rows
-- so you can try the time-in / time-out endpoints.
-- =====================================================================

USE employee_management;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE leaves;
TRUNCATE TABLE attendance;
TRUNCATE TABLE employees;
TRUNCATE TABLE positions;
TRUNCATE TABLE departments;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Departments & positions
-- ---------------------------------------------------------------------
INSERT INTO departments (id, name, description) VALUES
  (1, 'Human Resources',     'Recruitment, employee records and HR administration'),
  (2, 'Information Technology', 'Software development and IT support'),
  (3, 'Finance & Accounting','Bookkeeping, budgeting and financial reporting'),
  (4, 'Operations',          'Day-to-day business operations and logistics'),
  (5, 'Sales & Marketing',   'Customer acquisition, sales and promotions');

INSERT INTO positions (id, department_id, title, description) VALUES
  (1,  1, 'HR Manager',            'Heads the HR office'),
  (2,  1, 'HR Assistant',          'Maintains employee records and files'),
  (3,  2, 'Software Developer',    'Builds and maintains internal systems'),
  (4,  2, 'IT Support Specialist', 'Hardware, network and user support'),
  (5,  2, 'Systems Administrator', 'Servers and infrastructure'),
  (6,  3, 'Accountant',            'General ledger and reporting'),
  (7,  3, 'Accounting Clerk',      'Encoding and reconciliation'),
  (8,  4, 'Operations Supervisor', 'Supervises operations staff'),
  (9,  4, 'Operations Staff',      'Front-line operations'),
  (10, 5, 'Sales Executive',       'Handles client accounts'),
  (11, 5, 'Marketing Associate',   'Campaigns and content');

-- ---------------------------------------------------------------------
-- Users (bcrypt hashes, cost 10)
--   Admin@123    -> $2a$10$45dUMjBPaQZPoX/eUehI5OX3cMi.0PfJn8qdxG/CQ5otSVB7zpZA2
--   Employee@123 -> $2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO
-- ---------------------------------------------------------------------
INSERT INTO users (id, username, password_hash, role, is_active) VALUES
  (1,  'admin',       '$2a$10$45dUMjBPaQZPoX/eUehI5OX3cMi.0PfJn8qdxG/CQ5otSVB7zpZA2', 'Admin',    1),
  (2,  'jdelacruz',   '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (3,  'areyes',      '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (4,  'cmendoza',    '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (5,  'lgarcia',     '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (6,  'mvillanueva', '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (7,  'gbautista',   '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (8,  'pramos',      '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (9,  'raquino',     '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 1),
  (10, 'btorres',     '$2a$10$.i1fhLSr6F2jZfaQIG2/reAXhDmIyUIf8Wn0QruS8Eub6iz41VNCO', 'Employee', 0);

-- ---------------------------------------------------------------------
-- Employees (employee 1 is the HR admin's own record)
-- ---------------------------------------------------------------------
INSERT INTO employees
  (id, user_id, employee_code, first_name, last_name, email, phone, address, birth_date, gender,
   department_id, position_id, date_hired, status) VALUES
  (1,  1,  'EMP-0001', 'Maria',   'Santos',     'maria.santos@acme.example',     '0917-555-0101', '12 Rizal St., General Santos City',   '1985-03-14', 'Female', 1, 1,  '2018-01-15', 'Active'),
  (2,  2,  'EMP-0002', 'Jose',    'Dela Cruz',  'jose.delacruz@acme.example',    '0917-555-0102', '45 Pioneer Ave., General Santos City','1992-07-22', 'Male',   2, 3,  '2020-06-01', 'Active'),
  (3,  3,  'EMP-0003', 'Ana',     'Reyes',      'ana.reyes@acme.example',        '0917-555-0103', '8 Santiago Blvd., General Santos City','1995-11-05', 'Female', 2, 4,  '2021-02-10', 'Active'),
  (4,  4,  'EMP-0004', 'Carlo',   'Mendoza',    'carlo.mendoza@acme.example',    '0917-555-0104', '23 Lagao Rd., General Santos City',   '1988-01-30', 'Male',   3, 6,  '2019-09-02', 'Active'),
  (5,  5,  'EMP-0005', 'Liza',    'Garcia',     'liza.garcia@acme.example',      '0917-555-0105', '77 City Heights, General Santos City','1997-05-18', 'Female', 3, 7,  '2022-03-21', 'Active'),
  (6,  6,  'EMP-0006', 'Mark',    'Villanueva', 'mark.villanueva@acme.example',  '0917-555-0106', '5 Bula Rd., General Santos City',     '1990-09-09', 'Male',   4, 8,  '2019-04-08', 'Active'),
  (7,  7,  'EMP-0007', 'Grace',   'Bautista',   'grace.bautista@acme.example',   '0917-555-0107', '31 Calumpang Rd., General Santos City','1994-12-02', 'Female', 5, 10, '2021-08-16', 'Active'),
  (8,  8,  'EMP-0008', 'Paolo',   'Ramos',      'paolo.ramos@acme.example',      '0917-555-0108', '19 Dadiangas Ave., General Santos City','1996-04-27','Male',   5, 11, '2023-01-09', 'Active'),
  (9,  9,  'EMP-0009', 'Rina',    'Aquino',     'rina.aquino@acme.example',      '0917-555-0109', '60 Apopong Rd., General Santos City', '1998-08-11', 'Female', 1, 2,  '2023-07-03', 'Active'),
  (10, 10, 'EMP-0010', 'Benjamin','Torres',     'ben.torres@acme.example',       '0917-555-0110', '14 Fatima Rd., General Santos City',  '1987-02-19', 'Male',   4, 9,  '2017-05-22', 'Inactive');

-- ---------------------------------------------------------------------
-- Leave requests (dates relative to today)
-- ---------------------------------------------------------------------
INSERT INTO leaves
  (employee_id, leave_type, start_date, end_date, reason, status, reviewed_by, reviewed_at, admin_remarks) VALUES
  (2, 'Vacation',  CURDATE() - INTERVAL 40 DAY, CURDATE() - INTERVAL 38 DAY, 'Family trip to Davao',               'Approved', 1, NOW() - INTERVAL 45 DAY, 'Enjoy your trip'),
  (3, 'Sick',      CURDATE() - INTERVAL 12 DAY, CURDATE() - INTERVAL 11 DAY, 'Fever and flu, doctor advised rest',  'Approved', 1, NOW() - INTERVAL 12 DAY, 'Please submit medical certificate'),
  (4, 'Emergency', CURDATE() - INTERVAL 6 DAY,  CURDATE() - INTERVAL 6 DAY,  'Family emergency',                    'Approved', 1, NOW() - INTERVAL 6 DAY,  NULL),
  (5, 'Vacation',  CURDATE() - INTERVAL 25 DAY, CURDATE() - INTERVAL 21 DAY, 'Out-of-town wedding',                 'Rejected', 1, NOW() - INTERVAL 30 DAY, 'Month-end closing; please reschedule'),
  (7, 'Vacation',  CURDATE() + INTERVAL 10 DAY, CURDATE() + INTERVAL 14 DAY, 'Birthday trip with family',           'Pending',  NULL, NULL, NULL),
  (8, 'Sick',      CURDATE() + INTERVAL 2 DAY,  CURDATE() + INTERVAL 3 DAY,  'Scheduled dental surgery',            'Pending',  NULL, NULL, NULL),
  (6, 'Emergency', CURDATE() + INTERVAL 1 DAY,  CURDATE() + INTERVAL 1 DAY,  'House repair after storm damage',     'Approved', 1, NOW() - INTERVAL 1 DAY,  'Approved'),
  (9, 'Other',     CURDATE() + INTERVAL 20 DAY, CURDATE() + INTERVAL 21 DAY, 'Attending a certification exam',      'Pending',  NULL, NULL, NULL);

-- ---------------------------------------------------------------------
-- Attendance for the last 21 days (weekdays only, Active employees).
-- Deterministic mix: ~1/12 Absent, ~3/12 Late, rest Present.
-- Work starts 09:00 with a 15-minute grace period.
-- ---------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_days;
CREATE TEMPORARY TABLE tmp_days (n INT NOT NULL PRIMARY KEY);
INSERT INTO tmp_days (n) VALUES
  (1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),
  (12),(13),(14),(15),(16),(17),(18),(19),(20),(21);

INSERT INTO attendance (employee_id, attendance_date, time_in, time_out, status, remarks)
SELECT
  x.employee_id,
  x.dt,
  CASE x.r
    WHEN 0 THEN NULL
    WHEN 1 THEN SEC_TO_TIME(9*3600 + 16*60 + MOD(x.employee_id*11 + x.n*7, 40)*60)
    WHEN 2 THEN SEC_TO_TIME(9*3600 + 16*60 + MOD(x.employee_id*11 + x.n*7, 40)*60)
    WHEN 3 THEN SEC_TO_TIME(9*3600 + 16*60 + MOD(x.employee_id*11 + x.n*7, 40)*60)
    ELSE        SEC_TO_TIME(8*3600 + 30*60 + MOD(x.employee_id*13 + x.n*7, 28)*60)
  END,
  CASE WHEN x.r = 0 THEN NULL
       ELSE SEC_TO_TIME(17*3600 + MOD(x.employee_id*5 + x.n, 45)*60) END,
  CASE WHEN x.r = 0 THEN 'Absent' WHEN x.r IN (1,2,3) THEN 'Late' ELSE 'Present' END,
  CASE WHEN x.r = 0 THEN 'No time record' ELSE NULL END
FROM (
  SELECT e.id AS employee_id,
         d.n,
         CURDATE() - INTERVAL d.n DAY AS dt,
         MOD(e.id*7 + d.n*3, 12) AS r
  FROM employees e
  CROSS JOIN tmp_days d
  WHERE e.status = 'Active'
    AND WEEKDAY(CURDATE() - INTERVAL d.n DAY) < 5
    AND (CURDATE() - INTERVAL d.n DAY) >= e.date_hired
) x;

DROP TEMPORARY TABLE tmp_days;

-- Employees on approved leave have no attendance row for those days
DELETE a FROM attendance a
JOIN leaves l
  ON l.employee_id = a.employee_id
 AND l.status = 'Approved'
 AND a.attendance_date BETWEEN l.start_date AND l.end_date;
