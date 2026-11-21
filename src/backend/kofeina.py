from datetime import datetime, timezone

from backend.modele import Kofeina
from backend.walidacja import prawidlowe_id

# Rodzaj napoju -> ilość kofeiny (mg) w jednej porcji.
NAPOJE: dict[str, int] = {
    "kawa": 50,
    "black": 80,
    "monster": 160,
    "dzik": 200,
}


class DziennikKofeiny:
    def __init__(self) -> None:
        self.wpisy: list[Kofeina] = []
        self.nastepne_id = 1

    def pobierz_wpisy(self) -> list[Kofeina]:
        return self.wpisy.copy()

    def dodaj_napoj(self, rodzaj: str) -> Kofeina:
        if not isinstance(rodzaj, str):
            raise TypeError("Rodzaj napoju musi być tekstem")

        if rodzaj not in NAPOJE:
            raise ValueError(f"Nieznany napój. Dostępne: {', '.join(NAPOJE)}")

        wpis = Kofeina(
            id=self.nastepne_id,
            rodzaj=rodzaj,
            mg=NAPOJE[rodzaj],
            czas=datetime.now(timezone.utc).replace(microsecond=0),
        )
        self.nastepne_id += 1
        self.wpisy.append(wpis)
        return wpis

    def usun_wpis(self, wpis_id: int) -> None:
        prawidlowe_id(wpis_id)

        for wpis in self.wpisy:
            if wpis.id == wpis_id:
                self.wpisy.remove(wpis)
                return

        raise LookupError(f"Nie znaleziono wpisu o ID {wpis_id}")
