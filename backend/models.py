from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


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


class ColumnDefinition(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    type: str
    primary_key: bool = Field(False, alias="primaryKey")
    not_null: bool = Field(False, alias="notNull")
    default_value: Optional[str] = Field(None, alias="defaultValue")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Column name must not be empty.")
        return value

    @field_validator("type")
    @classmethod
    def validate_type(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Column type must not be empty.")
        return value


class CreateTableRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    table_name: str = Field(..., alias="tableName")
    columns: List[ColumnDefinition]

    @field_validator("table_name")
    @classmethod
    def validate_table_name(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Table name is required.")
        return value

    @field_validator("columns")
    @classmethod
    def validate_columns(cls, value: List[ColumnDefinition]) -> List[ColumnDefinition]:
        if not value:
            raise ValueError("At least one column must be defined.")
        return value


class InsertRowRequest(BaseModel):
    values: Dict[str, Any]

    @field_validator("values")
    @classmethod
    def validate_values(cls, value: Dict[str, Any]) -> Dict[str, Any]:
        if not value:
            raise ValueError("Values payload must include at least one column.")
        return value


class DeleteRowsRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    delete_all: bool = Field(False, alias="deleteAll")
    conditions: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def check_conditions(self):
        if not self.delete_all and not (self.conditions or {}):
            raise ValueError("Specify at least one condition or enable deleteAll.")
        return self


class DropTableRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    confirm: bool = False

    @field_validator("confirm")
    @classmethod
    def ensure_confirmation(cls, value: bool) -> bool:
        if not value:
            raise ValueError("Confirmation flag must be true to drop a table.")
        return value
