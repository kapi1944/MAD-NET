# Etap 06 — HOME V5

Baza: `201931a609db513e5e3348156943017ac04ca6e7`, istniejąca gałąź `main`.

## HOME V4 / V5

| Obszar | HOME V4 | HOME V5 |
|---|---|---|
| Pierwszy komunikat | „Łączymy. Chronimy. Wspieramy.” | „Internet. Po sąsiedzku.”, lokalizacja i trzy technologie; dawne hasło jako dopowiedzenie |
| HERO | Fotografia latarni | Istniejąca szafa telekomunikacyjna, trzy urządzenia, fizyczne mocowania i zielone SC/APC; podgląd LAN/FIBER/AIR |
| Główne działania | Dostępność / kontakt | Dostępność / pakiety oraz bezpośredni telefon |
| Technologie | Wspomniane w opisie | Trzy osobne karty, schematy medium i linki wybierające technologię w istniejącym cenniku |
| Pięć usług | Pięć równorzędnych kart | Wyróżniony Internet i cztery mniejsze usługi; na telefonach pełne karty w jednej kolumnie |
| Region | Mapa i wybór miejscowości | Zachowane interakcje, źródła podkładu i siedem miejscowości; wyraźna informacja, że mapa nie potwierdza zasięgu |

## Zrzuty rzeczywistej przeglądarki Chromium

Zrzuty PRZED wykonano z czystego repozytorium, przed zmianą kodu. PO przedstawia końcowy HOME. Oba warianty mają viewport wysokości 1000 px i pełny zrzut dokumentu; podkład mapy jest pobierany online.

| Szerokość | PRZED | PO |
|---|---|---|
| Telefon 390 px | [HOME V4](przed/390.png) | [HOME V5](po/390.png) |
| Desktop 1440 px | [HOME V4](przed/1440.png) | [HOME V5](po/1440.png) |

Ocena wizualna obejmuje rzeczywiste zrzuty: układ tekstu i infrastruktury, zielone złącza FIBER, hierarchię kart, czytelność opisów i CTA oraz mapę. Na telefonie infrastruktura znajduje się pod komunikatem i przyciskami, a opisy technologii i usług pozostają dostępne.

## Granice implementacji

- HOME nadal ładuje wyłącznie własne arkusze i skrypty. Nie dodano bibliotek ani API.
- Wizualizacja SVG wykorzystuje istniejące obrazy szafy i zatwierdzone modele sprzętu z cennika; panel HOME przechowuje tylko opisy i linki. Nie kopiuje danych pakietów, cen ani mechaniki przewodów.
- Nowe komponenty i style usług/mapy są lokalne dla HOME. Cztery dalsze sekcje, nagłówek i stopka zachowują treść bazową.
- Wymiary grafiki są zarezerwowane przez proporcje; panel nie zmienia wysokości przy wyborze technologii. Ruch respektuje preferencję systemową, a dotyk nie uruchamia podglądu hover.
- Dostępność technologii i pakietu wymaga potwierdzenia dla konkretnego adresu. Formularz nadal wymaga osobno wdrożonego backendu.

## Weryfikacja

| Polecenie | Wynik | Dowód |
|---|---|---|
| `npm run verify` | PASS — 18 testów i build dziewięciu stron | [Log](wyniki/verify.txt) |
| `npm run test:home` | PASS — dziewięć szerokości, 45 porównań pikselowych i regresja cennika | [Log](wyniki/home.txt), [pomiary](wyniki/home.json) |
| `npm run test:nawigacja` | PASS — menu, klawiatura, dotyk, 243 linki i stare hashe | [Log](wyniki/nawigacja.txt) |
| `npm run test:browser` | PASS — HOME, FIBER, LINK/ACT, panel, 286 tras, tabele, oferta i porty | [Log](wyniki/browser.txt) |
| `npm run test:integracja` | PASS — dziewięć stron, 63 układy, zgodność zasobów | [Log](wyniki/integracja.txt) |

Test HOME obejmuje 320 / 360 / 390 / 430 / 768 / 1024 / 1366 / 1440 / 1920 px, brak overflow i kolizji treści, rozdzielenie podpisów i kontrolek mapy, siedem miejscowości obsługiwanych klawiaturą, stabilną wysokość panelu, rzeczywisty gest palca nad wyborem technologii, reduced-motion, cele hashy poniżej sticky headera i podkatalog `/MAD-NET/`. Sekcje nieobjęte zmianą zachowują zgodność pikselową; kontrola ujemna wykrywa celowo zmieniony kolor nagłówka. Brak błędów JavaScript i konsoli.

Zrzuty oceniono również wizualnie, osobno dla HERO, technologii, usług i mapy na telefonie oraz desktopie. Podpisy miejscowości i oznaczenie GPS poprawiono po zauważeniu kolizji na rzeczywistym zrzucie.

Publikację obsługuje istniejący workflow: artefakt strony jest wdrażany dopiero po zielonych kontrolach CI. SHA, odnośnik do konkretnego przebiegu CI i wynik sprawdzenia opublikowanej wersji są podane w raporcie końcowym czatu. Pełne lokalne artefakty są w `test-results/home-v5/`, a CI dołącza ten katalog do artefaktów przebiegu.

Etap 07 pozostaje wstrzymany do zatwierdzenia wyników etapu 06 przez właściciela.
