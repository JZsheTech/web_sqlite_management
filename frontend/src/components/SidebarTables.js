export default function SidebarTables({
  tables,
  loading,
  error,
  onRefresh,
  onSelectTable,
  selectedTable,
  schema,
  schemaLoading,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <h1>SQLite</h1>
          <p className="muted">Lightweight DB manager</p>
        </div>
        <button className="ghost" onClick={onRefresh} disabled={loading}>
          {loading ? "..." : "↻"}
        </button>
      </div>

      <div className="sidebar-section">
        <h3>Tables</h3>
        {error && <p className="error-text">{error}</p>}
        {loading && <p className="muted">Loading tables...</p>}
        {!loading && !tables.length && <p className="muted">No tables found.</p>}
        <ul className="sidebar-list">
          {tables.map((table) => (
            <li key={table.name}>
              <button
                className={`sidebar-item ${selectedTable === table.name ? "active" : ""}`}
                onClick={() => onSelectTable(table.name)}
              >
                <span>{table.name}</span>
                <span className="muted">{table.rows}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section schema">
        <h3>Schema</h3>
        {schemaLoading && <p className="muted">Loading schema...</p>}
        {!schemaLoading && !schema && <p className="muted">Select a table to inspect.</p>}
        {!schemaLoading && schema && (
          <div className="schema-details">
            <h4>{schema.table}</h4>
            <ul>
              {schema.columns.map((column) => {
                const meta = [];
                if (column.primary_key) meta.push("PK");
                if (column.notnull) meta.push("NOT NULL");
                return (
                  <li key={column.cid}>
                    <div>
                      <strong>{column.name}</strong>
                      <span className="muted">{column.type || "TEXT"}</span>
                    </div>
                    <div className="muted">{meta.join(" · ")}</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
