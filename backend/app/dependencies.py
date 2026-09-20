import os

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt


KEYCLOAK_INTERNAL_URL = os.getenv(
    "KEYCLOAK_INTERNAL_URL",
    "http://keycloak:8080",
)

KEYCLOAK_ISSUER = os.getenv(
    "KEYCLOAK_ISSUER",
    "http://localhost:8080/realms/notify",
)

KEYCLOAK_CERTS_URL = (
    f"{KEYCLOAK_INTERNAL_URL}/realms/notify"
    "/protocol/openid-connect/certs"
)

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    try:
        # Get Keycloak public keys through Docker's internal network
        response = httpx.get(KEYCLOAK_CERTS_URL, timeout=5)
        response.raise_for_status()

        jwks = response.json()

        # Read the JWT header without verifying it yet
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        key = next(
            (
                key
                for key in jwks["keys"]
                if key.get("kid") == kid
            ),
            None,
        )

        if key is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find matching Keycloak signing key",
            )

        # Verify signature, expiration, and issuer
        print("KEYCLOAK_ISSUER =", KEYCLOAK_ISSUER)
        print("TOKEN ISSUER =", jwt.get_unverified_claims(token).get("iss"))        
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=KEYCLOAK_ISSUER,
            options={
                "verify_aud": False,
            },
        )

        return payload

    except HTTPException:
        raise

    except (JWTError, httpx.HTTPError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Keycloak token",
        )