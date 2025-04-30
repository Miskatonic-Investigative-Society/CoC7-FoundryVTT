<!--- This file is auto generated from module/manual/de/effects.md -->
# Effekte

Das System erlaubt die Erstellung von aktiven Effekten (Active Effects).
Ein aktiver Effekt wird die Charakteristik(en), Attribut(e), Fertigkeit(en) des Charakters modifizieren.
Effekte können als [Link](links.md) erstellt werden durch das Nutzen des [Link Erstellungswerkzeuges](link_creation_window.md) oder direkt im Charakterbogen durch das Klicken auf den `+` Knopf.

## Reiter Effekte

Effekte werden im Reiter Effekte auf dem Charakterbogen angezeigt.

![Reiter Effekte](../../assets/manual/effects/effects-tab.webp)

Effekte sind in 4 Kategorien einzugruppieren für den Spielercharakter:

- Status: Diese Effekte werden vom System genutzt und erstellt (Wundenstatus, liegend, verrückt, ...). Diese Effekte beinhalten keine Änderung.
- vorübergehend: Dies sind Effekte mit einer Zeitdauer.
- passiv: Dies sind permanente Effekte.
- inaktiv: Dies sind deaktivierte Effekte

Für NSCs/ Kreaturen werden Sie nur 2 Abschnitte sehen: aktiv und inaktive Effekte.
Wenn ein Effekt nicht inaktiv ist, werden die entsprechenden Änderungen auf den Akteur angewandt.

## Erstellung von Effekten

Sie können Effekte erstellen durch das Klicken auf den Hinzufügen Knopf.
Dies wird das Effekt erstellen Fenster öffnen.
Das Fenster hat 3 Reiter

### Reiter Details

![Reiter Details](../../assets/manual/effects/details-tab.webp)

### Reiter Dauer

![Reiter Dauer](../../assets/manual/effects/duration-tab.webp)

### Reiter Änderungen

![Reiter Änderungen](../../assets/manual/effects/changes-tab.webp)

Dieser letzte Reiter wird alle Änderungen am Charakterbogen beinhalten.

## Änderungen

Ein Effekt beinhaltet eine Liste von Änderungen. Jede Änderung muss mit dem entsprechenden Systempfad adressiert werden.
Die verfügbaren Änderungen sind:

- Charakteristiken:
	- Stärke:
		- system.characteristics.str.value
		- system.characteristics.str.bonusDice
	- Konstitution:
		- system.characteristics.con.value
		- system.characteristics.con.bonusDice
	- Größe:
		- system.characteristics.siz.value
		- system.characteristics.siz.bonusDice
	- Geschicklichkeit:
		- system.characteristics.dex.value
		- system.characteristics.dex.bonusDice
	- Aussehen:
		- system.characteristics.app.value
		- system.characteristics.app.bonusDice
	- Intelligenz:
		- system.characteristics.int.value
		- system.characteristics.int.bonusDice
	- Mana:
		- system.characteristics.pow.value
		- system.characteristics.pow.bonusDice
	- Bildung:
		- system.characteristics.edu.value
		- system.characteristics.edu.bonusDice
- Attribute:
	- Glück:
		- system.attribs.lck.value
		- system.attribs.lck.bonusDice
	- Geistige Stabilität:
		- system.attribs.san.value
		- system.attribs.san.bonusDice
	- Bewegungsweite:
		- system.attribs.mov.value
	- Statur:
		- system.attribs.build.value
	- Schadensbonus:
		- system.attribs.db.value
	- Panzerung:
		- system.attribs.armor.value
- Abgeleitete Attribute. Nur der Maximalwert dieser Attribute sollte modifiziert werden. Diese Änderungen werden angewandt, wenn alle anderen Änderungen gemacht wurden. Falls sich das Attribut im automatischen Modus befindet, wird es mit den vorherigen Änderungen der Charakteristiken neu berechnet, bevor sein Wert beeinflusst wird.
	- Trefferpunkte:
		- system.attribs.hp.max
	- Geistige Stabilität:
		- system.attribs.san.max
- Fertigkeiten. Fertigkeiten werden durch ihren vollständigen Namen identifiziert unter der Berücksichtigung der Groß- und Kleinschreibung!
	- Charm
		- system.skills.Charm.value
		- system.skills.Charm.bonusDice
	- Fighting (Brawl)
		- system.skills.Fighting (Brawl).value
		- system.skills.Fighting (Brawl).bonusDice
