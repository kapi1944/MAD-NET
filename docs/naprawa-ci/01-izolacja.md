# RECOVERY 01 — izolacja Etapu 05

Data audytu: 2026-11-01 (Europe/Warsaw). Zakres: lokalna izolacja istniejącej implementacji; bez push, nowego PR, scalania ani publikacji Pages.

## Stan początkowy i źródła

Po `git fetch origin` lokalne `main` i `origin/main` wskazywały `1987ad3aa8a65fd1aa86f077af1addf3225bb228` (scalony Etap 04 / PR #2). Ten sam SHA jest merge-base obu PR-ów. Nie zakładano zgodności ze stanem historycznym.

| Worktree początkowe | Gałąź / HEAD | Stan |
|---|---|---|
| C:/GitHub/Projects/MAD-NET | codex/fiber-sc-apc-etap05 / c36cfad21655bb8966bbe808b2e62e317786f554 | czysty |
| C:/GitHub/Projects/MAD-NET-hero-v4 | codex/home-hero-premium-v4-isolated / 3146838e19f3838fd955b50c6d4063bf3977e387 | czysty |
| C:/GitHub/Projects/MAD-NET-hover | codex/pcb-red-traces-4-1 / 2c1070655b08d5dc3fc79ba7c5b330e987004e70 | czysty |
| C:/Users/Kacper/.codex/artifacts/madnet-etap05-weryfikacja | detached / 49c54f831eb69a54b7023366a8437f3368b4f202 | czysty |

Nie było lokalnych niezacommitowanych zmian ani istniejącego katalogu/gałęzi docelowej. Sprawdzono gałęzie lokalne/zdalne, wszystkie worktree, log i reflog. Dotychczasowe punkty kontrolne zachowano: 49c54f8 (podstawowy FIBER, także osobny worktree), c36cfad (FIBER + LINK/ACT), 3146838 (izolowany HERO V4), historyczne commity `zapis`: e92ef06, 32002be, 26cf06b. Brak tagów. Lokalna feat/home-hero-premium-v4 pozostawała na bazie 1987ad3; właściwy aktualny HEAD PR #4 odczytano z GitHub i origin/feat/home-hero-premium-v4.

Historia PR #3 (wszystkie commity pozostają dostępne i niezmienione):

- 49c54f831eb69a54b7023366a8437f3368b4f202 — podstawowy FIBER SC/APC i klapki.
- fd8bbae408b2fbe82a05a0ba31677b4e9ba307c2 — mimo tytułu „APC SC” zawiera HERO V4 i jego testy/zrzuty; pominięty.
- 261f11f99c9d812cccdcf1740aeb50d307e68bb3 — arkusze/panel decyzji cenowych; pominięty.
- 1cf5bf434ce8ba40b6b244cbda6e52afa619dad1 — formularz decyzyjny; pominięty.
- c36cfad21655bb8966bbe808b2e62e317786f554 — synchronizacja LINK/ACT; źródło końcowych plików sprzętu i integracji.

PR #4: 3146838e19f3838fd955b50c6d4063bf3977e387, origin/feat/home-hero-premium-v4; nie używano jako źródła implementacji.

## GitHub Actions w chwili audytu

- [PR #3](https://github.com/kapi1944/MAD-NET/pull/3): OPEN, HEAD c36cfad; [run 41351248073](https://github.com/kapi1944/MAD-NET/actions/runs/41351248073) FAILURE. V20 kończy się TypeError getBBox na null, tests/v20.browser.mjs:187: stary selektor circle nie odpowiada prostokątnym diodom LINK/ACT.
- [PR #4](https://github.com/kapi1944/MAD-NET/pull/4): OPEN, HEAD 3146838; [run 41351011741](https://github.com/kapi1944/MAD-NET/actions/runs/41351011741) FAILURE (skok panel.y LAN 171 → 206.328125); [run 41350971248](https://github.com/kapi1944/MAD-NET/actions/runs/41350971248) SUCCESS dla tego samego HEAD. Niestabilność V4 pozostaje poza zakresem.
- main 1987ad3: jakość [41320415289](https://github.com/kapi1944/MAD-NET/actions/runs/41320415289) SUCCESS. Istniejąca publikacja Pages [41320414921](https://github.com/kapi1944/MAD-NET/actions/runs/41320414921) SUCCESS pochodzi sprzed tej pracy. RECOVERY 01 nie uruchamia publikacji.
- Nowa gałąź lokalna nie ma jeszcze wyniku CI na GitHub; nie wysyłano zmian i nie ponawiano workflow.

## Podział zakresów i pliki współdzielone

A = HERO V4; B = FIBER SC/APC; C = LINK/ACT; D = wspólne testy i dokumentacja; E = dokumenty biznesowe.

| Plik / grupa | Zakres | Decyzja |
|---|---|---|
| index.html | A | pozostaje dokładnie z main, HOME V3 |
| assets/css/home.css | A | pozostaje dokładnie z main |
| assets/css/hero.css | A | nie dodano |
| assets/js/cennik.js | B + C | przeniesiono sprzęt, stan, geometrię, tabelę i LED; dane PLAN_DATA/FEES bez zmian |
| assets/js/sprzet-fiber.js, assets/css/sprzet-fiber.css | B + C | przeniesiono; nakładka istniejącego RACK dotyczy FIBER i LED, nie kompozycji HOME V4 |
| assets/js/dostepnosc.js | B | wyłącznie delegacja wyboru pakietu także z gniazda tabeli |
| assets/js/hero-rack.js | B | wyłącznie opis SC/APC |
| cennik.html | B | style/skrypt sprzętu, SC/APC, instrukcja gniazd; bez zmian cen/formularza |
| tests/home.browser.mjs | A + B + D | tylko fragmenty FIBER z 49c54f8; bez zmian V4 z fd8bbae/PR #4 |
| tests/home.test.mjs | B + D (także A w PR #4) | zachowano wszystkie kontrole chronionych zasobów i pełnego main; dozwolone różnice jawnie ograniczono |
| tests/v20.browser.mjs | B + C + D | oczekiwanie na CONNECTED FIBER i pomiar nowych diod; pozostałe asercje zachowane |
| tests/v21.browser.mjs | B + C + D | interaktywne gniazda FIBER; zachowano dawną asercję reduced-motion i dodano kontrolę wskaźnika SC |
| tests/fiber.browser.mjs | B + D | przeniesiono |
| tests/led.browser.mjs | C + D | przeniesiono; wybór Edge/Chromium/ścieżki środowiskowej zgodny z pozostałymi testami |
| package.json | B + C + D | test:fiber i włączenie regresji FIBER/LED; bez nowych zależności |
| README.md, docs/ARCHITEKTURA.md | B + D; A w PR #4 | tylko opis FIBER, test i kolejność skryptów; bez opisu HOME V4 |
| docs/DECYZJE.md, docs/fiber-etap05/RAPORT.md | B + C + D | dokumentacja techniczna, raport źródłowy zachowany jako historyczny |
| AGENTS.md | B + D | nie przeniesiono zmiany polityki repo; dokument docelowy pozostaje z main |
| docs/hero-v4/** | A + D | pominięto wszystkie zrzuty/raporty V4 |
| MAD-NET_Cennik_4x3_Scenariusze_i_Decyzje.xlsx | E | pominięto |
| MAD-NET_Cennik_4x3_Umowy_12_24_Bezterminowo_v2.xlsx | E | pominięto |
| MAD-NET_Panel_Decyzyjny_Cennik_4x3.html | E | pominięto |
| MAD-NET_Formularz_Decyzyjny_4x3_VIP_Korzysci_v4.html | E | pominięto |

Pliki mające więcej niż jeden zakres wskazano w tabeli. Wspólne ścieżki obu PR-ów: index.html, assets/css/home.css, assets/css/hero.css, tests/home.browser.mjs, tests/home.test.mjs, README.md, docs/ARCHITEKTURA.md i zrzuty docs/hero-v4/{przed,po}/. Samo współdzielenie ścieżki nie oznacza przenoszenia obu zestawów zmian.

## Sposób izolacji i konflikty

Utworzono worktree C:/GitHub/Projects/MAD-NET-fiber-clean i feat/fiber-sc-apc-clean bezpośrednio z aktualnego origin/main (1987ad3). Usunięto automatyczne śledzenie origin/main z nowej gałęzi, aby nie sugerować celu przyszłego push. Nie używano cherry-pick ani operacji reset/clean/stash/rebase/force-push.

Wybrane pliki runtime odtworzono z c36cfad. Ich różnice względem main obejmują wyłącznie B/C. Plik tests/home.browser.mjs pobrano z 49c54f8, co oddziela fragmenty FIBER od późniejszego redesignu w tej samej ścieżce. README i ARCHITEKTURA z PR #3 nie zawierały zmian V4 z PR #4.

Brak konfliktów merge (nie wykonywano merge). Wykryte zależności integracyjne testów:

1. Hash chronionych plików na świeżym Windows worktree różnił się wskutek CRLF. Normalizacja dotyczy wyłącznie tekstowych CSS/JS/SVG; obrazy nadal sprawdzane bajtowo. Dla trzech legalnie zmienionych JS zapisano dokładne hashe LF Etapu 05 zamiast wykluczać pliki z kontroli.
2. Nie przeniesiono osłabienia tests/home.test.mjs z PR #3: nadal sprawdzany jest cały main cennika, z jawną normalizacją tylko SC/APC i dokładnego tekstu instrukcji gniazd. Dodatkowo PLAN_DATA i FEES muszą być identyczne z main.
3. V20 zachowuje sprawdzanie skalowania i trafienia w obszar wyboru; dla zmienionych LED mierzy .dioda-link-szafy zamiast nieistniejącego circle. Nadal sprawdza każdy z 13 kanałów.
4. V21 zachowuje pierwotną kontrolę reduced-motion dla ACT; dodano kontrolę SC, zamiast zastępować poprzednią asercję.

## Pliki zmienione na czystej gałęzi

- README.md
- assets/css/sprzet-fiber.css
- assets/js/cennik.js
- assets/js/dostepnosc.js
- assets/js/hero-rack.js
- assets/js/sprzet-fiber.js
- cennik.html
- docs/ARCHITEKTURA.md
- docs/DECYZJE.md
- docs/fiber-etap05/RAPORT.md
- docs/naprawa-ci/01-izolacja.md
- package.json
- tests/fiber.browser.mjs
- tests/home.browser.mjs
- tests/home.test.mjs
- tests/led.browser.mjs
- tests/v20.browser.mjs
- tests/v21.browser.mjs

## Weryfikacja RECOVERY 01

Wyniki końcowe dopisano poniżej po zakończeniu uruchomionych testów. Historyczne wyniki w docs/fiber-etap05/RAPORT.md dotyczą źródła i nie zastępują bieżącej weryfikacji.

### Wyniki końcowe

- `npm run verify`: PASS, 13/13 testów, build 9 HTML + assets.
- `node --check` dla wszystkich JS/MJS w assets/js, scripts i tests: PASS.
- `git diff --check`: PASS (ostrzeżenia Git o automatycznej konwersji LF/CRLF nie są błędami diff).
- Kompletność lokalnych zasobów i build: PASS. Osobno potwierdzono obecność skryptów sprzętu w źródle/dist i kolejność sprzet-fiber → cennik → dostepnosc → hero-rack → nawigacja → wybor-technologii.
- HOME V3 (index, home.css, home.js), pięć HTML usług i wybor-technologii.js: identyczne tekstowo z origin/main po normalizacji końców linii. hero.css nie dodano.
- 11 plików sprzętu/integracji/testu FIBER i dokumentacji odpowiada dokładnie źródłu c36cfad (normalizacja CRLF). Nie odtwarzano implementacji od nowa.
- Diagnostyka panelu: PASS na wielu szerokościach, podświetlenie i reduced-motion.
- V20: PASS, 22 szerokości 360–1920 px, 13 kanałów, 286 tras bez kolizji, ceny/okresy, klawiatura, dotyk i scroll. Błąd getBBox źródłowego PR #3 nie wystąpił po dostosowaniu selektora.
- V21: PASS, osiem szerokości × osiem kombinacji tabel, 13 miniportów, formularz/geokodowanie/mapa i reduced-motion.
- FIBER: PASS, 360/390/430/768/1024/1280/1440/1920 px, otwieranie/zamykanie klapki, wsuwanie/odłączanie, geometria karty/tabeli, szybkie przełączanie i anulowanie, klawiatura, tap/przytrzymanie/scroll, orientacja, reduced-motion; brak błędów JS/konsoli.
- LINK/ACT: PASS, LAN i FIBER na 390/1440 px, zgaszony/zielony LINK, brak obcych aktywnych portów, bursztynowy ACT i ciągłość animacji.
- HOME i cennik: PASS na 390/768/1024/1440/1920 px, geometria/typografia, mapa/PCB/linki, smoke pod /MAD-NET/, odpowiedzi HTTP zasobów i brak błędów JS/konsoli. Test obrazów dopuszcza różnice animowanych pikseli; nie jest dowodem identyczności każdego zrzutu bajt w bajt.
- Nawigacja: PASS, hover/focus/Tab/Enter/Space/Escape, dotyk/scroll, brak overflow oraz 12 przekierowań dawnych adresów pod / i /MAD-NET/.
- Pełne `npm run test:browser` zakończyło się kodem 1 dopiero w ostatnim zestawie oferta: `route.fetch: read ECONNRESET` dla lokalnego /assets/img/home/usluga-it.jpg podczas testu /MAD-NET/sieci-it.html. Wszystkie wcześniejsze zestawy przeszły. Nie zmieniano serwera ani testu usług w celu obejścia błędu.
- Ponowienie wyłącznie `npm run test:oferta`: PASS, kod 0, pięć stron × sześć szerokości = 30 układów, CTA/dotyk/klawiatura/reduced-motion, brak błędów JS/konsoli/HTTP. Błąd połączenia nie odtworzył się. Nie powtarzano wszystkich wcześniejszych zaliczonych zestawów.
- Obejrzano aktualne zrzuty 05-tabela-desktop.png i 09-tabela-mobile-390.png: zielone gniazda/konektory, klapki, trasa przewodu i zachowane ceny FIBER.

Logi lokalne (ignorowane przez Git): test-results-recovery-browser.log, test-results-recovery-oferta.log. Pomiary i zrzuty: test-results/fiber/po/, test-results/fiber/led/ oraz standardowe katalogi testów V20/V21/HOME/nawigacji/ofert. Raport źródłowy FIBER oznaczono odsyłaczem jako historyczny.

## Zabezpieczenie końcowe i gotowość

STATUS RECOVERY 01: PASS. Brak blokad izolacji; gałąź gotowa do RECOVERY 02. Znane ograniczenie testów: pierwszy pełny przebieg miał przejściowy ECONNRESET w niezmienionym zestawie ofert, a jego osobne powtórzenie przeszło. Wynik CI dla nowej gałęzi pozostaje do uzyskania po osobno zleconym push. Testy dotyku są emulacją Edge/Chromium, bez fizycznego telefonu.

Punkt kontrolny to lokalny commit obejmujący ten raport na feat/fiber-sc-apc-clean; jego pełny SHA podano w odpowiedzi końcowej (raport nie zapisuje własnego hasha). Oryginalne cztery worktree po testach pozostają czyste; ich HEAD, main i obie gałęzie PR-ów zachowują początkowe SHA. PR #3/#4 pozostają otwarte i nietknięte. Nie wykonano push, nowego PR, merge do main ani publikacji GitHub Pages. Nie utracono zmian użytkownika. RECOVERY 02 nie rozpoczęto.
