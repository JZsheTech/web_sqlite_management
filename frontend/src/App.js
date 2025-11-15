import { useEffect, useState } from "react";
import QueryEditor from "./components/QueryEditor";
import ResultTable from "./components/ResultTable";
import SidebarTables from "./components/SidebarTables";
import { API_BASE_URL, executeQuery, fetchTableSchema, fetchTables } from "./api";
import "./App.css";

const defaultQuery = "SELECT name FROM sqlite_master WHERE type='table';";

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
          <div className={`status-chip ${isExecuting ? "busy" : "idle"}`}>
            {isExecuting ? "Running query..." : "Idle"}
          </div>
        </header>

        <QueryEditor
          value={query}
          onChange={setQuery}
          onExecute={handleExecuteQuery}
          isExecuting={isExecuting}
          onUseTemplate={setQuery}
        />

        {queryError && <div className="error-banner">{queryError}</div>}

        <ResultTable result={result} isLoading={isExecuting} />
      </main>
    </div>
  );
}
