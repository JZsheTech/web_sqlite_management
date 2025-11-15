const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8100";

async function send(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("Unable to parse server response");
  }

  if (!payload.success) {
    const message = payload.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload.data;
}

export async function fetchTables() {
  const data = await send("/tables");
  return data?.tables ?? [];
}

export async function fetchTableSchema(tableName) {
  if (!tableName) {
    throw new Error("Table name is required");
  }
  return await send(`/tables/${encodeURIComponent(tableName)}/schema`);
}

export async function executeQuery(sql) {
  return await send("/query", {
    method: "POST",
    body: JSON.stringify({ sql }),
  });
}

export { API_BASE_URL };
