Tableau des Commandes
---------------------

Quasiment tout est cliquable: les caractéristiques, les compétences, les armes, les dégâts, la SAN, la Chance...
Et en plus:
* combiné avec la touche `Shift` enfoncée, ça envoie directement le jet dans le chat.
* combiné avec la touche `Ctrl` [pour le Gardien] enfoncée, ça envoie une demande dans le chat au personnage concerné pour réaliser le jet, après paramétrage du jet par le gardien. 
* les 2 combinés, `Ctrl+Shift`: ça envoie une demande dans le chat au personnage concerné pour réaliser le jet directement.
* et le `clic-droit` vous emmène vers les jets opposés ou combinés.

## Commun

Sur XXX, XXX pouvant être carac, compétence,...

| Commande | Action |
| -| -|
| **Gardien** | |
| `clic` XXX | Lance un jet de XXX après paramétrage du jet |
| `Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus) |
| `Ctrl` + `clic` XXX | Demande un jet de XXX après paramétrage du jet (dont seuil et difficulté) |
| `Ctrl+Shift` + `clic` XXX | Demande un jet de XXX |
| **Investigateur** | |
| `clic` XXX | Lance un jet de XXX après paramétrage du jet |
| `Ctrl+Shift` ou `Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus) |
| `Ctrl` + `clic` XXX | Lance un jet de XXX après paramétrage du jet |

## Santé Mentale

| Commande | Action |
| -| -|
| **Gardien** | |
| `clic` XXX | Lance un jet de XXX après paramétrage du jet |
| `Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus) |
| `Ctrl` + `clic` XXX | Demande un jet de XXX après paramétrage du jet (dont seuil et difficulté) |
| `Ctrl+Shift` + `clic` XXX | Demande un jet de XXX |
| `Ctr+Shift+Alt` + `clic` SAN | Demande un jet de SAN en définissant les pertes de SAN |
| **Investigateur** | |
| `clic` XXX | Lance un jet de XXX après paramétrage du jet |
| `Ctrl+Shift` ou `Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus) |
| `Ctrl` + `clic` XXX | Lance un jet de XXX après paramétrage du jet (dont seuil et difficulté) |

## Jets Combinés / Opposés

| Commande | Action |
| -| -|
| `clic-droit` XXX | Débute/ Ajoute le jet à un jet **opposé* après paramétrage du jet |
| `Ctrl+Shift` ou `Shift` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **opposé** (difficulté ordinaire pas de bonus/malus) |
| `Ctrl` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **opposé** après paramétrage du jet (dont seuil et difficulté) |
| `Alt` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **combiné** après paramétrage du jet |
| `Ctrl+Shift+Alt` ou `Shift+Alt` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **combiné** (difficulté ordinaire pas de bonus/malus) |
| `Ctrl+Alt` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **combiné** après paramétrage du jet (dont seuil et difficulté) |

## Liens et Jets

Toutes ces commandes peuvent être glissées/déposées dans un Article (ou toute zone éditable) en mode modification _sauf les modificateurs de seuil_ !\
Ce qui peut donner: `@coc7.check[type:attribute,name:san,difficulty:1,modifier:-2]`

Voici le fonctionnement: `@coc7.TYPE_OF_REQUEST[OPTIONS]{TEXT_TO_DISPLAY}`
* TYPE_OF_REQUEST :
  * 'sanloss': trigger a san check, upon failure will propose to deduct the corresponding SAN.
  * 'check': trigger a check depending on the options.
  * 'item': trigger use of a weapon. Only items of type weapon can be triggered.
* OPTIONS: [] = optional, default
  * sanloss:
    * sanMax: max SAN loss
    * sanMin: min SAN loss
  * check:
    * type: type of check (characteristic, skill, attrib).
    * name: name of the skill/characteristic/attrib.
    * [blind]: will force a blind check, if not present the check will depend on your selected roll mode.
  * all:
    * [difficulty]: ? (blind), 0 (regular), + (hard), ++ (extreme), +++ (critical).
    * [modifier]: -x (x penalty dice), +x (x bonus dice), 0 (no modifier).
    * [icon]: icon tu use (font awesome, fas fa-dice).
* TEXT_TO_DISPLAY: Name to display, this is optional.

## Autres

| Commande | Action |
| -| -|
| | |
