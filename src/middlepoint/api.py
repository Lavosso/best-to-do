from backend.zadania import ListaZadan, Zadanie
from fastapi import Depends, FastAPI, HTTPException, Response

app = FastAPI(title="Task Control API")

def sprawdz_czy_zadanie_istnieje(lista: ListaZadan, id_zadanie: int) -> Zadanie:
    try:
        return lista.znajdz_zadanie(zadanie_id=id_zadanie)
    except LookupError:
        raise HTTPException(404, "Zadanie nie istnieje")

@app.get("/health")
def zdrowiexD():
    return {"status": "ok"}

@app.get("/tasks", response_model=list[Zadanie])
def lista_zadan(lista: ListaZadan):
    return lista.pobierz_zadania()

@app.get("/tasks/{id_zadanie}", response_model=Zadanie)
def znajdz_zadanko(lista: ListaZadan, id_zadanie: int):
    return sprawdz_czy_zadanie_istnieje(lista, id_zadanie)

@app.post("/tasks", response_model=Zadanie, status_code=201)
def nowe_zadanko(lista: ListaZadan, dane: dict = Depends(Zadanie)):
    return lista.dodaj_zadanie(*dane)

@app.patch("/tasks/{id_zadanie}", response_model=Zadanie)
def edytuj_zadanko(lista: ListaZadan, id_zadanie: int, do_zmiany: dict):
    try:
        lista.edytuj_zadanie(id_zadanie, **do_zmiany)
    except ValueError:
        raise HTTPException(405, "edycja zadania w zadany sposob niemozliwa")

@app.delete("/tasks/{id_zadanie}", status_code=204)
def usun_zadanko(lista: ListaZadan, id_zadanie: int):
    lista.usun_zadanie(id_zadanie)
    return Response(status_code=204)

