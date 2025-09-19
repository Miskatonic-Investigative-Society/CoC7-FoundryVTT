<!--- NE PAS MODIFIER. Ce fichier est généré automatiquement à partir des modifications apportées à module/manual/en/README.md. Les changements apportés à ce fichier seront perdus -->
# Documentation système pour la version 7.14
Ce document est un aperçu en cours d'élaboration du système CoC7. Il ne s'agit pas d'un tutoriel pour utiliser FoundryVTT.
Pour jouer, vous aurez besoin de l'un des éléments suivants :
- *Call of Cthulhu 7ᵉ Édition* de Chaosium – *Livre du Gardien*
- *Call of Cthulhu 7ᵉ Édition* de Chaosium – *Set de démarrage*
- *Call of Cthulhu 7ᵉ Édition* de Chaosium – *Règles rapides*
Le système automatise la plupart des tâches et règles courantes liées à la gestion d'une partie.
Plusieurs parties des fiches de personnage comportent des infobulles qui s'affichent après deux secondes. Ce délai peut être modifié dans les paramètres.
Cette documentation peut être rouverte via *Paramètres du jeu* → *Aide et documentation* → *Afficher le manuel du système CoC7*.

# Changements récents
Pour une liste complète des modifications, consultez le [journal des changements](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) sur GitHub.
- Utilisation des [Compendiums](compendiums.md) pour mettre à jour vos textes.

# Modules Chaosium
- [Call of Cthulhu® - Set de démarrage](https://foundryvtt.com/packages/cha-coc-fvtt-en-starterset) – Contient trois scénarios (*Course au papier*, *Au bord des ténèbres*, *Le Mort qui danse*) et des instructions pour jouer à *Call of Cthulhu 7ᵉ édition*.
- [Call of Cthulhu® - Règles rapides](https://foundryvtt.com/packages/cha-coc-fvtt-en-quickstart) – Contient le scénario *La Maison hantée* et un guide débutant pour FoundryVTT et *Call of Cthulhu 7ᵉ édition*.
- [Call of Cthulhu® - FoundryVTT - Assistant d'investigateur](https://foundryvtt.com/packages/call-of-cthulhu-foundryvtt-investigator-wizard) – Publié avec l'autorisation de Chaosium, contient des archétypes, métiers, configurations et compétences pour l'*Assistant de création d'investigateur*.

# Sections d'aperçu ci-dessous
Si c'est votre première fois, il est recommandé de lire également les sections suivantes sur cette page.
Foundry VTT repose sur les *acteurs* et les *objets*. Ce module inclut un certain nombre d'acteurs et d'objets spécifiques au système, dont des exemples peuvent être trouvés dans les compendiums système fournis.
- [Aperçu des acteurs](#aperçu-des-acteurs)
- [Aperçu des objets](#aperçu-des-objets)
- [Aperçu des paramètres](#aperçu-des-paramètres)
- [Menu de scène](#menu-de-scène-call-of-cthulhu)
- [Raccourcis clavier et souris](#raccourcis-clavier-et-souris)
- [Créer votre premier investigateur](first_investigator.md)
- [Création de personnage](character_creation.md)

# Comment utiliser le système
- [Effets actifs](effects.md) – Un effet actif modifiera une ou plusieurs caractéristiques, attributs ou compétences d'un acteur.
- [Importateur d'acteurs](actor_importer.md)
- Type d'acteur : Personnage (À FAIRE)
- Type d'acteur : Conteneur (À FAIRE)
- Type d'acteur : Créature (À FAIRE)
- Type d'acteur : PNJ (À FAIRE)
- Outil de création de liens de discussion (À FAIRE)
- Mode création de personnage (À FAIRE)
- [Combat](combat.md) (À FAIRE)
- [Compendiums](compendiums.md)
- Phase de développement (À FAIRE)
- [Types d'objets](items.md) (À FAIRE)
- [Type d'objet : Archétype](item_archetype.md) (À FAIRE)
- [Type d'objet : Livre](item_book.md) (À FAIRE)
- [Type d'objet : Poursuites](chases.md)
- Type d'objet : Objet (À FAIRE)
- [Type d'objet : Métier](item_occupation.md)
- [Type d'objet : Configuration](item_setup.md)
- [Type d'objet : Compétence](item_skill.md) (À FAIRE)
- Type d'objet : Sort (À FAIRE)
- Type d'objet : État (À FAIRE)
- Type d'objet : Talent (À FAIRE)
- Type d'objet : Arme (À FAIRE)
- [Outil de création de liens](link_creation_window.md)
- [Liens](links.md) (À FAIRE)
- Macros (À FAIRE)
- Jets (À FAIRE)
- [Santé mentale](sanity.md) (À FAIRE)
- Début de repos (À FAIRE)
- Gain d'XP (À FAIRE)

# Aperçu des acteurs
- *Personnage* – Un personnage complet, généralement un investigateur. [*Exemple de personnage*]
- *Conteneur* – Un conteneur d'inventaire. [*Exemple de conteneur*]
- *Créature* – Un personnage simplifié, adapté aux créatures. [*Exemple de créature*]
- *PNJ* – Un personnage simplifié, adapté aux PNJ. [*Exemple de PNJ*]

# Aperçu des objets
- *Archétype* – Un ensemble de compétences et autres statistiques implémentant un archétype *Pulp Cthulhu*. Ceux-ci ne déclenchent pas d'automatisation dans le système. [*Exemple d'archétype*]
- *Livre* – Un grimoire arcanique pouvant contenir des sorts et des améliorations de personnage.
- *Objet* – Un équipement.
- *Métier* – Un ensemble de compétences et autres statistiques implémentant un métier CoC. [*Exemple de métier*]
- *Configuration* – Un ensemble de configurations par défaut pour la création de personnages, créatures ou PNJ. [*Exemple de configuration*]
- *Compétence* – Une compétence avec un pourcentage de base et des étiquettes. [*Exemple de compétence*]
- *Sort* – Un sortilège magique.
- *État* – Une phobie ou une manie. [*Exemple de manie*]
- *Talent* – Un pouvoir spécial pour *Pulp Cthulhu*. Ceux-ci ne déclenchent pas d'automatisation dans le système. [*Exemple de talent*]
- *Arme* – Un objet avec des statistiques d'arme (inclut les attaques à mains nues). [*Exemple d'arme*]

# Aperçu des paramètres
Cliquez sur l'onglet *Paramètres du jeu*, puis sous l'en-tête *Paramètres du jeu*, cliquez sur *Configurer les paramètres*.
Cliquez sur *Paramètres système* :
- *Règles variantes/optionnelles* – Ici, vous pouvez activer les règles individuelles de *Pulp Cthulhu* et d'autres règles optionnelles.
- *Paramètres d'initiative* – Paramètres supplémentaires pour la règle d'initiative optionnelle.
- *Paramètres de jets* – Options par défaut pour les jets.
- *Paramètres des cartes de discussion* – Configurer les messages de discussion.
- *Paramètres de scène* – Paramètres de scène.
- *Paramètres d'illustrations* – Permet de définir une icône et un message de pause personnalisés.
- *Paramètres de fiche* – Permet de modifier les paramètres des fiches de personnage et le CSS optionnel.
- *Paramètres d'armes* – Paramètres des armes.
- *Paramètres de développement et de débogage* – Ces paramètres peuvent corrompre votre monde lors de nouvelles mises à jour, à n'utiliser que sur des mondes de test.
- *Paramètres des tables de jets* – Lorsqu'un jet de santé mentale est effectué, le système peut automatiquement lancer un jet pour un accès de folie. Vous pouvez voir des exemples de tables de jets dans les compendiums *Tables de jets de santé mentale*.

# Menu de scène Call of Cthulhu
Pour accéder à ce menu, vous devez avoir une scène active, que vous pouvez créer dans le *Répertoire des scènes*. Ces options ne sont disponibles que pour le Gardien.
- *Outils du Gardien*
  - *Phase de développement* : Lorsqu'activée, les joueurs peuvent effectuer des jets d'amélioration pour leurs compétences marquées.
  - *Mode création de personnage* : Lorsqu'activé, les joueurs peuvent distribuer des points parmi leurs compétences.
  - *Gain d'XP* : Lorsqu'activé, une compétence sera marquée pour amélioration après un jet réussi.
  - *Envoyer un jet leurre aux joueurs* : Lorsqu'on clique, les joueurs verront un faux jet privé du MJ.
  - *Début de repos* : Lorsqu'on clique, sélectionnez les personnages pour effectuer un repos et lancer les jets de gains d'XP.
- *Lancer !* : Utilisé pour lancer 1d100 avec un seuil, une difficulté et des dés de bonus ou de pénalité.
- *Créer un lien* : Créer un lien de jet pour que les joueurs cliquent dessus.

# Raccourcis clavier et souris
De nombreux éléments des fiches déclenchent un jet de dés lorsqu'on clique dessus. Habituellement, une boîte de dialogue s'affiche pour demander à l'utilisateur une difficulté et un éventuel bonus ou malus. Ce comportement est modifié avec les contrôles suivants :
- Clic droit sur un élément jetable pour l'inclure dans un jet opposé. Tant que la carte est ouverte, tous les jets effectués avec un clic droit seront ajoutés au jet opposé.
- Alt + Clic droit sur un élément jetable pour l'inclure dans un jet combiné.
- Maj + Clic gauche sur un élément jetable effectuera un jet sans demander de difficulté ou de bonus/malus.
- Ctrl + Clic gauche sur un élément jetable créera une demande de jet. Réservé au MJ.
- Alt + Clic gauche sur la santé mentale demandera au joueur le minimum et le maximum de perte de santé mentale.
