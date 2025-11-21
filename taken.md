## TO-DO:

- stay logged knop feature bij inloggen
- analyse pagina maken voor organisators (check doelstellingen) (computer screen only, dus niet op gsm) (nog geen front-end)
- knoppen laten werken voor geld kopen/verkopen/ sharen (knop zorgt gwn voor + of - (geen stripe nodig))
- wachtwoord veranderen mogelijk maken bij profiel settings pagina
- organisator = evenement aanmaken (db/backend..) en als die er is, mogelijkheid tot tijd in stellen wnr evenement actief is en koop-locaties toevoegen en items ook kunnen toevoegen per koop-locatie
- zorgen dat alle evenementen met live status te zien zijn bij bezoeker, en als er op geklikt wordt bevestigings pop up en dan pagina met de menu lijst.
- menu lijst actually werkend krijgen en dat QR-codes kunnen aangemaken
- organisators kunnen werknemer accounts toevoegen die bij inloggen kunnen kiezen op welke locatie dat ze staan en dat ze dan kunnen scannen (en kunnen beperkte live data zien tijdens evenement)
- qr-code bevestiging gescanned kunnen worden via werknemer accoutn (nog geen front-end hiervoor) die daadwerkelijk werkt
- data somehow bijhouden voor de dashboard pagina , en ook analyse pagina (check doelstelling)
- budget alarm feature bij bezoekers (doelstelling) per categorie (drank, eten, other,..)
- 2 goeie features implementeren (feature 1 = ?? , feature 2: punten systeem)
- tailwind classes overzichtelijker maken? (utilities bij public aangemaakt en gebruik maken van tailwind.config)

## productie / docker

- process.env.DEPLOYMENT docker entry point is enkel voor development dus kunnen we zo uittesten ig
- bij productie mag die regel weg, is gewoon bij uittesten of het werkt als we klaar zijn

## vragen (prof of general)

- CSRF toepassen nodig? (auth, qrcodes?,..)
- extra feature als ingelogd dan is logo href naar dashboard en niet home (goeie of nie?)
- organisatoren kunnen maar 1 event aanmaken per organisator account!

## EJS is snel gemaakt maar moet nog veranderen (wist nie hoe ik da moest doen zonder backend honestly)

- orgEventBeheer.ejs (bij partial: role)

## 3 browser API's die we hebben

- fetch
- niks
- niks

## externe API

- niks

TAKEN:

[] notificaties enkel in header doen want is toch 1 hetzelfde...
