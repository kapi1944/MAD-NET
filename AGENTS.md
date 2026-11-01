# Instrukcje agenta — MAD-NET

Ten plik obowiązuje przy pracach Codexa w repo.

- To **oficjalny projekt strony firmy MAD-NET**, ale jeszcze NIE wersja do publikacji.
- `docs/archiwum/V18_oryginal.html` jest zatwierdzonym punktem odniesienia — zachowuj kierunek HERO RACK 3D i jego interakcje.
- Zaczynaj od `README.md`, `docs/PLAN_ROZWOJU.md`, `docs/DECYZJE.md` i `docs/ARCHITEKTURA.md`.
- Nie rób refaktoru „dla porządku” kosztem wyglądu. Najpierw odtwórz błąd, potem popraw i sprawdź regresję.
- Utrzymaj 13 pakietów: LAN 5, FIBER 3, AIR 5. Nie zmieniaj cen bez weryfikacji u właściciela.
- LAN czerwony; FIBER `#FF7B19`; AIR niebieski. Światłowód SC/APC SIMPLEX (zielony sprzęt, polerowanie 8°), AIR bez gniazd fizycznych.
- RACK HERO ma trzy urządzenia w jednej szafie, delikatną perspektywę, widoczne mocowania i dynamiczny prawy panel technologii.
- Zapewnij hover, dotyk, klawiaturę, poprawne przewijanie na telefonie i `prefers-reduced-motion`.
- Przewody i kropki muszą omijać inne kafelki, bez kolizji; nie zamykaj zadania bez testów na wielu szerokościach.
- Każda zmiana: `npm run verify`, kontrola błędów JS w przeglądarce, merytoryczny commit. Jeśli skonfigurowano `origin`, wykonaj push.
- Żadnych sekretów SMTP ani danych klientów w Git. Frontendowy formularz nie jest backendem.
- Preferuj rozwiązania lokalne i bez płatnych API per użycie. Nie używaj Electrona.
- Gdy poprawiasz istniejący kod, nie zmieniaj całej architektury bez szczególnego uzasadnienia.
