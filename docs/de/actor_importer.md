<!--- This file is auto generated from module/manual/de/actor_importer.md -->
# Spielfiguren Importer

Du kannst den Spielfiguren Importer verwenden, um verschiedene Formen von NPC- oder Kreaturen-Blöcke aus Abenteuern zu importieren. Ebenso kannst du Spielercharaktere importieren, die aus dem JSON Export-Tool von [The Dholes House](https://www.dholeshouse.org/) stammen.

Um den Spielfiguren-Importer zu öffnen, öffnen Sie entweder das Spielfiguren-Verzeichnis und klicken Sie unten in der Seitenleiste auf Darsteller-Importer oder klicken Sie in einer aktiven Szene auf Darsteller-Importer

# Übersicht

Falls du diese Funktion das erste Mal verwendest, lese bitte auch die folgenden Abschnitte zur näheren Erklärung.

- Nichtspielercharakter (NSC/NPC) / Kreatur
- The Dhole's House Actor Importer JSON

# Nichtspielercharakter (NSC/NPC) / Kreatur

![](../../assets/manual/importer/importer.webp)

1. Wähle NPC oder Kreatur
2. Soll das System den Charakterblock einer früheren Edition in die 7. Edition konvertieren?
3. Wähle die Sprache des Charakterblocks
4. Wenn beim Import Fertigkeiten, Gegenstände, Zaubersprüche und Waffen hinzugefügt werden, kann das System versuchen bereits vorhandene Objekte mit demselben Namen zu verwenden. Hierbei kann festgelegt werden, in welcher Reihenfolge das System vorrangig die Objekte suchen soll:

   _Gegenstände (Items)_: Aus den aktiven Gegenstand-Verzeichnissen deiner aktiven Welt. (Reiter: Gegenstände)

   _Spielwelt (World)_: Aus den Kompendien, die als Teil deiner Welt erstellt wurden.

   _Module_: Aus den Kompendien die durch deine aktiven Module bereitgestellt werden.

   _System_: Aus den Kompendien, die mit diesem Spielsystem mitgeliefert werden.

5. Um Nichtspielercharaktere und Kreaturen einfacher importieren zu können, wird ein Beispiels-Charakterblock bereitgestellt, der über die "Copy Example" Schaltfläche in die Zwischenablage kopiert werden kann. Das Layout ist entsprechend dem Standard Cthulhu Charakterblock Layout ausgelegt. Du kannst es in das Textfeld kopieren und nach deinen Wünschen anpassen oder einen entsprechenden Charakterblock aus einem Abenteuer einfügen.

Das Betätigen der "Import"-Schaltfläche wird den Charakter erstellen und den Charakter im Figuren-Reiter im Ordner "imported characters" ablegen. Alle Textinhalte die nicht verarbeitet werden konnten, werden in den Spielleiter-Notizen (Keeper Notes) abgelegt.

# The Dhole's House Actor Importer JSON

![](../../assets/manual/importer/actor.webp)

"The Dhole's House" ist eine offizielle Webseite auf der Werkzeuge für Spieler und Spielleiter (Keeper) für das Call of Cthulhu Spielsystem bereitgestellt werden. Auf ihr ist es möglich einen Investigator für das Spielsystem mit allerlei vorliegenden Inhalten zu erstellen. Um die Inhalte im Anschluss in diesem Spielsystem unter FoundryVTT verwenden zu können, gibt es die Möglichkeit Charakterbögen von der Webseite in einem maschinenlesbaren Format herunterzuladen.

1. Lade auf "The Dhole's House" den Charakterbogen deines Investigators als JSON Datei herunter
2. Wähle im Importer den Figurentyp: "The Dhole's House Actor Importer JSON"
3. Wenn beim Import Fertigkeiten, Gegenstände, Zaubersprüche und Waffen hinzugefügt werden, kann das System versuchen bereits vorhandene Objekte mit demselben Namen zu verwenden. Hierbei kann festgelegt werden, in welcher Reihenfolge das System vorrangig die Objekte suchen soll:

   _Gegenstände (Items)_: Aus den aktiven Gegenstand-Verzeichnissen deiner aktiven Welt. (Reiter: Gegenstände)

   _Spielwelt (World)_: Aus den Kompendien, die als Teil deiner Welt erstellt wurden.

   _Module_: Aus den Kompendien die durch deine aktiven Module bereitgestellt werden.

   _System_: Aus den Kompendien, die mit diesem Spielsystem mitgeliefert werden.

4. Suche deine JSON-Datei auf deinem Computer, sobald die Datei gewählt wurde, wird der Name des Investigators angezeigt. Ebenfalls wird ein Charakterbild von "The Dhole's House" im Rahmen der JSON-Datei mit importiert.
5. Sobald die Schaltfläche importieren betätigt wird, wird ein Charakter für den Investigator erstellt und im "Imported Charakters" Verzeichnis des Figuren-Reiters abgelegt.

**Hinweis:** Standardmäßig wird das Charakterbild im Verzeichnis der Spielwelt im Unterordner "dhole-image" abgelegt. Dies kann in den Spieleinstellungen im Rahmen der Systemeinstellungen angepasst werden.
