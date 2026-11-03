# Porty i LINK/ACT — modernizacja czytelności

Implementacja i kadry: 2026-11-02. Odbiór końcowy: 2026-11-03.
Baza: `feat/integracja-hero-v4-fiber`, commit `18fd7b6`.
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

Przy wznowieniu prac implementacja była już zapisana w commicie
`76221b1fb469616faa1385c25233a74f53e01318`. Zachowano ten commit;
końcowe uzupełnienie obejmuje wyniki i galerię. Nie rozpoczęto implementacji ponownie.

| Kontrola | Wynik |
| --- | --- |
| `npm run verify`, poprzedni końcowy build | PASS, 18/18 testów i build dziewięciu stron |
| `tests/porty.browser.mjs`, po usunięciu mobilnego skalowania | PASS, 16 pomiarów na ośmiu wymaganych szerokościach; 0 skalowanych portów, kolizji i przepełnień |
| `npm run test:fiber`, ponownie na końcowym CSS | PASS, dziewięć szerokości 320–1920 px, sekwencje podłączania/odłączania, punkty styku, szybkie przełączanie, klawiatura, dotyk i reduced-motion |
| `npm run test:led`, ponownie na końcowym CSS | PASS, sześć scenariuszy LAN/FIBER przy 320/390/1440 px; cztery reprezentacje, ciągłość ACT, synchronizacja LINK, anulowanie i reduced-motion |
| `node tests/v20.browser.mjs`, ponownie po usunięciu skalowania | PASS, 286 tras na 22 szerokościach 320–1920 px, zero kolizji; ceny, klawiatura, dotyk, scroll, reduced-motion i 13 kanałów RACK |
| `npm run test:pcb` | PASS, dziewięć szerokości 360–2560 px; geometria, ruch diod, przełącznik animacji, reduced-motion i kliknięcie |
| Galeria PRZED/PO | PASS, 64 poprawnie załadowane obrazy; brak przepełnienia przy 390 i 1440 px |

W 27 końcowych pomiarach FIBER największy błąd końca przewodu wyniósł
0,0654 px, początku 0,0524 px, a osi konektora mniej niż 0,00001 px.
Nie odnotowano kolizji ani przepełnień. We wszystkich sześciu scenariuszach
LED animacje ACT zachowały tożsamość i okres po podłączeniu.
Końcowe wyniki FIBER, LED, V20 i PCB nie zawierają błędów JavaScript;
V20 nie odnotował również błędów konsoli ani sieci.

Odbiór kadrów PRZED/PO: porty i niepodłączony LINK są wyraźniej widoczne,
aktywny LINK odróżnia się jasną zielenią, a przygaszone ACT pozostaje czytelne.
Na telefonie SC/APC ma rzeczywisty rozmiar 45 × 38 px, bez dawnego pomniejszenia
transformacją. Powiększone elementy mieszczą się w dotychczasowych obudowach;
etykiety prędkości, ceny, kompozycja kart, tabel i szafy pozostały zachowane.

W poprzednim pełnym przebiegu `test:browser` zaliczono HOME, FIBER, LED,
diagnostykę panelu, 286 tras V20, 64 kombinacje tabel V21, nawigację i podstrony
oferty. Dołączony test portów wykrył błąd swojego pomiaru SVG: obrys zawartości
wycinka obejmował całą bitmapę zamiast przyciętego okna portu. Poprawiono pomiar
na podstawie rzeczywistego okna SVG i macierzy DOM; końcowy test portów przeszedł.

Po usunięciu historycznego mobilnego `scale()` powtórzono tylko kontrole
zależne od zmienionej geometrii i brakujący test PCB. Nie powtarzano zaliczonych
kontroli HOME, V21, nawigacji i oferty. Poprzedni `verify` oraz końcowy pomiar
portów dotyczą niezmienionego kodu. Zmodyfikowane pliki sprzętu w ponownym
buildzie są bajtowo zgodne ze źródłami.
Szczegółowe logi uzupełnienia: `test-results/porty-led/dokonczenie/`.

## Ograniczenia

Gesty i szerokości telefonów sprawdzane są w emulacji Chromium/Edge na Windows.
Nie wykonano odbioru na fizycznym telefonie ani osobnej kontroli Safari/Firefox.
Galeria służy do oceny wizualnej; nie zastępuje takiego odbioru.
Nie wykonano merge do `main` ani zmian GitHub Pages.
