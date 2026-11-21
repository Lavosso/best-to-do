from datetime import date
from backend.modele import Zadanie
from dataclasses import replace
from backend.walidacja import (
    prawidlowe_tagi,
    prawidlowy_priotytet,
    prawidlowe_id,
    prawidlowy_deadline,
    prawidlowy_opis,
    prawidlowy_status,
    prawidlowy_tekst
)

def sprawdz_zadanie(zadanie: Zadanie) -> None:
    if not isinstance(zadanie, Zadanie):
        raise TypeError("Oczekiwano obiektu Zadanie")

    prawidlowe_id(zadanie.id)
    prawidlowy_tekst(zadanie.tytul)
    prawidlowy_opis(zadanie.opis)
    prawidlowy_deadline(zadanie.termin)
    prawidlowy_priotytet(zadanie.priorytet)
    prawidlowy_status(zadanie.wykonane)
    prawidlowe_tagi(zadanie.tagi)
    if type(zadanie.mnoznik_xp) not in (int, float) or not 0 <= zadanie.mnoznik_xp <= 4:
        raise ValueError("Mnożnik XP musi być liczbą od 0 do 4")
    if not zadanie.wykonane and zadanie.mnoznik_xp != 1:
        raise ValueError("Tylko ukończone zadanie może mieć zapisany mnożnik XP")


class ListaZadan:
    def __init__(self, zadania: list[Zadanie] | None = None) -> None:
        self.zadania: list[Zadanie] = []

        if zadania is None:
            return

        if not isinstance(zadania, list):
            raise TypeError("Zadania muszą być listą")

        zajete_id: set[int] = set()

        for zadanie in zadania:
            sprawdz_zadanie(zadanie)

            if zadanie.id in zajete_id:
                raise ValueError(f"Powtórzone ID zadania: {zadanie.id}")

            zajete_id.add(zadanie.id)
            self.zadania.append(zadanie)

    def pobierz_zadania(self) -> list[Zadanie]:
        return self.zadania.copy()

    def znajdz_zadanie(self, zadanie_id: int) -> Zadanie:
        prawidlowe_id(zadanie_id)

        for zadanie in self.zadania:
            if zadanie.id == zadanie_id:
                return zadanie

        raise LookupError(f"Nie znaleziono zadania o ID {zadanie_id}")

    def dodaj_zadanie(
        self,
        tytul: str,
        opis: str = "",
        termin: date | None = None,
        priorytet: str = "sredni",
        wykonane: bool = False,
        tagi: list[str] | None = None,
        mnoznik_xp: float = 1,
    ) -> Zadanie:
        if tagi is None:
            tagi = []

        if self.zadania:
            nowe_id = max(zadanie.id for zadanie in self.zadania) + 1
        else:
            nowe_id = 1

        zadanie = Zadanie(
            id=nowe_id,
            tytul=tytul,
            opis=opis,
            termin=termin,
            priorytet=priorytet,
            wykonane=wykonane,
            tagi=tagi,
            mnoznik_xp=mnoznik_xp if wykonane else 1,
        )
        sprawdz_zadanie(zadanie)
        zadanie.tytul = prawidlowy_tekst(zadanie.tytul)
        zadanie.tagi = zadanie.tagi.copy()
        self.zadania.append(zadanie)
        return zadanie

    def edytuj_zadanie(self, zadanie_id: int, *, mnoznik_xp: float = 1, **zmiany) -> None:
        dozwolone_pola = {
            "tytul",
            "opis",
            "termin",
            "priorytet",
            "wykonane",
            "tagi",
        }

        for pole in zmiany:
            if pole not in dozwolone_pola:
                raise ValueError(f"Nie można edytować pola: {pole}")

        zadanie = self.znajdz_zadanie(zadanie_id)
        if "wykonane" in zmiany and zmiany["wykonane"] != zadanie.wykonane:
            zmiany["mnoznik_xp"] = mnoznik_xp if zmiany["wykonane"] else 1
        poprawka = replace(zadanie, **zmiany)
        sprawdz_zadanie(poprawka)

        if "tytul" in zmiany:
            poprawka.tytul = prawidlowy_tekst(poprawka.tytul)

        if "tagi" in zmiany:
            poprawka.tagi = poprawka.tagi.copy()

        for pole in zmiany:
            setattr(zadanie, pole, getattr(poprawka, pole))

    def oznacz_wykonane(self, zadanie_id: int) -> None:
        self.edytuj_zadanie(zadanie_id, wykonane=True)

    def cofnij_wykonanie(self, zadanie_id: int) -> None:
        self.edytuj_zadanie(zadanie_id, wykonane=False)

    def usun_zadanie(self, zadanie_id: int) -> None:
        zadanie = self.znajdz_zadanie(zadanie_id)
        self.zadania.remove(zadanie)
