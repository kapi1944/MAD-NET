# MAD-NET — oficjalny projekt strony internetowej

**Punkt wyjścia: zaakceptowany prototyp V18 z interaktywną szafą RACK 3D w HERO.**

Projekt strony lokalnego operatora MAD-NET (internet LAN, FIBER i AIR). Początkowy kod pochodzi z interaktywnego pliku HTML V18 — jego wygląd i logika zostały zachowane, a CSS, JavaScript i logo przeniesiono do odrębnych plików.

> **Stan:** repozytorium rozwojowe, nie publikować jako ukończonej witryny. Formularz zawiera interfejs API, ale w repo **nie ma jeszcze działającego serwera SMTP**. Wysyłka e-mail wymaga osobnego wdrożenia backendu.

## Szybkie uruchomienie na Windows

Wymagany **Node.js 22+** (zalecany 24). Zainstalowany Node 24 nie wymaga żadnych dodatkowych pakietów npm.

```powershell
cd C:\GitHub\Projects\MAD-NET
npm run dev
```

Otwórz **http://127.0.0.1:4173**. Serwer odświeża stronę po zmianach HTML/CSS/JS. Zatrzymanie: `Ctrl+C`.

```powershell
npm test            # testy struktury + sprawdzenie składni JS
npm run build       # gotowa statyczna strona w dist/
npm run preview     # podgląd dist/ na http://127.0.0.1:4173
npm run verify      # testy + build
npm ci              # zależności do testów przeglądarkowych
npm run test:browser # Chromium: geometria, 9 szerokości, obsługa i 117 tras
```

**Bez instalowania Electrona, frameworków i płatnych API.** To świadoma decyzja na pierwszy etap: najpierw stabilizujemy i dokumentujemy aktualny projekt. Dopiero później ocenimy korzyści Vite/React.

Testy przeglądarkowe na Windows korzystają z zainstalowanego Microsoft Edge. Na Linux/macOS najpierw uruchom `npx playwright-core install chromium` (na CI także `--with-deps`). Własną ścieżkę przeglądarki można wskazać przez `MADNET_PRZEGLADARKA`. Testy uruchamiają tymczasowy podgląd `dist/` na porcie 4181 (`MADNET_PORT_TESTOW` zmienia port), zapisują zrzuty i pomiary w `test-results/v20/po/`, po czym zamykają przeglądarkę i serwer. Szczegóły wdrożenia: [raport V20](docs/RAPORT_V20.md).

## Struktura

```text
MAD-NET/
├── index.html                   # struktura strony V18
├── assets/
│   ├── css/styles.css           # cały oryginalny CSS, bez zmian semantycznych
│   ├── js/cennik.js             # urządzenia, pakiety, SVG przewodów, tabela
│   ├── js/dostepnosc.js         # formularz dostępności + mapa
│   ├── js/hero-rack.js          # interakcje HERO RACK
│   └── img/mad-net-logo.png     # oryginalne logo z HTML
├── docs/
│   ├── archiwum/V18_oryginal.html
│   ├── ARCHITEKTURA.md
│   ├── PLAN_ROZWOJU.md
│   ├── DECYZJE.md
│   └── WYTYCZNE_DLA_CODEXA.md
├── scripts/
│   ├── serve.mjs                # lokalny serwer z live-reload
│   ├── build.mjs                # przygotowanie wersji statycznej
│   ├── init-git.ps1             # utworzenie lokalnego repo Git
│   └── publish-github.ps1      # opcjonalne prywatne repo na GitHub
├── tests/projekt.test.mjs
└── .github/workflows/ci.yml    # automatyczne testy i build
```

## Repozytorium Git — start

```powershell
cd C:\GitHub\Projects\MAD-NET
powershell -ExecutionPolicy Bypass -File .\scripts\init-git.ps1
```

Skrypt zainicjuje Git w **tym folderze** i utworzy pierwszy commit na `main`, korzystając z Twojego lokalnie skonfigurowanego autora (`git config user.name` i `user.email`). Nie usuwa poprzedniego repo ani nie nadpisuje zdalnych danych.

Aby następnie utworzyć **prywatne** repo `kapi1944/MAD-NET` na GitHubie, zainstaluj i zaloguj się do GitHub CLI (`gh auth login`), po czym uruchom:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-github.ps1
```

Publikacja repozytorium na GitHubie **nie oznacza publikacji witryny**. Do produkcyjnego uruchomienia strony potrzebny będzie hosting i weryfikacja danych.

## Ustalenia produktowe

- **HERO:** lewa kolumna z „Wybierz łącze. Zobacz różnicę.”, środkowa niska szafa RACK 3D, prawa kolumna z płynnie zmieniającym się opisem technologii.
- **RACK:** trzy moduły MAD-NET: **LAN 5× RJ-45** (czerwony), **FIBER 3× SC/UPC Simplex** (pomarańczowy `#FF7B19`), **AIR 5× radio** (niebieski, bez portów fizycznych).
- Każdy kanał ma niezależną, proporcjonalną do prędkości animację. Zmiana panelu prawego przez hover, dotknięcie lub klawiaturę.
- **Cennik:** 13 pakietów i tabela porównawcza z zakładkami technologii i kolorami.
- **Łączenie:** realistyczne wtyki, zaślepki, sekwencja podłączenia, przewody po trasach ortogonalnych. **Routing przewodów wciąż jest obszarem do testów i poprawy**, a nie ukończonym rozwiązaniem.
- **Dostępność:** formularz technologii/pakietów, umowy, adresu i mapy; geokodowanie zależne od internetu. E-mail wysyła wyłącznie produkcyjny backend po skonfigurowaniu.

Więcej: [plan rozwoju](docs/PLAN_ROZWOJU.md) · [architektura](docs/ARCHITEKTURA.md) · [ustalenia](docs/DECYZJE.md) · [instrukcje dla Codexa](docs/WYTYCZNE_DLA_CODEXA.md).

Integracja V21: [audyt](docs/AUDYT_MIGRACJI_V21.md) i [raport](docs/RAPORT_INTEGRACJI_V21.md). `npm run test:browser` sprawdza również 64 kombinacje tabel na ośmiu szerokościach i zapisuje porównania w `test-results/v21/`.
