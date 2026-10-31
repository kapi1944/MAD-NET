# Plan rozwoju MAD-NET po imporcie V18

## Zasada nadrzędna

Celem jest oficjalna witryna firmy, ale pierwszym krokiem **nie jest redesign od zera**. Wersja V18 jest bazą wizualną. Wprowadzać usprawnienia małymi commitami po sprawdzeniu działania na komputerze i telefonie.

## Etap 0 — stabilny fundament (przygotowany)

- [x] Przeniesienie V18 do `index.html`, `assets/css`, `assets/js`, `assets/img`.
- [x] Archiwum oryginalnego pliku.
- [x] Lokalny podgląd z odświeżaniem, statyczny build, podstawowe testy i CI.
- [ ] Wykonanie pierwszego commita przez właściciela na Windows.
- [ ] Utworzenie prywatnego GitHub repo i push.
- [ ] Potwierdzenie, że zrzuty nowego projektu odpowiadają oryginałowi.

## Etap 1 — HERO RACK: jakość i realizm (następny)

- [ ] Dopracować proporcje niskiej szafy, lekki kąt 3D, głębsze osadzenie urządzeń i mocowania do szyn.
- [ ] Prawy panel technologii: płynne przejścia bez skoków layoutu, stonowane tło w kolorze LAN/FIBER/AIR.
- [ ] Wszystkie 13 kontrolek działa niezależnie i ma tempo dopasowane do pakietu.
- [ ] Interakcje hover, touch i focus są czytelne i nie blokują przewijania.
- [ ] Układ 3 kolumn desktop / sensowne przejście 2/1 kolumny na tablet/mobile.
- [ ] Preferencja `prefers-reduced-motion`, kontrast i czytelność napisów.

## Etap 2 — silnik połączeń / cable management

- [ ] Przejść na testowalny routing po wolnych korytarzach (orthogonal + rounded corners).
- [ ] Zachować poprawne fizyczne wejścia gniazd, również dla dolnego rzędu pakietów.
- [ ] Zero przecięć wnętrz kart; kabel od portu urządzenia do portu pakietu, bez przerw.
- [ ] Sekwencja: wtyczka urządzenia → scroll do środka widoku → podłączenie do pakietu.
- [ ] AIR: kropeczki po tych samych trasach z tempa zależnego od szybkości.
- [ ] Testy tras w przeglądarce dla 13 pakietów × kilku szerokości.

## Etap 3 — cennik i czytelność

- [ ] Przegląd pakietów, cen i okresów umów z oficjalnym cennikiem (źródło prawdy zatwierdzane przez firmę).
- [ ] Sprawdzić tabelę: nazwy pakietów, ceny 1/2 lata, „Wycena indywidualna” przy bezterminowych.
- [ ] Połączenie wybranego pakietu z formularzem zapytania bez duplikowania danych.
- [ ] Dodatkowa optymalizacja tabeli dla małych ekranów.

## Etap 4 — formularz i prawdziwe zapytania

- [ ] Osobny **serwerowy** moduł SMTP (bez sekretów w frontendzie) z ochroną antyspamową i walidacją.
- [ ] Test rzeczywistej wiadomości na `biuro@mad-net.pl` i automatycznego e-maila z podziękowaniem.
- [ ] Potwierdzenie kontaktu SMS tylko gdy powstanie świadomie wybrana integracja; obecnie go nie ma.
- [ ] Polityka prywatności, RODO, retencja, zgodność z zasadami OpenStreetMap/Nominatim.

## Etap 5 — uruchomienie oficjalnej witryny

- [ ] Lighthouse, dostępność WCAG, SEO dla miejscowości w zasięgu, dane kontaktowe.
- [ ] Obrazy, cache, wydajność, monitorowanie błędów.
- [ ] Hosting, domena, kopie i plan wycofania zmian.
- [ ] Kontrola ostatecznej treści i zgoda właściciela MAD-NET na publikację.
