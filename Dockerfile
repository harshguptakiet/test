FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Create directories
RUN mkdir -p /app/data /app/uploads

# Environment variables
ENV PYTHONUNBUFFERED=1

# Start command
CMD sh -c "gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker --host 0.0.0.0 --port $PORT"
