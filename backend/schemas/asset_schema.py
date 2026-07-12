from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

# Strict Enum matching the database schema for Status[span_3](start_span)[span_3](end_span)
class AssetStatus(str, Enum):
    AVAILABLE = "Available"
    ALLOCATED = "Allocated"
    RESERVED = "Reserved"
    MAINTENANCE = "Maintenance"
    LOST = "Lost"
    RETIRED = "Retired"

class AssetBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Name of the asset")
    tag: str = Field(..., pattern=r"^AF-\d{4}$", description="Must perfectly match format AF-XXXX")
    category_id: int = Field(..., gt=0)
    serial_number: Optional[str] = Field(None, max_length=100)
    condition: str = Field(..., min_length=2)
    status: AssetStatus = AssetStatus.AVAILABLE
    is_bookable: bool = False

# Used when the frontend (Dev 1/2) sends a POST request to create an asset
class AssetCreate(AssetBase):
    pass

# Used when we return data back to the frontend (includes the DB ID)
class AssetResponse(AssetBase):
    id: int

    class Config:
        from_attributes = True  # Allows Pydantic to read Developer 4's SQLAlchemy models