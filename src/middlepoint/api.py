from collections.abc import Generator
from contextlib import asynccontextmanager, contextmanager
from copy import deepcopy
from datetime import date
from pathlib import Path
from threading import Lock

from backend.modele import Zadanie
from backend.plik_json import wczytaj_zadania, zapisz_zadania
from backend.zadania import ListaZadan
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, StrictBool

SCIEZKA_ZADAN = Path(__file__).resolve().parents[2] / "zadania_robocze.json"
listaAPI = ListaZadan()
blokada_zapisu = Lock()

@asynccontextmanager
async def uruchomienie(_app: FastAPI):
    global listaAPI

    try:
        listaAPI = ListaZadan(wczytaj_zadania(SCIEZKA_ZADAN))
    except FileNotFoundError:
        listaAPI = ListaZadan()
    except (OSError, TypeError, ValueError) as blad:
        raise RuntimeError(f"Nie można wczytać pliku {SCIEZKA_ZADAN}: {blad}") from blad

    yield


@contextmanager
def zmien_liste_zadan() -> Generator[ListaZadan, None, None]:
    global listaAPI

    with blokada_zapisu:
        kopia = deepcopy(listaAPI)
        yield kopia
        try:
            zapisz_zadania(SCIEZKA_ZADAN, kopia.pobierz_zadania())
        except (OSError, UnicodeError) as blad:
            raise HTTPException(500, "Nie udało się zapisać zadań") from blad

        listaAPI = kopia


app = FastAPI(title="Task Control API", lifespan=uruchomienie)
frontend_dir = Path(__file__).resolve().parents[1] / "frontend"
app.mount("/ui", StaticFiles(directory=frontend_dir), name="frontend")


@app.get("/", include_in_schema=False)
def panel_gracza():
    return FileResponse(frontend_dir / "index.html")


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
        with zmien_liste_zadan() as lista:
            zadanie = lista.dodaj_zadanie(**dane.model_dump())
    except (TypeError, ValueError) as exc:
        raise HTTPException(422, str(exc)) from exc
    return zadanie

@app.patch("/tasks/{id_zadanie}", response_model=Zadanie)
def edytuj_zadanko(id_zadanie: int, do_zmiany: ZmianyZadania):
    try:
        with zmien_liste_zadan() as lista:
            lista.edytuj_zadanie(id_zadanie, **do_zmiany.model_dump(exclude_unset=True))
            zadanie = lista.znajdz_zadanie(id_zadanie)
    except LookupError as exc:
        raise HTTPException(404, "Zadanie nie istnieje") from exc
    except (TypeError, ValueError) as exc:
        raise HTTPException(422, str(exc)) from exc
    return zadanie

@app.delete("/tasks/{id_zadanie}", status_code=204)
def usun_zadanko(id_zadanie: int):
    try:
        with zmien_liste_zadan() as lista:
            lista.usun_zadanie(id_zadanie)
    except LookupError as exc:
        raise HTTPException(404, "Zadanie nie istnieje") from exc
    return Response(status_code=204)
