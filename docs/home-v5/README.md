# HOME V5 — etap 06 i korekta etapu 07

Baza etapu 06: `201931a609db513e5e3348156943017ac04ca6e7`. Baza korekty: `1cf46b4173c281df9534f4524b36c6ca8e60ad6a`, gałąź `main`.

HOME przedstawia lokalnego operatora: „Internet. Po sąsiedzku.”, dostępność, pakiety, telefon, wyróżniony Internet wśród pięciu usług i interaktywną mapę regionu. HERO wykorzystuje istniejące `assets/img/home/latarnia-hero.jpg`, z kadrem zachowującym latarnię, przyciemnieniem i lokalnym podpisem. Zachowano typografię i układ HOME V5.

W korekcie etapu 07 szafę RACK i panel LAN/FIBER/AIR przeniesiono z HOME do HERO `internet.html`. Osobna sekcja trzech technologii HOME i linki do pakietów pozostały. HOME nie ładuje kodu RACK ani modułów cennika; mapa zachowuje dotychczasowe interakcje.

| Widok | HOME V5 przed korektą | HOME V5 po korekcie |
|---|---|---|
| 390 px | [PRZED](../etap-07/przed/home-390.png) | [PO](../etap-07/po/home-390.png) |
| 1440 px | [PRZED](../etap-07/przed/home-1440.png) | [PO](../etap-07/po/home-1440.png) |

Archiwalne porównanie V4 → pierwsze V5: [390 PRZED](przed/390.png), [390 PO](po/390.png), [1440 PRZED](przed/1440.png), [1440 PO](po/1440.png). Dawne zrzuty PO dokumentują historyczny wariant z RACK, nie bieżący HOME.

Aktualne wyniki i granice zmian: [raport etapu 07](../etap-07/README.md). Test HOME sprawdza dziewięć szerokości, latarnię i brak RACK, karty technologii i usług, mapę, CTA, przewijanie dotykiem, reduced motion, podkatalog `/MAD-NET/`, 45 porównań pikselowych dalszych sekcji oraz ścisłą regresję geometrii i typografii cennika. Testy podglądu RACK są teraz w istniejącym `tests/oferta.browser.mjs`.

Historyczne wyniki etapu 06: [verify](wyniki/verify.txt), [HOME](wyniki/home.txt), [nawigacja](wyniki/nawigacja.txt), [browser](wyniki/browser.txt), [integracja](wyniki/integracja.txt).
