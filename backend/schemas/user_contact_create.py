from pydantic import BaseModel


class UserContactCreate(BaseModel):
    owner_uuid: str
    phone: str
    email: str # replace later with email validator
    address: str
    district: str
    city: str