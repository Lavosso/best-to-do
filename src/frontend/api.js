async function request(url, method = "GET", data) {
  const options = { method, signal: AbortSignal.timeout(10000) };
  if (data !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(data);
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `Błąd API (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

export const getTasks = () => request("/tasks");
export const createTask = (data) => request("/tasks", "POST", data);
export const setCompleted = (id, wykonane) => request(`/tasks/${id}`, "PATCH", { wykonane });

export const getCaffeine = () => request("/caffeine");
export const addCaffeine = (rodzaj) => request("/caffeine", "POST", { rodzaj });
export const removeCaffeine = (id) => request(`/caffeine/${id}`, "DELETE");
