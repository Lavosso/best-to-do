async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `Błąd API (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function save(url, method, data) {
  return request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export const getTasks = () => request("/tasks");
export const createTask = (data) => save("/tasks", "POST", data);
export const setCompleted = (id, wykonane) => save(`/tasks/${id}`, "PATCH", { wykonane });

export const getCaffeine = () => request("/caffeine");
export const addCaffeine = (rodzaj) => save("/caffeine", "POST", { rodzaj });
export const removeCaffeine = (id) => request(`/caffeine/${id}`, { method: "DELETE" });
