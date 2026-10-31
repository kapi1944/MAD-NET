# MAD-NET — plan V20: panel technologii wysuwany zza RACK + porządkowanie UI

Status: SPECYFIKACJA, jeszcze nie wdrożona. Baza: V19 (V18 + deep graphite/PCB), zachować funkcje strony.

## 0. Zasady projektowe i ograniczenia
- Najważniejsze: profesjonalny, realistyczny, niewymuszony 'telecom' zamiast szablonowego wyglądu AI.
- Jedna szafa RACK, trzy urządzenia LAN/FIBER/AIR; 13 kanałów łącznie (5/3/5).
- Nie zmieniaj cen, pakietów, adresów, animacji połączeń i formularza.
- Utrzymaj ciemny grafit (#0a0c11 jako otoczenie), separatory nieco jaśniejsze i zagęszczone PCB spod treści, nienachodzące na pola interaktywne.

## 1. Panel technologii musi wysuwać się zza szafy (PRIORYTET P0)
Na desktopie (>1230 px) układ lewe hasło / RACK / panel informacji. Panel NIE wygląda jak osobny kafelek.

### Geometria
1. Zachowaj realny kąt i bryłę szafy. Wysokość panelu nie może przekroczyć widocznej wysokości TYLNEJ ŚCIANKI szafy (na prawo od obróconej obudowy). Użyj pomiarów `getBoundingClientRect()` oraz `ResizeObserver`/`resize` jeżeli nie wystarczą czyste CSS; nie wprowadzaj nieskończonej pętli aktualizacji rozmiarów. Bierz pod uwagę transform 3D i skalę. Jeśli wyliczanie rozmiarów w JS nie jest konieczne, preferuj współdzielone zmienne CSS.
2. Panel wyrównaj pionowo do tej ścianki i odsuń go lekko ZA szafę. Zakładka wchodzi w obszar RACK o około 24–44 px, w zależności od szerokości. Z-index: szafa WYŻEJ niż panel, dzięki czemu zakrywa początek panelu. Nie zasłaniaj prawdziwych interaktywnych portów.
3. Usuń border od strony szafy (lewa krawędź), również lewy zarys pseudo-elementów. Bez sztucznego pionowego obrysu czy szczeliny między szafą i panelem. Prawe naroża panelu pozostaw zaokrąglone; lewą krawędź zamaskuj miękką gradientową ciemnością/poświatą wewnątrz szafy, ale bez utraty czytelności.
4. Nie rozciągaj sztucznie wysokości RACK ani nie skaluj urządzeń wyłącznie po to, aby zmieścić panel. Usuń obecne `min-height:340px` i zbyt duże odstępy/puste miejsca wewnątrz panelu. W razie potrzeby skróć opis, zmniejsz ikonkę, przeprojektuj CTA.
5. Dostosuj grid (obecny: 3 kolumny z `gap:23px`): panel musi pozornie wychodzić spod RACK, ale bez poziomego scrolla, ściśnięcia hasła po lewej ani przewinięcia panelu za brzeg ekranu.

### Informacje i animacja
6. Aktualny stan jest utrzymywany po najechaniu myszą, dotknięciu, kliknięciu i fokusie klawiatury. Po opuszczeniu urządzenia stan nie znika.
7. Kolor nagłówka oraz delikatne tło: LAN czerwony #ff203e, FIBER pomarańczowy #ff7b19, AIR niebieski #3fa8ff. Bez przytłaczającego blasku.
8. Przełączanie opisu płynne (200–400 ms), bez skakania wysokości panelu i przesuwania tekstu/CTA; uwzględnij `prefers-reduced-motion` i wyłączone animacje.
9. Zostaw semantyczny `button` na każdym urządzeniu, czytelny fokus i opis ARIA, a po przejściu do sekcji cennika wybierz odpowiednią technologię.

## 2. Responsywność (P0)
- >= 1231 px: szafa + wysunięty panel z boku; maksymalna wysokość panelu <= wysokość tylnej ścianki z tolerancją do 2 px.
- 761–1230 px: panel może zejść pod RACK, bez nakładania elementów; nie wymuszaj 'wysuwania' po zmniejszeniu szerokości poniżej bezpiecznego progu.
- <=760 px: kolejność tekst -> RACK -> zwięzły panel informacji. Bez bocznego nakładania/uciętego tekstu; obszary dotykowe co najmniej 44x44 CSS px tam, gdzie możliwe.
- <=390 px: brak poziomego scrolla, CTA i informacje mieszczą się w dostępnej szerokości.

## 3. Pozostałe uwagi z bieżącego cyklu V19 (P1)
- Bardzo głęboki szary niemal czarny w tle głównych sekcji; tylko wybrane sekcje i separatory mogą być jaśniejsze. Niedopuszczalna pełna, jednolita jasnoszara płaszczyzna pod cennikiem.
- Więcej tras PCB, bardziej zagęszczone i lekko grubsze; wybrane impulsy powinny być łatwiejsze do zauważenia, ale nie powinny wyglądać jak świąteczna iluminacja. Linie mają wchodzić w głąb obszaru sekcji za treścią, z małą przezroczystością.
- Efekt PCB nie może blokować kliknięć (`pointer-events:none`), kolidować z tekstem ani zwiększać rozmiarów dokumentu; musi respektować `prefers-reduced-motion` i przełącznik animacji.
- Naprawić `scripts/init-git.ps1` i `scripts/publish-github.ps1` dla Windows PowerShell 5.1 (UTF-8 BOM lub ASCII) bez zmieniania istniejącej historii i bez wymuszonego push.

## 4. Testy odbiorcze (P0)
1. Screenshot i pomiar w Chromium: 1440, 1510 i 1920 px. Panel po prawej dotyka/wychodzi spod tylnej ścianki, nie ma lewej ramki, a jego zmierzona wysokość nie przewyższa tylnej ścianki.
2. Screenshot 390, 760, 1024, 1280 px — bez obcięć, bez poziomego scrolla, klikalne wszystkie trzy urządzenia.
3. Trzykrotnie przełącz LAN/FIBER/AIR myszą, klawiaturą i dotykiem: zmienia się kolor, tytuł, opis, CTA i licznik pakietów; stan pozostaje po wyjściu kursorem.
4. Podczas zmiany technologii pozycja CTA, szafy i sekcji nie 'skacze'. Animacje wszystkich 13 kanałów dalej zależą od prędkości.
5. Widok `prefers-reduced-motion: reduce`, przełącznik wyłączania animacji i brak błędów w konsoli.
6. `npm run verify` -> wszystkie testy PASS, build PASS; jeśli to możliwe, test wizualny przed/po dla sekcji innych niż hero i PCB.

## 5. Etapy wdrożenia / kolejność commitów
- P0: `fix(hero): align technology information behind rack` — geometria, warstwy, brak lewej ramki, niższy panel.
- P0: `fix(responsive): safe rack detail panel layout` — tablet/mobile + accessibility + JS resize.
- P1: `style: deep graphite and pcb traces refinement` — kolorystyka, gęstość, pulsacje, reduced motion (można przyjąć V19 jako bazę i tylko dopracować).
- P1: `test: add hero geometry and interaction regression tests` — testy browser + npm verify.

## 6. Prompt dla Codexa
Pracujesz w `C:\\GitHub\\Projects\\MAD-NET` w oficjalnym repozytorium MAD-NET. Przeczytaj AGENTS.md, `docs/DECYZJE.md`, dokument `docs/PLAN_V20_HERO_ZAPLECZE_RACK.md` oraz aktualne style i `assets/js/hero-rack.js`. Zrealizuj P0 punkt 1 i 2 z tego planu, zachowując sprawny V19. Najważniejsze: na desktopie panel informacji o LAN/FIBER/AIR ma wyglądać jak wyłaniający się zza PRAWEJ/TYLNEJ ścianki szafy RACK. Brak lewego borderu. Panel nie może być wyższy niż widoczna tylna ścianka obróconej szafy; zmierz faktyczne wymiary po transform 3D, bez sztywnych wysokości 340px. Szafa musi być warstwą nad panelem. Zachowaj 3 urządzenia, wszystkie 13 animacji LED/Wi-Fi oraz reakcję na hover/tap/focus. Na tabletach i telefonach stosuj układ bez nakładania i clippingu. Testy przy 390/760/1024/1280/1440/1510px, kontrola braku poziomego scrolla, screeny i testy interakcji, `npm run verify`. Pracuj małymi commitami, push tylko do prawidłowego skonfigurowanego origin; bez destrukcyjnego resetu. Nie przepisywać całej strony. Na koniec podaj zmienione pliki, wyniki testów, ograniczenia i screeny.
