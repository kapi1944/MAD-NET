# HERO RACK REALISM 2.1 — korekta do oceny wizualnej

31.10.2026. Gałąź `codex/hero-rack-realism-2-1`, wyprowadzona z `codex/hero-rack-realism-2` / `e3bb144`. Bez merge do main i bez publikacji witryny.

## Materiały i zakres

Dokument i schematy znajdowały się w nieśledzonym katalogu `MADNET_HERO_REALIZM_2_1_DO_REPO/docs/`. Przeczytano cały `PROMPT_HERO_REALIZM_2_1.md`, obejrzano trzy PNG oraz dwa SVG. Wizualnym celem pozostaje `Nowoczesna oferta internetu MAD-NET.png`; schematy wyznaczają mocowania i warstwy panelu. Nie przenoszono, nie zmieniano ani nie dodawano tych plików użytkownika do commita.

Wersja 2.0 nie uzyskała akceptacji wizualnej. Jej testy i dawny wpis `passed` nie są potwierdzeniem wierności. Niniejsza wersja jest materiałem do ponownej oceny, z oddzielnym opisem wyglądu i działania.

## Geometria i wygląd

- Poprzednio 6 śrub, obecnie **dokładnie 12**. Każdy z trzech modułów ma lewy i prawy uchwyt, na każdym oddzielną śrubę górną i dolną. Bez śruby środkowej; oba rzędy pozostają widoczne także na telefonie.
- Uchwyty mają wysokość frontów i łączą się z nimi bez szczelin. Rozstaw otworów, odstępy urządzeń i położenie śrub wiążą lokalne zmienne CSS. Dolna pozycja uwzględnia dwa piksele obramowania uchwytu.
- Powiększono głębokość korpusu i szerokość prawej ściany. Zmieniono perspektywę, wnękę, grubość i przekrój górnego kołnierza oraz dolną belkę. Szczeliny wentylacyjne leżą na modelowanym, trapezowym rancie.
- Pokrywa boczna ma obrys łączenia, przetłoczenie, wentylację i osadzony zamek. Bez drzwi, wiszącego klucza i obcych marek.
- Przywrócono burgundową, miedzianą i niebieską blachę na istotnej części frontów. Poprawiono nadruki, liczniki, RJ-45 i pojedyncze adaptery SC/UPC. AIR ma 5 symboli Wi-Fi bez gniazd.
- Panel pozostaje za szafą, z zakładką około 34 px. Pomiar korzysta z widocznej **tylnej krawędzi** ściany. Treść jest odsunięta od pokrywy, a panel nie przekracza jej wysokości. Dla historycznego szablonu porównawczego V21 zachowano pomiar pełnej ściany.
- Wzbogacono wyłącznie SVG tła HERO: ścieżki, ciemny podkład, pady i dolną warstwę z perspektywicznym rzutem. Impulsy biegną po istniejących ścieżkach. Obszar za tekstem jest przygaszony.
- Skorygowano skalę nagłówka i treści panelu. Na wąskich ekranach panel pozostaje pod szafą.

**Różnica pozostająca do oceny:** materiał stali i PCB nadal mają bardziej wektorowy, regularny charakter niż fotograficzna referencja. Nie odtworzono całego mikrodetalu, oświetlenia i głębi ostrości. Ten aspekt wierności pozostaje do dopracowania lub akceptacji właściciela. Nie deklarujemy pełnej zgodności wizualnej ani zatwierdzenia wersji 2.1.

## Testy funkcjonalne i geometryczne

- `npm run verify`: 6/6 testów i build. `npm run test:browser`: Microsoft Edge / Chromium, zbudowany `dist/`.
- HERO: **360, 390, 430, 760, 768, 1024, 1100, 1280, 1440, 1510, 1920 px**. Bez poziomego overflow; porty dostępne; treść mieści się w panelu.
- Kontrola 6 uchwytów i 12 widocznych śrub na każdej szerokości i dla każdej technologii. Dwa różne rzędy, zgodna wysokość uchwytu i urządzenia, brak szczeliny przy froncie, środki śrub zgodne z otworami szyny z tolerancją 1,5 px.
- Panel: brak lewego bordera na desktopie, poprawna zakładka, treść poza boczną ścianą, wysokość ograniczona rzeczywistym rzutem tylnej krawędzi, bez skoków przy zmianie technologii.
- Wszystkie **13 kanałów** zachowuje okresy i fazy. Próbkowanie jasności przez ponad 5 sekund potwierdza działanie każdego kanału; zegary animacji postępują również przy przełączaniu technologii.
- Hover, ostatni wybór, Tab/Enter/Space, tapnięcia, gest przewijania bez wyboru, aria-pressed, CTA do trzech technologii, reduced motion i ręczne wyłączenie animacji.
- **143 trasy bez kolizji** i regresja V21: 64 kombinacje tabel, 13 miniportów, umowa formularza, ręczna lokalizacja i awaria mapy. Bez wyjątków JS w końcowym przebiegu.
- Osobne porównanie z bazą potwierdziło brak zmian HTML od cennika do końca strony, `cennik.js`, `dostepnosc.js` i parametrów animacji 13 kanałów.

Dotyk badano w emulacji Chromium; fizyczny telefon, Firefox i Safari nie zostały odebrane. Istniejący workflow nie uruchamia się automatycznie po push gałęzi `codex/**`; powyższe wyniki są lokalne.

## Screenshoty

Lokalne artefakty, poza Git: `test-results/realizm-2-1/`.

- `przed/hero-{AIR|LAN|FIBER}-{szerokość}.png` i `po/hero-{AIR|LAN|FIBER}-{szerokość}.png`: 1024, 1100, 1440, 1774, 390, 430, 768, 1920 px. Ten sam viewport i stan przed/po.
- `referencja-AIR.png`: referencja i rzeczywisty render **AIR / AIR**, oba 1774 × 887 px, w dwóch kolumnach w jednakowej skali.
- `przed-po-AIR-1774.png`, `przed-po-AIR-1024.png`: rzeczywiste porównania 2.0 → 2.1. `detal-referencja.png`: zbliżenie obu szaf w skali 1:1.
- `po/mocowania-LAN.png`, `po/mocowania-FIBER.png`, `po/mocowania-AIR.png`: trzy zbliżenia, na każdym 4 śruby. `12-srub.png` zestawia je z podpisami pozycji.

Screenshoty obejrzano i policzono śruby ręcznie: LAN 2 lewe + 2 prawe, FIBER 2 lewe + 2 prawe, AIR 2 lewe + 2 prawe. Ocena wizualna: `design-qa.md`.
