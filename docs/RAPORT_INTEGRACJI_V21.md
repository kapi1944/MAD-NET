# Integracja funkcjonalności V21 — 31.10.2026

Kontynuacja gałęzi `feat/v20-hero-rack-refinement`, bez zmian na main. Źródło historyczne pozostaje niezmienione i nie jest dodawane do produkcyjnego buildu. Jego kopię oraz SHA-256 odnotowano w audycie.

## Przeniesiono i sprawdzono

- Niezależne przełączniki tabel FIBER/LAN/AIR, wszystkie 8 kombinacji, licznik, pusty stan, Pokaż wszystkie i Wyczyść wybór. Kolejność FIBER → LAN → AIR. Stan tabel nie zależy już również od zmiany technologii urządzenia.
- Każda tabela ma własne barwy, nagłówek techniczny, komplet parametrów i cen pochodzących z istniejącego PLAN_DATA.
- Dekoracyjne miniporty: RJ-45, SC/UPC Simplex i trzy łuki Wi-Fi. Nie mają przycisków ani tabindex; nie podłączają kabli. Tempo wynika z blinkHz/radioPeriod, a globalny przełącznik i ograniczenie ruchu wyłączają animacje. Wąskie nagłówki układają port nad nazwą, szerokie obok niej.
- Trzy opisane kafelki umowy formularza, stan wyboru i fokus. Natywne radio i istniejące wartości formularza pozostają zachowane.
- Ręczny zapis współrzędnych z walidacją i przecinkiem dziesiętnym oraz link do OSM. Działa bez biblioteki mapowej i nie zmienia modelu danych przesyłanych do API.

## Zachowano i świadomie pominięto

HERO RACK, panel V20, PCB, wszystkie 13 kanałów, ceny, opłaty, formularz wielu usług, Leaflet na żądanie, wyszukiwanie adresu, pinezkę, fallback CDN i ręczny adres. Siedem badanych funkcji routingu/podłączania jest identycznych w V21 i bieżącej bazie; nie zastępowano ich kopią.

Nie przywracano Network Status ani monolitycznego HTML. Pozostawiono Leaflet zamiast MapLibre: nie wymaga WebGL i już działa na żądanie. Nie wykonano benchmarku obu silników; decyzja opiera się na istniejącym działaniu i mniejszym zakresie migracji. Historyczny iframe zastępują ręczne współrzędne i link OSM; iframe nie pozwalał wybierać punktu. Oba rozwiązania sieciowe wymagają właściwej atrybucji dostawcy danych. Źródła porównania bibliotek zawiera audyt.

Nie dodawano automatycznego trybu mailto ani backendu SMTP. Zachowano istniejące kopiowanie zgłoszenia i kontrakt API.

## Testy wykonane lokalnie

- `npm run verify`: 6/6, build PASS.
- Regresja V20: PASS — 9 szerokości, geometria HERO, klawiatura, dotyk, przewijanie, ceny i 117 tras bez kolizji.
- `node tests/v21.browser.mjs`: PASS — 360/390/430/768/1024/1280/1440/1920 px, 64 kombinacje, kolejność/licznik/pusty stan, 13 miniportów, brak dodatkowych interakcji w ich DOM, malejące okresy animacji, brak poziomego overflow, umowa formularza.
- Klawiatura Enter/Space przełącza wybór tabel. Wyłączone animacje i reduced motion zatrzymują miniporty.
- Awaria obu CDN mapy zasymulowana w przeglądarce: ponawianie i ręczne współrzędne działają.
- Mapa online: załadowana, ustawienie i usunięcie pinezki działa, walidacja pustej miejscowości działa. Brak wyjątków JS.
- Zrzuty obejrzano: nagłówki miniportów i kafelki umowy na 390/1440 px, pozostałe szerokości zapisano automatycznie.

## Artefakty i pliki

Zrzuty przed: `test-results/v21/przed/tabele-390.png`, `tabele-1440.png` oraz sześć zrzutów HERO. Po: `test-results/v21/po/tabele-{szerokość}.png` dla ośmiu szerokości i `formularz-390.png`, `formularz-1440.png`. Artefakty lokalne są ignorowane przez Git; CI publikuje je jako artefakt przebiegu.

Zmieniono `index.html`, `assets/css/styles.css`, `assets/js/cennik.js`, `assets/js/dostepnosc.js`, testy V20/V21, package.json, istniejący workflow, README i dwa raporty. `assets/js/hero-rack.js` pozostał bez zmian.

Commity etapowe: `705d002` audyt; `82cbb35` mechanizm tabel i miniporty; `a96d5b5` poprawna semantyka portów i ręczna lokalizacja; osobny commit testów i dokumentacji.

Dalsza praca: odbiór na fizycznym telefonie oraz Safari/Firefox, produkcyjny backend i akceptacja danych handlowych. Nie publikowano witryny. Wyniki CI należy sprawdzić osobno po push; powyższe wyniki dotyczą lokalnego Chromium/Edge.
