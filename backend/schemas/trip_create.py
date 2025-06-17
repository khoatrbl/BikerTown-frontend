from datetime import date, time
from typing import Optional
from pydantic import BaseModel
from enum import Enum

class TripStatusEnum(str, Enum):
    upcoming = 'Upcoming'
    in_progress = 'In Progress'
    finished = 'Finished'
    cancelled = 'Cancelled'
    delayed = 'Delayed'

class TripCreate(BaseModel):
    trip_id: Optional[int] = None
    start: str
    destination: str
    start_date: date
    end_date: date
    time: time
    trip_status: TripStatusEnum
    user_id: Optional[int] = None

    class Config:
    # Optional: Configure Pydantic to allow Enum values as strings
        use_enum_values = True
    

