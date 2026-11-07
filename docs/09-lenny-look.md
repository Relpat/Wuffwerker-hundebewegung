# Stufe G2 – Lenny-Look und SVG-Export (07.11.2026)

`src/render/lenny.js` zeichnet jede Rig-Pose im Wuffwerk-Bildstil:

- **Keine Konturen.** Nur Flächen; Tiefe entsteht durch Reihenfolge und Farbe.
- **Lockiges Fell** mit derselben Wolkenkante wie Lennys Kopf auf
  wuffwerker.de (`src/render/formen.js` ist eine 1:1-Kopie von `wolke` aus
  `site/illustrationen/formen.mjs`, ein Test vergleicht die Ausgabe).
- **Tiefen-Reihenfolge:** Schatten → ferne Beine (dunkleres Fell, gleiche
  Größe) → Körper mit nahen Beinen → weicher Schatten hinter den nahen
  Unterbeinen (nur im Körper, blendet nach oben aus, keine Linie) → Kopf.
- **Kopf A:** Lennys Baukasten-Kopf im Halbprofil mit Mimik und Apricot-Ohr.
  `lennyLayers` liefert dafür nur den Ankerpunkt (`kopf: {x, y, dreh, s,
  spiegeln, mimik}`), gezeichnet wird er von der Website (`bausteine.lenny`).
  Ohne Website gibt es einen einfachen Ersatzkopf.
- **Mimik je Pose:** locker/sitz/platz freundlich, pfote/spielverbeugung
  freude, schnueffeln konzentriert, starr starr, angst angst, wegsehen
  wegsehen (Kopf über die Schulter nach hinten), schlafen schlafen.
  Jede Pose kann sie mit `darstellung: { mimik }` ändern.
- **Zweiter Hund:** `farben: DUNKEL_FARBEN` wie Baustein `hund` fell „dunkel“.

## Export

`lennyLayers(pose)` gibt reine Daten zurück (Pfade, Farben, Clip-Hinweise und
den Kopf-Anker). Daraus baut G3 die Datei für den Baukasten der Website.

`node scripts/lenny.mjs ../wuffwerk` schreibt `docs/abnahme/g2/<name>.svg`
mit dem echten Baukasten-Kopf (ohne Pfad mit Ersatzkopf).
