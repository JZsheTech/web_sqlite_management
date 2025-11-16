const DEFAULT_API_PORT = process.env.REACT_APP_API_PORT || "8100";

function stripTrailingSlash(url) {
  if (!url) {
    return url;
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function readQueryOverride() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("apiBase");
    if (override) {
      return stripTrailingSlash(decodeURIComponent(override));
    }
  } catch (error) {
    // Ignore malformed query strings and fall back to other strategies.
  }
  return null;
}

function deriveHostFromLocation() {
  if (typeof window === "undefined") {
    return null;
  }
  const { protocol = "http:", hostname } = window.location;
  if (!hostname) {
    return null;
  }

  const prefixMatch = hostname.match(/^(\d+)-(.*)$/);
  if (prefixMatch) {
    return `${protocol}//${DEFAULT_API_PORT}-${prefixMatch[2]}`;
  }

  const suffixMatch = hostname.match(/(.*)-(\d+)(\..*)$/);
  if (suffixMatch) {
    const [, base, , domainSuffix] = suffixMatch;
    return `${protocol}//${base}-${DEFAULT_API_PORT}${domainSuffix}`;
  }

  return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
}

function resolveApiBaseUrl() {
  const queryOverride = readQueryOverride();
  if (queryOverride) {
    return queryOverride;
  }

  const envValue = process.env.REACT_APP_API_BASE_URL;
  if (envValue) {
    return stripTrailingSlash(envValue);
  }

  const inferred = deriveHostFromLocation();
  if (inferred) {
    return stripTrailingSlash(inferred);
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

const API_BASE_URL = resolveApiBaseUrl();

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

export async function executeModification(sql) {
  return await send("/sql/modify", {
    method: "POST",
    body: JSON.stringify({ sql }),
  });
}

export async function createTable(payload) {
  return await send("/tables", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function insertRow(tableName, values) {
  return await send(`/tables/${encodeURIComponent(tableName)}/rows`, {
    method: "POST",
    body: JSON.stringify({ values }),
  });
}

export async function deleteRows(tableName, options) {
  return await send(`/tables/${encodeURIComponent(tableName)}/rows`, {
    method: "DELETE",
    body: JSON.stringify(options),
  });
}

export async function dropTable(tableName) {
  return await send(`/tables/${encodeURIComponent(tableName)}`, {
    method: "DELETE",
    body: JSON.stringify({ confirm: true }),
  });
}

export { API_BASE_URL };
