from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class UserContact(Base):
    __tablename__ = "user_contact"
    contact_id = Column(Integer, primary_key = True, index = True)
    owner_uuid = Column(Integer, ForeignKey("users.uuid"))
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    district = Column(String)
    city = Column(String)

    user = relationship("User", back_populates="user_contact")