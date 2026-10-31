# Backend zapytań — jeszcze niewdrożony

Frontend z `assets/js/dostepnosc.js` wysyła `POST` na `api/zapytanie.php`.
W tym repozytorium **nie istnieje jeszcze produkcyjny endpoint** ani konfiguracja SMTP.

Przed uruchomieniem publicznym należy dostarczyć backend z:
- walidacją danych oraz dozwolonych technologii/pakietów;
- bezpiecznym wysyłaniem na `biuro@mad-net.pl` przez SMTP lub zaakceptowaną usługę serwerową;
- potwierdzeniem na adres e-mail klienta (jeżeli go podał);
- ochroną przed spamem, rate limitingiem i obsługą błędów;
- zgodną z RODO obsługą/retencją danych.

Nie umieszczaj haseł i kluczy pocztowych w repo. Nie myl formularza demonstracyjnego z działającą wysyłką.
