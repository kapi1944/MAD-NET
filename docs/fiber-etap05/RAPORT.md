# Etap 05 — sprzęt FIBER i LINK/ACT

Data: 2026-11-01. Gałąź: codex/fiber-sc-apc-etap05. Implementacja podstawowa: 49c54f8; późniejsze zmiany właściciela pozostawiono w historii.

## Audyt i wykonanie

Cennik renderuje urządzenie centralne i karty przez socketHtml w assets/js/cennik.js. Nagłówki tabel były dekoracyjne. HERO używa bitmapy z warstwą SVG. Podstrony usług nie renderują tych komponentów; odsyłają do cennika.

Wspólne symbole SVG adaptera, ceramicznej ferruli z pochyleniem 8°, konektora push-pull, żłobień i osłony przeciwzgięciowej znajdują się w assets/js/sprzet-fiber.js. Zastąpiono niebieskie elementy zielonymi SC/APC Simplex. W HERO dodano panel adapterów w istniejącej warstwie SVG; bitmapa pozostaje zachowana. Oferta FIBER pozostaje pomarańczowa.

Gniazda tabel mają przestrzenną ramkę, transparentną klapkę z górnym zawiasem i obrót 108°. Kontroler w cennik.js obsługuje otwieranie, wyrównanie, rysowanie kabla, wsuwanie, zatrzaśnięcie i odwrotną sekwencję. Anulowanie usuwa oczekiwanie i klatki animacji. Jeden pakiet ma jeden cel kabla: karta albo wybrane gniazdo tabeli. Punkty styku mierzone są z DOM. Zachowano świadomy tap, podgląd przez przytrzymanie i anulowanie gestem przewijania. Wybór z tabeli trafia także do istniejącego formularza zainteresowania.

LINK korzysta z jednej mapy stanów pakietów: jest wyłączony w pustych portach i podczas wsuwania, zielony po zakończeniu połączenia, gaśnie po wysunięciu. Reprezentacje urządzenia, karty, tabeli i RACK są zsynchronizowane. ACT pulsuje bursztynowo bez restartu po podłączeniu; zmienia się jasność, a nie okres. RJ-45 ma LED w narożnikach obudowy; SC/APC ma wskaźniki poza pasywnym adapterem. AIR nie zmieniono. ACT to demonstracja oferty, nie pomiar ruchu.

## Pliki

- assets/js/sprzet-fiber.js, assets/css/sprzet-fiber.css — wspólny sprzęt, materiały, klapki i diody.
- assets/js/cennik.js — stan połączenia, geometria, LED, gesty i wybór pakietu.
- assets/js/dostepnosc.js — delegacja wyboru pakietu również z tabeli; bez zmian backendu.
- assets/js/hero-rack.js, cennik.html — opisy SC/APC i wczytanie modeli.
- tests/fiber.browser.mjs — mechanika, kolizje, 8 szerokości, klawiatura, gesty i reduced-motion.
- tests/led.browser.mjs — LINK/ACT LAN i FIBER, desktop/mobile, rzeczywiste kolory i ciągłość okresu animacji.
- tests/v20.browser.mjs, tests/v21.browser.mjs, tests/home.browser.mjs, tests/home.test.mjs — dostosowanie kontraktów do zaakceptowanej modernizacji.
- package.json — włączenie regresji FIBER i LED.
- AGENTS.md, README.md, docs/ARCHITEKTURA.md, docs/DECYZJE.md — aktualny standard i kolejność skryptów.

## Testy

PASS: npm run verify (13 testów i build dziewięciu stron).
PASS: tests/fiber.browser.mjs — 360/390/430/768/1024/1280/1440/1920 px, otwieranie przed wsuwaniem, odwrotne odłączanie, szybkie zmiany, synchronizacja, orientacja, reduced-motion i rzeczywiste gesty Chromium. Brak wyjątków JS.
PASS: tests/led.browser.mjs — 390 i 1440 px, LAN/FIBER, LINK wyłączony/zielony/wyłączony, brak zielonych obcych portów, bursztynowy ACT i niezmieniony okres/currentTime animacji po połączeniu.
PASS: V20 przed uzupełnieniem LED — 286 tras bez kolizji, ceny i 13 kanałów. PASS: V21, nawigacja i pięć podstron usług. Pełny test:browser podstawowej implementacji w izolowanym worktree 49c54f8 zakończył się kodem 0. Po uzupełnieniu LED ponowiono verify oraz regresje FIBER, LED i V21; nie powtarzano całej wielominutowej regresji HOME.

W mieszanym wcześniejszym stanie prac HOME test porównania pikseli mapy bywał niestabilny; osobna kopia podstawowego etapu przeszła pełny zestaw. Nie zmieniano mapy HOME w celu ukrycia tej różnicy.

## Weryfikacja wizualna

Artefakty lokalne: C:/GitHub/Projects/MAD-NET/test-results/fiber/po/ — 01-panel-rack.png, 02-gniazdo-zamkniete.png, 03-klapka-otwarta-wtyk-przed.png, 04-gniazdo-polaczone.png, 05-tabela-desktop.png, 06-karta-wtyk-przed.png, 07-karta-polaczona.png, 08-fiber-desktop.png, 09-tabela-mobile-390.png oraz wyniki.json. Dodatkowo test-results/fiber/led/ zawiera zrzuty wskaźników. Sprawdzono renderowanie w Edge/Chromium.

## Ograniczenia

Model jest precyzyjną ilustracją SVG/CSS, nie symulacją optyczną ani CAD. Testy dotyku wykonano w emulacji Chromium, bez fizycznego telefonu. Formularz nadal wymaga istniejącego osobnego backendu; etap nie wdraża SMTP. Nie wykonano merge do main ani publikacji produkcyjnej. Zrzuty i logi testów pozostają lokalnymi artefaktami ignorowanymi przez Git.
