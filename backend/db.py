import os
import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, Generator, List, Optional


def resolve_db_path() -> str:
    """Resolve the SQLite path, defaulting to ../data/app.db."""
    env_path = os.getenv("DATABASE_PATH")
    if env_path:
        return os.path.abspath(env_path)
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return os.path.join(root_dir, "data", "app.db")


class SQLiteDatabase:
    """Lightweight helper for interacting with a SQLite database file."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = os.path.abspath(db_path or resolve_db_path())

    @contextmanager
    def connect(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def list_tables(self) -> List[Dict[str, Any]]:
        """Return table metadata excluding SQLite internal tables."""
        query = """
            SELECT name
            FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        """
        tables: List[Dict[str, Any]] = []
        with self.connect() as conn:
            cursor = conn.execute(query)
            names = [row["name"] for row in cursor.fetchall()]
            for table in names:
                count = conn.execute(f'SELECT COUNT(1) AS total FROM "{table}"').fetchone()["total"]
                tables.append({"name": table, "rows": count})
        return tables

    def get_table_schema(self, table: str) -> Dict[str, Any]:
        """Return PRAGMA table info for the requested table."""
        sanitized = table.strip()
        if not sanitized or not sanitized.replace("_", "").isalnum():
            raise ValueError("Invalid table name provided.")
        with self.connect() as conn:
            cursor = conn.execute(f"PRAGMA table_info('{sanitized}')")
            columns = [
                {
                    "cid": row["cid"],
                    "name": row["name"],
                    "type": row["type"],
                    "notnull": bool(row["notnull"]),
                    "default": row["dflt_value"],
                    "primary_key": bool(row["pk"]),
                }
                for row in cursor.fetchall()
            ]
            if not columns:
                raise ValueError(f"Table '{table}' was not found.")
            sample_rows = conn.execute(f"SELECT * FROM {sanitized} LIMIT 5").fetchall()
        return {
            "table": sanitized,
            "columns": columns,
            "sample_rows": [dict(row) for row in sample_rows],
        }

    def execute_query(self, sql: str) -> Dict[str, Any]:
        """Execute a SQL query and format the result."""
        cleaned = (sql or "").strip()
        if not cleaned:
            raise ValueError("Query cannot be empty.")
        if cleaned.endswith(";"):
            cleaned = cleaned.rstrip(";").strip()

        with self.connect() as conn:
            cursor = conn.execute(cleaned)
            if cursor.description:
                rows = [dict(row) for row in cursor.fetchall()]
                columns = [desc[0] for desc in cursor.description]
                return {
                    "columns": columns,
                    "rows": rows,
                    "rowCount": len(rows),
                }
            conn.commit()
            return {
                "columns": [],
                "rows": [],
                "rowCount": 0,
                "rowsAffected": cursor.rowcount,
            }
