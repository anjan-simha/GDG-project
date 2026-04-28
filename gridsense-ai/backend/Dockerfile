FROM python:3.12-slim

WORKDIR /app

# System deps needed to compile numpy/scipy/statsmodels C extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Expose port (Render injects $PORT; default 8000 for local docker-compose)
EXPOSE 8000
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

