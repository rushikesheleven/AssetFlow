# 🚀 AssetFlow

> **Enterprise Asset & Resource Management System**

AssetFlow is a modern ERP-inspired asset management system built for **Odoo Hackathon '26**. It helps organizations efficiently manage physical assets and shared resources while eliminating manual tracking errors, double-bookings, misplaced assets, and delayed maintenance workflows.

Designed with a **local-first architecture**, AssetFlow runs entirely offline using **FastAPI + SQLite**, ensuring reliability without depending on external cloud services.

---

# ✨ Features

## 🔐 Authentication & Role Management

- Secure JWT Authentication
- Employee Signup
- Admin-controlled Role Promotion
- Role-Based Access Control (RBAC)

Roles:
- 👑 Admin
- 🛠 Asset Manager
- 🏢 Department Head
- 👤 Employee

---

## 📦 Asset Lifecycle Management

Track every asset through its complete lifecycle:

```
Available
      ↓
Allocated
      ↓
Reserved
      ↓
Maintenance
      ↓
Lost / Retired
```

Features include:

- Asset Registration
- Category Management
- Allocation Tracking
- Asset Status Monitoring
- Return Management

---

## 📅 Resource Booking

Book shared resources such as:

- Meeting Rooms
- Projectors
- Lab Equipment

### Smart Booking Validation

- Prevents overlapping bookings
- Real-time availability checking
- Calendar-based scheduling
- Automatic booking status updates

---

## 🔧 Maintenance Workflow

Employees can raise maintenance requests which follow an approval workflow.

```
Employee
      ↓
Raise Request
      ↓
Pending
      ↓
Asset Manager Approval
      ↓
In Progress
      ↓
Resolved
```

Approved maintenance requests automatically update the asset status.

---

## 📊 Dashboard & KPIs

Role-based dashboards provide:

- Available Assets
- Active Allocations
- Upcoming Bookings
- Maintenance Requests
- Audit Reports
- Overdue Returns

---

# 🛠 Tech Stack

## Frontend

- React (Vite)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- React Hook Form
- Zod Validation

## Backend

- Python 3.10+
- FastAPI
- SQLAlchemy 2.x
- SQLite
- Pydantic
- PyJWT
- Passlib

---

# 📂 Project Structure

```
AssetFlow
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── core/
│   ├── crud/
│   ├── routers/
│   ├── schemas/
│   ├── models.py
│   └── main.py
│
└── README.md
```

---

# 🎨 Design Language

Inspired by modern ERP systems like **Odoo** and **Linear**.

### Color Palette

| Purpose | Color |
|----------|-------|
| Background | `#F9FAFB` |
| Primary | `#714B67` |
| Secondary | `#0F766E` |
| Success | `#10B981` |
| Info | `#3B82F6` |
| Warning | `#F59E0B` |
| Danger | `#E11D48` |

---

# 🚫 Hackathon Constraints

This project strictly follows the Odoo Hackathon guidelines:

- ✅ Local SQLite Database
- ✅ Offline First
- ✅ Zero Third-Party APIs
- ✅ FastAPI Backend
- ✅ Strict Pydantic Validation
- ✅ Zod Frontend Validation
- ✅ Prevention of Double Allocations
- ✅ Prevention of Booking Conflicts

---

# 👥 Team

### Developer 1 — UI/UX

- React
- Tailwind
- shadcn/ui
- Data Tables
- Forms

### Developer 2 — Full Stack

- Authentication
- Dashboard
- Notifications
- KPI APIs

### Developer 3 — API Architect

- FastAPI Routers
- Business Logic
- Validation
- Booking Algorithms

### Developer 4 — Database Architect

- SQLAlchemy Models
- SQLite
- CRUD Layer
- Seed Data
- Database Design

---

# 🎯 Core Workflows

### Authentication

```
Signup
   ↓
Employee
   ↓
Admin Promotion
   ↓
Department Access
```

---

### Asset Allocation

```
Register Asset
      ↓
Available
      ↓
Allocate
      ↓
Return
      ↓
Available
```

---

### Booking

```
Select Resource
      ↓
Choose Time
      ↓
Overlap Check
      ↓
Booking Confirmed
```

---

### Maintenance

```
Raise Request
      ↓
Pending
      ↓
Approved
      ↓
Maintenance
      ↓
Resolved
```

---

# 🚀 Future Enhancements

- QR Code Asset Tracking
- Email Notifications
- Barcode Scanning
- Audit Analytics
- Export Reports
- Dark Mode
- PWA Support

---

## Built with ❤️ for Odoo Hackathon '26