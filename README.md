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

### Rozbudowa gamifikacji

- `src/frontend/progress.js` określa nagrody za priorytety i próg nowego poziomu. Panel oblicza XP na podstawie aktualnie ukończonych zadań. Cofnięcie ukończenia odejmuje nagrodę.
- `src/frontend/api.js` odpowiada za odczyt i zapis zadań. `app.js` łączy dane z widokiem, a `style.css` definiuje wygląd panelu.

Backend wczytuje zadania z pliku `zadania_robocze.json` w głównym katalogu projektu. Jeśli pliku jeszcze nie ma, panel startuje z pustą listą, a plik pojawia się po pierwszej zapisanej zmianie. Po restarcie panel odtwarza XP na podstawie wczytanych zadań. Uruchamiaj aplikację z jednym procesem serwera.
