from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import RenderJob, User
from app.schemas import RenderJobOut

router = APIRouter()


@router.get("/{job_id}", response_model=RenderJobOut)
def get_job(
    job_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RenderJobOut:
    j = db.get(RenderJob, job_id)
    if not j or j.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    return RenderJobOut.model_validate(j)
