# Audyt migracji V21 — 31.10.2026

Baza: f759900, gałąź feat/v20-hero-rack-refinement. Jedyna niezapisana praca: dostarczony plik V21; pozostawiony bez zmian, kopia w test-results/v21/V21-zabezpieczony.html. SHA-256 źródła: `dc57645f5a006d9786b82221f817c1aa2e95b28287846e4e32ba72d4db0c4e39`.

A: obecna; B: uboższa; C: brak; D: zastąpiona lepszą; E: osobna decyzja. Klasyfikacja na podstawie źródeł; odbiór działania opisuje raport integracji.

| Funkcjonalność | V21 | Obecny projekt | Różnica | Decyzja | Priorytet |
|---|---|---|---|---|---|
| Wiele tabel | niezależny Set | jedna zakładka | brak 8 kombinacji | C — przenieść | P0 |
| Miniporty | dekoracyjne, zależne od prędkości | same nazwy | brak wizualizacji | C — przenieść | P0 |
| Umowa formularza | trzy opisane kafelki | małe etykiety | mniej czytelny wybór | B — przenieść | P1 |
| HERO | Network Status | RACK 3D V20 | nowszy model interakcji i geometrii | D — zachować V20 | P0 |
| Cennik i opłaty | 13 ofert | 13 ofert | wspólne dane | A — bez zmian cen | P0 |
| Formularz wielu usług | technologie i pakiety | technologie i pakiety | funkcja zachowana | A — zachować | P0 |
| Mapa | MapLibre/OpenFreeMap | Leaflet/OSM na żądanie | WebGL kontra raster | D — zachować Leaflet | P1 |
| Awaria mapy | iframe, współrzędne, ponawianie | adres i ponawianie CDN | brak ręcznych współrzędnych | B — dodać współrzędne i link OSM | P1 |
| Tryb file i e-mail | otwarcie klienta poczty | API + kopiowanie | brak automatycznej wysyłki | E — nie zmieniać kontraktu API ani udawać SMTP | P2 |
| Grafit/PCB | starszy styl | V20 impulsy i wyłączenie ruchu | późniejsze ulepszenia | D — zachować V20 | P0 |
| `locate` | obecna | obecna | identyczna implementacja | A — zachować | P0 |
| `roundedCablePath` | obecna | obecna | identyczna implementacja | A — zachować | P0 |
| `scrollToSelectedCard` | obecna | obecna | identyczna implementacja | A — zachować | P0 |
| `updateLinks` | obecna | obecna | identyczna implementacja | A — zachować | P0 |
| `animateLink` | obecna | obecna | identyczna implementacja | A — zachować | P0 |
| `wireInteractiveHover` | obecna | obecna | identyczna implementacja | A — zachować | P0 |
| `selectPlan` | obecna | obecna | identyczna implementacja | A — zachować | P0 |

Mapa: zachowujemy uruchamianie na żądanie, ręczną pinezkę, wyszukiwanie Nominatim, fallback CDN i możliwość podania adresu. Leaflet nie wymaga WebGL, klucza ani płatnego API; obecne opóźnione ładowanie ogranicza koszt startu. Nie stwierdzono przewagi MapLibre uzasadniającej wymianę silnika. W obu wariantach potrzebny jest internet i atrybucja OSM; dla stylu OpenFreeMap dodatkowo atrybucja dostawcy. Ręczne współrzędne działają niezależnie od biblioteki i zachowują istniejący format lokalizacji API. Osadzony iframe nie pozwala wybierać pinezki, dlatego zastępuje go jawny link do OSM oraz pola współrzędnych, zamiast drugiego silnika mapowego.
