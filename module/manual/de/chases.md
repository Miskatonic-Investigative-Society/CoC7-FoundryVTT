# Erstellen einer neuen Verfolgungsjagd

Um eine neue Verfolgungsjagd anzulegen. Erstelle einen neuen Gegenstand vom Typ "Verfolgungsjagd" (Chase)

Nur der Spielleiter (Keeper) sollte Zugriff auf den Gegenstand haben.

Eine Verfolgungsjagd besteht aus einer Abfolge von Schauplätzen. Jeder Ort kann durch ein Hindernis (Barriere oder Hindernis) getrennt sein.

Ein Hindernis wird immer überwunden, aber wenn die Probe nicht bestanden wird, wird die Figur langsamer und/oder nimmt schaden.

Eine Barriere hält derweil eine Figur immer so lange auf, bis sie mit einer erfolgreichen Probe überwunden oder zerstört wird.

![](../../../assets/manual/chases/new_chase.webp)

Eine Verfolgungsjagd unterteilt sich in drei Teile.

- Eine Kopfzeile in der du die Informationen zur gegenwärtigen Lokalität siehst, wenn eine Verfolgungsjagd gestartet wurde
- Der "Setup"-Reiter der Verfolgungsjagd: Dieser ermöglicht es die Parameter für die Verfolgungsjagd einzustellen und zu verfolgen.
- Die Teilnehmer Liste, in der festgelegt werden kann, welche Teilnehmer an der Verfolgungsjagd mitmachen. Dieser Reiter funktioniert nicht mehr, wenn die Verfolgungsjagd gestartet wurde.

# Einen Teilnehmer hinzufügen

Um einen Teilnehmer hinzuzufügen muss das "Plus"-Symbol in der Teilnehmerliste betätigt werden oder alternativ die Figur oder ihre Spielfigur (Token) hineingezogen werden.

Hierbei ist zu erwähnen, dass es nicht nötig ist, dass ein Teilnehmer mit einer Figur verknüpft ist. Das ermöglicht es eine Verfolgungsjagd schnell einzurichten und gegebenenfalls jemanden spontan hinzuzufügen.

Um der Verfolgungsjagd eine Spielfigur/Token hinzufügen zu können, wurden den Charakter- und NPC-Bögen ein paar Kontrollsymbole hinzugefügt:

![](../../../assets/manual/chases/new_controls.webp)

Diese Symbole geben folgenden weiteren Informationen über die Spielfiguren:

1. Zeigt an, dass die Spielfigur eine Instanz der Spielfigur ist.
2. Zeigt an, dass die Daten der Spielfigur nicht mit ihrem Charakterbogen fest verbunden sind. Jede Instanz hat ihre eigenen Eigenschaften und Parameter.
3. Zeigt an, dass diese Spielfigur einen verknüpften Token besitzt. **Du kannst diesen einfach in die Teilnehmerliste der Verfolgungsjagd hineinziehen.**
4. Zeigt an, dass die Spielfigur mit einer Figur/Charakterbogen aus dem Akteure-Seitenleiste verlinkt ist.

Hier können Sie Ihren Teilnehmer einrichten. Wenn Sie eine Figur aus der Seitenleiste „Akteure“ ziehen, werden die Details festgelegt. Beachten Sie, dass Sie eine andere Initiative und Geschwindigkeitsprüfung wählen können. Dies ist kein Standard im CoC, ermöglicht aber ungewöhnliche Verfolgungsjagden (futuristische Matrix-Verfolgungsjagd, Traumland-Verfolgungsjagd...)

![](../../../assets/manual/chases/new_participant_drag.webp)

1. Das Fragezeichen lässt sich auf eine Spielfigur (Token) ziehen und übernimmt damit die Charakterdetails der Spielfigur.

Sobald eine Spielfigur oder Akteur hineingezogen wurde, kann der Teilnehmer eingerichtet werden.

![](../../../assets/manual/chases/new_participant_setup.webp)

1. Durch das Betätigen dieser Schaltfläche kann festgelegt werden, ob der Teilnehmer ein Verfolger oder Gejagter ist.
2. Das Betätigen dieses Würfels führt eine Geschwindigkeitsprobe aus. Hinweis! Wenn über diese Schaltfläche die Probe gestartet wird, kommt es zu keiner Würfelkarte im Chat und Spieler werden auch nicht entsprechend angefragt, eine Probe auszuwürfeln. Sie eignet sich also vor allem für NPCs/Kreaturen oder wenn der Spielleiter (Keeper) selbstständig die Probe veranlassen möchte.

# Teilnehmerliste

![](../../../assets/manual/chases/participant_list.webp)

In dieser Ansicht zeigt sich nun die Teilnehmerliste für die Verfolgungsjagd.

1. Die Schaltfläche löst eine Verfolgungsjagd Probe aus. In diesem Fall wird eine Würfelkarte im Chat für den entsprechenden Teilnehmer und den damit verbundenen Spieler erstellt. Wenn Shift bei der Betätigung gehalten wird, wird die Karte direkt ausgewürfelt.
2. Diese Schaltfläche erlaubt es einen Teilnehmer aus der Verfolgungsjagd zu entfernen oder wenn eine Geschwindigkeitsprobe durchgeführt wurde diese zurückzusetzen.

![](../../../assets/manual/chases/participant_list_2.webp)

1. Die Würfelkarte muss noch durch den entsprechenden Verantwortlichen betätigt werden.
2. Die Geschwindigkeitsprobe wurde durchgeführt. Mit einem Klick hierauf, lassen sich nähere Informationen zum Ergebnis der Probe anzeigen.
3. Diese Schaltfläche erlaubt es die Probe zurückzusetzen.

![](../../../assets/manual/chases/roll_card.webp)

# Verfolgungsjagd einrichten

![](../../../assets/manual/chases/chase_init.webp)

Um eine Verfolgungsjagd einzurichten ist es nötig erstmal die Anzahl an vorgesehenen Schauplätzen zu festzulegen und damit die Jagd zu initialisieren.

![](../../../assets/manual/chases/chase_initialized.webp)

Die Verfolgungsjagd wurde initialisiert, nun kannst du weitere Optionen anpassen. Schauplätze in weißer Farbe sind die Start-Schauplätze und können nicht angepasst werden.

1. Dies ist die Verfolgungsstrecke, die weißen Schauplätze sind Startorte. Die Schauplätze in grau stellen die echten Schauplätze der Verfolgungsjagd dar.
2. Wenn diese Option aktiviert ist, werden auch Teilnehmer in die Jagd integriert, die eigentlich laut Regelwerk fliehen konnten.
3. Wenn diese Option aktiviert ist, werden auch Teilnehmer berücksichtigt die eigentlich zu langsam sind um fliehen zu können.
4. Dies gibt an, wie viele Schauplätze zwischen dem langsamsten Gejagten und dem schnellsten Verfolger liegen.
5. Hiermit wird festgelegt, auf welcher Position der schnellste Gejagte startet. Position 0 liegt direkt vor dem Startpunkt der Verfolgungsjagd. Position 1 ist der Startpunkt. Position -1 ist ein Schauplatz vor dem Start.
6. Dadurch werden ein Token animiert, wenn es sich an einen neuen Ort bewegt.

# Schauplätze einrichten

Während der Einrichtung einer Verfolgungsjagd können Schauplätze ausgewählt und angepasst werden.

Weiße Schauplätze können nicht während der Einrichtung angepasst werden.

Um einen Schauplatz anzupassen, muss dieser angeklickt werden. Dies zeigt die Details zum Schauplatz in der Kopfzeile an.

![](../../../assets/manual/chases/setting_locations_1.webp)

1. Diese Schaltfläche erlaubt es einen Teilnehmer hinzuzufügen. Wenn eine Verfolgungsjagd gestartet wurde, werden die Teilnehmer an dieser Position sein. Wenn die Verfolgungjagd noch nicht gestartet wurde, befinden sich die neuen Teilnehmer weiterhin auf den Startfeldern.
2. Diese Schaltfläche entfernt einen Schauplatz, wenn sich gegenwärtig kein Teilnehmer auf ihm befindet.
3. Du kannst die Pinnadel greifen und auf eine Szene ziehen. Damit werden die Koordinaten für diese Position dem Schauplatz zugeordnet. Eine rote Pinnadel zeigt an, dass Koordinaten gesetzt wurden. Ein Rechtsklick setzt die Koordinaten für die Szene zurück. Wenn Koordinaten gesetzt wurden und ein Teilnehmer mit verknüpften Token diese betritt, wird er zu diesem Schauplatz bewegt.
4. Füge einen neuen Schauplatz hinzu.
5. Aktiviere den Schauplatz

# Einrichten von Hindernissen und Barrieren

Hindernisse können vor und nach einem Schauplatz eingefügt werden. Du kannst Hindernisse bereits vorbereiten und auch mit einem Namen benennen. Hierbei kann eine Fertigkeit mit dem Hindernis verknüpft werden und auch die zugehörigen Strafen, wenn diese nicht geschafft werden.

![](../../../assets/manual/chases/setting_locations_2.webp)

1. Schaden den die Barriere nimmt.
2. Lebenspunkte der Barriere
3. Kosten von Bewegungsaktionen, wenn die Probe nicht geschafft wird.
4. Fertigkeit die verwendet wird, um das Hindernis zu überwinden. Rote Schrift zeigt, dass der Charakter die Fertigkeit nicht besitzt.

# Zur Sache kommen...

"Zur Sache kommen" bedeutet, dass die Verfolgungsjagd gestartet wird. Wenn nicht alle Teilnehmer bereits eine Geschwindigkeitsprobe abgelegt haben, wird hierbei eine Warnung ausgegeben und die Jagd kann nicht gestartet werden.

![](../../../assets/manual/chases/cut_to_the_chase_1.webp)

1. Initiative Tracker. Der aktive Teilnehmer wird in orange hervorgehoben.
2. Der Verfolgungsjagd Tracker. Zeigt den aktiven Schauplatz und die Teilnehmer. Du kannst Teilnehmer frei hin und her bewegen auf der Verfolgungstrecke. Du kannst auch einen neuen Charakter direkt auf die Strecke ziehen, wodurch das Fenster sich öffnen wird, mit dem ein Teilnehmer hinzugefügt werden kann. In manchen Fällen (beispielsweise, wenn ein neuer Gejagter langsamer ist als der langsamste Teilnehmer), werden alle Bewegungskationen neu berechnet und zugewiesen.
3. Eine Barriere.
4. Ein Hindernis.

# Ablauf der Hindernisbeseitigung

![](../../../assets/manual/chases/cut_to_the_chase_2.webp)

1. Wenn der aktive Teilnehmer vor einem Hindernis steht, können Sie den Hindernisauflösungsfluss auslösen, indem Sie darauf klicken. Dadurch wird eine Chat-Karte geöffnet, auf der Spielleiter und Spieler interagieren können, um das Hindernis zu überwinden. Alle Änderungen, die an der Karte vorgenommen werden, können am Ende des Ablaufs auf das Hindernis in der Verfolgungsjagd übertragen werden.

Wie folgt ein kleines Beispiel für einen solchen Ablauf:

![](../../../assets/manual/chases/obstalce_flow_1.webp)
![](../../../assets/manual/chases/obstalce_flow_2.webp)
![](../../../assets/manual/chases/obstalce_flow_3.webp)
![](../../../assets/manual/chases/obstalce_flow_4.webp)

Wenn der Ablauf abgeschlossen ist, werden alle Änderungen in die Verfolgungsjagd eingebunden.

![](../../../assets/manual/chases/cut_to_the_chase_3.webp)

Wenn alle Spieler ihre Bewegungsaktionen ausgeführt haben, ist die Runde beendet. Mit einem Klick auf nächste Runde kann die Jagd fortgesetzt werden.

# Teilnehmer kontrollieren

![](../../../assets/manual/chases/participant_controls.webp)

Du kannst einen Teilnehmer anpassen oder bewegen, indem du die Kontrollschaltflächen auf seiner Karte verwendest.

1. Diese drei Zeichen ermöglichen es den Teilnehmer zu löschen, modifizieren oder aktivieren.
2. Bewegungsaktionen. Gelbe Symbole sind verfügbar. Graue wurden verwendet. Rote sind Defizite aus vorangegangenen Runden.
3. Hiermit kann der Spieler Bonuswürfel erhalten oder seine Waffe ziehen.
4. Diese Schaltflächen erlauben es die Bewegungsaktionen zu erhöhen oder zu reduzieren.
5. Bewegungsaktionen einsetzen: Mit diesen Schaltflächen kann der Teilnehmer seine Bewegungsaktionen einsetzen. Er kann sich vorwärts oder rückwärts bewegen. Ebenfalls kann ein Verbündeter unterstützt werden mit einem Bonuswürfel oder der Teilnehmer kann selbst vorsichtig voranschreiten und damit ebenfalls einen Bonuswürfel sich verdienen.
