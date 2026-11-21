# best-to-do
A to-do app made for the "BEST Coding Marathon" Hackathon.

## Lokalny panel QuestLog

W katalogu projektu przygotuj środowisko z Pythonem 3.10 lub nowszym. Jeśli używasz już projektowego `.venv` z FastAPI i Uvicornem, przejdź do polecenia uruchomienia.

```sh
python3 -m venv .venv
.venv/bin/python -m pip install fastapi 'pydantic>=2,<3' uvicorn
```

Uruchom GUI i API jednym poleceniem.

```sh
.venv/bin/python -m uvicorn middlepoint.api:app --app-dir src
```

Otwórz [panel misji](http://localhost:8000). Dodaj misję i zaznacz pole przy jej nazwie, żeby zdobyć XP. Przycisk odświeżania pobiera również zmiany wprowadzone przez [API](http://localhost:8000/docs).

### Licznik kofeiny

Nad tablicą misji są cztery przyciski: kawa, Black, Monster i Dzik. Jedno kliknięcie dodaje napój i XP; przez kilka sekund można to cofnąć. Pod paskiem poziomu panel pokazuje szacowane stężenie kofeiny, które spada o połowę co 4 godziny. Pasek ma skalę do 1000 mg, powyżej 600 mg zmienia kolor na żółty, a powyżej 800 mg na czerwony.

API: `GET /caffeine`, `POST /caffeine` z treścią `{"rodzaj": "kawa"}` oraz `DELETE /caffeine/{id}`.

### Rozbudowa gamifikacji

- `src/frontend/progress.js` określa nagrody za priorytety i napoje, próg nowego poziomu oraz parametry miernika kofeiny (okres półtrwania, progi kolorów). Panel oblicza XP na podstawie aktualnie ukończonych zadań i wypitych napojów. Cofnięcie ukończenia odejmuje nagrodę.
- `src/backend/kofeina.py` określa ilość kofeiny (mg) w każdym napoju.
- `src/frontend/api.js` odpowiada za odczyt i zapis zadań oraz kofeiny. `app.js` łączy dane z widokiem, a `style.css` definiuje wygląd panelu.

Obecny backend przechowuje zadania i kofeinę w pamięci procesu. Po restarcie serwera lista zadań, licznik kofeiny i wynik XP zaczynają się od zera.
Backend wczytuje zadania z pliku `zadania_robocze.json` w głównym katalogu projektu. Jeśli pliku jeszcze nie ma, panel startuje z pustą listą, a plik pojawia się po pierwszej zapisanej zmianie. Po restarcie panel odtwarza XP na podstawie wczytanych zadań. Uruchamiaj aplikację z jednym procesem serwera.
