import { useEffect, useState } from "react";
import QueryEditor from "./components/QueryEditor";
import ResultTable from "./components/ResultTable";
import SidebarTables from "./components/SidebarTables";
import TableManager from "./components/TableManager";
import SqlModificationPanel from "./components/SqlModificationPanel";
import { API_BASE_URL, executeModification, executeQuery, fetchTableSchema, fetchTables } from "./api";
import "./App.css";

const defaultQuery = "SELECT name FROM sqlite_master WHERE type='table';";
const defaultModificationSql = `-- Run SQL statements that modify schema or data
CREATE TABLE IF NOT EXISTS demo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);`;

export default function App() {
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [schema, setSchema] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [result, setResult] = useState(null);
  const [queryError, setQueryError] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [modificationSql, setModificationSql] = useState(defaultModificationSql);
  const [modificationResult, setModificationResult] = useState(null);
  const [modificationError, setModificationError] = useState("");
  const [isModifying, setIsModifying] = useState(false);
  const [activeTab, setActiveTab] = useState("query");

  useEffect(() => {
    loadTables();
  }, []);

  async function loadTables() {
    try {
      setTablesLoading(true);
      setTablesError("");
      const data = await fetchTables();
      setTables(data);
    } catch (error) {
      setTablesError(error.message);
    } finally {
      setTablesLoading(false);
    }
  }

  async function handleSelectTable(tableName) {
    setSelectedTable(tableName);
    setSchemaLoading(true);
    setSchema(null);
    setQueryError("");
    try {
      const data = await fetchTableSchema(tableName);
      setSchema(data);
      setQuery(`SELECT * FROM ${tableName} LIMIT 50;`);
    } catch (error) {
      setQueryError(error.message);
    } finally {
      setSchemaLoading(false);
    }
  }

  async function handleExecuteQuery() {
    setIsExecuting(true);
    setQueryError("");
    try {
      const data = await executeQuery(query);
      setResult(data);
    } catch (error) {
      setResult(null);
      setQueryError(error.message);
    } finally {
      setIsExecuting(false);
    }
  }

  async function handleExecuteModification() {
    setIsModifying(true);
    setModificationError("");
    setModificationResult(null);
    try {
      const data = await executeModification(modificationSql);
      setModificationResult(data);
      await loadTables();
    } catch (error) {
      setModificationError(error.message);
    } finally {
      setIsModifying(false);
    }
  }

  const isBusy = isExecuting || isModifying;
  const statusMessage = isModifying ? "Applying SQL script..." : isExecuting ? "Running query..." : "Idle";

  return (
    <div className="app-shell">
      <SidebarTables
        tables={tables}
        loading={tablesLoading}
        error={tablesError}
        onRefresh={loadTables}
        onSelectTable={handleSelectTable}
        selectedTable={selectedTable}
        schema={schema}
        schemaLoading={schemaLoading}
      />

      <main className="main-view">
        <header className="main-header">
          <div>
            <h1>Web SQLite Manager</h1>
            <p className="muted">
              Backend: <code>{API_BASE_URL}</code>
            </p>
          </div>
          <div className={`status-chip ${isBusy ? "busy" : "idle"}`}>
            {statusMessage}
          </div>
        </header>

        <div className="tab-header">
          <button
            className={`tab-button ${activeTab === "query" ? "active" : ""}`}
            onClick={() => setActiveTab("query")}
          >
            Query data
          </button>
          <button
            className={`tab-button ${activeTab === "manage" ? "active" : ""}`}
            onClick={() => setActiveTab("manage")}
          >
            Table management
          </button>
          <button
            className={`tab-button ${activeTab === "modify" ? "active" : ""}`}
            onClick={() => setActiveTab("modify")}
          >
            Table modification by SQL
          </button>
        </div>

        {activeTab === "query" ? (
          <>
            <QueryEditor
              value={query}
              onChange={setQuery}
              onExecute={handleExecuteQuery}
              isExecuting={isExecuting}
              onUseTemplate={setQuery}
            />

            {queryError && <div className="error-banner">{queryError}</div>}

            <ResultTable result={result} isLoading={isExecuting} />
          </>
        ) : activeTab === "manage" ? (
          <TableManager tables={tables} onRefreshTables={loadTables} />
        ) : (
          <SqlModificationPanel
            value={modificationSql}
            onChange={setModificationSql}
            onExecute={handleExecuteModification}
            isExecuting={isModifying}
            error={modificationError}
            result={modificationResult}
          />
        )}
      </main>
    </div>
  );
}
