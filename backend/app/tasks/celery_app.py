from celery import Celery
from kombu import Exchange, Queue

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "instagram_ai_platform",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.tasks.webhook_tasks",
        "app.tasks.ai_tasks",
        "app.tasks.delivery_tasks",
    ],
)

tasks_exchange = Exchange("tasks", type="direct")

celery_app.conf.update(
    task_default_queue="webhooks",
    task_default_exchange="tasks",
    task_default_exchange_type="direct",
    task_default_routing_key="webhooks",
    task_queues=(
        Queue("webhooks", exchange=tasks_exchange, routing_key="webhooks"),
        Queue("ai", exchange=tasks_exchange, routing_key="ai"),
        Queue("delivery", exchange=tasks_exchange, routing_key="delivery"),
        Queue("sync", exchange=tasks_exchange, routing_key="sync"),
    ),
    task_routes={
        "app.tasks.webhook_tasks.*": {"queue": "webhooks", "routing_key": "webhooks"},
        "app.tasks.ai_tasks.*": {"queue": "ai", "routing_key": "ai"},
        "app.tasks.delivery_tasks.*": {"queue": "delivery", "routing_key": "delivery"},
    },
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    result_expires=86400,
    task_default_retry_delay=1,
    task_default_max_retries=3,
    timezone="UTC",
    enable_utc=True,
    task_annotations={
        "app.tasks.webhook_tasks.process_webhook_event": {"soft_time_limit": 30},
        "app.tasks.ai_tasks.generate_ai_reply": {"soft_time_limit": 60},
        "app.tasks.delivery_tasks.send_outbound_message": {"soft_time_limit": 20},
    },
)
