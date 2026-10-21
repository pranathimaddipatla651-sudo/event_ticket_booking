from fastapi import APIRouter

router=APIRouter(tags=["customer"])

@router.get("/customer-ping")
def ping():
    return {"message":"customer router works"}