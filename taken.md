## BUG

- [ ] employee dashboard werkend maken
- alle belangrijke code nakijken + commentaar zetten en mss anders schrijven als mogelijk..

## 'fuck da' type todo's

- [ ] notificaties van alert vervangen door showNotification
- [ ] als er tijd over is dark mode (extra feature)
- [ ] als er tijd mogelijk is languages toevoegen (extra feature)

## 3 browser API's (min. aantal bereikt!)

- fetch
- sessionStorage
- Notificaties
- Web API (toegang vor camera)
- Canvas API
- Video API
- requestAnimationFrame API

## externe API (min. aantal bereikt!)

- Photon

## Test accounts

bezoeker: email: bezoeker123@gmail.com - wachtwoord: Qwerty123@
organisator: email: org@gmail.com - wachtwoord: Qwerty123@

# Web programming project skeleton

A skeleton that provides some of the basics to get starting with the web programming project.

This README is part of your submission. Make sure it is clear and contains the required information. There is no template. [A guide for Markdown.](https://www.markdownguide.org/)

## Structure

- `app.js`: web server entrypoint
- `db.js`: database entrypoint
- `public/`: folder with static resources

## Included

**Express**

- https://expressjs.com/
- https://express-validator.github.io/docs/next/
- https://ejs.co/
- https://github.com/WiseLibs/better-sqlite3/

## Dependencies

- bcrypt (^6.0.0) - Password hashing
- better-sqlite3 (^12.2.0) - SQLite database driver
- ejs (^3.1.10) - Template engine
- express (^5.2.1) - Web framework
- express-session (^1.18.2) - Session middleware
- express-validator (^7.2.1) - Input validation
- pdfkit (^0.17.2) - PDF generation
- tailwind (^4.0.0) - CSS framework

## Local development

run: `node app.js` --> voor backend op te starten

run: `npm run dev` --> voor tailwind tijdens dev

## Deployment wnr klaar

build: `docker build . -t webprogramming/project`
volume: `docker volume create webProject`
run: `docker run -it -p 8080:80 -v webProject:/website/databaseFiles webprogramming/project`

## Notes on your submission

- Submit a `groepX_wepr_Naam1_Naam2.zip` in the same structure as you've received this skeleton. This file should be in the root, and all commands should run from the root.
- Don't forget to test the Docker deployment, this is how your project will be evaluated. (Also test from scratch, i.e., how the staff receives it.)
- Make sure there is example data, and it should load with the Docker deployment.
- The README should contain any important information on your project:
  - Login credentials.
  - (Un)Realized requirements and expansions.
  - A statement on AI usage.
- You can include any relevant optional artefacts, e.g., mockups, diagrams, task distribution, timesheets.
- Don't include unnecessary files, e.g., `.git` or `node_modules`.

## 2 zelf bedachte features:

- Punten sparen bij aankomen en zo een gratis item krijgen voor eender evenement
- een "wat is populair" pagina waar je kan zien wat het populairste drank/eten is bij alle evenementen die gekocht worden, welke locaties het meeste bezoekers heeft gemiddeld en andere analyses ofzo zodat organisatoren kunnen zien wat we best kunnen verkopen qua eten en drinken + welke locaties het populairste zijn
- je kan een qr-code scannen Of applepay/ (andriod pay?) gebruiken om via gsm te betalen (NFC tyype shi)
