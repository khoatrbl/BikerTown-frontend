from datetime import date, datetime, time
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Form, HTTPException, requests, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import case
from sqlalchemy.orm import Session
from schemas.trip_create import TripCreate
from database import Base, get_db, engine
from models.trip_model import Trip
from models.user_contact_model import UserContact
from models.user_model import User
from schemas.user_contact_create import UserContactCreate
from schemas.user_create import UserCreate
from fastapi.middleware.cors import CORSMiddleware
import utilities
import bcrypt
import os

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

# OAuth2PasswordBearer instance
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

"""
Log in endpoint.
"""
@app.post("/login")
async def login(username: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    # Find the matching user with the username given
    user = db.query(User).filter(User.username == username).first()

    # If there is no match, return an error
    if (user is None):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    #Encoding the passwords before feeding into bcrypt    
    password = password.encode('utf-8')
    encoded_user_password = user.password.encode('utf-8') 

    # Checking if the password matches the hashed password
    if not (bcrypt.checkpw(password, encoded_user_password)):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    data = {
        "user_id": user.user_id,
        "username": user.username,
        "display_name": user.display_name
    }

    access_token = utilities.create_access_token(data)

    response = {
        "message": f"Log in successful. Welcome {user.display_name}",
        "user_id": f"{user.user_id}",
        "username": f"{user.username}",
        "display_name": f"{user.display_name}",
        "token": access_token,
        "token_type": "bearer"
    }

    return JSONResponse(content = response)

"""
Register endpoint.
"""
@app.post("/register")
async def register(username: str = Form(...),
             password: str = Form(...),
             display_name: str = Form(...),
             gender: bool = Form(...),
             dob: str = Form(...),
             vehicle: str = Form(...),
             phone: str = Form(...),
             email: str = Form(...),
             address: str = Form(...),
             district: str = Form(...),
             city: str = Form(...),
             db: Session = Depends(get_db)):
    user = db.query(User.username).filter(User.username == username).first()

    # Check if the user has already existed on the database
    if user:
        raise HTTPException(status_code=400, detail="Username already exists.")
    
    # If not, create a hash for the new password, add it to the new user and insert the user onto the database
    # Encode the password before feeding into bcrypt
    password = password.encode('utf-8')
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')
    new_user = UserCreate(username=username, 
                          password=hashed_password, 
                          display_name=display_name, 
                          gender=gender, 
                          dob=datetime.strptime(dob, '%Y-%m-%d').date(), 
                          vehicle=vehicle)
    
    user_insert_result = await utilities.insert_user(new_user, db)

    # Check to see if there is any error during inserting the new user
    if (user_insert_result is None):
        raise HTTPException(status_code=500, detail="Failed to add user.")
    
    # Get the latest user_id just added
    latest_user_id = await utilities.get_latest_user_id(db)
    latest_user_id = latest_user_id[0]
    
    # Check to see if there is any error getting the latest user id
    if latest_user_id is None:
        raise HTTPException(status_code=500, detail="An error has occurred in retrieving data.")
    
    # If not, create a new user contact that corresponds to the new user
    new_user_contact = UserContactCreate(user_id = latest_user_id, phone = phone, email = email, address = address, district = district, city = city)
    contact_insert_result = await utilities.insert_user_contact(new_user_contact, db)

    if contact_insert_result is None:
        raise HTTPException(status_code=500, detail="Failed to add contact.")

    return {
        "message": "Register successfully!",
    }
    

@app.get("/profile")
async def get_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    current_user = utilities.decode_access_token(token)
    user_profile = db.query(User, UserContact).join(UserContact, User.user_id == UserContact.user_id).filter(User.username == current_user['username']).first()
     # If no user or contact found, raise an HTTPException
    if user_profile is None:
        raise HTTPException(status_code=404, detail="User or contact information not found")
    
    user, user_contact = user_profile
    
    return {
        "user": {
            "username": user.username,
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

"""
Update profile endpoint.
"""
@app.post("/update-profile")
async def update_profile(token: str = Depends(oauth2_scheme),
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
    current_user = utilities.decode_access_token(token)
    user_profile = db.query(User, UserContact).join(UserContact, User.user_id == UserContact.user_id).filter(User.user_id == current_user["user_id"]).first()

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

"""
Update password endpoint.
"""    
@app.post("/update-password")
async def update_password(token: str = Depends(oauth2_scheme), 
                          current_pwd: str = Form(...), 
                          new_pwd: str = Form(...), 
                          cf_new_pwd: str = Form(...),
                          db: Session = Depends(get_db)):
    
    current_user = utilities.decode_access_token(token)
    user = db.query(User).filter(User.user_id == current_user['user_id']).first()

    # If there is no match, return an error
    if (user is None):
        raise HTTPException(status_code=400, detail="Invalid username or password")
    
    if (new_pwd != cf_new_pwd):
        raise HTTPException(status_code=400, detail="New passwords don't match!")
    
    encoded_current_pwd = current_pwd.encode('utf-8')
    encoded_user_pwd = user.password.encode('utf-8')
    encoded_new_pwd = new_pwd.encode('utf-8')

    # Checking if the current password matches the hashed password
    if not (bcrypt.checkpw(encoded_current_pwd, encoded_user_pwd)):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    
    if (current_pwd == new_pwd):
        raise HTTPException(status_code=400, detail="New password can not be the same as current password.")
    
    user.password = bcrypt.hashpw(encoded_new_pwd, bcrypt.gensalt()).decode('utf-8')
    
    db.commit()
    db.refresh(user)

    return {
        "message": "Password is updated successfully!",
    }

"""
Retrieve all trip info endpoint.
"""
@app.get("/trips")
async def get_trips(token: str=Depends(oauth2_scheme),
                        db: Session = Depends(get_db)):
    # TODO: Replace with user_id from JWT Token later
    # For now, using a mockup user_id for testing purposes

    current_user = utilities.decode_access_token(token)
    user_id = db.query(User.user_id).filter(User.user_id == current_user['user_id']).first()

    if not user_id:
        raise HTTPException(status_code=401, detail="Session expired.")

    user_id = user_id[0]  # Extract the user_id from the tuple

    # Query to get all trips for the user, excluding finished trips
    trips = db.query(Trip).join(User, Trip.user_id == User.user_id).filter(User.user_id == user_id).order_by(
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
                             token: str = Depends(oauth2_scheme),
                             db: Session = Depends(get_db)):
    current_user = utilities.decode_access_token(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    user_id = current_user['user_id']
    
    # user_id = 29  # mockup user, replace with user_id from JWT Token later
    # Query to get the trip by ID for the user
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == user_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return trip
"""
Add a new trip endpoint.
Might be a good idea to integrate stops suggestion later in this section (?)
"""
@app.post("/add-trip")
async def add_trips(new_trip: TripCreate,
                       token: str = Depends(oauth2_scheme),
                      db: Session = Depends(get_db)):
    
    current_user = utilities.decode_access_token(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    user_id = current_user['user_id']

    # user_id = 29 # mockup user, replace with user_id from JWT Token later

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
    new_trip = Trip(start = new_trip.start,
                    destination = new_trip.destination,
                    start_date = new_trip.start_date,
                    end_date = new_trip.end_date,
                    time = new_trip.time,
                    trip_status = new_trip.trip_status,
                    user_id = user_id)
        
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    return {"message": "Trip added successfully", "trip_id": new_trip.trip_id}

"""
Update a trip endpoint.
"""
@app.put("/update-trip/{trip_id}")
async def update_trip(trip_id: int,
                        updated_trip: TripCreate,
                        token: str = Depends(oauth2_scheme),
                        db: Session = Depends(get_db)):
    
    current_user = utilities.decode_access_token(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    # mockup user, replace with user_id from JWT Token later
    user_id = current_user['user_id']

    # user_id = 29  # mockup user, replace with user_id from JWT Token later
    
    # Find the trip by ID
    trip = db.query(Trip).filter(Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Update the trip details
    trip.start = updated_trip.start
    trip.destination = updated_trip.destination
    trip.start_date = updated_trip.start_date
    trip.end_date = updated_trip.end_date
    trip.time = updated_trip.time
    if (updated_trip.trip_status == "Upcoming"):
        trip.trip_status = "upcoming"
    elif (updated_trip.trip_status == "Finished"):
        trip.trip_status = "finished"   
    elif (updated_trip.trip_status == "In Progress"):
        trip.trip_status = "in_progress"    
    elif(updated_trip.trip_status == "Cancelled"):
        trip.trip_status = "cancelled"
    elif(updated_trip.trip_status == "Delayed"):
        trip.trip_status = "delayed"
    else:
        raise HTTPException(status_code=404, detail="Invalid status")
        
    trip.user_id = user_id
    # Commit the changes to the database
    db.commit()
    db.refresh(trip)  # Refresh the trip instance to get updated data
    return {"message": "Trip updated successfully", "trip_id": trip.trip_id} 

@app.delete("/delete-trip/{trip_id}")
async def delete_trip(trip_id: int,
                        token: str = Depends(oauth2_scheme),
                        db: Session = Depends(get_db)):
    
    current_user = utilities.decode_access_token(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")
    
    user_id = current_user['user_id']

    # user_id = 29  # mockup user, replace with user_id from JWT Token later
    
    # Find the trip by ID
    trip = db.query(Trip).filter(Trip.trip_id == trip_id, Trip.user_id == user_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # Delete the trip
    db.delete(trip)
    db.commit()
    
    return {"message": "Trip deleted successfully"}
# """Validate a token."""
@app.get("/validate-token")
async def validate_token(token: str = Depends(oauth2_scheme)):
    current_user = utilities.decode_access_token(token)

    if not current_user:
        raise HTTPException(status_code=401, detail="Not logged in")   


"""
Test endpoint to check the app is working
"""
@app.get("/")
def fastapi_test():
    return {
        "message":"Fastapi working."
    }
    

############# MOCK UP SECTION #############
"""
Simulate a login endpoint to provide a token (not for production, only mockup)
"""
@app.post("/token")
async def login_for_access_token(username: str = Form(...), password: str = Form(...)):
    # Fake authentication for demonstration purposes
    if username == "admin" and password == "admin":
        # Create JWT token with user data
        payload = {"sub": username}

        token = utilities.create_access_token(payload)
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=400, detail="Invalid credentials")

"""
Simulate retrieving profile after logged in with JWT verification
"""
@app.get("/mock-profile")
async def get_mock_profile(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    user_profile = db.query(User, UserContact).join(UserContact, User.user_id == UserContact.user_id).filter(User.username == "admin").first()
     # If no user or contact found, raise an HTTPException
    if user_profile is None:
        raise HTTPException(status_code=404, detail="User or contact information not found")
    
    user, user_contact = user_profile
    
    return {
        "user": {
            "username": user.username,
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