import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from decouple import config
from app.models import User
from sqlmodel import select
from app.database import get_db

# Auth0 configuration from environment
AUTH0_DOMAIN = config("AUTH0_DOMAIN")
AUTH0_AUDIENCE = config("AUTH0_AUDIENCE")
ALGORITHMS = ["RS256"]

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify Auth0 JWT token and return the payload."""
    token = credentials.credentials
    
    try:
        # Get the public key from Auth0
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        jwks_client = PyJWKClient(jwks_url)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTClaimsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unable to validate credentials: {str(e)}"
        )

def get_current_user(
    payload: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> User:
    """Get or create the current user from the Auth0 sub claim."""
    auth0_sub = payload.get("sub")
    if not auth0_sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub claim"
        )
    
    # Find existing user or create new one
    statement = select(User).where(User.auth0_sub == auth0_sub)
    user = db.exec(statement).first()
    
    picture = payload.get("picture")
    if not user:
        user = User(auth0_sub=auth0_sub, coins=0, picture_url=picture)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        updated = False
        if picture and user.picture_url != picture:
            user.picture_url = picture
            updated = True
        if updated:
            db.add(user)
            db.commit()
            db.refresh(user)
    
    return user
