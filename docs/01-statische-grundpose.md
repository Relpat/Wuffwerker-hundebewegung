# Entwicklungsstufe 01 – statische Grundpose

Stand: 31.10.2026. **Entwurf, noch nicht visuell freigegeben.**

## Bereits umgesetzt

- Echte PixiJS-v8-Anwendung (ES Modules, Vite). Kein Canvas2D-Kompatibilitätsrenderer.
- Eine geschlossene Bézier-Kontur für sichtbare Seitenansicht mit neutraler Rute, Rumpf, Hals, Kopf und den zwei sichtbaren Beinen. Die Kontur wird **einmal** aufgebaut; keine Übermalungs-Patches.
- Statische Kontrollpunkte und verbundene Leitlinien zum Prüfen der Ruhepose, ein- und ausblendbar.
- Kein Ticker, keine Animation, kein Skinning; Geometrie liegt in neutralen lokalen Koordinaten.
- Automatische Tests für endliche Koordinaten, geschlossenen Pfad, Fläche, fehlende Selbstüberschneidung (abgetastet) und Landmarkenverweise.

## Noch NICHT umgesetzt bzw. nachgewiesen

- Noch kein tatsächliches, gewichtetes *Skinned Mesh*, kein Bone-Hierarchie-/Inverse-Bind-Matrix-System, keine IK.
- Noch keine verdeckten Vorder-/Hinterbeine; in Seitenansicht sind nur zwei äußere Beine gezeichnet.
- Die Rute in der Kontur ist lediglich eine **neutrale statische Form**. Die freigegebene Rutenlogik aus v6.6 wurde nicht portiert oder geändert.
- Keine Ohren, Augen, Fell oder weiteren Details. Kopf-/Hals-Anatomie ist eine erste prüfbare Hypothese, nicht abschließend bestätigt.
- Keine tatsächliche PixiJS-Browser-Render- oder Build-Abnahme in dieser Entwicklungsumgebung; die statische SVG-Kontur wurde separat begutachtet. Quelltext und Node-Tests wurden geprüft.

## Qualitätskontrolle vor dem nächsten Schritt

1. Standpose visuell gegen Seitenansicht eines neutralen Hundes prüfen, besonders Oberhals / Hinterhaupt, Kehlansatz / Vorbrust, Hüfte / Rutenwurzel und Hinterlauf.
2. Nur die Kontur korrigieren, bis die Proportionen akzeptiert sind. Keine Versteck-Patches.
3. Danach Gelenk-Hierarchie und reale gemeinsame Mesh-Topologie entwickeln; erst danach Weighted Skinning und IK.

## Lokal starten

```sh
npm install
npm test
npm run dev
```

Ohne `npm install` ist die Anwendung nicht ausführbar. `npm run build` baut die Vite-Anwendung für die Auslieferung.
