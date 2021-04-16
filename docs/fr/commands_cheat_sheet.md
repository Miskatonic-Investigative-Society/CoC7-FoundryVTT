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
  * 'sanloss': test de SAN, si échoué, propose de réduire la SAN.
  * 'check': test défini en fonction des options.
  * 'item': test d'objet. Seulement pour les objets de type arme.
* OPTIONS: [] = optionnel
  * sanloss:
    * sanMax: perte de SAN max
    * sanMin: perte de SAN min
  * check:
    * type: type de jet (caractéristique, compétence, attribut).
    * name: nom de caractéristique, compétence, attribut.
    * [blind]: jet aveugle, sinon le jet sera du type sélectionné dans le chat.
  * Tous:
    * [difficulty]: ? (aveugle), 0 (normal), + (difficile), ++ (extrême), +++ (critique).
    * [modifier]: -x (x dé malus), +x (x dé bonus), 0 (pas de modificateur).
    * [icon]: icône à utiliser (font awesome, fas fa-dice).
* TEXT_TO_DISPLAY: Texte à afficher, optionnel.

Par exemple:

* `@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}`
* `@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}`
* `@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}`
* `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}`
* `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]`
