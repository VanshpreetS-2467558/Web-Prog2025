# Web Programming – Project FestCoin

## Auteurs

- Vansh Singh — 2467558 — VanshpreetS-2467558
- Theo Roosens — 2468311 — TheoR-2468311

## Login Credentials

| Email                 | Wachtwoord |
| --------------------- | ---------- |
| bezoeker123@gmail.com | Qwerty123@ |
| org@gmail.com         | Qwerty123@ |

## Functionaliteit

Het project werkt volledig zoals bedoeld. Alle kernfunctionaliteiten zijn operationeel en er zijn meerdere extra’s toegevoegd.

- Aparte frontends voor bezoekers, organisatoren en werknemers
- Accountsysteem met correcte rolverdeling
- Wachtwoorden worden gehashed opgeslagen
- “Blijf ingelogd”-functionaliteit
- Bezoekers kunnen:
  - FestCoins kopen, verkopen en delen
  - Persoonlijke gegevens wijzigen
  - Budgetalarm instellen met notificaties
  - Analytics raadplegen (waar, hoeveel, wat, …)
  - Actieve evenementen joinen
  - Items remote aankopen
  - Punten sparen (per 100 FestCoins → 10 gratis)
  - Bestellen via een groepspot
- Organisatoren kunnen:
  - Evenementen en standjes aanmaken
  - Items per standje beheren
  - Werknemersaccounts aanmaken
  - Analytics bekijken (winst, stock, bezoekersaantal, …)
  - PDF-rapporten downloaden
  - Desktop-only algemene analyticspagina gebruiken
- Werknemers kunnen:
  - Bestellingen scannen en valideren
  - Beperkte stand-specifieke analytics bekijken
- Publieke frontend met homepagina, klantenservice, instructies, …

## Gebruikte technologieën

### Stack

- EJS (HTML / Tailwind / JavaScript)
- Tailwind CSS (^4.0.0)
- Node.js / Express.js

### Dependencies

- bcrypt (^6.0.0)
- better-sqlite3 (^12.2.0)
- ejs (^3.1.10)
- express (^5.2.1)
- express-session (^1.18.2)
- express-validator (^7.2.1)
- pdfkit (^0.17.2)

### Browser API’s

- Fetch
- sessionStorage
- Notifications
- Web API (camera)
- Canvas API
- Video API
- requestAnimationFrame

### Externe API

- Photon

## AI Usage

- Door tijdsdruk is Cursor gebruikt om de frontendstructuur te matchen met eerdere code.
- AI (ChatGPT/Copilot) is gebruikt voor kleine vragen zoals syntax of optimalisaties.
- Het grootste deel van de code is zelfgeschreven door Vansh en Theo.

## Docker

- `docker build . -t webprogramming/project`

- `docker volume create webProject`

- `docker run -it -p 8080:80 -v webProject:/website/databaseFiles webprogramming/project`

Website is daarna bereikbaar op:
http://localhost:8080

## Development instructies

- `node app.js` # backend starten
- `npm run dev` # tailwind tijdens development
- `npm run build` # tailwind builden
