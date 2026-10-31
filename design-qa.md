# Kontrola wizualna HERO RACK 2.0

Wzorzec: lokalny plik `Nowoczesna oferta internetu MAD-NET.png`, załączony przez użytkownika w trakcie zadania. Pierwszeństwo mają wymagania opisowe dotyczące otwartego frontu, małego zamka bez klucza, spokojnej kolorystyki i interaktywnego renderingu.

Implementacja: `http://127.0.0.1:4173/`, obraz `test-results/realizm/po/hero-1774.png`. Stan AIR. Wzorzec i rendering: po 1774 × 887 px, CSS viewport 1774 × 887, deviceScaleFactor 1. Porównanie całości: `test-results/realizm/porownanie.png`, obie części zmniejszone jednakowo do 887 × 443,5 px. Porównanie detali szafy w skali 1:1: `test-results/realizm/detale.png`.

## Obserwacje i poprawki

Pierwszy rendering ujawnił za małą skalę szafy na szerokim ekranie i zbyt rozrzuconą treść panelu (P2). Zwiększono wysokość urządzeń i belek od 1500 px, proporcje nagłówka oraz typografię oznaczeń. Uporządkowano odstępy panelu. Ponowny rendering zestawiono ze wzorcem w obu powyższych obrazach i obejrzano.

- Typografia: zachowana rodzina projektu i hierarchia nagłówka; większy tytuł, opisy i oznaczenia. Drobne napisy na urządzeniach pełnią rolę nadruków; dostępne nazwy przycisków opisują technologię i liczbę kanałów.
- Układ: tekst po lewej, otwarta szafa pośrodku, prawa część panelu wychodzi zza bocznej ścianki. Porty i mocowania są widoczne; mobilny panel znajduje się poniżej szafy. Bez obcięć i poziomego overflow w badanych szerokościach.
- Barwy: grafit dominuje, LAN czerwony, FIBER #FF7B19, AIR niebieski. PCB pozostaje ciemniejsze od typografii i szafy. Obudowy mają mniej nasyconych powierzchni niż ilustracja, zgodnie z opisem zadania.
- Materiały i obrazy: zachowano istniejące logo MAD-NET. Ranty, szyny, uchwyty, wentylacja i zamek są elementami działającej wizualizacji HTML/CSS/SVG. Rozmycia, fotograficznego tła i zwisającego klucza ze wzorca świadomie nie kopiowano. To odwzorowanie kierunku, a nie fotograficzna kopia 1:1.
- Treść: zachowano komunikat, krótkie opisy, liczby pakietów i CTA. Nadal 5 RJ-45, 3 SC/UPC Simplex oraz 5 kanałów AIR bez fizycznych gniazd.
- Działanie: testy hover/focus/touch, CTA, przejścia treści, ciągłe indywidualne animacje, reduced motion, wyłączenie animacji i regresja V21. Brak wyjątków JS i błędów konsoli w teście HERO.

Brak otwartych usterek P0/P1/P2 względem opisanego zakresu. Pozostaje P3: ewentualne dalsze strojenie faktury i oświetlenia po odbiorze właściciela. Fizyczny telefon, Safari i Firefox nie były testowane.

final result: passed
