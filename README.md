# SES.HOSPEDAJES AutoScanner (Spanje RD 933/2021)

Automatische paspoort- en identiteitskaartscanner voor het Spaanse **SES.HOSPEDAJES**-systeem (*Ministerio del Interior*), ontwikkeld volgens de eisen van **Real Decreto 933/2021 (Registro de Viajeros)**.

Hiermee kunnen verhuurders van vakantiewoningen en appartementen in Spanje paspoortfoto's scannen met behulp van AI (Gemini Flash Vision) en met één klik de officiële **XML- en CSV-bestanden** genereren voor directe upload in het overheidsportaal [hospedajes.ses.mir.es](https://hospedajes.ses.mir.es).

---

## Belangrijkste Functies

- **AI Document OCR & MRZ Validatie**: Leest voornamen, achternamen, geboortedatum, geslacht (`sexo` M/F), nationaliteit (ISO 3166-1 alpha-3), type document (P/I/D/C), documentnummer en data uit.
- **ICAO 9303 Checksum Verificatie**: Berekent de wiskundige controlesommen van de Machine Readable Zone (MRZ) onderaan paspoorten en ID-kaarten om OCR-leesfouten (zoals `O` vs `0`) te voorkomen.
- **Officiële SES.HOSPEDAJES XML Generator**: Voldoet aan de officiële XSD-structuur van het Spaanse Ministerie van Binnenlandse Zaken.
- **CSV Export**: Directe alternatieve tabelindeling voor bulkuploads.
- **Parte de Entrada de Viajeros (PDF / Print)**: Genereert het wettelijk verplichte gastenformulier met juridische clausule en handtekeningvak dat verhuurders volgens de wet 3 jaar moeten bewaren in het *Libro-Registro*.
- **Camera-Ondersteuning**: Direct paspoorten scannen met de smartphone- of laptopcamera aan de deur van de accommodatie.
- **Demo Modus**: Met 1 klik realistische voorbeeldgasten inladen om het XML-resultaat direct te testen.

---

## Installatie & Lokaal Starten

### Vereisten
- Node.js (v18 of hoger aanbevolen)
- npm

### Stappen
1. Clone of download deze repository:
   ```bash
   git clone <jouw-repo-url>
   cd <project-map>
   ```

2. Installeer de benodigde packages:
   ```bash
   npm install
   ```

3. Kopieer het omgevingsbestand en vul je Gemini API-sleutel in:
   ```bash
   cp .env.example .env
   ```
   Vul in `.env`:
   ```env
   GEMINI_API_KEY="jouw_gemini_api_key_hier"
   ```

4. Start de ontwikkelserver:
   ```bash
   npm run dev
   ```
   Open je browser op `http://localhost:3000`.

---

## Koppelen aan je eigen GitHub Repository

Wil je deze Git-repository uploaden naar je eigen GitHub-account?

```bash
# 1. Maak een nieuwe lege repository aan op github.com (bijv. "ses-hospedajes-scanner")
# 2. Koppel de remote URL:
git remote add origin https://github.com/JOUW_GEBRUIKERSNAAM/ses-hospedajes-scanner.git

# 3. Push de code naar GitHub:
git branch -M main
git push -u origin main
```

---

## Juridische Context (Spanje RD 933/2021)
- **Meldtermijn**: Maximaal 24 uur na aankomst van de gast(en).
- **Bewaarplicht**: Getekende *Parte de Viajeros* formulieren moeten 3 jaar worden bewaard.
- **Overheidsportaal**: [hospedajes.ses.mir.es](https://hospedajes.ses.mir.es) (inloggen via Cl@ve of Digitaal Certificaat).
