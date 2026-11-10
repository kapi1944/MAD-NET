# Etap 07 — finalizacja i korekta HOME / Internet

Baza: `1cf46b4173c281df9534f4524b36c6ca8e60ad6a`. Praca wyłącznie na `main`, jeden commit korekty. Nie rozpoczęto etapu 08.

Pięć kompozycji z bazy zostało zachowanych: Internet (LAN/FIBER/AIR), Monitoring i alarmy (plan stref), Sieci LAN i IT (topologia), Strony WWW i hosting (komputer/tablet/telefon), Instalacje TV/SAT (dwa tory odbioru). Cztery ostatnie strony oraz `oferta.css` pozostają bez zmian.

## Korekta rozmieszczenia RACK

- HOME: bez szafy i panelu technologii w HERO. Istniejąca fotografia latarni otrzymała kadr, przyciemnienie i podpis. Zachowano „Internet. Po sąsiedzku.”, CTA, telefon, osobną sekcję technologii, wyróżnienie Internetu, mapę oraz stylistykę V5.
- Internet: istniejący SVG RACK przeniesiono do HERO, bez drugiej kopii w HOME. Zachowano grafikę, mocowania, proporcje, 5 RJ-45, 3 zielone SC/APC Simplex i 5 kanałów AIR. Lokalny `internet-rack.css` / `internet-rack.js` obsługuje panel, mysz, klawiaturę, dotyk, animacje kontrolek i reduced motion. Brak mechaniki podłączania przewodów.
- Schemat trzech mediów z etapu 07 przeniesiono bez zmiany grafiki do następnej sekcji Internetu. Na desktopie media są obok siebie, na węższych ekranach jedno pod drugim.

## Rzeczywiste zrzuty Chromium — 390 / 1440 px

| Strona | PRZED | PO |
|---|---|---|
| HOME, korekta V5 | [390](przed/home-390.png) · [1440](przed/home-1440.png) | [390](po/home-390.png) · [1440](po/home-1440.png) |
| Internet, korekta RACK | [390](przed/internet-korekta-390.png) · [1440](przed/internet-korekta-1440.png) | [390](po/internet-390.png) · [1440](po/internet-1440.png) |
| Internet, początek etapu 07 | [390](przed/internet-390.png) · [1440](przed/internet-1440.png) | aktualne zrzuty powyżej |
| Monitoring i alarmy | [390](przed/monitoring-alarmy-390.png) · [1440](przed/monitoring-alarmy-1440.png) | [390](po/monitoring-alarmy-390.png) · [1440](po/monitoring-alarmy-1440.png) |
| Sieci LAN i IT | [390](przed/sieci-it-390.png) · [1440](przed/sieci-it-1440.png) | [390](po/sieci-it-390.png) · [1440](po/sieci-it-1440.png) |
| Strony WWW i hosting | [390](przed/strony-www-hosting-390.png) · [1440](przed/strony-www-hosting-1440.png) | [390](po/strony-www-hosting-390.png) · [1440](po/strony-www-hosting-1440.png) |
| Instalacje TV/SAT | [390](przed/instalacje-tv-sat-390.png) · [1440](przed/instalacje-tv-sat-1440.png) | [390](po/instalacje-tv-sat-390.png) · [1440](po/instalacje-tv-sat-1440.png) |

Zrzuty HOME i Internetu wykonano ponownie; dla czterech niezmienionych stron wykorzystano istniejące materiały z bazy. Oceniono wizualnie kadrowanie latarni, hierarchię HERO, sprzęt i zielone złącza, panel opisów, CTA, układ mobilny oraz zachowanie schematów. Test DOM nie zastępuje tej oceny.

## Weryfikacja

Szerokości HOME i ofert: **320, 360, 390, 430, 768, 1024, 1366, 1440, 1920 px**. Dotyk, klawiatura, hover, płynne przełączanie i stabilna wysokość panelu, przewijanie palcem, reduced motion, nawigacja/CTA, ścieżki pod `/MAD-NET/`, błędy JS/konsoli i HTTP. Pomiar zagnieżdżonych SVG uwzględnia rzeczywisty viewport przycinający bitmapę portu.

| Polecenie | Wynik |
|---|---|
| `npm run verify` | PASS — 18 testów, build 9 stron |
| `npm run test:home` | PASS — 9 szerokości, 45 porównań dalszych sekcji, regresja cennika |
| `npm run test:oferta` | PASS — 45 układów, interakcje RACK, FAQ i CTA |
| `npm run test:nawigacja` | PASS — 243 linki, menu, dotyk i stare adresy |
| `npm run test:browser` | PASS — HOME, FIBER, LINK/ACT, panele, 286 tras, tabele, nawigacja, oferta, porty |
| `npm run test:integracja` | PASS — 63 układy, zgodność zasobów |

Pierwszy test HOME przy współbieżnym przebudowywaniu `dist` zgłosił 404; końcowe przebiegi wykonano bez równoległego builda. Pierwszy pełny test przerwał zewnętrzny serwer Esri (`ECONNRESET`); dodano `maxRetries:2` w istniejącym pobieraniu kafelków testu HOME, bez pomijania asercji lub zasobów. Powtórzona pełna regresja przeszła.

Logi końcowej walidacji: [wyniki.txt](wyniki.txt). Szczegółowe zrzuty i pomiary pozostają w lokalnym `test-results/`; CI publikuje własne artefakty.

## Granice zmian

Bez zmian cen, 13 pakietów, HTML i mechaniki cennika, formularza, mapy i wspólnej nawigacji. Bez nowych bibliotek, API, integracji i backendu. Testy cennika zachowano; testy panelu przeniesiono do istniejącego testu oferty. [Dokumentacja HOME V5](../home-v5/README.md) i opis architektury uwzględniają nowy podział.

Po zielonych testach korekta trafia zwykłym push na `origin/main`. Potwierdzenie SHA, CI, publikacji Pages i publicznych HOME/Internet jest w końcowym raporcie czatu, po sprawdzeniu konkretnego wdrożenia.
