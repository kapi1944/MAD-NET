# MAD-NET — architektura startowa

## Punkt wyjścia: import V18

Rozdzielenie pliku HTML **bez przebudowy funkcji**:

| Moduł | Lokalizacja | Odpowiedzialność |
|---|---|---|
| Struktura i sekcje | `index.html` | Nawigacja, HERO, cennik, opłaty, formularz |
| Stylowanie | `assets/css/styles.css` | Wszystkie style V18, animacje, media queries |
| Logika cennika | `assets/js/cennik.js` | Dane pakietów, centralne urządzenie, połączenia, tabele |
| Formularz i mapa | `assets/js/dostepnosc.js` | Obsługa formularza, mapy, geokodowanie, POST do API |
| RACK HERO | `assets/js/hero-rack.js` | Hover/touch/focus i płynne zmiany opisu techn. |
| Logo | `assets/img/mad-net-logo.png` | Bezpośrednio z grafiki zakodowanej w V18 |

**Uwaga techniczna:** skrypty mają obecnie zakresy globalne i zależą od kolejności ładowania. Dlatego w `index.html` są to zwykłe skrypty w kolejności: `cennik.js` → `dostepnosc.js` → `hero-rack.js`. **Nie zamieniać automatycznie na `type=module`** bez wyodrębnienia API współdzielonych danych.

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
