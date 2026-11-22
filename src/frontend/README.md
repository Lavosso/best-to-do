# Mine-larp — frontend

Mine-larp to tablica zadań, na której każda ukończona misja daje punkty doświadczenia (XP). Interfejs działa w przeglądarce. Serwer FastAPI udostępnia stronę i zapisuje zadania.

## Uruchomienie

Potrzebujesz terminala Bash i Pythona 3.10 lub nowszego z modułem `venv`. Przeglądarka ładuje pliki HTML, CSS i JavaScript bezpośrednio z serwera. Uruchom aplikację z głównego katalogu projektu.

```sh
./launch.sh
```

Jeżeli terminal jest już w `src/frontend`, użyj `../../launch.sh`. Skrypt przygotuje środowisko Pythona i pobierze brakujące zależności. Otwórz stronę w przeglądarce. Gdy skończysz, zatrzymaj serwer w terminalu klawiszami `Ctrl+C`. [Otwórz Mine-larp](http://127.0.0.1:8000)

## Pierwsza misja

1. Kliknij **Nowa misja**. Wpisz „Oddać projekt”, wybierz wysoki priorytet i dodaj tagi `studia, projekt`.
2. Zapisz misję. W widoku **Aktywne** możesz zmienić kolejność według priorytetu albo wybrać jeden tag.
3. Zaznacz pole przy nazwie. Misja trafi do **Ukończonych**. Przy mnożniku ×1 dostaniesz 50 XP. Odznaczenie pola przywróci misję do aktywnych i odejmie jej punkty.

Niski priorytet daje bazowo 10 XP, średni 25 XP, a wysoki 50 XP. Przy ukończeniu misji panel mnoży punkty przez aktualny mnożnik kofeiny (od ×1 do ×4). Pierwszy awans wymaga 100 XP. Następne progi rosną o 50 XP, aż do 1000 XP na poziom.

## Jak odnaleźć się w kodzie

| Plik | Za co odpowiada |
| --- | --- |
| `index.html` | Układ tablicy, liczniki, formularze i szablon pojedynczej misji. |
| `style.css`, `assets/` | Wygląd na komputerze i telefonie, zdjęcia, font i kursor. |
| `app.js` | Reakcje na kliknięcia, filtrowanie i aktualizacja widoku. |
| `api.js` | Wysyłanie żądań do serwera i odczyt odpowiedzi. |
| `progress.js` | Obliczenia XP, poziomu i mnożnika kofeiny. |

Żeby prześledzić zapis misji, otwórz narzędzia deweloperskie przeglądarki i kartę **Sieć**. Dodanie misji wywołuje `POST /tasks`, zaznaczenie jej jako ukończonej wywołuje `PATCH /tasks/{id}`, a po odświeżeniu strony `GET /tasks` pobiera listę. [Opis zapytań w lokalnym API](http://127.0.0.1:8000/docs)

Serwer zapisuje misje i ich mnożniki w pliku `zadania_robocze.json` w głównym katalogu projektu. Po odświeżeniu strony frontend odtwarza poziom z ukończonych misji. Licznik kofeiny działa w pamięci strony, więc zaczyna wtedy od zera.
