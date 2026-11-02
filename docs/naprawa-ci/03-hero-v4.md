# RECOVERY 03 — HERO V4 / naprawa CI

Data: 2026-11-02 (Europe/Warsaw). Repozytorium: MAD-NET. Worktree: C:/GitHub/Projects/MAD-NET-hero-v4. Gałąź docelowa: feat/home-hero-premium-v4. [PR #4](https://github.com/kapi1944/MAD-NET/pull/4).

## Stan początkowy i zabezpieczenie

Po sprawdzeniu Git, worktree, fetch origin i PR:

- PR #4: OPEN, HEAD 3146838e19f3838fd955b50c6d4063bf3977e387.
- main i origin/main: 1987ad3aa8a65fd1aa86f077af1addf3225bb228.
- Izolowany worktree HERO był czysty, na lokalnym aliasie codex/home-hero-premium-v4-isolated, śledzącym origin/feat/home-hero-premium-v4.
- Lokalna feat/home-hero-premium-v4 nadal wskazywała 1987ad3. Przełączono czysty worktree na tę gałąź i wykonano wyłącznie fast-forward do origin/feat/home-hero-premium-v4. Alias codex/... pozostawiono jako punkt kontrolny 3146838.
- PR #5 / FIBER pozostał otwarty na 3b3d7b4bed91b13cf2c7f9d0cb4fd392680cfd73, z dwoma zielonymi przebiegami CI. Nie przenoszono jego implementacji ani zmian z PR #3.
- Historyczny [run 41351011741](https://github.com/kapi1944/MAD-NET/actions/runs/41351011741) dla 3146838 zakończył się FAILURE, a [run 41350971248](https://github.com/kapi1944/MAD-NET/actions/runs/41350971248) dla tego samego SHA zakończył się SUCCESS. Odczytano rzeczywisty log błędu, nie zakładano stałości stanu z poprzedniej sesji.

## Rzeczywista przyczyna błędu

Błąd `Skok panel.y po wyborze LAN: 171 → 206.328125` dotyczył RACK w cennik.html, nie nowej kompozycji HOME V4. HTML cennika, jego CSS i JS panelu w 3146838 były zgodne z main.

hero-rack.js wylicza położenie panelu względem tylnej ściany szafy w requestAnimationFrame, uruchamianym również przez ResizeObserver i gotowość fontów. Do tego momentu CSS stosuje fallback top:80px. Przy początku kontenera na y=91 daje to y=171. Po pomiarze skrypt zapisuje --panel-gora:115.33px, co daje y=206.328125.

Pętla testów szerokości czekała już na fonty i --panel-wysokosc. Późniejsza sekcja klawiatury po nowym goto od razu zapisywała wzorzec geometrii. W wolniejszej sekwencji Linux przechwytywała fallback, a po fokusie i Enter porównywała go z prawidłową pozycją po pierwszej klatce pomiaru. Interakcja nie była przyczyną przesunięcia.

Kontrolowane odtworzenie na Windows/Edge opóźniło wyłącznie callback rAF o 500 ms w oddzielnej stronie diagnostycznej. Nie jest to ustawienie aplikacji ani testów akceptacyjnych. Uzyskano dokładnie wartości z CI:

| Pomiar (1440 × 1100) | Przed pierwszym pomiarem | Po gotowości układu | Po fokusie i Enter FIBER |
|---|---:|---:|---:|
| panel.y | 171 | 206.328125 | 206.328125 |
| panel.x | 1051.1875 | 1051.71875 | 1051.71875 |
| wysokość panelu | 381.390625 | 381.390625 | 381.390625 |
| scrollY | 0 | 0 | 0 |
| document.fonts.status | loaded | loaded | loaded |
| --panel-gora | brak | 115.33px | 115.33px |

Bez kontrolowanego opóźnienia Windows miał już y=206.328125 w pierwszym odczycie i zachował je po interakcji. [Surowe pomiary](03-pomiary/windows-inicjalizacja.json) pokazują oba przypadki. Wysokość panelu i przewijanie nie zmieniły się; fonty były załadowane także przy odtworzonym błędzie. To odróżnia inicjalizację pozycjonowania od późnego ładowania fontów, zmiany kadrowania, wpływu fokusu czy animacji geometrii.

## Poprawka i ochrona asercji

Zmieniono testy V20/HOME, kolejność istniejących testów przeglądarkowych oraz dokumentację tego etapu:

- przygotujPomiarGeometrii czeka na document.fonts.ready, pierwsze wyliczenie panelu dla desktopu oraz dwie klatki renderowania;
- takie samo przygotowanie wzorca obowiązuje dla szerokości, klawiatury i dotyku;
- pomiary przed/po gotowości oraz przed/po każdym wyborze zapisują się w test-results/v20/po/wyniki.json;
- CDP zapisuje rzeczywiście użyte fonty systemowe dla tekstu panelu; log zawiera osobno pomiar startowy sekcji klawiatury;
- późniejszy scenariusz hover najpierw wyprowadza kursor poza RACK. Zapewnia to rzeczywiste pointerenter po użyciu klawiatury, gdy kursor może już znajdować się nad innym urządzeniem. Nadal sprawdzana jest odpowiedź aplikacji na nowe wejście kursora.

Nie zmieniono tolerancji geometrii: wszystkie porównania po interakcji nadal wymagają różnicy <1 px dla panelu, szafy, CTA i sekcji. Nie nadpisuje się wzorca po interakcjach. Zachowano 13 kanałów, kontrolę clip-path i hit-testów, kolizji, overflow oraz >=5000 ms pomiaru animacji. Żadna historyczna asercja nie została usunięta. Pomiary nie resetują stylów ani stanu aplikacji.

Nie zmieniono CSS/JS aplikacji, cennika, sprzętu FIBER, cen ani pakietów. Nie wprowadzono nowych efektów. Nie kopiowano plików sprzętu ani testów SC/APC/LINK/ACT z PR #3/#5.

## Kontrola wizualna V4

Przeanalizowano zrzuty viewport 1000 px wysokości dla 390/768/1366/1920 px i porównano z zatwierdzonymi docs/hero-v4/po/*.png. Dotychczasowe wzorce pozostają niezmienione.

| Szerokość | Porównanie do zatwierdzonego V4 |
|---|---|
| [390](03-zrzuty/home-390.png) | identyczne bajty PNG |
| [768](03-zrzuty/home-768.png) | identyczne bajty PNG |
| [1366](03-zrzuty/home-1366.png) | identyczne bajty PNG |
| [1920](03-zrzuty/home-1920.png) | 2 różne piksele, maksymalna różnica kanału 1; obszar y=980–990, poniżej HERO, na skraju kart usług |

[Hashe i pomiar pikseli](03-pomiary/porownanie-zrzutow.json). HERO w kadrze 1920 pozostaje bez różnic; nie zmieniano żadnego wzorca ani progu testu, aby uzyskać taki wynik. Zachowano dwie kolumny, hasło Łączymy / Chronimy / Wspieramy, CTA, proporcje zdjęcia, subtelne PCB, pięć zalet, pierwszeństwo treści na telefonie i prefers-reduced-motion.

Istniejący test HOME obejmuje dokładnie wymagane 320, 360, 375, 390, 430, 768, 1024, 1366, 1440, 1920 i 2560 px. Zachowuje ścisłe porównania sekcji poza HERO, geometrii i interakcji mapy oraz chronionych modułów cennika. Nie zmieniono istniejącej normalizacji mapy ani porównań do V3.

## Wyniki, SHA i CI

Końcowe wyniki wykonanych poleceń i odczytane wyniki GitHub Actions dopisano po zakończeniu weryfikacji. Pomiary Linux pochodzą z logu zakończonego przebiegu; pełne dane V20 są również w artefakcie Actions.

## Wyniki lokalne RECOVERY 03

| Polecenie / kontrola | Wynik |
|---|---|
| npm run verify | PASS — 14/14, build 9 stron |
| npm run test:browser | PASS — diagnostyka, V20, V21, HOME, nawigacja, oferta |
| npm run test:home | PASS — 11 wymaganych szerokości, HERO i ścisła regresja pozostałych sekcji |
| npm run test:nawigacja | PASS |
| npm run test:oferta | PASS — pięć stron i 30 układów |
| npm run test:pcb | PASS — 9 szerokości 360–2560 px |
| git diff --check | PASS |
| fizyczny telefon | SKIP — testy dotyku w emulacji Edge/Chromium |

Windows / Microsoft Edge: 112 pomiarów wyboru technologii, maksymalna zmiana geometrii po gotowości i interakcji **0 px**, 286 tras bez kolizji. Rzeczywisty font panelu z CDP: Segoe UI, font systemowy (isCustomFont=false). [Skrót wyników](03-pomiary/windows-regresja.json). Pełne pomiary i logi pozostają w test-results/v20/po/wyniki.json oraz recovery03-*.log.

Commit poprawki testu: e1d4b2f810df025e9e4c908ef966190d38f6075c. Aktualizacja została wysłana do istniejącego PR #4. Nie scala się tego PR osobno do main — nowsza instrukcja FINAL MERGE przewiduje dopiero kontrolowaną integrację zatwierdzonych źródeł po zielonym CI.

## Dodatkowa niestabilność zrzutu HOME

Po e1d4b2f przebieg PR 41399243912 przeszedł, ale przebieg push 41399237998 ujawnił niezależne porównanie .sekcja-obszar przy 1920 px: 150 pikseli różniło się maksymalnie o 1 poziom kanału. Nie uznano tego za PASS. Produkcyjne pliki pozostały identyczne z zatwierdzonym V4.

Commit 56236389dc34f03623c83f6503cdd62374745ae8 ustala stan kursora poza interaktywną treścią, czeka na dekodowanie obrazów, jawnie ustawia wspólny viewport i dwie klatki renderowania przed zrzutem. Dodaje też diagnostykę przewijania, hover/fokusu i obszaru różnic oraz oba PNG przy błędzie. HOME uruchamia się jako pierwszy w zbiorczym teście, bez usuwania żadnego skryptu. Lokalnie ponowione verify (14/14 i 9 stron) oraz test:home (11 szerokości) zakończyły się kodem 0.

Nie dodano maski, tolerancji ani nowego wzorca. Istniejące dwie maski wnętrza mapy online pochodzą z zatwierdzonego testu V4; mapa nadal ma odrębne asercje geometrii, stylów i interakcji. Hipoteza smooth-scroll nie potwierdziła się: zmierzono auto i identyczne scrollY=638 w obu metodach ([pomiar](03-pomiary/windows-scroll.json)). Nie traktuje się jej jako potwierdzonej przyczyny. Ostateczny wynik CI jest wymagany przed integracją.

## Dowody Linux i warunek zamknięcia etapu

[Pomiar Linux/Chromium](03-pomiary/linux-ci.json) z zakończonego przebiegu 41399243912 potwierdza y=206.328125 przed/po gotowości, brak przewinięcia i font DejaVu Sans (systemowy). Różna od Windows wysokość tekstu (376.390625 zamiast 381.390625) wynika z fontu platformy; test porównuje stabilność wewnątrz tej samej platformy, zachowując próg <1 px.

Wyniki aktualnego SHA są dostępne w [kontrolach PR #4](https://github.com/kapi1944/MAD-NET/pull/4/checks). Sam starszy zielony przebieg nie stanowi zgody na integrację: RECOVERY 04 może rozpocząć się dopiero po zakończeniu obu aktualnych przebiegów push/PR z SUCCESS. Ich końcowe identyfikatory i źródłowy SHA zostaną również utrwalone w raporcie integracji 04. Nie wykonano merge do main ani publikacji Pages w RECOVERY 03.
