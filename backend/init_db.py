#!/usr/bin/env python3
"""
Database initialization script for CuraGenie
This script initializes the database and creates all tables.
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
sys.path.append(str(Path(__file__).parent))

# Import all models to ensure they're registered with Base
from db import models
from db.database import engine, Base, create_tables
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize the database and create all tables"""
    try:
        logger.info("Starting database initialization...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        logger.info("✅ Database initialized successfully!")
        logger.info(f"Database file location: {os.path.abspath('curagenie.db') if 'sqlite' in str(engine.url) else 'PostgreSQL database'}")
        
        # List all created tables
        table_names = list(Base.metadata.tables.keys())
        logger.info(f"Created tables: {', '.join(table_names)}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
