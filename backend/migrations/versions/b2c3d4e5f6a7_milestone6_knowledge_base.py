"""milestone6_knowledge_base

Creates the knowledge_documents table and evolves the knowledge_chunks table
(created in M5) by:
  - adding the metadata JSONB column
  - adding a FK constraint document_id → knowledge_documents(id) CASCADE DELETE
  - making document_id NOT NULL (safe — no rows exist at migration time)
  - adding the proper GIN full-text-search index (idx_chunks_fts)

The M5 GIN index (ix_knowledge_chunks_content_gin) is dropped and replaced
with the canonical idx_chunks_fts name used by the ORM / service layer.

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-04-11 01:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: str | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── knowledge_documents ───────────────────────────────────────────────────
    op.create_table(
        "knowledge_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("workspace_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=512), nullable=False),
        sa.Column(
            "source_type",
            sa.Enum(
                "manual", "url",
                name="document_source_type",
                create_type=True,
            ),
            nullable=False,
            server_default=sa.text("'manual'"),
        ),
        sa.Column(
            "status",
            sa.Enum(
                "processing", "ready", "failed",
                name="document_status",
                create_type=True,
            ),
            nullable=False,
            server_default=sa.text("'processing'"),
        ),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("TIMEZONE('utc', NOW())"),
        ),
        sa.Column(
            "updated_at",
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
        "ix_knowledge_documents_workspace_id",
        "knowledge_documents",
        ["workspace_id"],
    )

    # ── Evolve knowledge_chunks (created in M5) ───────────────────────────────

    # 1. Add metadata column
    op.add_column(
        "knowledge_chunks",
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'"),
        ),
    )

    # 2. Add FK constraint: document_id → knowledge_documents(id) CASCADE DELETE
    op.create_foreign_key(
        "fk_knowledge_chunks_document_id",
        "knowledge_chunks",
        "knowledge_documents",
        ["document_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 3. Make document_id NOT NULL (safe — no rows exist at this point)
    op.alter_column("knowledge_chunks", "document_id", nullable=False)

    # 4. Drop the M5 GIN index (ix_knowledge_chunks_content_gin) and recreate
    #    with the canonical name used by this project.
    op.execute("DROP INDEX IF EXISTS ix_knowledge_chunks_content_gin")
    op.execute(
        "CREATE INDEX idx_chunks_fts "
        "ON knowledge_chunks USING GIN (to_tsvector('english', content))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_chunks_fts")
    # Restore the M5 GIN index
    op.execute(
        "CREATE INDEX ix_knowledge_chunks_content_gin "
        "ON knowledge_chunks USING GIN (to_tsvector('english', content))"
    )

    op.alter_column("knowledge_chunks", "document_id", nullable=True)
    op.drop_constraint(
        "fk_knowledge_chunks_document_id",
        "knowledge_chunks",
        type_="foreignkey",
    )
    op.drop_column("knowledge_chunks", "metadata")

    op.drop_index("ix_knowledge_documents_workspace_id", table_name="knowledge_documents")
    op.drop_table("knowledge_documents")
    op.execute("DROP TYPE IF EXISTS document_source_type")
    op.execute("DROP TYPE IF EXISTS document_status")
