# Mine-larp

Lista zadań przygotowana na hackathon BEST Coding Marathon.

## Uruchomienie

Wymagany jest Python 3.10 lub nowszy z modułem `venv`. Skrypt przygotuje środowisko `.venv` i doinstaluje brakujące zależności.

```sh
./launch.sh
```

Panel misji działa na porcie 8000. [Otwórz Mine-larp](http://localhost:8000)

## Misje i doświadczenie

Przy dodawaniu misji możesz przypisać jej tagi, oddzielając je przecinkami. Na tablicy możesz połączyć filtr statusu z filtrem tagu i zmienić kolejność aktywnych misji według priorytetu.

Pierwszy awans wymaga 100 XP. Każdy następny próg rośnie o 50 XP, aż osiągnie 1000 XP. Dawka kofeiny zwiększa mnożnik XP używany przy ukończeniu misji. Po ponownym otwarciu strony licznik kofeiny zaczyna od zera.

Zadania są zapisywane w `zadania_robocze.json` w katalogu projektu. Panel odtwarza poziom z zapisanych ukończonych misji. Uruchamiaj aplikację z jednym procesem serwera. [Dokumentacja API](http://localhost:8000/docs)
