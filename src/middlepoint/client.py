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
    response.raise_for_status()
    return response.json()

def zaktualizuj_zadanie(
        task_id: int,
        data: dict
):
    response = httpx.patch(
        f"http://{ip}:{port}/tasks/{task_id}",
        json=data,
        timeout=5,
    )
    response.raise_for_status()
    return response.json()

def usun_zadanie(
        task_id: int
):
    response = httpx.delete(
        f"http://{ip}:{port}/tasks/{task_id}",
        timeout=5,
    )
    response.raise_for_status()



if __name__ == "__main__":
    i = int(input("1 - dodaj, 2 - odczytaj, 3 - usun: "))
    if (i == 1):
        tytul = input("tytul: ")
        opis = input("opis: ")
        print(dodaj_zadanie({"tytul": tytul, "opis": opis}))
    elif (i == 2):
        task_id = int(input("id: "))
        print(odczytaj_zadanie(task_id))
    elif (i == 3):
        task_id = int(input("id: "))
        print(usun_zadanie(task_id))
