from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from db import SQLiteDatabase
from models import (
    CreateTableRequest,
    DeleteRowsRequest,
    DropTableRequest,
    InsertRowRequest,
    QueryRequest,
)


app = FastAPI(
    title="SQLite Web Manager API",
    version="0.1.0",
    description="Simple backend to query and introspect a SQLite database file.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database = SQLiteDatabase()


def make_response(data=None, *, success: bool = True, error: str | None = None, status_code: int = status.HTTP_200_OK):
    """Utility to ensure consistent API responses."""
    payload = {"success": success, "data": data, "error": error}
    return JSONResponse(content=payload, status_code=status_code)


@app.get("/health")
async def health_check():
    return make_response({"status": "ok"})


@app.get("/tables")
async def list_tables():
    try:
        tables = database.list_tables()
        return make_response({"tables": tables})
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.get("/tables/{table}/schema")
async def table_schema(table: str):
    try:
        schema = database.get_table_schema(table)
        return make_response(schema)
    except ValueError as exc:
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.post("/query")
async def run_query(query: QueryRequest):
    try:
        result = database.execute_query(query.sql)
        return make_response(result)
    except ValueError as exc:
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.post("/sql/modify")
async def run_sql_script(query: QueryRequest):
    try:
        result = database.execute_script(query.sql)
        return make_response(result)
    except ValueError as exc:
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.post("/tables", status_code=status.HTTP_201_CREATED)
async def create_table(request: CreateTableRequest):
    try:
        payload = [column.model_dump(mode="python") for column in request.columns]
        result = database.create_table(request.table_name, payload)
        return make_response(result, status_code=status.HTTP_201_CREATED)
    except ValueError as exc:
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.post("/tables/{table}/rows")
async def insert_row(table: str, request: InsertRowRequest):
    try:
        rows = database.insert_row(table, request.values)
        return make_response({"rowsAffected": rows})
    except ValueError as exc:
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.delete("/tables/{table}/rows")
async def delete_rows(table: str, request: DeleteRowsRequest):
    try:
        rows = database.delete_rows(table, request.conditions or {}, request.delete_all)
        return make_response({"rowsAffected": rows})
    except ValueError as exc:
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


@app.delete("/tables/{table}")
async def drop_table(table: str, request: DropTableRequest):
    try:
        database.drop_table(table)
        return make_response({"message": f"Table '{table}' dropped."})
    except ValueError as exc:
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:  # pragma: no cover - runtime guard
        return make_response(None, success=False, error=str(exc), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
