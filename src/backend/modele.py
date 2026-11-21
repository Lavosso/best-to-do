from dataclasses import dataclass, field
from datetime import date, datetime

@dataclass
class Zadanie:
    id: int
    tytul: str
    opis: str = ""
    termin: date | None = None
    priorytet: str = "sredni"
    wykonane: bool = False
    tagi: list[str] = field(default_factory = list)


@dataclass
class Kofeina:
    id: int
    rodzaj: str
    mg: int
    czas: datetime
