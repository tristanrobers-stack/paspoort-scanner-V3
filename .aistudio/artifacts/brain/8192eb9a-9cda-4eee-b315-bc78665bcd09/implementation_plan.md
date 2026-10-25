# Interface Vereenvoudiging: Verwijderen Overbodige Betaalvelden & Behoud Enkel Telefoonnummer & Num Soporte Scanner

Dit plan verwijdert de ongevraagde extra velden (het gele venster voor betalingsnummer/identificatie en het veld voor naam van de kaarthouder) uit het scherm. In plaats daarvan worden deze technische waarden op de achtergrond automatisch gegenereerd zodat het XML-bestand 100% geldig blijft voor het Spaanse Ministerie (SES.HOSPEDAJES / RD 933/2021). De interface bevat dan enkel het gevraagde telefoonnummer-invoervenster naast Payment Method (dat automatisch geldt voor alle gasten) en de versterkte Num Soporte scanner.

### User Review & Critical Decisions

> [!IMPORTANT]
> Bevestigde keuzes door de gebruiker:
> - **Verwijderen extra velden**: Het gele venster (*Nummer / Identificatie Medio de Pago*) en het veld voor *Naam Kaarthouder / Betaler* worden volledig verwijderd uit het scherm.
> - **Automatische achtergrondwaarden**: In het XML-bestand vult het systeem deze waarden automatisch in (`PLATAFORMA VIRTUAL` of passend bij de gekozen betaalmethode, en de naam van Gast 1 als titular), zodat er nooit validatiefouten optreden in het Spaanse portaal.
> - **Telefoonnummerbereik**: Het ingevulde telefoonnummer naast Payment Method wordt automatisch bij alle gasten in het XML-bestand opgenomen in de tag `<telefono>`.
> - **Num Soporte Scanner**: Blijft actief en scant zowel de voorzijde van de kaart (*NUM SOPORTE / IDESP*) als de MRZ-code op de achterzijde (*IDESP...*).

---

### 1. Overzicht van de Wijzigingen

1. **Opruimen Sectie 1 (Reservering / Booking Details)**:
   - **Verwijderen**: Het gele blok *"Nummer / Identificatie (Medio de Pago)"* en de knop *"Venster Openen"*.
   - **Verwijderen**: Het veld *"Naam Kaarthouder / Betaler (Titular del Pago)"*.
   - **Verwijderen**: De `PaymentModal` popup die niet gewenst was.
   - **Behouden & Centraal Stellen**:
     - *Booking Reference / ID* (bv. AIRBNB-HM9821)
     - *Check-in Datum & Tijd*
     - *Check-out Datum*
     - *Payment Method (Tipo de Pago)* (dropdown: PLATF, TARJT, EFECT, TRANS)
     - **Telefoonnummer Gasten (*Teléfono de Contacto*)**: Het enige extra invulvenster, direct naast/onder Payment Method met landcode-knoppen (`+31`, `+34`, etc.).
2. **Automatische Afhandeling in XML (`xmlGenerator.ts`)**:
   - `<medioPago>`: Wordt automatisch ingesteld op basis van `tipoPago` (bv. `PLATAFORMA VIRTUAL` bij PLATF, `TARJETA` bij TARJT, `EFECTIVO` bij EFECT).
   - `<titular>`: Wordt automatisch ingesteld op de naam van Gast #1 (of naam van het etablissement).
   - `<telefono>`: Wordt voor alle gasten netjes geëxporteerd met het centrale ingevulde telefoonnummer (of individueel aangepast nummer).
   - `<numSoporte>`: Wordt voor Spaanse DNI/NIE gasten automatisch geplaatst vanuit de scan of handmatige invoer.
3. **Num Soporte Scanner Hardening**:
   - De OCR prompt in `api/scan-document.ts` en de MRZ-validator in `mrzValidator.ts` blijven gewaarborgd om Spaanse DNI's en ID-kaarten (IDESP / NUM SOPORTE) accuraat te scannen en foutloos in de XML te plaatsen.

---

### 2. Visuele Structuur Sectie 1

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  1. Booking Details (Reserva)                                                    │
├─────────────────────────┬─────────────────────────┬──────────────────────────────┤
│ Booking Reference / ID  │ Check-in Datum & Tijd   │ Check-out Datum              │
│ [ AIRBNB-HM9821       ] │ [ 2026-10-25 ] [ 15:00] │ [ 2026-11-01 ]               │
├─────────────────────────┴─────────────────────────┴──────────────────────────────┤
│ Payment Method (Tipo de Pago)                                                    │
│ [ PLATF - Plataforma Online (Airbnb / Booking / VRBO)                          ▼] │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 📞 Telefoonnummer Gasten (Teléfono de Contacto) *                                │
│ [ +31 6 12345678                                       ] [🇳🇱 +31] [🇪🇸 +34] [🇧🇪 +32] │
│ ✓ Automatisch opgenomen bij alle gasten in de export XML (<telefono>)            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Technische Stappen

1. **`src/App.tsx`**:
   - Verwijder het gele `Medio de Pago` venster en de `PaymentModal` trigger/state/import.
   - Verwijder het `Titular del Pago` veld.
   - Plaats het *Telefoonnummer Gasten* invoervenster strak en overzichtelijk direct onder/naast de Payment Method dropdown.
2. **`src/utils/xmlGenerator.ts`**:
   - Zorg dat als `booking.medioPago` niet handmatig is ingevuld, de generator automatisch een geldige waarde kiest (bv. `PLATAFORMA VIRTUAL`).
   - Zorg dat als `booking.titularPago` leeg is, automatisch de naam van Gast #1 wordt gebruikt.
   - Garandeer `<telefono>` voor alle gasten met fallback op `booking.telefonoContacto`.
3. **Verwijderen onnodige component**:
   - Verwijder `src/components/PaymentModal.tsx` zodat de codebase schoon blijft.
4. **Verificatie**:
   - Uitvoeren van `lint_applet` en `compile_applet` om een 100% foutloze werking te garanderen.
