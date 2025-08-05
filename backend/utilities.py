
from datetime import datetime
import re
import string
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import desc
from sqlalchemy.orm import Session

from models.user_contact_model import UserContact
from models.user_model import User
from schemas.user_contact_create import UserContactCreate
from schemas.user_create import UserCreate

import jwt

import httpx
from jose import jwt, JWTError

COGNITO_REGION = "ap-southeast-2"
COGNITO_USERPOOL_ID = "ap-southeast-2_JgyIE87Ot"
COGNITO_APP_CLIENT_ID = "49vvifb12b9vn6danpn4su4f2i"

# this will later be in the .env variable
JWKS_URL = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USERPOOL_ID}/.well-known/jwks.json"
ALGORITHMS = ["RS256"]  # The algorithm used to sign the JWT tokens

http_bearer = HTTPBearer()

async def get_jwks():
    async with httpx.AsyncClient() as client:
        resp = await client.get(JWKS_URL)
        resp.raise_for_status()
        return resp.json()["keys"]

async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer)
):
    token = credentials.credentials
    jwks = await get_jwks()
    try:
        header = jwt.get_unverified_header(token)
        key = next(k for k in jwks if k["kid"] == header["kid"])
        payload = jwt.decode(
            token,
            key,
            algorithms=ALGORITHMS,
            audience=COGNITO_APP_CLIENT_ID,
            issuer=f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USERPOOL_ID}",
        )
        return payload
    except (JWTError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


# Load environment variable from the .env file
load_dotenv()

# SECRET_KEY = os.getenv("SECRET_KEY") # Secret key for JWT tokens
# ACCESS_TOKEN_EXP_DELTA = 3 # Token expires after 3 hours
# ALGORITHM = "HS256" # Hashing algorithm for JWT tokens

# # Scheme to verify the access token
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_latest_uuid(db: Session):
    """
    Fetch the latest added user UUID from the database.

    Args:
    - db (Session): The database session to query.

    Returns:
    - str: The UUID of the latest user.

    Raises:
    - HTTPException: 400 - If no users are found or an error occurs during the query.
    """
    uuid = db.query(User.uuid).order_by(desc(User.created_date)).first()

    if uuid is None:
        raise HTTPException(status_code=400, detail="An error has occurred.")
    
    return uuid

"""
Insert a user to the database
"""
async def insert_user(new_user: UserCreate, db: Session):
    """
    Insert a new user into the database.

    Args:
    - new_user (UserCreate): The user data to be inserted.
    - db (Session): The database session to use for the operation.

    Returns:
    - Dict: A message indicating the success of the operation.

    """
    current_time = datetime.now()
    current_time = current_time.strftime('%Y-%m-%d %H:%M:%S')

    new_user_model = User(uuid=new_user.uuid,
                        display_name=new_user.display_name,
                        gender=new_user.gender,
                        dob=new_user.dob,
                        vehicle=new_user.vehicle,
                        created_date=current_time)
    
    db.add(new_user_model)
    db.commit()
    db.refresh(new_user_model)

    return {
        "message": "User added successfully."
    }


async def insert_user_contact(new_user_contact: UserContactCreate, db: Session):
    """
    Insert a user contact into the database with the corresponding user.

    Args:
    - new_user_contact (UserContactCreate): The user contact data to be inserted.
    - db (Session): The database session to use for the operation.

    Returns:
    - Dict: A message indicating the success of the operation.
    """
    new_user_contact_model = UserContact(owner_uuid=new_user_contact.owner_uuid,
                                         phone=new_user_contact.phone,
                                         email=new_user_contact.email,
                                         address=new_user_contact.address,
                                         district=new_user_contact.district,
                                         city=new_user_contact.city)
    
    db.add(new_user_contact_model)
    db.commit()
    db.refresh(new_user_contact_model)

    return {
        "message": "User contact added successfully."
    }


"""Sanitizing input"""
def sanitize(input: str):
    """
    Sanitize the input string by removing HTML tags, punctuation, and extra spaces.

    Args:
    - input (str): The input string to be sanitized.
    
    Returns:
    - str: The sanitized string.
    """
    # Trim the input, remove HTML tags, remove punctuation, and clean spaces
    sanitized_input = re.sub(r'<[^>]*>', '', input.strip())  # Remove HTML tags
    sanitized_input = sanitized_input.translate(str.maketrans('', '', string.punctuation))  # Remove punctuation
    sanitized_input = " ".join(sanitized_input.split())  # Remove extra spaces

    return sanitized_input