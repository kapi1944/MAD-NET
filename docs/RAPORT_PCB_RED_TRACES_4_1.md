# MAD-NET — DARK PCB RED TRACES 4.1

Data: 31.10.2026. Gałąź: `codex/pcb-red-traces-4-1`. Zmiana do akceptacji wizualnej, bez publikacji witryny i bez scalenia do `main`.

## Baza i zakres

Prace rozpoczęto na czystym `codex/hero-3-0-integracja`, commit `f9f1cc8cd8119ec219ecc57fafcaf3acaeb828ac`. Początkowe `npm run verify`: 6/6 testów i poprawny build. W trakcie pracy pojawił się równoległy commit `dd64032cb07b70fd9c544eb41b3e6766c5ce95a8` z panelem wyboru oferty wewnątrz urządzenia i mniejszymi liczbami pobierania. Zachowano go w całości; końcowe porównania „przed” odtwarzają właśnie tę nowszą bazę.

Kod zmienia wyłącznie dekorację `.pcb-tlo` wewnątrz `#cennik` i jej istniejący blok CSS. Skrypty aplikacji, fotorealistyczne tło HERO, szafa RACK, ceny, formularz, mapa, algorytm przewodów RJ-45/SC/UPC i kropki AIR pozostają poza tą zmianą.

## Przyczyny poprzedniego wyglądu

- Dwanaście pojedynczych tras opartych na `H`/`V` tworzyło schodki zamiast wiązek PCB.
- `preserveAspectRatio="none"` rozciągało geometrię zależnie od wysokości cennika.
- Wspólny przygaszony kolor spłaszczał hierarchię obwodów.
- Animacja `stroke-dasharray:9 791` pokazywała przesuwającą się kreskę, bez punktowego rdzenia LED.

## Implementacja

Trzy różne kompozycje SVG 1440 × 640 są zakotwiczone u góry, w środku i na dole sekcji. Każda ma dwie wiązki po sześć równoległych tras, krótsze połączenia lokalne, rzeczywiste odgałęzienia przy końcach magistral, pierścienie przelotek i prostokątne pola kontaktowe. Łącznie: 54 ścieżki, 90 odcinków skośnych, 60 pierścieni i 6 pól kontaktowych. Test oblicza przecięcia odcinków; wspólne końce połączonych tras są dozwolone.

`preserveAspectRatio="xMidYMid meet"`, naturalne proporcje i `max-height:33.333%` zachowują kąty i rozdzielają kompozycje także po zmianie liczby pakietów i tabel. Na telefonie SVG jest kadrowane poziomo, a nie rozciągane do wysokości całej sekcji. Na szerokich ekranach ograniczenie wysokości pozostawia dodatkową czerń po bokach. Centralne części statycznych tras i kontaktów przyciemnia maska; diody zachowują jasny rdzeń.

| Warstwa | Kolor | Zastosowanie |
|---|---|---|
| Tło | `#05070B`, `#090C12` | Głęboka czerń, bez czerwonej poświaty na całej sekcji |
| Cicha | `#751025` | Cienka struktura obwodów |
| Widoczna | `#B80E2B` | Wyraźniejsze magistrale i kontakty |
| Aktywna | `#F01436` | Wybrane połączenia |
| LED | `#FF4057` | Otoczka i lokalna poświata |
| Rdzeń | `#FF98A3` | Jasny środek punktu |

Każda dioda składa się z trzech kół: rdzeń o średnicy 2,6 jednostki SVG, otoczka 6 i radialna poświata 14. Ruch zapewnia natywne `animateMotion` z `mpath`, tempem `paced`, pięcioma różnymi okresami 11–19 s i ujemnymi fazami startowymi. Jest pięć diod na desktopie i trzy na telefonie; faktyczna liczba widoczna w danej chwili zależy od kadrowania i zasłonięcia treścią.

`body.mot-off` i `prefers-reduced-motion` ukrywają wszystkie grupy `.pcb-impulsy`, zachowując ścieżki. To celowe ukrywanie SMIL: zegar SVG może nadal działać w tle; CSS `animation-play-state` nie jest używany jako pozorne zatrzymanie. Po ponownym włączeniu punkt pojawia się w bieżącej fazie. Nie dodano skryptu aplikacji, interwałów, filtrów blur ani zależności.

PCB pozostaje za `.pricing .container`, ma `pointer-events:none`, `aria-hidden="true"` i `focusable="false"`.

## Weryfikacja

Dedykowany test: `npm run test:pcb`. Nagranie: `npm run test:pcb -- --nagranie`. Zmienna `MADNET_SILNIK_PCB=webkit` lub `firefox` wybiera alternatywny silnik po instalacji przeglądarek Playwright; `MADNET_PORT_PCB` zmienia port.

Test mierzy poprawność danych SVG, dozwolone kąty, brak niepołączonych przecięć, macierze skalowania i rozdzielenie kompozycji. Próbkuje rzeczywiste położenie LED na ścieżce i zmianę w czasie, sprawdza różne okresy/fazy, przełącznik, reduced motion, kliknięcie technologii i dynamiczną wysokość przy tabelach V21.

| Kontrola | Wynik |
|---|---|
| Początkowe i końcowe `npm run verify` | 6/6 testów, build poprawny |
| PCB Chromium / Microsoft Edge | 360, 390, 430, 768, 1024, 1280, 1440, 1920, 2560 px |
| PCB WebKit | Te same 9 szerokości |
| Błędy JS i konsoli w dedykowanych testach | 0 |
| Poziomy overflow, deformacja, niepołączone przecięcia | 0 |
| Pełna regresja V20/V21 | PASS: 143 trasy bez kolizji, 13 pakietów, 64 kombinacje tabel, porty i animacje kabli, klawiatura, dotyk, przewijanie, formularz, ręczna lokalizacja, obsługa awarii mapy |

W istniejącym teście V20 zaktualizowano tylko dwa sprawdzenia PCB: SMIL zastępuje CSS-owe `getAnimations()` dawnego `<use>`, a reduced motion obejmuje wszystkie trzy grupy. Pozostałe asercje, w tym 13 pakietów, porty, rzeczywiste trasy kabli, dotyk, klawiatura, tabele i formularz, zachowano.

## Wydajność i ograniczenia

Dekoracja używa 54 prostych ścieżek i pięciu animowanych transformacji małych grup. Poświata jest lokalnym gradientem radialnym; nie ma animowanego filtra obejmującego SVG. Krótka próbka `requestAnimationFrame` jest pomiarem tego środowiska testowego, a nie benchmarkiem fizycznego telefonu. Surowe wyniki znajdują się obok zrzutów.

W Chromium przy 2560 px próbka 60 odstępów między klatkami miała medianę 8,3 ms, p95 8,4 ms i zero odstępów powyżej 50 ms. Osobne porównanie WebKit na bazie `dd64032`, bez równolegle uruchomionej regresji, dało:

| Szerokość | Przed: mediana / p95 | Po: mediana / p95 |
|---|---|---|
| 1440 px | 69 / 77 ms | 64 / 80 ms |
| 2560 px | 87 / 100 ms | 93 / 95 ms |

To pojedyncze próbki po 40 odstępów, z wahaniami między uruchomieniami. Wskazują podobny koszt obu implementacji w tym programowym WebKit, ale nie potwierdzają płynności docelowego Safari. [Pomiary Chromium](zrzuty/pcb-4-1/wyniki.json), [pomiary funkcjonalne WebKit](zrzuty/pcb-4-1/wyniki-webkit.json), [porównanie WebKit](zrzuty/pcb-4-1/porownanie-wydajnosci-webkit.json).

Firefox Playwright nie uruchomił się na tym Windows: niepoprawna konfiguracja równoczesna aplikacji, `spawn UNKNOWN`. Nie zaliczono więc tej przeglądarki. WebKit na Windows potwierdza funkcjonalność silnika, ale nie zastępuje testu Safari na macOS/iOS. Programowy WebKit w tym środowisku renderuje animowane SVG wolno także w poprzedniej implementacji; nie należy z jego wyniku wywodzić płynności na urządzeniu docelowym.

Kontrola wizualna obejmuje wiązki i zakręty 45°, szczegóły kontaktów, mały rozmiar LED, głęboką czerń, kontrast tekstu, kadrowanie telefonu oraz całą sekcję z tabelą. Dwie klatki nagrania potwierdzają zmianę położenia punktów. Ostateczna ocena estetyki należy do właściciela projektu.

## Materiały do akceptacji

| Szerokość | Przed | Po — statyczne | Po — aktywne |
|---|---|---|---|
| 390 px | [Przed](zrzuty/pcb-4-1/przed-390.png) | [Statyczne](zrzuty/pcb-4-1/statyczne-390.png) | [Aktywne](zrzuty/pcb-4-1/aktywne-390.png) |
| 1440 px | [Przed](zrzuty/pcb-4-1/przed-1440.png) | [Statyczne](zrzuty/pcb-4-1/statyczne-1440.png) | [Aktywne](zrzuty/pcb-4-1/aktywne-1440.png) |
| 1920 px | [Przed](zrzuty/pcb-4-1/przed-1920.png) | [Statyczne](zrzuty/pcb-4-1/statyczne-1920.png) | [Aktywne](zrzuty/pcb-4-1/aktywne-1920.png) |
| 2560 px | [Przed](zrzuty/pcb-4-1/przed-2560.png) | [Statyczne](zrzuty/pcb-4-1/statyczne-2560.png) | [Aktywne](zrzuty/pcb-4-1/aktywne-2560.png) |

[Nagranie LED](zrzuty/pcb-4-1/impulsy-led.webm) · [Cały cennik 390](zrzuty/pcb-4-1/caly-cennik-390.png) · [Cały cennik 1440](zrzuty/pcb-4-1/caly-cennik-1440.png).
