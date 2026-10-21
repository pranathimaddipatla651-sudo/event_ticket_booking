from fastapi import APIRouter

router=APIRouter(tags=["payments"])

@router.get("/payments-ping")
def ping():
    return {"meassage":"payments router works"}