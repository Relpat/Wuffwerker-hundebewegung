# Entwicklungsstufe 04 – Kopf, Hals und Rute

Status: **Bewegungsstudie zur visuellen Abnahme, keine anatomisch freigegebene Skinning-Lösung.**

## Implementiert

- Die bisherige einteilige geschlossene Körperkontur bleibt erhalten; keine separaten Hals-, Kopf- oder Rutenmeshes und keine Übermalungen.
- Hals und Kopf gleichen gangabhängige Winkel- und Höhenänderungen des Rumpfes aus. Die zervikale Rotation beginnt weich am Widerrist; eine zusätzliche kleine Rotation wirkt auf den Schädel. Die Schulter bleibt am vorhandenen Rumpf-IK-Anker. Eine anatomisch rigide Gelenkkette ist dies noch nicht.
- Der Rutenansatz wird weiter an den Becken-/Rumpfkoordinaten geführt. Eine zusätzliche Deformation arbeitet ausschließlich am vorhandenen Rutenabschnitt des **gleichen Außenumrisses**.
- Für die **natürliche / neutrale Rutenform** wurden die v6.6-Ausdrucksregeln übertragen: `calm`, `alert`, `happy`, `excited`, `unsure`, `fearful`, `tense`; Wurzelwinkel, Krümmungsziele, 3D-Segment-Wedeln, Taktfrequenzen, Biege- und Schwingphasen sowie die v6.6-Seitenprojektion. `auto` ordnet im Stand und bei Gehen/Trab/Laufen/Passgang einen Zustand zu. Die Referenzdatei bleibt unverändert.
- Die neue Seitenansicht verwendet die feste Grundkontur, nicht das alte v6.6-Ruten-Mesh. Die Segmente wurden an die Silhouettenlänge skaliert. Horizontale Verkürzung ist bei extrem abgesenkter Rute gedämpft, damit der 2D-Umriss nicht zurückfaltet. **Die numerischen Eingangsregeln folgen v6.6; die vollständige Render- und Mesh-Implementierung ist nicht portiert.**
- Bedienoberfläche: Kopf/Hals-Ausgleich ein/aus, Rutenbewegung ein/aus, Ausdruck auswählen. In der Standpose bleibt `auto` exakt statisch, ein manuell ausgewählter Ausdruck kann auch im Stand animiert werden.

## Einschränkungen

- Die sechs anderen v6.6-Rutenformen (`straight`, `sickle`, `curl`, `otter`, `plume`, `bob`) samt individueller Mesh-Topologie, Länge und Fülle fehlen hier noch.
- Seitliches Wedeln findet teilweise außerhalb der Seitenebene statt und erscheint darum schwach. Für die vollständige Prüfung ist eine Rückansicht erforderlich.
- Kopf/Hals ist eine parametrische Pose-Space-Deformation ohne echte Halswirbel-, Schulter- und Schädel-Bind-Matrizen.
- Vierbein-Rig, gewichtetes Skinning und endgültige anatomische Freigabe fehlen.
- Eine Rutenstellung allein erlaubt keine eindeutige Aussage über Gefühle; die Zustände sind Darstellungsparameter der Referenz.

## Qualitäts-Gates

1. Bei `Gehen`, `Trab` und `Laufen` den Kopf/Hals-Schalter betätigen; auf abrupte Kanten im Nacken und an der Kehle achten.
2. Bei `Stand` `Fröhlich`, `Aufgeregt` und `Ängstlich` auswählen. Die Rutenwurzel muss mit dem Rumpf verbunden bleiben.
3. `npm test` prüft alle Ausdruckszustände über sämtliche Bewegungsmodi auf endliche Punkte, genau einen geschlossenen Pfad, abgetastete Selbstüberschneidungen und Gelenkkonsistenz.
4. Erst nach visueller Beurteilung folgt die nächste Rigging-Stufe.
