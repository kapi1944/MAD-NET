# Weryfikacja HERO V4

Data: 1 listopada 2026. Baza: `1987ad3`. Środowisko lokalne: Windows, Node 24, Microsoft Edge / Playwright.

| Kontrola | Wynik |
|---|---|
| `npm run verify` | PASS — 14 testów i build dziewięciu stron |
| `npm run test:browser` | PASS — diagnostyka panelu, V20, V21, HOME, nawigacja i oferta |
| V20 | 286 tras bez kolizji, klawiatura, dotyk, przewijanie i reduced motion |
| V21 | 64 kombinacje tabel na ośmiu szerokościach; mapa, formularz i obsługa awarii |
| HERO V4 | 11 szerokości: 320–2560 px; brak overflow/kolizji, poprawne CTA i animacje |
| Pozostały HOME | Niezmieniony HTML i reguły CSS; ścisłe porównania sekcji, mapa z osobną kontrolą geometrii i interakcji |
| Cennik | Zachowane hashe chronionych zasobów i geometria historycznej wersji |
| Nawigacja | 238 linków, dziewięć celów, klawiatura, dotyk, stare URL |
| Oferta | Pięć stron, 30 układów; brak błędów JS/konsoli/HTTP |
| Dodatkowy test PCB | PASS — dziewięć szerokości 360–2560 px |

Szczegóły normalizacji dynamicznego obszaru mapy oraz ograniczeń fotografii znajdują się w [raporcie](README.md). Zrzuty PRZED/PO oceniono wizualnie. Testy przeglądarkowe nie zastępują testów na fizycznych urządzeniach.

Logi końcowe: [verify](wyniki/verify.txt), [pełny zestaw browser](wyniki/browser.txt), [HOME](wyniki/home.txt), [nawigacja](wyniki/nawigacja.txt), [PCB](wyniki/pcb.txt).

GitHub Pages korzysta z `main` i katalogu `/`. Push gałęzi propozycji nie publikuje V4. PR pozostaje do ręcznego przeglądu i scalenia.
