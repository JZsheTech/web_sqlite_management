function formatValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "string" && value.length > 120) {
    return `${value.slice(0, 117)}...`;
  }
  return String(value);
}

export default function ResultTable({ result, isLoading }) {
  if (isLoading) {
    return (
      <div className="panel">
        <div className="skeleton" />
        <p className="muted">Executing query...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="panel placeholder">
        <p>Run a query to see results here.</p>
      </div>
    );
  }

  if (!result.columns.length) {
    return (
      <div className="panel">
        <h2>Query executed</h2>
        <p>{result.rowsAffected ?? 0} rows affected.</p>
      </div>
    );
  }

  return (
    <div className="panel table-panel">
      <div className="panel-header">
        <h2>Results</h2>
        <span className="muted">{result.rowCount} rows</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {result.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={index}>
                {result.columns.map((column) => (
                  <td key={`${column}-${index}`}>{formatValue(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
