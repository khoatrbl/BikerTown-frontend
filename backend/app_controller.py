from datetime import datetime
from dotenv import load_dotenv
from fastapi import Body, Depends, FastAPI, Form, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy import case
from sqlalchemy.orm import Session
from schemas.update_trip_request import UpdateTripRequest
from models.stop_model import Stop
from models.trip_stops_model import TripStops
from schemas.trip_create import TripCreate
from database import Base, get_db, engine
from models.trip_model import Trip
from models.user_contact_model import UserContact
from models.user_model import User
from schemas.user_contact_create import UserContactCreate
from schemas.user_create import UserCreate
from fastapi.middleware.cors import CORSMiddleware
import utilities

from utilities import verify_jwt_token

from mangum import Mangum

# Initialize FastAPI app
app = FastAPI()
load_dotenv()

# List of allowed origins
origins = [
    "http://localhost",  # Local frontend (running on a different port)
    "http://localhost:5173",  # Example: React on port 3000  # Example: your production domain
]

# Add CORSMiddleware to allow API calls from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specifies which domains can access your API
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Create the tables in the database
Base.metadata.create_all(bind=engine)

@app.get("/user/{uuid}")
async def get_user(uuid: str, db: Session = Depends(get_db)):
    """
    Retrieve user data from the database using UUID.

    Parameters:
    - uuid (str): The UUID of the user to retrieve.
    - db (Session): The database session dependency.

    Returns:
    - JSON: Object containing the user's display name if found.

    Raises:
    - HTTPException: 404 - If the user with the given UUID is not found

    """

    # Query the database for the user with the given UUID
    user = db.query(User).filter(User.uuid == uuid).first()

    # If no user found, raise an HTTPException
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Return the user data as a JSON response
    return {
        "display_name": user.display_name,
    }

@app.post("/register-user-data")
async def register(uuid: str = Form(...),
            email: str = Form(...),
             display_name: str = Form(...),
             gender: bool = Form(...),
             dob: str = Form(...),
             vehicle: str = Form(...),
             phone: str = Form(...),
             address: str = Form(...),
             district: str = Form(...),
             city: str = Form(...),
             db: Session = Depends(get_db)):
    """
    Register a new user object and user contact in the database with the user data provided.

    Parameters:
    - uuid (str): The UUID of the user to register.
    - email (str): The email address of the user.
    - display_name (str): The user's display name.
    - gender (bool): The gender of the user.
    - dob (str): The user's date of birth in 'YYYY-MM-DD' format.
    - vehicle (str): The vehicle information of the user.
    - phone (str): The user's phone number.
    - address (str): The user's address.
    - district (str): The district of the user's address.
    - city (str): The city of the user's address.
    - db (Session): The database session dependency.

    Returns:
    - JSON: A message indicating successful registration.

    Raises:
    - HTTPException: 400 - If the user could not be added to the database.
    - HTTPException: 400 - If the user contact could not be added to the database.
    - HTTPException: 500 - If there is an error retrieving the latest user ID.

    """

    # Create a new user object with the obtained data
    new_user = UserCreate(uuid=uuid, 
                          email=email,
                          display_name=display_name, 
                          gender=gender, 
                          dob=datetime.strptime(dob, '%Y-%m-%d').date(), 
                          vehicle=vehicle)
    
    user_insert_result = await utilities.insert_user(new_user, db)

    # Check to see if there is any error during inserting the new user
    if (user_insert_result is None):
        raise HTTPException(status_code=400, detail="Failed to add user.")
    
    # Get the latest user_id just added
    latest_uuid = await utilities.get_latest_uuid(db)
    latest_uuid = latest_uuid[0]
    
    # Check to see if there is any error getting the latest user id
    if latest_uuid is None:
        raise HTTPException(status_code=500, detail="An error has occurred in retrieving data.")
    
    # If not, create a new user contact that corresponds to the new user
    new_user_contact = UserContactCreate( owner_uuid = latest_uuid, phone = phone, email = email, address = address, district = district, city = city)
    contact_insert_result = await utilities.insert_user_contact(new_user_contact, db)

    if contact_insert_result is None:
        raise HTTPException(status_code=400, detail="Failed to add contact.")

    return {
        "message": "Register successfully!",
    }
    

@app.get("/profile")
async def get_profile(payload = Depends(verify_jwt_token), db: Session = Depends(get_db)):
    """
    Retrieve the data of the user and return the data for the user profile.

    Parameters:
    - payload (dict): The decoded JWT token payload containing user information.
    - db (Session): The database session dependency.

    Returns:
    - JSON: Object containing user profile information

    Raises:
    - HTTPException: 404 - If the user or contact information is not found
    
    """

    current_user = payload["username"]
    user_profile = db.query(User, UserContact).join(UserContact, User.uuid == UserContact.owner_uuid).filter(User.uuid == current_user).first()
     # If no user or contact found, raise an HTTPException
    if user_profile is None:
        raise HTTPException(status_code=404, detail="User or contact information not found")
    
    user, user_contact = user_profile
    
    return {
        "user": {
            "display_name": user.display_name,
            "gender": user.gender,
            "dob": user.dob,
            "vehicle": user.vehicle,
            "created_date": user.created_date
        },
        "user_contact": {
            "phone": user_contact.phone,
            "email": user_contact.email,
            "address": user_contact.address,
            "district": user_contact.district,
            "city": user_contact.city
        }
    }

@app.post("/update-profile")
async def update_profile(payload = Depends(verify_jwt_token),
                         display_name: str = Form(...),
                         gender: bool = Form(...),
                         dob: str = Form(...),
                         vehicle: str = Form(...),
                         email: str = Form(...),
                         phone: str = Form(...),
                         address: str = Form(...),
                         city: str = Form(...),
                         district: str = Form(...),
                         db: Session = Depends(get_db)):
    """
    Update an existing user's profile with the provided data.

    Parameters:
    - payload (dict): The decoded JWT token payload containing user information.
    - display_name (str): The new display name for the user.
    - gender (bool): The new gender of the user.
    - dob (str): The new date of birth of the user in 'YYYY-MM-DD' format.
    - vehicle (str): The new vehicle information of the user.
    - email (str): The new email address of the user.
    - phone (str): The new phone number of the user.
    - address (str): The new address of the user.
    - city (str): The new city of the user's address.
    - district (str): The new district of the user's address.
    - db (Session): The database session dependency.

    Returns:
    - JSONResponse: A message indicating successful profile update.

    Raises:
    - HTTPException: 404 - If the user is not found.
    """
    current_user = payload["username"]
    user_profile = db.query(User, UserContact).join(UserContact, User.uuid == UserContact.owner_uuid).filter(User.uuid == current_user).first()

    if not user_profile:
        raise HTTPException(status_code=404, detail="User not found")

    user, user_contact = user_profile

    if display_name:
        user.display_name = utilities.sanitize(display_name)
    if dob:
        dob_as_date = datetime.strptime(dob, "%Y-%m-%d").date() 
        user.dob = dob_as_date
    if vehicle:
        user.vehicle = utilities.sanitize(vehicle)
    if email:
        user_contact.email = email.strip()
    if phone:
        user_contact.phone = utilities.sanitize(phone)
    if address:
        user_contact.address = address.strip()
    if city:
        user_contact.city = city
    if district:
        user_contact.district = district

    user.gender = gender

    db.commit()
    db.refresh(user)
    db.refresh(user_contact)

    return JSONResponse(content={"message": "Profile updated successfully."}, status_code=status.HTTP_200_OK)


@app.get("/trips")
async def get_trips(payload=Depends(verify_jwt_token),
                        db: Session = Depends(get_db)):
    """
    Retrieve all trips associate with the current user.

    Parameters:
    - payload (dict): The decoded JWT token payload containing user information.
    - db (Session): The database session dependency.

    Returns:
    - List[Trip]: A list of trips associated with the current user, ordered by trip status and trip ID.

    Raises:
    - HTTPException: 401 - If the user is not logged in.
    """

    current_user = payload["username"]

    if not current_user:
        raise HTTPException(status_code=401, detail="Session expired.")

    # Query to get all trips for the user, excluding finished trips
    trips = db.query(Trip).join(User, Trip.owner_uuid == User.uuid).filter(User.uuid == current_user).order_by(
        case(
                (Trip.trip_status == "in_progress", 0),
                (Trip.trip_status == "upcoming", 1),
                (Trip.trip_status == "delayed", 2),
                (Trip.trip_status == "cancelled", 3),
                (Trip.trip_status == "finished", 4),
                else_=5  # Default case for any other status
            ),
            Trip.trip_id.asc()
        ).all()
    return trips

@app.get("/trips/{trip_id}")
async def get_trip_by_id(trip_id: int,
                             payload=Depends(verify_jwt_token),
                             db: Session = Depends(get_db)):
    """
    Retrieve info of trip by trip_id.

    Parameters:
    - trip_id (int): The ID of the trip to retrieve.
    - payload (dict): The decoded JWT token payload containing user information.
    - db (Session): The database session dependency.

    Returns:
    - JSON: Object containing trip details and associated stops.

    Raises:
    - HTTPException: 401 - If the user is not logged in.
    - HTTPException: 404 - If the trip is not found.
    
    """

    current_user = payload["username"]
    
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.owner_uuid == current_user).first()
    stop_ids_of_trip = db.query(TripStops).filter(TripStops.trip_id == trip_id).order_by(TripStops.stop_order).all()
    stops = []

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not stop_ids_of_trip:
        print("stop is empty")
        return {"trip": trip, "stops": []}
    
    for stop in stop_ids_of_trip:
        stop_obj = db.query(Stop).filter(Stop.stop_id == stop.stop_id).first()
        stops.append(stop_obj.stop_coordinates)


    
    return {"trip": trip, "stops": stops}

@app.post("/add-trip")
async def add_trips(new_trip: TripCreate,
                       payload = Depends(verify_jwt_token),
                      db: Session = Depends(get_db)):
    """
    Add a new trip to the database.

    Parameters:
    - new_trip (TripCreate): The trip data to be added.
    - payload (dict): The decoded JWT token payload containing user information.
    - db (Session): The database session dependency.

    Returns:
    - JSON: A message indicating successful trip addition and the trip ID.

    Raises:
    - HTTPException: 401 - If the user is not logged in.
    - HTTPException: 404 - If the trip status is invalid.
    """

    current_user = payload["username"]
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")

    if new_trip.trip_status:
        if (new_trip.trip_status == "Upcoming"):
            new_trip.trip_status = "upcoming"
        elif (new_trip.trip_status == "Finished"):
            new_trip.trip_status = "finished"
        elif (new_trip.trip_status == "In Progress"):
            new_trip.trip_status = "in_progress"
        elif(new_trip.trip_status == "Cancelled"):
            new_trip.trip_status = "cancelled"
        elif(new_trip.trip_status == "Delayed"):
            new_trip.trip_status = "delayed"
        else:
            raise HTTPException(status_code=404, detail="Invalid status")

    # Create a new Trip instance
    new_trip = Trip(trip_name = new_trip.trip_name,
                    start_coordinates = new_trip.start_coordinates,
                    destination_coordinates = new_trip.destination_coordinates,
                    start = new_trip.start,
                    destination = new_trip.destination,
                    start_date = new_trip.start_date,
                    end_date = new_trip.end_date,
                    time = new_trip.time,
                    trip_status = new_trip.trip_status,
                    owner_uuid = current_user)
        
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    return {"message": "Trip added successfully", "trip_id": new_trip.trip_id}

@app.patch("/update-trip-name/{trip_id}")
async def update_trip_name(trip_id: int,
                           trip_name: str = Body(...),
                           payload = Depends(verify_jwt_token),
                           db: Session = Depends(get_db)):
    
    """
    Update the name of an existing trip.

    Parameters: 
    - trip_id (int): the id of the trip being renamed
    - trip_name (str): the new name of the trip retrieved from the body of the request
    - payload (dict): The decoded JWT token payload containing user information.
    - db (Session): The database session dependency.

    Raises:
    - HTTPException: 401 - If the user is not logged in.
    - HTTPException: 404 - If the trip is not found or if the trip status is invalid.

    """
    
    # Retrieve data on current user
    current_user = payload["username"]
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    # Find the trip by the trip ID
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Update the trip name
    setattr(trip, "trip_name", trip_name)

    db.commit()
    db.refresh(trip)
    

@app.patch("/update-trip/{trip_id}")
async def update_trip(trip_id: int,
                        updated_trip: UpdateTripRequest,
                        payload = Depends(verify_jwt_token),
                        db: Session = Depends(get_db)):
    """
    Update an existing trip in the database with the provided data.

    Parameters:
    - trip_id (int): The ID of the trip to update.
    - updated_trip (UpdatedTripRequest): The updated trip data & the new collection of stops.
    - payload (dict): The decoded JWT token payload containing user information.
    - db (Session): The database session dependency.

    Returns:
    - JSON: A message indicating successful trip update and the trip ID.

    Raises:
    - HTTPException: 401 - If the user is not logged in.
    - HTTPException: 404 - If the trip is not found or if the trip status is invalid.

    """

    # Retrieve data on current user
    current_user = payload["username"]
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")

    
    # Find the trip by the trip ID
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Retrieve the updated trip from the request
    trip_to_update = updated_trip.updated_trip
    
    # Dump all data from updated trip
    update_fields = trip_to_update.model_dump(exclude_unset=True)

    # Loop through and update the fields as modified
    for field, value in update_fields.items():
        setattr(trip, field, value)

    # Retrieve all the stops of the trip
    stops = updated_trip.stops_of_trip

    # Get all current tripstops for the trip
    existing_tripstops = db.query(TripStops).filter(TripStops.trip_id == trip_id).all()

    # Build set of incoming (trip_id, stop_order) pairs
    incoming_orders = set((trip_id, stop.id) for stop in stops)

    # Delete TripStops that are no longer in that set
    for tripstop in existing_tripstops:
        key = (tripstop.trip_id, tripstop.stop_order)
        if key not in incoming_orders:
            db.delete(tripstop)

    for stop in stops:
        # Check if stop existed 
        exists = db.query(Stop).filter(Stop.stop_name == stop.stop_name, 
                                               Stop.stop_coordinates == stop.stop_coordinates).first()
        
        # If not existed, add a new stop to Stop table
        if not exists:
            new_stop = Stop(stop_name = stop.stop_name, stop_coordinates = stop.stop_coordinates)
            db.add(new_stop)
            db.flush()
        else:
           continue
    
    
    # Loop through all the stops of the trip
    for stop in stops:
        # Query the stop_id of the stop where stop name and coordinates matches the data
        stop_id = db.query(Stop.stop_id).filter(Stop.stop_name == stop.stop_name, 
                                                Stop.stop_coordinates == stop.stop_coordinates).scalar()

        # Check if this exact trip_id and stop_order already exist
        existing_by_order = db.query(TripStops).filter(
            TripStops.trip_id == trip_id,
            TripStops.stop_order == stop.id
        ).first()

        if existing_by_order:
            # Update it to the current stop_id if it's different
            if existing_by_order.stop_id != stop_id:
                existing_by_order.stop_id = stop_id
            continue

        # Else, insert a new row — allows reuse of stop_id at new stop_order
        new_trip_stop = TripStops(
            stop_id=stop_id,
            trip_id=trip_id,
            stop_order=stop.id
        )
        db.add(new_trip_stop)

    # Commit the changes to the database
    db.commit()
    db.refresh(trip)  # Refresh the trip instance to get updated data
    return {"message": "Trip updated successfully", "trip_id": trip.trip_id} 

@app.delete("/delete-trip/{trip_id}")
async def delete_trip(trip_id: int,
                        payload = Depends(verify_jwt_token),
                        db: Session = Depends(get_db)):
    
    """
    Delete a trip by trip_id.

    Parameters:
    - trip_id (int): The ID of the trip to delete.
    - payload (dict): The decoded JWT token payload containing user information.
    - db (Session): The database session dependency.

    Returns:
    - JSON: A message indicating successful trip deletion.

    Raises:
    - HTTPException: 401 - If the user is not logged in.
    - HTTPException: 404 - If the trip is not found.

    """
    
    current_user = payload["username"]
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    # Find the trip by ID
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.owner_uuid == current_user).first()
    tripStops = db.query(TripStops).filter(TripStops.trip_id == trip_id).first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Delete the trip
    db.delete(trip)

    if tripStops is not None:
        db.delete(tripStops) # delete associating trip stops

    db.commit()
    
    return {"message": "Trip deleted successfully"}


@app.get("/")
def fastapi_test():
    """
    Test endpoint to check the app is working"""
    return {
        "message":"Fastapi working."
    }
    
# This is the Lambda handler
handler = Mangum(app)
