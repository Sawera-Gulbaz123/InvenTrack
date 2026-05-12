# backend/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# In production Railway sets DATABASE_URL automatically
# In development it falls back to your local MySQL
DATABASE_URL = os.environ.get(
    'DATABASE_URL',
    'mysql+pymysql://root:yourpassword@localhost:3306/inventorydb'
)

# Railway sometimes gives mysql:// instead of mysql+pymysql://
# This fixes it automatically
if DATABASE_URL.startswith('mysql://'):
    DATABASE_URL = DATABASE_URL.replace('mysql://', 'mysql+pymysql://', 1)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()