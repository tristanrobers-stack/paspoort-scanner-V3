import React from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { Guest, PropertySettings, BookingData } from '../types';

interface ParteViajerosModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  property: PropertySettings;
  booking: BookingData;
}

export const ParteViajerosModal: React.FC<ParteViajerosModalProps> = ({
  isOpen,
  onClose,
  guests,
  property,
  booking,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Toolbar (hidden during print) */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Parte de Entrada de Viajeros (RD 933/2021)</h3>
              <p className="text-[11px] text-slate-400">
                Mandatory guest registration report (must be retained by host for 3 years)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shadow flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper View */}
        <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50 space-y-6 text-slate-800 text-xs font-sans print:p-0 print:bg-white">
          {guests.map((guest, idx) => (
            <div
              key={guest.id}
              className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-slate-800 print:rounded-none space-y-4 page-break-after"
            >
              {/* Official Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                    PARTE DE ENTRADA DE VIAJEROS
                  </h2>
                  <p className="text-[10px] text-slate-600 font-semibold">
                    REGISTRO DOCUMENTAL DE HOSPEDAJE (REAL DECRETO 933/2021)
                  </p>
                </div>
                <div className="text-right text-[11px]">
                  <span className="font-mono font-bold text-slate-800">
                    REGISTRATION Nº: {booking.referenciaReserva || 'RES'}-{idx + 1}
                  </span>
                  <div className="text-[10px] text-slate-500">
                    Check-in: {booking.fechaEntrada} {booking.horaEntrada || '15:00'}
                  </div>
                </div>
              </div>

              {/* Establishment info */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]">
                <div>
                  <span className="text-slate-500 block">Accommodation:</span>
                  <span className="font-bold">{property.nombreEstablecimiento || 'Apartamento Balcones al Mar'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Establishment Code:</span>
                  <span className="font-mono font-bold">{property.codigoEstablecimiento || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Host NIF/NIE:</span>
                  <span className="font-mono font-bold">{property.codigoArrendador || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Location:</span>
                  <span className="font-bold">{property.municipio || 'Spain'}</span>
                </div>
              </div>

              {/* Guest Information Grid */}
              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wide text-slate-700 mb-2 border-b border-slate-200 pb-1">
                  1. Datos del Viajero / Traveler Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">1º Apellido / 1st Surname</span>
                    <div className="font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.primerApellido}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">2º Apellido / 2nd Surname</span>
                    <div className="font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.segundoApellido || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Nombre / Given Name</span>
                    <div className="font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.nombre}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Sexo / Sex</span>
                    <div className="font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.sexo === 'M' ? 'Male (M)' : guest.sexo === 'F' ? 'Female (F)' : 'X'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Fecha Nacimiento / Birth Date</span>
                    <div className="font-mono font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.fechaNacimiento}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Nacionalidad / Nationality</span>
                    <div className="font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.paisNacionalidad}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Teléfono / Phone</span>
                    <div className="font-mono font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.telefono || booking.telefonoContacto || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Document info */}
              <div>
                <h4 className="font-bold text-[11px] uppercase tracking-wide text-slate-700 mb-2 border-b border-slate-200 pb-1">
                  2. Documento de Identidad / Identity Document
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Document Type</span>
                    <div className="font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.tipoDocumento === 'P' ? 'Passport (P)' : guest.tipoDocumento === 'I' ? 'EU ID Card (I)' : 'DNI (D)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Document Number</span>
                    <div className="font-mono font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.numeroDocumento}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Nº Soporte / Support</span>
                    <div className="font-mono font-bold text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.numSoporte || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Issue Date</span>
                    <div className="font-mono text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.fechaExpedicion || '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Expiry Date</span>
                    <div className="font-mono text-slate-900 py-1 border-b border-dotted border-slate-400">
                      {guest.fechaCaducidad || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal Disclaimer & Signature Box */}
              <div className="pt-3 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2 text-[9.5px] text-slate-500 leading-snug">
                  <p>
                    <strong>Cláusula informativa:</strong> En cumplimiento de la Ley Orgánica 4/2015 de Protección de la Seguridad Ciudadana y el Real Decreto 933/2021, los datos recabados en este parte de entrada son comunicados a las Fuerzas y Cuerpos de Seguridad del Estado (Ministerio del Interior). El viajero consiente el tratamiento de los mismos para los fines legalmente establecidos.
                  </p>
                </div>
                <div className="text-center border border-slate-400 rounded-lg p-3 bg-slate-50 print:bg-white h-24 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Firma del viajero / Signature</span>
                  <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto mb-1"></div>
                  <span className="text-[9px] text-slate-400">Mandatory signature for travelers over 14 years old</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
