# Wuffwerker – Hundebewegung

Technischer Neustart auf Basis der akzeptierten Referenzversionen (31.10.2026).

## Archivierte Referenzen (unverändert)

- `reference/v6.6/`: freigegebene Rutenlogik.
- `reference/v7.5.1/`: letzte überwiegend akzeptierte Grundlage für Rumpf, Beine, Bewegung.
- `reference/v8.0.3/`: Orientierung für Kopf/Hals, **nicht** final freigegeben.
- **v10.0 ist ausdrücklich ausgeschlossen**: fehlerhaftes Skinning wird nicht übernommen.

Die ausführlichen Ziele und Qualitäts-Gates stehen in [docs/Wuffwerker-Neustart-Briefing.md](docs/Wuffwerker-Neustart-Briefing.md). Das Briefing ist ein historischer Projektstand; die ausdrückliche Entscheidung, v10.0 nicht zu verwenden, hat Vorrang.

## Entwicklungsstufe 01 – statische Kontur

Der **aktuelle testbare Stand liegt immer auf `main`**; GitHub Pages wird aus `main` gebaut. Kurzlebige Entwicklungsbranches sind nur interne Zwischenstufen. Sie enthält eine echte PixiJS-v8-Anwendung, eine **einzige geschlossene** Seitenkontur und abschaltbare Skelett-Kontrollpunkte. Diese Geometrie ist noch **kein** gewichtetes Skinning-Mesh und wurde noch nicht visuell abgenommen.

Details und Grenzen: [docs/01-statische-grundpose.md](docs/01-statische-grundpose.md).

```sh
npm install
npm test
npm run dev
```

Danach die lokale Vite-Adresse im Browser öffnen. Die alten HTML-Demos bleiben unter `reference/` erhalten. Spätere IK-/Skinning-Arbeit beginnt erst nach visueller Bestätigung der statischen Silhouette.

## GitHub Pages Vorschau

Der [Pages-Workflow](.github/workflows/pages.yml) veröffentlicht **automatisch den aktuellen `main`-Branch**. `main` bedeutet testbarer Entwicklungsstand, nicht automatisch anatomisch freigegebene Endversion. Alte Revisionen bleiben in der Git-Historie und unveränderte Referenzdateien unter `reference/` erhalten.

Einmalige Aktivierung in den [Repository-Einstellungen](https://github.com/Relpat/Wuffwerker-hundebewegung/settings/pages): **Build and deployment → Source → GitHub Actions** auswählen. Falls der erste Workflow wegen fehlender Pages-Aktivierung fehlschlägt, den fehlgeschlagenen Lauf unter **Actions → Publish static pose to GitHub Pages** mit **Re-run all jobs** wiederholen.

Nach erfolgreichem Deploy ist die Vorschau unter
https://relpat.github.io/Wuffwerker-hundebewegung/
erreichbar. Bis zu einem erfolgreichen Workflow-Lauf ist das eine vorgesehene, **nicht bestätigte** URL.

Bei jedem Push auf `main` wird die Seite erneut gebaut. `npm test` muss erfolgreich sein, bevor ein Deployment erfolgt.

## Entwicklungsstufe 02 – animierte Bewegungsprobe

Auf `main` stehen nun **Stand, Gehen, Trab, Laufen und Passgang** sowie Pause/Weiter und ein Temposchieber bereit. Die Bewegungszyklen der zwei sichtbaren Beine übernehmen Phasen- und Trajektorien-Ideen aus dem freigegebenen `v7.5.1`-Referenzstand; die Gelenkketten haben feste Knochenlängen. Die Silhouette bleibt ein einziges geschlossenes Außenprofil. Dies ist noch **kein vollständiges Vierbein-Rig oder gewichtetes Skinning**. Näheres: [docs/02-bewegungsprobe.md](docs/02-bewegungsprobe.md).

## Entwicklungsstufe 03 – gekoppelte Rumpf- und Wirbelsäulenbewegung

In `main` folgt jetzt auch der Rumpf den Gangphasen. Becken/Hüfte und Schulter/Widerrist bewegen sich mit einem abgestimmten Höhenhub; die Rückenlinie wird sanft gebogen. Das gleiche Deformationsfeld beeinflusst die durchgehende Außenkontur und die Rumpf-Kontrollpunkte. Die sichtbaren Beinsegmente erhalten anschließend eine aktualisierte Zweiknochen-IK und behalten ihre Bodenkontaktziele.

Der Schalter **Rumpfbewegung** ermöglicht einen Vorher-Nachher-Vergleich ohne Änderung der Gangart. Die Standpose bleibt unverändert. Kopf/Hals und neutrale Rute werden nur passiv mitgeführt, nicht separat animiert. Das ist **noch kein echtes gewichtsgebundenes Skinning und kein Vierbein-Rig**.

Details und Grenzen: [docs/03-rumpf-wirbelsaeule.md](docs/03-rumpf-wirbelsaeule.md).

## Entwicklungsstufe 04 – Kopf, Hals und Rute

Die aktuelle Vorschau auf `main` bewegt Hals und Kopf passend zu den Gangphasen; die Rute folgt den **Ausdrucks- und Wedelparametern der natürlichen Rutenform aus v6.6**. Der einzelne, geschlossene Außenumriss bleibt erhalten. Neue Bedienelemente: **Kopf/Hals-Ausgleich**, **Rutenbewegung** und **Ruten-Ausdruck** (automatisch oder sieben wählbare Ausdrücke). Ein gewählter Ruten-Ausdruck lässt sich auch in `Stand` ansehen.

Die restlichen sechs speziellen Rutenformen aus v6.6, ein echtes Vierbein-Rig und gewichtetes Skinning fehlen weiterhin. Die v6.6-Originaldatei bleibt unverändert. Details: [docs/04-kopf-hals-rute.md](docs/04-kopf-hals-rute.md).

## Entwicklungsstufe 05 – vierphasiges Bein-System

Aus der genehmigten v7.5.1-Referenz wurden die vier Kontaktphasen für Gehen,
Trab, Laufen und Passgang übernommen. Zwei fernliegende Bein-Ketten werden
hinter dem weiterhin **einteiligen** äußeren Rumpf-/Kopf-/Hals-/Ruten-/Nahbein-
Umriss dargestellt. Die Checkbox **Fernliegende Beine** blendet sie für den
Vergleich ein oder aus; die Knochenanzeige umfasst alle vier Ketten.

Die Lauf-Schrittlänge bleibt vorläufig reduziert (100 statt 240 Pixel in v7.5.1),
damit die neuen IK-Längen erreicht werden. Das ist **kein vollständiges
gewichtetes Skinning** und noch keine anatomisch abgenommene Bewegung.

Details: [docs/05-vierbein-gangarten.md](docs/05-vierbein-gangarten.md).

## Korrektur 05.1 – fernliegende Beine in voller Größe

Die fernliegenden Vorder- und Hinterbeine haben jetzt **an die nahen Beine angeglichene Schaft- und Pfotenbreiten** und gleiche Ansatzhöhen. Die Knochenlängen waren bereits korrekt; die alte Zeichengeometrie ließ sie zu klein aussehen. Tiefenstaffelung erfolgt über Verdeckung und dezente Farbe, nicht durch Miniaturisierung. Der neue Proportionstest vergleicht Fußbreiten, Bodenkontakt und alle IK-Ketten; `docs/05-vierbein-gangarten.md` enthält die Details. Keine Änderungen an der bestehenden nahen Körperkontur.

## Stufe A1 – Beinskelett nach Fischer & Lilje

Schulterblatt als Drehpunkt des Vorderbeins, dreigliedrige Beine als Pantograph, einklappende Handwurzel und Zehen. Schalter **Große Schritte** zeigt die neuen Schrittlängen (Haut folgt erst mit A2, daher Skelett-Ansicht). Reine SVG-Abnahmebilder: `node scripts/abnahme-a1.mjs`. Details: [docs/06-beinskelett-a1.md](docs/06-beinskelett-a1.md).

## Stufe B1 – Ganzkörper-Rig nach Maßtabelle

Lenny (Lagotto, 45 cm Widerristhöhe = 278 px) bekommt ein Skelett für den ganzen Körper: Wirbelsäule, Hals, Schädel mit Kiefer, Becken, Brustbein und sechs Rutenglieder als eine Vorwärtskinematik, die Beine als Pantograph daran. Alle Knochenlängen stehen in cm in `src/skeleton/measures.js`, geprüft gegen den FCI-Standard 298 und die Beagle-Studie von Fischer et al. Die ganze Kontur wird gewichtet gehäutet; Gänge und Sitz laufen auf dem neuen Rig ohne Überschneidungen. Details: [docs/07-ganzkoerper-rig.md](docs/07-ganzkoerper-rig.md).

## Stufe G1 – Posen-Generator

Zehn Posen als Presets mit verständlichen Reglern statt handgesetzter Gelenke: Locker, Sitz, Platz, Pfote geben, Spielverbeugung, Schnüffeln, Starr, Angst, Wegsehen, Schlafen. `pose(name, anteil, änderungen)` aus `src/poses/presets.js` liefert eine Rig-Pose, `anteil` 0–1 ist zugleich der Übergang aus dem Stand. Abnahmebilder: `node scripts/abnahme-g1.mjs`. Details: [docs/08-posen-generator.md](docs/08-posen-generator.md).

## Stufe G2 – Lenny-Look

Alle Posen im Wuffwerk-Stil: lockiges Fell ohne Konturen, ferne Beine dunkler, Tiefen-Reihenfolge, Lennys Baukasten-Kopf mit Mimik je Pose. `src/render/lenny.js`, Bilder: `node scripts/lenny.mjs ../wuffwerk`. Details: [docs/09-lenny-look.md](docs/09-lenny-look.md).

## Stufe G4 – Posen-Generator im Browser

Seite `posen.html` (GitHub Pages: …/Wuffwerker-hundebewegung/posen.html): Pose wählen, Regler für Rumpf, Kopf, Rute und Mimik, Fell hell oder dunkel, Skelett zeigen, Übergang abspielen, SVG herunterladen und Werte kopieren. Der Kopf ist der Baukasten-Kopf von wuffwerker.de (`node scripts/sync-baukasten.mjs ../wuffwerk` übernimmt ihn nach `src/vendor/baukasten/`). Kein PixiJS, reines SVG.
