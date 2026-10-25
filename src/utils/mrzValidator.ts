/**
 * ICAO Doc 9303 Machine Readable Zone (MRZ) validation and parser
 */

const WEIGHTS = [7, 3, 1];

export function calculateIcaoCheckDigit(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charAt(i);
    let val = 0;
    if (char >= '0' && char <= '9') {
      val = char.charCodeAt(0) - '0'.charCodeAt(0);
    } else if (char >= 'A' && char <= 'Z') {
      val = char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    } else if (char === '<') {
      val = 0;
    }
    sum += val * WEIGHTS[i % 3];
  }
  return sum % 10;
}

export interface MrzParseResult {
  isValid: boolean;
  documentType?: 'P' | 'I' | 'D' | 'C';
  issuingCountry?: string;
  documentNumber?: string;
  documentNumberValid?: boolean;
  birthDate?: string; // YYYY-MM-DD
  birthDateValid?: boolean;
  sex?: 'M' | 'F' | 'X';
  expiryDate?: string; // YYYY-MM-DD
  expiryDateValid?: boolean;
  nationality?: string;
  surname?: string;
  givenNames?: string;
  compositeValid?: boolean;
  numSoporte?: string;
}

export function parseAndValidateMrz(lines: string[]): MrzParseResult | null {
  if (!lines || lines.length === 0) return null;

  // Clean lines: uppercase, keep only A-Z, 0-9, and <
  const cleaned = lines
    .map((l) => l.toUpperCase().replace(/[^A-Z0-9<]/g, ''))
    .filter((l) => l.length >= 28);

  // Type 3: Passport (2 lines of 44 characters)
  if (cleaned.length === 2 && cleaned[0].length >= 42 && cleaned[1].length >= 42) {
    const l1 = cleaned[0].padEnd(44, '<');
    const l2 = cleaned[1].padEnd(44, '<');

    const rawDocNum = l2.substring(0, 9).replace(/</g, '');
    const docNumCheck = l2.charAt(9);
    const calculatedDocCheck = calculateIcaoCheckDigit(l2.substring(0, 9));
    const docNumValid = docNumCheck === String(calculatedDocCheck);

    const rawNat = l2.substring(10, 13).replace(/</g, '');
    const rawDob = l2.substring(13, 19);
    const dobCheck = l2.charAt(19);
    const calculatedDobCheck = calculateIcaoCheckDigit(rawDob);
    const dobValid = dobCheck === String(calculatedDobCheck);

    const rawSex = l2.charAt(20);
    const sex: 'M' | 'F' | 'X' = rawSex === 'M' ? 'M' : rawSex === 'F' ? 'F' : 'X';

    const rawExp = l2.substring(21, 27);
    const expCheck = l2.charAt(27);
    const calculatedExpCheck = calculateIcaoCheckDigit(rawExp);
    const expValid = expCheck === String(calculatedExpCheck);

    // Format DOB: YYMMDD -> YYYY-MM-DD
    const dobFormatted = formatMrzDate(rawDob, true);
    const expFormatted = formatMrzDate(rawExp, false);

    // Names in line 1: P<NLDDOE<<JOHN<PAUL<<<<<
    const nameSection = l1.substring(5);
    const parts = nameSection.split('<<');
    const surname = parts[0]?.replace(/</g, ' ').trim() || '';
    const givenNames = parts[1]?.replace(/</g, ' ').trim() || '';

    return {
      isValid: docNumValid && dobValid,
      documentType: 'P',
      issuingCountry: l1.substring(2, 5).replace(/</g, ''),
      documentNumber: rawDocNum,
      documentNumberValid: docNumValid,
      birthDate: dobFormatted,
      birthDateValid: dobValid,
      sex,
      expiryDate: expFormatted,
      expiryDateValid: expValid,
      nationality: rawNat,
      surname,
      givenNames,
    };
  }

  // Type 1: Identity Card (3 lines of 30 characters)
  if (cleaned.length === 3 && cleaned[0].length >= 28) {
    const l1 = cleaned[0].padEnd(30, '<');
    const l2 = cleaned[1].padEnd(30, '<');
    const l3 = cleaned[2].padEnd(30, '<');

    const docTypeChar = l1.charAt(0);
    const rawDocNum = l1.substring(5, 14).replace(/</g, '');
    const docCheck = l1.charAt(14);
    const docNumValid = docCheck === String(calculateIcaoCheckDigit(l1.substring(5, 14)));

    const rawDob = l2.substring(0, 6);
    const dobCheck = l2.charAt(6);
    const dobValid = dobCheck === String(calculateIcaoCheckDigit(rawDob));

    const rawSex = l2.charAt(7);
    const sex: 'M' | 'F' | 'X' = rawSex === 'M' ? 'M' : rawSex === 'F' ? 'F' : 'X';

    const rawExp = l2.substring(8, 14);
    const expCheck = l2.charAt(14);
    const expValid = expCheck === String(calculateIcaoCheckDigit(rawExp));

    const rawNat = l2.substring(15, 18).replace(/</g, '');

    const nameParts = l3.split('<<');
    const surname = nameParts[0]?.replace(/</g, ' ').trim() || '';
    const givenNames = nameParts[1]?.replace(/</g, ' ').trim() || '';

    const issuingCountry = l1.substring(2, 5).replace(/</g, '');
    let numSoporte: string | undefined = undefined;

    // Spanish DNI: Line 1 often begins with IDESP...
    if (l1.startsWith('IDESP') || issuingCountry === 'ESP') {
      const line1Clean = l1.replace(/</g, '');
      if (line1Clean.startsWith('IDESP')) {
        // e.g. IDESP004918 or IDESP followed by 9 chars
        numSoporte = line1Clean.substring(0, 14);
      }
    }

    return {
      isValid: docNumValid && dobValid,
      documentType: issuingCountry === 'ESP' ? 'D' : docTypeChar === 'I' ? 'I' : 'D',
      issuingCountry,
      documentNumber: rawDocNum,
      documentNumberValid: docNumValid,
      birthDate: formatMrzDate(rawDob, true),
      birthDateValid: dobValid,
      sex,
      expiryDate: formatMrzDate(rawExp, false),
      expiryDateValid: expValid,
      nationality: rawNat,
      surname,
      givenNames,
      numSoporte,
    };
  }

  return null;
}

function formatMrzDate(yymmdd: string, isBirthDate: boolean): string {
  if (!yymmdd || yymmdd.length !== 6) return '';
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);

  const currentYear = new Date().getFullYear() % 100;
  let fullYear: number;

  if (isBirthDate) {
    fullYear = yy > currentYear ? 1900 + yy : 2000 + yy;
  } else {
    // Expiry date
    fullYear = yy < 50 ? 2000 + yy : 1900 + yy;
  }

  return `${fullYear}-${mm}-${dd}`;
}
