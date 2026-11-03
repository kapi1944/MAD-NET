# RECOVERY 02 — finalizacja SC/APC, LINK/ACT i CI

Data: 2026-11-02, Europe/Warsaw. Worktree: C:/GitHub/Projects/MAD-NET-fiber-clean. Gałąź: feat/fiber-sc-apc-clean. Baza pracy: c726f655e82bbb7dd9c655c23ecc44cedecc1a49 (RECOVERY 01); baza względem main: 1987ad3aa8a65fd1aa86f077af1addf3225bb228. Nie zaczynano implementacji ponownie.

## Przyczyna błędu V20 i kontrola geometrii

Źródłowy PR #3 używał dla kanałów FIBER `kanal.querySelector('circle').getBBox()`. Uzupełnienie LINK/ACT w c36cfad zastąpiło wnętrze `.fiber-activity` prostokątem ACT i dodało osobny prostokąt LINK. `circle` przestał istnieć. Także LAN przestał kopiować bitmapę przez clip-path w `.rj-link`: ma teraz własny prostokąt ACT. AIR zachowuje ścieżki wycinania bitmapy i łuki radiowe. Zatem źródłem TypeError był historyczny selektor testu, nie brak kanału w modelu.

RECOVERY 01 wprowadził pierwszy pomiar `.dioda-link-szafy`. W tym etapie rozszerzono go przez tests/geometria-rack.mjs:

- dokładnie 13 kanałów: LAN 5, FIBER 3, AIR 5;
- jawna zgodność technologii, kolejności i nominalnej prędkości kanału;
- pomiar LINK i ACT, a w FIBER również każdego z trzech rzeczywistych adapterów;
- rozwiązanie identyfikatora clip-path dla AIR i pomiar jego prostokąta;
- `getBBox` i `getScreenCTM` rzeczywistego elementu, także lokalnego transform adaptera; clipPath przeliczany względem głównego SVG;
- rzeczywisty hit-test środka mierzonego kształtu przez elementFromPoint wobec właściwego przycisku data-rack-tech;
- brak kształtu, pusty obrys lub transformacja daje niezgodny wynik z danymi kanału, zamiast wyjątku na null.

Test V20 nadal sprawdza skalowanie, obszary interakcji, geometrię paneli, przepełnienia i 286 tras przewodów. Przy 1440 px wykonuje trzy próby negatywne: przesuwa adapter, przesuwa obszar kliknięcia i zmienia technologię kanału. Każde celowe uszkodzenie musi zostać wykryte, a atrybuty są przywracane bez niszczenia listenerów. Nie zmniejszano liczby portów ani progu pomiaru animacji: pozostał >=5000 ms.

## Wspólne środowisko testów

Wszystkie dziewięć testów przeglądarkowych korzysta z tests/srodowisko.mjs. Mechanizm jest ograniczony do testów i nie zmienia architektury strony.

- MADNET_PRZEGLADARKA ma pierwszeństwo i wskazuje executablePath; nie ma zapisanej lokalnej ścieżki.
- Windows/Chromium najpierw wybiera zainstalowany Microsoft Edge; przy braku dystrybucji próbuje Chromium Playwright.
- Linux/GitHub Actions używa zainstalowanego przez Playwright Chromium. PCB zachowuje wybór firefox/webkit przez dotychczasową zmienną.
- Błąd startu zawiera nazwę silnika, przyczynę i instrukcję instalacji lub ustawienia ścieżki.
- System wybiera wolny port. Jawne zmienne MADNET_PORT_* są sprawdzane przez bind; zajęty port powoduje błąd bez zatrzymywania obcego procesu. Dotyczy to także dawniej sztywnych portów LED i diagnostyki panelu.
- Gotowość serwera jest potwierdzana logiem PREVIEW; obsługiwane są error, przedwczesny exit i timeout 8 s. Test zamyka wyłącznie własny proces.

Nowe testy Node potwierdzają, że zajęty port pozostawia obcy serwer, wcześniejsze exit(2) nie zawiesza testu, a brak przeglądarki respektuje zmienną i daje instrukcję.

## Ostateczny LINK/ACT

Istniejąca implementacja spełnia najnowszą specyfikację; nie było potrzeby przepisywania kontrolera ani mapy stanyLink.

LINK jest zgaszony bez przewodu i podczas CONNECTOR_APPROACH/INSERTING; staje się zielony po CONNECTED. Przy fizycznym wysuwaniu pozostaje zielony w DISCONNECTING, a gaśnie przy odsłoniętym, rozłączonym wejściu COVER_OPEN. Przełączenie technologii i anulowanie usuwa stary stan. Jeden logiczny stan synchronizuje urządzenie, kartę, RACK i nagłówek tabeli.

ACT jest bursztynową demonstracją nominalnej prędkości, nie pomiarem ruchu. Pulsuje przed i po wpięciu; po podłączeniu rośnie jasność, bez zmiany częstotliwości i restartu. Test porównuje tożsamość obiektów Animation, ich rosnący currentTime, okres i kolor we wszystkich czterech reprezentacjach. Sprawdza też zależność tempa od prędkości, szybkie wybory, anulowanie, przełączenie technologii i reduced-motion. Diody pozostają poza pasywnymi adapterami SC/APC. AIR nie otrzymał portów ani LED.

## Spójność SC/APC

Poprawiono aktualne opisy, tekst SVG i aria-label w internet.html oraz hint formularza w dostepnosc.js. Podano polerowanie APC 8°. Symbol konektora i jego oznaczenie są zielone; pomarańczowy #FF7B19 pozostaje kolorem oferty. Nie zmieniono zatwierdzonego układu podstrony. Aktualne AGENTS.md, instrukcje manualne i README opisują standard SC/APC Simplex.

W styles.css zmieniły się wyłącznie komentarze starej implementacji, bez zmiany deklaracji CSS. Ich zgodność z aktywnym standardem i opisem jednej tulejki poprawiono; aktywny zielony model nadal dostarcza sprzet-fiber.css. Kontrola hashy w home.test.mjs zachowuje ochronę wszystkich zasobów: zaktualizowano dokładne hashe tylko dla świadomie zmienionych komentarzy CSS i hintu JS, bez wykluczania plików z testu.

Ponowne przeszukanie aktualnego interfejsu i dokumentacji użytkowej nie wykazuje SC/UPC; nowy test fiber.test.mjs chroni ten warunek. Pozostałe SC/UPC są świadomie historyczne: docs/archiwum/**, docs/prototypy/**, raporty HERO realizm 2/2.1, raport integracji V21, raport PCB, raport stanu HOME V3, źródłowe HTML MAD-NET_CENNIK_V21_WIELOKROTNE_TABELE_PORTY.html i MAD-NET_PLAN_INTERAKTYWNY_9_PROMPTOW_CODEX.html oraz paczka referencyjna MADNET_HERO_REALIZM_2_1_DO_REPO. Testy migracji normalizują historyczny standard podczas porównania źródeł. Nie przepisywano tych archiwów ani historii.

## Regresja i dowody

FIBER mierzy geometrię na 320, 360, 390, 430, 768, 1024, 1280, 1440 i 1920 px. Zachowano kontrole otwierania klapki przed wsuwaniem, górnej osi zawiasu, osi konektora, schowania ferruli za wargą adaptera, braku kolizji i ciągłości obu końców przewodu. Klapka zamyka się po wycofaniu wtyku. Weryfikowane są karta/tabela, jeden aktywny cel, szybkie zmiany, klawiatura, tap/przytrzymanie/scroll, orientacja i reduced-motion.

Zrzuty aktualnego przebiegu:

- [Tabela desktop](02-zrzuty/tabela-desktop.png).
- [Tabela mobile 390 px](02-zrzuty/tabela-mobile-390.png).
- [FIBER i LINK/ACT 320 px](02-zrzuty/fiber-led-320.png).
- [LAN i LINK/ACT 1440 px](02-zrzuty/lan-led-1440.png).

Pozostałe pomiary i logi są lokalne: recovery02-*.log oraz test-results/{fiber,v20,v21,panel,pcb-4-1,integracja-home-v3}/. CI archiwizuje również FIBER/LED i PCB. Workflow uruchamia test:browser (w tym FIBER i LINK/ACT) oraz osobno test:pcb; Chromium instalowane jest z zależnościami Linux.

Końcowe wyniki, SHA, PR i przebiegi CI zamieszczono poniżej po ich rzeczywistym zakończeniu.

## Wyniki lokalne — Windows / Microsoft Edge

Wszystkie polecenia uruchomiono, a nie wywnioskowano ich wyniku. Pierwszy lokalny pełny test:browser zakończył się kodem 0 bez ponawiania; zawiera diagnostykę, V20, V21, FIBER, LED, HOME, nawigację i ofertę. Osobne polecenia poniżej także wykonano do końca.

| Kontrola | Wynik | Dowód / zakres |
|---|---|---|
| npm run verify | PASS | końcowo 17/17 testów Node + build 9 stron |
| npm run test:browser | PASS | wszystkie zestawy w łańcuchu, kod 0 |
| npm run test:pcb | PASS | 9 szerokości, 360–2560 px, ruch i reduced-motion |
| npm run test:home | PASS | geometria/typografia V3, cennik, zasoby /MAD-NET/, brak błędów JS/konsoli |
| npm run test:nawigacja | PASS | klawiatura/dotyk/scroll, linki i dawne URL |
| npm run test:oferta | PASS | pięć stron, 30 układów, CTA, bez błędów JS/konsoli/HTTP |
| npm run test:fiber | PASS | 9 szerokości 320–1920 px, geometria i pełna sekwencja |
| npm run test:led | PASS | LAN/FIBER × 320/390/1440 px, 4 reprezentacje, ciągłość ACT |
| node --check dla JS/MJS w assets/js i tests | PASS | poprawna składnia wszystkich skryptów |
| git diff --check | PASS | bez błędów białych znaków |
| ceny i liczba pakietów | PASS | chronione dane PLAN_DATA/FEES zgodne z 1987ad3 |
| HOME V3 i izolacja HERO V4 | PASS | index.html, home.css, home.js bez zmian względem RECOVERY 01/main |
| fizyczny telefon | SKIP | gesty sprawdzono w emulacji Edge/Chromium |

Pierwszy commit implementacji i testów: d9f4f331ee4b198a5c1f638da5b465e598fbddb1. [PR #5](https://github.com/kapi1944/MAD-NET/pull/5) do main, gałąź feat/fiber-sc-apc-clean. Raport i zrzuty są osobnym uzupełnieniem dokumentacji tej implementacji.

## Ograniczenia i zachowany zakres

To ilustracja SVG/CSS, nie model CAD ani pomiar ruchu sieciowego. Testy porównania obrazów HOME dopuszczają różnice animowanych pikseli; PASS oznacza też sprawdzoną geometrię, typografię i interakcje, nie identyczność każdego bajtu zrzutu. Formularz nadal korzysta z dotychczasowego kontraktu backendu; nie dodawano SMTP ani integracji.

Adaptery, kontroler połączeń, mechanika kabli, pakiety i ceny pochodzą z istniejącego Etapu 05. Produkcyjne korekty tej finalizacji obejmują spójne teksty/oznaczenia SC/APC, kolor symbolu złącza na podstronie Internet i stałe miejsce na mobilną instrukcję FIBER, usuwające anulowanie przytrzymania przez kotwiczenie przewijania. Zmiany wspólne są ograniczone do środowiska testowego, regresji i CI. Nie przeniesiono HERO V4 ani arkuszy biznesowych.

Oryginalne gałęzie PR #3 i PR #4 zachowują SHA c36cfad21655bb8966bbe808b2e62e317786f554 oraz 3146838e19f3838fd955b50c6d4063bf3977e387. main zachowuje 1987ad3aa8a65fd1aa86f077af1addf3225bb228. Nie wykonano merge ani publikacji Pages. RECOVERY 03 nie rozpoczęto.

## Błędy wykryte podczas pierwszego CI i ich przyczyny

Pierwszy lokalny komplet był zielony, ale CI d9f4f33 ujawnił dwa niezależne problemy scenariusza V20:

1. [Run PR 41360985904](https://github.com/kapi1944/MAD-NET/actions/runs/41360985904): `Skok panel.y po wyborze LAN: 171 → 206.328125`. Sekcja klawiatury zapisywała geometrię bez oczekiwania na pierwszy pomiar panelu w requestAnimationFrame/ResizeObserver, choć pętla szerokości już czekała na `document.fonts.ready` i `--panel-wysokosc`. Wartość początkowa odpowiadała fallbackowi CSS `top:80px`, a końcowa właściwej pozycji wyliczonej z tylnej ściany szafy. Ujednolicono przygotowanie wzorca dla szerokości, klawiatury i dotyku: fonty, pomiar panelu i dwie klatki renderowania. Samo porównanie po interakcji nadal wymaga różnicy <1 px, bez zmiany tolerancji i bez nadpisywania wzorca.
2. [Run push 41360980634](https://github.com/kapi1944/MAD-NET/actions/runs/41360980634): timeout sprawdzWybor po późniejszym hover. Po wyborze klawiaturą kursor mógł nadal leżeć nad innym urządzeniem; ponowne Playwright hover w tym samym miejscu nie powoduje nowego pointerenter, na którym opiera się istniejąca logika. Odtworzono to na rzeczywistej stronie: kursor nad LAN, fokus FIBER, ponowne hover LAN pozostawia FIBER; dopiero opuszczenie i nowe wejście wybiera LAN. Scenariusz V20 wyprowadza teraz kursor na (0,0) przed ponownym wejściem. Nadal sprawdza rzeczywisty wybór panelu i nie resetuje go przez skrypt.

Nie zmieniano produkcyjnego panelu ani kompozycji HERO w celu obejścia tych błędów. Poprawki ograniczono do poprawnego przygotowania i wykonania działań w teście. Po nich ponowiono verify, pełne test:browser i PCB; osobne pozostałe polecenia były już wykonane, a ich zestawy są ponownie wykonywane przez pełny test:browser. Próg animacji 5000 ms zachowano. Wyniki nieudanych przebiegów pozostają w historii Actions i lokalnych recovery02-ci-*-failure.log.

Po ponownej weryfikacji lokalnej poprawkę scenariuszy V20 zapisano w 57591c19a80db23d043a09368e72a720f9b3e1f0. Zmienia wyłącznie tests/v20.browser.mjs (przygotowanie wzorca i rzeczywiste ponowne wejście kursora). Ponowiony verify ma 17/17 PASS, pełny test:browser i PCB zakończyły się kodem 0. Po zmianie działania hover wykonano także odrębne odtworzenie problemu i poprawnego nowego wejścia na rzeczywistej stronie. Obie tolerancje pozostały bez zmian: geometria <1 px i pomiar animacji >=5000 ms.

### Drugi przebieg CI: synchronizacja testu FIBER

Dla 57591c1 V20 przeszedł w Linux/Chromium, w tym klawiatura, dotyk, 13 kanałów i 286 tras. Dalszy zestaw FIBER ujawnił dwa odczyty zależne od tempa renderowania:

- [Push 41362240396](https://github.com/kapi1944/MAD-NET/actions/runs/41362240396): po usunięciu tabeli logiczny stan IDLE był już ustawiony, ale test odczytał poprzednie d przewodu przed klatką scheduleLinks. Zachowano asercję pustego d i poprzedzono ją warunkowym oczekiwaniem na jego rzeczywiste wyczyszczenie; brak wyczyszczenia nadal kończy test błędem.
- [PR 41362244384](https://github.com/kapi1944/MAD-NET/actions/runs/41362244384): początkowy long press nie uzyskał podglądu. Scenariusz używał stałych 200 ms po scrollIntoViewIfNeeded i 500 ms po touchStart przy progu przytrzymania 420 ms. Dalsze przewijanie prawidłowo anuluje dotyk w kodzie strony. Test używa teraz istniejącej kontroli stabilnego scrollY przez dziesięć kolejnych klatek, oczekiwania na fonty i rzeczywisty podgląd z ograniczeniem czasu. Dodatkowo hit-test sprawdza, że punkt CDP trafia w odsłonięte FIBER-50M, a dotychczasowa asercja dokładnie jednej .plan.is-hovered pozostaje aktywna. Nadal sprawdzane są brak wyboru, zamknięta klapka, zanik podglądu po puszczeniu i brak przypadkowego wyboru podczas scrolla.

Te korekty dotyczą wyłącznie tests/fiber.browser.mjs. Nie wydłużano ani nie zmieniano produkcyjnego progu long press i nie usuwano kontroli geometrii/gestów. Ponowny pełny CI obejmuje wszystkie zestawy po zaliczeniu lokalnego verify i regresji FIBER/LED.

Korektę synchronizacji FIBER zapisano w 5f4169588abbe1fe3d3d212f5250e5d74832faf0 po lokalnym PASS: verify 17/17, test:fiber i test:led. Ponowny pełny przebieg CI uruchomiono dla tego SHA. Zrzuty w raporcie skopiowano z zaliczonych lokalnych przebiegów FIBER i LED.

### Dokładna przyczyna anulowania long press — ślad z Chromium Linux

Oczekiwanie przed dotykiem nie mogło rozwiązać problemu, ponieważ scroll powstawał dopiero po włączeniu podglądu. [Run diagnostyczny PR 41364012268](https://github.com/kapi1944/MAD-NET/actions/runs/41364012268), SHA 036defe961ff21eddee0df830ac30c85abbfd242, zapisał:

- pointerdown w FIBER-50M: performance.now 520.4 ms, scrollY 3776;
- timer przytrzymania zdążył ustawić held=true;
- scroll przy 952.1 ms: scrollY 3772;
- po anulowaniu podglądu scroll przy 968.1 ms: scrollY ponownie 3776;
- brak pointermove/pointercancel; widoczność visible, fokus true; sesja ostatecznie held=true, moved=true, podgląd null.

Zmiana tekstu #device-guide podczas setHover zmieniała wysokość instrukcji zależnie od fontu. Scroll anchoring przeglądarki kompensował tę różnicę, a istniejące zabezpieczenie przed przewijaniem prawidłowo anulowało gest. W kontrolowanej reprodukcji z fontem monospace przy 390 px instrukcja kurczyła się z 24 do 18 px; po poprawce zachowuje 26 px w obu stanach.

Poprawka produkcyjna jest lokalna: w sprzet-fiber.css, wyłącznie dla .tech-FIBER przy szerokości <=560 px, instrukcja ma min-height:2.6em. Nie ignorujemy scrolla i nie zmieniamy progu ani kontrolera gestu. To usuwa przyczynę ruchu strony zamiast osłabiać ochronę dotyku.

Do regresji FIBER dodano pomiar stałej wysokości instrukcji także z fontem zastępczym na małych szerokościach oraz ścisłą kontrolę, że scrollY nie zmienia się po rozpoczęciu podglądu. Dotychczasowe asercje podglądu, pustej selekcji, klapki i przewijania pozostają aktywne. Testy FIBER/LED przeniesiono na początek test:browser, zachowując cały dotychczasowy zestaw, aby błędy sprzętu były zgłaszane przed długą regresją V20. Ślad i screenshot zapisują się wyłącznie przy błędzie.

Poprawka układu i nowa regresja są w 9eae3324eb8ef9258ee5756c3e81149415c7a8f5. Po niej lokalny verify (17/17), pełny test:browser i test:pcb przeszły. Pierwszy zestaw w test:browser potwierdził FIBER/LED, a dalsze zestawy potwierdziły zachowanie V20, V21, HOME, nawigacji i pięciu usług. Końcowe zrzuty w raporcie pochodzą z tego zaliczonego przebiegu.

## Końcowy wynik CI dla kodu

STATUS: PASS. Kod implementacji i testów: **9eae3324eb8ef9258ee5756c3e81149415c7a8f5**. [PR #5](https://github.com/kapi1944/MAD-NET/pull/5) pozostaje otwarty i niescalony.

| GitHub Actions / Linux / Chromium | Wynik |
|---|---|
| [PR — 41365089315](https://github.com/kapi1944/MAD-NET/actions/runs/41365089315) | PASS / success |
| [Push — 41365084448](https://github.com/kapi1944/MAD-NET/actions/runs/41365084448) | PASS / success |
| testy Node, build i artefakty | PASS |
| pełny test:browser, w tym FIBER i LINK/ACT | PASS |
| osobna regresja PCB | PASS |

Wyniki odczytano z zakończonych przebiegów oraz ich rzeczywistych logów. Linux zaliczył long press bez skoku przewijania, geometrię SC/APC na dziewięciu szerokościach, LINK/ACT we wszystkich reprezentacjach, V20 z progiem >=5000 ms, V21, HOME, nawigację i pięć podstron usług. Wcześniejsze czerwone przebiegi opisane powyżej pozostają historycznym dowodem diagnostyki i nie są przedstawiane jako PASS.

Pozostałe blokady: brak. Fizyczny telefon pozostaje niewykonanym testem manualnym, przy wykonanej emulacji dotyku w Edge i Chromium. Nie zmieniono cen ani liczby pakietów; nie przeniesiono HERO V4. Nie wykonano merge do main ani publikacji Pages. Ten raport, cztery zrzuty i doprecyzowanie README są uzupełnieniem dokumentacji powyższego kodu; po ich wysłaniu także sprawdzono CI dla końcowego HEAD, którego SHA i wynik podano w odpowiedzi końcowej.
