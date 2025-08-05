
from datetime import date
from pydantic import BaseModel


class UserCreate(BaseModel):
    uuid: str
    email: str
    display_name: str
    gender: bool
    dob: date
    vehicle: str
    

