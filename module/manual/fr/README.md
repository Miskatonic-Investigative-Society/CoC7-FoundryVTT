# Le système

* [Ce qu'il **fait**](#ce-quil-fait).
* [Comment il se **paramètre**](#comment-il-se-paramètre).
* [Tout ce qui est cliquable](#tout-ce-qui-est-cliquable).
* Comment il s'utilise si:
  * [je suis **Gardien**](#je-suis-gardien).
  * [je suis **Investigateur**](#je-suis-investigateur).
* [fas fa-suitcase] [Les **objets**](#les-objets): [archétype](#archétype) (archetype), [armure](#armure) (armor), [livre](#livre) (book), [poursuite](#poursuite) (chase), [package d'expérience](#package-dexpérience) (experiencePackage), [objet](#objet) (item), [occupation](#occupation), [créateur](#créateur) (setup), [compétence](#compétence) (skill), [sort](#sort) (spell), [status](#status), [talent](#talent), [arme](#arme) (weapon)
* [fas fa-user] [Les **acteurs**](#les-acteurs): [personnage](#personnage) (character), [contenant](#contenant) (container), [créature](#créature) (creature), [protagoniste](#protagoniste) (npc), [véhicule](#véhicule) (vehicle)

**Rappels Foundry VTT**

* CoC7 est un **système** de jeu.
* Call of Cthulhu 7th French est un **module**, apportant des modifications au système.
* Votre partie est un **monde** dans lequel vous activerez ou non les modules que vous avez installés sur Foundry VTT.
* le token est la représentation de votre personnage sur une scène.
* le portrait est l'image qui représente votre personnage sur sa fiche.

## Ce qu'il fait

Il permet de gérer quasiment tous les aspects de votre partie de jdr l'Appel de Cthulhu en v7:

* la création du scénario: scènes, protagonistes, objets, journaux et aides de jeu, musique.
* la création du personnage via une fiche détaillée cliquable de partout.
* les jets, les combats, la magie, l'expérience,...

[⇪ haut de page](#le-système)

## Comment il se paramètre

* Quels modules [complémentaires installer](#quels-modules-complémentaires-installer) [fas fa-cube].
* Comment le [paramétrer](#comment-le-paramétrer) [fas fa-cogs].

### Quels modules complémentaires installer

* [fas fa-cube] Translation: French [Core] https://foundryvtt.com/packages/fr-core
* [fas fa-cube] Call of Cthulhu 7th French (Unofficial) https://foundryvtt.com/packages/coc7-module-fr-toc

### Comment le paramétrer

Pour **accéder aux paramètres** du système:

* Allez dans le menu vertical à droite.
* Cliquez sur [fas fa-cogs].
* Puis sur [fas fa-cogs] _Configurer les paramètres_.
* Puis sur _Call of Cthulhu 7th Edition_ dans la liste de gauche.
* Pour sauvegarde et appliquer vos paramètres, cliquez sur [fas fa-floppy-disk] _Sauvegarder_.

Quels paramètres tripoter (notés [fas fa-cogs] et potentiellement, changer la valeur par défaut) et pourquoi ?

* [fas fa-cogs] Variantes/Règles **optionnelles**: si vous voulez faire du **Pulp** par exemple.
* Utiliser les menus contextuels
* Répertoire de transfert des images de The Dhole's House
* [fas fa-cogs] **Époque du monde**: à fixer à la création du monde.
* Afficher l'époque de jeu dans la liste des joueurs
* Utiliser les CoC ID quand on dépose un item

Paramètres d'initiative

* Afficher les dés d'initiative
* Afficher le degré de réussite

Paramètres de jets de dés

* Attendez le Gardien jette les dés
* Modificateur de jet
* Modificateur de seuil de réussite
* Difficulté par défaut des test
* Notification de jet caché

Paramètres de cartes de Chat

* Autoriser les utilisateurs de confiance à modifier les cartes de chat
* Autoriser les utilisateurs de confiance à modifier les sections pour Gardien uniquement
* Afficher le portrait sur les cartes de dialogue
* Afficher le niveau de réussite des tests (étoiles)
* Afficher le niveau de succès des jets de dés (texte)
* Utiliser le portrait des tokens

Paramètres de scène

* Active les icônes d'état
* Mesurer en unité de grille
* Inclut l'altitude
* Ne pas afficher les erreurs pour les distances
* En création de PNJ

Paramètre d'Illustration du Jeu

* Remplacer l'illustration du jeu

Paramètres de fiche

* Afficher le nom du joueur sur la fiche
* Délai en millisecondes avant qu'une info-bulle apparaisse, 0 pour jamais
* Sur la fiche de personnage, n'afficher que la moitié et la valeur max au survol
* Sur la fiche compacte, n'afficher que les icônes dans la liste des compétences
* Le joueur peut déverrouiller sa fiche
* Le joueur peut modifier son état
* Historique en un bloc
* Changer l'apparence de la fiche
* Texture de fond de la fiche
* Type de fond
* Fond des autres fiches
* Image d'arrière-plan
* Couleur principale
* Couleur secondaire
* Couleur éléments interactifs
* Limiter la taille des compétences
* Police de caractères
* Police de caractères (gras)
* Taille de la police par défaut (px)

Paramètres d'arme

* Ne pas tenir compte des utilisations par tour
* Ne pas tenir compte du nombre de munitions
* Ne pas afficher qu'aucune cible est sélectionnée

Paramètres Dice So Nice (si vous avez installé le module du même nom)

* dés synchro
* dés dix de bonus en couleurs
* dés dix de pénalité en couleurs

Paramètres Développeur et Debug

* Système en mode Debug
* Montrer les Fonctionnalités Expérimentales

Paramètres de table aléatoire

* Table des folies passagères (résumé)
* Table des folies passagères (temps réel)

[⇪ haut de page](#le-système)

## Tout ce qui est cliquable

... peut être cliqué :) Mais surtout:

* Click Droit crée une carte (dans le chat) de jet **opposé**. Tant qu'elle est ouverte, chaque Click Droit ajoutera le nouveau jet.
* Alt + Click Droit un jet **combiné**.
* Shift + Click jette le dé **sans** demander la difficulté ni bonus/malus.
* Ctrl + Click crée une **demande** de jet, seulement pour le Gardien.
* Alt + Click en SAN affichera au joueur les **pertes** max et min de SAN.

[⇪ haut de page](#le-système)

## Je suis Gardien

* Barre d'[outils du gardien](#barre-doutils-du-gardien).
* [Import de protagoniste](#import-de-protagoniste) via copié/collé de texte.

### Barre d'outils du Gardien

Elle est accessible uniquement si vous êtes sur une scène de votre monde.

Ce sont les 3 derniers icônes de la barre à gauche de la fenêtre: 🐙 🎲 et 🔗

#### 🐙 Outils du Gardien

* [fas fa-angle-double-up] Phase de **développement**

Activé/désactivé: durant la phase d'expérience, entre 2 parties, permet de faire les jets d'expérience et autres évolutions.

Cela fait apparaître un nouvel onglet à droite de la fiche avec un [fas fa-cogs].

* [fas fa-user-edit] Mode **création** de personnage

Activé/désactivé: durant la phase de création des personnages, permet de répartir les points et faire les modifications voulues (compétences,...).

* [fas fa-fingerprint] CoC ID: remplacement des Acteur Item
* [fas fa-book-user] Installez votre compendium
* [fas fa-user-plus] **Import** de Protagoniste

Lien vers l'[import de protagoniste](#import-de-protagoniste) via un texte copié/collé.

* [fas fa-user-check] **Création** de Personnage guidée

Lien vers la [création de Personnage guidée](#).

* [fas fa-certificate] Gain d'**expérience**

Activé/désactivé: en jeu, permet de cocher les futurs gains d'expérience, par exemple via des réussites spectaculaires sur des jets de compétences.

* [fas fa-sim-card] Envoyer un jet **leurre** aux joueurs

Faire croire aux joueurs que vous jetez les dés :)

* [fas fa-moon] Se **reposer**

Lancer une phase de repos.

[⇪ haut de page](#le-système)

#### 🎲 Lancer!

Permet de faire un jet (sans compétence spécifique), en spécifiant: le seuil de réussite, la difficulté, les dés bonus/malus,...

#### 🔗 Créer un lien

Permet de créer un lien vers un test ou un objet pour l'envoyer vers

* le presse-papier (et ainsi le copier dans un journal par exemple).
* vers les tokens sélectionnés.
* dans le chat.

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

```
@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}
@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]
Jet simple: [[/roll 1d10]]{Dégâts}
```

### Import de protagoniste

Outil permettant, par simple **copié/collé** de la description d'un PNJ (provenant d'un PDF par exemple ou d'un site web :)) d'en faire un protagoniste de votre monde, avec fiche.

**Accessible** via [fas fa-user-check] pour le Gardien dans son menu ou dans le menu Foundry [fas fa-user] Acteur, en bas, via le lien.

Le formattage est **SUUUUUPER** strict (espaces, passages à la ligne, intitulés,...):

```
Example Character, 27 ans
FOR 75 CON 60 TAI 80 DEX 70 APP 60 INT 80
POU 50 ÉDU 85 SAN 55 PV 14 BD: 1D4
Carrure: 1 Mvt: 7 PM: 10 Chance: 40 Armure: 1
Attaques par round 3 Perte de SAN: 1d4/1d8
Attaques
Bite 50% (25/10), dommage 1D6
Brawl 30% (15/6), dommage 1D3
Derringer 40% (20/8), dommage 1D8+1
Esquiver 50% (25/10)
Compétences
Animal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,
Listen 50%, Medicine 45%, Persuade 25%, Psychology 75%,
Science (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,
Spot Hidden 35%, Stealth 10%
Langue: English 80%, Eklo 5%.
Sortilèges: Summon NPC, Dispel NPC.
```


[TODO]

[⇪ haut de page](#le-système)

## Je suis Investigateur

* [Première connexion](#première-connexion)
* La [fiche d'Investigateur](#la-fiche-dinvestigateur) ([compétences](#onglet-compétences), [combat](#onglet-combat), [équipement](#onglet-equipement), [historique](#onglet-historique)).
* [Créer un Investigateur](#créer-un-investigateur) ([guidée](#création-guidée), [à moitié](#création-semi-guidée-par-compendium), [à la main](#création-manuelle)).

### Première connexion

[TODO]

### La fiche d'Investigateur

Les menus/icônes de la **barre** du haut de la fiche:

* [fas fa-window-minimize] Minimiser la fiche: fiche réduite dans laquelle n'apparaissent que caracs, chances, compétences utils, armes,...
* [fas fa-gear] Changer le style de fiche (pas utile).
* [fas fa-circle-user] Modifier le token du personnage.
* [fas fa-passport] Récupérer l'ID du personnage.

Et en-**dessous**, sur la fiche:

* [fas fa-lock][fas fa-lock-open] Précise si le personnage peut être **modifié** (très utile !) en dehors des phase de création et de développement.
* [fas fa-link] Précise si le personnage est son **token** sont liés: toute modif de l'un impactera potentiellement l'autre (très utile !).
* [fas fa-user-circle] Précise si la fiche actuelle est celle du token ou celle du personnage (pas d'icône dans ce cas).

A chaque fois que vous voyez l'icône [fas fa-edit], c'est que vous pouvez **modifier** la valeur en cliquant sur le texte ou la case vide le cas échéant.

A chaque fois que vous voyez l'icône [fas fa-trash], c'est que vous pouvez **supprimer** la chose concernée en cliquant dessus.

En mode **Modification** [fas fa-lock-open], la majorité des noms et valeurs peuvent être modifiés.

Les onglets sont accessibles sur la gauche de la fiche via le petits rubans de couleur.

**Le bloc des stats**

Bloc situé à gauche de la fiche, sous le portrait qui en fait partie, qui reste visible quelque soit l'onglet sélectionné:

Le portrait:

* peut être modifié en cliquant dessus.
* en mode modification [fas fa-lock-open], en cliquant dessus, vous pouvez sélectionner la façon d'afficher votre portrait, son cadrage.
* en le **survolant**, des icônes apparaissent pour modifier le **status** du personnage: mourant, inconscient, folie passagère,...

Le reste:

* Nom
* (nom du) joueur
* Occupation
* Sexe
* Age
* Résidence
* Lieu de naissance
* Les **caractéristiques** (avec les valeurs /2 et /5).
* Les points de Vie (avec en dessous le max)
* Les points de Magie (avec en dessous le max)
* La Chance (avec en dessous le max)
* La Santé Mentale (avec en dessous le max)
* Le Mouvement
* La Carrure
* L'Impact
* L'Armure
* La Perte journalière éventuelle de SAN

[⇪ haut de page](#le-système)

#### Onglet: Compétences

On y trouve les compétences avec:

* leur score
* leurs scores /2 et /5
* une case cochable pour l’expérience (qui se coche toute seule)
* et un petit [fas fa-info-circle] pour avoir des informations complémentaires

Le [fas fa-sort-amount-down] permet de trier les compétences soit par nom soit par valeur.

Le [fas fa-toggle-on] permet de montrer ou non les compétences spéciales. [TODO]

[⇪ haut de page](#le-système)

#### Onglet: Combat

En général, il faut **cliquer sur le nom d'une arme** pour l'utiliser et pas sur la compétence.

On y trouve:

* la liste des armes triées par type avec:
  * leur nom
  * les dégâts
  * les munitions éventuelles
  * les bonus éventuels
  * en cliquant sur le **triangle** en début de ligne apparaissent: les compétences, cadence, type,... liés à l'arme.
* la liste des compétences de combat avec:
  * leur score
  * une case cochable pour l’expérience (qui se coche toute seule)
  * et un petit [fas fa-info-circle] pour avoir des informations complémentaires

[⇪ haut de page](#le-système)

#### Onglet: Equipement

On y trouve:

* l'équipement:
  * Objets (glissé/déposé sur la fiche)
  * Ouvrages (glissé/déposé sur la fiche)
  * Sorts (glissé/déposé sur la fiche)
  * Armure (glissé/déposé sur la fiche)
  * Etats (états physiques/mentaux du personnage, à la main du Gardien)
* la thune, la fraîche, la moulaga, les pessos... En mode modification [fas fa-lock-open], le petit [fas fa-cogs] vert permet de calculer ou non les revenus de façon automatique.

La [fas fa-arrows-spin] indique que l'objet peut être vendu (personnage à sélectionner dans une popup) ou rangé [TODO].

[⇪ haut de page](#le-système)

#### Onglet: Historique

On y trouve:

* Biens précieux
* Description
* Idéologie et croyance
* Lieux significatifs
* Ouvrages occultes, sorts et artefacts
* Personnes importantes
* Phobies et manies
* Rencontres avec des entités étranges
* Séquelles et cicatrices
* Traits

[⇪ haut de page](#le-système)

#### Onglet: Effets (pour le Gardien)

Les effets du personnage, avec une description, une source et une durée.

* Temporaire
* Passif
* Inactif
* Status

[⇪ haut de page](#le-système)

#### Onglet: Notes du Gardien (pour le Gardien)

On (le Gardien) y trouve:

* des notes libres
* les pertes de SAN liées à des rencontres
* les immunités aux pertes de SAN
* des marqueurs liés au Mythe
* des infos sur l'argent, les possessions et les niveaux de vie

[⇪ haut de page](#le-système)

### Créer un Investigateur

#### Création guidée

**Accessible** via [fas fa-user-check] pour le Gardien dans son menu ou dans le menu Foundry [fas fa-user] Acteur, en bas, via le lien.

[TODO]

[⇪ haut de page](#le-système)

#### Création semi guidée par compendium

[TODO]

[⇪ haut de page](#le-système)

#### Création manuelle

[TODO]

[⇪ haut de page](#le-système)

[fas fa-suitcase]

## Les Objets

### Archétype

[TODO]

### Armure

[TODO]

### Livre

[TODO]

### Poursuite

[TODO]

### Package d'expérience

[TODO]

### Objet

[TODO]

### Occupation

[TODO]

### Créateur

[TODO]

### Compétence

[TODO]

### Sort

[TODO]

### Status

[TODO]

### Talent

[TODO]

### Arme

[⇪ haut de page](#le-système)

[fas fa-user]

## Les Acteurs

### Personnage

Voir [Créer un Investigateur](#créer-un-investigateur).

### Contenant

[TODO]

### Créature

**La fiche de créature**

Les menus/icônes de la **barre** du haut de la fiche:

* [fas fa-gear] Changer le style de fiche (pas utile).
* [fas fa-circle-user] Modifier le token du personnage.
* [fas fa-passport] Récupérer l'ID du personnage.

Et en-**dessous**, sur la fiche:

* [fas fa-link] Précise si le personnage est son **token** sont liés: toute modif de l'un impactera potentiellement l'autre (très utile !).

En bas à gauche du portrait: 4 icônes.

* [fas fa-dice] Génère des caractéristiques aléatoires
* [fas fa-balance-scale] Prends les caractéristiques moyennes
* [fas fa-lock] [fas fa-lock-open] Permet ou non la modification de la fiche.
* [fas fa-square-root-alt] [fas fa-user-edit] Bascule entre le mode formule (3D6+3) ou valeur (15).

Le reste:

* Son portrait
* Nom
* Type
* Caractéristiques
* Points de Vie, Magie, SAN, Chance
* Mouvement (il peut y en avoir plusieurs)
* Impact
* Carrure
* Armure
* Son état
* La perte de SAN qu'elle provoque
* Les compétences
* Les armes: _voir_ [Onglet: Combat](#onglet-combat)
* L'inventaire: objets, ouvrages, sorts, armures. _Voir_ [Onglet: Equipement](#onglet-equipement)
* Les effets
* Les notes du Gardien

En mode modification [fas fa-lock-open], le petit [fas fa-cogs] vert permet de permuter entre le calcul automatique de la valeur ou le fait qu'elle soit fixée.

### Protagoniste

C'est pareil qu'une [créature](#créature) sauf que ça n'a pas de type mais une profession et âge.

### Véhicule

[TODO]

[⇪ haut de page](#le-système)

