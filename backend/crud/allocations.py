from datetime import date

from sqlalchemy.orm import Session
from sqlalchemy import select

from models import (
    Allocation,
    AllocationStatus,
    Asset,
    AssetStatus,
)


# ----------------------------------
# CREATE
# ----------------------------------

def create_allocation(db: Session, data):

    allocation = Allocation(**data.model_dump())

    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    return allocation


# ----------------------------------
# READ
# ----------------------------------

def get_allocation_by_id(
    db: Session,
    allocation_id: int
):

    return db.scalar(
        select(Allocation).where(
            Allocation.id == allocation_id
        )
    )


def get_all_allocations(db: Session):

    return db.scalars(
        select(Allocation)
    ).all()


def get_active_allocations(db: Session):

    return db.scalars(
        select(Allocation).where(
            Allocation.status == AllocationStatus.ACTIVE
        )
    ).all()


def get_allocations_by_user(
    db: Session,
    user_id: int
):

    return db.scalars(
        select(Allocation).where(
            Allocation.assigned_to == user_id
        )
    ).all()


def get_allocations_by_asset(
    db: Session,
    asset_id: int
):

    return db.scalars(
        select(Allocation).where(
            Allocation.asset_id == asset_id
        )
    ).all()


# ----------------------------------
# HELPERS FOR DEV 3
# ----------------------------------

def get_active_allocation_for_asset(
    db: Session,
    asset_id: int
):

    return db.scalar(
        select(Allocation).where(
            Allocation.asset_id == asset_id,
            Allocation.status == AllocationStatus.ACTIVE
        )
    )


def is_asset_allocated(
    db: Session,
    asset_id: int
):

    allocation = get_active_allocation_for_asset(
        db,
        asset_id
    )

    return allocation is not None


# ----------------------------------
# RETURN ASSET
# ----------------------------------

def return_asset(
    db: Session,
    allocation: Allocation
):

    allocation.status = AllocationStatus.RETURNED
    allocation.actual_return_date = date.today()

    asset = db.get(
        Asset,
        allocation.asset_id
    )

    if asset:
        asset.status = AssetStatus.AVAILABLE

    db.commit()

    db.refresh(allocation)

    return allocation


# ----------------------------------
# TRANSFER
# ----------------------------------

def mark_transfer_pending(
    db: Session,
    allocation: Allocation
):

    allocation.status = AllocationStatus.TRANSFER_PENDING

    db.commit()

    db.refresh(allocation)

    return allocation


# ----------------------------------
# UPDATE
# ----------------------------------

def update_allocation(
    db: Session,
    allocation: Allocation,
    data
):

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            allocation,
            key,
            value
        )

    db.commit()

    db.refresh(allocation)

    return allocation


# ----------------------------------
# DELETE
# ----------------------------------

def delete_allocation(
    db: Session,
    allocation: Allocation
):

    db.delete(allocation)

    db.commit()