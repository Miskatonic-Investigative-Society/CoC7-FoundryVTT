# Charaktererstellung

Das System kommt mit einigen Kompendien, welche für Ihre Individualisierung bereit sind. Diese werden bei jeder Aktualisierung oder Installation des Systems zurückgesetzt. Es wird empfohlen die Kompendien in Ihre eigenen Kompendien zu überführen und diese zu bearbeiten, wenn dies erforderlich ist.

# Fähigkeiten

In diesem Abschnitt werden Sie [Fertigkeiten]{item_skill.md} erstellen oder bearbeiten.

1. Gehen Sie in das Kompendium-Pakete
2. Klicken Sie auf Kompendium erstellen

	- Geben Sie Ihrem Kompendium einen Namen (z. B. `Meine Fähigkeiten`)
	- Wählen Sie _Item_ als _Dokumenttyp_
	- Optional können Sie einen Ordner wählen, falls Sie bereits einen vorab erstellt haben.

## Eine existierende Fertigkeit benutzten

1. Öffnen Sie das Kompendium Fertigkeiten (Skills)
2. Ziehen Sie jegliche Fähigkeit, die Sie individualisieren wollen in Ihr neues Kompendium

## Erstellen einer neuen Fertigkeit

1. Gehen Sie in das Items-Verzeichnis
2. Klicken Sie auf Item erstellen

	- Vergeben Sie einen Namen
	- Setzen Sie den _Typ_ auf _Fertigkeit_
	- Optional können Sie einen Ordner wählen, falls Sie bereits einen vorab erstellt haben.

# Setup

[Setups](item_setup.md) sind eine vordefinierte Auswahl von Fertigkeiten und ein Weg die Charakteristiken zu generieren (dies kann zum Beispiel durch Würfelwürfe oder der Zuordnung von einer gewissen Anzahl an Punkten sein). Wenn ein Setup erstellt wurde kann es genutzt werden für die Erstellung mehrerer Spielercharaktere.

1. Gehen Sie in das Items-Verzeichnis
2. Klicken Sie auf Item erstellen

	- Vergeben Sie einen Namen
	- Setzen Sie den _Typ_ auf _Setup_
	- Optional können Sie einen Ordner wählen, falls Sie bereits einen vorab erstellt haben.

3. Definieren Sie das Setup als die Basiskonfiguration für einen Charaktertyp.
	- Sie können eine strukturelle Beschreibung im Reiter _Beschreibung_ hinzufügen
	- Wenn Sie auf das _Icon_ klicken, können Sie ein anderes auswählen.
	- Im Reiter _Details_ können Sie:
		- Zeigen/ Verstecken Sie den _Charaktereigenschaften_ Reiter mit dem Kontrollkästchen _Charaktereigenschaften aktivieren_
		- im Abschnitt _Cthulhu Ären_ auswählen, für welche Ära das Setup gültig ist
		- im Abschnitt _Barschaft und Anlagen_ können Sie weitere Einstufungen definieren und einem neuen Namen (Klicken Sie auf das `+` um zusätzliche Währungseinstufungen hinzuzufügen)
		- im Abschnitt Hintergrundgeschichte können Sie diese vordefiniert eintragen
		- Ziehen Sie Standardfertigkeiten wie [_Handgemenge_] hinein
	- Der _Charaktereigenschaften_ Reiter erlaubt Ihnen eine Formel zum Würfeln von Charakteristiken zu definieren oder alternativ die verfügbaren Eigenschaftspunkte.
	- Der _Fertigkeiten_ Reiter erlaubt Ihnen eine Standardauswahl an Fertigkeiten zu definieren durch das Ziehen von Items des Typs _Fertigkeit_ in den _gewöhnliche Fertigkeiten_ Bereich.

# Berufe

Ein [Beruf](item_occupation.md) hilft den Charakterhintergrund zu definieren. Betrachten Sie es als eine Reihe von _beruflichen Fertigkeiten_ (auf welche der Charakter seine Punkte für Berufsfertigkeiten verteilen kann) und die Definition, wie die Menge an verfügbaren beruflichen Punkte errechnet werden kann. Schließlich erlaubt der _Beruf_ auch die Definition der minimalen und maximalen _Finanzkraft_ des Charakters mit diesem _Beruf_.

Das System erlaubt es, den _Beruf_ so zu konfigurieren, dass er, wenn er auf einen Charakterbogen gezogen wird, die Möglichkeit bietet, eine oder mehrere Fertigkeiten aus einer geschlossenen Liste auszuwählen, oder sogar eine vordefinierte Anzahl von Fertigkeiten hinzuzufügen, um aus allen verfügbaren auszuwählen.

Der Erstellungsprozess des _Berufes_ ist der folgende:

1. Gehen Sie in das Items-Verzeichnis
2. Klicken Sie auf Item erstellen

	- Geben Sie der Fertigkeit einen Namen
	- Setzen Sie den _Typ_ auf _Beruf_
	- Optional können Sie einen Ordner wählen, falls Sie bereits einen vorab erstellt haben.

3. Definieren Sie den _Beruf_, um die relevanten Charakteristiken und beruflichen Fertigkeiten auszuwählen.
	- Sie können eine strukturelle Beschreibung im Reiter _Beschreibung_ hinzufügen und eine _Quelle_ definieren
	- Wenn Sie auf das _Icon_ klicken, können Sie ein neues auswählen
	- Im Reiter _Details_ können Sie:
		- den _Berufstyp_ auswählen
		- Definieren Sie die Charakteristiken, welche benutzt werden, um die _Punkte für Berufsfertigkeiten_ zu berechnen. Sie können die Charakteristiken markieren, welche Sie nutzen wollen und den Multiplikator definieren. Der Spieler muss zwischen den _optional_ markierten Charakteristiken wählen, während der Erstellung.

			Zum Beispiel, falls ein Beruf die Berechnung _BI * 2 + (ST oder GE) * 2_ nutzt, müssen Sie _Bildung_ auswählen und _2_ als den _Multiplikator_ eintragen, ohne _optional_ zu markieren. Für _Stärke_ und _Geschicklichkeit_ müssen Sie beide auswählen und bei beiden _optional_ markieren, sowie _2_ als den _Multiplikator_ bei beiden eintragen.

		- Schließlich müssen Sie das _Minimum_ und das _Maximum_ des Wertes der _Finanzkraft_ festlegen für diesen Beruf.
	- Der Reiter _Fertigkeiten_ erlaubt es Ihnen _berufliche Fertigkeiten_ auszuwählen durch das Hineinziehen von Items des Typs _Fertigkeit_ in die unterschiedlichen Abschnitte. Ein typischer Beruf hat 8 Fertigkeiten und eine _Finanzkraft_.
		- Die _gewöhnlichen Fertigkeiten_ beinhalten die standardmäßigen beruflichen Fertigkeiten, welche nicht geändert werden können
		- Der Abschnitt _optionale Fertigkeitsbereiche_ erlaubt das Hinzufügen einer Gruppe (Sie können auch mehrere von diesen erstellen) von Fertigkeiten, aus welchen der Spieler auswählen kann. Sobald Sie auf das `+` Zeichen klicken, wird eine Gruppe erstellt und Sie können die _auszuwählende Anzahl_ (Anzahl der aus der Gruppe auszuwählenden Fertigkeiten) definieren und eine Auflistung an verfügbaren Fertigkeiten für die Auswahl des Spielers erstellen, durch das Ziehen der Fertigkeiten in die Gruppe.
		- Schließlich erlaubt Ihnen die Option _zusätzliche Fertigkeiten_ eine Zahl an Fertigkeiten einzugeben, welche der Spieler aus den restlich verfügbaren Fertigkeiten auswählen kann.

# Erschaffung von _Investigatoren_

Sie können einen _Investigator_ erstellen, durch die Erstellung eines _Akteurs_ und dem Füllen des entsprechend leeren _Charakterbogens_. Es ist deutlich einfacher, falls Sie zuvor ein _Setup_ und einen _Beruf_ erstellt haben (siehe oben). Wenn Sie beides erstellt haben ist der Erstellungsprozess des _Investigators_ wie folgt:

1. Gehen Sie in das Akteure-Verzeichnis
2. Klicken Sie auf Akteur erstellen

	- Geben Sie dem Charakter einen Namen
	- Setzen Sie den _Typ_ auf _Charakter_

3. Ziehen Sie das Item vom Typ _Setup_ (zum Beispiel 1920er, 1890er Pulp, Modern, ...) auf den Bogen um das Basissetup durchzuführen mit der Konfiguration des definierten Items. Normalerweise beinhaltet dies das Auswürfeln der Charakteristiken oder das vergeben der Werte mit dem Punktesystem und dem Festlegen eines Standardsets an Fertigkeiten entsprechend des gegebenen Setups.

4. Ziehen Sie ein Item vom Typ _Beruf_ auf den Bogen, was das Auswählen einiger Fertigkeiten aus einer reduzierten Menge oder aus den verbleibenden mit sich bringt. Es werden die verfügbaren _Punkte für Hobbyfertigkeiten_ und die _Punkte für Berufsfertigkeiten_ berechnet und weisen Sie von Ihren Punkten der Berufsfertigkeiten mindestens den Minimalwert der _Finanzkraft_ des gewählten Berufs zu.

5. Klicken Sie im Menü der Spielleitung auf der linken Seite auf Spielleiterwerkzeuge. Wenn dieses Menü nicht verfügbar ist, müssen Sie eine aktive Szene haben, die Sie im Szenenverzeichnis erstellen können.

6. Klicken Sie im Untermenü auf Investigatorenerstellungsmodus. Eine neue Registerkarte (Tab) mit dem Namen _Charakterentwicklung_ sollte auf dem Charakterbogen erscheinen.

7. Klicken Sie auf die Registerkarte (Tab) Charakterentwicklung

8. Die erste Punktespalte ist für Ihre beruflichen Fertigkeiten, welche durch Klicken umgeschaltet werden können.
	- Falls Sie die Pulpregel Archetyp aktiviert haben, werden Sie einen zweiten Punkt haben um dies umzuschalten

9. Verteilen Sie berufliche und hobbymäßige Punkte im Register (Tab) Entwicklung unter Berücksichtigung der Tatsache, dass jede Fertigkeit 5 Spalten hat:
	1. Die erste Spalte enthält den Basisprozentsatz der Fertigkeit
	2. Die zweite Spalte dient zur Eingabe der _Punkte der Hobbyfertigkeiten_ während der Erstellung des Investigators
	3. Die dritte Spalte ist nur verfügbar für die als _beruflich_ markierten Fertigkeiten (Markiert durch einen dunklen Kreis vor dem Namen der Fertigkeit) und wird genutzt zur Zuordnung der _Punkte für Berufsfertikeiten_.
		- Falls Sie die Pulpregel Archetyp aktiviert haben, werden Sie eine vierte Spalte haben um Ihre Archetyp Punkte einzutragen.
	4. Die vierte und fünfte Spalte sollten initial leer sein. Hier sollten die Erfahrungspunkte erscheinen (Sie können also Punkte hier zuordnen, falls Sie einen erfahrenen Charakter spielen).
	5. Die letzte Spalte ist schreibgeschützt mit dem errechneten Endwert der Fertigkeit (Die Summe der andern vier Spalten).

- [Video, welche den Prozess der Erschaffung eines Investigators zeigt](https://www.youtube.com/watch?v=VsQZHVXFwlk)
