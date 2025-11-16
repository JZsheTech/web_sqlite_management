const templates = [
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );`,
  "INSERT INTO projects (name) VALUES ('Sample project');",
  "DROP TABLE obsolete_table;",
];

export default function SqlModificationPanel({
  value,
  onChange,
  onExecute,
  isExecuting,
  result,
  error,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Table modification by SQL</h2>
        <div className="panel-actions">
          <select
            onChange={(event) => {
              if (event.target.value) {
                onChange(event.target.value);
                event.target.value = "";
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Sample scripts
            </option>
            {templates.map((template) => {
              const trimmed = template.replace(/\s+/g, " ").trim();
              const label = trimmed.length > 32 ? `${trimmed.slice(0, 32)}...` : trimmed;
              return (
                <option key={template} value={template}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <p className="muted small-text">
        Use raw SQL to create tables, update schema, or run INSERT/UPDATE/DELETE statements. Results are applied immediately.
      </p>
      <textarea
        value={value}
        placeholder="e.g. ALTER TABLE users ADD COLUMN bio TEXT;"
        onChange={(event) => onChange(event.target.value)}
        disabled={isExecuting}
        spellCheck={false}
      />
      <div className="query-actions">
        <button className="primary danger" onClick={onExecute} disabled={isExecuting}>
          {isExecuting ? "Applying..." : "Apply SQL"}
        </button>
        <button type="button" onClick={() => onChange("")} disabled={isExecuting}>
          Clear
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {result && (
        <div className="success-banner">
          <strong>{result.message || "SQL script executed successfully."}</strong>
          {"statementsExecuted" in result && (
            <p>Statements executed: {result.statementsExecuted}</p>
          )}
          {"rowsAffected" in result && (
            <p>Rows affected: {result.rowsAffected}</p>
          )}
        </div>
      )}
    </div>
  );
}
