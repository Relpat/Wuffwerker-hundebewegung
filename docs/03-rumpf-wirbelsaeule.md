# Entwicklungsstufe 03 – Rumpf und Wirbelsäule mit den Beinen koppeln

Status: **testbare Bewegungsprobe; anatomische Freigabe fehlt weiterhin**.

## Gegenüber Stufe 02

- Becken/Hüfte und Widerrist/Schulter folgen jetzt der Gangzeit. Daraus entstehen vertikale Schwerpunktbewegung und ein kleiner gegensinniger Schulter-/Beckenhub (Profilneigung).
- Die Wirbelsäulenlinie erhält eine weiche, räumlich begrenzte Biegung. Laufbewegung ist stärker ausgeprägt als Schritt und Trab.
- Hals, Kopf und statische Rutenform folgen ihren Ansatzpunkten **passiv**; eigene Kopf- oder Rutenanimation wird noch nicht vorgetäuscht.
- Dieselbe kontinuierliche Deformationsfunktion wirkt sowohl auf den durchgehenden Umriss als auch auf die Rumpf-Kontrollpunkte. Gelenke der zwei sichtbaren Beine werden danach per Zweiknochen-IK neu berechnet. Bodenkontakt in der Stützphase bleibt erhalten.
- Neue UI-Option „Rumpfbewegung“ schaltet den Rumpfeinfluss für den direkten Vorher-Nachher-Vergleich aus oder ein. Stand bleibt pixelidentisch zur Referenz Stufe 01.

## Herkunft und Grenzen

Die Kopplung übernimmt **Konzepte** aus `reference/v7.5.1` (zweitaktiger Höhenhub und lokalisierte Rückenbewegung), **nicht** die komplette akzeptierte Vierbein-Simulation. Die Amplituden sind vorsichtige Designparameter für den neuen Umriss. **Keine** Behauptung einer empirisch korrekten Hundekinematik oder echter Volumenerhaltung.

- Noch kein durchgängiges Vierbein-Skelett, Bind-Matrizen oder Weighted Skinning.
- Noch kein korrektes Wechselspiel aus vier Bodenkontakten, Rumpfrotation im Raum oder dynamischer Kopf-Gegenbewegung.
- Noch keine Übernahme der freigegebenen Rutenlogik v6.6.
- Der Umriss ist weiterhin nur ein geschlossener Bezier-Pfad, nicht ein verschweißtes Mesh mit physikalischer Materialkontinuität.

## Prüfungen

`npm test` kontrolliert zusätzlich zum alten Satz: Körperbewegung in jeder Gangart, nahtlose periodische Wiederholung, Bindung von Kontrollpunkten an dieselbe Feldfunktion, feste Beinlängen, erreichbare Pfotenziele, Standstütze auf dem Boden, keine neuen separaten Konturen und keine gesampelten Selbstüberschneidungen.

Visuelle Abnahme bleibt notwendig – insbesondere Stand-/Schwungübergänge sowie Rückenkrümmung beim Laufen. Tests ersetzen diese nicht.
