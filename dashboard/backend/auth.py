"""Bearer-token auth.

This service executes ansible-playbook against real infrastructure and writes
inventory files. It previously had no authentication at all, so anything that could
reach the port could run any playbook in the repository.
"""
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import DASHBOARD_TOKEN

_scheme = HTTPBearer(auto_error=False)


async def require_token(
    credentials: HTTPAuthorizationCredentials = Depends(_scheme),
) -> None:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Constant-time comparison so the token cannot be recovered by timing.
    if not secrets.compare_digest(credentials.credentials, DASHBOARD_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
