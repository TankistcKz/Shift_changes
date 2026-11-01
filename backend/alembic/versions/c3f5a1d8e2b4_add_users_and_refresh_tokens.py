"""add users and refresh tokens

Revision ID: c3f5a1d8e2b4
Revises: 7ce7833602b5
Create Date: 2026-11-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3f5a1d8e2b4'
down_revision: Union[str, Sequence[str], None] = '7ce7833602b5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('person_id', sa.Integer(), nullable=False),
        sa.Column('login', sa.String(length=50), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column(
            'is_active',
            sa.Boolean(),
            server_default=sa.text('true'),
            nullable=False,
        ),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ['person_id'],
            ['persons.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_login'), 'users', ['login'], unique=True)
    op.create_index(
        op.f('ix_users_person_id'), 'users', ['person_id'], unique=True
    )
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'expires_at',
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            'revoked_at',
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ['user_id'],
            ['users.id'],
            ondelete='CASCADE',
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_refresh_tokens_user_id'),
        'refresh_tokens',
        ['user_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_refresh_tokens_token_hash'),
        'refresh_tokens',
        ['token_hash'],
        unique=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f('ix_refresh_tokens_token_hash'),
        table_name='refresh_tokens',
    )
    op.drop_index(
        op.f('ix_refresh_tokens_user_id'),
        table_name='refresh_tokens',
    )
    op.drop_table('refresh_tokens')
    op.drop_index(op.f('ix_users_person_id'), table_name='users')
    op.drop_index(op.f('ix_users_login'), table_name='users')
    op.drop_table('users')
