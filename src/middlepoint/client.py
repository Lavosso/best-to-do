import httpx

DEFAULT_IP = "127.0.0.1"
DEFAULT_PORT = "8000"

def read_tasks(ip: str = DEFAULT_IP, port: str = DEFAULT_PORT):
    url = f"http://{ip}:{port}/tasks"
    response = httpx.get(url, timeout = 5)
    response.raise_for_status()
    return response.json()

def read_task(task_id: int, ip: str = DEFAULT_IP, port: str = DEFAULT_PORT):
    url = f"http://{ip}:{port}/tasks/{task_id}"
    response = httpx.get(url, timeout = 5)
    response.raise_for_status()
    return response.json()

def add_task(title, ip : str = DEFAULT_IP, port: str = DEFAULT_PORT):
    response = httpx.post(
        f"http://{ip}:{port}/tasks",
        json={"title": title},
        timeout=5,
    )
    print(response.status_code, response.text)

def update_task(task_id: int, ip : str = DEFAULT_IP, port: str = DEFAULT_PORT, title: str | None = None, status: str | None = None):
    data = {}
    if title:
        data["title"] = title
    if status:
        data["status"] = status
    response = httpx.patch(
        f"http://{ip}:{port}/tasks/{task_id}",
        json=data,
        timeout=5,
    )
    print(response.status_code, response.text)

def delete_task(task_id: int, ip : str = DEFAULT_IP, port: str = DEFAULT_PORT):
    response = httpx.delete(
        f"http://{ip}:{port}/tasks/{task_id}",
        timeout=5,
    )
    print(response.status_code, response.text)