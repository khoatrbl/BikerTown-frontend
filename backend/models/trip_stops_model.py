from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class TripStops(Base):
    __tablename__ = "tripstops"
    tripstops_id = Column(Integer, primary_key = True, index = True, autoincrement=True )
    stop_id = Column(Integer, ForeignKey('stops.stop_id'))
    trip_id = Column(Integer, ForeignKey('trips.trip_id'))
    stop_order = Column(Integer)

    __table_args__ = (
        UniqueConstraint('trip_id', 'stop_order', name='unique_trip_stop_order'),
    )

    # Relationships
    trip = relationship('Trip', back_populates='stops')  # Link to the Trip model
    stop = relationship('Stop', back_populates='trips')  # Link to the Stop model
    
