# MAD-NET — finalna konsolidacja, 3 listopada 2026

Prace wykonano na istniejącym `main`, bez tworzenia gałęzi i PR, kasowania źródeł, squash, rebase ani force push.

## Zabezpieczenie i integracja

- Kopia sześciu katalogów roboczych, metadanych Git, indeksów, zmian staged/unstaged, plików nieśledzonych i pełnych SHA referencji: `C:\GitHub\Backups\MAD-NET-final-2026-11-03T21-34-22-977Z`. Wszystkie katalogi robocze miały czysty stan plików śledzonych. Zależności npm również skopiowano; kopia głównego `node_modules` pochodzi z wymaganego `npm ci`.
- `MAD-NET.bundle`: `git bundle verify` potwierdził kompletną historię; obejmuje 50 referencji, w tym odłączony checkout. Kopia jest poza witryną.
- Merge `7e174056429e8d62fad783664e30e30010b7810c` zachowuje rodziców `1987ad3aa8a65fd1aa86f077af1addf3225bb228` i `76221b1fb469616faa1385c25233a74f53e01318`: HOME V4, HERO/RACK, FIBER, formularz, pięć usług, nawigację i testy.
- Merge `ac51184c35bc5d45f3b79eac08f74100d41a5ea1` zachowuje `codex/porty-led-czytelnosc` (`940e5feab86b62b43dca50322b7196b72b85fa54`): technika portów była już zintegrowana; dołączono pozostałą dokumentację i porównania.
- `feat/fiber-sc-apc-clean` i `feat/home-hero-premium-v4`, a także pozostałe historyczne gałęzie techniczne, są osiągalne z `main`. Nie powielano ich commitów.

## Źródło B — świadomie bez ponownego merge

`codex/fiber-sc-apc-etap05` pozostaje pod `7d8b447a3cd7c79aceb5604bb254918b92623dec`, lokalnie, na origin i w kopii. Porównano jego sześć unikalnych commitów z już scalonym kodem:

| Commit | Zachowanie pracy |
|---|---|
| `49c54f8` | Sprzęt SC/APC, klapki i kontroler połączeń już zachowane przez integrację. Kod `cennik.js` przed bieżącą naprawą był identyczny ze źródłem B. Nowsze rozmiary, proporcje i regresje pozostawiono. |
| `fd8bbae` | HOME V4 już zachowany; nie cofano późniejszych poprawek HERO i testów. |
| `261f11f` | Arkusze i panel wariantów cenowych pozostają wyłącznie w źródle i kopii. Nie zmieniono publicznych cen. |
| `1cf5bf4` | Formularz decyzji biznesowych i plik blokady arkusza pozostają w źródle i kopii, poza publiczną witryną. |
| `c36cfad` | Synchronizacja LINK/ACT zachowana; nowsze wymiary, kontrast i testy pozostawiono zamiast starszej wersji. |
| `7d8b447` | Historyczna instrukcja merge zachowana w źródle i kopii; aktualny tryb pracy zapisano w `AGENTS.md`. |

Nie stwierdzono brakującej poprawnej funkcji technicznej wymagającej przeniesienia ze źródła B. Wszystkie 14 lokalnych gałęzi pozostawiono.

## Naprawy i walidacja

- Przewód pozostaje zakotwiczony w rzeczywistym punkcie DOM na dole konektora. Pionowy odcinek przed zakrętem wynika z szerokości wtyku; dodatkowe miejsce w obudowie i terminalu mieści także animowane wsuwanie. Zachowano trasy ortogonalne, zaokrąglenia i omijanie kart.
- Test FIBER mierzy pierwsze i ostatnie 10 px przewodu, kotwice podczas ruchu, kolizje oraz wszystkie trzy karty na dziesięciu szerokościach, w tym 320/390/768/1366/1440/1920. Próba ujemna z dawnym skrętem po 6 px została prawidłowo odrzucona.
- ACT: 70% bez podłączenia i 100% po podłączeniu, zachowane animacje i rzeczywisty stan LINK; kontrola urządzenia, kart, tabel i RACK.
- Przyczyna awarii CI jest potwierdzona w [runie 41534195774](https://github.com/kapi1944/MAD-NET/actions/runs/41534195774), artefakt `13182733751`, `finalizacja/oferta-linux-2.json`: `stylesheet`, `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`, `net::ERR_CONNECTION_CLOSED`, scenariusz nieznanej technologii. Leaflet 1.9.4 przeniesiono do lokalnych zasobów z licencją BSD i obrazami. CSS ma identyczny SRI `sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=`. Nie wyłączono asercji błędów ani żadnej z trzech prób CI.
- Publikacja Pages została przełączona z katalogu głównego na artefakt `dist/` po pełnej walidacji CI. Build nadal używa jawnej listy dziewięciu HTML i `assets/`; dokumenty biznesowe i kopie bezpieczeństwa nie są publikowane.
- Wyniki wykonania wymaganych poleceń i próby ujemnej: `test-results/final-consolidation/`. Publiczna regresja porównuje treść i skróty pobranych zasobów z lokalnym `dist/`.
- Końcowy zestaw lokalny: `npm ci`, `npm run verify`, `test:browser`, `test:pcb`, `test:fiber`, `test:led`, `test:porty` i `test:integracja` — wszystkie PASS. Logi i czasy siedmiu skryptów: `test-results/final-consolidation/potwierdzenie/wyniki.jsonl`; integracja obejmuje 63 układy. Poprzednie próby i wykryte błędy pozostawiono w oddzielnych logach.

Formularz nadal wymaga osobnego backendu do rzeczywistej wysyłki wiadomości. W tym zadaniu nie dodawano serwera SMTP ani nie udawano wysyłki.
