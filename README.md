# Event Ticket Booking (DBMS Project)

A web app for browsing events and booking tickets.

| Part | Tech | Folder |
|---|---|---|
| Database | MySQL 8 (hosted on Aiven, shared by the team) | `database/` |
| Backend | Python, FastAPI, PyMySQL (plain SQL, no ORM) | `backend/` |
| Frontend | React + Vite | `frontend/` |

---

## Who owns what

| Person | Module | Files they edit |
|---|---|---|
| 1 | Admin panel (users, venues, categories, dashboard) | `backend/routers/admin.py` |
| 2 | Organizer (events, ticket types, sales reports) | `backend/routers/organizer.py` |
| 3 | Customer (register, login, search, book, cancel) + skeleton | `backend/routers/customer.py`, `backend/core/booking.py`, `backend/core/security.py` |
| 4 | Payments, waitlist, reviews | `backend/routers/payments.py`, `backend/core/waitlist.py` |

**Rules**
1. Edit **only your own files**. This avoids merge conflicts.
2. Do not edit `main.py`, `db.py` or the table definitions. Ask Person 3 (skeleton owner).
3. Code that two people need goes in `backend/core/`, and its owner is the person listed above.
4. We all share ONE database, so a schema change affects everyone. Ask before changing a table.

---

## Folder structure

```
event_ticket_booking/
├── database/
│   └── event_booking_schema_hybrid.sql   # tables, triggers, views
├── backend/
│   ├── core/                # shared logic (booking, security, waitlist)
│   ├── routers/             # one file per person: admin, organizer, customer, payments
│   ├── db.py                # database connection + tx() helper
│   ├── main.py              # creates the app, plugs in the routers
│   ├── requirements.txt
│   ├── .env.example         # copy to .env and fill in
│   └── ca.pem               # Aiven SSL certificate (get it from Person 3)
└── frontend/                # React app
```

---

## Setup: backend

Run these inside the `backend` folder.

**1. Create and activate a virtual environment (once)**
```
python -m venv venv
venv\Scripts\activate
```
Mac/Linux: `source venv/bin/activate`. You should see `(venv)` at the start of the prompt. Activate it again every time you open a new terminal.

**2. Install packages**
```
pip install -r requirements.txt
```

**3. Create your `.env`**
Copy `.env.example` to a new file named `.env` and fill in the real values.
Get them from Person 3 **privately** (direct message, never a public group or Git).

```
DB_HOST=your-host.aivencloud.com
DB_PORT=your_port
DB_USER=your_user
DB_PASSWORD=your_password_here
DB_DATABASE=event_booking
DB_SSL_CA=ca.pem
```

Notes:
- Variable names must match exactly. `db.py` reads `DB_DATABASE`, not `DB_NAME`.
- No spaces around `=`, no quotes.
- Put `ca.pem` in the `backend` folder.

**4. Test the database connection**
Create `test_db.py` (do not commit it):
```python
from db import tx

with tx() as cur:
    cur.execute("SELECT COUNT(*) AS n FROM Users")
    print(cur.fetchone())
```
Run `python test_db.py`. You should see `{'n': ...}`.

**5. Start the server**
```
python -m uvicorn main:app --reload
```
Open http://127.0.0.1:8000/docs. You will see every endpoint and can test it with **Try it out**.

> Use `python -m uvicorn`, not plain `uvicorn`. On some Windows machines `uvicorn.exe` is blocked by a security policy, and this form avoids that.

---

## Setup: frontend

Run these inside the `frontend` folder.

```
npm install
npm run dev
```

Create a file `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```
Restart `npm run dev` after changing `.env`. The app opens at http://localhost:5173.

The backend allows requests from port 5173 (CORS). If your port is different, tell Person 3.

---

## Git workflow

- `main` branch holds working code. Do not push broken code to it.
- Each person works on their own branch, for example `admin`, `organizer`, `customer`, `payments`.
- Pull before you start work: `git pull`.
- Never commit `.env`, `venv/`, `node_modules/`, `__pycache__/`, or your own `test_db.py`.
- If `git status` shows `.env`, stop and fix `.gitignore` first.

---

## How the backend works (read this once)

1. The frontend sends a request, for example `POST /bookings`.
2. FastAPI finds the matching function in a file in `routers/`.
3. Pydantic checks that the data sent is valid (right fields, right types).
4. The function runs SQL through `with tx() as cur:`.
5. `tx()` saves everything (commit) if all went well, or undoes everything (rollback) if any step failed.
6. The result goes back to the frontend as JSON.

**Adding an endpoint** (in your own router file):
```python
@router.get("/something")
def get_something():
    with tx() as cur:
        cur.execute("SELECT * FROM Venues")
        return cur.fetchall()
```

**Overbooking prevention** (Person 3, `core/booking.py`): the booking runs in one transaction and locks the ticket row with `SELECT ... FOR UPDATE`, so two people cannot take the last ticket at the same time.

---

## Database tables (10)

Users, Venues, Categories, Events, Ticket_Types, Bookings, Booking_Items, Payments, Waitlist, Reviews.

See the ER diagram in `database/` for the relationships.

---

## Common problems

| Error | Cause and fix |
|---|---|
| `ModuleNotFoundError: No module named 'core'` or `'routers'` | The folder is not inside `backend`, or `__init__.py` is missing |
| `module 'routers.x' has no attribute 'router'` | That router file is missing the line `router = APIRouter(...)` |
| `Can't connect ... (timed out)` | Wrong `DB_PORT`, or Aiven service is off, or the network blocks the port. Try a phone hotspot |
| `port should be of type int` | `db.py` must use `int(os.getenv("DB_PORT"))` |
| `Access denied for user` | Wrong `DB_USER` or `DB_PASSWORD` in `.env` |
| `Table ... doesn't exist` | The schema file has not been run on the shared database |
| Yellow squiggles under imports in VS Code | VS Code is using the wrong Python. Ctrl+Shift+P, then **Python: Select Interpreter**, then choose `backend\venv\Scripts\python.exe` |
| Browser says "blocked by CORS policy" | The frontend port is not in `allow_origins` in `main.py` |
| Policy has blocked this file (`uvicorn.exe`) | Use `python -m uvicorn main:app --reload` |

---

## Status

- [x] Database connection (`db.py`)
- [x] Shared Aiven database with schema
- [ ] Router skeletons for all four modules
- [ ] Sample data script
- [ ] Frontend foundation (API client, login state, routing)
