from __future__ import annotations

from datetime import datetime, date
from enum import Enum

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from core.database import Base


# ==========================
# ENUMS
# ==========================

class UserRole(str, Enum):
    ADMIN = "Admin"
    ASSET_MANAGER = "AssetManager"
    DEPT_HEAD = "DeptHead"
    EMPLOYEE = "Employee"


class AssetStatus(str, Enum):
    AVAILABLE = "Available"
    ALLOCATED = "Allocated"
    RESERVED = "Reserved"
    MAINTENANCE = "Maintenance"
    LOST = "Lost"
    RETIRED = "Retired"


class AllocationStatus(str, Enum):
    ACTIVE = "Active"
    RETURNED = "Returned"
    TRANSFER_PENDING = "Transfer_Pending"


class BookingStatus(str, Enum):
    UPCOMING = "Upcoming"
    ONGOING = "Ongoing"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class MaintenanceStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    IN_PROGRESS = "InProgress"
    RESOLVED = "Resolved"


class AuditStatus(str, Enum):
    OPEN = "Open"
    CLOSED = "Closed"


class AuditItemStatus(str, Enum):
    VERIFIED = "Verified"
    MISSING = "Missing"
    DAMAGED = "Damaged"


# ==========================
# DEPARTMENTS
# ==========================

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(100), unique=True)

    head_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )

    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id"),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    users: Mapped[list["User"]] = relationship(
        back_populates="department",
        foreign_keys="User.department_id"
    )

    parent: Mapped["Department"] = relationship(
        remote_side=[id]
    )


# ==========================
# USERS
# ==========================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    name: Mapped[str] = mapped_column(String(100))

    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(String(255))

    department_id: Mapped[int | None] = mapped_column(
        ForeignKey("departments.id")
    )

    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        default=UserRole.EMPLOYEE
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    department: Mapped["Department"] = relationship(
        back_populates="users"
    )

    allocations: Mapped[list["Allocation"]] = relationship(
        foreign_keys="Allocation.assigned_to",
        back_populates="employee"
    )

    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="user"
    )

    maintenance_requests: Mapped[list["MaintenanceRequest"]] = relationship(
        back_populates="requester"
    )

    audits: Mapped[list["Audit"]] = relationship(
        back_populates="auditor"
    )


# ==========================
# ASSET CATEGORY
# ==========================

class AssetCategory(Base):
    __tablename__ = "asset_categories"

    id: Mapped[int] = mapped_column(primary_key=True)

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True
    )

    description: Mapped[str | None] = mapped_column(Text)

    assets: Mapped[list["Asset"]] = relationship(
        back_populates="category"
    )


# ==========================
# ASSETS
# ==========================

class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(primary_key=True)

    tag: Mapped[str] = mapped_column(
        String(50),
        unique=True
    )

    name: Mapped[str] = mapped_column(String(150))

    category_id: Mapped[int] = mapped_column(
        ForeignKey("asset_categories.id")
    )

    serial_number: Mapped[str] = mapped_column(
        String(150),
        unique=True
    )

    condition: Mapped[str] = mapped_column(String(100))

    status: Mapped[AssetStatus] = mapped_column(
        SQLEnum(AssetStatus),
        default=AssetStatus.AVAILABLE
    )

    is_bookable: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    category: Mapped["AssetCategory"] = relationship(
        back_populates="assets"
    )

    allocations: Mapped[list["Allocation"]] = relationship(
        back_populates="asset"
    )

    bookings: Mapped[list["Booking"]] = relationship(
        back_populates="asset"
    )

    maintenance_requests: Mapped[list["MaintenanceRequest"]] = relationship(
        back_populates="asset"
    )

    audit_items: Mapped[list["AuditItem"]] = relationship(
        back_populates="asset"
    )


# ==========================
# ALLOCATIONS
# ==========================

class Allocation(Base):
    __tablename__ = "allocations"

    id: Mapped[int] = mapped_column(primary_key=True)

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id")
    )

    assigned_to: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    assigned_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    issue_date: Mapped[date] = mapped_column(Date)

    expected_return_date: Mapped[date] = mapped_column(Date)

    actual_return_date: Mapped[date | None] = mapped_column(Date)

    status: Mapped[AllocationStatus] = mapped_column(
        SQLEnum(AllocationStatus),
        default=AllocationStatus.ACTIVE
    )

    asset: Mapped["Asset"] = relationship(
        back_populates="allocations"
    )

    employee: Mapped["User"] = relationship(
        foreign_keys=[assigned_to],
        back_populates="allocations"
    )


# ==========================
# BOOKINGS
# ==========================

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True)

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id")
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    start_time: Mapped[datetime] = mapped_column(DateTime)

    end_time: Mapped[datetime] = mapped_column(DateTime)

    status: Mapped[BookingStatus] = mapped_column(
        SQLEnum(BookingStatus),
        default=BookingStatus.UPCOMING
    )

    asset: Mapped["Asset"] = relationship(
        back_populates="bookings"
    )

    user: Mapped["User"] = relationship(
        back_populates="bookings"
    )


# ==========================
# MAINTENANCE
# ==========================

class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[int] = mapped_column(primary_key=True)

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id")
    )

    requested_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    issue_desc: Mapped[str] = mapped_column(Text)

    priority: Mapped[str] = mapped_column(String(50))

    status: Mapped[MaintenanceStatus] = mapped_column(
        SQLEnum(MaintenanceStatus),
        default=MaintenanceStatus.PENDING
    )

    asset: Mapped["Asset"] = relationship(
        back_populates="maintenance_requests"
    )

    requester: Mapped["User"] = relationship(
        back_populates="maintenance_requests"
    )


# ==========================
# AUDITS
# ==========================

class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[int] = mapped_column(primary_key=True)

    cycle_name: Mapped[str] = mapped_column(String(150))

    auditor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    status: Mapped[AuditStatus] = mapped_column(
        SQLEnum(AuditStatus),
        default=AuditStatus.OPEN
    )

    auditor: Mapped["User"] = relationship(
        back_populates="audits"
    )

    audit_items: Mapped[list["AuditItem"]] = relationship(
        back_populates="audit"
    )


# ==========================
# AUDIT ITEMS
# ==========================

class AuditItem(Base):
    __tablename__ = "audit_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    audit_id: Mapped[int] = mapped_column(
        ForeignKey("audits.id")
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id")
    )

    status: Mapped[AuditItemStatus] = mapped_column(
        SQLEnum(AuditItemStatus),
        default=AuditItemStatus.VERIFIED
    )

    audit: Mapped["Audit"] = relationship(
        back_populates="audit_items"
    )

    asset: Mapped["Asset"] = relationship(
        back_populates="audit_items"
    )