from db import tx

with tx() as curr:
    curr.execute("SELECT COUNT(*) AS n FROM Users")
    print(curr.fetchone())