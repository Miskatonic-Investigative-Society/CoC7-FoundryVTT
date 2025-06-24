# Liens et Jets

Toutes ces commandes peuvent être glissées/déposées dans un Article (ou toute zone éditable) en mode modification _sauf les modificateurs de seuil_ !\
Ce qui peut donner: `@coc7.check[type:attribute,name:san,difficulty:1,modifier:-2]`

![04](https://tentacules.net/toc/toc_/virtuel/foundryvtt-cocv7vetrini-docgithub-004.jpg)

Voici le fonctionnement: `@coc7.TYPE_OF_REQUEST[OPTIONS]{TEXT_TO_DISPLAY}`

- TYPE_OF_REQUEST :
  - 'sanloss': test de SAN, si échoué, propose de réduire la SAN.
  - 'check': test défini en fonction des options.
  - 'item': test d'objet. Seulement pour les objets de type arme.
- OPTIONS: [] = optionnel
  - sanloss:
    - sanMax: perte de SAN max
    - sanMin: perte de SAN min
  - check:
    - type: type de jet (caractéristique, compétence, attribut).
    - name: nom de caractéristique, compétence, attribut.
    - [blind]: jet aveugle, sinon le jet sera du type sélectionné dans le chat.
  - Tous:
    - [difficulty]: ? (aveugle), 0 (normal), + (difficile), ++ (extrême), +++ (critique).
    - [modifier]: -x (x dé malus), +x (x dé bonus), 0 (pas de modificateur).
    - [icon]: icône à utiliser (font awesome, fas fa-dice).
- TEXT_TO_DISPLAY: Texte à afficher, optionnel.

Par exemple:

- `@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}`
- `@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}`
- `@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}`
- `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}`
- `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]`

Jet simple: [[/roll 1d10]]{Dégâts}
