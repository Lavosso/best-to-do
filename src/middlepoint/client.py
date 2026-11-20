import httpx

ip = "127.0.0.1"
port = "8000"

def odczytaj_wszystkie():
    url = f"http://{ip}:{port}/tasks"
    response = httpx.get(url, timeout = 5)
    response.raise_for_status()
    return response.json()

def odczytaj_zadanie(
        task_id: int
):
    url = f"http://{ip}:{port}/tasks/{task_id}"
    response = httpx.get(url, timeout = 5)
    response.raise_for_status()
    return response.json()

def dodaj_zadanie(
        data: dict
):
    response = httpx.post(
        f"http://{ip}:{port}/tasks",
        json=data,
        timeout=5,
    )
    print(response.status_code, response.text)

def zaktualizuj_zadanie(
        task_id: int,
        data: dict
):
    response = httpx.patch(
        f"http://{ip}:{port}/tasks/{task_id}",
        json=data,
        timeout=5,
    )
    print(response.status_code, response.text)

def usun_zadanie(
        task_id: int
):
    response = httpx.delete(
        f"http://{ip}:{port}/tasks/{task_id}",
        timeout=5,
    )
    print(response.status_code, response.text)