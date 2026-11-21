from datetime import date

from backend.zadania import ListaZadan, Zadanie
from fastapi import FastAPI, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field, StrictBool

app = FastAPI(title="Task Control API")
listaAPI = ListaZadan()

class NoweZadanie(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tytul: str
    opis: str = ""
    termin: date | None = None
    priorytet: str = "sredni"
    wykonane: StrictBool = False
    tagi: list[str] = Field(default_factory=list)


class ZmianyZadania(NoweZadanie):
    tytul: str | None = None


def sprawdz_czy_zadanie_istnieje(id_zadanie: int) -> Zadanie:
    try:
        return listaAPI.znajdz_zadanie(zadanie_id=id_zadanie)
    except LookupError:
        raise HTTPException(404, "Zadanie nie istnieje")

@app.get("/health")
def zdrowie():
    return {"status": "ok"}

@app.get("/tasks", response_model=list[Zadanie])
def lista_zadan():
    return listaAPI.pobierz_zadania()

@app.get("/tasks/{id_zadanie}", response_model=Zadanie)
def znajdz_zadanko(id_zadanie: int):
    return sprawdz_czy_zadanie_istnieje(id_zadanie)

@app.post("/tasks", response_model=Zadanie, status_code=201)
def nowe_zadanko(dane: NoweZadanie):
    try:
        return listaAPI.dodaj_zadanie(**dane.model_dump())
    except (TypeError, ValueError) as exc:
        raise HTTPException(422, str(exc)) from exc

@app.patch("/tasks/{id_zadanie}", response_model=Zadanie)
def edytuj_zadanko(id_zadanie: int, do_zmiany: ZmianyZadania):
    zadanie = sprawdz_czy_zadanie_istnieje(id_zadanie)
    try:
        listaAPI.edytuj_zadanie(id_zadanie, **do_zmiany.model_dump(exclude_unset=True))
    except (TypeError, ValueError) as exc:
        raise HTTPException(422, str(exc)) from exc
    return zadanie

@app.delete("/tasks/{id_zadanie}", status_code=204)
def usun_zadanko(id_zadanie: int):
    try:
        listaAPI.usun_zadanie(id_zadanie)
    except LookupError as exc:
        raise HTTPException(404, "Zadanie nie istnieje") from exc
    return Response(status_code=204)
