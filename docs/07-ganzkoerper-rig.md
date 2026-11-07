# Stufe B1 – Ganzkörper-Rig nach Maßtabelle (07.11.2026)

Lenny ist ein Lagotto Romagnolo mit **45 cm Widerristhöhe**. Auf der
Zeichenfläche entspricht das **278 px** (Boden y = 483, Widerrist-Haut y = 205),
also **1 cm ≈ 6,18 px**. Alle Knochen werden aus der Tabelle in
`src/skeleton/measures.js` berechnet, nicht mehr von Hand gesetzt.

## Maßtabelle

| Knochen | cm | px | Quelle / Prüfung |
|---|---|---|---|
| Schulterblatt | 13,0 | 80,3 | FCI ≤ 30 %, Beagle 28 % des Vorderbeins |
| Oberarm | 12,6 | 77,8 | FCI „so lang wie das Schulterblatt“, Fischer & Lilje ≈ 27 % |
| Unterarm (Elle/Speiche) | 15,0 | 92,7 | FCI ⅓ der Widerristhöhe |
| Vordermittelfuß | 5,2 | 32,1 | Skelettfoto, steht 75° (FCI 75–80°) |
| Zehen vorn | 4,9 | 30,3 | Skelettfoto |
| Oberschenkel | 14,0 | 86,5 | zwischen FCI (35 %) und Beagle-Studie |
| Unterschenkel | 14,5 | 89,6 | zwischen FCI (36 %) und Beagle-Studie |
| Sprunggelenk → Ballen | 8,7 | 53,8 | Sprunggelenk auf ≈ ¼ der Höhe |
| Zehen hinten | 5,0 | 30,9 | Skelettfoto |
| Kopf | 18,0 | 111 | FCI 40 % |
| Körperlänge | 47 | 290 | FCI „so lang wie hoch“ |

Winkel im Stand: Schulterblatt 55° zum Boden, Knie ≈ 132°, Sprunggelenk ≈ 144°
(FCI 130–135° bzw. ≈ 140°). Der Hintermittelfuß steht fast senkrecht unter der
Hüfte, wie im Standard beschrieben.

**Wichtig:** Die Prozentangaben im FCI-Standard sind Richtermaße am lebenden
Hund zwischen tastbaren Punkten, keine Knochenlängen. Wörtlich genommen hätte
das Hinterbein unter der Hüfte keinen Platz. Sie dienen deshalb nur als
Obergrenze. Die Knochenverhältnisse stammen aus der Beagle-Studie (Hunde mit
44–52 cm Widerristhöhe) und dem Skelettfoto.

## Skelett

- **Rumpf als Vorwärtskinematik** (`src/skeleton/rig.js`): Wurzel ist die
  Brustwirbelsäule (T8). Nach vorn: Widerrist → Halsansatz → Halsmitte →
  Hinterhaupt → Nase. Nach hinten: T13 → L4 → Lendenkreuz → Kreuzbein → 6
  Rutenglieder. Jede Drehung an einem Gelenk dreht alles dahinter mit; die
  Knochenlängen bleiben dabei immer gleich.
- **Starr angehängt:** Schulterblatt-Drehpunkt, Brustbein und Manubrium am
  Brustkorb; Hüftgelenk, Darmbein und Sitzbein am Becken; Kiefergelenk und Kinn
  am Schädel (Maul kann sich öffnen).
- **Beine** wie in A1 als Pantograph nach Fischer & Lilje, aufgehängt am
  bewegten Schulterblatt- bzw. Hüftpunkt.
- 30 Knochen auf der nahen Seite plus 9 Beinknochen auf der fernen Seite.

## Haut

Die ganze Kontur ist in Bereiche geteilt (Rute, Rücken, Hals, Kopf, Kiefer,
Kehle, Vorderbein, Bauch, Hinterbein, Rutenunterseite). Jeder Punkt hängt nur
an den Knochen seines Bereichs (`SKIN_REGIONS` in `src/geometry/skin.js`).
Der Sitzbeinhöcker hängt am Becken, damit er beim Schreiten nicht mit dem
Oberschenkel nach hinten wandert.

## Muskeln und Fell (07.11.2026, Patricks Wahl „Muskeln + 1,5 cm Fell“)

- **Halswirbelsäule tiefer:** C7 sitzt unten am Brusteingang, die Halswirbel
  laufen in der unteren Hälfte des Halses. Darüber liegen Nackenmuskeln und
  Nackenband, der Nacken ist voller.
- **Keule voller:** Rückseite des Oberschenkels (Sitzbeinmuskeln) und das Knie
  vorn bekommen mehr Masse.
- **Fell als eigene Schicht** (`src/render/coat.js`): 1,5 cm rundum, Regler
  „Fell“ 0–3 cm in der Werkstatt, Option `coat` in `poseSvg`. Das Fell wird
  gezeichnet, nicht gehäutet (Kontur mit doppelter Fellstärke umrandet), kann
  also in keiner Pose falten. Unter dem Boden wird es abgeschnitten.

## Sitz

Rumpf kippt 44° um die Schultern, Lende rundet sich, Vorderpfoten bleiben
etwas vor dem Brustbein, Ellbogen ≈ 130°. Korrekturen für tiefe Falten:
Ellbogen an die Brust, Brustbein bleibt vor den Vorderbeinen, Kehle glatt,
Flankenfalte zwischen Bauch und Knie, Oberschenkel-Rückseite vom
Sprunggelenk bis zum Sitzbeinhöcker. Keine Überschneidungen von 0 bis 1.

## Bekannte Grenzen

- Ein stark eingeklemmter Schwanz würde zwischen den Hinterbeinen
  verschwinden. Das kann eine einzelne Seitenkontur nicht zeigen, deshalb
  bleibt die Rute an der Rückseite der Oberschenkel (`TUCK_LIMIT` −10°).
- Beim großen „Laufen“-Schritt der Vorschau überlappen Vorder- und Hinterpfote
  kurz. Das ist eine echte Überdeckung zweier Beine, keine Faltung; der
  Galopp aus A3 ersetzt diesen Gang.

## Quellen

- FCI-Standard Nr. 298, Lagotto Romagnolo: https://fci.be/Nomenclature/Standards/298g08-en.pdf
- Fischer, Lilje et al.: Ontogenetic allometry of the Beagle: https://pmc.ncbi.nlm.nih.gov/articles/PMC4124762/
- Fischer & Lilje (2011): Hunde in Bewegung / Dogs in Motion (327 Hunde, 32 Rassen)
