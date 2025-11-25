## to-do:

- [ ] bij inloggen een kleine knop voor blijf ingelogd;
- [ ] analyse pagina maken voor organisator (voor alle organisators voor te zien welke items/locatie populair zijn);
- [x] (vansh) evenementen maken mogelijk maken voor organisator (mogelijkheid tot tijd in stellen wnr evenement actief is en koop-locaties toevoegen en items ook kunnen toevoegen per koop-locatie) (zorgen dat alle evenementen met live status te zien zijn bij bezoeker, en als er op geklikt wordt bevestigings pop up en dan pagina met de menu lijs);
- [ ] menu lijst actually werkend krijgen en dat QR-codes kunnen aangemaken;
- [ ] vendors pagina + werking voor organisator (subaccounts met id en wachtwoord) (front-end: pagina is kolom met toevoegen en verwijderen van vendors: naam, id, locatie) (vendors kolom per evenement!!) (lijst van evenementen en per evenement een vendor lijst/kolom) (vendors account is heel nieuwe interface ! (heel beperkt, enkel pagina voor scannen en bestelling aflezen en pagina met beperkte analyse van hoeveel items hij heeft aangeboden + ... voor personal intrest));
- [ ] data showen bij dashboard van user/org
- [ ] budget alarm feature bij bezoekers (doelstelling) per categorie (drank, eten, other,..)
- [ ] feature 1: puntensysteem en iets winnen (gratis festcoin )
- [ ] feature 2: (nog te bedenken)
- [ ] tailwind classes overzichtelijker maken? (als laatste houden)
- [ ] delete account database functie aanpassen zodra alle tables toegevoegd zijn

## 3 browser API's die we hebben

- fetch (geimplementeerd)
- sessionStorage (geimplementeerd)
- camera voor qr code (?) (nog niet)
- Notificaties (?) (nog niet)
- Canvas (?) (nog niet)

## externe API

- niks (zien we nog)
- (als we niks hebben gwn stripe)

## vragen?

- maakt het uit voor onze forms dat we geen action en method hebben maar frontend js die backend aanroept?

## nog te doen bij eventmaken

- naam description en tijd aanpasbaar via een andere knop
- errors juist fixen bij event want nu met alert
- bij locatie dat het automatisch aanvult
- datum mag enkel in toekomst zijn EN start-datum < end-datum
- isLive ook legit aanpassen dat het werkt. en laten zien bij bezoekers tab
- deleteUserById moet ook eventuele events verwijderen moest role=organisator hebben
- is input hidden wel veilig?

- const errorMsg = document.getElementById("errorMsgEditBtn");
