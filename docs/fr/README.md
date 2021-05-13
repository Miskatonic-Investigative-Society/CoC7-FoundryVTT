## Documentation du Système :squid:

Des éons qu'_ils_ dorment mais [Vétérini](https://github.com/HavlockV) les a réveillés ! Avec ce système ultime, à vous l'Appel de Cthulhu v7 en version totale: création, progression, SAN, combat, poursuites, ... 
Le MUST have !

[Guide de l'utilisateur/trice](#guide-de-lutilisateur-trice) (en cours) | ~~[Santé Mentale](#santé-mentale)~~ (à faire)
-|-
**[Tableau des Commandes](#tableau-des-commandes) (en cours)** | **~~[Combat](#combat)~~ (à faire)**
**[Liens (pour les jets)](#liens-et-jets) (en cours)** | **~~[Poursuites](#poursuites)~~ (à faire)**
**[Création de personnage](#création-de-personnage) (à faire)** | **~~[Objets](#objets)~~ (à faire)**
**~~[Phase de progression](#phase-de-progression)~~ (à faire)** | **~~[Personnages](#personnages)~~ (à faire)**

_Documentation partagée avec amour et horreur par Toc :squid: [https://tentacules.net](https://tentacules.net/?motscles=JdrVirtuel)_

![03](https://tentacules.net/toc/toc_/virtuel/foundryvtt-cocv7vetrini-docgithub-003.jpg)

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Guide de l'Utilisateur-trice

Vous avez installé Foundry VTT (la version stable, les versions en test sont... en test :)

**Quelques modules pour commencer**

* fr-FR - Core Game: pour avoir la traduction française de Foundry
* Dice so nice!: pour les jets de dés

Vous passez la langue par défaut à Français dans l'onglet `configuration` du menu d'`accueil`.\
Vous créez votre monde, avec le Call of Cthulhu 7th edition (Unofficial) de Vétérini.\
Et vous le lancez.\
Vous activez vos modules et hop !

## Premiers paramétrages

Une fois dans le monde, dans le menu `Paramètres`, vous sélectionnez `Gestion des modules`, puis `Système de jeu`.\
Tous les paramètres sont dignes d'intérêt mais:

* les `Modificateur de jet` et `Modificateur de seuil de réussite` le sont particulièrement.
* et `Changer l'apparence de la fiche`

## Ce que l'on peut créer

### Icône Personnages

* character: personnage PJ
* npc: PNJ
* creature: monstre
* vehicle: véhicule

### Icône Objets

Là ça devient ouf:

* item: un objet
* weapon: une arme
* skill: une compétence
* setup: une module de création de perso à glisser/déposer sur votre fiche à la création (embarque les jets de création de caracs, les compétences,...)
* occupation: une occupation (avec ses compétences, son époque, ses points d'occupation, son crédit)
* archetype: un archétype (Pulp)
* book: un livre occulte
* spell: un sort
* talent: un talent (Pulp)
* status: un état... de folie

### Icône Tables

:recycle:

## Outils du gardien (menus spécifiques au système)

Ils sont dans votre barre d'outils:

![01](https://tentacules.net/toc/toc_/virtuel/foundryvtt-cocv7vetrini-docgithub-001.jpg)

* L'icône de dé permet de lancer des dés n'importe quand (en les modifiant si besoin: difficulté, seuil, niveau de compétence).
* L'icône de poulpe donne accès aux outils du Gardien:

![02](https://tentacules.net/toc/toc_/virtuel/foundryvtt-cocv7vetrini-docgithub-002.jpg)

De haut en bas:

* Activer la phase de développement (entre séances)
* Activer la phase de création (à la création des persos)
* Importer un personnage depuis un simple texte
* Activer la possibilité des gains d'expérience (en partie)
* Balancer un jet factice aux joueurs dans le chat: un peu d'pression :)

## Les compendiums

Pour les utiliser au mieux, 2 choses:

* Installer le module Compendium Folders (qui trie automatiquement les compendium)
* Importer les différents compendium (clic-droit Importer...)

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Tableau des Commandes

Quasiment tout est cliquable: les caractéristiques, les compétences, les armes, les dégâts, la SAN, la Chance...
Et en plus:
* combiné avec la touche `Shift` enfoncée, ça envoie directement le jet dans le **chat**.
* combiné avec la touche `Ctrl` [pour le Gardien] enfoncée, ça envoie une demande dans le **chat** au personnage concerné pour réaliser le jet, après paramétrage du jet par le gardien. 
* les 2 combinés, `Ctrl+Shift`: ça envoie une demande dans le **chat** au personnage concerné pour réaliser le jet directement.
* et le `clic-droit` vous emmène vers les jets **opposés** ou **combinés**.

## Commun

Sur XXX, XXX pouvant être carac, compétence,...

Commande | Action
-|-
**Gardien** |
`clic` XXX | Lance un jet de XXX après paramétrage du jet
`Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus)
`Ctrl` + `clic` XXX | Demande un jet de XXX après paramétrage du jet (dont seuil et difficulté)
`Ctrl+Shift` + `clic` XXX | Demande un jet de XXX
**Investigateur** |
`clic` XXX | Lance un jet de XXX après paramétrage du jet
`Ctrl+Shift` ou `Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus)
`Ctrl` + `clic` XXX | Lance un jet de XXX après paramétrage du jet

## Santé Mentale

Commande | Action
-|-
**Gardien** |
`clic` XXX | Lance un jet de XXX après paramétrage du jet
`Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus)
`Ctrl` + `clic` XXX | Demande un jet de XXX après paramétrage du jet (dont seuil et difficulté)
`Ctrl+Shift` + `clic` XXX | Demande un jet de XXX
`Ctr+Shift+Alt` + `clic` SAN | Demande un jet de SAN en définissant les pertes de SAN
**Investigateur** |
`clic` XXX | Lance un jet de XXX après paramétrage du jet
`Ctrl+Shift` ou `Shift` + `clic` XXX | Lance un jet de XXX (difficulté ordinaire pas de bonus/malus)
`Ctrl` + `clic` XXX | Lance un jet de XXX après paramétrage du jet (dont seuil et difficulté)

## Jets Combinés / Opposés

Commande | Action
-|-
`clic-droit` XXX | Débute/ Ajoute le jet à un jet **opposé* après paramétrage du jet
`Ctrl+Shift` ou `Shift` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **opposé** (difficulté ordinaire pas de bonus/malus)
`Ctrl` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **opposé** après paramétrage du jet (dont seuil et difficulté)
`Alt` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **combiné** après paramétrage du jet
`Ctrl+Shift+Alt` ou `Shift+Alt` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **combiné** (difficulté ordinaire pas de bonus/malus)
`Ctrl+Alt` + `clic-droit` XXX | Débute/ Ajoute le jet à un jet **combiné** après paramétrage du jet (dont seuil et difficulté)

## Commandes dans le Chat

Commande | Action
-|-
 /cc xx | lance un D100 contre une difficulté de xx
/cbr xx, yy | lance un D100 contre une difficulté de xx et de yy

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Liens et Jets

Toutes ces commandes peuvent être glissées/déposées dans un Article (ou toute zone éditable) en mode modification _sauf les modificateurs de seuil_ !\
Ce qui peut donner: `@coc7.check[type:attribute,name:san,difficulty:1,modifier:-2]`

![04](https://tentacules.net/toc/toc_/virtuel/foundryvtt-cocv7vetrini-docgithub-004.jpg)

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

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Création de personnage

## A la main

1. Vous créez un nouveau Personnage.
1. Vous passez en mode Création.
1. Vous déverrouillez la fiche de personnage (clic sur le petit cadenas).
1. Vous le nommez et remplissez occupation, sexe, âge,...
1. Vous ajoutez les compétences une par une, et oui, à la mimine, et positionnez les % qui vont bien.

Pour plus de facilité, vous pouvez vous créer un Compendium listant toutes les compétences et ainsi vous n'aurez plus à les saisir à chaque fois mais simplement à les glisser/déposer sur votre fiche, en mode Modification.

## Via une occupation

:recycle:

## Via un setup

:recycle:

## Via import / copie

**Copie**

1. Vous vous créez/avez créé un personnage type, avec compétences.
1. Vous le copiez (clic droit sur le personnage dans la liste des Personnages, copier).
1. Et voilà !

**Import**

1. Vous vous créez/avez créé un personnage type, avec compétences.
1. Vous l'exportez (clic droit sur le personnage dans la liste des Personnages, exporter (le fichier arrive sur votre ordinateur, format json)).
1. Vous vous rendez dans votre partie, vous créez juste le nouveau personnage sans rien y mettre (juste le nom).
1. Vous importez le fichier précédemment exporté (clic droit sur le personnage dans la liste des Personnages, importer).
1. Et voilà !

Vous pouvez ensuite le modifier à façon en passant en mode Création.

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Phase de progression

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Santé Mentale

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Combat

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Poursuites

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Objets

## item: un objet

## weapon: une arme

## skill: une compétence

## setup: une module de création de perso

## occupation: une occupation

## archetype: un archétype (Pulp)

## book: un livre occulte

## spell: un sort

## talent: un talent (Pulp)

## status: un état... de folie

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

# Personnages

## character: personnage PJ

C'est ici: [Création de personnage](./pages/character_creation.md).

## npc: PNJ

## creature: monstre

## vehicle: véhicule

\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\
\

