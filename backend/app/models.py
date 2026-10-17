from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Repository(Base):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(250), unique=True, index=True)
    owner: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(100))
    details_json: Mapped[str] = mapped_column(Text)
    cached_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class APIResponseCache(Base):
    __tablename__ = "api_response_cache"
    __table_args__ = (UniqueConstraint("repository_id", "resource_key"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    resource_key: Mapped[str] = mapped_column(String(200))
    payload_json: Mapped[str] = mapped_column(Text)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class Commit(Base):
    __tablename__ = "commits"
    __table_args__ = (UniqueConstraint("repository_id", "sha"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    sha: Mapped[str] = mapped_column(String(40))
    author: Mapped[str] = mapped_column(String(250), default="Unknown")
    message: Mapped[str] = mapped_column(Text)
    committed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    url: Mapped[str] = mapped_column(String(500))


class Contributor(Base):
    __tablename__ = "contributors"
    __table_args__ = (UniqueConstraint("repository_id", "username"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    username: Mapped[str] = mapped_column(String(100))
    avatar_url: Mapped[str] = mapped_column(String(500))
    profile_url: Mapped[str] = mapped_column(String(500))
    contributions: Mapped[int] = mapped_column(Integer)


class Language(Base):
    __tablename__ = "languages"
    __table_args__ = (UniqueConstraint("repository_id", "name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    bytes: Mapped[int] = mapped_column(Integer)


class FileChange(Base):
    __tablename__ = "file_changes"
    __table_args__ = (UniqueConstraint("repository_id", "path"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    repository_id: Mapped[int] = mapped_column(ForeignKey("repositories.id", ondelete="CASCADE"))
    path: Mapped[str] = mapped_column(String(1000))
    changes: Mapped[int] = mapped_column(Integer)


class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(250), index=True)
    searched_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)
