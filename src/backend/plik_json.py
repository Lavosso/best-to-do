import json
from datetime import date
from pathlib import Path
from tempfile import NamedTemporaryFile
from backend.modele import Zadanie
from backend.zadania import ListaZadan

POLA_WERSJI_1 = {"id", "tytul", "opis", "termin", "priorytet", "wykonane", "tagi"}

def wczytaj_zadania(sciezka: str | Path) -> list[Zadanie]:
    with open(sciezka, encoding="utf-8") as plik:
        dane = json.load(plik)

    if not isinstance(dane, dict) or set(dane) != {"wersja", "zadania"}:
        raise ValueError("JSON musi być obiektem z polami 'wersja' i 'zadania'")

    if type(dane["wersja"]) is not int or dane["wersja"] not in (1, 2):
        raise ValueError("Obsługiwane wersje pliku to 1 i 2")

    if not isinstance(dane["zadania"], list):
        raise TypeError("Pole 'zadania' musi być listą")
    zadania: list[Zadanie] = []

    pola_zadania = POLA_WERSJI_1 if dane["wersja"] == 1 else POLA_WERSJI_1 | {"mnoznik_xp"}
    for numer, wpis in enumerate(dane["zadania"], start=1):
        if not isinstance(wpis, dict) or set(wpis) != pola_zadania:
            raise ValueError(f"Niepoprawny zestaw pól w zadaniu nr {numer}")

        pola = wpis.copy()
        # We wcześniejszych zapisach ukończona misja mogła mieć mnożnik poniżej 1.
        mnoznik = pola.get("mnoznik_xp", 1)
        if pola["wykonane"] is True and type(mnoznik) in (int, float) and 0 <= mnoznik < 1:
            pola["mnoznik_xp"] = 1
        termin = pola["termin"]

        if termin is not None:
            if not isinstance(termin, str):
                raise TypeError(f"Termin w zadaniu nr {numer} musi być tekstem albo null")
            try:
                data = date.fromisoformat(termin)
            except ValueError as blad:
                raise ValueError(f"Niepoprawna data w zadaniu nr {numer}") from blad

            if data.isoformat() != termin:
                raise ValueError(f"Termin w zadaniu nr {numer} musi mieć format RRRR-MM-DD")
   
            pola["termin"] = data
        zadania.append(Zadanie(**pola))
    return ListaZadan(zadania).pobierz_zadania()

def zapisz_zadania(sciezka: str | Path, lista: list[Zadanie]) -> None:
    if not isinstance(lista, list):
        raise TypeError("Zadania muszą być listą")

    sprawdzone = ListaZadan(lista)
    wpisy = []

    for zadanie in sprawdzone.pobierz_zadania():
        wpisy.append({
            "id": zadanie.id,
            "tytul": zadanie.tytul,
            "opis": zadanie.opis,
            "termin": zadanie.termin.isoformat() if zadanie.termin is not None else None,
            "priorytet": zadanie.priorytet,
            "wykonane": zadanie.wykonane,
            "tagi": zadanie.tagi,
            "mnoznik_xp": zadanie.mnoznik_xp,
        })

    dane = {"wersja": 2, "zadania": wpisy}
    sciezka = Path(sciezka)
    tymczasowa = None

    try:
        with NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=sciezka.parent, delete=False
        ) as plik:
            tymczasowa = Path(plik.name)
            json.dump(dane, plik, ensure_ascii=False, indent=2)
            plik.write("\n")

        tymczasowa.replace(sciezka)
    finally:
        if tymczasowa is not None:
            tymczasowa.unlink(missing_ok=True)
