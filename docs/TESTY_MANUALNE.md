# Testy odbiorcze — V18 i kolejne wersje

## Widok HERO RACK

- [ ] Desktop 1440 px: lewy tekst, centralna szafa RACK, prawy panel — bez nachodzenia.
- [ ] Tablet 1024 px: treść i panele mieszczą się bez poziomego przewijania.
- [ ] Telefon 390 i 360 px: RACK w całości widoczny, bez pływającego poziomego scrolla.
- [ ] LAN: 5 kanałów RJ-45; LINK zgaszony bez połączenia i zielony po wpięciu; bursztynowy ACT pulsuje zgodnie z prędkością.
- [ ] FIBER: 3 zielone SC/APC Simplex (APC 8°), zaślepki i klapki; LINK poza pasywnym adapterem, ACT bursztynowy przed i po podłączeniu, bez restartu.
- [ ] AIR: 5 kanałów radiowych, bez fizycznych gniazd, pulsujące łuki.
- [ ] Najechanie na każde urządzenie przełącza prawy panel; ostatni wybór pozostaje widoczny.
- [ ] Dotknięcie w telefonie przełącza panel, nie psuje pionowego przewijania.
- [ ] Fokus z klawiatury i Enter/Spacja działają na urządzeniach.
- [ ] Ogranicz animacje systemowe — brak niepotrzebnego ruchu.

## Cennik i przewody

- [ ] Przełączenie technologii: 5 LAN, 3 FIBER, 5 AIR.
- [ ] Zmiana czasu umowy nie zmienia niepowiązanych danych.
- [ ] Hover myszą pokazuje podgląd, tap świadomie wybiera, przesuwanie palcem nie podłącza.
- [ ] Dla wszystkich 13 wariantów przewód/kropki nie przechodzą przez wnętrze sąsiednich kart.
- [ ] Złącze urządzenia → przewinięcie → port pakietu, końcówki przewodów ciągłe.
- [ ] Tabela porównawcza: nazwy pakietów, kolory technologii i wszystkie wartości zgodne z danymi.

## Formularz i mapa

- [ ] Wybór kilku technologii oraz kilku pakietów.
- [ ] Czas 12/24/bezterminowo, brak wymyślonych kwot.
- [ ] Adres lub wskazanie pinezki, poprawa położenia pinezki.
- [ ] Walidacja kontaktu telefonicznego/mailowego.
- [ ] Bez backendu nie pokazywać fałszywego komunikatu „wysłano”.
- [ ] Po wdrożeniu backendu: potwierdzić rzeczywisty odbiór poczty i automatyczną odpowiedź.

## Automatyczne

`npm run verify` — testy + generowanie statycznego `dist/`.

W `docs/zrzuty/` znajdują się zrzuty bazowe V18 w szerokościach 390 i 1440 px (porównane pixel-to-pixel z importem).
