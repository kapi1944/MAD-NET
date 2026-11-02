# RECOVERY 04 — integracja HERO V4, SC/APC i LINK/ACT

Data: 2026-11-02. Gałąź: `feat/integracja-hero-v4-fiber`. Worktree: `C:/GitHub/Projects/MAD-NET-integracja`.

## Stan początkowy i źródła

Ponownie wykonano fetch, sprawdzono wszystkie worktree i stan PR. Wykorzystywane katalogi były czyste. `main` i `origin/main` wskazywały `1987ad3aa8a65fd1aa86f077af1addf3225bb228`; zawierały już pięć podstron usług z Etapu 04. Nie zmieniano katalogów ani gałęzi użytkownika.

| Źródło | SHA | Aktualne CI push / PR |
|---|---|---|
| [PR #4 — HERO V4](https://github.com/kapi1944/MAD-NET/pull/4) | `21aa43e859c38c7d3522846abea15af19079ec69` | [41401943958](https://github.com/kapi1944/MAD-NET/actions/runs/41401943958) / [41401950355](https://github.com/kapi1944/MAD-NET/actions/runs/41401950355): SUCCESS |
| [PR #5 — czysty FIBER](https://github.com/kapi1944/MAD-NET/pull/5) | `3b3d7b4bed91b13cf2c7f9d0cb4fd392680cfd73` | [41366144180](https://github.com/kapi1944/MAD-NET/actions/runs/41366144180) / [41366150059](https://github.com/kapi1944/MAD-NET/actions/runs/41366150059): SUCCESS |

RECOVERY 01/02 są opisane w `01-izolacja.md` i `02-fiber.md`. RECOVERY 03 zakończono dopiero po obu zielonych kontrolach aktualnego SHA wskazanego powyżej; diagnostyka w `03-hero-v4.md`. Integrację rozpoczęto po ich zakończeniu.

Nowy worktree utworzono z aktualnego `origin/main`. Wykonano fast-forward do źródła HERO oraz merge źródła FIBER z zachowaniem obu historii. Commit kontrolny integracji: `73d47ffd6bb892ebd6f40b86d67f922fb0d52855` (dwaj rodzice: wskazane źródła). Bez rebase, reset, clean, stash, force-push i bez cherry-pick mieszanych commitów.

## Konflikty i integralność

Trzy konflikty treści rozwiązano fragmentami:

- `package.json`: zachowano wszystkie skrypty obu źródeł; HOME, FIBER i LED wykonują się przed dłuższą regresją V20/V21.
- `tests/home.browser.mjs`: pozostawiono pełny test HERO V4, 11 szerokości i ścisłe porównanie sekcji poza HERO; dołączono środowisko testowe i dostosowanie historycznego wzorca cennika do zatwierdzonego SC/APC z PR #5.
- `tests/v20.browser.mjs`: zachowano pomiary inicjalizacji i fontów z RECOVERY 03 oraz rzeczywistą kontrolę 13 kanałów SC/APC/LAN/AIR z RECOVERY 02, włącznie z próbami negatywnymi. Nie usunięto progu co najmniej 5000 ms, hit-testów ani asercji kolizji.

Automatyczne połączenie `tests/home.test.mjs` sprawdzono ręcznie: zachowuje ochronę treści poza HERO, hashe zatwierdzonych modułów i pełne porównanie danych 13 pakietów, cen oraz opłat z `main`. Dokumentacja README i ARCHITEKTURA zachowuje opis V4 oraz SC/APC i kolejności importów. Pozostałe pliki aplikacji nie wymagały rozwiązywania konfliktów.

Porównania źródeł potwierdziły:

- `index.html`, `home.css`, `hero.css` są identyczne ze źródłem HERO;
- `cennik.html`, `cennik.js`, `hero-rack.js`, `sprzet-fiber.js`, `sprzet-fiber.css`, `styles.css` są identyczne z czystym FIBER;
- pozostają 5 LAN / 3 FIBER / 5 AIR, dotychczasowe ceny i warianty umów, RACK, mapy, formularz frontendowy, pięć podstron, nawigacja i przekazywanie technologii;
- zachowano poprawkę stabilnej wysokości instrukcji FIBER na telefonie, niezbędną dla długiego dotyku bez przeskoku przewijania.

Nie scalano PR #3 ani starszych gałęzi sprzętu. Pominięto oba arkusze Excel i oba formularze biznesowe `MAD-NET_*4x3*`, zmiany cen i wcześniejsze warianty HERO. Oryginalne gałęzie i ich rezultaty zachowano.

## Wykryta usterka kontaktu i poprawka lokalna

Kontrola wszystkich dziewięciu stron ujawniła istniejące także w produkcyjnym `main` nakładanie tekstu przycisku e-mail na sąsiedni link. Mobilna reguła `.wspolne-cta` nagłówka nadawała temu przyciskowi szerokość 42 px i font 20 px. Na 320/390/768 px tekst zajmował 279.03125 px, zaczynając się poza lewą krawędzią ekranu. [Pomiary rzeczywistej produkcji przed poprawką](04-pomiary/kontakt-przed.json).

Jedna reguła `.tymczasowe-kroki>.wspolne-cta` w `assets/css/uslugi.css` przywraca szerokość zależną od tekstu, padding i font przycisku treści. Nie zmienia nagłówka wspólnej nawigacji ani pozostałych stron. Dodatkowo poniżej 350 px tytuł strony kontaktu ma font 38 px: oryginalne słowo „Porozmawiajmy” przy 43 px kończyło się na x=332.6875 przy viewport 320 px ([pomiar](04-pomiary/kontakt-tytul-przed.json)). Pozostałe szerokości pozostają bez zmian. Dodatkowy test sprawdza zakres każdego fragmentu tekstu CTA względem jego przycisku.

## Dodatkowa weryfikacja integracji

`test:integracja` obejmuje wszystkie dziewięć stron przy 320/390/768/1024/1440/1920 px (54 układy): overflow, treść, CTA, menu klawiaturą, obrazy, wspólny nagłówek i stopkę, błędy JS/sieci, odpowiedzi HTTP i SHA-256 rzeczywiście pobranych zasobów względem `dist`. Ładuje obrazy lazy przez przewijanie strony przed kontrolą kompletności. Zapisuje zrzuty oraz JSON w `test-results/integracja/lokalnie`.

Ten sam test obsługuje jawne `MADNET_ADRES` dla rzeczywistego Pages (36 układów, bez przechwytywania odpowiedzi i bez zastępowania zasobów). Testy FIBER i LED również przyjmują ten adres, zachowując wszystkie asercje. Domyślnie nadal używają własnego serwera na wolnym porcie. Nie dodano zależności, API ani funkcji aplikacji. CI wykonuje dodatkowo regresję dziewięciu stron i przechowuje jej artefakty.

Pełne zrzuty robocze i logi są w ignorowanym `test-results/` oraz `recovery04-*.log`; wybrane dowody i pomiary utrwalono obok raportu. Testy dotyku są emulacją przeglądarki, nie badaniem fizycznego telefonu. Formularz nie ma wdrożonego backendu SMTP; nie deklaruje się wysyłki wiadomości.

## Dowody wizualne

Przejrzano wszystkie dziewięć stron w sześciu wymaganych szerokościach, w tym proporcje fotografii, położenie CTA i nagłówków oraz układy desktop/tablet/telefon. Naprawiono oba wykryte błędy kontaktu. Zestawienia dziewięciu stron: [320](04-zrzuty/dziewiec-stron-320.png), [390](04-zrzuty/dziewiec-stron-390.png), [768](04-zrzuty/dziewiec-stron-768.png), [1024](04-zrzuty/dziewiec-stron-1024.png), [1440](04-zrzuty/dziewiec-stron-1440.png), [1920](04-zrzuty/dziewiec-stron-1920.png). Sprzęt: [FIBER mobile](04-zrzuty/fiber-led-390.png), [LAN desktop](04-zrzuty/lan-led-1440.png), [tabela desktop](04-zrzuty/tabela-desktop.png), [tabela mobile](04-zrzuty/tabela-mobile-390.png). Tabela zachowuje celowe przewijanie poziome na telefonie, sprawdzane w testach. [54 układy i 38 zgodnych zasobów](04-pomiary/dziewiec-stron.json); [pomiary regresji](04-pomiary/regresja-lokalna.json).

## Wyniki lokalne

| Polecenie | Wynik |
|---|---|
| npm run verify | PASS — 18/18, build 9 stron |
| npm run test:browser | PASS — HOME, FIBER, LED, diagnostyka, V20, V21, nawigacja, oferta |
| npm run test:home | PASS — 11 szerokości i ścisła regresja poza HERO |
| npm run test:pcb | PASS — 9 szerokości 360–2560 px |
| npm run test:nawigacja | PASS — linki, menu, dotyk, stare URL |
| npm run test:oferta | PASS — pięć stron, 30 układów, FAQ i CTA |
| npm run test:fiber | PASS — 9 szerokości, mechanika, trasy, tap/long press/scroll, anulowanie |
| npm run test:led | PASS — 6 układów LAN/FIBER, cztery reprezentacje i ciągłość ACT |
| npm run test:integracja | PASS — 54 układy, 38 zasobów, CTA i zakresy tekstu |
| node --check | PASS — wszystkie pliki JS/MJS aplikacji, testów i skryptów |
| git diff --check | PASS |

Wszystkie polecenia zakończyły się kodem 0, również osobne skrypty wymagane w poleceniu. V20: 286 tras bez kolizji i 112 porównań wyboru technologii, maksymalna zmiana geometrii 0 px. Font Windows: Segoe UI. Nie usunięto istotnych asercji, nie obniżono tolerancji i nie dodano masek wizualnych.

## PR, CI i dalsza obsługa

Po lokalnym PASS gałąź jest przeznaczona do Draft PR. Stan CI integracji trzeba odczytać dla aktualnego HEAD; samo zielone CI źródeł nie wystarcza. Wynik oraz link do PR zostaną dopisane po jego utworzeniu i zakończeniu kontroli.

Na koniec RECOVERY 04 main i origin/main mają pozostać na 1987ad3, a Pages bez publikacji integracji. PR #3/#4/#5 pozostają otwarte. Po odrębnym, zatwierdzonym scaleniu integracji można potwierdzić zastąpienie #4/#5 i zamknąć je bez ponownego merge oraz bez usuwania gałęzi. #3 zawiera unikalne dokumenty biznesowe poza zakresem: nie zamykać go automatycznie bez sprawdzenia potrzeby ich zachowania. Niniejszy etap nie publikuje strony ani nie uruchamia etapu 05.
