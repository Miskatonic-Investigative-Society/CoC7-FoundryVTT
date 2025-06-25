# Links

- Links sind eine Möglichkeit für den Spielleiter eine Probe anzufordern (Charakteristik, Attribut, Fertigkeit, Stabilitätsverlust, Waffe).
- Links können aktive Effekte beinhalten.
- Links sind im Chatprotokoll erstellt. Wenn Sie auf einen Link klicken wird dies eine Probe auslösen für Ihre(n) kontrollierten/ personifizierten Charakter(e).
- Links können in jedem Editor eingefügt werden, hauptsächlich in Journaleinträgen.
- Links können auf 5 Arten erstellt werden:
	- Durch manuelles schreiben (lesen Sie hierzu die Einzelheiten weiter unten).
	- Durch Drucken der STRG Tasten + das Klicken auf ein Bogenelement (Charakteristik, Attribut, Fertigkeit, Stabilitätsverlust).
	- Durch das Ziehen eines Bogenelements (Charakteristik, Attribut, Fertigkeit (+STRG)) in einen Editor (Journaleintrag).
	- Durch STRG + Ziehen eines Items (Fertigkeit oder Waffe) von einem Kompendium oder einem Item-Verzeichnis in einen Editor. Wenn ein Link mit dieser Methode erstellt und vom Spielleiter verwendet wird, werden Sie aufgefordert die Waffe/ Fertigkeit zu erstellen, falls der kontrollierte Charakter diese nicht besitzt.
	- Durch das Benutzen des im System enthaltenen Kompendiums von Lozalojo.
- Links können vom Chat in einen Editor gezogen werden.
- Wenn ein Link erstellt wird, wird sich das Auswahlfenster Schwierigkeit/ Strafe öffnen. Halten Sie die Umschalttaste um dieses Verhalten zu überspringen.
- Wenn ein Link erstellt wird, wird der Würfelmodus Probe sein. Falls der Würfelmodus auf 'blinder Spielleiterwurf' gesetzt ist, wird der Link als 'blind' erstellt.
- Wenn ein Link erstellt wird mit einer Schwierigkeit und einer Strafe, wird das Auswahlfenster Schwierigkeit/ Strafe sich nicht öffnen.
- Wenn ein Link erstellt wird mit weder einer Schwierigkeit noch einer Strafe, wird sich das Auswahlfenster Schwierigkeit/ Strafe öffnen. Das Halten der Umschalttaste wird den Würfelwurf beschleunigen (reguläre Schwierigkeit/ keine Strafe).

## Links schreiben

- Links sollten geschrieben werden durch die Nutzung des [Link Erstellungswerkzeuges](link_creation_window.md). Das Link Erstellungsfenster ist ein Werkzeug für die Spielleitung. Es befindet sich in der linken Seitenleiste.

Links für Chatnachrichten und Bogeneditoren (NSC, Journaleinträge, ...) haben folgendes Format: `@coc7.TYPE_OF_REQUEST[OPTION]{TEXT_TO_DISPLAY}`

- `TYPE_OF_REQUEST`
	- `sanloss`: löst eine geistige Stabilitätsprobe aus, bei Misserfolg wird vorgeschlagen die entsprechende geistige Stabilität abzuziehen.
	- `check`: wird eine Probe auslösen abhängig von den Optionen.
	- `item`: wird die Benutzung einer Waffe auslösen. Nur Items vom Typ Waffe können ausgelöst werden.
- `OPTIONS: []` = optional, standardmäßig leer
	- `sanloss`:
		- `sanMax`: maximal verlorene geistige Stabilität
		- `sanMin`: minimal verlorene geistige Stabilität
	- `check`:
		- `type`: Art der Probe ( `characteristic`, `skill`, `attrib`).
		- `name`: Name der Fertigkeit/ Charakteristik/ des Attributs.
		- [`blind`]: wird eine blinde Probe erzwingen, ist dies nicht der Fall, hängt die Probe von Ihrem gewählten Würfelmodus ab.
	- all:
		- [`difficutly`]: `?` (blind), `0` (regulär), `+` (schwierig), `++` (extrem), `+++` (kritisch).
		- [`modifier`]: `-x` (x, entspricht der Anzahl der Strafwürfel), `+x` (x, entspricht der Anzahl der Bonuswürfel), `0` (kein Modifikator).
		- [`icon`]: Icon, welches verwendet werden soll ([font awesome](https://fontawesome.com/icons), `fas fa-dice`).
- `TEXT_TO_DISPLAY`: anzuzeigender Name, dies ist optional.

### Beispiele

| Link                                                                                                    | Ergebnis                                                                          |
|---------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `@coc7.sanloss[sanMax:1D6,sanMin:1,difficulty:++,modifier:-1]`                                          | {schwierige Probe geistige Stabilität (-1) 1/1D6}                                 |
| `@coc7.check[type:charac,name:STR,difficulty:+,modifier:-1]`                                            | {Schwierige Stärkeprobe (-1)}                                                     |
| `@coc7.check[type:attrib,name:lck,difficulty:+,modifier:-1]`                                            | {Schwierige Glücksprobe (-1)}                                                     |
| `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,difficulty:+,modifier:-1]` | {Schwierige Anthropologieprobe (-1)} (mit Icon)                                   |
| `@coc7.sanloss[sanMax:1D6,sanMin:1]`                                                                    | {Probe geistige Stabilität 1/1D6} (ohne Name, Schwierigkeit und ohne Modifikator) |
| `@coc7.check[type:skill,icon:fas fa-arrow-alt-circle-right,name:anthropology,modifier:+1]`              | {Anthropologieprobe (+1)} (mit Icon, ohne Name, Schwierigkeit, mit Bonuswürfel)   |

### Links benutzen

- Sie können Links Ziehen und Ablegen vom Chat in Bögen, bzw. zwischen Bögen.
- Sie können einen Link direkt auf ein Token Ziehen und Ablegen.
- Sie können Items und Fertigkeiten in einen Journaleintrag Ziehen und Ablegen während Sie STRG halten, dies wird die entsprechende Probe mit regulärer Schwierigkeit und ohne Modifikator (0) erstellen.
- Sie können einen Link im Chat erstellen durch das Halten von STRG und dem Klicken auf einen entsprechenden Charakterbogeneintrag (SC/ NSC/ Kreatur) entsprechend Charakteristik/ Glück/ geistige Stabilität/ Kompetenz/ Waffe/ Stabilitätsverlust.
	- Es wird sich das Auswahlfenster öffnen für Schwierigkeit/ Strafe. Das Klicken auf den erstellten Link wird die Probe mit allen Parametern auslösen.
	- Das zusätzliche Halten der Umschalttaste wird das Auswahlfenster Schwierigkeit/ Strafe nicht öffnen. Das Klicken auf den erstellten Link wird das Auswahlfenster Schwierigkeit/ Strafe öffnen und danach die Probe auslösen.
