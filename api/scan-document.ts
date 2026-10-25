import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    let { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

    if (!imageBase64) {
      return res.status(200).json({
        success: false,
        error: 'No document data received (imageBase64 missing).',
      });
    }

    const apiKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();
    if (!apiKey) {
      return res.status(200).json({
        success: false,
        error:
          'GEMINI_API_KEY is not configured or recognized in Vercel. Please add GEMINI_API_KEY in your Vercel Project Settings > Environment Variables, and Redeploy.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Detect MIME type from data URL prefix if provided
    const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }

    // Normalize mimeType for common variations
    if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
    if (mimeType.includes('pdf')) mimeType = 'application/pdf';

    // Strip any data URL header cleanly
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const systemPrompt = `You are a high-precision OCR and document analysis engine specialized in extracting traveler identity information for the official Spanish Ministry of the Interior registration system: SES.HOSPEDAJES (Real Decreto 933/2021 / Registro de Viajeros).

Analyze the provided file (which may be a photo, a multi-page PDF, a scanned document, or an ID card).
The file may contain ONE or MULTIPLE travelers (for example, a multi-page PDF booking confirmation or family passport scans). Extract EVERY traveler found in the document into the "travelers" array.

For each traveler, pay special attention to:
1. The Machine Readable Zone (MRZ) at the bottom (2 lines of 44 characters for TD3 passports, or 3 lines of 30 characters for TD1 identity cards). Extract the exact MRZ lines if visible, because they are the authoritative source for document number, birth date, gender, and names.
2. Spanish government field requirements:
   - "nombre": First/given names (in uppercase).
   - "primerApellido": First surname (crucial: Spanish and Latin names have two surnames; Dutch/German/English usually have one).
   - "segundoApellido": Second surname (if exists, else empty).
   - "sexo": 'M' (Male/Hombre), 'F' (Female/Mujer), or 'X' (Unspecified).
   - "fechaNacimiento": YYYY-MM-DD format.
   - "paisNacionalidad": 3-letter ISO 3166-1 alpha-3 country code (e.g. NLD, ESP, DEU, GBR, BEL, FRA, ITA, USA, POL, IRL).
   - "tipoDocumento":
     'P' = Pasaporte (Passport)
     'I' = Carta de Identidad / NIE / EU Residence Card
     'D' = DNI (Spanish National Identity Card)
     'C' = Permiso de conducir (Driver's license)
   - "numeroDocumento": Official alphanumeric document number (in uppercase, remove spaces/hyphens).
   - "numSoporte": Support number of the physical document if visible (e.g. for Spanish DNI: "IDESP..." or 9-character code printed under "NUM SOPORTE" / "IDESP"; for TIE / Foreigner card: code starting with 'E' followed by digits; for green EU certificate: 'C' + digits; for passport / other cards: document support or card number if present, else empty).
   - "fechaExpedicion": YYYY-MM-DD date of issue (if found, else empty).
   - "fechaCaducidad": YYYY-MM-DD date of expiry (if found, else empty).
   - "paisExpedicion": 3-letter ISO-3 country of issuance.
   - "mrzLines": Array of exact raw MRZ strings.
   - "confidence": "high", "medium", or "low".
   - "notes": Any observations (e.g. "PDF page 1: valid Dutch passport", "MRZ verified").`;

    let response: any;
    let retries = 3;
    let delay = 1500;
    let lastError: any = null;

    while (retries > 0) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: mimeType || 'application/pdf',
                  },
                },
              ],
            },
          ],
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                travelers: {
                  type: Type.ARRAY,
                  description: 'List of all travelers found in the document (image or PDF)',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      nombre: { type: Type.STRING, description: 'Given names / first names' },
                      primerApellido: { type: Type.STRING, description: 'First surname' },
                      segundoApellido: { type: Type.STRING, description: 'Second surname if present, otherwise empty' },
                      sexo: { type: Type.STRING, description: 'M, F, or X' },
                      fechaNacimiento: { type: Type.STRING, description: 'YYYY-MM-DD' },
                      paisNacionalidad: { type: Type.STRING, description: '3-letter ISO-3166-1 alpha-3 code (e.g. NLD, ESP, GBR)' },
                      tipoDocumento: { type: Type.STRING, description: 'P (Passport), I (EU ID / NIE), D (Spanish DNI), or C (Driving license)' },
                      numeroDocumento: { type: Type.STRING, description: 'Alphanumeric document number' },
                      numSoporte: { type: Type.STRING, description: 'Support number of the document / Num Soporte (e.g. IDESP..., E..., C...)' },
                      fechaExpedicion: { type: Type.STRING, description: 'YYYY-MM-DD or empty' },
                      fechaCaducidad: { type: Type.STRING, description: 'YYYY-MM-DD or empty' },
                      paisExpedicion: { type: Type.STRING, description: '3-letter ISO code' },
                      mrzLines: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Exact MRZ lines detected',
                      },
                      confidence: { type: Type.STRING, description: 'high, medium, or low' },
                      notes: { type: Type.STRING, description: 'Status remarks' },
                    },
                    required: [
                      'nombre',
                      'primerApellido',
                      'sexo',
                      'fechaNacimiento',
                      'paisNacionalidad',
                      'tipoDocumento',
                      'numeroDocumento',
                    ],
                  },
                },
                documentSummary: { type: Type.STRING, description: 'Summary of document type and pages' },
              },
              required: ['travelers'],
            },
          },
        });
        break; // Success!
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || '');
        console.warn(`[AI OCR] Attempt failed (retries left: ${retries - 1}). Error:`, msg);

        retries--;
        if (retries > 0) {
          await sleep(delay);
          delay *= 2;
        }
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    let textOutput = response?.text?.trim() || '{}';

    if (textOutput.startsWith('```')) {
      textOutput = textOutput.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    const firstBrace = textOutput.indexOf('{');
    const lastBrace = textOutput.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      textOutput = textOutput.substring(firstBrace, lastBrace + 1);
    }

    const parsedData = JSON.parse(textOutput);
    const travelers = parsedData.travelers || [];

    return res.status(200).json({
      success: true,
      travelers,
      documentSummary: parsedData.documentSummary || '',
      mimeType,
    });
  } catch (error: any) {
    console.error('OCR Error in /api/scan-document:', error);
    const errorMsg = String(error?.message || '');
    let friendlyMessage = 'An error occurred while analyzing the document.';

    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      friendlyMessage = 'The AI service is experiencing high traffic. Please wait 10 seconds and try again.';
    } else if (errorMsg.includes('503') || errorMsg.includes('overloaded')) {
      friendlyMessage = 'Google AI servers are currently busy. Please retry in a few moments.';
    } else if (
      errorMsg.includes('API_KEY') ||
      errorMsg.includes('401') ||
      errorMsg.includes('API key not valid') ||
      errorMsg.includes('PERMISSION_DENIED')
    ) {
      friendlyMessage =
        'Invalid Gemini API key. Please verify that GEMINI_API_KEY in your Vercel Environment Variables is a valid Google Gemini API key from https://aistudio.google.com/apikey';
    } else if (errorMsg.includes('JSON')) {
      friendlyMessage = 'Could not clearly recognize the document text. Ensure the photo is sharp, well-lit, and unblurred.';
    } else if (error?.message) {
      friendlyMessage = error.message;
    }

    return res.status(200).json({
      success: false,
      error: friendlyMessage,
    });
  }
}
