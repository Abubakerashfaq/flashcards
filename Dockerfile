FROM python:3.12-slim

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN pip install -r backend/requirements.txt

RUN cd frontend && npm install && npm run build

CMD cd backend && gunicorn --bind 0.0.0.0:$PORT app:app
