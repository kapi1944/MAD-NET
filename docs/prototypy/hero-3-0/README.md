# HERO 3.0 — wizualny proof, etapy 1–2

Baza: `245d211`, gałąź `codex/hero-rack-realism-2-1`. Kandydat znajduje się na potomnej gałęzi `codex/hero-3-0-proof`. Etapy 3–6 integracji oczekują akceptacji wyglądu przez użytkownika.

`rack-kandydat.png` jest fotorealistyczną rekonstrukcją na podstawie referencji, przygotowaną wbudowanym image_gen w dwóch krokach. Nie jest bezstratnym wycięciem oryginału. Ma rzeczywisty kanał alfa; próbki poza sylwetką mają A=0. Zachowuje otwarty front, 5 RJ-45, 3 SC/UPC Simplex, 5 symboli Wi-Fi, 12 śrub montujących urządzenia i mały zamek bez wiszącego klucza.

Nie zatwierdzono zgodności: przy znormalizowanej wysokości kandydat ma nieco szerszą sylwetkę niż wzorzec. Różnią się drobne napisy, elementy boku i rozmieszczenie detali. Nie wyrównujemy tego rozciąganiem bitmapy. W razie braku akceptacji właściwym następnym krokiem jest osobny model graficzny/3D z kontrolowaną kamerą i eksportem RGBA, przygotowany pod te same proporcje. Nie należy wracać do modelowania materiałów samymi gradientami CSS.

`porownanie.html` pokazuje referencję i kandydata w dwóch identycznych kadrach 860 × 620 px, ze wspólną wysokością bryły około 568 px, przy zachowaniu proporcji. Trzecia sekcja przedstawia rzeczywisty render 2.1 w stanie AIR. Screenshoty są w ignorowanym `test-results/hero-3-0/`. Źródło referencji i wcześniejszy screenshot są lokalnymi plikami użytkownika/testów, więc podgląd porównania wymaga tego checkoutu.

Nie zmieniono index.html, CSS strony, hero-rack.js ani funkcji V21. PNG zawiera obecnie statyczne kontrolki; nie jest gotową integracją interaktywną. Po akceptacji należy przygotować neutralne miejsca dla kontrolek, a ich współrzędne trzymać w jednym układzie obrazu (procenty/viewBox), wspólnym dla skalowanego modelu i nakładki.

Weryfikacja: `npm run verify` i `npm run test:browser` przeszły (istniejąca wersja 2.1: 11 szerokości, 13 animacji, 143 trasy i regresja V21). Te wyniki nie sprawdzają jeszcze interaktywnej integracji 3.0. Podgląd PoC załadował trzy obrazy bez błędów JS. Screenshoty `referencja.png`, `wersja-2-1.png`, `wersja-3-0.png`, `referencja-nowy.png` i `porownanie-trzech.png` znajdują się w `test-results/hero-3-0/`. Porównanie obejrzano; wygląd oczekuje akceptacji użytkownika.

## Prompty (wbudowane narzędzie, bez CLI/API)

1. Wyizoluj tylko centralną szafę z referencji, bez strony, PCB i panelu, na przezroczystym tle. Zachowaj kamerę, proporcje, stal, otwarty front, kolorowe LAN/FIBER/AIR, logo, 5/3/5 kanałów, dokładnie 12 śrub i osadzony zamek. Usuń zwisające klucze. Bez nowego projektu szafy.
2. Usunięcie tła: zachowaj szafę, porty, 12 śrub, logo i oświetlenie. Poza rzeczywistą sylwetką pełne przezroczyste alfa, bez czarnego tła, cienia i wklejonej szachownicy.
