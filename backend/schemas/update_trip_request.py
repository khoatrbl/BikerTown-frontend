from pydantic import BaseModel
from typing import List

from schemas.stop_create import StopCreate
from schemas.trip_update import TripUpdate

class UpdateTripRequest(BaseModel):
    updated_trip: TripUpdate
    stops_of_trip: List[StopCreate]