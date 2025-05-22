import os

origins_str = os.getenv("ALLOWED_ORIGINS")
allow_origins = origins_str.split(",")
