<!--- This file is auto generated from module/manual/de/README.md -->
# Systemdokumentation für Version 7.0

Dieses Dokument ist ein in Arbeit befindlicher Überblick über das CoC7-System und stellt keine Anleitung zur Verwendung von FoundryVTT dar.

Sie benötigen eines dieser folgenden Bücher, um das Spiel zu spielen:

- Cthulhu - Grundregelwerk
- Cthulhu - Einsteigerbox
- Cthulhu - Schnellstartregeln

Das System automatisiert die meisten üblichen Aufgaben und Regeln, welche benötigt werden um das Spiel zu spielen.

Mehrere Teile des Charakterbogens haben auftauchende Tooltips, welche nach zwei Sekunden erscheinen, diese Verzögerung kann in den Einstellungen geändert werden.

Dieses Dokument kann erneut geöffnet werden unter Spieleinstellungen -> Hilfe und Dokumentation -> CoC7 System Handbuch ansehen

# Kürzliche Änderungen

Für eine vollständige Liste der Änderungen überprüfen Sie das [Änderungsprotokoll](https://github.com/Miskatonic-Investigative-Society/CoC7-FoundryVTT/blob/develop/.github/CHANGELOG.md) auf github

- Neuer Charakterbogen

# Module von Chaosium

- [Call of Cthulhu® - Starter Set](https://foundryvtt.com/packages/cha-coc-fvtt-en-starterset) - Enthält drei Szenarien (Paper Chase, Edge of Darkness, and Dead Man Stomp) und Anleitungen zum Spielen der 7ten Edition von Call of Cthulhu.
- [Call of Cthulhu® - Quick-Start Rules](https://foundryvtt.com/packages/cha-coc-fvtt-en-quickstart) - Enthält das Szenario Spuk im Corbitt-Haus und eine Anleitung für Einsteiger für FoundryVTT und die 7te Edition von Call of Cthulhu.
- [Call of Cthulhu® - FoundryVTT - Investigator Wizard](https://foundryvtt.com/packages/call-of-cthulhu-foundryvtt-investigator-wizard) - Veröffentlicht mit der Erlaubnis von Chaosium. Enthält Archetypen, Berufe, Setups und Fertigkeiten für die Benutzung im Assistenten für die Charaktererstellung.

# Übersichtsabschnitte

Falls dies Ihr erstes Mal ist, ist es empfohlen, dass Sie die folgenden Abschnitte lesen.

FoundryVTT basiert auf Charakteren und Items. Dieses Modul enthält eine Reihe von systemspezifischen Charakteren und Items, von denen einige Beispiele in den beigefügten Systemkompendien zu finden sind.

- [Charakterübersicht](#actor-overview)
- [Items Übersicht](#items-overview)
- [Einstellungsübersicht](#settings-overview)
- [Übersicht Szenenmenü](#call-of-cthulhu-scene-menu)
- [Tastatur- und Mauskürzel](#keyboard-and-mouse-shortcuts)
- [Erstellung Ihres ersten Investigators](first_investigator.md)
- [Charaktererstellung](character_creation.md)

# Wie man das System benutzt

- [Aktive Effekte](effects.md) - Ein aktiver Effekt wird die Charaktercharakteristiken, -attribute, -fertigkeiten modifizieren.
- [Charakterimporter](actor_importer.md)
- Charaktertyp: Charakter (TODO)
- Charaktertyp: Container (TODO)
- Charaktertyp: Kreatur (TODO)
- Charaktertyp: NSC (TODO)
- Charakter Erstellmodus (TODO)
- [Kampf](combat.md) (TODO)
- Entwicklungsphase (TODO)
- [Item Typen](items.md)
- [Item Typ: Archetyp](item_archetype.md) (TODO)
- [Item Typ: Buch](item_book.md) (TODO)
- [Item Typ: Verfolgungsjagd](chases.md)
- Item Typ: Item (Gegenstand) (TODO)
- [Item Typ: Beruf](item_occupation.md)
- [Item Typ: Setup](item_setup.md)
- [Item Typ: Fertigkeit](item_skill.md) (TODO)
- Item Typ: Zauber (TODO)
- Item Typ: Status (TODO)
- Item Typ: Talent (TODO)
- Item Typ: Waffe (TODO)
- [Linkerstellungswerkzeug](link_creation_window.md)
- [Links](links.md) (TODO)
- Macros (TODO)
- Würfelwürfe (TODO)
- [geistige Stabilität](sanity.md) (TODO)
- Pause starten (TODO)
- Erfahrungsgewinn (TODO)

# Charakterübersicht

- _Charakter_ - Ein kompletter Charakter, in der Regel ein Investigator. [_Beispielcharakter_]
- _Container_ - Ein Aufbewahrungsbehälter. [_Beispielcontainer_]
- _Kreatur_ - Ein einfacherer Charakter, geeignet für Kreaturen. [_Beispielkreatur_]
- _NSC_ - Ein einfacherer Charakter, geeignet für NSCs. [_Beispiel NSC_]

# Items (Gegenstands-) Übersicht

- _Archetyp_ - Eine Reihe von Fertigkeiten und anderen Werten, die ein Pulp Cthulhu Archetyp implementiert. Diese lösen keine Automatisierung im System aus. [_Beispiel Archetyp_]
- _Buch_ - Ein arkaner Foliant, der Zaubersprüche oder Charakterverbesserungen enthalten kann.
- _Item_ - Ein Teil des Equipments.
- _Beruf_ - Eine Reihe von Fertigkeiten und anderen Werten, die ein CoC-Beruf implementiert. [_Beispielberuf_]
- _Setup_ - Eine Reihe von Standardkonfigurationen für die Erstellung eines Charakters, einer Kreatur, oder eines NSCs. [_Beispiel Setup_]
- _Fertigkeit_ - Eine Fertigkeit mit einem Basisprozentsatz und einigen Kennzeichnen. [_Beispielfertigkeit_]
- _Zauber_ - Ein magischer Zauber.
- _Status_ - Ein Phobiezustand oder Maniezustand. [_Beispielmanie_]
- _Talent_ - Eine besondere Kraft für Pulp Cthulhu. Diese lösen keine Automatisierung im System aus. [_Beispieltalent_]
- _Waffe_ - Ein Item mit Waffenstatistiken (dies schließt unbewaffnete Angriffe mit ein). [_Beispielwaffe_]

# Einstellungsübersicht

Klicken Sie auf den Reiter Spieleinstellungen, dann unter der Überschrift Spieleinstellungen auf Einstellungen konfigurieren.

Klicken Sie auf Systemeinstellungen

- _Regelvarianten/ optionale Regeln_ - Hier können sie individuelle Pulp Cthulhu Regeln aktivieren, sowie andere optionale Regeln.
- _Initiativeeinstellungen_ - Zusätzliche Einstellungen für optionale Initiativeregeln
- _Würfelwurfeinstellungen_ - Standardoptionen für Würfelwürfe
- _Chatnachrichteneinstellungen_ - Konfigurieren Sie Chatnachrichten
- _Szeneneinstellungen_ - Szeneneinstellungen
- _Einstellungen zu Spielegrafiken_ - Dies erlaubt es Ihnen ein angepasstes Pause Icon und eine angepasste Pausenachricht
- _Bogeneinstellungen_ - Dies erlaubt es Ihnen die Einstellungen des Charakterbogens anzupassen und optionales CSS
- _Waffeneinstellungen_ - Waffeneinstellungen
- _Entwickler- und Debug-Einstellungen_ - Diese Einstellungen können Ihre Welt zerstören, wenn neue Aktualisierungen veröffentlicht werden. Benutzen Sie diese Einstellungen nur in Testwelten.
- _Würfeltabelleneinstellungen_ - Wenn geistige Stabilitätsproben durchgeführt werden, kann das System automatisch auf einen Anfall des Wahnsinns würfeln. Sie können eine Beispielwürfeltabelle im Kompendium für Würfeltabellen der geistigen Stabilität finden.

# Übersicht Szenenmenü

Um auf dieses Menü zugreifen zu können, müssen Sie über eine aktive Szene verfügen, die Sie im Szenenverzeichnis erstellen können. Diese Optionen sind nur für den Spielleiter verfügbar.

- _Spielleiterwerkzeuge_
	- _Entwicklungsphase_: Wenn diese aktiviert ist, können Spieler Verbesserungswürfe für ihre markierten Fertigkeiten durchführen.
	- _Charaktererstellungsmodus_: Wenn dieser aktiviert ist, können Spieler Punkte unter ihren Fertigkeiten verteilen.
	- _Erfahrungsgewinn_: Wenn dies aktiviert ist, wird eine Fertigkeit markiert zur Verbesserung nach einer erfolgreichen Probe.
	- _Den Spielern einen Scheinwurf senden_: Wenn dies geklickt wird, werden die Spieler einen 'Fake' privaten Würfelwurf des Spielleiters sehen.
	- _Würfelwurf !_: Wird verwendet, um einen 1d100 mit einem Schwellenwert, einer Schwierigkeit und einem Bonus oder Strafwürfel zu würfeln.
	- _Linkerstellung_: Erstellen Sie einen Würfelwurflink für Spieler zum Anklicken.

# Tastatur- und Mauskürzel

Es gibt viele Elemente in den Bögen, die einen Würfelwurf auslösen, wenn sie angeklickt werden. Normalerweise wird ein Dialog angezeigt, der den Nutzer zur Eingabe der Schwierigkeit und eines möglichen Bonus oder Malus auffordert. Dieses Verhalten wird mit den folgenden Steuerelementen geändert:

- Rechtsklick auf ein Element mit Würfelwurf um einen konkurrierenden Würfelwurf hinzuzufügen. Solange die Karte offen ist, werden alle Würfelwürfe, welche mit einem Rechtsklick gemacht werden dem Kräftemessen hinzugefügt.
- Alt + Rechtsklick auf ein Element mit Würfelwurf um dies in einen kombinierten Würfelwurf einzuschließen.
- Shift + Linksklick auf ein Element mit Würfelwurf wird einen Würfelwurf ausführen ohne vorher nach der Schwierigkeit, dem Bonus oder dem Malus zu fragen.
- Strg + Linksklick auf ein Element mit Würfelwurf wird eine Würfelwurfanfrage erstellen. Dies ist nur für den Spielleiter verfügbar.
- Alt + Linksklick auf die geistige Gesundheit wird den Spieler auffordern den minimalen und maximalen Verlust der geistigen Stabilität anzugeben.
