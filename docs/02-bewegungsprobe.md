# Entwicklungsstufe 02 – Bewegung der durchgehenden Silhouette

Status: **Bewegungsprobe, nicht anatomisch freigegeben.**

## Eingebaut

- Standpose, Gehen, Trab, Laufen und Passgang, sowie Pause/Weiter, Geschwindigkeitsregler und Gelenkansicht.
- Vorläufige Zwei-Bein-Seitenansicht: Die **zwei sichtbaren** Beine erhalten zyklische Pfotenziele und feste Knochenlängen (Zweiknochen-IK). Die Zeit- und Phasenwerte stammen aus der akzeptierten Referenz v7.5.1, sind für die Seitenansicht aber reduziert.
- Ein einziger geschlossener Außenumriss, der für jede Pose neu berechnet wird. Keine zusätzlichen Übermal-Patches und keine separat aufgezeichneten Beinmeshes.
- Ruhepose bleibt unverändert. Hals/Kopf/Rücken und Rutenwurzel bleiben von Beinverformungen unberührt.
- Automatisierte Tests prüfen Endlichkeit, Kettenlängen, Kontinuität des Fußpfads, Formschluss und grobe Selbstüberschneidungen.

## Noch NICHT vorhanden

- Vollständiges Vierbein-Rig aus v7.5.1 mit getrennten Phasen für alle vier Füße. Die UI-Phasen unterscheiden vorläufig nur Vorder- und Hinterbein der sichtbaren Seite.
- Anatomisch freigegebene Gesamtbewegung, echte Rumpfrotation, Lauf-Galopp-Phasen, reales Ground-Contact-System.
- Gewichtet verschweißte Skinning-Topologie oder inverse Bind-Matrizen. Die gezeigte Silhouette nutzt eine einfache positionsbasierte Zwischenverformung.
- Die freigegebene Rutensteuerung v6.6 wurde nicht geändert oder neu implementiert; die neutrale Rute bleibt statisch.

## Referenz und Abnahme

Vor einem nächsten Versionssprung alle Phasenbilder ansehen und die Bewegung mit v7.5.1 vergleichen. Ein fehlerfreier Test belegt keine natürliche Anatomie. Historische Dateien in `reference/` bleiben unverändert. 
