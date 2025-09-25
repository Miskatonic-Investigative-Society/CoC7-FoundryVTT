# Le système

* [Ce qu'il fait](#ce-quil-fait).
* [Comment il se paramètre](#comment-il-se-parametre).
* [Tout ce qui est cliquable](#tout-ce-qui-est-cliquable) & [La fenêtre de Jet](#la-fenetre-de-jet).
* Comment il s'utilise si:
  * [je suis Gardien](#je-suis-gardien).
  * [je suis Investigateur](#je-suis-investigateur).
* Le [combat](#le-combat) [fas fa-swords].
* [Les objets](#les-objets) [fas fa-suitcase]:
  * [archétype](#archetype) (archetype)
  * [armure](#armure) (armor)
  * [livre](#livre) (book)
  * [poursuite](#poursuite) (chase)
  * [package d'expérience](#package-dexperience) (experiencePackage)
  * [objet](#objet) (item)
  * [occupation](#occupation)
  * [créateur](#createur) (setup)
  * [compétence](#competence) (skill)
  * [sort](#sort) (spell)
  * [status](#status)
  * [talent](#talent)
  * [arme](#arme) (weapon)
* [Les acteurs](#les-acteurs) [fas fa-user]:
  * [personnage](#personnage) (character)
  * [contenant](#contenant) (container)
  * [créature](#creature) (creature)
  * [protagoniste](#protagoniste) (npc)
  * [véhicule](#vehicule) (vehicle)

_Cette documentation repose sur la dernière version du système CoC7 sur Foundry VTT v13_

* [Introduction aux règles](#introduction-aux-regles):
  * [1. Ambiance générale](#1-ambiance-generale)
  * [2. Les tests - lancer 1D100](#2-les-tests-lancer-1d100)
  * [3. Quand lancer un dé ?](#3-quand-lancer-un-de)
  * [4. Niveaux de réussite](#4-niveaux-de-reussite)
  * [5. Redoubler un jet](#5-redoubler-un-jet)
  * [6. Dés bonus et malus](#6-des-bonus-et-malus)
  * [7. La Chance](#7-la-chance)

**Rappels Foundry VTT**

* CoC7 est un **système** de jeu.
* Call of Cthulhu 7th French est un **module**, apportant des modifications au système.
* Votre partie est un **monde** dans lequel vous activerez ou non les modules que vous avez installés sur Foundry VTT.
* le **token** est la représentation de votre personnage sur une scène.
* le **portrait** est l'image qui représente votre personnage sur sa fiche.

## Ce qu'il fait

Il permet de gérer quasiment tous les aspects de votre partie de jdr l'Appel de Cthulhu en v7:

* la création du scénario: scènes, protagonistes, objets, journaux et aides de jeu, musique.
* la création du personnage via une fiche détaillée cliquable de partout.
* les jets, les combats, la magie, l'expérience,...

[⇪ haut de page](#le-systeme)

## Comment il se paramètre

* Quels modules [complémentaires installer](#quels-modules-complementaires-installer) [fas fa-cube].
* Comment le [paramétrer](#comment-le-parametrer) [fas fa-cogs].

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

[⇪ haut de page](#le-systeme)

## Tout ce qui est cliquable

... peut être cliqué :) Mais surtout:

* ```Click Droit``` crée une carte (dans le chat) de jet **opposé**. Tant qu'elle est ouverte, chaque ```Click Droit``` ajoutera le nouveau jet.
* ```Alt + Click Droit``` un jet **combiné**.
* ```Shift + Click``` jette le dé **sans** demander la difficulté ni bonus/malus.
* ```Ctrl + Click``` crée une **demande** de jet, seulement pour le Gardien.
* ```Alt + Click``` en SAN affichera au joueur les **pertes** max et min de SAN.

[⇪ haut de page](#le-systeme)

## La fenêtre de Jet

Elle se compose de trois blocs:

* Le **type** de jet: normal, opposé ou combiné.
* La **difficulté**: inconnue, ordinaire, majeure (demande une réussite majeure %/2), extrême (demande une réussite extrême %/5).
* Les **dés** Bonus ou Malus à appliquer.

Suite au jet, dans la carte du chat [fas fa-comments] qui apparaît, on peut, selon le cas:

* **Redoubler** le jet.
* Dépenser des points de **Chance** pour réussir ou augmenter la réussite.

Rappel de règles: [2. Les tests - lancer 1D100](#2-les-tests-lancer-1d100), [3. Quand lancer un dé ?](#3-quand-lancer-un-de), [4. Niveaux de réussite](#4-niveaux-de-reussite), [5. Redoubler un jet](#5-redoubler-un-jet), [6. Dés bonus et malus](#6-des-bonus-et-malus) et [7. La Chance](#7-la-chance).

[⇪ haut de page](#le-systeme)

## Je suis Gardien

* Barre d'[outils du gardien](#barre-doutils-du-gardien).
* [Import de protagoniste](#import-de-protagoniste) via copié/collé de texte.

Dans toutes les fiches, si une petite icônes [game-icon game-icon-tentacles-skull] est présente, en la cliquant, vous arrivez sur une section qui vous permet de prendre des notes **visibles** uniquement par vous.

### Barre d'outils du Gardien

Elle est accessible uniquement si vous êtes sur une **scène** de votre monde.

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

Lien vers la [création de Personnage guidée](#creation-guidee).

* [fas fa-certificate] Gain d'**expérience**

Activé/désactivé: en jeu, permet de cocher les futurs gains d'expérience, par exemple via des réussites spectaculaires sur des jets de compétences.

* [fas fa-sim-card] Envoyer un jet **leurre** aux joueurs

Faire croire aux joueurs que vous jetez les dés :)

* [fas fa-moon] Se **reposer**

Lancer une phase de repos.

[⇪ haut de page](#le-systeme)

#### 🎲 Lancer!

Permet de faire un jet (sans compétence spécifique), en spécifiant: le seuil de réussite, la difficulté, les dés bonus/malus,...

#### 🔗 Créer un lien

Permet de créer un **lien** vers un **test** ou un **objet** pour l'envoyer vers

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

```@ coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]{Hard San Loss (-1) 1/1D6}
@ coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]{Hard STR check(-1)}
@ coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]{Hard luck check(-1)}
@ coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]{Hard Anthropology check(-1)}
@ coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]
Jet simple: [ [/roll 1d10]]{Dégâts}
```

[⇪ haut de page](#le-systeme)

### Import de protagoniste

Outil permettant, par simple **copié/collé** de la description d'un PNJ (provenant d'un PDF par exemple ou d'un site web :)) d'en faire un protagoniste de votre monde, avec fiche.

**Accessible** via [fas fa-user-check] pour le Gardien dans son menu ou dans le menu Foundry [fas fa-user] Acteur, en bas, via le lien.

Le formatage est **SUUUUUPER** strict (espaces, passages à la ligne, intitulés,...), et surtout être **patient** (10-15s):

```
Howard LePoulpe, 27 ans, Psychopathe
FOR 75 CON 60 TAI 80 DEX 70 APP 60 INT 80
POU 50 ÉDU 85 SAN 55 PV 14 BD: 1D4
Carrure: 1 Mvt: 7 PM: 10 Chance: 40 Armure: 1
Attaques par round 3 Perte de SAN: 1d4/1d8
Attaques
Mordre 50% (25/10), dommage 1D6
Bagarre 30% (15/6), dommage 1D3
Derringer 40% (20/8), dommage 1D8+1
Esquiver 50% (25/10)
Compétences
Animal Handling 55%, Charm 30%, First Aid 25%, Disguise 20%,
Listen 50%, Medicine 45%, Persuade 25%, Psychology 75%,
Science (Astronomy) 90%, Science (Botany) 35%, Science (Zoology) 10%,
Spot Hidden 35%, Stealth 10%
Langue: Franchouillard 80%, Cyclopéen 5%.
Sortilèges: Invoquer Vonv, Recherche dans Toc.
```

Il apparaîtra dans les Acteurs, dans le dossier _Personnage importé_ et la fiche s'ouvrira à la fin du processus.

_Vous pouvez aller en chercher sur Toc:_ https://www.tentacules.net/toc/toc/tocyclo.php?type_rech=crea _et_ https://www.tentacules.net/toc/toc/tocyclo.php?type_rech=pnj.

[⇪ haut de page](#le-systeme)

## Je suis Investigateur

* [Première connexion](#premiere-connexion)
* La [fiche d'Investigateur](#la-fiche-dinvestigateur) ([compétences](#onglet-competences), [combat](#onglet-combat), [équipement](#onglet-equipement), [historique](#onglet-historique)).
* [Créer un Investigateur](#creer-un-investigateur) ([guidée](#creation-guidee), [à moitié](#creation-semi-guidee-par-compendium), [à la main](#creation-manuelle)).
* [Lire un livre du Mythe](#lire-un-livre-du-mythe)
* [Jeter un sort](#jeter-un-sort)

### Première connexion

[TODO]

### La fiche d'Investigateur

Les onglets: [compétences](#onglet-competences), [combat](#onglet-combat), [équipement](#onglet-equipement), [historique](#onglet-historique).

Les menus/icônes de la **barre** du haut de la fiche:

* [fas fa-window-minimize] [fas fa-window-maximize] Minimiser la fiche: fiche réduite dans laquelle n'apparaissent que caracs, chances, compétences utils, armes,...
* [fas fa-gear] Changer le style de fiche (pas utile).
* [fas fa-circle-user] Modifier le token du personnage.
* [fas fa-passport] Récupérer l'ID du personnage.

Et en-**dessous**, sur la fiche:

* [fas fa-lock][fas fa-lock-open] Précise si le personnage peut être **modifié** (très utile !) en dehors des phase de création et de développement.
* [fas fa-link] Précise si le personnage est son **token** sont liés: toute modif de l'un impactera potentiellement l'autre (très utile !).
* [fas fa-user-circle] Précise si la fiche actuelle est celle du token ou celle du personnage (pas d'icône dans ce cas).

A chaque fois que vous voyez l'icône [fas fa-edit], c'est que vous pouvez **modifier** la valeur en cliquant sur le texte ou la case vide le cas échéant.

En mode **Modification** [fas fa-lock-open], la majorité des noms et valeurs peuvent être modifiés. Par contre, plus grand chose n'est cliquable.

A chaque fois que vous voyez l'icône [fas fa-trash], c'est que vous pouvez **supprimer** la chose concernée en cliquant dessus.

Les onglets sont accessibles sur la gauche de la fiche via le petits rubans de couleur.

**Le bloc des stats**

Bloc situé à gauche de la fiche, sous le portrait qui en fait partie, qui reste visible quelque soit l'onglet sélectionné:

Le **portrait**:

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
* La Chance (avec en dessous le max): [7. La Chance](#7-la-chance)
* La Santé Mentale (avec en dessous le max)
* Le Mouvement
* La Carrure
* L'Impact
* L'Armure
* La Perte journalière éventuelle de SAN

[⇪ haut de page](#le-systeme)

#### Onglet Compétences

On y trouve les **compétences** avec:

* leur score
* leurs scores /2 et /5
* une case cochable pour l’expérience (qui se coche toute seule ou à la main en double cliquant)
* et un petit [fas fa-info-circle] pour avoir des informations complémentaires

Le [fas fa-sort-amount-down] [fas fa-sort-alpha-down] permet de **trier** les compétences soit par nom soit par valeur.

Le [fas fa-toggle-on] [fas fa-toggle-off] permet de **montrer** ou non les compétences **spéciales**: celles marquées comme _rare_ dans leur description.

[⇪ haut de page](#le-systeme)

#### Onglet Combat

En général, il faut **cliquer sur le nom d'une arme** pour l'utiliser et pas sur la compétence.

On y trouve:

* la liste des armes triées par type avec:
  * leur nom
  * les dégâts
  * les **munitions** éventuelles ([game-icon game-icon-chaingun] ```Click droit```: -1 munition, ```Click gauche```: +1, avec Shift en plus on vide ou on recharge entièrement)
  * les bonus éventuels
  * en cliquant sur le **triangle** en début de ligne apparaissent: les compétences, cadence, type,... liés à l'arme.
* la liste des compétences de combat avec:
  * leur score
  * une case cochable pour l’expérience (qui se coche toute seule)
  * et un petit [fas fa-info-circle] pour avoir des informations complémentaires

[⇪ haut de page](#le-systeme)

#### Onglet Equipement

On y trouve:

* l'équipement:
  * Objets (glissé/déposé sur la fiche)
  * Ouvrages (glissé/déposé sur la fiche)
  * Sorts (glissé/déposé sur la fiche)
  * Armure (glissé/déposé sur la fiche)
  * Etats (états physiques/mentaux du personnage, à la main du Gardien)
* la thune, la fraîche, la moulaga, les pessos... En mode modification [fas fa-lock-open], le petit [fas fa-cogs] vert permet de calculer ou non les revenus de façon automatique.

La [fas fa-arrows-spin] indique que l'objet peut être **échangé** ou **rangé**. Si c'est un _conteneur_ (duquel il est propriétaire), il y sera rangé.

[⇪ haut de page](#le-systeme)

#### Onglet Historique

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

[⇪ haut de page](#le-systeme)

#### Onglet Effets (pour le Gardien)

Les effets du personnage, avec une description, une source et une durée.

* Temporaire
* Passif
* Inactif
* Status

[⇪ haut de page](#le-systeme)

#### Onglet Notes du Gardien (pour le Gardien)

On (le Gardien) y trouve:

* des notes libres
* les pertes de SAN liées à des rencontres
* les immunités aux pertes de SAN
* des marqueurs liés au Mythe
* des infos sur l'argent, les possessions et les niveaux de vie

[⇪ haut de page](#le-systeme)

### Créer un Investigateur

Les types de création: [guidée](#creation-guidee), [à moitié](#creation-semi-guidee-par-compendium), [à la main](#creation-manuelle).

#### Création guidée

**Accessible** via [fas fa-user-check] pour le Gardien dans son menu ou dans le menu Foundry [fas fa-user] Acteur, en bas, via le lien.

Il se base sur les **setups** présents dans les compendiums de votre monde (dont ceux du système et des modules installés et activés) en rapport avec l'**époque** de jeu de votre monde.

**ATTENTION**, si vous avez installé et activé le module en anglais Investigator Wizard, on va vous proposer des tas d'occupations: en français ET en anglais ! Désactivez-le.

Etape 1: **Configuration du Gardien**

* **Valeurs de Caractéristiques**: vous permet de choisir la méthode de création des caractéristiques, par point, aléatoire,...
* **Feuille de personnage**: bien choisir votre setup dans la liste déroulante.

Si vous ne choisissez pas votre setup ici, vous aurez une étape à la suite de celle-ci pour le choisir.

Etape 2: **Caractéristiques**

* Fixer vos caracs selon la méthode choisie.
* Fixer votre âge.

Etape 3: **Ajuster les caractéristiques**

* Par exemple, jet en EDU pour une éventuelle augmentation.

Etape 4: **Attributs**

* Pour vérifier les attributs dérivés.
* Points, mouvement,...

Etape 5: **Choix de l'occupation**

* Choix dans la liste et consultation du descriptif.

Etape 6: **Compétences de l'occupation**

* Choisissez vos compétences d'occupation jusqu'à ce que le petit icône rouge en bas disparaisse: cela activera le bouton Suivant.

Etape 7: **Dépenser les points de compétence**

* La première colonne donne la base.
* La seconde pour les compétences personnelles.
* La troisième pour les compétences d'occupation.
* Attention au Crédit, ne pas dépasser !
* Répartissez vos points jusqu'à ce que le petit icône rouge en bas disparaisse: cela activera le bouton Suivant.

Etape 8: **Détails de l'Investigateur**

* Nom; Résidence, Lieu de Naissance.
* Portrait, image du Token.

Etape 9: **Historique de l'Investigateur**

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

Et c'est parti !

[⇪ haut de page](#le-systeme)

#### Création semi guidée par compendium

* Dans le menu Acteurs [fas fa-user], cliquez sur Créer un acteur.
* Choisissez _character_.
* Donnez lui un nom puis _Créer acteur_.
* Vérifiez bien d'être (c'est au Gardien de la faire) en mode **création** [fas fa-user-edit] ET en mode **développement** [fas fa-angle-double-up].
* Allez dans le menu Compendium [fas fa-book-atlas] de Foundry, dossier _CoC7-fr_, compendium _.création_, dossier _.Création_.
* Choisissez **votre époque et votre mode de tirage** (par exemple: Investigateur/trice 20's Aléatoire), et faîtes-le glisser sur votre fiche de personnage encore vierge.
* _La magie opère :)_
* Lancez les dés pour les caracs puis Valider.
* Retournez dans le menu Compendium [fas fa-book-atlas] de Foundry, dossier _CoC7-fr_, compendium _.création_, dossier _Occupations.
* Choisissez votre **occupation** et faîtes-la glisser sur votre fiche.
* Choisissez les **compétences**, répondez aux **choix** proposés.
* Cliquez sur l'onglet [fas fa-cogs] dans le ruban bleu en haut à gauche de la fiche.
* **Répartissez** vos points d'occupation et vos points personnels.
* Réalisez les touches finales: âge, points de magie,...
* Et voilà !

[⇪ haut de page](#le-systeme)

#### Création manuelle

* Dans le menu Acteurs [fas fa-user], cliquez sur Créer un acteur.
* Choisissez _character_.
* Donnez lui un nom puis _Créer acteur_.
* Vérifiez bien d'être (c'est au Gardien de la faire) en mode **création** [fas fa-user-edit] ET en mode **développement** [fas fa-angle-double-up].
* Ben....... remplissez toutes les valeurs à la main.
* Pour les compétences, allez dans le menu Compendium [fas fa-book-atlas] de Foundry, dossier _CoC7-fr_, compendium _.création_, dossier _Compétences_ et faîtes-les glisser une par une sur votre fiche.
* Mettez les valeurs.
* Et voilà.

[⇪ haut de page](#le-systeme)

### Lire un livre du Mythe

Vous devez savoir parler la langue de l'Ouvrage.

* Allez dans votre inventaire / Ouvrages.
* Pour l'ouvrage qui vous intéresse, cliquez sur [fas fa-edit].
* Cliquez sur _Première lecture_.
* Puis cliquez sur **le +** à droite de la barre pour effectuer toutes les phases d'étude jusqu'au bout.

### Jeter un sort

* Allez dans votre inventaire / Sort.
* Pour le Sort qui vous intéresse, cliquez sur [fas fa-edit].

ou

* Allez dans votre inventaire / Ouvrage.
* Choisir un Ouvrage que vous avez étudié entièrement.
* Cliquez sur [fas fa-edit].
* Allez dans l'onglet Sorts de l'Ouvrage.
* Cliquez sur le Sort.

puis

* Cliquez sur JET ou JET CACHE.
* Le chat vous indique:
  * la perte de Points de Magie à appliquer à la main.
  * la perte de Points de SAN à appliquer à la main.
  * La description et les effets du sort.

[⇪ haut de page](#le-systeme)

## Le Combat

[fas fa-swords]

### Menu combat de Foundry [fas fa-swords]

Il n'est pas obligatoire de le lancer mais il permet de gérer:

* l'**initiative** des participants.
* les **tours** (en mettant en valeur le personnage actif).
* de voir aussi les choses de façon centralisées.

Pour l'utiliser:

* sélectionnez les participants au combat sur la scène
* ```Click Droit```: icône en bas à droite (2 épées derrière un bouclier)
* cliquer dans le menu Foundry à droite: [fas fa-swords]
* et vous pouvez commencer le combat.

### Détails & Explications

**Sélectionner sa cible**

* Passez la souris au-dessus du token, puis touche T (Shift + T pour en ajouter plusieurs). Quatre triangles apparaissent aux coins du token.
* OU ```Click Droit``` sur le token cible et cliquez sur l'icône Cible.

Cliquez ensuite sur **le nom de l'arme utilisée** (pas la compétence de combat !).

**Carte de chat [fas fa-comments]: jet de compétence de combat**

Vous pouvez spécifier dans cette carte:

* la distance de la cible
* les conditions (viser, tir auto, surprise, ...)
* d'éventuels dés additionnels

Puis

* cliquer sur le bouton en bas de la carte, qui va se transformer et vous proposer de jeter les dégâts si le tir à réussi.
* si le tir est **manqué**, en cliquant sur la carte du chat, on vous proposera éventuellement de dépenser des points de Chance pour réussir ou améliorer.

Vous pouvez alors infliger les dégâts en cliquant sur le bouton ! Ils seront appliqués automatiquement. **Sans cible désignée**, vous devrez les appliquer vous-même.

**Corps à Corps**

Une fois le jet lancé une fiche de réaction de la cible apparaît. Elle peut:

* esquiver
* parer
* riposter
* ...

Si le coup porte, lancez les dégâts puis:

* l'armure sera visible dans la carte de chat [game-icon game-icon-armor-upgrade] (vous pouvez la modifier)
* si vous n'aviez pas sélectionné de cible, vous pouvez cliquer sur le token de la scène qui est la cible, et cliquer sur le petit icône avec une silhouette sur la carte de chat à côté du total des dégâts.

[⇪ haut de page](#le-systeme)

## Les Objets

[fas fa-suitcase]

Les voici: [archétype](#archetype) (archetype), [armure](#armure) (armor), [livre](#livre) (book), [poursuite](#poursuite) (chase), [package d'expérience](#package-dexperience) (experiencePackage), [objet](#objet) (item), [occupation](#occupation), [créateur](#createur) (setup), [compétence](#competence) (skill), [sort](#sort) (spell), [status](#status), [talent](#talent), [arme](#arme) (weapon).

Pour utiliser les objets, livres, sorts,... stockés dans les **compendiums** [fas fa-book-atlas], il faut d'abord les **importer**:

* soit un ```Click Droit``` sur un compendium: _Importer tout le contenu_.
* soit un ```Click Droit``` sur l'item choisi: _Importer l'entité_.

Il ne faut pas utiliser directement des données des compendiums.

### Archétype

Pour le _Pulp_.

[TODO]

### Armure

_Pas très utile à ce stade de développement._

_A glisser/déposer sur un Acteur._

### Livre

* Auteur, date, langue (attention, elle doit être écrite exactement comme celle parlée par le/les personnages).
* Onglet Description
* Onglet Détails: choisir le Type,
  * cela fait apparaître des données complémentaires à préciser dont le temps d'étude, la perte de SAN,...
  * cela fait apparaître l'onglet Sorts: y glisser/déposer les sorts choisis.
* Le type Autres permet d'ajouter des gains de compétences.

_A glisser/déposer sur un Acteur._

[⇪ haut de page](#le-systeme)

### Poursuite

[TODO]

### Package d'expérience

[TODO]

### Objet

Quantité, poids, prix, description et époque [fas fa-tag].

_A glisser/déposer sur un Acteur._

### Occupation

[TODO]

### Créateur

Objet à glisser sur une fiche de personnage vierge pour accompagner et conduire la création.

[TODO]

### Compétence

[TODO]

### Sort

* Source, temps de préparation.
* Onglet Détails: type de sort, coût,...

_A glisser/déposer sur un Acteur ou sur un Ouvrage._

### Status

[TODO]

### Talent

Pour le _Pulp_.

[TODO]

### Arme

Choisir le **type**: Mêlée / À distance, Manœuvre, Lancé, Fusil à pompe, Canon Double, À empalement, Rafale, Automatique, +Imp/2 / +Imp, Silencieuse, Spécial, Montée, À Souffle, Étourdissante, Rare, Brûle.

Compétence principale (par exemple: _Armes de poing_), Portée(s) en yard, Dommage(s).

Dans l'onglet Détails: choisir la/les époques, Panne, Cadence, Max/round, Capacité, Balles/rafale, Rayon, le Prix.

_A glisser/déposer sur un Acteur._

[⇪ haut de page](#le-systeme)

## Les Acteurs

[fas fa-user]

Les voici: [personnage](#personnage) (character), [contenant](#contenant) (container), [créature](#creature) (creature), [protagoniste](#protagoniste) (npc), [véhicule](#vehicule) (vehicle)

Pour utiliser les créatures stockées dans les **compendiums** [fas fa-book-atlas], il faut d'abord les **importer**:

* soit un ```Click Droit``` sur un compendium: _Importer tout le contenu_.
* soit un ```Click Droit``` sur l'item choisi: _Importer l'entité_.

Il ne faut pas utiliser directement des données des compendiums.

### Personnage

Voir [Créer un Investigateur](#creer-un-investigateur).

### Contenant

Acteur qui peut contenir (par glissé/déposé) des objets: objets, ouvrages, sorts, armes, armures.

Les personnages qui ont les droits _Propriétaire_ dessus pourront alors les y prendre ou les y ranger (comme un coffre, une cave,...) via l'icône [game-icon game-icon-trade].

### Créature

Lorsque vous avez importé une créature d'un compendium et vous créez son **token** sur une scène, si elle a des compétences définies **aléatoirement**, le système va vous demander de Jeter les dés, prendre les Moyennes ou Passer cette étape.

**La fiche de créature**

Les menus/icônes de la **barre** du haut de la fiche:

* [fas fa-gear] Changer le style de fiche (pas utile).
* [fas fa-circle-user] Modifier le token du personnage.
* [fas fa-passport] Récupérer l'ID du personnage.

Et en-**dessous**, sur la fiche:

* [fas fa-link] Précise si le personnage est son **token** sont liés: toute modif de l'un impactera potentiellement l'autre (très utile !).

En **bas à gauche du portrait**: 4 icônes.

* [fas fa-dice] Génère des caractéristiques aléatoires
* [fas fa-balance-scale] Prends les caractéristiques moyennes
* [fas fa-lock] [fas fa-lock-open] Permet ou non la modification de la fiche.
* [fas fa-square-root-alt] [fas fa-user-edit] Bascule entre le mode formule (3D6+3) ou valeur (15).

Et pour le **token** spécifiquement:

* [game-icon game-icon-backup] Signifie que ce token est une instance d'acteur (token et créature ne sont pas liés: les modifications faites sur l'un n'impactent pas l'autre).
* [fas fa-user-circle]  Signifie que c'est un token.

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
* Les armes: _voir_ [Onglet Combat](#onglet-combat)
* L'inventaire: objets, ouvrages, sorts, armures. _Voir_ [Onglet Equipement](#onglet-equipement)
* Les effets
* Les notes du Gardien
* Les Notes, à droite de la fiche, donnent la description de la créature.

En mode **modification** [fas fa-lock-open], le petit [fas fa-cogs] vert permet de permuter entre le calcul automatique de la valeur ou le fait qu'elle soit fixée. Par contre, plus grand chose n'est cliquable en modification.

### Protagoniste

C'est pareil qu'une [créature](#creature) sauf que ça n'a pas de type mais une profession et un âge.

### Véhicule

[TODO]

[⇪ haut de page](#le-systeme)

# Introduction aux règles

## 1 Ambiance générale

L’Appel de Cthulhu est un jeu de rôle mettant en scène des personnages affrontant des situations qui bien souvent les dépassent complètement tant leurs implications quant à l’insignifiance de la vie humaine sont grandes. Ces situations, appartenant au genre de l’Horreur Cosmique, sont bien souvent l’aboutissement des scénarios de l’Appel de Cthulhu et les joueurs devront guider leur personnage, appelé « Investigateur » au travers des obstacles mis en place par le Gardien jusqu’à la résolution de l’intrigue qui leur est proposée.

## 2 Les tests - lancer 1D100

Dans la plupart des Jeux de Rôle, lorsque votre personnage entreprend une action, il vous sera demandé de réaliser un test dans une compétence appropriée afin de déterminer la réussite ou non de votre action.

Dans l’Appel de Cthulhu, on utilise la combinaison de deux dés à 10 faces pour constituer un dé à 100 faces (abrégé 1D100) pour réaliser ces tests. La lecture de ces deux dés se fait de la manière suivante : dé de dizaine + dé d’unité, sauf lorsque vous obtenez “00” et “0” ce qui donne 100.

Le système D100 est un système de pourcentage dans lequel vous vous battez contre votre valeur de caractéristique ou de compétence. Il faut donc faire moins que votre score de compétence pour réussir un test.

**Par exemple, si vous avez 60 dans une compétence, vous  réussissez votre jet sur les valeurs 01 à 60 compris, ce qui fait donc bien soit 60 chances sur 100 de réussir.**

Ce système est donc assez intuitif afin de se représenter la valeur d'une compétence ou d'une caractéristique.

[⇪ haut de page](#le-systeme)

## 3 Quand lancer un dé ?

Lors d’une partie de l’Appel de Cthulhu, vous passez la majorité du temps à discuter avec les autres joueurs (et le Gardien) des actions de vos personnages, sans lancer le moindre dé. Les joueurs peuvent décrire ce que tentent leurs investigateurs, comme dans un roman, ou parler en leur nom, comme dans une pièce de théâtre.

Le Gardien annonce ce que font les personnages non-joueurs (PNJ) et décrit le monde entourant les investigateurs. Pour l’instant, tout va bien. Chaque intervenant accepte la parole des autres et s’appuie dessus pour bâtir une histoire intéressante. Jusqu’à ce qu’ils finissent par ne plus être d’accord. Par exemple, peut-être avez-vous des doutes sur ce que le Vieux Marsh (interprété par le Gardien) vous raconte à propos des livres manquants de la bibliothèque. 

Quand quelqu’un fait une déclaration qui ne vous plaît pas, vous pouvez demander des éclaircissements ou exprimer votre désaccord. En fin de compte, si vous n’acceptez pas ce qui se passe dans la narration, il est possible de résoudre la situation à l’aide des dés. De même, vous pourriez annoncer que votre investigateur parvient à grimper en haut du clocher en pleine nuit et sous une pluie battante. 

Toutefois, sans jet de dé pour tester la compétence de votre investigateur, il n’y a ni tension, ni intensité dramatique !

[⇪ haut de page](#le-systeme)

## 4 Niveaux de réussite

| 01 | ≤ comp/5 | ≤ comp/2 | ≤ comp | > comp | 96+ |
| --- | --- | --- | --- | --- | --- |
| Réussite critique | Réussite extrême | Réussite majeure | Réussite ordinaire | Échec (ordinaire) | Échec critique |

Il existe plusieurs niveaux d’échec et de réussite qui sont résumés dans le tableau ci-dessus.

**Précision sur l’échec critique : si votre compétence est de 50 ou plus, alors un échec critique se produit sur un 100 seulement.**

Pour résumer le reste, on va d’une réussite décisive (critique), sans concession vis à vis de la demande que vous avez formulé pour votre personnage, à la pire des catastrophes envisageable dans le cadre de votre action, pouvant mener à un danger ou une blessure si la situation est appropriée.

Le Gardien a la charge de déterminer le niveau de difficulté des tests de compétence. Dans  l’Appel de Cthulhu on distingue donc trois niveaux : ordinaire, majeur et extrême.

Test **ordinaire** : une tâche moyenne pour une personne compétente. Pour réussir, le joueur doit obtenir un résultat inférieur ou égal à la valeur entière de sa caractéristique ou sa compétence. Ce niveau couvre la majorité des cas. Lorsque les règles parlent de « test » sans préciser la difficulté, il s’agit d’un test ordinaire.

Test **majeur** : la tâche présente un défi, même pour un professionnel. Cette fois, le joueur doit obtenir la moitié de la valeur de sa caractéristique ou de sa compétence, ou moins, pour espérer réussir. Ce niveau est utilisé plus rarement.

Test **extrême** : la tâche est risquée pour un expert. On est vraiment à la limite de ce qui est humainement possible. Pour parvenir à ses fins, le joueur doit obtenir un résultat égal ou inférieur à un cinquième de sa caractéristique ou de sa compétence. Ce niveau est réservé à des situations exceptionnelles.

Les valeurs correspondant à la moitié et au cinquième de chaque compétence peuvent être inscrites sur la feuille de personnage à côté de la valeur entière.

[⇪ haut de page](#le-systeme)

## 5 Redoubler un jet

### 5.1 Concept

Un joueur peut demander à redoubler un test pour obtenir une deuxième et dernière chance d’atteindre son but. Ce n’est possible que s’il trouve une justification ou plus précisément une prise de risque.

Quand un joueur demande : « Puis-je redoubler le test ? », le Gardien réplique : « Que fais-tu pour changer la situation ? » Ce n’est pas au Gardien de répondre simplement oui ou non, mais au joueur de décrire les efforts et/ou risques supplémentaires de son investigateur ou le temps passé à la tâche. S’il n’a pas d’idée, il peut demander de l’aide autour de la table. En redoublant un test, le joueur joue à quitte ou double. Il donne au Gardien la permission d’employer des conséquences graves si jamais il échoue à nouveau. 

### 5.2 Exemples

Redoubler un test implique de pousser la situation dans ses retranchements, dont voici quelques exemples :

* Si vous défoncez une porte, vous vous jetez dessus sans aucune retenue, au risque de vous blesser.
* Si vous tentez de convaincre un policier, vous courez le risque de vous faire arrêter.
* Si vous fouillez une pièce, vous pouvez retourner les meubles et peut-être casser quelque chose, ou y passer trop de temps alors que vous savez que vos ennemis pourraient arriver d’une minute à l’autre.
* Si vous jaugez quelqu’un à l’aide de Psychologie, cela peut signifier que vous l’étudiez de trop près ou que vous posez des questions embarrassantes.
* Si vous escaladez un mur, cela peut signifier que vous poursuivez votre ascension même si vos prises ne sont pas sûres.
* Si vous lisez un ouvrage étrange, vous passez une éternité sur chaque page, la lisant et la relisant tant que vous n’en avez  pas compris chaque détail, au risque de vous perturber l’esprit.

### 5.3 Conséquences

Dans le cas d’un redoublement réussi, le joueur a atteint son but initial, et aucune conséquence négative ne se produit.

Dans le cas d’un redoublement raté, le Gardien prend la main, peut réaliser le risque proposé par le joueur pour son investigateur, imposer des dégâts ou encore un test de santé mentale, une perte d’équipement, en bref, une conséquence très fâcheuse.

[⇪ haut de page](#le-systeme)

## 6 Dés bonus et malus

### 6.1 Quand ?

Parfois, les circonstances, l’environnement ou le temps disponible peuvent être un handicap ou un atout pour un test de compétence ou de caractéristique. Dans ce cas, le Gardien peut attribuer un « dé bonus » ou un « dé malus ». Les dés bonus et malus ne sont pas de maigres additions ou soustractions de quelques points de pourcentage. Il faut les manier avec parcimonie. Si un facteur est si mineur qu’il ne modifierait guère les chances de réussite, ce n’est pas la peine de le prendre en compte. Conduire sous une pluie légère n’inflige pas de dé malus. Par contre, sous un déluge si épais qu’on y voit à peine à deux mètres, là oui ! Dans la plupart des cas, un seul dé bonus ou malus suffit pour renforcer ou pénaliser un test. 

Cependant, dans des situations spécialement avantageuses ou ardues, le Gardien peut appliquer un deuxième dé bonus ou malus. Un dé bonus et un dé malus s’annulent l’un l’autre.

### 6.2 Comment ?

Pour chaque dé **bonus** : lors du jet de compétence, lancez un dé de dizaine supplémentaire en même temps que les dés de pourcentage habituel. Vous lancez trois dés distincts : un dé pour les unités et deux pour les dizaines. Gardez le dé des dizaines donnant le meilleur résultat (c’est-à-dire le plus bas).

Pour chaque dé **malus** : lors du jet de compétence, lancez un dé de dizaine supplémentaire en même temps que les dés de pourcentage habituel. Vous lancez trois dés distincts : un dé pour les unités et deux pour les dizaines. Gardez le dé des dizaines donnant le pire résultat (c’est-à-dire le plus haut).

[⇪ haut de page](#le-systeme)

## 7 La Chance

La Chance est une caractéristique un peu à part dans le profil d’un investigateur. Un test de Chance peut être demandé par le Gardien lorsqu’un évènement ne dépend que de facteurs extérieurs (comme pour savoir si la pluie va se mettre à tomber, handicapant une escalade ou facilitant une infiltration). Si le test est demandé pour un groupe, l’investigateur avec la chance la plus basse fait le test.

**Règle optionnelle - Dépenser sa Chance** : après un jet, un joueur peut choisir dépenser des points de Chance pour réduire le résultat de son jet de 1 pour chaque point de Chance dépensé. On ne peut pas redoubler ET dépenser sa Chance.

La Chance remonte progressivement lors des phases de développement avec un test d’expérience classique.

[⇪ haut de page](#le-systeme)

Légende:
dé [fas fa-dice] module [fas fa-cube] engrenage [fas fa-cogs] scène [fas fa-map] chat [fas fa-comments] combat [fas fa-swords]
objet [fas fa-suitcase] acteur [fas fa-user] compendium [fas fa-book-atlas] table [fas fa-table-list] journal [fas fa-book-open] macro [fas fa-code]
outils du gardien 🐙 / lancer! 🎲 / créer un lien 🔗
[fas fa-angle-double-up] Phase de développement [fas fa-user-edit] Mode création de personnage [fas fa-fingerprint] CoC ID: remplacement des Acteur Item
[fas fa-book-user] Installez votre compendium [fas fa-user-plus] Import de Protagoniste [fas fa-user-check] Création de Personnage guidée
[fas fa-certificate] Gain d'expérience [fas fa-sim-card] Envoyer un jet leurre aux joueurs [fas fa-moon] Se reposer
