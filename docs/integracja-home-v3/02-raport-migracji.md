# MAD-NET — etap 02: migracja HOME i cennika

Data: 2026-11-01, Europe/Warsaw. Repo: `C:\GitHub\Projects\MAD-NET`. Gałąź: `feat/madnet-integracja-home-v3`. Baza: `a6a146b4fa2bf1d46bbebc38e79f68eaf68f2d9a` (etap 01). Początkowo śledzone pliki i indeks były czyste; trzy znane nieśledzone HTML pozostawiono bez ingerencji.

## Wynik i mapa URL

| Przed etapem 02 | Po etapie 02 | Zachowanie |
|---|---|---|
| `./home.html` | `./index.html` lub `./` | HOME V3; stary plik usunięty, bez drugiej ręcznej kopii i bez aliasu |
| `./index.html` lub `./` — cennik | `./cennik.html` | pełny dotychczasowy cennik |
| `./index.html#cennik` | `./cennik.html#cennik` | zachowana sekcja ofert |
| `./index.html#oplaty` | `./cennik.html#oplaty` | zachowane opłaty |
| `./index.html#kontakt` — formularz | `./cennik.html#kontakt` | zachowany formularz dostępności |
| `/MAD-NET/home.html` | `/MAD-NET/` lub `/MAD-NET/index.html` | względne zasoby HOME działają pod prefiksem |
| `/MAD-NET/` — cennik | `/MAD-NET/cennik.html` | względne zasoby i API cennika zachowują katalog bazowy |

To mapa migracji, **nie deklaracja przekierowań**. `home.html` jest usunięty i zwraca 404. Stare hashe strony głównej nie są jeszcze automatycznie przenoszone na cennik. Dawne CTA V3 do publicznego GitHub Pages oraz sekcje/modale pozostają do późniejszej naprawy zgodnie z listą etapu 01. Nie przeprowadzono etapu 03.

Lokalnie: `npm run dev` albo po buildzie `npm run preview`, następnie `http://127.0.0.1:4173/` i `http://127.0.0.1:4173/cennik.html`. Testy używają własnych podglądów HTTP, bez file://.

## Integralność i izolacja

- `cennik.html` jest kopią dawnego `index.html`; `index.html` jest kopią zweryfikowanego `home.html` z etapu 01. Porównanie treści z bazowym commitem po normalizacji LF/CRLF: identyczne. Nie zmieniono meta, ID, sekcji, data-atrybutów ani kolejności skryptów.
- Tożsamość potwierdzają również blob SHA Git: cennik `c64a5578745b5c6c4d4a417758136b3e7f2f3583` (także dawny index), HOME `b022dfab3b46ed3d62c1b266764eda869363d2c3` (także dawny home.html).
- Skrypty cennika nadal: `cennik.js` → `dostepnosc.js` → `hero-rack.js`. HOME ładuje tylko `home.js`. Stylesheets HOME i cennika nie są współładowane.
- **Bez zmian w assets/**: style, obrazy, logika RACK, połączenia, ceny i formularz pozostają takie jak w etapie 01. Brak nowych bibliotek/integracji.
- Test integralności nadal porównuje cennik i jego zasoby z manifestem etapu 00, z jedyną zmianą mapowania nazwy `index.html` → `cennik.html`.
- Archiwum `docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html` pozostaje bez zmian. SHA-256: `ceeef68c1d719bb37c161aa8df4c3c0a3395c7123da5e3f70571a6806dded99d`. Oryginał lokalny i ZIP etapu 00 również zachowane.

## Build, preview i CI

`scripts/build.mjs` zawiera jawną allowlistę dwóch stron: `index.html`, `cennik.html`, oraz kopiuje `assets/`. Nie kopiuje całego repo, docs, archiwów, źródłowego V3, testów ani home.html.

Przed zastąpieniem dist walidowane są:

1. Obecność obydwu HTML.
2. HOME: lang=pl, tytuł główny, nawigacja, mapa, własny CSS/JS.
3. Cennik: HERO RACK, sekcje ofert/opłat/kontaktu, formularz, style oraz obecność i kolejność trzech skryptów.
4. Istnienie lokalnych zasobów wskazanych przez src/href `./assets/...` w HTML.

Brak pliku lub znacznika kończy build niezerowym kodem i komunikatem. Nowy test budowania potwierdza, że brak drugiej strony, uszkodzona struktura HOME/cennika lub brak obrazu nie usuwa poprzedniego dist. Poprawny build zawiera w katalogu głównym dokładnie `assets/`, `cennik.html`, `index.html`.

`scripts/serve.mjs` pozostawiono bez zmian: obsługuje index dla `/` oraz potrzebne MIME HTML/CSS/JS/PNG/JPG/SVG/WebP/JSON. Test prefiksu `/MAD-NET/` montuje te same odpowiedzi HTTP z dist przez Playwright, bez zmiany serwera i bez kontaktu z publiczną witryną. To symulacja hostingu w podkatalogu, nie wdrożenie Pages.

Workflow jakości nadal uruchamia się na push do `main`/`feat/**` i PR do main. Rozszerzono sprawdzenie artefaktów o `dist/cennik.html` i `dist/assets/js/home.js`; zachowano testy przeglądarkowe oraz dodano katalog wyników etapu 02 do artefaktu. Nie dodano deploy ani nie zmieniono ustawień Pages.

## Zmienione testy

| Plik | Zmiana i zachowane wymagania |
|---|---|
| `tests/projekt.test.mjs` | asercje starego cennika czytają cennik.html; zachowane 13 wariantów, kolejność skryptów, sekcje i brak backendu; dodane asercje HOME i jednego źródła strony |
| `tests/home.test.mjs` | HOME czytany z index; stary index w manifeście mapowany na cennik.html; integralność oryginału i 10 obrazów bez osłabienia |
| `tests/v20.browser.mjs` | wyłącznie bazowy adres `/cennik.html`; bez zmian zachowań, tolerancji i asercji |
| `tests/v21.browser.mjs` | odwiedziny `/cennik.html`; historyczne `f759900:index.html` udostępniane pod nową ścieżką na potrzeby starych porównań |
| `tests/pcb.browser.mjs` | adres `/cennik.html`; opcja --przed korzysta z nieruchomego baseline `a6a146b:index.html`, a nie z HEAD:index, który jest już HOME; synchronizacja dwiema klatkami po unpauseAnimations przed pomiarem ruchu |
| `tests/home.browser.mjs` | 5 szerokości, HOME w index, porównanie cennika z etapem 01, 6 ścieżek smoke, HTTP zasobów, selektory, izolacja CSS/JS, brak home.html w dist |
| `tests/build.test.mjs` (nowy) | negatywne próby budowania i sprawdzenie allowlisty w izolowanym katalogu test-results, bez modyfikowania plików produktu |

Nie usunięto testów cennika ani nie zwiększono tolerancji. Zmiany oczekiwań dotyczą wyłącznie lokalizacji stron i jawnego usunięcia home.html.

### Diagnostyka testu PCB

Pierwsza próba na domyślnym 4183 zakończyła się `Brak serwera PCB` po 8 sekundach. Port był zajęty przez Vite innego projektu (`Centrum_Projektowe`); nie zatrzymywano tego procesu. Użyto istniejącej konfiguracji `MADNET_PORT_PCB=4193`.

Dwie próby na wolnym porcie zgłosiły `Rzeczywisty ruch LED 360: {"naTrasie":true,"przesuniecie":0}`. Niezależny pomiar tego samego SVG w dawnym HTML i nowym cennik.html pokazał ruch w obu przypadkach (około 30 px na ekranie / 180 ms, oś SVG 7 → 7,183 s). Instrumentowany test po dodatkowym odczycie geometrii również przeszedł całość. Wskazało to na zależność próbkowania od aktualizacji renderowania po pause/setCurrentTime/unpause, a nie na różnicę treści stron.

Test uzupełniono o dwa requestAnimationFrame po unpauseAnimations, przed pierwszą próbką. Zachowano próbki osi SVG 1/3/5/7 s, okno rzeczywistego pomiaru 180 ms oraz wymaganie `naTrasie && przesuniecie > 1`. Nie wyłączono animacji ani nie obniżono progu. Logi nieudanych prób i diagnostyki są w `test-results/integracja-home-v3/02/pcb-proba-4183.log`, `pcb-proba-led.log`, `diag-pcb.log`; wynik końcowy znajduje się osobno w pcb.log i zbiorczym dowodzie.

## Wyniki

Środowisko jak w etapach 00/01: Windows, Node 24, Edge/Chromium headless. Logi lokalne: `test-results/integracja-home-v3/02/`.

| Kontrola | Wynik |
|---|---|
| `npm run verify` | PASS, exit 0 — 11/11 testów i build obu stron |
| `node tests/home.browser.mjs` | PASS, exit 0 — 5 szerokości obu stron, 0 różnic pikseli, menu/modale/mapa/PCB i smoke |
| `npm run test:browser` | PASS, exit 0 — V20: 13 szerokości, 169 tras bez kolizji, klawiatura/dotyk/scroll; V21: 8 szerokości i 64 kombinacje, mapa/formularz/fallback; HOME i smoke obu stron również PASS |
| `npm run test:pcb` | PASS, exit 0 — na porcie 4193, po synchronizacji SMIL; 9 szerokości 360–2560 px, geometria/ruch/przełącznik/reduced motion/kliknięcia |
| Integralność przeniesionych treści i archiwum | PASS |
| Prawdziwa wysyłka e-mail | SKIP — brak backendu api/zapytanie.php; testy żądań nie dowodzą wysłania wiadomości |

Zbiorczy log: [02-snapshoty/testy.txt](02-snapshoty/testy.txt). Wyniki porównania i listy zasobów HTTP: [wyniki.json](02-snapshoty/wyniki.json).

### Smoke i HTTP

| Ścieżka | Strona | Lokalne odpowiedzi HTTP 200 | Brakujące wymagane selektory |
|---|---|---:|---:|
| `/` | HOME | 13 | 0 |
| `/index.html` | HOME | 13 | 0 |
| `/cennik.html` | cennik | 11 | 0 |
| `/MAD-NET/` | HOME | 13 | 0 |
| `/MAD-NET/index.html` | HOME | 13 | 0 |
| `/MAD-NET/cennik.html` | cennik | 11 | 0 |

Zliczane są odpowiedzi dokumentu i lokalnych zasobów; kafelki mapy i zewnętrzny Leaflet są odrębnymi zależnościami. Test zgłasza URL i brakujący selektor, gdy struktura nie pasuje. Sprawdza brak skryptów/stylów drugiej strony.

## Snapshoty i porównanie przed/po

Przy tych samych parametrach pełnych kadrów (DPR 1, wysokość 1000, reduced motion) porównano RGBA oryginału HOME V3 i nowego index oraz dawnego index z commita etapu 01 i nowego cennik.html. Identyczne rzeczywiste kafelki online są współdzielone w pamięci testu. W cenniku na czas zdjęcia dodatkowo wyłączono animacje. Nie stosowano rozmycia ani tolerancji ukrywającej różnice.

| Szerokość | HOME po migracji | Cennik po migracji | Różne piksele HOME / cennik |
|---|---|---|---:|
| 390 | [snapshot](02-snapshoty/home-390.png) | [snapshot](02-snapshoty/cennik-390.png) | 0 / 0 |
| 768 | [snapshot](02-snapshoty/home-768.png) | [snapshot](02-snapshoty/cennik-768.png) | 0 / 0 |
| 1024 | [snapshot](02-snapshoty/home-1024.png) | [snapshot](02-snapshoty/cennik-1024.png) | 0 / 0 |
| 1440 | [snapshot](02-snapshoty/home-1440.png) | [snapshot](02-snapshoty/cennik-1440.png) | 0 / 0 |
| 1920 | [snapshot](02-snapshoty/home-1920.png) | [snapshot](02-snapshoty/cennik-1920.png) | 0 / 0 |

Pary przed/po są również lokalnie w test-results/…/02 jako `przed-*`, `po-*`, `cennik-przed-*`, `cennik-po-*`. Źródło porównania cennika jest przypięte do SHA etapu 01; oryginał HOME jest wersjonowany w archiwum. [Manifest snapshotów](02-snapshoty/manifest.json) zawiera rozmiary i SHA-256. Snapshoty nie trafiają do produkcyjnego assets ani dist.

Wynik dotyczy jednej kontrolowanej konfiguracji Edge, nie jest gwarancją identyczności między silnikami. Zachowano zastane mobilne kadrowanie latarni i ukrywanie podpisu ≤1120 px. Brak deklaracji testów na fizycznych telefonach lub Safari/Firefox.

## Ryzyka, zakres i rollback

- Brak zmian w cenach, 13 pakietach, portach, routingu przewodów i logice formularza. Nie wykryto regresji samej relokacji w porównaniu obrazów.
- Świadome przejściowe ograniczenie: linki CTA i zgodność dawnych hashy nie są jeszcze migrowane. Nie należy na tej podstawie publikować gałęzi jako ukończonej witryny.
- [CI etapu 01 #41265393128](https://github.com/kapi1944/MAD-NET/actions/runs/41265393128) zakończyło się FAIL dla zastanej asercji `Informacje i przycisk panelu nie mogą się zasłaniać: 360px AIR`. Ten błąd był także na main i nie wynika z etapu 02. Lokalny Edge i Linux/Chromium CI należy raportować osobno. Nie osłabiano testu ani nie zmieniano tolerancji.
- GitHub Pages nadal publikuje automatycznie z main; nie wykonano push main, merge, rebase, force-push ani publikacji. Workflow zmieniono tylko w zakresie jakości/artefaktów, bez nowego deploy.
- Treści i telefon firmy oraz backend pozostają niezweryfikowane biznesowo, mapy zależą od internetu. Nie dodano API, sekretów SMTP ani fikcyjnej wysyłki.
- Rollback na gałęzi integracyjnej: revert commita etapu 02 przywróci układ etap 01 (index=cennik, home=HOME) oraz właściwe testy i build. Nie używać reset --hard/clean. Archiwa i baseline etapów 00/01 pozostają dostępne.

Zmiany produktu: relokacja dwóch HTML i usunięcie home.html. Dalsze zmiany: build, siedem plików testów (w tym nowy build.test), workflow, README/ARCHITEKTURA i dokumentacja etapu. SHA commita: `git log -1 --format="%H %s" -- docs/integracja-home-v3/02-raport-migracji.md`, także w końcowym podsumowaniu.

**Zatrzymanie przed etapem 03.**
