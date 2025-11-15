const templates = [
  "SELECT name FROM sqlite_master WHERE type='table';",
  "SELECT * FROM users LIMIT 10;",
  "INSERT INTO users (name, email) VALUES ('New User', 'new@example.com');"
];

export default function QueryEditor({
  value,
  onChange,
  onExecute,
  isExecuting,
  onUseTemplate,
  disabled,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>SQL Editor</h2>
        <div className="panel-actions">
          <select
            onChange={(event) => {
              if (event.target.value) {
                onUseTemplate(event.target.value);
                event.target.value = "";
              }
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Sample queries
            </option>
            {templates.map((template) => {
              const label = template.length > 32 ? `${template.slice(0, 32)}...` : template;
              return (
                <option key={template} value={template}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      <textarea
        value={value}
        placeholder="Type your SQL here"
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
      />
      <div className="query-actions">
        <button className="primary" onClick={onExecute} disabled={isExecuting || disabled}>
          {isExecuting ? "Running..." : "Run query"}
        </button>
        <button type="button" onClick={() => onChange(templates[0])} disabled={isExecuting || disabled}>
          Reset
        </button>
      </div>
    </div>
  );
}
