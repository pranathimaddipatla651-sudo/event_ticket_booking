from fastapi import FastAPI
from routers import admin,customer,organizer,payments
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(title="Event-booking-system")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(customer.router)
app.include_router(organizer.router)
app.include_router(payments.router)