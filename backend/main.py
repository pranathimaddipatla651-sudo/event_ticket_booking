from fastapi import FastAPI
from routers import admin,customer,organizer,payments
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(title="Event-booking-system")

app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:5173"],allow_headers=["*"],allow_methods=["*"])

app.include_router(admin.router)
app.include_router(customer.router)
app.include_router(organizer.router)
app.include_router(payments.router)