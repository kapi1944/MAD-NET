# Etap 04 — podstrony i odzyskanie zielonego CI

Data: 2026-11-01. PR #2, gałąź `feat/madnet-integracja-home-v3`.
Punkt startowy: czyste repo na main; przełączono na istniejącą gałąź integracyjną.
Lokalny i zdalny HEAD przed zmianami: `a56384c465673bfa1a603774be94fd0cd01e8403`.
Nie odtwarzano implementacji od nowa. Bez merge i publikacji Pages.

## Audyt podstron

| Strona | Stan | Indywidualna kompozycja |
|---|---|---|
| internet.html | GOTOWE | Schemat trzech dróg dostępu LAN/FIBER/AIR, wybór technologii |
| monitoring-alarmy.html | GOTOWE | Obraz i sygnał, prezentacja zabezpieczeń obiektu |
| sieci-it.html | GOTOWE | Topologia LAN, przełącznik, komputery, Wi-Fi, serwer |
| strony-www-hosting.html | GOTOWE | Etapy od przekazu do publikacji, różne ekrany |
| instalacje-tv-sat.html | GOTOWE | Poglądowa droga antena–tor kablowy–odbiornik |

Sekcje usług, opis zakresu, FAQ oraz końcowe CTA istnieją. Wspólne komponenty:
nagłówek/menu usług, stopka, CTA, tło PCB, ilustracje SVG, fotografie i FAQ.
Zachowano kierunek HOME V3, ciemną paletę i typografię; kompozycje różnią się treścią i ilustracją.
Test oferty sprawdza 320,390,768,1024,1440,1920 px, obrazy, overflow, teksty CTA,
FAQ, fokus, Enter/Space/Escape/Tab, reduced-motion, dotyk i rzeczywiste nawigacje.
CTA Internetu sprawdzają aktywną technologię oraz liczbę pakietów po przejściu.
Ceny i 13 pakietów pozostały w dotychczasowym źródle.

## Przyczyna i naprawa

CI na Ubuntu/Chromium przed poprawką: błąd kolizji parametrów i CTA 390px AIR
w run `41310083663`, job `124863693402`. To problem produkcyjnego CSS, nie pomiaru zegara.
Panel miał 274px na telefonie / 236px na tablecie, środkowy grid `min-height:0`
i wiersz `1fr`. Dłuższy tekst AIR mógł wyjść poza przydzielony obszar.
Poprzednia poprawka obejmowała tylko <=380px, nie usuwała przyczyny w pełnym zakresie.

W istniejącym nawigacja.css do 1230px panel ma teraz naturalną wysokość i zachowane
minimalne wysokości 274/236px. Wiersz treści respektuje min-content, a opis rezerwuje
trzy wiersze (4.95em = 3 × line-height 1.65). Nie ukrywamy kolizji overflow:hidden.
Desktop od 1231px zachowuje dotychczasowe reguły. RACK, jego JS i chronione pliki nie zmieniły się.

Test diagnostyka-panelu.mjs mierzy 17 szerokości × 3 technologie, zapisuje rzeczywiste
prostokąty i wiersze grid; sprawdza brak kolizji, overflow, wyjście CTA poza panel
oraz identyczną wysokość podczas zmiany technologii. Screenshoty powstają po przejściu.
V20 rozszerzono do 22 szerokości, bez zmiany tolerancji i usuwania asercji.
Dotychczasowy pomiar podświetlenia używa jednej próbki czasu na klatkę,
kończy dopiero przy >=5000ms i sprawdza ciągłość wszystkich próbek. Próg nie został zmniejszony.

Historyczny wzorzec cennika w home.browser otrzymuje jawny, stały snapshot wyłącznie
zatwierdzonej korekty CSS. Nie odczytuje oczekiwań z aktualnego arkusza: przyszłe zmiany
nadal mogą złamać ścisłe porównanie wszystkich współrzędnych, wymiarów i typografii.
Oferta: odsunięto kursor przed niezależnym scenariuszem klawiatury, aby hover nie
przełączał menu podczas przewijania po fokusie. Zachowano rzeczywiste naciśnięcia i asercje.

## Weryfikacja

- `npm run verify`: PASS, 13 testów, build 9 stron; integralność chronionych plików PASS.
- `npm run test:pcb`: PASS.
- `npm run test:home`: PASS, HOME i cennik, smoke root i /MAD-NET/.
- `npm run test:nawigacja`: PASS.
- `npm run test:oferta`: PASS, pięć stron / 30 układów, CTA, dotyk, brak błędów JS/HTTP.
- Diagnostyka panelu: PASS 51 kombinacji na Windows/Edge.
- Pełne `npm run test:browser`: wynik końcowy poniżej.

Wyniki nie oznaczają identyczności wszystkich pikseli animowanych teł: log zawiera
różnice pikseli; testy geometrii i typografii pozostają ścisłe. Zmianę mobilnego HERO
uwzględniono świadomie, bez aktualizacji hashy integralności.

## Dowody i ograniczenia

[Dowody](04-dowody/) obejmują pomiary JSON panelu, screenshoty AIR 320/390/1024/1440/1920
oraz desktop/mobile pięciu usług. Pełne screenshoty i logi testów są też w test-results;
CI publikuje panel i etap 04 jako artefakt. Bez fizycznego telefonu; dotyk emulowany.
Dane biznesowe (ceny, zasięg, warunki, kontakt) wymagają zatwierdzenia właściciela.
Frontendowy formularz nie stanowi dowodu działania SMTP/backendu.

## Zmienione pliki

- assets/css/nawigacja.css — lokalna korekta panelu.
- tests/diagnostyka-panelu.mjs — 51 pomiarów i screenshoty.
- tests/v20.browser.mjs — pełniejsza siatka szerokości.
- tests/home.browser.mjs — jawny snapshot korekty historycznego HERO.
- tests/oferta.browser.mjs — izolacja kursora podczas próby klawiatury.
- package.json — diagnostyka panelu w test:browser.
- .github/workflows/ci.yml — dodatkowe dowody panelu i usług w artefakcie.
- ten raport i katalog 04-dowody — dokumentacja wyników.

## Wynik końcowy lokalny i CI

Pełne `npm run test:browser`: PASS (kod 0): 51 pomiarów panelu, V20 22 szerokości /
286 tras, V21 64 kombinacje tabel, HOME, nawigacja, pięć usług. Wszystkie sześć
wymaganych poleceń wykonano; brak SKIP. Logi końcowe zapisano w 04-dowody.
CI po push należy odczytać dla nowego SHA; wcześniejsze czerwone runy nie są wynikiem tej poprawki.
