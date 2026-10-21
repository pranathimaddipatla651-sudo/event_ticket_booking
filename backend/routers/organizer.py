from fastapi import APIRouter

router = APIRouter(prefix="/organizer",tags=["organizer"])

@router.get("/ping")
def ping():
    return {"message":"organizer router working fine"}