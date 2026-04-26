"""milestone5_ai_pipeline

Adds the knowledge_chunks table (for full-text retrieval) and the ai_runs
table (for tracking LLM inference jobs).

Revision ID: a1b2c3d4e5f6
Revises: bba02cf2ec16
Create Date: 2026-04-11 00:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | None = "bba02cf2ec16"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── knowledge_chunks ──────────────────────────────────────────────────────
    op.create_table(
        "knowledge_chunks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("token_count", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index(
        "ix_knowledge_chunks_workspace_id",
        "knowledge_chunks",
        ["workspace_id"],
    )
    # GIN index for full-text search
    op.execute(
        "CREATE INDEX ix_knowledge_chunks_content_gin "
        "ON knowledge_chunks USING GIN (to_tsvector('english', content))"
    )

    # ── ai_runs ───────────────────────────────────────────────────────────────
    op.create_table(
        "ai_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("trigger_message_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "queued", "running", "completed", "failed", "skipped",
                name="ai_run_status",
                create_type=True,
            ),
            nullable=False,
            server_default=sa.text("'queued'"),
        ),
        sa.Column(
            "decision",
            sa.Enum(
                "replied", "escalated", "skipped",
                name="ai_decision",
                create_type=True,
            ),
            nullable=True,
        ),
        sa.Column("model_name", sa.String(length=128), nullable=True),
        sa.Column("system_prompt_version", sa.String(length=32), nullable=True),
        sa.Column("input_tokens", sa.Integer(), nullable=True),
        sa.Column("output_tokens", sa.Integer(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("generated_text", sa.Text(), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["workspace_id"],
            ["workspaces.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
    )
    op.create_index("ix_ai_runs_workspace_id", "ai_runs", ["workspace_id"])
    op.create_index("ix_ai_runs_conversation_id", "ai_runs", ["conversation_id"])


def downgrade() -> None:
    op.drop_index("ix_ai_runs_conversation_id", table_name="ai_runs")
    op.drop_index("ix_ai_runs_workspace_id", table_name="ai_runs")
    op.drop_table("ai_runs")
    op.execute("DROP TYPE IF EXISTS ai_run_status")
    op.execute("DROP TYPE IF EXISTS ai_decision")

    op.execute("DROP INDEX IF EXISTS ix_knowledge_chunks_content_gin")
    op.drop_index("ix_knowledge_chunks_workspace_id", table_name="knowledge_chunks")
    op.drop_table("knowledge_chunks")
