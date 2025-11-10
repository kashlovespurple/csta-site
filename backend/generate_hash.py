# quick: generate_hash.py
from passlib.hash import pbkdf2_sha256
print(pbkdf2_sha256.hash("SuperStrongAdminPass123!"))
