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
