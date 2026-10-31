# HERO RACK 2.1 — przegląd przed akceptacją

Wersja 2.0 została odrzucona wizualnie. Poprzedni wpis passed nie oznaczał akceptacji użytkownika i został zastąpiony tą oceną.

## Dowody

- Wzorzec: Nowoczesna oferta internetu MAD-NET.png, 1774 × 887 px.
- Dokument i schematy: MADNET_HERO_REALIZM_2_1_DO_REPO/docs/PROMPT_HERO_REALIZM_2_1.md i podkatalog referencje/hero-2-1/. Schematy mechaniczne nie zastępują projektu wizualnego.
- Rendering: test-results/realizm-2-1/po/hero-AIR-1774.png, viewport 1774 × 887 CSS px, gęstość 1. Stan AIR po obu stronach.
- Wspólne porównanie: test-results/realizm-2-1/referencja-AIR.png. Oba obrazy zmniejszone jednakowo do 887 × 443,5 px.
- Detal 1:1: test-results/realizm-2-1/detal-referencja.png.
- Przed/po: test-results/realizm-2-1/przed-po-AIR-1774.png i przed-po-AIR-1024.png.
- Mocowania: test-results/realizm-2-1/12-srub.png i trzy osobne zbliżenia w po/.

## Iteracje i ocena

1. Bazowy rendering potwierdził P1: 6 zamiast 12 śrub, płaski rant, zbyt wąska ścianka, prawie czarne fronty i mało widoczne PCB.
2. Dodano drugi rząd śrub i obejrzano trzy zbliżenia. W walidacji wykryto i poprawiono przesunięcie dolnych punktów o 2 px wynikające z obramowania uchwytów.
3. Zmieniono bryłę i pokrywę, powiązano panel z tylną krawędzią ściany i sprawdzono odsłonięcie treści. Przywrócono kolory frontów.
4. Poprawiono skalę nagłówka oraz układ ikon i faktów panelu. Dodano perspektywiczną warstwę PCB; pierwsze nieregularne linie zastąpiono uporządkowanymi wiązkami ścieżek. Ponownie obejrzano porównania całości i detalu.

Typografia zachowuje rodzinę projektu; hierarchia i skala nagłówka są bliższe wzorcowi. Układ ma głębszą bryłę i większą powierzchnię boku. Burgund, miedź, niebieski, SC/UPC Simplex i 5 symboli AIR są czytelne. Zachowano istniejące logo, treści, liczbę ofert oraz interaktywne elementy HTML/CSS/SVG. Nawigacja, cennik i formularz pozostają poza zakresem korekty.

**Niedokończony aspekt wierności:** stal i PCB nadal mają bardziej regularny, wektorowy charakter niż referencja; mikrodetal i fotograficzne oświetlenie nie są w pełni odtworzone. Nie ma podstaw do deklaracji pełnej zgodności ani zatwierdzenia wyglądu przez użytkownika. Wersja 2.1 jest przedstawiana do oceny z rzeczywistymi screenshotami.

Oddzielna regresja funkcjonalna obejmuje 13 animacji, hover/focus/touch, CTA, reduced motion, 11 szerokości i funkcje V21. Pozytywne testy nie zamykają powyższej różnicy wizualnej. Fizyczny telefon, Firefox i Safari nie były testowane.

final result: blocked
