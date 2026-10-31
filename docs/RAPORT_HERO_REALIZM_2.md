# HERO RACK REALISM 2.0 — 31.10.2026

Gałąź: `codex/hero-rack-realism-2`, baza: `d232de8` z integracją V21. Projekt pozostaje wersją rozwojową.

## Audyt i punkt odniesienia

Przeczytano AGENTS.md, README, plan, decyzje, architekturę, raporty V20/V21 oraz HTML, CSS i hero-rack.js. Przed zmianami `npm run verify` przeszedł 6/6 testów i build. Nie było zmian śledzonych plików. Zastane dwa PNG i historyczny HTML V21 pozostawiono poza commitem; tak samo później załączony wzorzec `Nowoczesna oferta internetu MAD-NET.png`.

Początkowo obejrzano dwa PNG z katalogu bez potwierdzenia ich wyboru. Po korekcie użytkownika właściwym wzorcem jest wyłącznie załączony plik. To odniesienie do wyglądu, z pierwszeństwem wymagań opisowych: brak zwisającego klucza, spokojniejsze tło i powierzchnie urządzeń oraz zachowanie interaktywnego renderingu.

| Obszar | Elementy odpowiedzialne za działanie |
| --- | --- |
| Geometria i perspektywa | `.hero-in`, `.hero-rack-stage`, `.rack-box`, lokalne media queries |
| Konstrukcja | `.rack-roof`, `.rack-body`, `.rack-floor`, `.rack-sidewall` |
| Szyny i uchwyty | `.rail-left`, `.rail-right`, `.rack-mounted`, `.rack-ear` |
| Urządzenia i kanały | `.rack-device`, `.rj-port`, `.fiber-port`, `.air-port`, atrybuty `data-speed` |
| Animacje | `.rj-link`, `.fiber-activity`, `.wi`, indywidualne `--pulse`, `--phase`, `--air-cycle` |
| Panel i warstwy | `.hero-tech-panel`, nadrzędne konteksty warstw; pomiar prawej ścianki w hero-rack.js |
| Hover, focus, dotyk, CTA | Istniejący mechanizm w hero-rack.js, próg gestu 12 px i obsługa pointercancel |

## Wprowadzone zmiany

- Otwarta obudowa z ostrzejszymi krawędziami, grubością kołnierzy, górnym rantem, przygaszoną fakturą i subtelną perspektywą. Logo MAD-NET na belce górnej. Bez drzwi i obcych marek.
- Boczna pokrywa z linią podziału blach, przetłoczeniem, wentylacją i osadzonym cylindrycznym zamkiem bez klucza.
- Dwie szyny z regularnymi kwadratowymi otworami. Ciągłe uchwyty na wysokość urządzeń, po jednej śrubie na stronę: 6 śrub mocujących. Cienie kontaktowe i ciemne wnętrze wzmacniają cofnięcie frontów.
- Grafitowe urządzenia z czerwonym, pomarańczowym i niebieskim panelem po lewej. Numery kanałów, większe oznaczenia 05/03/05, stonowane adaptery SC/UPC Simplex, diody w górnych narożnikach RJ-45. AIR nadal ma wyłącznie 5 symboli Wi-Fi.
- Panel zachowuje zakładkę około 34 px, brak lewego bordera i z-index poniżej szafy. Odstęp od górnej i dolnej granicy ścianki wynosi około 8 px. Wysokość wynika z dotychczasowego pomiaru 3D. Kolor tła, CTA i nagłówka oraz zanikanie treści reagują na zmianę technologii; panel pozostaje nieruchomy.
- Wielowarstwowe, przygaszone ścieżki PCB i osobne czerwone impulsy. Tło i ikony są wektorowe; obudowa i urządzenia pozostają elementami HTML/CSS. Nie użyto bitmapy całego HERO ani szafy.
- Desktop: tekst, szafa i panel za jej prawą stroną. Do 1230 px panel przechodzi poniżej; do 800 px cały HERO ma układ pionowy. Do 480 px zmniejszono detale bez usuwania kanałów.

`assets/js/hero-rack.js`, logika cennika/formularza, dane ofertowe i archiwum V18 pozostały bez zmian. Zachowano odzyskane funkcje V21.

## Weryfikacja

- `npm run verify`: 6/6 testów i build.
- `npm run test:browser`: rzeczywisty Microsoft Edge / Chromium, zbudowany katalog `dist/`.
- HERO: 360, 390, 430, 760, 768, 1024, 1280, 1440, 1510 i 1920 px; brak poziomego overflow, dostępne porty, tekst mieści się w panelu, śruby trafiają w obrys szyn. Dodatkowe porównanie wizualne przy 1774 × 887 px, jak w załączniku.
- 13 kanałów: zachowane dokładne okresy LAN 5000/2500/1250/714/455 ms, FIBER 1000/333/167 ms i AIR 2400/1818/1224/923/741 ms. Próbkowanie przez ponad 5 sekund wykazało rzeczywiste zmiany jasności wszystkich kanałów. Po hover każdej technologii zegary wszystkich animacji nadal postępują bez restartu, również w nieaktywnych urządzeniach.
- Hover, pozostawienie ostatniej technologii, 3 cykle Tab/Enter/Space, 3 cykle tapnięć, gest przewijania, aria-pressed, CTA dla LAN/FIBER/AIR, reduced motion oraz ręczne wyłączenie animacji.
- Cennik: 130 tras bez kolizji; ceny, okresy, wybór pakietów i sekwencje połączeń. V21: 64 kombinacje tabel na 8 szerokościach, 13 miniportów, klawiatura, umowa formularza, ręczne współrzędne i awaria mapy.
- Brak wyjątków JavaScript i błędów konsoli w regresji HERO. `git diff --check` bez błędów.

## Artefakty i zakres oceny

Lokalne, ignorowane przez Git: `test-results/realizm/przed/hero-{szerokość}.png`, `test-results/v20/po/hero-{szerokość}.png`, `test-results/v20/po/wyniki.json`, `test-results/v21/po/`, a także `test-results/realizm/po/hero-1774.png`, `porownanie.png` i `detale.png`. Porównanie pokazuje wzorzec oraz rzeczywisty rendering w tej samej szerokości i stanie AIR. Przegląd wizualny opisuje także `design-qa.md`.

Odtworzono kierunek wizualny, bez deklaracji fotograficznej zgodności 1:1 z bitmapą. Dotyk badano w emulacji Chromium; fizyczny telefon, Safari i Firefox pozostają do odbioru. Nie publikowano witryny i nie dodawano integracji ani backendu.

Commit i push dotyczą wyłącznie tej gałęzi roboczej. Obecny workflow automatycznie uruchamia się po push na `main` i `feat/**`; push tej gałęzi `codex/**` sam nie uruchamia CI. Powyższe wyniki dotyczą lokalnych testów.
