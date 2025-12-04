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
- [x] event delete knoppen werken niet meer (probs door changes database)
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

1. kan je bij vandaag besteed van user dashboard: "totaal besteed"

2. bij groepspotten als je erop klikt bij transacties dat "totale prijs" ook rood is zoals de rest? En dat zelfde user gewoon festcoins opgeteld wordt? en niet dat ik 3x kee eigen bijdrage zie van 2 festcoiuns,4festcoins vb maar gewoon 6 (dus dat die allemaal opgetled worden per bijdrager!) ook dat eigen bijdrage opgetelde som is, want soms wordt enkel laatste getoond maar dan klopt het niet met totale bijdrage van jezelf

3. als je 10 festcoins krijgt door puntensysteem, dat staat er "undefined" bij transactie beheer van wallet, zorg dat daar dan "FestSpark BONUS" staat ofzo en niet undefined! (bij de 4 Laatste die bij walletBeheer worden getoond ook)

4. Bij de budget alarm moet de huidige uitgaven terug op 0 staan als die overschreden is als er op wijzigen een nieuwe bedrag wordt gegeven. Als je vb al 1 van de categorieen hebt mag het niet meer mogelijk zijn om nog een 2de vb: "drank" budget alarm te maken als je die al hebt. kan je dit ook user friendly maken? 

5. als je de punten claimed van puntensysteem veranderd de festcoins saldo bij de dropdown menu wel maar niet bij dashboard "totale saldo"? dan moet ik zelf nog reloaden maar andere worden wel dynamisch veranderd, kan je dit nog aanpassen zodat het dynamisch is?  

6. kan je nu bij bestellingen zo maken dat het geen (devmode) knop meer is maar een qr-code? dat deze qr-code getoont moet worden aan de employee die in dezelfde station werkt als de items van winkelmandje (altijd zelfde station nooit mix of andere). dus als die probeert te scannen bij een andere employee van andere station dat je juiste melding krijgt "dit is een order van station: ... " ofzo.
En als die gescanned is. dat de 'handled' bij transacties-table op 1 staat(dus dat die niet meer opnieuw scanbaar is, de check voor fraude eigenlijk) en als gescanned is dat de groene knop bij bezoeker weg gaat zodat die weer kan bestellen. en dat de employee na scannen een popup krijgt (ik heb al een placeholder) van een lijst van de bestelling. en als die deze items overhandigd heeft en op het knop klikt dat die weer verder kan scannen. voorzie ook de juiste checks!

7. bij het event Beheer werken de delete knoppen niet meer, kan je dit fixen? zodat als je station verwijderd ook de items daarin verwijderd worden. en items verwijderen ook werkt en als je event verwijderd dat die alle foreign keys ook samen verwijderd, ik heb ON CASCADE gebruikt maar het verwijder knoppen werken neit meer... ? en ook dat je geen duplicate station hebt in hetzelfde event en geen duplicate items per station.

-----
1) event verwijder knop werkt nog altijd niet...

2) waarom wordt er geen qr-code gemaakt? dat ziet er niet uit... Zorg dat er een qr-code staat ipv idk wat wordt gebeurd.. 

3) bij workspace krijg ik meteen een popup met : "TRansactie succesvol opgehaald" ? en er staat geen lijst en de knop werkt niet ? deze mag je niet zien? je moet eerst scannen dan de werking/logics van transactie afhandelen en dan was deze popup laten zien? 


---
stel dat code wordt gegeven op een ander event kan je melding geven "deze qr-code/code bestelling is van een ander event" ? 

en qr-code wordt nog altijd niet geshowed want geef NULL bij database? kan je dat misschien zo wel fixen dan? 