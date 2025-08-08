#!/usr/bin/env python3
"""
Celery Worker Entry Point

This script starts the Celery worker process that will execute background tasks
for genomic processing, PRS calculation, and ML inference.

Usage:
    python worker/worker.py

Or using Celery directly:
    celery -A core.celery_app worker --loglevel=info --queues=genomic_processing,prs_calculation,ml_inference
"""

import os
import sys
import logging

# Add the parent directory to the Python path so we can import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.celery_app import celery_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("🚀 Starting CuraGenie Celery Worker...")
    
    # Start the Celery worker
    celery_app.worker_main([
        'worker',
        '--loglevel=info',
        '--queues=genomic_processing,prs_calculation,ml_inference',
        '--concurrency=2',  # Number of concurrent workers
        '--prefetch-multiplier=1',  # Only fetch one task at a time per worker
    ])
