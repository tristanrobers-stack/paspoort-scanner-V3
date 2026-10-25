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
export function mapTipoDocumento(guest: Guest): 'NIF' | 'NIE' | 'PAS' | 'OTRO' {
  const docType = guest.tipoDocumento;
  const nat = (guest.paisNacionalidad || '').toUpperCase().trim();
  const num = (guest.numeroDocumento || '').toUpperCase().trim();

  if (docType === 'P') {
    return 'PAS';
  }

  // Spanish NIE begins with X, Y, or Z followed by digits and letter
  // Many foreigners living in Spain have NIE with their own nationality (e.g. NLD, GBR)
  if (/^[XYZ]\d{7,8}[A-Z]?$/i.test(num) || /^[XYZ]/i.test(num)) {
    return 'NIE';
  }

  // Spanish DNI (Documento Nacional de Identidad)
  if (docType === 'D' || nat === 'ESP') {
    return 'NIF';
  }

  // European ID card or other non-passport document
  if (docType === 'I' || docType === 'C') {
    return 'OTRO';
  }

  return 'PAS';
}

/**
 * Check if the guest document is Spanish DNI or Foreigner NIE/TIE,
 * which strictly requires <numSoporte> in the SES.HOSPEDAJES portal.
 */
export function isSpanishOrNieDoc(guest: Guest): boolean {
  const num = (guest.numeroDocumento || '').toUpperCase().trim();
  const nat = (guest.paisNacionalidad || '').toUpperCase().trim();
  const docType = guest.tipoDocumento;

  if (docType === 'D' || nat === 'ESP') return true;
  if (/^[XYZ]/i.test(num)) return true;
  const mapped = mapTipoDocumento(guest);
  return mapped === 'NIF' || mapped === 'NIE';
}

/**
 * Check if a guest will cause the SES.HOSPEDAJES error:
 * "Error de validación en la comunicación [1]: [Ha de informar el número de soporte del documento.]"
 */
export function hasMissingNumSoporte(guest: Guest, bookingSupport?: string): boolean {
  if (isSpanishOrNieDoc(guest)) {
    const hasGuestSoporte = Boolean(guest.numSoporte && guest.numSoporte.trim());
    const hasBookingSoporte = Boolean(bookingSupport && bookingSupport.trim());
    return !hasGuestSoporte && !hasBookingSoporte;
  }
  return false;
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
  let autoMedioPago = 'PLATAFORMA VIRTUAL';
  if (tipoPago === 'TARJT') autoMedioPago = 'TARJETA';
  else if (tipoPago === 'TRANS') autoMedioPago = 'TRANSFERENCIA BANCARIA';
  else if (tipoPago === 'EFECT') autoMedioPago = 'EFECTIVO';
  else if (tipoPago === 'MOVIL') autoMedioPago = 'PAGO MOVIL';
  const medioPago = (booking.medioPago || autoMedioPago).trim();

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
    const effectiveNumSoporte = (guest.numSoporte?.trim() || '').toUpperCase().replace(/\s/g, '');
    if (effectiveNumSoporte) {
      xml += `        <numSoporte>${escapeXml(effectiveNumSoporte)}</numSoporte>\n`;
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

    const effectivePhone = (guest.telefono || booking.telefonoContacto || (booking as any).telefono || '').trim();
    if (effectivePhone) {
      // Clean phone number (keep +, digits, spaces)
      const cleanPhone = effectivePhone.replace(/[^\d+]/g, '');
      xml += `        <telefono>${escapeXml(cleanPhone || effectivePhone)}</telefono>\n`;
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
    'TELEFONO',
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
    `"${(g.telefono || booking.telefonoContacto || (booking as any).telefono || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}
