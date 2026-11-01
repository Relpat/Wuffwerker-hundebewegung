# Entwicklungsstufe 05 – Vierbein-Gangarten

**Status: technischer Prototyp zur visuellen Abnahme, keine anatomische Freigabe.**

## Implementiert

- Vier unabhängig phasierte Gliedmaßen: `hindNear`, `frontNear`, `hindFar`, `frontFar`.
- Die `offsets` für Gehen/Trab/Laufen/Passgang stammen aus der bestätigten Referenz
  `reference/v7.5.1/Wuffwerker-Rumpf-v7.5.1-Biomechanik.html` (Kontaktphasen):
  - Gehen: Hinterbein nah 0, Vorderbein nah .75, Hinterbein fern .50, Vorderbein fern .25.
  - Trab: hinten nah + vorne fern 0; hinten fern + vorne nah .50.
  - Laufen: hintere Beine .000/.035, vordere Beine .515/.550.
  - Passgang: nahe Beine 0, ferne Beine .50.
- Die hohe Lauf-Schrittlänge der älteren Demo (240 Pixel) wurde bewusst **nicht**
  übernommen: der neue IK-Maßstab und Beinlängen erlauben hier derzeit nur 100.
- Alle vier Wurzeln folgen der Rumpfdeformation; Zweiknochen-IK arbeitet mit
  festen Längen. Hinterpfoten nutzen weiterhin den festen Hock-Pfoten-Versatz.
- Einblendbare fernliegende Beine sind als zwei eigene geschlossene Umrisse
  **hinter** die bestehende, einteilige Körper-/Hals-/Kopf-/Ruten-/Nahbein-
  Silhouette gelegt. Das ist natürliche Verdeckung, keine Übermalungs-Reparatur
  an einem gebrochenen Körperanschluss.
- Bestehende Kopf-, Hals-, Ruten- und Rumpfregler bleiben erhalten.

## Noch offen

- Kein 3D-Skinning, keine gewichtete gemeinsame Mesh-Topologie der Beine.
- Keine echte dreidimensionale Verdeckung; farbe/Abstände im Seitenbild dienen
  der Ablesbarkeit und müssen anatomisch beurteilt werden.
- Kein global mitlaufender Hund: `pawPath` hält die Stützpfote im zur
  virtuellen Vorwärtsbewegung relativen lokalen Koordinatensystem horizontal
  am Boden, nicht an einem über die Bildschirmfläche fortschreitenden Ort.
- Vor der nächsten Architektur-Stufe stehen anatomische Sichtprüfung,
  verbesserte Fußformen und Gelenk-/Bodenkontaktkorrekturen aus.

## Korrektur 05.1 – anatomische Größe der fernliegenden Beine

- **Fehlerursache:** Die IK-Ketten hatten bereits nominell dieselben Knochenlängen wie die nahen Beine. Die *sichtbaren Umrisse* waren aber viel zu schmal (besonders die Pfoten), und die verdeckten Abschnitte wirkten deshalb wie Miniaturbeine.
- Die fernliegenden Schaftbreiten sind jetzt an die nahen Beine angepasst. Die Neutralpose verwendet **volle Pfotenabdrücke von ca. 68 px vorne und 73 px hinten** statt der bisherigen kleinen Kappen (ca. 23 px beziehungsweise 20 px).
- Schulter und Hüfte liegen auf exakt denselben Höhen wie auf der nahen Körperseite; die horizontalen Versätze sind bewusst kleiner als 30 px. Die sichtbaren Standbein-Segmente haben weiterhin exakt dieselben Zweiknochen-IK-Längen.
- Der Abstand der Füße in der Seitenansicht wird nur für die Ablesbarkeit verwendet. Fernliegende Beine erscheinen durch **Zeichenreihenfolge und leicht abgedunkelte Füllung**, nicht durch proportional kleinere Anatomie.
- Regressionstest `tests/far-proportions.test.js` vergleicht Standpfotenbreiten, Bodenhöhe, Ansatzhöhen und die IK-Längen über alle Gangzyklen. Die ursprüngliche nahe Hundekontur bleibt unverändert.
- Weiterhin ein provisorisches Rig ohne gemeinsame Skinning-Topologie; keine bereits anatomisch freigegebene vollständige Hundesilhouette.
