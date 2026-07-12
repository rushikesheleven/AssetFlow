from sqlalchemy.orm import Session
from sqlalchemy import select

from models import Asset, AssetStatus


# --------------------------
# CREATE
# --------------------------

def create_asset(db: Session, data):
    """
    data -> validated Pydantic schema from Dev 3
    """

    asset = Asset(**data.model_dump())

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return asset


# --------------------------
# READ
# --------------------------

def get_asset_by_id(db: Session, asset_id: int):

    return db.scalar(
        select(Asset).where(
            Asset.id == asset_id
        )
    )


def get_asset_by_tag(db: Session, tag: str):

    return db.scalar(
        select(Asset).where(
            Asset.tag == tag
        )
    )


def get_asset_by_serial(db: Session, serial_number: str):

    return db.scalar(
        select(Asset).where(
            Asset.serial_number == serial_number
        )
    )


def get_all_assets(db: Session):

    return db.scalars(
        select(Asset)
    ).all()


# --------------------------
# FILTERS
# --------------------------

def get_assets_by_status(
    db: Session,
    status: AssetStatus
):

    return db.scalars(
        select(Asset).where(
            Asset.status == status
        )
    ).all()


def get_assets_by_category(
    db: Session,
    category_id: int
):

    return db.scalars(
        select(Asset).where(
            Asset.category_id == category_id
        )
    ).all()


def get_available_assets(db: Session):

    return db.scalars(
        select(Asset).where(
            Asset.status == AssetStatus.AVAILABLE
        )
    ).all()


def get_bookable_assets(db: Session):

    return db.scalars(
        select(Asset).where(
            Asset.is_bookable == True
        )
    ).all()


# --------------------------
# UPDATE
# --------------------------

def update_asset(
    db: Session,
    asset: Asset,
    data
):

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(asset, key, value)

    db.commit()
    db.refresh(asset)

    return asset


def update_asset_status(
    db: Session,
    asset: Asset,
    status: AssetStatus
):

    asset.status = status

    db.commit()
    db.refresh(asset)

    return asset


# --------------------------
# DELETE
# --------------------------

def delete_asset(
    db: Session,
    asset: Asset
):

    db.delete(asset)
    db.commit()


# --------------------------
# SEARCH
# --------------------------

def search_assets(
    db: Session,
    keyword: str
):

    keyword = f"%{keyword}%"

    return db.scalars(
        select(Asset).where(
            Asset.name.like(keyword)
        )
    ).all()


# --------------------------
# BOOKABLE AVAILABLE
# --------------------------

def get_available_bookable_assets(
    db: Session
):

    return db.scalars(
        select(Asset).where(
            Asset.is_bookable == True,
            Asset.status == AssetStatus.AVAILABLE
        )
    ).all()