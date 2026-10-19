import os
from contextlib import contextmanager
import pymysql  
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

def get_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_DATABASE"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False
    )

@contextmanager
def tx():
    conn=get_conn()
    try:
        with conn.cursor() as curr:
            yield curr
        conn.commit()
    except pymysql.MySQLError as e:
        conn.rollback()
        code = e.args[0] if e.args else 0             # MySQL error number
        if code == 1644:                              # our triggers raise this (SIGNAL)
            raise HTTPException(409, e.args[1])
        if code == 1452:                              # foreign key points to a row that doesn't exist
            raise HTTPException(404, "Referenced record does not exist")
        if code == 1451:                              # can't delete: other rows still use it
            raise HTTPException(409, "Cannot delete: other records depend on it")
        if code == 1062:                              # duplicate value in a UNIQUE column
            raise HTTPException(409, "Already exists")
        raise HTTPException(500, f"Database error: {e}")
    except Exception:
        conn.rollback()                               # e.g. our own HTTPException(404, ...)
        raise   
    finally:
        conn.close()