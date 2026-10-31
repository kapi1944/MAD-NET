# MAD-NET — HERO RACK REALISM 2.1 / KOREKTA WIERNOŚCI WIZUALNEJ

**Repo:** `C:\GitHub\Projects\MAD-NET`  
**Punkt wyjścia:** gałąź `codex/hero-rack-realism-2`, commit `e3bb144` (zweryfikuj rzeczywisty HEAD; nie zakładaj, że nic się nie zmieniło).  
**Zakres:** tylko sekcja HERO; nie przebudowuj innych sekcji ani funkcjonalności V21.

## 0. Referencja i problem

Ostatni wynik „HERO RACK REALISM 2.0” **nie został zatwierdzony**. Testy przechodzą, ale wygląd znacznie odbiega od zaakceptowanej wizualizacji. Testy poprawności nie są dowodem zgodności wizualnej.

W tym zadaniu źródłami prawdy są, w tej kolejności:
1. Ostatnia wyraźnie zaakceptowana przez użytkownika wizualizacja `Nowoczesna oferta internetu MAD-NET.png` znajdująca się lokalnie w projekcie (nie modyfikuj jej ani nie commituj bez potrzeby).
2. Załączona przez użytkownika para porównawcza — po lewej **CEL**, po prawej **OBECNY STAN**. Pomocniczy wycinek: `docs/referencje/hero-2-1/03_POROWNANIE_REF_AKTUALNY.png`.
3. Szkice mechaniczne (dostarczone, **schematy, a nie projekty graficzne**): `docs/referencje/hero-2-1/01_MOCOWANIA_2_SRUBY_NA_STRONE.png`, `docs/referencje/hero-2-1/02_PANEL_ZA_SZAFA_GEOMETRIA.png`.
4. Wymagania tekstowe zawarte w tym poleceniu.

**UWAGA:** Na porównaniu referencja pokazuje stan `AIR`, a obecny render `LAN`. W testach porównawczych doprowadź obie strony do **tego samego stanu `AIR`** i **tej samej szerokości viewportu**. Nie uznawaj różnicy niebieski/czerwony za błąd koloru, jeśli wynika jedynie z innej aktywnej technologii.

Przed implementacją przedstaw krótką listę konkretnych różnic: proporcje bryły, wysokość i przekrój górnego kołnierza, głębokość prawej ściany, kolor frontów, czytelność panelu opisowego i gęstość PCB.

## 1. BEZWZGLĘDNA KOREKTA MOCOWANIA — 12 ŚRUB

W aktualnym `index.html` każdy z **6** uchwytów `.rack-ear` ma tylko **jedno** wewnętrzne `<i>`, a w `assets/css/styles.css` reguła `.rack-ear>i` ustawia śrubę na `top:50%`. To **błąd**.

Docelowo:
- **3 urządzenia**: LAN, FIBER, AIR.
- Każde ma **2 metalowe uszy montażowe**: lewe i prawe.
- Każde ucho ma **2 widoczne śruby**: górną i dolną.
- **Łącznie 3 × 2 × 2 = 12 widocznych śrub montażowych**; dokładnie cztery na urządzenie.
- Każda śruba musi być osadzona w **górnym/dolnym otworze uchwytu** pokrywającym się z odpowiednim kwadratowym otworem/podkładką klatkową pionowej szyny. Nie rysuj śrub przypadkowo na pustych szynach.
- Mocowania muszą optycznie stanowić **przedłużenie panelu czołowego każdego urządzenia**. Wykorzystaj ten sam materiał, wysokość, linie krawędzi i cień kontaktowy; nie mogą wyglądać jak osobne pionowe listwy leżące nad frontami.
- Śruby: nieduże, stalowe, z łbem i subtelnym nacięciem; bez przesadnego chromu, bez dodatkowych „śrub dekoracyjnych” pośrodku.
- Zachowaj dwa równe rzędy punktów mocowania po lewej i po prawej stronie każdego urządzenia. Przy małych viewportach zachowaj dwie śruby, nie ukrywaj jednej regułą media query.

Przykładowa semantyka DOM (dostosuj do rzeczywistego kodu):

```html
<i class="rack-ear rack-ear-left" aria-hidden="true"><i class="rack-screw top"></i><i class="rack-screw bottom"></i></i>
<!-- element urządzenia -->
<i class="rack-ear rack-ear-right" aria-hidden="true"><i class="rack-screw top"></i><i class="rack-screw bottom"></i></i>
```

W CSS **nie** centruj obu śrub przez `top:50%`. Nadaj im dwie różne, symetryczne pozycje (`top` i `bottom`) z korektą przy mobile. Szkic `01_MOCOWANIA_...png` jest jednoznacznym kryterium mechanicznym.

## 2. ZGODNOŚĆ BRYŁY Z REFERENCJĄ — NIE NOWY DESIGN

Popraw ostatnią implementację, zamiast projektować szafę po swojemu.

- **Front nadal dominuje**; tylko lekka perspektywa (bez silnego skręcania bryły).
- Górny kołnierz ma wyglądać jak **gruby, stalowy, trapezowo ukształtowany rant z szeregiem realnych szczelin wentylacyjnych**. Obecna zbyt płaska górna belka jest niezgodna z referencją.
- Widoczna **głębia otwartego korpusu** za frontami urządzeń — ciemne wnętrze, realne boczne wnęki, delikatne cienie kontaktowe i przedni kołnierz zachodzący nad wnętrzem. Nie doklejaj losowych cieni do kafelków.
- **Prawa zdejmowana pokrywa boczna** powinna mieć czytelną powierzchnię/rozmiar (obecnie jest zbyt wąska i płaska), obrys łączenia blach, realistyczne otwory wentylacyjne i **mały osadzony zamek cylindryczny**. Żadnych wiszących kluczy, frontowych drzwiczek, obcych logotypów.
- Na górnym kołnierzu logo **MAD-NET** (nie logo producenta obudowy). Nie nadużywaj znaczka na wielu elementach ramy.
- Odwzoruj bardziej charakterystyczne, lekko błyszczące krawędzie i stalowe światło referencji, **bez dekoracyjnych nierealistycznych neonów**.
- Szafa ma być głównym obiektem, o zbliżonej dominancie i skali jak w zaakceptowanej referencji. Nie skaluj jej tak, by zniknęły porty.

## 3. PRZYWRÓĆ CHARAKTER FRONTÓW TRZECH URZĄDZEŃ

W obecnym renderze urządzenia wyglądają zbyt podobnie, płasko i niemal całkowicie czarno. Referencja ma **trzy wyraźne, nadal technicznie wiarygodne fronty**:
- LAN: ciemny burgund / czerwień, 5 RJ-45.
- FIBER: głęboki miedziano-pomarańczowy (`#FF7B19` jako akcent), 3 SC/UPC **Simplex**.
- AIR: ciemny niebieski, **5** osobnych symboli Wi-Fi, **bez** gniazd fizycznych.

Kolor ma być widoczny na **istotnej części blachy czołowej**, ale nie jako jednolita jaskrawa plama; prawdziwa matowa powierzchnia, lekki gradient światła. Zachowaj proporcje logo, numerów i portów. Nie dodawaj obcych symboli ani nadmiarowych kontrolek. Nie zmieniaj tempa indywidualnych animacji 13 kanałów; zachowaj `--pulse`, `--phase`, `--air-cycle` oraz ich działanie niezależne od hover.

## 4. PANEL OPISOWY: KONTYNUACJA SZAFY, NIE KAFEL OBOK

- Panel musi wyglądać, jakby **wysuwał się spod tylnej części prawej ścianki**.
- Wizualne nachodzenie na szafę: początkowo ok. **24–45px**, ostatecznie dostosowane do bryły.
- **Cały panel ma być za szafą**, ale jego **treść** zaczyna się na tyle daleko w prawo, aby absolutnie nic nie zostało ukryte pod ścianką. Zapewnij odpowiedni `padding-inline-start` lub przesuń wnętrze panelu, nie sam panel.
- Lewy border niewidoczny, lewy promień zaokrąglenia niewidoczny; zachowaj widoczne prawe obramowanie.
- Wysokość panelu **≤ wysokości widocznej bocznej ścianki RACK**; mierz faktyczny render/perspektywę, nie arbitralny `min-height`.
- Wysokość, położenie i skala treści stabilne przy LAN → FIBER → AIR.
- Kolory: LAN czerwony, FIBER pomarańczowy, AIR niebieski; kolor tła **delikatny**. Przy zmianie technologii panel ma płynnie zmieniać treść, nie odskakiwać od szafy.
- Na wąskim desktopie/tablecie/mobilnym dopuszczalny osobny układ pod szafą zamiast złego skalowania.

Szkic: `02_PANEL_ZA_SZAFA_GEOMETRIA.png`.

## 5. DARK PCB — BLIŻEJ REFERENCJI

Aktualne tło jest zbyt słabo zauważalne wobec referencji. Dodaj więcej **ciemnych, gęstych czerwonych ścieżek** i miejscowe impulsy, ale zachowaj dominację czerni/grafitu i czytelność tekstu. Najwięcej ścieżek wokół dołu szafy oraz po obrzeżach. Nie rób jasnoczerwonej tapety, nie dodawaj gotowej bitmapy stockowej ani znaku wodnego. Pozostaw generatywne SVG/CSS, o ile jest wydajne. Jeśli tego wymaga scope, modyfikuj wyłącznie istniejące dekoracyjne SVG HERO.

## 6. KROKI I TESTY WIZUALNE (OBOWIĄZKOWE)

1. `git status` i aktualny `git log`; pracuj na nowej gałęzi potomnej z `codex/hero-rack-realism-2` lub na tej gałęzi, jeśli to świadoma kontynuacja — **nie edytuj `main`**. Nie dotykaj nieśledzonych plików użytkownika.
2. Przed zmianami screenshot **AIR** (stan jak w celu), następnie LAN i FIBER. Użyj identycznych rozdzielczości. Priorytet: 1024–1100px oraz 1440px, następnie 390/430/768/1920.
3. Najpierw popraw 12 śrub i geometrię mocowań. Zrób detal/zbliżenie; policz na screenshotach ręcznie i automatycznie liczbę uchwytów oraz śrub.
4. Następnie porównaj w 2 kolumnach bryłę, wysokość i kolor urządzeń, wymiar ścianki, panel, tło. Obejrzyj rzeczywisty rendering, nie tylko logi.
5. Skontroluj brak pustych szczelin między mocowaniem a frontem, brak wizualnych śrub poza uchwytami, brak przecinania tekstu panelu przez ściankę.
6. Przebieg: `npm run verify`, `npm run test:browser`, kontrola CSS/JS w przeglądarce. Jeśli istnieje test screenshotowy, nie akceptuj zaktualizowanych wzorców bez wizualnego przeglądu.
7. Regresje: 5 LAN, 3 FIBER, 5 AIR; wszystkie LEDy/wave aktywne; hover, focus, dotyk (przewijanie nie zmienia losowo wyboru), CTA do wybranej technologii; brak poziomego scrolla; reduced-motion; nie zmieniaj V21/cennika, mapy ani formularza.
8. Zapisz parę **przed/po** (ten sam viewport i AIR) oraz **3 zbliżenia mocowań**; w raporcie pokaż, gdzie dokładnie są 12 śrub. Nie commituj masowych tymczasowych zdjęć do `test-results`.
9. Dopiero po obejrzeniu wyniku i pozytywnej walidacji zrób commit na gałęzi roboczej oraz push. Nie rób merge do `main`, nie używaj force push.
10. W końcowym raporcie rozdziel **„zgodność geometryczna i wizualna”** od **„testy funkcjonalne”**. Jeśli któryś aspekt nadal nie odpowiada referencji, wymień go jako niedokończony — NIE deklaruj pełnego sukcesu.

### KRYTERIA ODBIORU

- [ ] Widocznych **dokładnie 12 śrub** mocujących, 2 na każdej stronie każdego z 3 urządzeń.
- [ ] Stalowe uszy łączą się wizualnie z panelami urządzeń; szyny mają prawidłowe otwory.
- [ ] Gruby, modelowany górny rant + przekonująca głębokość szafy + zdejmowana prawa ścianka z osadzonym zamkiem.
- [ ] Kolorystyka i geometria zbliżone do obrazu referencyjnego; zachowany **otwarty front bez drzwi**.
- [ ] Panel wychodzi **zza szafy**, bez lewego borderu i bez schowanej treści; nie jest wyższy niż tylna ścianka.
- [ ] Dark PCB wyraźniejsze od aktualnego, lecz nadal ciemne i nieprzesadzone.
- [ ] Wszystkie **13 animacji i przełączanie treści** działają jak wcześniej.
- [ ] Porównanie AIR do AIR na tym samym viewport; raport + screeny + zielone testy.

**WPROWADŹ ZMIANY W KODZIE. NIE KOŃCZ NA SAMYM PLANIE.**
