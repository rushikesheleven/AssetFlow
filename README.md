# AssetFlow

[cite_start]**Enterprise Asset & Resource Management System** [cite: 47]

[cite_start]AssetFlow is an ERP module designed to solve the problem of organizations struggling with manual tracking of physical assets and shared resources (like spreadsheets or paper)[cite: 47]. [cite_start]It prevents double-bookings, lost items, and missed maintenance workflows[cite: 47]. 

[cite_start]Built for the Odoo Hackathon '26 [cite: 123][cite_start], this project strictly adheres to local-first, offline resilience constraints, utilizing zero third-party cloud APIs[cite: 129, 131, 132].

---

## 🛠 Tech Stack

[cite_start]Our stack is chosen to ensure offline dashboard resilience and strict data validation[cite: 129, 131, 159]:

* [cite_start]**Frontend Framework:** React (via Vite) + TypeScript[cite: 159].
* [cite_start]**UI/UX:** Tailwind CSS and shadcn/ui (desktop-first layout, clean corporate vibe)[cite: 51, 52, 159].
* [cite_start]**Backend Framework:** Python 3.10+ with FastAPI[cite: 159].
* [cite_start]**Database:** SQLite via SQLAlchemy ORM (local `database.db`)[cite: 136, 159].
* [cite_start]**State & Fetching:** React Query (TanStack Query) for background sync[cite: 159].
* [cite_start]**Validation:** Zod + React Hook Form (Frontend) and Pydantic (Backend)[cite: 159].
* [cite_start]**Authentication:** Local JWT-based auth via FastAPI (PyJWT & passlib)[cite: 136, 159].

---

## 🚫 Strict Hackathon Rules

1.  [cite_start]**No Third-Party APIs:** We are strictly using local SQL (SQLite) and local FastAPI logic[cite: 131]. [cite_start]Do not use MongoDB, Firebase, Supabase, Auth0, or any external cloud services[cite: 132, 159].
2.  [cite_start]**Zero Double-Allocations:** The system must block double-assignments via SQL constraints and backend checks[cite: 48, 142, 143].
3.  [cite_start]**Strict Validation:** Flawless input validation is a rubric requirement (Pydantic + Zod)[cite: 120, 129].
4.  [cite_start]**Commit Frequency:** All team members must commit code with descriptive messages every <1 hour[cite: 119, 160].

---

## 👥 Team Roles & Scopes

[cite_start]To prevent merge conflicts and maximize efficiency, code ownership is strictly divided[cite: 2, 3]:

* [cite_start]**Developer 1: The UI/UX Master (Pure Frontend)** [cite: 3]
    * [cite_start]*Scope:* React, Tailwind CSS, shadcn/ui, Zod validation, and Vite/Router setup[cite: 4, 7].
    * [cite_start]*Responsibilities:* Asset Directory data tables, intricate slide-out modals for bookings/maintenance[cite: 8, 9].
* [cite_start]**Developer 2: The Feature Owner (Full-Stack)** [cite: 13]
    * [cite_start]*Scope:* Auth Flow (Login/Signup UI + FastAPI JWT endpoints), KPI Dashboard cards + aggregation endpoints, and System Logs[cite: 15, 16, 17].
* [cite_start]**Developer 3: The API Architect (Pure Backend)** [cite: 19]
    * [cite_start]*Scope:* Core API routers (`/assets`, `/allocations`, `/bookings`, `/maintenance`), Pydantic validation, and complex allocation/overlap algorithms[cite: 23, 24, 26, 27].
* [cite_start]**Developer 4: The Data Master (Full Database + Half Backend)** [cite: 31]
    * [cite_start]*Scope:* SQLite, SQLAlchemy Models, complex SQL join queries, database CRUD helpers, and mock/seed data generation[cite: 33, 34, 35, 37, 38].

---

## 🚀 Key User Workflows

1.  [cite_start]**Authentication:** Users sign up and are assigned the "Employee" role by default[cite: 83]. [cite_start]Only Admins can promote users via the `/org-setup` dashboard[cite: 83, 89].
2.  [cite_start]**Resource Booking:** Users select a room and time slot; the system checks the database, and if an overlap exists, UI throws a Zod/Pydantic validation error instantly[cite: 95].
3.  [cite_start]**Asset Lifecycle:** Full tracking through statuses: Available -> Allocated -> Reserved -> Maintenance -> Lost -> Retired[cite: 47].
4.  [cite_start]**Maintenance Loop:** Employees raise a request (Pending) -> Asset Manager approves -> Asset status auto-updates to Under Maintenance[cite: 96, 145].

---

## 🎨 Design System (Odoo-Inspired)

* [cite_start]**Background:** Very light gray (`#F9FAFB`)[cite: 55].
* [cite_start]**Primary Brand:** Deep Purple (`#714867`) or Crisp Teal (`#0F766E`)[cite: 55].
* [cite_start]**Status Badges:** Emerald Green (Available/Approved), Blue (Allocated/In Progress), Amber (Maintenance/Pending), Rose Red (Lost/Overdue/Rejected)[cite: 58, 59].
* [cite_start]**Components:** Tables feature search, category/status filters, and pagination[cite: 61]. [cite_start]Forms use slide-out side panels (Drawers) or clean Modals[cite: 62]. [cite_start]Icons via Lucide-React[cite: 63].