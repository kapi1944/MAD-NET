# Instrukcje dla Codexa — MAD-NET

## Zasady stałe

1. Pracujesz w repo `C:\GitHub\Projects\MAD-NET` na gałęzi `main` (większe zadania w osobnych branchach/PR).
2. `index.html` + `assets/` to źródła. `dist/` jest generowane i ignorowane przez Git.
3. Zachowuj istniejące ceny, pakiety, treści i animacje, jeśli zadanie nie mówi wprost o ich zmianie. **Nie wymyślaj wartości cenowych, zasięgu ani terminów.**
4. Po każdej zmianie uruchom `npm run verify`; jeśli zmiana dotyczy interakcji, sprawdź Chrome/Chromium desktop i mobile.
5. Dokumentuj istotne decyzje w `docs/DECYZJE.md`, plan w `docs/PLAN_ROZWOJU.md` i wykonaj commit z czytelną wiadomością.
6. Nie zapisuj kluczy SMTP, danych klientów ani `.env` w repo. Nie wdrażaj poczty za pomocą samego frontendowego JavaScriptu.
7. Repo jest oficjalnym projektem firmy, ale **publikacja na produkcji wymaga potwierdzenia właściciela**.
8. Nie dodawaj nowych frameworków ani zewnętrznych usług bez wykazania korzyści i wpływu na utrzymanie.

## Gotowy prompt — pierwszy etap po inicjalizacji

> Otwórz repozytorium `C:\GitHub\Projects\MAD-NET`. Przeczytaj `README.md`, `docs/ARCHITEKTURA.md`, `docs/PLAN_ROZWOJU.md`, `docs/DECYZJE.md` oraz `docs/archiwum/V18_oryginal.html`. Uruchom `npm run verify` i lokalny podgląd. Porównaj aktualny HERO RACK 3D z prototypem V18. Przeprowadź audyt bez wprowadzania zmian w wyglądzie, sporządzając listę konkretnych usterek z priorytetami i testami regresyjnymi dla szerokości 390, 768, 1024 i 1440 px. Zwróć uwagę na realizm szafy, widoczność mocowań, proporcje HERO, trójkolumnowy układ, przełączanie panelu LAN/FIBER/AIR, tempo kontrolek, obsługę palca, `prefers-reduced-motion`, dostępność oraz zachowanie formularza. Nie ruszaj backendu, nie podmieniaj danych ofert i nie wdrażaj dużego refaktoru podczas audytu. Wynik zapisz w `docs/AUDYT_HERO.md`, następnie wykonaj commit i — jeśli dostępny jest skonfigurowany `origin` — push.
