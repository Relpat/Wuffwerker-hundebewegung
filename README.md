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
