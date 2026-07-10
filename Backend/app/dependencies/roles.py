from fastapi import Depends, HTTPException, status
from app.dependencies.auth import get_current_user
from app.models.user import User

class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for this user role",
            )
        return user

require_applicant = RoleChecker(["applicant"])
require_employee = RoleChecker(["employee", "admin", "super_admin"])
require_admin = RoleChecker(["admin", "super_admin"])
require_super_admin = RoleChecker(["super_admin"])
