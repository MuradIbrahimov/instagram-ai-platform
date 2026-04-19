FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml /app/
COPY README.md /app/
COPY app /app/app
COPY alembic.ini /app/alembic.ini
COPY migrations /app/migrations

RUN pip install --upgrade pip \
    && pip install --prefix=/install .

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN useradd --create-home appuser

COPY --from=builder /install /usr/local
COPY app /app/app
COPY alembic.ini /app/alembic.ini
COPY migrations /app/migrations
COPY pyproject.toml /app/pyproject.toml
COPY README.md /app/README.md

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
