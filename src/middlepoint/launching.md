Aby uruchomić:

`.venv/bin/python -m uvicorn src.middlepoint.api:app --reload --app-dir src --host 127.0.0.1`

Aby dodac zadanie z konsoli:

`curl -X POST "http://127.0.0.1:8000/tasks" -H "Content-Type: application/json" -d '{"tytul": "Nowe zadanie", "opis": "Opis nowego zadania"}'`

Aby dodać zadanie, usunac lub je przeczytac, latwiej, cli:

`python src/middlepoint/client.py`