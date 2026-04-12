"""
Session Middleware - Server-side session management without cookies
Sessions stored in memory with TTL
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import uuid
from datetime import datetime, timedelta
from typing import Dict, Optional

# In-memory session store
sessions: Dict[str, dict] = {}


class SessionManager:
    """Server-side session management"""
    
    def create_session(self, customer_id: int, remember_me: bool = False) -> str:
        """Create a new session and return session token"""
        session_token = str(uuid.uuid4())
        ttl = 86400 if remember_me else 3600  # 24h or 1h
        expiry = datetime.utcnow() + timedelta(seconds=ttl)
        
        sessions[session_token] = {
            "customer_id": customer_id,
            "created_at": datetime.utcnow(),
            "expires_at": expiry
        }
        
        return session_token
    
    def get_session(self, session_token: str) -> Optional[dict]:
        """Get session data if valid"""
        if session_token not in sessions:
            return None
        
        session = sessions[session_token]
        
        # Check if expired
        if datetime.utcnow() > session["expires_at"]:
            del sessions[session_token]
            return None
        
        return session
    
    def destroy_session(self, session_token: str) -> bool:
        """Destroy a session"""
        if session_token in sessions:
            del sessions[session_token]
            return True
        return False
    
    def cleanup_expired(self):
        """Clean up expired sessions"""
        expired = [
            token for token, session in sessions.items()
            if datetime.utcnow() > session["expires_at"]
        ]
        for token in expired:
            del sessions[token]


# Global instance
session_manager = SessionManager()


class SessionMiddleware(BaseHTTPMiddleware):
    """Middleware to attach session to request"""
    
    async def dispatch(self, request: Request, call_next):
        # Get session token from headers (Authorization header)
        auth_header = request.headers.get("Authorization", "")
        session_token = None
        
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]  # Remove "Bearer " prefix
        
        # Attach session to request state
        request.state.session_token = session_token
        request.state.customer_id = None
        
        if session_token:
            session = session_manager.get_session(session_token)
            if session:
                request.state.customer_id = session["customer_id"]
        
        # Cleanup expired sessions periodically
        session_manager.cleanup_expired()
        
        response = await call_next(request)
        return response


def get_current_customer_id(request: Request) -> int:
    """Dependency to get current customer ID from session"""
    customer_id = request.state.customer_id
    
    if customer_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    return customer_id
