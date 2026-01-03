# Python slim for efficiency
FROM python:3.11-slim-bookworm

# Don't write python pyc files to storage
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/home/pagentuser/.local/bin:$PATH"

# Run as regular user
RUN useradd -m -u 1000 pagentuser

RUN apt update && apt install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown pagentuser:pagentuser /app

USER pagentuser

# Install dependencies
COPY --chown=pagentuser:pagentuser requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY --chown=pagentuser:pagentuser . .

# Expose port to connect to
EXPOSE 8000

# Run app using gunicorn
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "--workers", "4", "--bind", "0.0.0.0:8000", "server:combined"]