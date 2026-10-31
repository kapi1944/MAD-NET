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

## Wariant ciemny v2

Na życzenie użytkownika aktualny podgląd korzysta z rack-ciemny-v2.png. Wbudowany image_gen: przyciemnij stal w kierunku referencji; zachowaj bryłę, alfa, logo, porty i 12 śrub; zmień prawe oznaczenia na jednoliniowe 5-PORT, 3-PORT, 5-CH, bez zer wiodących, mniejsza czcionka, cyfra nieco większa od przyrostka. Oryginalny kandydat pozostaje zachowany. To nadal proof przed integracją interakcji.

## Logo v3

Aktualny podgląd: rack-logo-v3.png. Edycja wbudowanym image_gen według logo załączonego przez użytkownika: popraw cztery znaki MAD-NET (górny front i trzy tabliczki), zachowaj charakterystyczną czerwoną orbitę, biało-czerwony napis i mały dopisek. Zachowaj ciemny wariant, geometrię, alfa, 12 śrub i oznaczenia 5-PORT/3-PORT/5-CH. Logo w bitmapie jest odtworzeniem; w docelowej integracji można nałożyć oryginalny plik marki dla dokładności typograficznej.

## Materiały oznakowania v4

Aktualny asset: rack-tabliczki-v4.png. Wbudowany image_gen, edycja lokalna według referencji materiału użytkownika: logo górne jako płaski nadruk farbą bezpośrednio na obudowie; trzy logo urządzeń na cienkich tabliczkach ze szczotkowanego czarnego aluminium z lekko zaokrąglonymi narożnikami. Bez dodatkowych śrub tabliczek, z zachowaniem 12 mocowań, portów, napisów i przezroczystości.

## Finalny asset — struktura blachy

Aktualny plik: rack-finalny.png. Przygotowany wbudowanym image_gen na podstawie wskazanej starszej wersji i zdjęcia prawdziwej powłoki proszkowej. Prompt: zachowaj drobne, równomierne ziarno oryginalnej blachy, ciemną ekspozycję i kamerę; przenieś wyłącznie poprawione cztery logotypy, nadruk górny, trzy zaokrąglone czarne szczotkowane tabliczki i jednoliniowe oznaczenia 5-PORT/3-PORT/5-CH. Zachowaj 12 śrub, układ 5/3/5 kanałów i alfa. Odrzucono próbę o zbyt silnej nieregularnej fakturze. To finalny asset graficzny przedstawiany użytkownikowi, bez automatycznej akceptacji integracji HERO.

## Akceptacja i integracja

Użytkownik zaakceptował ostatni projekt graficzny i zlecił jego umieszczenie w HERO. Asset rack-finalny.png skopiowano bez zmian do assets/img/hero-rack.png. Etapy integracji 3–6 opisano w ../../HERO_3_HYBRYDA.md. Dawne informacje o oczekiwaniu na akceptację powyżej opisują historię PoC.
