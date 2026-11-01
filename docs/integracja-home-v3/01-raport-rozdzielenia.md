# MAD-NET — etap 01: osobny podgląd HOME V3

Data: 2026-11-01, Europe/Warsaw. Gałąź: `feat/madnet-integracja-home-v3`. Baza etapu: `a764b836cc2e1a2d9deb68d64b141f598222aa26`. `main` i `origin/main` na początku: `56f946676b9421d1fd7ad3619c12ea954930b416`.

## Wynik i uruchomienie

HOME jest oddzielną stroną `home.html`. Uruchom `npm run dev`, otwórz `http://127.0.0.1:4173/home.html`. Ten adres sprawdzono: HTTP 200, właściwy arkusz HOME. Istniejący proces podglądu na 4173 pozostawiono użytkownikowi; testy uruchamiają i zamykają własne serwery.

`npm run preview` udostępnia również HOME, ponieważ build kopiuje teraz **index.html + home.html + assets/**. Nie kopiuje `docs/`, pobranych oryginałów ani testów. `index.html` pozostaje cennikiem, bez zmian w treści, cenach i zachowaniu. Nie dodano HOME do jego nawigacji. Nie przenoszono cennika, nie zmieniano architektury ani publicznej witryny.

## Źródło, archiwum i zakres zmian

Oryginał: `C:\GitHub\Projects\MAD-NET\MAD-NET_HOME_V3_JEDEN_PLIK.html`, **1 930 653 B**. Potwierdzony SHA-256:

`ceeef68c1d719bb37c161aa8df4c3c0a3395c7123da5e3f70571a6806dded99d`

Kopia bez ingerencji: [docs/archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html](../archiwum/MAD-NET_HOME_V3_JEDEN_PLIK_ORIGINAL.html). Hash taki sam. Istniejący ZIP z etapu 00 pozostaje drugim zabezpieczeniem. `.gitattributes` wyłącza konwersję końców linii wyłącznie dla nowego archiwum HTML i wydzielonego SVG PCB, aby checkout nie zmieniał ich bajtów.

| Plik / grupa | Zmiana |
|---|---|
| `home.html` | struktura V3, `lang="pl"`, lokalny CSS/JS/obrazy, bez data-URI |
| `assets/css/home.css` | cały pojedynczy blok CSS V3 w pierwotnej kolejności, łącznie z nadpisaniami; bez importu styles.css |
| `assets/js/home.js` | dwa oryginalne bloki połączone w pierwotnej kolejności; menu/modale/PCB przed mapą, zachowane IIFE |
| `assets/img/home/` | 10 unikalnych obrazów wyodrębnionych bajtowo z 16 wystąpień data-URI |
| `scripts/build.mjs` | dodatkowe jawne kopiowanie home.html; archiwum poza dist |
| `tests/home.test.mjs` | integralność źródła/obrazów, izolacja HOME, zgodność plików cennika z manifestem etapu 00 |
| `tests/home.browser.mjs` | porównanie przed/po, zachowanie HOME, podkatalog, obie strony w dist |
| `package.json` | test:home oraz HOME na końcu istniejącego test:browser |
| `README.md` | adres lokalnego podglądu i polecenie testu |
| `.gitattributes` | dwa miejscowe wyjątki zachowujące bajty oryginałów |
| `docs/integracja-home-v3/01-*` | raport, manifest obrazów, screenshoty i wyniki |

Chronione pliki **bez zmian** względem etapu 00: `index.html`, `assets/css/styles.css`, `assets/css/hero-hybryda.css`, `assets/js/cennik.js`, `assets/js/dostepnosc.js`, `assets/js/hero-rack.js`. Nie zmieniono istniejących testów V20/V21/PCB, lockfile ani workflow. Trzy pierwotne nieśledzone HTML nadal pozostają lokalne i poza commitem.

### Obrazy i MIME

Pełne hashe, rozmiary bajtowe, MIME oraz wymiary z odczytu przez przeglądarkę: [01-obrazy.json](01-obrazy.json). Wszystkie bajty odpowiadają oryginalnym data-URI; brak ponownego przycinania i rekompresji.

| Obraz | MIME | Wymiary | Bajty |
|---|---|---:|---:|
| logo.png | image/png | 660×176 | 137798 |
| latarnia-tlo.jpg | image/jpeg | 1680×680 | 86920 |
| latarnia-hero.jpg | image/jpeg | 1145×546 | 102349 |
| podpis-lokalny.png | image/png | 1120×496 | 227723 |
| pcb.svg | image/svg+xml | 1440×180 | 1545 |
| usluga-internet.jpg | image/jpeg | 516×420 | 37294 |
| usluga-monitoring.jpg | image/jpeg | 516×420 | 27408 |
| usluga-it.jpg | image/jpeg | 516×420 | 38360 |
| usluga-www.jpg | image/jpeg | 516×420 | 36147 |
| usluga-anteny.jpg | image/jpeg | 516×420 | 33255 |

Ścieżki w HTML: `./assets/...`; w CSS: `../img/home/...`. Arkusz HOME ładuje się tylko w HOME, bez współdzielenia stylów z cennikiem. Wydzielone obrazy nie zawierają kafelków mapy: tak jak w oryginale mapa pobiera je online z Esri lub CARTO/OSM. Nie dodano usług, kluczy API ani bibliotek.

## Porównanie wizualne przed/po

Test uruchamia serwer HTTP `dist` na 4184, a oryginał udostępnia wyłącznie przez przechwyconą odpowiedź testowej ścieżki `/oryginal-home-v3.html`. Archiwum nie trafia do builda. Obie wersje korzystają z identycznych bajtów prawdziwych kafelków pobranych online i współdzielonych w pamięci testu. Nie zastępowano mapy fikcyjną ilustracją.

Parametry: Edge headless, Windows, DPR 1, wysokość viewportu 1000, reduced-motion: reduce, załadowane fonty i lazy images, pełne screenshoty. Porównano **zdekodowane piksele RGBA**, nie tylko hashe PNG.

| Szerokość | Przed | Po | Różne piksele |
|---|---|---|---:|
| 390 | [oryginał](01-porownanie/przed-390.png) | [HOME](01-porownanie/po-390.png) | 0 |
| 768 | [oryginał](01-porownanie/przed-768.png) | [HOME](01-porownanie/po-768.png) | 0 |
| 1440 | [oryginał](01-porownanie/przed-1440.png) | [HOME](01-porownanie/po-1440.png) | 0 |
| 1920 | [oryginał](01-porownanie/przed-1920.png) | [HOME](01-porownanie/po-1920.png) | 0 |

Wyniki maszynowe: [01-porownanie/wyniki.json](01-porownanie/wyniki.json). Screenshoty poza produkcyjnym assets.

Kontrola wizualna obejmuje podpis, latarnię i zachód, ciemne tło, pięć kart usług, mapę satelitarną, boczne PCB i nakładki. Zachowano istniejące różnice responsywne: podpis ukryty wraz z panelem bocznym przy szerokości ≤1120 px, silnie przyciemnione/kadrowane tło na mobile. Nie „naprawiano” ich kosztem zgodności V3. Zachowano również oryginalne atrybuty wymiarów HTML podpisu mimo innych naturalnych wymiarów bitmapy.

Wynik 0 pikseli dotyczy tej kontrolowanej konfiguracji i nieruchomych kadrów. Nie stanowi gwarancji identycznego renderowania między systemami operacyjnymi, silnikami ani losowymi fazami animacji. Rzeczywisty ruch PCB sprawdzono osobno przy wyłączonej redukcji ruchu.

## Testy i zachowanie

| Polecenie / kontrola | Wynik |
|---|---|
| `npm run verify` | PASS, exit 0 — 9/9 testów, build dwóch stron |
| `npm run test:home` | PASS, exit 0 — 4 szerokości, porównanie 0 pikseli, interakcje, brak wyjątków i błędów konsoli |
| `npm run test:browser` | PASS, exit 0 — V20: 13 szerokości i 169 tras bez kolizji; V21: 64 kombinacje tabel, mapa/przeciąganie/formularz/fallback; HOME: 4 szerokości i 0 różnych pikseli |
| `npm run test:pcb` | PASS, exit 0 — 9 szerokości 360–2560 px |
| HTTP `127.0.0.1:4173/home.html` | PASS, 200 |
| Zasoby pod `/MAD-NET/home.html` | PASS — test montowania katalogu dist pod prefiksem, lokalne obrazy/CSS/JS działają |
| Archiwum poza `dist` | PASS |
| Realna wysyłka wiadomości | SKIP — brak backendu api/zapytanie.php, brak deklaracji dostarczenia |

HOME: menu klawiaturą i Escape; cztery rodzaje modali usług, modal zgłoszenia, zamykanie, pętla fokusu, mailto; pięć kart; wybór miejscowości i GPS; mapa/ciemny podkład/satelita, zoom i powrót do regionu; sześć ornamentów PCB z pointer-events:none, aktywny ruch stroke-dashoffset i jego wyłączenie przez prefers-reduced-motion. Brak poziomego overflow na czterech szerokościach. Test kończy również kontrolą trzech urządzeń RACK i formularza w index.

Logi lokalne: `test-results/integracja-home-v3/01/{verify,home,browser,pcb}.log`. Zbiorczy wersjonowany dowód: [01-porownanie/testy.txt](01-porownanie/testy.txt). Nie testowano fizycznych telefonów, Safari ani Firefox. Nowy test HOME wykonuje rzeczywiste żądania kafelków — ich awaria może przerwać test i nie może być opisywana jako sukces mapy online.

## Linki odłożone do etapu 03

Zachowano linki i działania oryginału zgodnie z poleceniem tego etapu. Lokalność zasobów HOME nie oznacza, że wszystkie stare CTA kierują lokalnie. Poniższe są jawnymi wyjątkami do poprawy po ustaleniu architektury; nie klikano CTA wychodzących na publiczną stronę.

| Obecny cel / mechanizm | Liczba statycznych linków | Dalsze działanie |
|---|---:|---|
| `https://kapi1944.github.io/MAD-NET/#cennik` | 4 | etap 03: docelowy względny URL ofert, po relokacji cennika |
| `https://kapi1944.github.io/MAD-NET/#kontakt` | 3 | etap 03: względny URL formularza dostępności |
| `#monitoring` | 2 | etap 03: docelowa podstrona/sekcja usług |
| `#dla-firm` | 2 | etap 03: docelowa podstrona/sekcja usług |
| `#uslugi`, `#zobacz-wiecej` | 2 + 1 | etap 03: katalog usług / zgodność sekcji |
| `#o-nas`, `#kontakt` | 2 + 2 | etap 03: docelowe sekcje/kontakt ogólny, uniknąć konfliktu starego formularza |
| `data-usluga`, `data-otworz-kontakt` | przyciski | dziś modale V3; nie zmieniono ich w podstrony |
| tel/mailto/OSM/Google Maps | odnośniki zewnętrzne | zachować właściwy typ; telefon V3 wymaga późniejszego potwierdzenia |

Nie dodano przekierowań ani `cennik.html`, nie zmieniono hashy globalnych. Numer telefonu i treści firmy pozostają z oryginału; ich zgodność biznesowa nie jest potwierdzona w tym etapie.

## Bezpieczeństwo, odstępstwa i rollback

- Brak odstępstw wizualnych w wykonanym porównaniu. Różnica techniczna: zasoby zewnętrzne lokalne zamiast data-URI, dwa bloki JS w jednym pliku w tej samej kolejności, HOME dołączony do builda.
- Zastane ryzyka etapu 00 pozostają: Pages automatycznie publikuje main, czerwony historyczny CI main 360 px/AIR, brak backendu, rozbieżne dane firmy i zależność mapy od internetu. Nie naprawiano ich w tym zleceniu.
- Podczas etapu 01 odczytano zakończony [CI etapu 00 #41264745126](https://github.com/kapi1944/MAD-NET/actions/runs/41264745126): FAIL z tą samą asercją `Informacje i przycisk panelu nie mogą się zasłaniać: 360px AIR`. Lokalny PASS Edge nie unieważnia tego wyniku Linux/Chromium. Nowy CI uruchomi push etapu 01; jego stan należy odróżnić od testów lokalnych.
- Prace i push wyłącznie na gałęzi integracyjnej. Nie zmieniono workflow, ustawień Pages ani main; nie wykonano merge, deploy ani publikacji.
- Rollback: revert commita etapu 01 na gałęzi integracyjnej; cennik i tak nie został zmieniony. Oryginał dostępny lokalnie, w archiwum HTML i w ZIP etapu 00. Nie używać reset --hard, clean ani force-push.
- SHA commita etapu: `git log -1 --format="%H %s" -- docs/integracja-home-v3/01-raport-rozdzielenia.md`, także w końcowej odpowiedzi. Nie umieszcza się SHA commita w nim samym.

**Zatrzymanie przed etapem 02.**
