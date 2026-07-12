from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from schemas.asset_schema import AssetCreate, AssetResponse
# Assuming Developer 4 created these in the core and crud folders based on their message
from core.database import SessionLocal

# FIXED: Importing exactly what Developer 4 named their functions
from crud.assets import get_all_assets, create_asset, get_asset_by_id

router = APIRouter()

# FastAPI Dependency to handle the database session safely
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def register_asset(asset_in: AssetCreate, db: Session = Depends(get_db)):
    """Register a new asset."""
    # FIXED: Passed 'data=asset_in' because Dev 4's function is create_asset(db, data)
    return create_asset(db=db, data=asset_in)

@router.get("/", response_model=List[AssetResponse])
def fetch_all_assets(db: Session = Depends(get_db)):
    """Fetch all assets for the Asset Directory table."""
    # FIXED: Calling Dev 4's get_all_assets
    return get_all_assets(db=db)

@router.get("/{asset_id}", response_model=AssetResponse)
def fetch_single_asset(asset_id: int, db: Session = Depends(get_db)):
    """Fetch a single asset by its ID."""
    db_asset = get_asset_by_id(db=db, asset_id=asset_id)
    if not db_asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return db_asset