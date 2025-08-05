from sqlalchemy import Column, Integer, String, ARRAY, Float
from sqlalchemy.orm import relationship
from database import Base

class Stop(Base):
    __tablename__ = "stops"
    stop_id = Column(Integer, primary_key = True, index = True)
    stop_name = Column(String)
    stop_coordinates = Column(ARRAY(Float))
    
    trips = relationship('TripStops', back_populates='stop')
    todos = relationship('Todo', back_populates='stop')
    
