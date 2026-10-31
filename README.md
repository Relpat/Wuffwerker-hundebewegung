# Wuffwerker – Hundebewegung

Technischer Neustart auf Basis freigegebener Referenzversionen (Stand 31.10.2026).

## Referenzen

Die Dateien unter `reference/` sind historische, **unverändert archivierte** HTML-Demos. Sie sind keine gemeinsame Implementierung und sollen nicht direkt überschrieben werden.

- `reference/v6.6/`: akzeptierte Rutenlogik.
- `reference/v7.5.1/`: letzte überwiegend akzeptierte Basis für Rumpf, Beine und Bewegung.
- `reference/v8.0.3/`: nur vergleichsweise bessere Kopf-/Halsposition, nicht final freigegeben.
- `reference/v10.0/`: experimenteller Skinning-Prototyp, noch nicht bereitgestellt.

Die technischen Ziele und Qualitätsprüfungen stehen in [`docs/Wuffwerker-Neustart-Briefing.md`](docs/Wuffwerker-Neustart-Briefing.md).

## Arbeitsprinzip

Zuerst statische, anatomisch plausible Seitenansicht mit überprüfbarer Topologie und Bind-Pose in einer echten PixiJS-8-Architektur; danach Skinning, IK und Bewegung. Keine optische Kaschierung von Anschlussfehlern durch Übermalungen. Der Hauptbranch bleibt bis zur visuellen Abnahme frei von ungeprüften Neuentwicklungen.
