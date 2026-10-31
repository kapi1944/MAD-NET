# HERO 3.0 — ocena integracji

Użytkownik zaakceptował końcowy projekt szafy i polecił umieszczenie go w HERO. Wcześniejszy status blocked dotyczył niezaakceptowanej wersji 2.1. Obecnym wzorcem jest docs/prototypy/hero-3-0/rack-finalny.png.

Wdrożona bitmapa assets/img/hero-rack.png jest identyczna z zaakceptowanym plikiem; test sprawdza jej SHA-256. Materiały, logo, typografia urządzeń, kolorowe fronty i 12 śrub pozostają częścią zaakceptowanej grafiki. Nie modelowano ponownie szafy gradientami CSS.

Oceniono rzeczywisty rendering w test-results/v20/po/hero-{szerokość}.png oraz test-results/hero-3-0/integracja-{szerokość}.png: skala i proporcje obrazu pozostają stałe, nakładka nie przesuwa się względem grafiki, treść jest czytelna, a panel pozostaje za prawą ścianką na desktopie i pod modelem na telefonie. W trakcie iteracji poprawiono odstęp od nagłówka i podkład masek, aby tło PCB nie prześwitywało przez wygaszane symbole Wi-Fi.

Cały obraz i wycinki kontrolek pracują w jednym viewBox 100 40 1350 970. Trzy przyciski z wielokątnymi obszarami pokrywają fronty. Dodatkowe trzy małe LED nad adapterami FIBER sygnalizują ich niezależną aktywność. Zmiana jasności kontrolek jest zamierzonym zachowaniem interaktywnym, nie zmianą materiału lub proporcji zaakceptowanego modelu.

Testy obejmują 11 szerokości, 13 animacji i ich dokładne okresy, hover, focus, touch, przewijanie, CTA i ograniczony ruch. Osobno sprawdzono geometrię odsłoniętego panelu i faktyczne położenie wszystkich 13 kanałów względem przycisków. Regresja V21 obejmuje tabele, formularz i mapę. Brak wyjątków JS i błędów konsoli.

Nie testowano fizycznego telefonu, Safari ani Firefox. Akceptacja projektu graficznego nie oznacza publikacji witryny. Szczegóły: docs/HERO_3_HYBRYDA.md.

final result: passed
