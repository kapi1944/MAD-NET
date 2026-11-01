# MAD-NET — architektura startowa

## Punkt wyjścia: import V18

Rozdzielenie pliku HTML **bez przebudowy funkcji**:

| Moduł | Lokalizacja | Odpowiedzialność |
|---|---|---|
| Strona główna HOME V3 | `index.html`, `assets/css/home.css`, `assets/js/home.js`, `assets/img/home/` | HERO, karty z linkami, PCB i mapa regionu |
| Wspólna nawigacja | `assets/css/nawigacja.css`, `assets/js/nawigacja.js` | Nagłówek, menu dotykowe/klawiaturowe, dropdown i stopka na dziewięciu stronach |
| Katalog i strony tymczasowe | `uslugi.html`, pięć podstron usług, `kontakt.html`, `assets/css/uslugi.css` | Pięć bannerów; jawne strony tymczasowe do dalszych etapów |
| Zgodność dawnych hashy | `assets/js/stare-adresy.js` wyłącznie w index | Tylko #cennik/#oplaty/#kontakt → cennik.html z tym samym fragmentem |
| Struktura i sekcje cennika | `cennik.html` | Nawigacja, HERO RACK, cennik, opłaty, formularz |
| Stylowanie | `assets/css/styles.css` | Wszystkie style V18, animacje, media queries |
| Logika cennika | `assets/js/cennik.js` | Dane pakietów, centralne urządzenie, połączenia, tabele |
| Sprzęt FIBER (Etap 05) | `assets/js/sprzet-fiber.js`, `assets/css/sprzet-fiber.css` | Wspólne symbole adaptera i konektora SC/APC, gniazdo z klapką, nakładka panelu HERO. Jeden kontroler stanów w `cennik.js`; cel przewodu wynika z DOM wybranej karty lub gniazda tabeli |
| Formularz i mapa | `assets/js/dostepnosc.js` | Obsługa formularza, mapy, geokodowanie, POST do API |
| RACK HERO | `assets/js/hero-rack.js` | Hover/touch/focus i płynne zmiany opisu techn. |
| Logo | `assets/img/mad-net-logo.png` | Bezpośrednio z grafiki zakodowanej w V18 |

**Uwaga techniczna:** skrypty cennika mają obecnie zakresy globalne i zależą od kolejności ładowania. Dlatego w `cennik.html` są to zwykłe skrypty w kolejności: `sprzet-fiber.js` → `cennik.js` → `dostepnosc.js` → `hero-rack.js`. **Nie zamieniać automatycznie na `type=module`** bez wyodrębnienia API współdzielonych danych. HOME ładuje wyłącznie własne CSS/JS. Build waliduje obie strony przed zastąpieniem `dist/`, a następnie kopiuje jawną listę `index.html`, `cennik.html` i `assets/`; archiwa nie trafiają do wyniku. Szczegóły i mapa URL: [etap 02](integracja-home-v3/02-raport-migracji.md).

Od etapu 03 allowlista builda obejmuje dziewięć HTML. Wspólne CSS jest ograniczone do nagłówka/stopki i tokenów `--madnet-*`, bez resetu cennika. Jego nagłówek zachowuje klasy `nav` i `brand`, wymagane przez istniejące skrypty do wysokości przewijania i źródła logo. Na końcu obu stron ładowane jest `nawigacja.js`. Nagłówki i stopki są statycznym HTML, bez wymagania pobierania fragmentów z API. Kontrakt linków i kontrola regresji: [etap 03](integracja-home-v3/03-raport-nawigacji.md).

## Środowiska

- Dev: `npm run dev` (lokalny serwer Node, automatyczny reload).
- Test: `npm test` (Node test runner, bez pakietów zewnętrznych).
- Build: `npm run build` (statyczne `dist/`).
- Hosting: na start statyczny HTML/CSS/JS, dopóki formularz nie zostanie obsłużony przez osobny backend.

## Granice integracji

1. **Leaflet CSS/JS** i kafelki **OpenStreetMap** wymagają internetu. Publiczne serwery podlegają politykom wykorzystania.
2. Geokodowanie adresu: **Nominatim OSM**. Na produkcji należy zweryfikować limity, politykę prywatności i dostępność usługi.
3. Frontend odwołuje się do `api/zapytanie.php`, ale API **nie zostało dołączone**. Nie wolno pokazywać fałszywego sukcesu ani umieszczać danych SMTP w JS/repo.
4. Istniejące linki do `mad-net.pl` i numer telefonu są z prototypu V18; przed publikacją trzeba potwierdzić je z właścicielem.

## Zasady stopniowego refaktoru

- Przed zmianą: testy + zrzuty 390/768/1024/1440 + commit.
- Jeden obszar na etap, bez wielkiej przebudowy wszystkich modułów.
- Centralne dane pakietów docelowo wydzielić do jednego źródła (nie kopiować cen do kilku modułów).
- Zachować `docs/archiwum/V18_oryginal.html` jako porównanie i rollback.
- Animacje uwzględniają `prefers-reduced-motion`, a dotyk nie może uruchamiać przypadkowego hover podczas scrollowania.
