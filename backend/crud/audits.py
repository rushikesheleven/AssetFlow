from sqlalchemy.orm import Session
from sqlalchemy import select

from models import (
    Audit,
    AuditItem,
    AuditStatus,
    AuditItemStatus,
)


# ----------------------------------
# AUDIT CRUD
# ----------------------------------

def create_audit(db: Session, data):

    audit = Audit(**data.model_dump())

    db.add(audit)
    db.commit()
    db.refresh(audit)

    return audit


def get_audit_by_id(
    db: Session,
    audit_id: int
):

    return db.scalar(
        select(Audit).where(
            Audit.id == audit_id
        )
    )


def get_all_audits(db: Session):

    return db.scalars(
        select(Audit)
    ).all()


def get_open_audits(db: Session):

    return db.scalars(
        select(Audit).where(
            Audit.status == AuditStatus.OPEN
        )
    ).all()


def update_audit(
    db: Session,
    audit: Audit,
    data
):

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(audit, key, value)

    db.commit()
    db.refresh(audit)

    return audit


def close_audit(
    db: Session,
    audit: Audit
):

    audit.status = AuditStatus.CLOSED

    db.commit()
    db.refresh(audit)

    return audit


def delete_audit(
    db: Session,
    audit: Audit
):

    db.delete(audit)
    db.commit()


# ----------------------------------
# AUDIT ITEM CRUD
# ----------------------------------

def create_audit_item(
    db: Session,
    data
):

    item = AuditItem(**data.model_dump())

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def get_audit_item_by_id(
    db: Session,
    item_id: int
):

    return db.scalar(
        select(AuditItem).where(
            AuditItem.id == item_id
        )
    )


def get_items_for_audit(
    db: Session,
    audit_id: int
):

    return db.scalars(
        select(AuditItem).where(
            AuditItem.audit_id == audit_id
        )
    ).all()


def update_audit_item(
    db: Session,
    item: AuditItem,
    data
):

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


def update_audit_item_status(
    db: Session,
    item: AuditItem,
    status: AuditItemStatus
):

    item.status = status

    db.commit()
    db.refresh(item)

    return item


def delete_audit_item(
    db: Session,
    item: AuditItem
):

    db.delete(item)
    db.commit()