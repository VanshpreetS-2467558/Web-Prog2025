## to-do:

- [x] analyse pagina maken voor organisator (voor alle organisators voor te zien welke items/locatie populair zijn);
- [x] data showen bij dashboard van user
- [x] budget alarm feature bij bezoekers (doelstelling) per categorie (drank, eten, other,..)
- [x] feature 1: puntensysteem en iets winnen (gratis festcoin )
- [ ] feature 2: als event gedaan is dan disablen en een export pdf maken
- [ ] organisator account -> dashboard (hoofdpagina) een dropdown menu maken voor algemene analyse en per event analyse
- [ ] data showen bij dashboard van org
- [x] groepspot functie werkend krijgen (hele popup (vansh: ik doe da wel verder, heb da niet af gekregen))
- [x] transactions fixen bij festcoin beheer
- [x] qr code implementatie fixen (vansh: same thing lmao ik doe da verder) (zowel bezoeker als employee side);
- [x] bezoeker timestampt bijhouden bij event tweaken (wat als die tab sluiten en geen post sturen voor leftAt...) (heartbeat implementeren)
- [ ] event delete knoppen werken niet meer (probs door changes database)
- [ ] (Ga over elke implementatie: als ge iets ziet dat beter kan -> change da na overleg samen)
- [ ] als er tijd over is dark mode
- [ ] tailwind classes overzichtelijker maken? (als laatste houden)
- [ ] refine frontend employee management

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

## vragen aan assistent?

- hoeveel aandacht wordt er besteed aan code? is het vooral hoe de website overkomt en onze presentatie die van belang is?
- page moet reloaden bij live event te zien

1. kan je bij vandaag besteed: "totaal besteed" van maken? dat is misschien leuker?

2. bij groepspotten als je erop klikt bij transacties dat "totale prijs" misschien in een gekleurde kadertje is? En dat zelfde user gewoon festcoins opgeteld wordt? en niet dat ik 3x kee eigen bijdrage zie van 2 festcoiuns,4festcoins vb maar gewoon 6 (dus dat die allemaal opgetled worden per bijdrager!)

3. als je 10 festcoins krijgt door puntensysteem, dat staat er "undefined" bij transactie beheer van wallet, zorg dat daar dan "FestSpark BONUS" staat ofzo en niet undefined!

4. bij budget alarm moet het huidige uitgaven gereset worden na dat je de budget overschreden hebt zodat je een nieuwe budget alarm kunt maken, zorg dat dit gebruikersvriendelijk is! want nu als ik een nieuwe aanmaak blijft de huidige uitgaven gewoon? dat is neit de bedoelign!

5. als je de punten claimed veranderd de festcoins getallen wel maar niet bij dashboard? dan moet ik zelf nog reloaden (bij FestCoin tabje) maar andere worden wel dynamisch veranderd, kan je dit nog aanpassen?

1) eigen bijdrage klopt niet bij geschidenis, ik denk als ik mn eigen bijdrage verander vb van 1 naar 4 dat die dan 3 gebruik omdat ik 3 extra (als laatst) heb opgeteld? gewoon bij eigen bijdrage ook hetelfde als bij tabel bij eigen naam.

2) ik bedoelde geen reset knop bij budget alarm systeem, maar dat als je de alarm verwijderd dat huidige uitgaven weer op 0 staat. want nu telt die weer per categorie op ook van het verleden wat niet mag! dus als je de limiet voorbij bent dat je die kan wijzigen of verwijderen. en als je al een budget alarm hebt van drank dat je die niet opnieuw kan maken bij "zet nieuw budget alarm sectie" dus stel dat je 3 alarms hebt van alle categorieeen, dat je geen meer kan aanmaken en die sectie wordt gehide.

3) Er staat nog altijd undefined bij de festCoin transactie geschidenis als je bonues ontvangt van het puntensysteem? fix dat aub.

4) als ik mijn bonus ontvang krijgt de "Totaal besteed" ook +10 maar dat moet gewoon blijven? dit zijn geen besteden festcoins.

5) kan je nu bij bestellingen zo maken dat het geen (devmode) knop meer is maar een qr-code? dat deze qr-code getoont moet worden aan de employee die in dezelfde station werkt als de items van winkelmandje (altijd zelfde station nooit mix of andere). dus als die probeert te scannen bij een andere employee van andere station dat je juiste melding krijgt "dit is een order van station: ... " ofzo.
   En als die gescanned is. dat de 'handled' bij transacties-table op 1 staat , dus dat die niet meer opnieuw scanbaar is, de check voor fraude eigenlijk) en als gescanned is dat de groene knop bij bezoeker weg gaat zodat die weer kan bestellen. en dat de employee na scannen een popup krijgt (ik heb al een placeholder) van een lijst van de bestelling. en als die deze overhandigd heeft en op het knop klikt dat die weer verder kan scannen. voorzie ook de juiste checks!

6) bij het event Beheer werken de delete knoppen niet meer, kan je dit fixen? zodat als je station verwijderd ook de items daarin verwijderd worden. en items verwijderen ook werkt en als je event verwijderd dat die alle foreign keys ook samen verwijderd, ik heb ON CASCADE gebruikt maar het verwijder knoppen werken neit meer... ? en ook dat je geen duplicate station hebt in hetzelfde event en geen duplicate items per station.
