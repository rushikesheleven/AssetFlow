from sqlalchemy.orm import Session
from sqlalchemy import select

from models import User


def create_user(db: Session, data):
    """
    data is expected to be a validated Pydantic object from Dev 3.
    """

    user = User(**data.model_dump())

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def get_user_by_id(db: Session, user_id: int):

    return db.scalar(
        select(User).where(User.id == user_id)
    )


def get_user_by_email(db: Session, email: str):

    return db.scalar(
        select(User).where(User.email == email)
    )


def get_all_users(db: Session):

    return db.scalars(
        select(User)
    ).all()


def get_users_by_department(db: Session, department_id: int):

    return db.scalars(
        select(User).where(
            User.department_id == department_id
        )
    ).all()


def get_users_by_role(db: Session, role):

    return db.scalars(
        select(User).where(
            User.role == role
        )
    ).all()


def update_user(db: Session, user: User, data):

    update_data = data.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user


def deactivate_user(db: Session, user: User):

    user.is_active = False

    db.commit()
    db.refresh(user)

    return user


def activate_user(db: Session, user: User):

    user.is_active = True

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user: User):

    db.delete(user)
    db.commit()