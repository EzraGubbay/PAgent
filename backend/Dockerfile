# Run as regular user
RUN adduser -D pagentuser
USER pagentuser

# Python slim for efficiency
FROM python:3.11-slim-bookworm

# Don't write python pyc files to storage
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHINUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose port to connect to
EXPOSE 8000

# Run app using gunicorn
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--workers", "4", "--bind", "0.0.0.0:8000", "server:combined"]