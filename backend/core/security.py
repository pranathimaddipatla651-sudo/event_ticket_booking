import os
import hashlib
import hmac

def hash_password(password: str)->str:
    salt=os.urandom(16)
    passHash=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,120_000)
    return salt.hex()+"$"+passHash.hex()

def verify_password(password:str,stored:str)->bool:
    salt_hex,storedHash=stored.split("$")
    passHash=hashlib.pbkdf2_hmac("sha256",password.encode(),bytes.fromhex(salt_hex),120_000)
    return hmac.compare_digest(passHash.hex(),storedHash)
