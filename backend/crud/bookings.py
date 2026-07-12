from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from models import (
    Booking,
    BookingStatus,
)


# ----------------------------------
# CREATE
# ----------------------------------

def create_booking(db: Session, data):

    booking = Booking(**data.model_dump())

    db.add(booking)
    db.commit()
    db.refresh(booking)

    return booking


# ----------------------------------
# READ
# ----------------------------------

def get_booking_by_id(
    db: Session,
    booking_id: int
):

    return db.scalar(
        select(Booking).where(
            Booking.id == booking_id
        )
    )


def get_all_bookings(db: Session):

    return db.scalars(
        select(Booking)
    ).all()


def get_bookings_by_user(
    db: Session,
    user_id: int
):

    return db.scalars(
        select(Booking).where(
            Booking.user_id == user_id
        )
    ).all()


def get_bookings_by_asset(
    db: Session,
    asset_id: int
):

    return db.scalars(
        select(Booking).where(
            Booking.asset_id == asset_id
        )
    ).all()


# ----------------------------------
# OVERLAP QUERY
# ----------------------------------

def get_overlapping_booking(
    db: Session,
    asset_id: int,
    start_time: datetime,
    end_time: datetime
):
    """
    Dev 3 will call this.
    If it returns a Booking, then the slot is already occupied.
    """

    return db.scalar(
        select(Booking).where(
            Booking.asset_id == asset_id,
            Booking.status != BookingStatus.CANCELLED,
            and_(
                Booking.start_time < end_time,
                Booking.end_time > start_time,
            )
        )
    )


# ----------------------------------
# ACTIVE BOOKINGS
# ----------------------------------

def get_active_bookings(
    db: Session,
    asset_id: int
):

    return db.scalars(
        select(Booking).where(
            Booking.asset_id == asset_id,
            Booking.status.in_(
                [
                    BookingStatus.UPCOMING,
                    BookingStatus.ONGOING,
                ]
            )
        )
    ).all()


# ----------------------------------
# UPDATE
# ----------------------------------

def update_booking(
    db: Session,
    booking: Booking,
    data
):

    update_data = data.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(
            booking,
            key,
            value
        )

    db.commit()
    db.refresh(booking)

    return booking


# ----------------------------------
# STATUS HELPERS
# ----------------------------------

def update_booking_status(
    db: Session,
    booking: Booking,
    status: BookingStatus
):

    booking.status = status

    db.commit()
    db.refresh(booking)

    return booking


def cancel_booking(
    db: Session,
    booking: Booking
):

    booking.status = BookingStatus.CANCELLED

    db.commit()
    db.refresh(booking)

    return booking


def complete_booking(
    db: Session,
    booking: Booking
):

    booking.status = BookingStatus.COMPLETED

    db.commit()
    db.refresh(booking)

    return booking


# ----------------------------------
# DELETE
# ----------------------------------

def delete_booking(
    db: Session,
    booking: Booking
):

    db.delete(booking)
    db.commit()