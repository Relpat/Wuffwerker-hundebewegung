# Wuffwerker – technisches Neustart-Briefing

Stand: 31.10.2026

## 1. Problem
Seit v8 ist die visuelle Qualität schlechter geworden. Hals/Kopf wirken unnatürlich, die Übergänge von Kopf/Hals zum Rumpf und von Rute zu Kruppe sind sichtbar getrennt. Nachbesserungen mit Übermalungen lösten das Grundproblem nicht. Die bisherige Rückmeldung des Nutzers ist wichtiger als frühere Aussagen des Assistenten über vermeintlich erfolgreiche Tests.

## 2. Rücksetzpunkte
- **v7.5.1 – letzte überwiegend akzeptierte Grundlage für Beine, Rumpf und Bewegung:** `Wuffwerker-Rumpf-v7.5.1-Biomechanik.html`.
- **v6.6 – freigegebene Rutenlogik:** `Wuffwerker-PixiJS-Rutenhaltung-v6.6.html` (unverändert bewahren).
- **v8.0.3 – nur relativ bessere Kopf-/Halsposition, nicht final freigegeben:** `Wuffwerker-Kopf-Natuerliche-Haltung-v8.0.3.html`.
- **v9.0–v9.1 – visuell kaschierte Verbindungen:** kein geometrisch endgültiger Ansatz.
- **v10.0 – technischer experimenteller Rumpf-Hals-Skinning-Prototyp:** nicht als erfolgreiches Design behandeln; Beine, Rute und Schädel sind weiterhin separat.

## 3. Wichtigste technische Beobachtungen aus den Dateien
- v8 hat `drawHeadNeck` mit einer separaten `headGroup`, `neckFill` sowie eigenen Torso- und Beinmeshes eingeführt.
- v9.0/v9.1 setzen auf `drawBlendPatches`: zusätzliche übermalte Übergangsformen statt verschweißter Kanten.
- v10 implementiert `setupSkinBind`, `skinBoneTransforms` und `deformSkin` mit vier Gewichten pro Punkt und einer durchgehenden Rumpf-Hals-Mesh-Geometrie; dies ist ein Anfang, keine vollständige Haut.
- v10 berechnet die Bind-Pose im Animationsloop neu, wodurch die Architektur unnötig kompliziert und schwer prüfbar wird.
- Die eigenständigen HTML-Demos verwenden einen eingebauten Canvas2D-Kompatibilitätsrenderer. Das beweist nicht, dass sie in echter PixiJS-v8-Runtime identisch laufen.
- Tests auf JS-Fehler oder gültige Dreiecke sind keine Belege für anatomische Natürlichkeit oder nahtlose Silhouetten.

## 4. Verbindliches Ziel
Eine **anatomisch plausible Hunde-Silhouette in Seitenansicht**, gesteuert durch ein zentrales Knochensystem mit IK und gewichteter Hautverformung. Nicht durch Übermalungen zusammengesteckte Teile. In Stand und Bewegung sollen Hals/Brust und Kruppe/Rute ohne offene Spalten oder auffällige Nähte ineinander übergehen. Kopf-Hals-Verbindung muss anatomisch plausibel wirken, bevor weitere Details folgen.

## 5. Entwicklungsreihenfolge
1. **Referenz und Abnahmebild:** 2–4 klare Seitenfotos/Anatomieskizzen einer neutralen Hundefigur; feste Maßverhältnisse und gewünschte Hals-Kopf-Linie festlegen. Keine Fell-/Augen-/Ohren-Details während der Grundformprüfung.
2. **Skelett + Bind-Pose isolieren:** Einfache einfarbige Silhouette. Gelenke, Knochenlängen, Hierarchie, Kopf-Hals-Achse, Ruhepose; getrennt von Animation und Textur prüfen.
3. **Echte Geometrie:** Rumpf-Hals-Kopf-Übergang mit gemeinsamer Topologie bzw. abgestimmten, verschweißten Anschlussvertices; Rute-Kruppe ebenso. Wo überlappende Vorder-/Hinterbeine unvermeidbar sind, gemeinsame Bind-Position und Bone-Weights sowie korrekte Zeichenreihenfolge.
4. **Skinning nachvollziehbar:** Bind-Pose einmal pro Formänderung erstellen, nicht in jedem Animationsframe. Bone-Transforms pro Frame aktualisieren; Gewichte normieren.
5. **Abnahmeszenen:** Jeweils Screenshot in Stand, Gehen, Trab, Rennen; zusätzlich Beine kurz/lang, Kopf hoch/runter, Rute verschiedene Haltungen. Jeder neue Schritt muss gegen die akzeptierte Basis verglichen werden.
6. **Erst danach Details:** Felltextur, Ohren, Augen, Ausdruck und Bedienelemente.

## 6. Qualitäts-Gates (kein Versionssprung ohne Prüfung)
- Visuelle Kontrolle anhand festgelegter Referenzbilder, nicht nur fehlerfreie Konsole.
- In der Standpose keine sichtbaren Lücken/Ränder/abrupten Knicke an Kopf/Hals/Schulter und Kruppe/Rute.
- Beim Dehnen keine aufreißenden Übergänge; alle betroffenen Vertices bleiben endlich und alle Bone-Gewichte summieren sich zu 1.
- Änderungen werden getrennt entwickelt; akzeptierte Ganganimation und Rutenformen nicht ohne Grund umschreiben.
- Fehlschlag: Änderung zurücknehmen, Ursache dokumentieren, nicht mit einer zusätzlichen Zeichenfläche überdecken.

## 7. Für einen neuen Chat
Die wichtigsten Startdateien anhängen: v7.5.1 für Bewegungs-/Rumpfbasis, v6.6 für akzeptierte Rute, v10.0 als *technischer Versuch*, diese Briefing-Datei und mindestens eine visuelle Referenz für Kopf-Hals-Silhouette. Auftrag: "Beginne mit einer statischen anatomischen Grundpose in einer sauberen PixiJS-8-Architektur. Keine Textur, keine Übermalung, keine neue Animation, bevor die Silhouette bestätigt ist. Erkläre bei jedem Schritt, was tatsächlich verbunden ist und was separat bleibt." 
