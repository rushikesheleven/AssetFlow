from datetime import date

from sqlalchemy.orm import Session

from models import (
    Department,
    User,
    AssetCategory,
    Asset,
    UserRole,
    AssetStatus,
)


def seed_database(db: Session):

    # Prevent duplicate seeding
    if db.query(User).first():
        print("Database already seeded.")
        return

    # ----------------------------
    # Departments
    # ----------------------------

    it = Department(name="IT")
    hr = Department(name="HR")
    finance = Department(name="Finance")

    db.add_all([it, hr, finance])
    db.commit()

    # ----------------------------
    # Users
    # ----------------------------

    admin = User(
        name="System Admin",
        email="admin@assetflow.com",
        password_hash="admin123",
        role=UserRole.ADMIN,
        department_id=it.id,
    )

    manager = User(
        name="Asset Manager",
        email="manager@assetflow.com",
        password_hash="manager123",
        role=UserRole.ASSET_MANAGER,
        department_id=it.id,
    )

    head = User(
        name="Department Head",
        email="head@assetflow.com",
        password_hash="head123",
        role=UserRole.DEPT_HEAD,
        department_id=hr.id,
    )

    emp1 = User(
        name="Alice",
        email="alice@assetflow.com",
        password_hash="alice123",
        role=UserRole.EMPLOYEE,
        department_id=finance.id,
    )

    emp2 = User(
        name="Bob",
        email="bob@assetflow.com",
        password_hash="bob123",
        role=UserRole.EMPLOYEE,
        department_id=it.id,
    )

    db.add_all([admin, manager, head, emp1, emp2])
    db.commit()

    # ----------------------------
    # Categories
    # ----------------------------

    laptop = AssetCategory(
        name="Laptop",
        description="Company laptops"
    )

    monitor = AssetCategory(
        name="Monitor",
        description="Office monitors"
    )

    projector = AssetCategory(
        name="Projector",
        description="Conference projectors"
    )

    meeting_room = AssetCategory(
        name="Meeting Room",
        description="Bookable rooms"
    )

    db.add_all([
        laptop,
        monitor,
        projector,
        meeting_room
    ])

    db.commit()

    # ----------------------------
    # Assets
    # ----------------------------

    assets = []

    for i in range(1, 11):

        assets.append(
            Asset(
                tag=f"AF-LAP-{i:03}",
                name=f"Lenovo ThinkPad {i}",
                category_id=laptop.id,
                serial_number=f"LAPSN{i:05}",
                condition="Excellent",
                status=AssetStatus.AVAILABLE,
                is_bookable=False,
            )
        )

    for i in range(1, 6):

        assets.append(
            Asset(
                tag=f"AF-MON-{i:03}",
                name=f"Dell Monitor {i}",
                category_id=monitor.id,
                serial_number=f"MONSN{i:05}",
                condition="Excellent",
                status=AssetStatus.AVAILABLE,
                is_bookable=False,
            )
        )

    for i in range(1, 4):

        assets.append(
            Asset(
                tag=f"AF-PRO-{i:03}",
                name=f"Epson Projector {i}",
                category_id=projector.id,
                serial_number=f"PROSN{i:05}",
                condition="Good",
                status=AssetStatus.AVAILABLE,
                is_bookable=True,
            )
        )

    for i in range(1, 4):

        assets.append(
            Asset(
                tag=f"AF-ROOM-{i:03}",
                name=f"Conference Room {i}",
                category_id=meeting_room.id,
                serial_number=f"ROOMSN{i:05}",
                condition="Excellent",
                status=AssetStatus.AVAILABLE,
                is_bookable=True,
            )
        )

    db.add_all(assets)
    db.commit()

    print("Database seeded successfully.")