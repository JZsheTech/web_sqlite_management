import { useMemo, useState } from "react";
import { createTable, deleteRows, dropTable, insertRow } from "../api";

const createEmptyColumn = () => ({
  name: "",
  type: "TEXT",
  primaryKey: false,
  notNull: false,
  defaultValue: "",
});

const createEmptyKV = () => ({
  column: "",
  value: "",
});

function coerceValue(raw) {
  if (raw === "") {
    return "";
  }
  const trimmed = raw.trim();
  if (trimmed === "") {
    return "";
  }
  const lower = trimmed.toLowerCase();
  if (lower === "null") {
    return null;
  }
  if (lower === "true") {
    return true;
  }
  if (lower === "false") {
    return false;
  }
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && trimmed !== "") {
    return asNumber;
  }
  return raw;
}

export default function TableManager({ tables = [], onRefreshTables }) {
  const [createForm, setCreateForm] = useState({
    tableName: "",
    columns: [createEmptyColumn(), createEmptyColumn()],
  });
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const [insertForm, setInsertForm] = useState({
    tableName: "",
    fields: [createEmptyKV()],
  });
  const [insertBusy, setInsertBusy] = useState(false);
  const [insertMessage, setInsertMessage] = useState("");
  const [insertError, setInsertError] = useState("");

  const [deleteForm, setDeleteForm] = useState({
    tableName: "",
    deleteAll: false,
    conditions: [createEmptyKV()],
  });
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [dropForm, setDropForm] = useState({
    tableName: "",
    confirmText: "",
  });
  const [dropBusy, setDropBusy] = useState(false);
  const [dropMessage, setDropMessage] = useState("");
  const [dropError, setDropError] = useState("");

  const tableSuggestionsId = useMemo(() => "table-suggestions", []);

  function handleColumnChange(index, field, value) {
    setCreateForm((current) => {
      const columns = current.columns.slice();
      columns[index] = { ...columns[index], [field]: value };
      return { ...current, columns };
    });
  }

  function handleInsertFieldChange(index, field, value) {
    setInsertForm((current) => {
      const fields = current.fields.slice();
      fields[index] = { ...fields[index], [field]: value };
      return { ...current, fields };
    });
  }

  function handleConditionChange(index, field, value) {
    setDeleteForm((current) => {
      const conditions = current.conditions.slice();
      conditions[index] = { ...conditions[index], [field]: value };
      return { ...current, conditions };
    });
  }

  function addColumn() {
    setCreateForm((current) => ({ ...current, columns: [...current.columns, createEmptyColumn()] }));
  }

  function removeColumn(index) {
    setCreateForm((current) => {
      if (current.columns.length === 1) {
        return current;
      }
      const columns = current.columns.slice();
      columns.splice(index, 1);
      return { ...current, columns };
    });
  }

  function addInsertField() {
    setInsertForm((current) => ({ ...current, fields: [...current.fields, createEmptyKV()] }));
  }

  function removeInsertField(index) {
    setInsertForm((current) => {
      if (current.fields.length === 1) {
        return current;
      }
      const fields = current.fields.slice();
      fields.splice(index, 1);
      return { ...current, fields };
    });
  }

  function addConditionField() {
    setDeleteForm((current) => ({ ...current, conditions: [...current.conditions, createEmptyKV()] }));
  }

  function removeConditionField(index) {
    setDeleteForm((current) => {
      if (current.conditions.length === 1) {
        return current;
      }
      const conditions = current.conditions.slice();
      conditions.splice(index, 1);
      return { ...current, conditions };
    });
  }

  async function submitCreateTable(event) {
    event.preventDefault();
    setCreateError("");
    setCreateMessage("");
    const tableName = createForm.tableName.trim();
    if (!tableName) {
      setCreateError("Please provide a table name.");
      return;
    }
    const preparedColumns = createForm.columns
      .map((column) => ({
        ...column,
        name: column.name.trim(),
        type: column.type.trim().toUpperCase(),
        defaultValue: column.defaultValue,
      }))
      .filter((column) => column.name && column.type);
    if (!preparedColumns.length) {
      setCreateError("Define at least one column name and type.");
      return;
    }

    try {
      setCreateBusy(true);
      await createTable({
        tableName,
        columns: preparedColumns,
      });
      setCreateMessage(`Table "${tableName}" is ready.`);
      setCreateForm({
        tableName: "",
        columns: [createEmptyColumn(), createEmptyColumn()],
      });
      onRefreshTables?.();
    } catch (error) {
      setCreateError(error.message);
    } finally {
      setCreateBusy(false);
    }
  }

  async function submitInsertRow(event) {
    event.preventDefault();
    setInsertError("");
    setInsertMessage("");
    const tableName = insertForm.tableName.trim();
    if (!tableName) {
      setInsertError("Select a table to insert into.");
      return;
    }
    const pairs = insertForm.fields.filter((field) => field.column.trim());
    if (!pairs.length) {
      setInsertError("Add at least one column/value pair.");
      return;
    }
    const values = {};
    pairs.forEach((field) => {
      values[field.column.trim()] = coerceValue(field.value);
    });

    try {
      setInsertBusy(true);
      await insertRow(tableName, values);
      setInsertMessage("Row inserted successfully.");
      setInsertForm({
        tableName,
        fields: [createEmptyKV()],
      });
      onRefreshTables?.();
    } catch (error) {
      setInsertError(error.message);
    } finally {
      setInsertBusy(false);
    }
  }

  async function submitDeleteRows(event) {
    event.preventDefault();
    setDeleteError("");
    setDeleteMessage("");
    const tableName = deleteForm.tableName.trim();
    if (!tableName) {
      setDeleteError("Select a table to delete from.");
      return;
    }
    const conditions = {};
    if (!deleteForm.deleteAll) {
      deleteForm.conditions.forEach((condition) => {
        const column = condition.column.trim();
        if (column) {
          conditions[column] = coerceValue(condition.value);
        }
      });
      if (Object.keys(conditions).length === 0) {
        setDeleteError("Provide at least one condition or enable delete all.");
        return;
      }
    }

    try {
      setDeleteBusy(true);
      await deleteRows(tableName, {
        deleteAll: deleteForm.deleteAll,
        conditions: deleteForm.deleteAll ? undefined : conditions,
      });
      setDeleteMessage(deleteForm.deleteAll ? "All rows deleted." : "Matching rows deleted.");
      setDeleteForm({
        tableName,
        deleteAll: deleteForm.deleteAll,
        conditions: [createEmptyKV()],
      });
      onRefreshTables?.();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  async function submitDropTable(event) {
    event.preventDefault();
    setDropError("");
    setDropMessage("");
    const tableName = dropForm.tableName.trim();
    if (!tableName) {
      setDropError("Specify the table to drop.");
      return;
    }
    if (dropForm.confirmText.trim() !== tableName) {
      setDropError("Type the table name to confirm the drop.");
      return;
    }

    try {
      setDropBusy(true);
      await dropTable(tableName);
      setDropMessage(`Dropped table "${tableName}".`);
      setDropForm({
        tableName: "",
        confirmText: "",
      });
      onRefreshTables?.();
    } catch (error) {
      setDropError(error.message);
    } finally {
      setDropBusy(false);
    }
  }

  return (
    <div className="panel manager-panel">
      <div className="panel-header">
        <h2>Table operations</h2>
        <p className="muted">Define schema, seed rows, or clean up tables.</p>
      </div>

      <div className="manager-grid">
        <section>
          <h3>Create a table</h3>
          <p className="muted small-text">Provide the table name and the columns you need. Defaults and constraints are optional.</p>
          {createError && <p className="error-text">{createError}</p>}
          {createMessage && <p className="success-text">{createMessage}</p>}
          <form onSubmit={submitCreateTable} className="form-stack">
            <label className="field-group">
              <span>Table name</span>
              <input
                type="text"
                value={createForm.tableName}
                onChange={(event) => setCreateForm({ ...createForm, tableName: event.target.value })}
                placeholder="e.g. users"
                required
              />
            </label>
            <div className="columns-list">
              {createForm.columns.map((column, index) => (
                <div className="column-card" key={`column-${index}`}>
                  <div className="column-card-header">
                    <span>Column {index + 1}</span>
                    {createForm.columns.length > 1 && (
                      <button type="button" className="ghost small" onClick={() => removeColumn(index)}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="column-grid">
                    <input
                      type="text"
                      value={column.name}
                      placeholder="Column name"
                      onChange={(event) => handleColumnChange(index, "name", event.target.value)}
                    />
                    <input
                      type="text"
                      value={column.type}
                      placeholder="Type (e.g. TEXT, INTEGER)"
                      onChange={(event) => handleColumnChange(index, "type", event.target.value)}
                    />
                  </div>
                  <div className="flags-grid">
                    <label>
                      <input
                        type="checkbox"
                        checked={column.primaryKey}
                        onChange={(event) => handleColumnChange(index, "primaryKey", event.target.checked)}
                      />
                      Primary key
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={column.notNull}
                        onChange={(event) => handleColumnChange(index, "notNull", event.target.checked)}
                      />
                      Not null
                    </label>
                  </div>
                  <label className="field-group">
                    <span>Default value (SQL literal)</span>
                    <input
                      type="text"
                      value={column.defaultValue}
                      placeholder="Optional e.g. CURRENT_TIMESTAMP or 'guest'"
                      onChange={(event) => handleColumnChange(index, "defaultValue", event.target.value)}
                    />
                  </label>
                </div>
              ))}
            </div>
            <button type="button" className="ghost" onClick={addColumn}>
              + Add column
            </button>
            <button type="submit" className="primary" disabled={createBusy}>
              {createBusy ? "Creating..." : "Create table"}
            </button>
          </form>
        </section>

        <section>
          <h3>Insert a row</h3>
          <p className="muted small-text">Pick a table and describe the values that should be inserted.</p>
          {insertError && <p className="error-text">{insertError}</p>}
          {insertMessage && <p className="success-text">{insertMessage}</p>}
          <form onSubmit={submitInsertRow} className="form-stack">
            <label className="field-group">
              <span>Table</span>
              <input
                type="text"
                list={tableSuggestionsId}
                value={insertForm.tableName}
                onChange={(event) => setInsertForm({ ...insertForm, tableName: event.target.value })}
                placeholder="Target table"
              />
            </label>
            {insertForm.fields.map((field, index) => (
              <div className="kv-grid" key={`insert-field-${index}`}>
                <input
                  type="text"
                  value={field.column}
                  placeholder="Column"
                  onChange={(event) => handleInsertFieldChange(index, "column", event.target.value)}
                />
                <input
                  type="text"
                  value={field.value}
                  placeholder="Value"
                  onChange={(event) => handleInsertFieldChange(index, "value", event.target.value)}
                />
                {insertForm.fields.length > 1 && (
                  <button type="button" className="ghost small" onClick={() => removeInsertField(index)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="ghost" onClick={addInsertField}>
              + Add value
            </button>
            <button type="submit" className="primary" disabled={insertBusy}>
              {insertBusy ? "Inserting..." : "Insert row"}
            </button>
          </form>
        </section>

        <section>
          <h3>Delete rows</h3>
          <p className="muted small-text">Remove specific records or purge a table entirely.</p>
          {deleteError && <p className="error-text">{deleteError}</p>}
          {deleteMessage && <p className="success-text">{deleteMessage}</p>}
          <form onSubmit={submitDeleteRows} className="form-stack">
            <label className="field-group">
              <span>Table</span>
              <input
                type="text"
                list={tableSuggestionsId}
                value={deleteForm.tableName}
                onChange={(event) => setDeleteForm({ ...deleteForm, tableName: event.target.value })}
                placeholder="Target table"
              />
            </label>
            <label className="field-inline">
              <input
                type="checkbox"
                checked={deleteForm.deleteAll}
                onChange={(event) => setDeleteForm({ ...deleteForm, deleteAll: event.target.checked })}
              />
              Delete all rows in this table
            </label>
            {!deleteForm.deleteAll &&
              deleteForm.conditions.map((condition, index) => (
                <div className="kv-grid" key={`condition-${index}`}>
                  <input
                    type="text"
                    value={condition.column}
                    placeholder="Column"
                    onChange={(event) => handleConditionChange(index, "column", event.target.value)}
                  />
                  <input
                    type="text"
                    value={condition.value}
                    placeholder="Value"
                    onChange={(event) => handleConditionChange(index, "value", event.target.value)}
                  />
                  {deleteForm.conditions.length > 1 && (
                    <button type="button" className="ghost small" onClick={() => removeConditionField(index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            {!deleteForm.deleteAll && (
              <button type="button" className="ghost" onClick={addConditionField}>
                + Add condition
              </button>
            )}
            <button type="submit" className="primary danger" disabled={deleteBusy}>
              {deleteBusy ? "Deleting..." : "Delete rows"}
            </button>
          </form>
        </section>

        <section>
          <h3>Drop table</h3>
          <p className="muted small-text">
            This permanently removes the table definition and data. Type the table name below to confirm.
          </p>
          {dropError && <p className="error-text">{dropError}</p>}
          {dropMessage && <p className="success-text">{dropMessage}</p>}
          <form onSubmit={submitDropTable} className="form-stack">
            <label className="field-group">
              <span>Table to drop</span>
              <input
                type="text"
                list={tableSuggestionsId}
                value={dropForm.tableName}
                onChange={(event) => setDropForm({ ...dropForm, tableName: event.target.value })}
                placeholder="Table name"
              />
            </label>
            <label className="field-group">
              <span>Type the table name to confirm</span>
              <input
                type="text"
                value={dropForm.confirmText}
                onChange={(event) => setDropForm({ ...dropForm, confirmText: event.target.value })}
                placeholder="Confirmation"
              />
            </label>
            <button type="submit" className="primary danger" disabled={dropBusy}>
              {dropBusy ? "Dropping..." : "Drop table"}
            </button>
          </form>
        </section>
      </div>

      <datalist id={tableSuggestionsId}>
        {tables.map((table) => (
          <option key={table.name} value={table.name} />
        ))}
      </datalist>
    </div>
  );
}
