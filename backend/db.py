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

    @staticmethod
    def _sanitize_identifier(value: str) -> str:
        cleaned = (value or "").strip()
        if not cleaned:
            raise ValueError("Identifier cannot be empty.")
        plain = cleaned.replace("_", "")
        if not plain.isalnum():
            raise ValueError("Identifier may only include letters, numbers, and underscores.")
        return cleaned

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
        sanitized = self._sanitize_identifier(table)
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
            sample_rows = conn.execute(f'SELECT * FROM "{sanitized}" LIMIT 5').fetchall()
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

    def create_table(self, table_name: str, columns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create a table with the supplied column definitions."""
        sanitized_name = self._sanitize_identifier(table_name)
        if not columns:
            raise ValueError("At least one column definition is required.")

        column_clauses = []
        for column in columns:
            name = self._sanitize_identifier(column.get("name", ""))
            col_type = (column.get("type") or "").strip()
            if not col_type:
                raise ValueError(f"Column '{name}' must include a type.")
            parts = [f'"{name}" {col_type}']
            if column.get("primary_key"):
                parts.append("PRIMARY KEY")
            if column.get("not_null"):
                parts.append("NOT NULL")
            default_value = column.get("default_value")
            if default_value not in (None, ""):
                parts.append(f"DEFAULT {default_value}")
            column_clauses.append(" ".join(parts))

        statement = f'CREATE TABLE IF NOT EXISTS "{sanitized_name}" ({", ".join(column_clauses)})'
        with self.connect() as conn:
            conn.execute(statement)
            conn.commit()
        return {"table": sanitized_name, "sql": statement}

    def insert_row(self, table: str, values: Dict[str, Any]) -> int:
        """Insert a single row into a table."""
        sanitized_table = self._sanitize_identifier(table)
        if not values:
            raise ValueError("Values cannot be empty.")
        columns = []
        params: List[Any] = []
        for column, value in values.items():
            columns.append(f'"{self._sanitize_identifier(column)}"')
            params.append(value)
        placeholders = ", ".join(["?"] * len(columns))
        sql = f'INSERT INTO "{sanitized_table}" ({", ".join(columns)}) VALUES ({placeholders})'
        with self.connect() as conn:
            cursor = conn.execute(sql, params)
            conn.commit()
            return cursor.rowcount

    def delete_rows(self, table: str, conditions: Optional[Dict[str, Any]] = None, delete_all: bool = False) -> int:
        """Delete rows matching the supplied conditions. If delete_all is True all rows will be removed."""
        sanitized_table = self._sanitize_identifier(table)
        clauses: List[str] = []
        params: List[Any] = []
        if conditions:
            for column, value in conditions.items():
                clauses.append(f'"{self._sanitize_identifier(column)}" = ?')
                params.append(value)
        elif not delete_all:
            raise ValueError("Specify conditions or enable delete_all to remove all rows.")

        sql = f'DELETE FROM "{sanitized_table}"'
        if clauses:
            sql += f' WHERE {" AND ".join(clauses)}'

        with self.connect() as conn:
            cursor = conn.execute(sql, params)
            conn.commit()
            return cursor.rowcount

    def drop_table(self, table: str) -> None:
        """Drop a table if it exists."""
        sanitized_table = self._sanitize_identifier(table)
        with self.connect() as conn:
            conn.execute(f'DROP TABLE IF EXISTS "{sanitized_table}"')
            conn.commit()
