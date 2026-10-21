from fastapi import APIRouter

router =APIRouter(prefix="/admin",tags=['admin'])

@router.get("/ping")
def ping():
    return {"message":"admin router is working"}