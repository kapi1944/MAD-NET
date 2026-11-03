# Porty i LINK/ACT — modernizacja czytelności

2026-11-02. Baza: `feat/integracja-hero-v4-fiber`, commit `18fd7b6`.
Gałąź robocza: `codex/porty-led-czytelnosc`.

## Rozmiary

Wymiary CSS w pikselach, przed zastosowaniem perspektywy szafy:

| Element | PRZED | PO |
| --- | --- | --- |
| RJ-45, centralny desktop | 44 × 40 | 50 × 45 |
| RJ-45, karta | 37 × 35, dodatkowo `scale(.82)` | 42 × 39, bez skalowania |
| RJ-45, tabela | 38 × 33 | 43 × 37 |
| SC/APC, centralny desktop | 44 × 37 | 50 × 42 |
| SC/APC, karta | 40 × 34 | 45 × 38 |
| SC/APC, tabela | 38 × 32 | 43 × 36 |
| LINK/ACT w RJ-45 i centralnym FIBER | 6 × 4 | 8 × 5,5 |
| LINK/ACT w obudowie karty FIBER | 8 × 6 | 10,5 × 8 |
| LINK/ACT pod gniazdem tabeli FIBER | 7 × 6 | 9,5 × 8 |
| LINK/ACT w RACK, jednostki SVG | 10 × 7 | 13,5 × 9,5 |
| Adapter SC/APC w RACK, jednostki SVG | 62,4 × 52 | 70 × 58,333 |

Na telefonach centralny RJ-45 ma maksymalnie 36 × 32 przy szerokości do
390 px oraz 40 × 36 do 560 px. Szerokość jest ograniczona rzeczywistym
miejscem w porcie. Centralny SC/APC ma na telefonie 45 × 38.
Usunięcie wcześniejszego pomniejszenia RJ-45 na karcie zwiększa jego
widoczną powierzchnię bardziej niż nominalna zmiana wymiarów CSS.

W RACK lokalne wycinki pięciu istniejących portów LAN mają 79 × 81 jednostek
SVG wobec źródłowego kadru 70 × 72. Odstęp 82 jednostek zapobiega nachodzeniu
portów. Bitmapa korpusu, perspektywa i kompozycja HERO pozostają zachowane.
Klapka, zawias, konektor oraz przesunięcia SC/APC są dopasowane do nowego
adaptera; końce przewodów nadal pochodzą z rzeczywistych pomiarów DOM.

## Światło i animacja

- Niepodłączony LINK: ciemna zieleń `#294a34`, krawędź `#66816b`, delikatne
  odbicie. Podłączony LINK zachowuje jasną zieleń `#70c97b` i zyskuje miękki blask.
- ACT: faza przygaszona ma `opacity: .85`, impuls `opacity: 1`.
  Usunięto dodatkowe przyciemnienie całego zestawu przez `brightness(.5)`.
  Rdzeń, poświata i odbicie pozostają subtelne. 85% opisuje parametr CSS,
  a nie pomiar fizycznej luminancji monitora.
- Okresy, fazy i tożsamość animacji są zachowane przy podłączaniu oraz
  przełączaniu pakietów. LINK zmienia stan dopiero w istniejącej sekwencji.
- RACK używa tej samej fazy przygaszonej ACT. Stare światła bitmapowych
  portów LAN są zakryte pod nowymi wskaźnikami.
- Adaptery pasywne SC/APC pozostają bez diod; wskaźniki znajdują się w obudowach.

Nie zmieniono danych 13 pakietów, cen, kolorów technologii, logiki połączeń,
skryptów `cennik.js` i `hero-rack.js`, układu kart ani układu tabel.

## Porównanie wizualne

[Galeria PRZED/PO](zrzuty/porty-led-porownanie.html) zawiera 32 pary kadrów
(64 obrazy osadzone w jednym pliku HTML, działającym bez internetu):
LAN/FIBER × 390/1440 px × port nieaktywny/aktywny × urządzenie/karta/tabela/RACK.
Kadry pokazują te same pakiety; ACT jest zatrzymane w tej samej fazie animacji.
Dla aktywnej tabeli FIBER połączenie jest przenoszone do jej gniazda, aby
pokazać otwartą klapkę i rzeczywiste osadzenie konektora.

Źródłem PRZED jest osobny build commita `18fd7b6`; źródłem PO jest bieżący build.
Zrzuty i szczegółowe pomiary trafiają do ignorowanego `test-results/porty-led/`.
`npm run test:porty` odtwarza kadry PO oraz sprawdza rozmiary, ramki, etykiety,
diody, odstępy portów RACK i przepełnienie na 320/360/390/430/768/1024/1440/1920 px.
Tryb PRZED: `MADNET_ETAP_PORTOW=przed`, opcjonalnie `MADNET_KATALOG_PORTOW`
wskazuje katalog `dist` niezależnego buildu bazowego.

## Weryfikacja

Trwa końcowa regresja przeglądarkowa i PCB. Wyniki zostaną uzupełnione przed commitem.

## Ograniczenia

Gesty i szerokości telefonów sprawdzane są w emulacji Chromium/Edge na Windows.
Nie wykonano odbioru na fizycznym telefonie ani osobnej kontroli Safari/Firefox.
Galeria służy do oceny wizualnej; nie zastępuje takiego odbioru.
Nie wykonano merge do `main` ani zmian GitHub Pages.
