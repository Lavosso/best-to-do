from datetime import date

def prawidlowe_id(zadanie_id: int) -> None:
    if isinstance(zadanie_id, bool) or not isinstance(zadanie_id, int):
        raise TypeError("ID musi być liczbą całkowitą")


def prawidlowy_tekst(tekst: str) -> str:
    if not isinstance(tekst, str):
        raise TypeError("Tekst musi być typu str")
    
    tekst = tekst.strip()
    if not tekst:
        raise ValueError("Tekst nie może być pusty")
    return tekst


def prawidlowy_opis(opis: str) -> None:
    if not isinstance(opis, str):
        raise TypeError("Opis musi być tekstem")


def prawidlowy_deadline(deadline: date | None) -> None:
    if deadline is None:
        return

    if type(deadline) is not date:
        raise TypeError("Termin musi być date albo None")


def prawidlowy_priotytet(priorytet: str) -> None:
    if not isinstance(priorytet, str):
        raise TypeError("Priorytet musi być tekstem")

    if priorytet not in ("niski", "sredni", "wysoki"):
        raise ValueError("Priorytet musi być: niski, sredni albo wysoki")


def prawidlowy_status(status: bool) -> None:
    if not isinstance(status, bool):
        raise TypeError("Statu musi być bool")


def prawidlowe_tagi(tagi: list[str]) -> None:
    if not isinstance(tagi, list):
        raise TypeError("Tagi muszą być listą")

    for tag in tagi:
        if not isinstance(tag, str):
            raise TypeError("Każdy tag musi być tekstem")