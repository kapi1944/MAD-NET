# HERO 3.0 — integracja zaakceptowanej szafy

Użytkownik zaakceptował `docs/prototypy/hero-3-0/rack-finalny.png` i polecił umieszczenie szafy w HERO. Integracja na gałęzi `codex/hero-3-0-integracja`, potomnej `codex/hero-3-0-proof`. Bez merge do main ani publikacji witryny.

## Wygląd i geometria

- `assets/img/hero-rack.png` to identyczna kopia zaakceptowanego PNG, z jego materiałami, logo i 12 śrubami. Test sprawdza SHA-256 bitmapy. Nie dodawano fikcyjnych śrub HTML, aby spełnić dawny test modelu CSS.
- `assets/css/hero-hybryda.css` lokalnie zastępuje wygląd dawnego modelu. Obraz i nakładka używają jednego SVG `viewBox="100 40 1350 970"`, który usuwa wyłącznie przezroczyste marginesy. Proporcje pozostają zachowane.
- Trzy natywne przyciski mają wielokątne obszary odpowiadające frontom urządzeń. Etykiety dostępności podają technologię i liczbę kanałów. Klawiatura, mysz i dotyk nadal korzystają z niezmienionego `hero-rack.js`.
- Panel pozostaje pod szafą w kolejności warstw. Jego pomiar korzysta z procentowo zakotwiczonej tylnej krawędzi obrazu. Treść znajduje się poza bokiem, a wysokość panelu jest mniejsza od tylnej krawędzi. Na tablecie i telefonie panel przechodzi poniżej.

## Kontrolki

Pięć zielonych LED LAN animuje wycinki zaakceptowanej bitmapy. Lokalnie skorygowana grafika `assets/img/hero-rack-baza.svg` usuwa niebieskie piksele pięciu symboli AIR, zastępując je próbką struktury z pasa tego samego panelu (y=650–674). Oryginalny PNG pozostaje niezmieniony. SVG osadza oryginał, aby działać jako samodzielny obraz. Nakładka w tym samym układzie współrzędnych rozdziela oryginalne piksele każdego symbolu na trzy pierścieniowe wycinki łuków i stały punkt. Mały, średni i duży łuk rozbłyskują kolejno z przesunięciem o 22% okresu danego kanału. Nie pulsują całe symbole ani urządzenia. Trzy małe kontrolki FIBER nad adapterami animują się oddzielnie; fizyczne adaptery pozostają częścią obrazu.

Zachowane okresy: LAN 5000/2500/1250/714/455 ms, FIBER 1000/333/167 ms, AIR 2400/1818/1224/923/741 ms oraz fazy LED. Hover i wybór technologii nie resetują zegarów innych kanałów. Reduced motion i istniejący przełącznik animacji zatrzymują całą nakładkę.

## Weryfikacja

- `npm run verify`: testy struktury, składnia JS i build.
- `npm run test:browser`: 360, 390, 430, 760, 768, 1024, 1100, 1280, 1440, 1510, 1920 px; geometria panelu, brak poziomego overflow, trafność obszarów wyboru, hover, Tab/Enter/Space, tapnięcia i przewijanie.
- Test przelicza środki wszystkich 13 wycinków przez rzeczywistą macierz SVG i sprawdza, że trafiają w przycisk właściwego urządzenia na każdej szerokości. Testowane są dokładne częstotliwości, rzeczywista zmiana opacity przez ponad 5 sekund i ciągłość zegarów po przełączaniu technologii.
- Regresja V21: 64 kombinacje tabel, 13 miniportów, formularz, ręczna lokalizacja i awaria mapy. 143 trasy bez kolizji. Bez wyjątków JS i błędów konsoli.
- HTML od cennika do końca dokumentu, skrypty cennika i formularza, dane ofertowe, mapa oraz animacje przewodów pozostały bez zmian.

Screenshot bazowy: `test-results/hero-3-0/przed-integracja-1440.png`. Po integracji: `test-results/v20/po/hero-{szerokość}.png` i `test-results/hero-3-0/integracja-{szerokość}.png`. Rendering desktopowy, tabletowy i mobilny obejrzano. Test dotyku jest emulacją Chromium, nie odbiorem na fizycznym telefonie; Safari i Firefox nie były testowane.

Historyczne warianty PoC zachowano w dokumentacji. Akceptacja assetu nie oznacza wdrożenia produkcyjnego. Obecny workflow CI uruchamia się po push gałęzi main/feat; nie deklarujemy zdalnego CI dla codex/**.

## Korekta kafelków i sekwencji AIR

Etykiety wyśrodkowano nad portami. Usunięto numerację kart; nagłówki pokazują LAN-10 / FIBER-100 / AIR-40 itd., bez zmiany identyfikatorów ofert. Pobieranie ma cyfry 38,4 px (po kolejnych dwóch zmniejszeniach wcześniejszych 60 px o 20%); wysyłanie zachowuje wcześniejszy rozmiar. Parametry są domyślnie obok siebie, a przy szerokości wnętrza karty do 180 px przechodzą w układ pionowy. Etykieta nazwy portu ma 12 px, oznaczenie „1 ×” — 10 px. Test przeglądarkowy sprawdza wszystkie 13 kafelków, pozycje etykiet, nazwy, brak numeracji i overflow oraz osobne szczyty jasności trzech łuków każdego z pięciu kanałów.

Materiały odbiorowe: `test-results/hero-3-0/kafelki-LAN.png`, `kafelek-FIBER-mobile.png`, `air-sekwencja-final.png` i `air-sekwencja.webm`.

Wybór „TECHNOLOGIA INTERNETU” wraz z okresem umowy znajduje się wewnątrz kontenera urządzenia z animowanymi portami. Nad nazwami ofert widnieje „Pakiet MAD-NET”.
