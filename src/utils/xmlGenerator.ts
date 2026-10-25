import { Guest, PropertySettings, BookingData } from '../types';

export function escapeXml(unsafe: string | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Spanish timezone offset for SES.HOSPEDAJES
 * CEST (+02:00) from end of March to end of October; CET (+01:00) in winter.
 */
function getSpainTimezoneOffset(): string {
  const now = new Date();
  const month = now.getMonth(); // 0 to 11
  // March (2) to October (9) is daylight saving time (+02:00) in Spain
  return month >= 2 && month <= 9 ? '+02:00' : '+01:00';
}

/**
 * Format date to YYYY-MM-DD+02:00
 */
export function formatDateWithTz(dateStr?: string): string {
  const today = new Date().toISOString().split('T')[0];
  const clean = (dateStr || today).trim().split('T')[0];
  return `${clean}${getSpainTimezoneOffset()}`;
}

/**
 * Format datetime to YYYY-MM-DDTHH:mm:ss.000+02:00
 */
export function formatDateTimeWithTz(dateStr?: string, timeStr = '15:00'): string {
  const today = new Date().toISOString().split('T')[0];
  const cleanDate = (dateStr || today).trim().split('T')[0];
  let cleanTime = (timeStr || '15:00').trim();

  if (cleanTime.length === 5) {
    cleanTime = `${cleanTime}:00.000`;
  } else if (cleanTime.length === 8) {
    cleanTime = `${cleanTime}.000`;
  }

  return `${cleanDate}T${cleanTime}${getSpainTimezoneOffset()}`;
}

/**
 * Map DocumentType to official schema: [NIF, NIE, PAS, OTRO]
 */
function mapTipoDocumento(guest: Guest): 'NIF' | 'NIE' | 'PAS' | 'OTRO' {
  const docType = guest.tipoDocumento;
  const nat = (guest.paisNacionalidad || 'ESP').toUpperCase().trim();
  const num = (guest.numeroDocumento || '').toUpperCase().trim();

  if (docType === 'P') {
    return 'PAS';
  }

  if (nat === 'ESP') {
    if (/^[XYZ]/i.test(num)) {
      return 'NIE';
    }
    return 'NIF';
  }

  // European ID card or other non-passport document
  if (docType === 'I' || docType === 'D') {
    return 'OTRO';
  }

  return 'PAS';
}

/**
 * Map Sex to official schema: [H, M, O]
 * H = Hombre (Male)
 * M = Mujer (Female)
 * O = Otro (Other / Non-binary)
 */
function mapSexo(gender?: string): 'H' | 'M' | 'O' {
  if (gender === 'F') return 'M'; // Mujer
  if (gender === 'M') return 'H'; // Hombre
  return 'O'; // Otro
}

/**
 * Generate official SES.HOSPEDAJES XML for Real Decreto 933/2021
 * Target Schema: xmlns:ns2="http://www.neg.hospedajes.mir.es/altaParteHospedaje"
 * Section: Carga de ficheros / Alta masiva (hospedajes.ses.mir.es)
 */
export function generateSesXml(
  guests: Guest[],
  property: PropertySettings,
  booking: BookingData
): string {
  const codigoEstablecimiento = property.codigoEstablecimiento.trim() || '0000472036';
  const referencia = (booking.referenciaReserva || 'AIRBNB-RES').trim();
  const fechaContrato = booking.fechaContrato || booking.fechaEntrada || new Date().toISOString().split('T')[0];
  const fechaEntrada = booking.fechaEntrada || new Date().toISOString().split('T')[0];
  const horaEntrada = booking.horaEntrada || '15:00';
  const fechaSalida = booking.fechaSalida || fechaEntrada;
  const numPersonas = guests.length;
  const numHabitaciones = booking.numHabitaciones || 1;
  const internet = booking.internet !== false;
  const tipoPago = booking.tipoPago || 'PLATF';
  const medioPago = (booking.medioPago || 'PLATAFORMA VIRTUAL').trim();

  // Guest 1 as titular or property name
  const titular =
    booking.titularPago?.trim() ||
    (guests[0]
      ? `${guests[0].nombre} ${guests[0].primerApellido}`.trim()
      : property.nombreEstablecimiento || 'TITULAR');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<ns2:peticion xmlns:ns2="http://www.neg.hospedajes.mir.es/altaParteHospedaje">\n`;
  xml += `  <solicitud>\n`;
  xml += `    <codigoEstablecimiento>${escapeXml(codigoEstablecimiento)}</codigoEstablecimiento>\n`;
  xml += `    <comunicacion>\n`;
  xml += `      <contrato>\n`;
  xml += `        <referencia>${escapeXml(referencia)}</referencia>\n`;
  xml += `        <fechaContrato>${formatDateWithTz(fechaContrato)}</fechaContrato>\n`;
  xml += `        <fechaEntrada>${formatDateTimeWithTz(fechaEntrada, horaEntrada)}</fechaEntrada>\n`;
  xml += `        <fechaSalida>${formatDateTimeWithTz(fechaSalida, '11:00')}</fechaSalida>\n`;
  xml += `        <numPersonas>${numPersonas}</numPersonas>\n`;
  xml += `        <numHabitaciones>${numHabitaciones}</numHabitaciones>\n`;
  xml += `        <internet>${internet}</internet>\n`;
  xml += `        <pago>\n`;
  xml += `          <tipoPago>${tipoPago}</tipoPago>\n`;
  xml += `          <fechaPago>${formatDateWithTz(fechaContrato)}</fechaPago>\n`;
  xml += `          <medioPago>${escapeXml(medioPago)}</medioPago>\n`;
  xml += `          <titular>${escapeXml(titular)}</titular>\n`;
  xml += `        </pago>\n`;
  xml += `      </contrato>\n`;

  // Each traveler as <persona> with <rol>VI</rol>
  guests.forEach((guest) => {
    const isSpain = (guest.paisNacionalidad || 'ESP').toUpperCase().trim() === 'ESP';
    const cleanDocNum = (guest.numeroDocumento || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

    xml += `      <persona>\n`;
    xml += `        <rol>VI</rol>\n`;
    xml += `        <nombre>${escapeXml(guest.nombre.toUpperCase().trim())}</nombre>\n`;
    xml += `        <apellido1>${escapeXml(guest.primerApellido.toUpperCase().trim())}</apellido1>\n`;
    if (guest.segundoApellido?.trim()) {
      xml += `        <apellido2>${escapeXml(guest.segundoApellido.toUpperCase().trim())}</apellido2>\n`;
    }
    xml += `        <tipoDocumento>${mapTipoDocumento(guest)}</tipoDocumento>\n`;
    xml += `        <numeroDocumento>${escapeXml(cleanDocNum)}</numeroDocumento>\n`;
    if (guest.numSoporte?.trim()) {
      const cleanNumSoporte = guest.numSoporte.toUpperCase().replace(/\s/g, '');
      xml += `        <numSoporte>${escapeXml(cleanNumSoporte)}</numSoporte>\n`;
    }
    xml += `        <fechaNacimiento>${formatDateWithTz(guest.fechaNacimiento)}</fechaNacimiento>\n`;
    xml += `        <nacionalidad>${escapeXml((guest.paisNacionalidad || 'NLD').toUpperCase().trim())}</nacionalidad>\n`;
    xml += `        <sexo>${mapSexo(guest.sexo)}</sexo>\n`;
    xml += `        <direccion>\n`;
    xml += `          <direccion>${escapeXml(guest.direccion?.trim() || property.direccion?.trim() || 'Principal 1')}</direccion>\n`;

    // Ministry rules:
    // If country is ESP: codigoMunicipio must be included, NOT nombreMunicipio.
    // If country is not ESP: nombreMunicipio must be included, NOT codigoMunicipio.
    if (isSpain) {
      xml += `          <codigoMunicipio>03014</codigoMunicipio>\n`;
      xml += `          <codigoPostal>${escapeXml(guest.codigoPostal?.trim() || '03001')}</codigoPostal>\n`;
      xml += `          <pais>ESP</pais>\n`;
    } else {
      xml += `          <nombreMunicipio>${escapeXml(guest.municipio?.trim() || 'Amsterdam')}</nombreMunicipio>\n`;
      xml += `          <codigoPostal>${escapeXml(guest.codigoPostal?.trim() || '1012AB')}</codigoPostal>\n`;
      xml += `          <pais>${escapeXml((guest.paisNacionalidad || 'NLD').toUpperCase().trim())}</pais>\n`;
    }

    xml += `        </direccion>\n`;

    if (guest.telefono?.trim()) {
      xml += `        <telefono>${escapeXml(guest.telefono.trim())}</telefono>\n`;
    }
    if (guest.correo?.trim()) {
      xml += `        <correo>${escapeXml(guest.correo.trim())}</correo>\n`;
    }

    xml += `      </persona>\n`;
  });

  xml += `    </comunicacion>\n`;
  xml += `  </solicitud>\n`;
  xml += `</ns2:peticion>`;

  return xml;
}

/**
 * Generate CSV format for batch upload
 */
export function generateSesCsv(
  guests: Guest[],
  property: PropertySettings,
  booking: BookingData
): string {
  const headers = [
    'CODIGO_ESTABLECIMIENTO',
    'REF_RESERVA',
    'FECHA_ENTRADA',
    'FECHA_SALIDA',
    'NOMBRE',
    'APELLIDO1',
    'APELLIDO2',
    'SEXO',
    'TIPO_DOC',
    'NUM_DOC',
    'NUM_SOPORTE',
    'FECHA_NACIMIENTO',
    'NACIONALIDAD',
    'PAIS',
  ];

  const rows = guests.map((g) => [
    property.codigoEstablecimiento || '0000472036',
    booking.referenciaReserva || '',
    booking.fechaEntrada || '',
    booking.fechaSalida || '',
    `"${g.nombre.replace(/"/g, '""')}"`,
    `"${g.primerApellido.replace(/"/g, '""')}"`,
    `"${(g.segundoApellido || '').replace(/"/g, '""')}"`,
    mapSexo(g.sexo),
    mapTipoDocumento(g),
    `"${g.numeroDocumento}"`,
    `"${(g.numSoporte || '').replace(/"/g, '""')}"`,
    g.fechaNacimiento || '',
    g.paisNacionalidad || 'NLD',
    g.paisNacionalidad || 'NLD',
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}
