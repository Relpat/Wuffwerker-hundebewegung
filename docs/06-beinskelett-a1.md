# Stufe A1 – Beinskelett nach Fischer & Lilje

**Status: zur Abnahme, zusammen mit A2 (gewichtetes Skinning, siehe unten).**

## Warum
Die Analyse vom 07.11.2026 (Projektordner `hundebewegung/rig-plan/analyse.md`) zeigte: Schulterblatt fehlte als Gelenk, Handwurzel und Mittelfuß waren starr, Schulter- und Hüftgelenk lagen auf gleicher Höhe. Dadurch waren nur sehr kurze Schritte (≈ 0,26 × Widerristhöhe) möglich.

## Was neu ist
- **Vorderbein:** Schulterblatt (Drehpunkt oben am Schulterblatt) → Oberarm → Unterarm → Mittelhand → Zehen. Schulterblatt und Unterarm bilden einen **Pantographen** (konstanter Winkelabstand), wie Fischer & Lilje (2011, Röntgenvideo, 327 Hunde, 32 Rassen) beschreiben.
- **Hinterbein:** Oberschenkel → Unterschenkel → Mittelfuß → Zehen; Oberschenkel und Mittelfuß bilden den hinteren Pantographen.
- Die dreigliedrige Kette wird exakt auf ein Zweiknochen-Problem zurückgeführt (`src/skeleton/limbs.js`); Längen und Pantographen-Winkel werden einmal aus der Bind-Pose berechnet, nicht pro Bild.
- **Pfoten:** In der Schwungphase klappt die Handwurzel ein (Gehen 70°, Trab 90°, Pass 75°, Laufen 100°), die Zehen krümmen sich. Pfote und Zehen können dabei nie unter den Boden.
- Schultergelenk liegt jetzt deutlich höher als das Hüftgelenk; Ellbogen auf Brustbodenhöhe.
- **Schritt-Vorschau** (`src/animation/preview.js`, Schalter „Große Schritte“): Gehen ≈ 1,0, Trab ≈ 1,5, Pass ≈ 1,2, Laufen ≈ 1,8 × Widerristhöhe je Zyklus. Die Stützphase liegt mittig unter Schulterblatt bzw. Hüfte. Die genauen Werte und ein echter Galopp kommen in A3.

## A2 – gewichtetes Skinning (`src/geometry/skin.js`)
- Die Bein-Bereiche der einen Kontur (vorn Befehle 15–21, hinten 23–35) hängen an den Knochen Oberarm, Unterarm, Mittelhand, Zehen bzw. Oberschenkel, Unterschenkel, Mittelfuß, Zehen sowie an einem „Rumpf“-Pseudoknochen.
- Gewichte: normierte inverse Abstände (Exponent 4) zu den Bind-Knochen, **einmal beim Laden** berechnet, Summe je Punkt = 1. Der Rumpf-Pseudoknochen trägt das bisherige Rumpf-/Kopf-Feld, deshalb keine Naht zwischen Bein und Körper.
- Pro Bild: starre Transformation je Knochen (Bind → aktuell), Punkt = gewichtete Mischung (Linear Blend Skinning). Die Höhenbänder sind entfallen.
- Ferne Beine: Pfoten falten sich in der Schwungphase kompakter (kein „Haken“), Ballen folgen Mittelhand/Mittelfuß.
- Vorderbein in der Schwungphase: Die Handwurzel hebt sich nur um die halbe Hubhöhe, der Rest kommt vom Einklappen (Gehen 100°, Trab 110°, Pass 100°, Laufen 120°). So wird der Ellbogen nicht in die Brust gezogen.
- Tests `tests/skin.test.js`: Gewichte normiert und endlich, Stand unverändert, mit großen Schritten keine Überschneidung der Kontur.

## Noch nicht
- „Laufen“ ist weiterhin der Bound aus v7.5.1, kein Hundegalopp (A3).

## Abnahme
- `node scripts/abnahme-a1.mjs` schreibt reine SVG-Bilder (ohne PixiJS) nach `docs/abnahme/a1/`: Stand und je 8 Phasen von Gehen, Trab, Laufen, Pass.
- Tests: `tests/limbs.test.js` (Bind-Pose exakt, Schulter über Hüfte, Schulterblatt-Anteil 24–34 %, Pantographen-Winkel konstant, Vorschau-Schritte erreichbar, nichts unter dem Boden, Handwurzel klappt im Trab ein).

## Quellen
- Fischer, M. S. & Lilje, K. E. (2011): Hunde in Bewegung. Kosmos. Kurzfassung: https://phys.org/news/2011-05-dogs-motion.html
- Maes, L. D. et al. (2008): Steady locomotion in dogs. J. Exp. Biol. 211, 138–149.
