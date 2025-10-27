## Zorgen dat alles responsive is voor grotere/kleinere schermen (->tailwind classes) ( ZO GOED ALS ALLES IS RESPONSIEF , behalve footer en header normaal)

## Over ons pagina style

## Hulp/FAQ pagina stylen

## Aglemene voorwaarden pagina stylen

## bij login/register maken zodat wachtwoord min 8 tekens moet zijn met hoofdletter, ... , en REGIX voor email en gsm ??

## taal van engels <-> nederlands kunnen veranderne, bij footer?

## partials folder in views overzichterlijker maken?

## na al deze taken grote backend bullshit beginnen en front end van hele werking. (ook kijken hoe we gsm ding gaan regelen)

werking:

- organisatoren kunnen evenementen toevoegen en items doorgeven met prijs en hoeveelheid.
- organisatoren kunnen hun evenement actief zetten en uitzetten (misschien op tijd? zodat het accuraat is en automatisch)
- bezoekers hebben een lijst van actieve evenemeneten en kunnen op eentje klikken waar ze aanwezig zijn (lijst van actieve evenementen is op locatie van dichtst naar verste)
- als ze op hun evenement hebben geklikt zien ze een lijst met items die ze kunnen bestellen
- ze kunnen items kiezen (op limiet van hun hoeveelheid FestCoins) en als ze klaar zijn kunnen ze een QR-Code genereren en laten zien aan persoon achter kraapje/tentje
- dude die bij evenement werkt moet Qr-code scannen en gaat sws door omdat het bij bezoeker al is gecontroleerd, enkel bij internetproblemen mss niet.
- Als 'aankoop' gelukt is krijgt dude van evenement meteen een lijst van alle items die bezoeker wilt en kan het klaarleggen.

- Bij groupspot begint eentje groupspot en kiest hij de items die ze gezamelijk willen, als ze klaar zijn klikken ze verder
- er komt een totale hoeveelheid FestCoins op te staan voor groupsbestelling met een invulveld waar persoon zijn deel van pot kan geven, (gaat dynamisch af van totale hoeveelheid)
- er staat ook een QR-code voor de medevrienden die willen betallen, ze scannen de code, en kunnen daneen hoeveelheid meegeven (hun deel van pot)/
- als pot 0 FestCoins is wordt grote knop bestellen actief, en genereert een grote QR-code voor aan het kraapje en rest is zelfde

- QR-codes zijn max 15 min geldig en dan is 'bestelling' zwz gecanceld, bij groupspot krrijgen alle personen die bijgedragen hebben hun FestCoins automatisch terug dan.
- 1 FestCoin is 1 Euro. Omdat veel evenementen andere prijzen hebben en ook decimalen, werkt coins ook met decimalen, enkel FestCoin bijkopen kan met gehele getallen
