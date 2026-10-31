# MAD-NET V20 — raport wdrożenia, 31.10.2026

Gałąź: `feat/v20-hero-rack-refinement`. Baza: `03b5acd` na `main`; początkowo czyste drzewo robocze. Wdrożenie rozwija istniejący HTML/CSS/JS. Nie publikowano witryny na hostingu.

## Wdrożone zmiany

- Panel HERO wysuwa się zza prawej ścianki RACK: zakładka 34 px, brak lewego bordera, prawe narożniki zaokrąglone. Szafa pozostaje nad panelem; porty są dostępne.
- `ResizeObserver` mierzy obudowę i kontener, a `getBoundingClientRect()` uwzględnia transformację 3D. Odczyty są grupowane w jednej klatce; aktualizowane zmienne dotyczą wyłącznie absolutnie pozycjonowanego panelu. Panel nie jest obserwowany, więc zapis nie tworzy pętli zmiany layoutu.
- Usunięto `min-height:340px` i stare, sprzeczne warianty układu panelu. Zachowano desktopową geometrię i perspektywę szafy.
- Mniejsza ikona, krótsze opisy, zwarta typografia, stałe miejsce na fakty i CTA. Zmiana technologii nie zmienia położenia panelu, CTA, szafy ani granic HERO. Zanikanie i pojawianie treści trwa łącznie około 325 ms.
- LAN `#FF203E`, FIBER `#FF7B19`, AIR `#3FA8FF`. Wybór działa myszą, dotykiem i klawiaturą, pozostaje po opuszczeniu urządzenia, a CTA wybiera właściwą technologię cennika.
- Przy szerokościach do 1230 px panel jest pod szafą. Na telefonie CTA znajdują się pod panelem; odstęp po prawej mieści także głębokość obudowy.
- Technologia i umowa są w jednym kompaktowym obszarze nad urządzeniem. Usunięto duże opakowanie okresu umowy, osobną kartę źródła oraz powtarzaną legendę. Złącza opisują urządzenia i podpowiedzi przy wyborze technologii; źródło jest pod tabelą.
- Przełącznik animacji jest przy urządzeniu. Obejmuje też HERO i PCB; zmiana preferencji ruchu przerywa oczekującą zmianę treści panelu.
- Głębokie grafity `#0A0C11`, `#0C0F14`, `#10141B`. Dotychczasowe SVG PCB w cenniku rozszerzono do 12 ortogonalnych tras, współdzielonych z impulsami o różnych fazach i okresach 8–12 s. Tło pozostaje za treścią i nie odbiera kliknięć.
- Dodano faviconę z istniejącego logo, usuwając żądanie nieistniejącego `/favicon.ico`.

## Zmienione pliki

| Plik | Zakres |
| --- | --- |
| `index.html` | Panel, kontrolki cennika, źródło, PCB, metadane |
| `assets/css/styles.css` | Geometria, warstwy, responsywność, grafit, ruch |
| `assets/js/hero-rack.js` | Pomiar 3D, przejścia i preferencje ruchu |
| `tests/v20.browser.mjs` | Regresja w przeglądarce |
| `package.json`, `package-lock.json` | Playwright Core wyłącznie do testów; polecenie `test:browser` |
| `.github/workflows/ci.yml` | Testy Chromium i artefakty z pomiarami oraz zrzutami |
| `README.md` | Uruchamianie testów i opis artefaktów |
| `docs/RAPORT_V20.md` | Niniejszy raport |

Nie zmieniano `assets/js/cennik.js`, danych cenowych, opłat, formularza, mapy ani archiwum V18.

## Wyniki weryfikacji lokalnej

- Przed zmianami: `npm run verify` — 6/6 testów, build PASS. Zapisano zrzuty 390, 760, 1024, 1280, 1440 i 1920 px oraz pomiary bazowe.
- Po zmianach: `npm run verify` — 6/6 testów, build PASS.
- `npm run test:browser` — PASS w Microsoft Edge / Chromium na Windows. Testowany jest zbudowany katalog `dist/`.
- Szerokości: **360, 390, 430, 760, 1024, 1280, 1440, 1510, 1920 px**. Łącznie 27 pomiarów panelu dla LAN/FIBER/AIR: brak poziomego przepełnienia, zawartość mieści się w panelu, szafa mieści się w widoku, porty pozostają dostępne.
- 1440/1510/1920 px: wysokość panelu **317,22 px**, prawej ścianki **333,22 px**, zakładka **34,01 px**, odstęp pionowy po około **8 px** z obu stron; lewy border **0 px**. Przy 1280 px odpowiednio 317,09 / 333,10 px.
- Wszystkie 13 ofert zachowuje pobieranie, wysyłanie oraz ceny 24/12 miesięcy; bezterminowo nadal wycena indywidualna. FIBER nadal nie pozwala wybrać nieopublikowanej ceny 12-miesięcznej. Wybór umowy aktualizuje również formularz.
- **117 tras** (13 pakietów × 9 szerokości): próbkowanie rzeczywistych ścieżek SVG co 2 px nie wykazało kolizji z innymi kartami, z uwzględnieniem marginesu 2 px. Sprawdzono również rzeczywisty wybór pakietów i sekwencje połączeń LAN/FIBER/AIR z włączonymi animacjami.
- 13 kanałów HERO zachowuje malejący okres animacji wraz ze wzrostem prędkości. AIR nie ma fizycznych gniazd.
- Klawiatura Tab/Enter/Space i dotyk: po trzy cykle LAN/FIBER/AIR. Gest przewijania przez urządzenie nie zmienia technologii. Wyjście myszą pozostawia ostatni wybór.
- `prefers-reduced-motion: reduce` oraz przełącznik animacji: PASS. PCB i kontrolki respektują ograniczony ruch.
- Brak wyjątków JavaScript, błędów konsoli i nieudanych żądań w automatycznym przebiegu.
- Dodatkowe sprawdzenie mapy online: załadowano Leaflet/OSM, postawiono i usunięto pinezkę; poprawnie działa komunikat przy pustej miejscowości. Brak wyjątków JS. Wynik: `test-results/v20/po/mapa.json`.
- Zrzuty desktopowe, tabletowe i telefoniczne obejrzano i porównano z bazą. `git diff --check` bez błędów.

## Zrzuty i odtwarzanie testów

Artefakty lokalne są celowo poza historią Git (`test-results/` jest ignorowany):

- `test-results/v20/przed/hero-{szerokość}.png` — sześć widoków bazowych; `pomiary.json` zawiera geometrię przed zmianami.
- `test-results/v20/po/hero-{szerokość}.png` i `cennik-{szerokość}.png` — wszystkie dziewięć szerokości.
- `test-results/v20/po/technologia-{LAN|FIBER|AIR}-1440.png` — trzy warianty panelu.
- `test-results/v20/po/reduced-motion-1440.png`, `formularz-mapa-1440.png` i `wyniki.json` — ograniczony ruch, mapa i wyniki pomiarów.

`npm ci`, następnie `npm run verify` oraz `npm run test:browser`. Środowisko i konfigurację przeglądarki opisuje README. CI wykonuje te same testy i udostępnia zrzuty jako artefakt `mad-net-v20-przegladarka`; wynik zdalnego przebiegu należy sprawdzić osobno od wyniku lokalnego.

## Commity i ograniczenia

- `b8ad608` — `fix(hero): integrate technology panel behind rack`
- `49b3e44` — `refactor(pricing-ui): compact controls layout`
- `24b124a` — `style(theme): refine graphite and pcb effects`
- `test: add v20 visual and interaction checks` — testy, konfiguracja CI i raport w niniejszym zakresie.

Test dotyku używa emulacji Chromium; nie zastępuje odbioru na fizycznym telefonie. Nie przeprowadzono odbioru w Safari ani Firefox. Mapa i geokodowanie nadal zależą od zewnętrznych usług. Formularz nadal wymaga rzeczywistego backendu przed uruchomieniem wysyłki; nie dodano SMTP ani pozornego sukcesu. Dane handlowe pozostawiono bez zmian i nadal wymagają akceptacji właściciela przed publikacją witryny.
