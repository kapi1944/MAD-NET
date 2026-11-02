# MAD-NET — instrukcja wykonawcza dla Codexa
## FINAL RECOVERY / CI FIX / BRANCH AUDIT / MAIN MERGE / PAGES VERIFY

**Wersja instrukcji:** 2026-11-02. **Docelowy katalog roboczy:** `C:\GitHub\Projects\MAD-NET`.  
**Repozytorium:** `kapi1944/MAD-NET`. **Gałąź PR integracyjnego:** `feat/integracja-hero-v4-fiber`. **PR główny:** #6.

> **Zasada nadrzędna:** wykonaj wszystkie etapy samodzielnie, dokumentując wynik. Nie opuszczaj niewykonanego zadania: oznacz je `BLOCKED`, podaj konkretną przyczynę, wymagany następny krok, dowód i właściciela działania. Nie uznawaj historycznych raportów za dowód bieżącego stanu. Wykonuj rzeczywiste komendy, testy i odczyty; nie wymyślaj wyników.

## 0. Co jest już ustalone, a co dopiero trzeba sprawdzić

### Potwierdzone w audycie z 2 XI 2026 — punkty odniesienia, **nie** gwarancja aktualności

| Element | Ostatnio odczytany stan | Zasada |
|---|---|---|
| `main` | `1987ad3aa8a65fd1aa86f077af1addf3225bb228` | pobierz aktualny SHA jeszcze raz |
| PR #1 — PCB | merged | nie merge ponownie |
| PR #2 — HOME V3 | merged | już w `main` |
| PR #3 — `codex/fiber-sc-apc-etap05` | open, starsza implementacja, **dokumenty biznesowe** | bez merge do publicznego repo |
| PR #4 — `feat/home-hero-premium-v4` | open, HERO V4, ostatnio `21aa43e859c38c7d3522846abea15af19079ec69` | funkcjonalność uwzględniona w #6 |
| PR #5 — `feat/fiber-sc-apc-clean` | open, SC/APC + LINK/ACT, ostatnio `3b3d7b4bed91b13cf2c7f9d0cb4fd392680cfd73` | funkcjonalność uwzględniona w #6 |
| PR #6 — `feat/integracja-hero-v4-fiber` | open Draft, mergeable, ostatni HEAD `1828bb8697769ef019de7a932f1dc3dd2b4e791b` | **jedyny główny kandydat do merge** |
| Merge źródeł w #6 | checkpoint `73d47ffd6bb892ebd6f40b86d67f922fb0d52855` | udokumentowana historia obu źródeł |
| Ostatni czerwony CI #6 | run `41408400330`, job `125155574433` | właściwa diagnoza przed publikacją |
| Błąd | `tests/oferta.browser.mjs` i konsola `Failed to load resource: net::ERR_CONNECTION_CLOSED` | przyczyna niepotwierdzona |
| Pozostałe starsze gałęzie | od `main` miały `ahead=0` | sprawdzić ponownie; nie merge w ciemno |

Z zapisanych raportów: `docs/naprawa-ci/{01-izolacja,02-fiber,03-hero-v4,04-integracja}.md`. Raport `04-integracja.md` wykazuje wcześniejsze PASS lokalne i oba zielone runy dla SHA `61561af...`; to **nie** jest zgoda na merge HEAD `1828bb...` z czerwonym CI. W logu czerwonego runu testy Node, build i wiele testów browser kończą się PASS; końcowa asercja sprawdza globalne tablice `bledy`, `konsola`, `zasoby`; `test:pcb` i `test:integracja` w danym runie zostały pominięte wskutek błędu poprzedniego kroku.

### Niepodlegające negocjacji wymagania produktu

- Zachowaj HOME V4, RACK, mapę, pięć podstron ofertowych, cennik, nawigację i formularz frontendowy.
- Pakiety: **LAN 5, FIBER 3, AIR 5** (razem 13). Nie zmieniaj cen, nazw, okresów ani opłat bez osobnej decyzji biznesowej.
- LAN czerwony; FIBER pomarańczowy `#FF7B19`; AIR niebieski. Złącza FIBER są zielonymi **SC/APC Simplex**, APC 8°. AIR bez portów fizycznych.
- LINK zielony wyłącznie dla rzeczywiście połączonego portu; ACT bursztynowy i pulsujący odpowiednio do nominalnej prędkości; wspólny stan urządzenia, kafelka, RACK i tabeli.
- Kable mają zachować świadome podłączenie, prawidłową geometrię, brak kolizji i reguły touch/long-press/scroll. Regresja V20 obejmuje **286 tras**, a pomiar animacji zachowuje próg **>= 5000 ms**.
- Nie zmieniaj zaakceptowanego designu tylko dlatego, że test jest niestabilny. Nie wycinaj testów, nie dodawaj szerokich wykluczeń console/network, nie zwiększaj arbitralnie tolerancji i nie zastępuj regresji testem typu smoke.
- `AGENTS.md` opisuje stronę jako oficjalny projekt, ale **jeszcze nie wersję do publikacji**. Traktuj to jako wymagającą wyjaśnienia bramkę wydawniczą, nie jako automatyczne zezwolenie na publiczne wdrożenie.

## 1. Strategia prowadzenia pracy i format postępu

Pracuj etapami, zapisując `docs/finalizacja-2026-11-02/STAN.md` i `docs/finalizacja-2026-11-02/WYNIKI.json` (z czasem, SHA, przebiegiem, dowodem). Jeden wiersz per etap: `ID | STATUS | CHECKPOINT SHA | WYNIK | DOWÓD | NASTĘPNY KROK`. Stany: `TODO`, `WORKING`, `PASS`, `FAILED`, `BLOCKED`, `SKIPPED-WITH-REASON` (ostatni wyłącznie w przypadku faktycznie nieobowiązujących działań). Niewykonalne zadanie ma mieć przypisaną naprawę lub czynność operatora; brak możliwości nie upoważnia do pominięcia.

Zasada stop/go: bez czystego audytu nie wolno zmieniać kodu; bez pełnego lokalnego PASS nie pushować końcowego rozwiązania; bez zielonych wymaganych checków dla **dokładnie** aktualnego SHA nie scalać; bez rozstrzygnięcia wpływu merge na Pages nie wykonywać merge, który samoczynnie opublikuje niezatwierdzoną wersję.

## 2. ETAP A — tylko odczyt: repo, worktree, PR, CI, Pages

**Zanim przełączysz jakąkolwiek gałąź:**

```powershell
Set-Location 'C:\GitHub\Projects\MAD-NET'
git status --short --branch
git remote -v
git worktree list --porcelain
git branch -vv
git branch -r
git fetch origin --prune
git log --oneline --decorate --graph --all -n 80
git rev-parse HEAD
git rev-parse origin/main
git rev-parse origin/feat/integracja-hero-v4-fiber
git merge-base origin/main origin/feat/integracja-hero-v4-fiber
git diff --stat origin/main...origin/feat/integracja-hero-v4-fiber
git diff --name-status origin/main...origin/feat/integracja-hero-v4-fiber
```

`git fetch --prune` aktualizuje odnośniki remote, nie usuwa lokalnych gałęzi; mimo to nie wykonuj `git worktree remove`, `reset --hard`, `clean -fdx`, `push --force` ani operacji na cudzym katalogu. Jeśli jakikolwiek worktree ma zmiany, pokaż ścieżkę/status i **nie** dotykaj go bez ochrony zawartości. Poprzedni raport wskazuje osobne worktree `C:\GitHub\Projects\MAD-NET-integracja`, `...-fiber-clean`, `...-hero-v4`; **sprawdź faktyczne ścieżki**, nie zakładaj ich istnienia.

```powershell
gh auth status
gh repo view kapi1944/MAD-NET
gh pr list --repo kapi1944/MAD-NET --state open
foreach ($n in 3,4,5,6) {
  gh pr view $n --repo kapi1944/MAD-NET --json number,title,state,isDraft,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,statusCheckRollup,files,commits
}
gh run view 41408400330 --repo kapi1944/MAD-NET --log-failed
gh run list --repo kapi1944/MAD-NET --branch feat/integracja-hero-v4-fiber --limit 20
gh api repos/kapi1944/MAD-NET/pages
gh workflow list --repo kapi1944/MAD-NET
```

Jeśli `gh` nie jest zainstalowany lub bez autoryzacji, użyj dostępnego odczytu GitHub API/strony lub udokumentuj `BLOCKED` z instrukcją instalacji i autoryzacji. **Nie** zapisuj tokenu w pliku projektu i nie wyświetlaj jego wartości. Odczytaj rulesets/branch protection i wymagane status checks, jeśli uprawnienia pozwalają. Zbadaj publikację Pages: `source.branch`, `source.path`, rodzaj deploy, ewentualny workflow. **To krytyczne:** jeśli `main` automatycznie zasila publiczne Pages, operacja merge oznacza w praktyce publikację.

Zapisz `STAN.md` i JSON z pełnymi SHA oraz faktami, włącznie z informacją, co pozostało nieweryfikowalne.

**Akceptacja A:** znane SHA `main`, HEAD #6, stan worktree, listy PR i checks, reguły ochrony, sposób publikacji Pages; nikt nie utracił lokalnych zmian.

## 3. ETAP B — kontrola źródeł i matryca wszystkich gałęzi

Docelowe gałęzie z poprzedniego odczytu: `main`, `feat/integracja-hero-v4-fiber`, `feat/home-hero-premium-v4`, `feat/fiber-sc-apc-clean`, `codex/fiber-sc-apc-etap05`, `feat/madnet-integracja-home-v3`, `codex/hero-3-0-integracja`, `codex/hero-3-0-proof`, `codex/hero-rack-realism-2`, `codex/hero-rack-realism-2-1`, `codex/pcb-red-traces-4-1`, `feat/v20-hero-rack-refinement`; uwzględnij także wszystkie nowe gałęzie zwrócone przez `git branch -r` i lokalne gałęzie tylko w worktree.

Dla **każdej** gałęzi odnotuj ancestry, ahead/behind, unikalne zmiany, ewentualne duplikaty i konsekwencję:

```powershell
# $b pochodzi z listy istniejących gałęzi remote; nie wklejaj literalnego <branch>
$b = 'feat/home-hero-premium-v4'
git rev-list --left-right --count "origin/main...origin/$b"
git merge-base --is-ancestor "origin/$b" origin/feat/integracja-hero-v4-fiber
$ancestryExit = $LASTEXITCODE
git cherry -v origin/feat/integracja-hero-v4-fiber "origin/$b"
git diff --name-status "origin/main...origin/$b"
git log --oneline "origin/main..origin/$b"
```

Dla gałęzi historycznych `ahead=0` względem `main`: wynik zwykle oznacza, że są przodkiem `main` i nie wymagają merge. Weryfikuj `--is-ancestor`, nie zakładaj równoważności treści na podstawie nazwy. Dla #4/#5 sprawdź pełne ancestry/patch equivalence względem #6 oraz zgodność **kluczowych plików docelowych** (HERO: `index.html`, `assets/css/hero.css`, `assets/css/home.css`; FIBER: `cennik.html`, `assets/js/cennik.js`, `assets/js/hero-rack.js`, `assets/js/sprzet-fiber.js`, `assets/css/sprzet-fiber.css`, `assets/js/dostepnosc.js`). Sprawdź też scalone asercje testów `tests/home.browser.mjs`, `tests/v20.browser.mjs` i skrypty npm.

Wymagana tabela do `docs/finalizacja-2026-11-02/MACIERZ_GALEZI.md`:

`GAŁĄŹ | HEAD SHA | AHEAD/BEHIND | ZMIANY UNIKALNE | ZAWARTE W #6? (dowód) | DZIAŁANIE | RYZYKO`.

**Specjalny przypadek PR #3:** zmiany w starszej implementacji nie mają być dopisywane w ciemno. Audyt zidentyfikował **cztery odrębne materiały biznesowe**:

- `MAD-NET_Cennik_4x3_Scenariusze_i_Decyzje.xlsx`
- `MAD-NET_Cennik_4x3_Umowy_12_24_Bezterminowo_v2.xlsx`
- `MAD-NET_Formularz_Decyzyjny_4x3_VIP_Korzysci_v4.html`
- `MAD-NET_Panel_Decyzyjny_Cennik_4x3.html`

Użytkownik używa tych formularzy do decyzji z właścicielem firmy. **Nie publikuj** ich w publicznym `main`, w katalogu `dist`, pod Pages ani w artefaktach jawnych. Jeśli już są w publicznej historii PR #3, odnotuj ekspozycję i zaproponuj przeniesienie do prywatnego repo/katalogu, lecz **nie wykonuj przepisywania historii** i nie deklaruj usunięcia danych z historii Git bez odrębnej decyzji. Nie kopiuj sekretów ani danych klientów. Sprawdź czy pliki biznesowe znalazły się w #6 — muszą być nieobecne.

**Akceptacja B:** wszystkie gałęzie mają udokumentowaną decyzję, #4 + #5 są wykazane jako funkcjonalnie zawarte w #6, żaden dokument 4×3 nie trafia przypadkiem do publikacji.

## 4. ETAP C — diagnoza dokładnie `ERR_CONNECTION_CLOSED` w CI

**Źródło:** run `41408400330` / job `125155574433`, test `tests/oferta.browser.mjs`, komunikat konsoli `Failed to load resource: net::ERR_CONNECTION_CLOSED`. `tests/oferta.browser.mjs` uruchamia własny `scripts/serve.mjs` na wolnym porcie, tworzy kontekst Playwright, zbiera globalnie `bledy`, `konsola`, `zasoby` i robi `assert.deepEqual(...,[])` po kilkudziesięciu nawigacjach i testach dotyku. Handler:

```js
await kontekst.route(`${adres}/MAD-NET/**`, async trasa =>
  trasa.fulfill({response: await trasa.fetch({
    url: trasa.request().url().replace('/MAD-NET/','/')
  })})
);
```

Ta konstrukcja **nie dowodzi** przyczyny błędu. Prawdopodobne konkurencyjne hipotezy: przerywana nawigacja, anulowane żądanie przy zmianie kontekstu, zakończenie serwera, `route.fetch`/`route.fulfill`, font/obraz/ikona, specyfika Chromium/Linux. Rozstrzygnij na podstawie URL, request ID, typu zasobu, czasu i fazy testu.

**Diagnostyka do wdrożenia na gałęzi integracyjnej** (zaadaptuj do aktualnego kodu; nie duplikuj nasłuchiwaczy):

```js
const zdarzeniaSieci = [];
const faza = {plik: null, szerokosc: null, href: null, scenariusz: null};
const zapis = (typ, dane = {}) => zdarzeniaSieci.push({
  czas: new Date().toISOString(), typ, ...faza, ...dane
});

function obserwujSiec(strona) {
  strona.on('request', r => {
    if (process.env.MADNET_DEBUG_NETWORK === '1')
      zapis('request', {url: r.url(), method: r.method(), resourceType: r.resourceType()});
  });
  strona.on('requestfailed', r => zapis('requestfailed', {
    url: r.url(), method: r.method(), resourceType: r.resourceType(),
    error: r.failure()?.errorText ?? 'unknown'
  }));
  strona.on('response', res => {
    if (res.status() >= 400) zapis('http-error', {
      url: res.url(), status: res.status(),
      resourceType: res.request().resourceType()
    });
  });
  strona.on('console', msg => {
    if (msg.type() === 'error') zapis('console-error', {
      text: msg.text(), location: msg.location()
    });
  });
  strona.on('pageerror', error => zapis('pageerror', {message: error.message}));
}
```

Dodatkowo: rejestruj `requestfinished` w trybie debug, `stdout`/`stderr`/`exit`/`error` procesu serwera, fazy `goto`, kliknięć CTA, koniec aktywnych żądań, stan context/page przy zamykaniu. Obserwuj oba konteksty (desktop i mobile), bo kod testu posiada oba. W razie błędu zapisz `test-results/finalizacja/oferta-network.json`, ostatni URL, poprzednią stronę i obecny viewport; tekst konsoli **sam** bez URL nie wystarcza. Diagnostyka `route.fetch` powinna zawierać `request.url()`, adres docelowy, status, metodę, `resourceType`, wyjątek i kontekst; błędy nadal mają powodować niezaliczenie testu.

Przykład obsługi `route.fetch` z zachowaniem niepowodzenia:

```js
await kontekst.route(`${adres}/MAD-NET/**`, async route => {
  const req = route.request();
  const from = req.url();
  const to = from.replace('/MAD-NET/', '/');
  try {
    const response = await route.fetch({url: to});
    await route.fulfill({response});
  } catch (error) {
    zapis('route-fetch-failed', {
      from, to, resourceType: req.resourceType(),
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
});
```

Powyższe to **szkielet diagnostyczny**, nie gotowy patch: dopasuj zakresy zmiennych i obsługę eventów do pliku; nie doklejaj kodu bez kompilacji i testów. W szczególności ustal, czy błędy `requestfailed` są wynikiem zewnętrznego zasobu czy rzeczywistego zasobu aplikacji. Nie wprowadzaj reguły `ignore ERR_CONNECTION_CLOSED` dla wszystkich stron; ewentualną klasyfikację kontrolowanego anulowania wykonaj **tylko przy twardym dowodzie** lifecycle i z dodatkowymi testami ujemnymi, które nadal wykrywają realne odcięcie CSS/JS/HTML.

Przebieg reprodukcji na Windows/PowerShell:

```powershell
Set-Location 'C:\GitHub\Projects\MAD-NET-integracja' # tylko jeśli git worktree list potwierdzi tę ścieżkę
npm ci
npm run build
$env:MADNET_DEBUG_NETWORK = '1'
node tests/oferta.browser.mjs
Remove-Item Env:MADNET_DEBUG_NETWORK -ErrorAction SilentlyContinue
```

W Linux CI dostępny jest Chromium. Lokalny Windows może użyć Edge z `tests/srodowisko.mjs`; to nie zastępuje reprodukcji w CI. Powtórz test co najmniej 3 razy w stabilnym środowisku oraz po poprawce (powtarzaj warunkowo — nie uznawaj pojedynczego PASS za wyeliminowanie flakiness). Jeśli nie udaje się odtworzyć na Windows, uruchom diagnostyczny workflow na Linux przy tym samym HEAD i przechwyć artefakty; porównaj eventy. Dla flakiness oznacz próbę, środowisko, commit i czas.

Dodatkowa analiza: `tests/oferta.browser.mjs` kończy się asercją braku `bledy`, `konsola`, `zasoby` i blokiem `finally`, więc numer linii z logu należy porównać do **dokładnego SHA** runu. Nie przywiązuj się do numeru 125 po lokalnych zmianach pliku.

**Akceptacja C:** raport przyczyny zawiera realny URL / resourceType / fazę / zdarzenia serwera / twarde uzasadnienie naprawy. Minimalny patch przechodzi testy pozytywne i negatywne. Brak globalnych masek oraz obniżania kontroli.

## 5. ETAP D — naprawa, lokalna regresja i dowody

Wprowadź najmniejszą udowodnioną poprawkę w wyizolowanej gałęzi/worktree integracji. Nie dotykaj `main` podczas diagnozy. Odczytaj `AGENTS.md`, `README.md`, `docs/PLAN_ROZWOJU.md`, `docs/DECYZJE.md`, `docs/ARCHITEKTURA.md`, `docs/naprawa-ci/04-integracja.md` przed zmianami. Przejrzyj co najmniej: `tests/{srodowisko,oferta.browser,integracja.browser,home.browser,fiber.browser,led.browser,v20.browser,v21.browser,pcb.browser,nawigacja.browser,diagnostyka-panelu}.mjs`, `scripts/{serve,build}.mjs`, `.github/workflows/ci.yml`, `package.json`, `index.html`, `cennik.html`, pięć stron ofertowych, kontakt, usługi, krytyczne CSS/JS.

**Sekwencja lokalna, każdą komendę uruchom faktycznie, zapisując exit code/log i czas:**

```powershell
npm ci
npm run verify
npm run test:browser
npm run test:pcb
npm run test:integracja
npm run test:home
npm run test:fiber
npm run test:led
npm run test:oferta
npm run test:nawigacja
git diff --check
```

Dla wszystkich `.js/.mjs` sprawdź `node --check`, a po buildzie obecność `dist/index.html`, `dist/cennik.html`, `dist/assets/js/home.js`, `dist/assets/js/hero-rack.js` (na PowerShell `Test-Path`, nie Bash `test -s`). Sprawdź **rzeczywisty rozmiar** plików, nie tylko istnienie. Jeśli polecenie nie działa na Windows, użyj równoważnej komendy, nie pomijaj kontroli.

Bramki funkcjonalne: 9 stron i 54 układy dla test:integracja; HOME 11 szerokości 320–2560; FIBER 9 szerokości; LINK/ACT LAN i FIBER przy 320/390/1440; V20 286 tras i >=5000 ms; V21 zestawy tabel; PCB 9 szerokości; sprawdzenie konsoli/HTTP/zasobów/ścieżek `/MAD-NET/`; dostępność klawiatury; long press i przewijanie dotykowe; reduced-motion. Nie deklaruj fizycznego testu telefonu, jeśli wykonano tylko emulację. Nie deklaruj wysyłki maili — frontend nie wdraża backendu SMTP.

Zachowaj screenshoty i JSON z przeglądarki, przynajmniej 320/390/768/1024/1440/1920 dla HOME i cennika, a także widoki FIBER i tabeli. Zapisz diagnostykę bez tokenów, danych klientów, lokalnych haseł i dużych plików niepotrzebnych do oceny. **Nie commituj** gigantycznych archiwów i zrzutów w ciemno; wybierz reprezentatywne dowody, pozostałe w artefaktach CI.

Dopiero po pełnym PASS utwórz logiczne commity (diagnostyka, fix, regresja/dokumentacja). Przed `git add` sprawdź `git status --short`, `git diff --check` i `git diff --cached --name-status`. Nie używaj `git add -A`, jeśli są pliki poza uzgodnionym zakresem.

**Akceptacja D:** wszystkie obowiązkowe skrypty kod 0, wszystkie dane biznesowe zgodne z bazą, brak nieuzasadnionych zmian stylów i architektury, zapisane dowody.

## 6. ETAP E — bezpieczeństwo, CI aktualnego HEAD i kryterium GO

Przed push i merge wykonaj audyt nazw/treści zmian pod kątem: `.env`, `credentials`, `token`, `secret`, `password`, `private key`, `api_key`, SMTP, danych klientów, plików 4×3 oraz binariów. Nie wypisuj wartości sekretów. Jeśli wykryto prawdziwy sekret, przerwij i zgłoś wymagane działania właścicielowi; nie przenoś go do logów ani raportu.

Wykonaj push **wyłącznie** gałęzi integracyjnej (jeśli nie ma konfliktu z cudzymi commitami):

```powershell
git push origin feat/integracja-hero-v4-fiber
gh run list --repo kapi1944/MAD-NET --branch feat/integracja-hero-v4-fiber --limit 12
gh pr checks 6 --repo kapi1944/MAD-NET --watch
```

Obserwuj dokładnie runy `push` i `pull_request`, o ile oba emitowane; nie zakładaj SUCCESS, dopóki nie są `completed/conclusion=success` dla najnowszego SHA. Sprawdź, że **żaden ważny krok** nie jest przypadkowo `skipped` (poza świadomymi warunkami workflow) oraz czy artefakty testów istnieją. Jeżeli wystąpi nowy FAIL, zachowaj log/artefakt, odtwórz przyczynę i wróć do C/D.

**Bramka E-GO:** aktualny lokalny HEAD = remote HEAD = `headRefOid` PR #6; brak konfliktu; required checks SUCCESS, właściwe push/PR runy SUCCESS; repo i gałąź są czyste; zakres #4/#5 zachowany; brak biznesowych/sekretnych dodatków. Przed decyzją ponownie `git fetch origin` i sprawdź SHA `origin/main` oraz #6.

## 7. ETAP F — publikacja i MERGE: rozdziel dwa uprawnienia

**Uwaga szczególnie ważna:** użytkownik prosi o scalenie do `main`, ale `AGENTS.md` mówi „jeszcze NIE wersja do publikacji”. Przed scaleniem zbadaj, czy `main` automatycznie publikuje GitHub Pages. Jeżeli tak, publikacja jest nieodłącznym skutkiem merge. **Nie wykonuj jej bez jawnego potwierdzenia właściciela, że aktualny kod może już być publicznie wdrożony.** Zapytaj tylko o tę konkretną decyzję, jeśli brak jej w bieżącym zleceniu; wszystkie pozostałe zadania wykonaj autonomicznie. Jeżeli Pages nie jest powiązane z `main`, po zielonym CI możesz przeprowadzić autoryzowany merge, a publiczną publikację pozostawić na osobną bramkę. Nie obchodź wymogów branch protection.

Po spełnieniu E-GO i bramki wydawniczej:

```powershell
gh pr ready 6 --repo kapi1944/MAD-NET
gh pr merge 6 --repo kapi1944/MAD-NET --merge
# bez --admin, --squash, --rebase, --delete-branch
git fetch origin
gh pr view 6 --repo kapi1944/MAD-NET --json state,mergedAt,mergeCommit
git log -1 --oneline origin/main
```

Nie wprowadzaj zmian do innych worktree. Zaktualizuj lokalne `main` tylko gdy jest czyste i nie narusza innego worktree: `git -C '<faktyczny-worktree-main>' pull --ff-only origin main`. Jeśli użytkownik trzyma tam niezacommitowane zmiany, zostaw worktree nietknięte i oznacz synchronizację lokalną jako `BLOCKED`, podając bezpieczne opcje. Nie używaj merge lub checkout na otwartych gałęziach obcych worktree.

**PR #4/#5:** po merge #6 **ponownie** zweryfikuj, że ich kod faktycznie znajduje się w `main`; jeśli tak, zamknij jako `superseded by #6`, bez ponownego merge. **PR #3:** nie zamykaj bez decyzji o zachowaniu biznesowych plików. **Inne gałęzie:** przygotuj listę do archiwizacji, ale nie usuwaj ich.

**Akceptacja F:** PR #6 `merged=true` i `mergeCommit` w `origin/main`, historia źródeł zachowana (merge commit), brak utraty zmian, status pozostałych PR udokumentowany.

## 8. ETAP G — GitHub Pages i produkcyjne smoke/e2e

Zidentyfikuj źródło Pages (`gh api repos/kapi1944/MAD-NET/pages`), status `pages-build-deployment` albo odpowiedniego własnego workflow; nie przyjmuj, że push automatycznie oznacza opublikowanie aktualnych assetów. Po zgodzie wydawniczej i zakończeniu wdrożenia sprawdź **faktycznie działającą** witrynę:

- `https://kapi1944.github.io/MAD-NET/` — HOME V4, a nie cennik.
- `https://kapi1944.github.io/MAD-NET/cennik.html` — interaktywny cennik i RACK.
- `internet.html`, `monitoring-alarmy.html`, `sieci-it.html`, `strony-www-hosting.html`, `instalacje-tv-sat.html`, `uslugi.html`, `kontakt.html`.

Sprawdź 200 HTTP, aktywne CSS/JS, brak 404/5xx, brak `console.error`, brak `requestfailed` dla assetów aplikacji, 13 pakietów, FIBER SC/APC, LINK/ACT, mobilne menu, linki, CTA, mapę, formularz frontendowy, reduced-motion i sześć szerokości 320/390/768/1024/1440/1920. Skrypt `npm run test:integracja` akceptuje `MADNET_ADRES` wg raportu 04; wykorzystaj go po sprawdzeniu bieżącego kontraktu, nie zakładaj że wszystkie testy mogą bez zmian uruchomić się przeciwko publicznemu hostowi. Dla FIBER/LED raport opisuje także `MADNET_ADRES`. Nie wykonuj działań wysyłających realny e-mail, dopóki backend/odbiorca nie jest jawnie zatwierdzony.

Wymagany **dowód wersji**: porównaj SHA-256 faktycznie pobranych `index.html`, `cennik.html` i krytycznych CSS/JS z aktualnym buildem `dist` uwzględniając ewentualne różnice w deploy (np. konfigurację prefiksu). Jeśli konfiguracja generuje inne bajty, porównaj zawartość semantyczną i wskaż dokładnie przyczynę różnicy; nie ogłaszaj pomyślnej publikacji wyłącznie na podstawie odpowiedzi HTTP 200. Sprawdź działania na `/MAD-NET/` oraz ewentualnym własnym hostnamie tylko jeśli aktywny w Pages.

Jeśli publikacja nie może zostać wykonana: `G=BLOCKED`, zapisz jaki mechanizm zawiódł, id workflow, URL, SHA, objawy i **konkretną procedurę** dla Codexa lub operatora. Jeśli została wykonana, ale krytyczna regresja jest zła, zatrzymaj dalsze czynności i przedstaw **plan przywrócenia** na bazie zweryfikowanego wcześniejszego SHA; nie rób destrukcyjnego resetu ani force push. W publicznym repo preferuj oddzielny, przetestowany PR z `git revert -m 1 <SHA_merge>` na gałęzi naprawczej, tylko gdy analiza rodziców commita i skutków potwierdza taką ścieżkę. Ponowna publikacja musi przejść odpowiednią bramkę CI.

## 9. ETAP H — dokumentacja końcowa i kontrola kompletności

Stwórz `docs/FINAL_MERGE_2026-11-02.md` (lub użyj daty faktycznego wykonania, wskazując datę bazową) z:

1. Przebiegiem A–G i stanami (PASS/FAILED/BLOCKED), SHA przed/po, historią merge-base i linkami do PR/runów.
2. Matrycą wszystkich gałęzi, ich unikalnymi zmianami, decyzją i dowodami.
3. Diagnozą konkretnego `ERR_CONNECTION_CLOSED`, ustaloną przyczyną i minimalnym patchem oraz testami negatywnymi.
4. Tabelą wszystkich komend regresji, kodami wyjścia, środowiskiem, czasem i artefaktami.
5. Kontrolą bezpieczeństwa: brak sekretów, brak publikacji plików 4×3, brak niezatwierdzonych cen.
6. Checkami CI dla **dokładnego** SHA PR #6 i stanem ewentualnych niezaliczonych przebiegów.
7. Dokumentacją decyzyjnej bramki publikacji — kto i na co wyraził zgodę, czy `main` uruchamia Pages.
8. Wynikiem merge `main`/`origin/main` albo precyzyjnym opisem blokady.
9. Testami produkcyjnymi, SHA rzeczywistych assetów i screenshotami albo listą blokad.
10. Ograniczeniami: brak telefonu fizycznego, backend formularza niewdrożony, archiwizacja PR #3, nieokreślone elementy.
11. Diagramem Mermaid przebiegu oraz tabelą `HERO | FIBER | LINK/ACT | Cennik | Podstrony | Formularz | Testy | CI | Merge | Pages`.

Odpowiedź końcowa ma wskazywać **wyłącznie faktycznie wykonane** czynności. Jeśli nie można przejść do dalszego etapu, podaj dokładny punkt wznowienia bez powtarzania zakończonego kodowania; niezrobione zadania pozostają przypisane do Codexa/operatora, a nie znikają z listy.

## 10. Gotowa sekwencja decyzyjna

```text
A AUDYT
  ├─ brak zgodności/stanu worktree → zabezpiecz, opisz BLOCKED
  └─ potwierdzony stan → B MACIERZ GAŁĘZI
B MACIERZ
  ├─ brakujące zatwierdzone źródło → bezpieczny plan przeniesienia + test
  └─ komplet źródeł → C REPRODUKCJA CI
C DIAGNOZA
  ├─ brak twardej przyczyny → dołóż obserwowalność, powtarzaj reprodukcję
  └─ twarda przyczyna → D POPRAWKA + PEŁNA REGRESJA
D LOKALNE TESTY
  ├─ FAIL → wróć do C/D, zachowaj dowody
  └─ PASS → E PUSH + CI DLA NOWEGO SHA
E CI
  ├─ FAIL/PENDING → bez merge, wróć do C/D
  └─ SUCCESS → F BRAMKA PUBLIKACJI + MERGE
F BRAMKA
  ├─ merge publikuje Pages bez zgody → STOP i poproś o konkretną zgodę
  └─ uprawnienia i zgoda potwierdzone → merge commit, dowody
G PAGES
  ├─ FAIL → diagnoza + plan kontrolowanego rollbacku
  └─ PASS → H RAPORT I ARCHIWIZACJA DECYZJI
```

### Ważna uwaga dotycząca promptu startowego

Plik startowy `MAD-NET_CODEX_PROMPT_START.txt` ma być wklejony do Codexa **po** skopiowaniu niniejszej instrukcji do katalogu wskazanego w poleceniu. Codex powinien czytać plik **z dysku**, nie z pamięci rozmowy.
