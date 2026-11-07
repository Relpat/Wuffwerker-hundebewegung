# Stufe G1 – Posen-Generator (07.11.2026)

Statt Gelenke von Hand zu setzen, beschreibt eine Pose nur noch ein paar
verständliche Werte. `src/poses/generator.js` macht daraus eine vollständige
Rig-Pose (dieselbe Form wie `poseAt` und `sitPose`), Haut, ferne Beine und der
SVG-Export funktionieren damit unverändert.

## Benutzung

```js
import { pose } from './src/poses/presets.js';
pose('platz');                         // fertige Pose
pose('platz', 0.5);                    // halb hingelegt (Übergang 0 … 1)
pose('angst', 1, { rute: 'happy' });   // Preset mit geänderten Werten
```

## Presets

| Name | Pose | Gruppe |
|---|---|---|
| `locker` | Locker stehen | Grundposen |
| `sitz` | Sitz (die abgenommene Sitz-Pose aus A2.3) | Grundposen |
| `platz` | Sphinx-Platz: Brust und Ellbogen am Boden | Grundposen |
| `pfote` | Pfote geben aus dem Sitz | Tricks |
| `spielverbeugung` | Vorne tief, Po hoch, Rute oben | Körpersprache |
| `schnueffeln` | Nase am Boden | Körpersprache |
| `starr` | Steif, Gewicht vorn, Kopf und Rute hoch | Körpersprache |
| `angst` | Geduckt, gebeugte Beine, Gewicht hinten, Rute eingeklemmt | Körpersprache |
| `wegsehen` | Kopf abgewandt (zeigt der Lenny-Kopf in G2) | Körpersprache |
| `schlafen` | Platz, Kopf auf den Pfoten (Augen zu in G2) | Ruhe |

## Regler

| Bereich | Wert | Bedeutung |
|---|---|---|
| `rumpf` | `vorn`, `hinten` | Höhe von Schulterblatt-Drehpunkt und Hüfte in px (+ = höher). Rumpflage und Neigung werden daraus gelöst. |
| | `vor` | Schulter nach vorn (+) oder hinten (−), Gewichtsverlagerung |
| | `lende`, `ruecken`, `becken` | Beugung von Lende, Brust-/Lendenwirbelsäule und Becken in Grad |
| `kopf` | `hals`, `kopf` | Hals und Schädel in Grad (+ = nach unten); der Hals behält seine Haltung, wenn sich der Rumpf neigt |
| | `maul` | Maul öffnen in Grad |
| `rute` | Name oder 6 Winkel | Rutenausdrücke aus Stufe 04 (`calm`, `happy`, `fearful` …) oder Winkel je Glied |
| `beine` | `vorn`, `hinten`, `vornFern`, `hintenFern` | je Bein: `{ pfote: [dx, dy] }` (IK zum Ziel), `{ vorPivot, y }` (Pfote vor dem Drehpunkt) oder `{ winkel: [...] }` (Knochenrichtungen, für Unterarm am Boden) |
| `darstellung` | `mimik`, `kopfZurueck` | Hinweise für den Lenny-Look (G2) |

## Prüfungen (`tests/generator.test.js`)

- Jedes Preset bei Übergang 0 ist exakt der Stand.
- Alle Knochen behalten ihre Länge, alle IK-Ziele werden erreicht, beidseitig.
- Stehende Posen haben alle vier Pfoten am Boden, nichts sinkt in den Boden.
- Jede Pose zeigt, was sie heißt (z. B. Platz: Brust und Ellbogen am Boden,
  Unterarm vorn am Boden; Pfote: eine Pfote hoch, die andere unten; Angst:
  tief, Gewicht hinten, Rute unten).
- Der Umriss bleibt in jedem Schritt jedes Übergangs eine geschlossene Linie
  ohne Überkreuzung (Falten an Ellbogen und Flanke glätten Korrekturen wie im Sitz).

## Abnahmebilder

`node scripts/abnahme-g1.mjs` schreibt `docs/abnahme/g1/<name>.svg` und
`<name>-skelett.svg`.

## Grenzen

- Übergänge sind Überblendungen vom Stand aus, keine echten Bewegungsabläufe
  (ein Hund legt sich z. B. meist über den Sitz hin). Abläufe kommen mit der App.
- In der Seitenansicht verschmelzen im Platz die nahen Unterarme mit der Brust;
  der Lenny-Look (G2) setzt die nahen Beine farblich ab.
