from sqlalchemy import ARRAY, Column, Date, Float, ForeignKey, Integer, String, Time, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from enum import Enum
from database import Base

class TripStatusEnum(Enum):
    upcoming = 'Upcoming'
    in_progress = 'In Progress'
    finished = 'Finished'
    cancelled = 'Cancelled'
    delayed = 'Delayed'

class Trip(Base):
    __tablename__ = "trips"
    trip_id = Column(Integer, primary_key = True, index = True)
    trip_name = Column(String, nullable=False)
    start = Column(String)
    start_coordinates = Column(ARRAY(Float))
    destination = Column(String)
    destination_coordinates = Column(ARRAY(Float))
    start_date = Column(Date)
    end_date = Column(Date)
    time = Column(Time)
    trip_status = Column(SQLAlchemyEnum(TripStatusEnum))
    owner_uuid = Column(Integer, ForeignKey('users.uuid'))

    user = relationship('User', back_populates='trips')
    stops = relationship('TripStops', back_populates='trip')
    
