export type DocumentType = 'P' | 'I' | 'D' | 'C';
export type Gender = 'M' | 'F' | 'X';

export interface Guest {
  id: string;
  imagePreview?: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  sexo: Gender;
  fechaNacimiento: string; // YYYY-MM-DD
  paisNacionalidad: string; // ISO 3166-1 alpha-3, e.g. NLD, ESP
  tipoDocumento: DocumentType;
  numeroDocumento: string;
  numSoporte?: string; // Número de soporte del documento (e.g. IDESP..., E12345678, C12345678)
  fechaExpedicion?: string; // YYYY-MM-DD
  fechaCaducidad?: string; // YYYY-MM-DD
  paisExpedicion?: string;
  direccion?: string;
  municipio?: string;
  codigoPostal?: string;
  telefono?: string;
  correo?: string;
  mrzLines?: string[];
  mrzValid?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
  fileType?: 'image' | 'pdf' | string;
  fileName?: string;
}

export interface PropertySettings {
  id: string;
  codigoEstablecimiento: string;
  codigoArrendador: string;
  nombreEstablecimiento: string;
  municipio: string;
  provincia: string;
  direccion: string;
}

export type TipoPago = 'PLATF' | 'TARJT' | 'EFECT' | 'TRANS' | 'MOVIL' | 'DESTI' | 'TREG' | 'OTRO';

export interface BookingData {
  referenciaReserva: string;
  fechaContrato?: string; // YYYY-MM-DD
  fechaEntrada: string; // YYYY-MM-DD
  horaEntrada: string; // HH:mm
  fechaSalida: string; // YYYY-MM-DD
  numeroPersonas: number;
  numHabitaciones?: number;
  internet?: boolean;
  tipoPago?: TipoPago;
  medioPago?: string;
  titularPago?: string;
}

export interface ArchivedBooking {
  id: string;
  year: number;
  referenciaReserva: string;
  fechaEntrada: string;
  horaEntrada?: string;
  fechaSalida: string;
  property: PropertySettings;
  guests: Guest[];
  createdAt: string;
}
