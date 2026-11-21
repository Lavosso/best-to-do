async function request(path = "", options = {}) {
  const response = await fetch(`/tasks${path}`, {
    ...options,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `Błąd API (${response.status})`);
  }
  return response.json();
}

export const getTasks = () => request();

function save(path, method, data) {
  return request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export const createTask = (data) => save("", "POST", data);
export const setCompleted = (id, wykonane) => save(`/${id}`, "PATCH", { wykonane });
