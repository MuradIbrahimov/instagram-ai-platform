from celery import Celery
from kombu import Queue

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "instagram_ai_platform",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=86400,
    task_default_max_retries=3,
    task_queues=(
        Queue("webhooks"),
        Queue("ai"),
        Queue("delivery"),
        Queue("sync"),
    ),
    task_default_queue="webhooks",
    task_routes={
        "app.tasks.webhook.*": {
            "queue": "webhooks",
            "soft_time_limit": 30,
        },
        "app.tasks.ai.*": {
            "queue": "ai",
            "soft_time_limit": 60,
        },
        "app.tasks.delivery.*": {
            "queue": "delivery",
            "soft_time_limit": 20,
        },
        "app.tasks.sync.*": {
            "queue": "sync",
        },
    },
)
