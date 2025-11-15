from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


class QueryRequest(BaseModel):
    sql: str = Field(..., description="SQL statement to execute")

    @field_validator("sql")
    @classmethod
    def statement_not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("SQL statement must not be empty.")
        return value


class APIResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[str] = None
