from sqlalchemy.orm import Session
from sqlalchemy import select

from models import (
    MaintenanceRequest,
    MaintenanceStatus,
    Asset,
    AssetStatus,
)


# ----------------------------------
# CREATE
# ----------------------------------

def create_maintenance_request(db: Session, data):

    request = MaintenanceRequest(**data.model_dump())

    db.add(request)
    db.commit()
    db.refresh(request)

    return request


# ----------------------------------
# READ
# ----------------------------------

def get_request_by_id(
    db: Session,
    request_id: int
):

    return db.scalar(
        select(MaintenanceRequest).where(
            MaintenanceRequest.id == request_id
        )
    )


def get_all_requests(db: Session):

    return db.scalars(
        select(MaintenanceRequest)
    ).all()


def get_requests_by_asset(
    db: Session,
    asset_id: int
):

    return db.scalars(
        select(MaintenanceRequest).where(
            MaintenanceRequest.asset_id == asset_id
        )
    ).all()


def get_requests_by_user(
    db: Session,
    user_id: int
):

    return db.scalars(
        select(MaintenanceRequest).where(
            MaintenanceRequest.requested_by == user_id
        )
    ).all()


def get_requests_by_status(
    db: Session,
    status: MaintenanceStatus
):

    return db.scalars(
        select(MaintenanceRequest).where(
            MaintenanceRequest.status == status
        )
    ).all()


# ----------------------------------
# UPDATE
# ----------------------------------

def update_request(
    db: Session,
    request: MaintenanceRequest,
    data
):

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(request, key, value)

    db.commit()
    db.refresh(request)

    return request


# ----------------------------------
# STATUS HELPERS
# ----------------------------------

def approve_request(
    db: Session,
    request: MaintenanceRequest
):
    """
    Dev 3 can call this after validation.
    """

    request.status = MaintenanceStatus.APPROVED

    asset = db.get(
        Asset,
        request.asset_id
    )

    if asset:
        asset.status = AssetStatus.MAINTENANCE

    db.commit()
    db.refresh(request)

    return request


def start_maintenance(
    db: Session,
    request: MaintenanceRequest
):

    request.status = MaintenanceStatus.IN_PROGRESS

    db.commit()
    db.refresh(request)

    return request


def resolve_request(
    db: Session,
    request: MaintenanceRequest
):

    request.status = MaintenanceStatus.RESOLVED

    asset = db.get(
        Asset,
        request.asset_id
    )

    if asset:
        asset.status = AssetStatus.AVAILABLE

    db.commit()
    db.refresh(request)

    return request


# ----------------------------------
# DELETE
# ----------------------------------

def delete_request(
    db: Session,
    request: MaintenanceRequest
):

    db.delete(request)
    db.commit()