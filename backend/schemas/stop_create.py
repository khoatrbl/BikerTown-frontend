from pydantic import BaseModel


class StopCreate(BaseModel):
    id: int
    stop_name: str
    stop_coordinates: list[float]