from pydantic import BaseModel
from typing import Optional
from datetime import date, time as dt_time
from enum import Enum

class TripStatusEnum(str, Enum):
    upcoming = 'Upcoming'
    in_progress = 'In Progress'
    finished = 'Finished'
    cancelled = 'Cancelled'
    delayed = 'Delayed'

class TripUpdate(BaseModel):
    trip_name: Optional[str] = None
    start: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    time: Optional[dt_time] = None
    trip_status: Optional[TripStatusEnum] = None
    start_coordinates: Optional[list[float]] = None
    destination_coordinates: Optional[list[float]] = None

class Config:
    # Optional: Configure Pydantic to allow Enum values as strings
    use_enum_values = True
    