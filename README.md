# Group 1

- Domingo, John Carl F.
- Adlaon, Aaron I.
- Villanueva, Christian Jay
- Ebale, Kyle Christian
- Gaganting, Carolyn

# BSIT 2C, ITPC 103 Fundamental of Database Systems

# Employee Reporting Management System

## Prerequisites

- **Node.js** (v18 or higher) and **npm**
- **MySQL** (MySQL Server, XAMPP, or MySQL Workbench)

---

## Setup & Installation

### 1. Set Up the Database

Make sure your MySQL server is running, then import the schema and sample data:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

> **Note:** You can also open `database/schema.sql` and `database/seed.sql` in **phpMyAdmin** or **MySQL Workbench** and execute them in order (`schema.sql` first, then `seed.sql`).

### 2. Configure & Start the Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (you can copy `backend/.env.example`) and update your MySQL credentials if needed:

```env
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=employee_management
DB_POOL_SIZE=10

JWT_SECRET=replace_with_a_random_secret_at_least_16_characters
JWT_EXPIRES_IN=8h

WORK_START_TIME=09:00
LATE_GRACE_MINUTES=15
```

Start the backend server:

```bash
npm run dev
```

The API will run at `http://localhost:5000/api`.

### 3. Configure & Start the Frontend

Open a new terminal window:

```bash
cd frontend
npm install
```

Optionally create `frontend/.env` from `frontend/.env.example`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the React development server:

```bash
npm start
```

The app will open in your browser at `http://localhost:3000`.

---

## Demo Accounts

| Role     | Username    | Password       |
| -------- | ----------- | -------------- |
| Admin    | `admin`     | `Admin@123`    |
| Employee | `jdelacruz` | `Employee@123` |

Other seeded employee usernames (password `Employee@123`): `areyes`, `cmendoza`, `lgarcia`, `mvillanueva`, `gbautista`, `pramos`, `raquino`.

---

## How to Use

### Navigation
- Use the **left icon rail** to jump quickly between pages, or click the **expand button** (or EMS badge) to open the full **split-panel navigation drawer**.
- Toggle between **dark mode** and **light mode** from the top bar or under **Account Settings** in the drawer.

### As an Admin
- **Dashboard:** View workforce totals, attendance summaries, department breakdowns, and approve/reject pending leave requests.
- **Employees:** Add, edit, search, filter, and manage employee records.
- **Departments & Positions:** Create and manage company departments and job positions.
- **Attendance:** View Today's Overview (Present, Late, Absent, On leave), filter logs by employee/department/date, add or edit records manually, and run **Mark absentees**.
- **Leave Requests:** Review, approve, or reject employee leave applications with remarks.
- **Reports:** Generate and review attendance, employee, and leave summaries.

### As an Employee
- **Dashboard:** See your attendance status, quick clock-in/clock-out card, and recent activity.
- **My Attendance:** Use the **Live Attendance** card to **Time In** and **Time Out**, and filter your personal attendance history.
- **My Leaves:** Submit new leave requests, track approval status, and cancel pending requests.
- **My Profile:** View your personal/employment details, update your profile photo, and change your password.


