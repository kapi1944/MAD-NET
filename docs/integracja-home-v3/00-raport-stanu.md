# MAD-NET — etap 00: stan i zabezpieczenie

Data: 2026-11-01, Europe/Warsaw. Zakres: audyt, baseline, dokumentacja. **Nie wykonano integracji ani etapu 01.**

## 1. Zweryfikowany punkt wyjścia

- Repo: `C:\GitHub\Projects\MAD-NET`, origin: `https://github.com/kapi1944/MAD-NET.git`.
- Początkowa gałąź: `main`; HEAD lokalny, lokalny `main` i `origin/main` po `git fetch origin`: **`56f946676b9421d1fd7ad3619c12ea954930b416`** (`wizualizacje`). Ahead/behind: **0/0**.
- Śledzone pliki na początku bez zmian, indeks pusty. Nie było nieznanych zmian wymagających zatrzymania prac.
- Trzy nieśledzone pliki: `MAD-NET_HOME_V3_JEDEN_PLIK.html`, `MAD-NET_ANKIETA_DECYZYJNA_INTEGRACJA_V3.html`, `MAD-NET_PLAN_INTERAKTYWNY_9_PROMPTOW_CODEX.html`. Rozpoznano ich tytuły, rozmiary, hashe i zależności; ankieta i plan są materiałami pomocniczymi. Żadnego z tych oryginałów nie dodano do indeksu, nie przeniesiono ani nie zmieniono.
- Gałąź `feat/madnet-integracja-home-v3` nie istniała lokalnie ani w pobranych refs origin; utworzono ją przez `git switch -c feat/madnet-integracja-home-v3 origin/main`.
- Zapoznano się z AGENTS, README, PLAN_ROZWOJU, DECYZJE, ARCHITEKTURA. Dokumentacji `docs/integracja-home-v3` wcześniej nie było.

Zmiany tego etapu ograniczają się do niniejszego katalogu dokumentacji, dowodów, screenshotów oraz archiwum źródła. Commit etapu można odczytać przez `git log -1 --format="%H %s" -- docs/integracja-home-v3/00-raport-stanu.md`; jego SHA jest także w końcowym podsumowaniu. Nie zapisuje się wewnątrz commita jego własnego SHA.

## 2. Oryginał HOME V3 i zasoby

**Plik:** `C:\GitHub\Projects\MAD-NET\MAD-NET_HOME_V3_JEDEN_PLIK.html`
**Rozmiar:** 1 930 653 bajty
**SHA-256:** `ceeef68c1d719bb37c161aa8df4c3c0a3395c7123da5e3f70571a6806dded99d`

Wyszukiwanie rekurencyjne `*V3*.html` znalazło HOME V3 i ankietę V3. Starsze śledzone `MAD-NET_HOME_JEDEN_PLIK.html` i `MAD-NET_HOME_V2_JEDEN_PLIK.html` nie zostały wybrane jako źródło. Wersja V3 zawiera również późniejsze lokalne nadpisania CSS opisane w jej komentarzach jako v3.1; identyfikatorem baseline jest hash całego pliku, nie sama nazwa wersji.

Kopia bajtowa w [zrodla/HOME-V3-oryginal.zip](zrodla/HOME-V3-oryginal.zip) zawiera jeden oryginalny HTML. SHA-256 odczytanej zawartości ZIP sprawdzono niezależnie w .NET: identyczny z powyższym. ZIP zapobiega zmianom końców linii przez Git (`core.autocrlf=true`; istniejące `.gitattributes` oznacza ZIP jako binary). Oryginał nadal leży w katalogu głównym, nieśledzony.

Pełna inwentaryzacja: [zasoby-v3.json](dowody/zasoby-v3.json), [pliki-lokalne.json](dowody/pliki-lokalne.json). V3: **16 wystąpień `data:`, 10 unikalnych obrazów**, jeden blok CSS i dwa bloki JS inline, sprite ikon SVG inline oraz generowane SVG dekoracji PCB. Nie ma osobnych lokalnych CSS/JS/fontów do skopiowania. Oryginalne i nadpisujące tła pozostają równocześnie w kodzie; nie usuwać ich w etapie audytu.

### Pozostałe zależności V3

- Mapa satelitarna: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}` (Esri/Maxar).
- Mapa ciemna: `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png` (OSM/CARTO).
- Linki cennika/formularza: `https://kapi1944.github.io/MAD-NET/#cennik` i `https://kapi1944.github.io/MAD-NET/#kontakt` — obecnie wychodzą na publiczną stronę; podczas baseline nie klikano ich.
- Linki OSM do wybranej miejscowości oraz Google Maps wyszukiwanie MAD-NET; `tel:+48913874500`, `mailto:biuro@mad-net.pl` i mailto z tematem w modalu.
- `http://www.w3.org/2000/svg` jest przestrzenią nazw SVG, nie pobieranym zasobem.
- Mapa HOME jest własnym kodem opartym na kafelkach i punktach miejscowości, bez Leaflet; nie jest mapą potwierdzonego zasięgu. Cennik używa osobno Leaflet/OSM/Nominatim.

## 3. Testy bazowe

Środowisko: Windows, Node `v24.16.0`, npm `11.13.0`, Playwright Core z lockfile, Microsoft Edge headless (kanał `msedge`). Nie zmieniono zależności ani lockfile.

| Kontrola | Wynik | Dowód / zakres |
|---|---|---|
| `npm ci` | PASS, exit 0 | 1 pakiet, audyt 2 pakietów, 0 podatności zgłoszonych przez npm |
| `npm run verify` | PASS, exit 0 | 6/6 testów struktury/składni + statyczny build |
| `npm run test:browser` | PASS, exit 0 | V20: 13 szerokości 360–1920, 169 tras bez kolizji, ceny, RACK, klawiatura/dotyk/scroll/reduced motion; V21: 8 szerokości, 64 kombinacje tabel, 13 miniportów, geokodowanie/mapa/przeciąganie/status/fallback, przechwycone dane formularza |
| `npm run test:pcb` | PASS, exit 0 | 360, 390, 430, 768, 1024, 1280, 1440, 1920, 2560 px; geometria, LED, przełącznik, reduced motion, klikanie; brak błędów JS |
| Baseline obu stron przez HTTP | PASS | 390/768/1024/1440 × 2 strony; overflow 0, pageerror 0, console.error 0, requestfailed 0 |
| Odczyt zawartości kopii ZIP | PASS | SHA-256 identyczny z oryginałem V3 |
| Rzeczywista wysyłka e-mail | SKIP | backend `api/zapytanie.php` nie istnieje w repo; testy przechwytują żądania i nie dowodzą dostarczenia wiadomości |

Logi poleceń: [dowody/testy.txt](dowody/testy.txt). Pomiary: [pomiary.json](dowody/pomiary.json). Szczegółowe lokalne logi i dodatkowe kadry: `test-results/integracja-home-v3/00/`; wyniki istniejących testów: `test-results/v20/po/`, `test-results/v21/`, `test-results/pcb-4-1/po/` (ignorowane przez Git). Skrypty pomocnicze audytu w test-results nie są zmianą produktu.

### Ograniczenia i zdarzenia środowiskowe

- Port 4173 był zajęty (`EADDRINUSE 127.0.0.1:4173`); nie zatrzymywano obcego procesu. Baseline końcowy działał przez `PORT=4191 npm run dev -- --no-live`, na katalogu repo, bez `file://`.
- Pierwsza sesja z live reload zgłosiła `Page.captureScreenshot: Unable to capture screenshot`, a ponowienie `Execution context was destroyed`. Serwer obserwuje także PNG w test-results, więc zapis screenshotów wyzwalał reload. Po wyłączeniu live reload i GPU komplet ośmiu pomiarów i zrzutów zakończył się powodzeniem. Zachowano logi prób lokalnie; nie uznano ich za PASS.
- Python nie był dostępny (alias Windows Store); inwentaryzację wykonano Node.js. Nie instalowano dodatkowych narzędzi.
- Testy lokalne dotyczą Edge/Chromium. Firefox, Safari i fizyczne telefony nie były testowane.

## 4. Baseline wizualny i zachowanie

Zrzuty pełnych stron są rozdzielone i wersjonowane poza produkcyjnym `assets`. Widok: DPR 1, wysokość 1000 px, `prefers-reduced-motion: reduce`, czysty kontekst, przewinięcie dla lazy images, zewnętrzne zasoby online. To baseline nieruchomy; animacje cennika sprawdza osobny test PCB/V20. Hash każdego PNG jest w [manifest-artefaktow.json](dowody/manifest-artefaktow.json).

| Szerokość | Cennik | HOME V3 |
|---|---|---|
| 390 | [pełna strona](baseline/cennik/calosc-390.png) | [pełna strona](baseline/home-v3/calosc-390.png) |
| 768 | [pełna strona](baseline/cennik/calosc-768.png) | [pełna strona](baseline/home-v3/calosc-768.png) |
| 1024 | [pełna strona](baseline/cennik/calosc-1024.png) | [pełna strona](baseline/home-v3/calosc-1024.png) |
| 1440 | [pełna strona](baseline/cennik/calosc-1440.png) | [pełna strona](baseline/home-v3/calosc-1440.png) |

Cennik: HERO ma trzy urządzenia RACK, panel technologii, obsługę hover/focus/dotyku; sekcja ofert domyślnie pokazuje FIBER i 3 pakiety. Łącznie w danych jest **13 wariantów: LAN 5, FIBER 3, AIR 5**, nie 13 jednocześnie widocznych kart. FIBER ma SC/UPC Simplex i brak oferty na rok; LAN RJ-45; AIR nie ma fizycznych portów. Kolory LAN `#ff203e`, FIBER `#ff7b19`, AIR `#3fa8ff`. Przełącznik animacji w nagłówku. Formularz zawiera wybór ofert/umowy, adres i mapę/pinezkę; backend wysyłki pozostaje niewdrożony.

HOME V3 — porównanie obejrzanych kadrów HERO/mapy:

- **1440:** biały podpis z czerwonym podkreśleniem widoczny przy zachodzie słońca; latarnia i słońce widoczne; boczna lista usług obecna. Tło desktop ma `background-size: 100% 100%` dla fotografii, co może zmieniać proporcje względem źródła.
- **1024:** latarnia i zachód widoczne; podpis i boczna lista usług ukryte przez istniejące `@media(max-width:1120px) .hero-boczny{display:none}`.
- **768/390:** podpis nadal ukryty; tło mocno przyciemnione, mobilne kadrowanie nie eksponuje latarni jak desktop. Nie poprawiano tej różnicy — jest częścią stanu wejściowego.
- PCB widoczne głównie przy krawędziach, pod treścią; sekcje mają `isolation:isolate`, treść `z-index:2`, dekoracje `pointer-events:none`. Mapa ma własne warstwy kafelków, punktów i etykiety. Nie wykryto zasłaniania głównych CTA przez PCB w obejrzanych kadrach.
- Mapa online pokazała rzeczywiste kafelki satelitarne, punkty miejscowości i etykietę Trzebiatowa. Na 390 px legenda GPS jest blisko przycisków zoom; etykieta wybranej miejscowości przykrywa część podkładu. Na desktopie nakładka wybranego miasta częściowo przykrywa zachodnie punkty. To obserwacje baseline, bez korekt.
- W V3 telefon to `+48 91 387 45 00`, w cenniku `608 144 747`: rozbieżność danych do rozstrzygnięcia w zleconym później etapie, bez zmiany w audycie.

## 5. Kontrakt URL — stan i przyszłe przejście

Obecnie `/MAD-NET/` i `./index.html` oznaczają cennik; HOME V3 jest niezależnym lokalnym plikiem. Poniższy docelowy kontrakt pochodzi z lokalnego materiału `MAD-NET_PLAN_INTERAKTYWNY_9_PROMPTOW_CODEX.html` i służy dalszym etapom. **Nie utworzono tych podstron ani przekierowań.** Materiał planu nie uruchamia następnych etapów.

| Stare / obecne | Nowe w przyszłej integracji | Wymagane zachowanie |
|---|---|---|
| HOME V3 jako pobrany plik | `./index.html` | strona główna oparta na zweryfikowanym V3 |
| obecny `./index.html` | `./cennik.html` | zachowanie RACK, ofert, cen, połączeń i formularza |
| `/MAD-NET/#cennik` | `./cennik.html#cennik` | zgodność starych linków |
| `/MAD-NET/#oplaty` | `./cennik.html#oplaty` | zgodność starych linków |
| `/MAD-NET/#kontakt` | `./cennik.html#kontakt` | stary hash nadal oznacza formularz dostępności, bez konfliktu z kontaktem HOME |
| V3 `data-do-cennika`, obecnie host GitHub | `./cennik.html#cennik` | lokalny względny link pod `/MAD-NET/` |
| V3 `data-do-formularza`, obecnie host GitHub | `./cennik.html#kontakt` | lokalny względny link dostępności |
| ogólny kontakt | `./kontakt.html` | oddzielenie ogólnego kontaktu od formularza dostępności |
| usługi i obecne modale V3 | katalog i podstrony usług | ścieżki szczegółowe ustalić w dotyczącym ich etapie |
| `api/zapytanie.php` cennika | `./api/zapytanie.php` względem strony | PHP wymaga osobnego backendu; GitHub Pages go nie uruchomi |

Zasada przyszłych linków: `./...`, bez wymuszenia hosta i bez absolutnego `/...`. Stare `#start` i pozostałe hashe trzeba zinwentaryzować przy migracji; nie implementowano domyślnego przekierowania wszystkich hashy, bo kolidowałoby z sekcjami HOME.

### Katalog plików przyszłej zmiany

| Plik / grupa | Przyszły zakres, bez zmian teraz |
|---|---|
| `index.html`, przyszły `cennik.html` | rozdzielenie HOME i dotychczasowego cennika, zgodność hashy |
| oryginał V3 / archiwum ZIP | źródło importu; nie nadpisywać oryginału |
| `assets/css/styles.css`, `assets/css/hero-hybryda.css` | zachować style cennika, izolować przyszły HOME |
| `assets/js/cennik.js`, `assets/js/hero-rack.js`, `assets/js/dostepnosc.js` | chronione zachowanie; lokalne dopasowanie linków tylko gdy konieczne |
| `assets/img/mad-net-logo.png`, `hero-rack.png`, `hero-rack-baza.svg`, `hero/plyta-pcb.webp` | istniejące zasoby cennika, zachować |
| przyszłe zasoby HOME | wydzielenie podpisu, latarni, logo, zdjęć i PCB według hashy z inwentaryzacji |
| `scripts/build.mjs` | obecnie kopiuje wyłącznie index + assets; wielostronicowy build wymaga osobnego etapu |
| `scripts/serve.mjs` | istniejący podgląd; nie zmieniano |
| `tests/projekt.test.mjs`, `tests/v20.browser.mjs`, `tests/v21.browser.mjs`, `tests/pcb.browser.mjs` | obecnie oczekują cennika w index; późniejsze dostosowanie ścieżek bez osłabienia asercji |
| przyszłe `kontakt.html` i podstrony usług | osobne późniejsze zlecenia, brak implementacji teraz |
| `.github/workflows/ci.yml`, ustawienia Pages | audytowane; **nie zmieniać w tym etapie** |

## 6. GitHub, CI i przypadkowa publikacja

Potwierdzone odczytem `gh api repos/kapi1944/MAD-NET/pages`: **Pages `legacy`, source `main`, path `/`, status `built`, HTTPS**. Zatem zmiana `main` może automatycznie opublikować zawartość katalogu głównego, niezależnie od wyniku CI i od `dist/`. Brak workflow deploy w repo nie oznacza braku publikacji.

- Workflow repo: `.github/workflows/ci.yml` — push do `main` i `feat/**`, PR do `main`; npm ci/test/build, Chromium, test:browser, artefakty. Nie uruchamia test:pcb.
- Dynamiczny workflow GitHub: `pages-build-deployment`.
- [CI main #41229662542](https://github.com/kapi1944/MAD-NET/actions/runs/41229662542): **FAIL** dla SHA `56f946676b9421d1fd7ad3619c12ea954930b416`. Dokładna asercja: `Informacje i przycisk panelu nie mogą się zasłaniać: 360px AIR` (`actual:false`, `expected:true`). To zastany błąd/rozbieżność na runnerze Linux Chromium, nie skutek audytu.
- [Pages #41229661991](https://github.com/kapi1944/MAD-NET/actions/runs/41229661991): **SUCCESS** dla tego samego SHA. CI nie blokowało tego wdrożenia.
- Odczyty API zachowano w `dowody/github-pages.json`, `github-workflows.json`, `ci-main.json`.

Unikanie publikacji: wyłącznie gałąź integracyjna, jawny refspec push `HEAD:refs/heads/feat/madnet-integracja-home-v3`, upstream tej gałęzi, żadnego push main/merge/rebase/force-push ani wywołania deployment/Pages. Push dokumentacji uruchamia istniejące CI `feat/**`, nie zmienia źródła Pages. Nie utworzono PR ani nie zmieniano workflow/ustawień Pages.

## 7. Blokady i ryzyka

1. **Gotowość do publikacji zablokowana:** zastane czerwone CI main; wymaga osobnego wyjaśnienia w dalszych zleceniach. Lokalny wynik nie unieważnia wyniku CI.
2. Automatyczne Pages z main mimo nieudanego CI — krytyczne ryzyko przypadkowego merge/push. Nie wykonano tych operacji.
3. Brak backendu zapytań, SMTP i potwierdzonej wysyłki; nie dodawano API ani integracji.
4. Rozbieżny telefon, treści usług i obszar działania wymagają potwierdzenia właściciela; baseline nie poświadcza ich prawdziwości.
5. Twarde adresy GitHub w V3 i konflikt starego `#kontakt` z HOME wymagają obsługi podczas przyszłej migracji.
6. Globalne CSS/JS cennika oraz wielokrotne nadpisania CSS V3 grożą kolizjami przy połączeniu; obecnie strony pozostają rozdzielone.
7. Online mapy i geokodowanie zależą od usług zewnętrznych i ich zasad/licencji. Osiągalność w baseline nie gwarantuje dostępności później.
8. Podpis ukryty poniżej 1121 px i mobilne kadrowanie latarni to zastane różnice względem desktopu. Nie zakładać identyczności wszystkich szerokości.
9. Oryginalne nieśledzone pliki mogą zostać utracone poza Git; HOME V3 zabezpieczono ZIP-em, pomocnicze ankieta i plan pozostają lokalne i nie są częścią commita.

Nie było blokady bezpiecznego wykonania dokumentacyjnego etapu 00. Powyższe ryzyka nie upoważniają do ich naprawy w tym etapie.

## 8. Rollback i kontrola zakresu

- Cennik odzyskiwalny w całości z commita `56f946676b9421d1fd7ad3619c12ea954930b416`, także z origin/main w momencie audytu. [Manifest](dowody/manifest-cennika.json) zawiera Git blob SHA i SHA-256 21 plików: osobno zawartości Git i plików lokalnych (różnice końców linii są jawne).
- Oryginał V3 odzyskiwalny z wersjonowanego ZIP; rozpakować do **nowego katalogu**, sprawdzić SHA-256, dopiero potem zdecydować o odtworzeniu. Nie nadpisywać oryginalnej lokalizacji w ciemno.
- W tym etapie produkt nie wymaga rollbacku, bo pliki produkcyjne nie były zmieniane. Wycofanie dokumentacji, jeśli zlecone później: zwykły `git revert <commit-etapu-00>` na gałęzi integracyjnej, bez resetu i bez push main.
- Przyszłe zmiany cofać przez revert konkretnych commitów integracyjnych; nie wykonywać history rewrite/force-push. Publiczny rollback wymaga odrębnego polecenia i nie został wykonany.
- Przed commitem sprawdzono zakres indeksu; dodawany wyłącznie `docs/integracja-home-v3/`. Oryginały HTML, `index.html`, `assets`, scripts, tests, lockfile i workflow pozostają bez zmian względem bazy.

Etap 00 kończy się raportem i push gałęzi integracyjnej. **Zatrzymanie przed etapem 01.**

## Dodatek: obrazy osadzone V3

| Wystąpienia | Rola | MIME | Bajty po dekodowaniu | SHA-256 |
|---|---|---|---:|---|
| 1, 9, 16 | Logo: favicon, nagłówek, stopka | image/png | 137798 | c2b70cc3a29016f058abbd589efd83d3af8711357cc5c6d2d9689ad1f6e096c4 |
| 2, 3, 4 | Starsza fotografia tła HERO/kontaktu | image/jpeg | 86920 | c365a962637171d66ce3f8b292199a1ae1bb4dd6c643ba9b6d6ab1b114ea5e7f |
| 5 | PCB SVG w CSS | image/svg+xml | 1545 | 0908f1101aaa1c97c64d0357e1aab343cf39c5c330c170d07805cf7145e077fa |
| 6, 7, 8 | Fotografia latarni i zachodu (nadpisania HERO) | image/jpeg | 102349 | 50acdb685c79ba3bfce25e35d56922ab95fdbf4eb5af89a09a291caa67b97852 |
| 10 | Podpis lokalnego partnera | image/png | 227723 | 387254f8281e4d716ed5396914f2b1953d9aca5f79818fe5a5a3af43d1a585e7 |
| 11 | Zdjęcie usługi Internet | image/jpeg | 37294 | 61968ae3c93ff7bc21ee39ea278fe48004ce4e8f3d92123c57a9b7dc4ae9660c |
| 12 | Zdjęcie monitoringu | image/jpeg | 27408 | 5effb57ed007e35bd8cf994a7b829012e24d9ce784e887f1c3668b283135252d |
| 13 | Zdjęcie IT / sieci | image/jpeg | 38360 | 8aa2e3c498e69198bef87715916d94bebcc0d62094bebe53add2bf2b69d7ad15 |
| 14 | Zdjęcie WWW | image/jpeg | 36147 | 05a9b843673aa86dff77cc2040a80343218ed8d3b18c23ffbc75ff7660ba24ed |
| 15 | Zdjęcie anteny TV/SAT | image/jpeg | 33255 | 878cc33a9b7f65e97a41cde4ddd6ab6cc7a08069a35059977dd2e1c3a3b463f2 |
