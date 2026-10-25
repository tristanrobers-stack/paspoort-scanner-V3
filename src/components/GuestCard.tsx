import React, { useState } from 'react';
import { Trash2, Copy, CheckCircle, AlertTriangle, ShieldCheck, User, FileText, ExternalLink, CreditCard, Sparkles, Phone } from 'lucide-react';
import { Guest, DocumentType, Gender } from '../types';
import { COUNTRIES, getCountryByCode } from '../utils/countries';
import { isSpanishOrNieDoc, hasMissingNumSoporte, mapTipoDocumento } from '../utils/xmlGenerator';

interface GuestCardProps {
  guest: Guest;
  index: number;
  onUpdate: (id: string, updated: Partial<Guest>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (guest: Guest) => void;
  onOpenNumSoporteModal?: (guestId: string) => void;
  bookingPhone?: string;
}

export const GuestCard: React.FC<GuestCardProps> = ({
  guest,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onOpenNumSoporteModal,
  bookingPhone,
}) => {
  const currentCountry = getCountryByCode(guest.paisNacionalidad);
  const isPdf = guest.fileType === 'pdf' || guest.imagePreview?.startsWith('data:application/pdf');

  const isSpanishDoc = isSpanishOrNieDoc(guest);
  const missingNumSoporte = hasMissingNumSoporte(guest);

  const hasMissingMandatory =
    !guest.nombre ||
    !guest.primerApellido ||
    !guest.fechaNacimiento ||
    !guest.numeroDocumento ||
    !guest.paisNacionalidad ||
    missingNumSoporte;


  const handleOpenDocument = () => {
    if (guest.imagePreview) {
      const win = window.open();
      if (win) {
        win.document.write(
          isPdf
            ? `<iframe src="${guest.imagePreview}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
            : `<img src="${guest.imagePreview}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`
        );
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
        <div className="flex items-center gap-3">
          {guest.imagePreview ? (
            isPdf ? (
              <button
                type="button"
                onClick={handleOpenDocument}
                title="View uploaded PDF document"
                className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center text-red-600 hover:bg-red-100 transition group shadow-inner"
              >
                <FileText className="w-5 h-5 group-hover:scale-110 transition" />
                <span className="text-[9px] font-black uppercase tracking-tighter">PDF</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenDocument}
                title="View full image"
                className="cursor-pointer"
              >
                <img
                  src={guest.imagePreview}
                  alt="Scan"
                  className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-inner hover:opacity-90 transition"
                />
              </button>
            )
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-lg">
              <User className="w-6 h-6 text-slate-400" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400">#{index + 1}</span>
              <h3 className="font-bold text-slate-900 text-sm">
                {guest.primerApellido || 'SURNAME'}{' '}
                {guest.segundoApellido ? `${guest.segundoApellido} ` : ''},{' '}
                {guest.nombre || 'First Name'}
              </h3>

              {guest.mrzValid && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> MRZ 100% Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5 flex-wrap">
              <span>
                [{guest.tipoDocumento}]{' '}
                <strong className="text-slate-700">{guest.numeroDocumento || 'DOC_NUMBER'}</strong>
              </span>
              {guest.numSoporte && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-600 font-mono">
                    Soporte: <strong className="text-amber-700">{guest.numSoporte}</strong>
                  </span>
                </>
              )}
              <span>&bull;</span>
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <span>{currentCountry?.flag || '🌐'}</span>
                <span>{currentCountry?.nameEn || guest.paisNacionalidad}</span>
              </span>
              <span>&bull;</span>
              <span>{guest.sexo === 'M' ? 'Male (M)' : guest.sexo === 'F' ? 'Female (F)' : 'X'}</span>
              {guest.telefono && (
                <>
                  <span>&bull;</span>
                  <span className="text-slate-600 font-mono">
                    Tel: <strong className="text-slate-800">{guest.telefono}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          {missingNumSoporte && (
            <button
              type="button"
              onClick={() => onOpenNumSoporteModal?.(guest.id)}
              className="text-[11px] text-red-700 bg-red-100/90 hover:bg-red-200 px-2.5 py-1 rounded-lg border border-red-300 flex items-center gap-1.5 font-bold transition shadow-sm"
              title="Klik om het Num Soporte venster te openen en de Spaanse validatiefout te voorkomen"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              <span>Num Soporte Ontbreekt (Vul in &rarr;)</span>
            </button>
          )}
          {hasMissingMandatory && !missingNumSoporte && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" /> Required fields missing
            </span>
          )}

          <button
            type="button"
            onClick={() => onDuplicate(guest)}
            title="Duplicate guest"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(guest.id)}
            title="Delete guest"
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            First Name (Nombre) *
          </label>
          <input
            type="text"
            value={guest.nombre}
            onChange={(e) => onUpdate(guest.id, { nombre: e.target.value.toUpperCase() })}
            placeholder="e.g. JOHN"
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 uppercase font-medium"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            1st Surname (Primer Apellido) *
          </label>
          <input
            type="text"
            value={guest.primerApellido}
            onChange={(e) => onUpdate(guest.id, { primerApellido: e.target.value.toUpperCase() })}
            placeholder="e.g. SMITH"
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 uppercase font-medium"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            2nd Surname (Segundo Apellido - Optional)
          </label>
          <input
            type="text"
            value={guest.segundoApellido}
            onChange={(e) => onUpdate(guest.id, { segundoApellido: e.target.value.toUpperCase() })}
            placeholder="e.g. GARCIA or empty"
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 uppercase"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Sex / Gender (Sexo) *
          </label>
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => onUpdate(guest.id, { sexo: 'M' })}
              className={`py-1 text-center font-bold rounded-md transition ${
                guest.sexo === 'M'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              M (Male)
            </button>
            <button
              type="button"
              onClick={() => onUpdate(guest.id, { sexo: 'F' })}
              className={`py-1 text-center font-bold rounded-md transition ${
                guest.sexo === 'F'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              F (Female)
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Date of Birth (YYYY-MM-DD) *
          </label>
          <input
            type="date"
            value={guest.fechaNacimiento}
            onChange={(e) => onUpdate(guest.id, { fechaNacimiento: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-slate-800"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Nationality (Country ISO-3) *
          </label>
          <select
            value={guest.paisNacionalidad}
            onChange={(e) => onUpdate(guest.id, { paisNacionalidad: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white font-mono"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.nameEn} ({c.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Document Type *
          </label>
          <select
            value={guest.tipoDocumento}
            onChange={(e) => onUpdate(guest.id, { tipoDocumento: e.target.value as DocumentType })}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
          >
            <option value="P">P - Passport (Pasaporte)</option>
            <option value="I">I - EU Identity Card / NIE (Carta de Identidad)</option>
            <option value="D">D - Spanish DNI (Documento Nacional)</option>
            <option value="C">C - Driver's License (Permiso de Conducir)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Document Number *
          </label>
          <input
            type="text"
            value={guest.numeroDocumento}
            onChange={(e) =>
              onUpdate(guest.id, { numeroDocumento: e.target.value.toUpperCase().replace(/\s/g, '') })
            }
            placeholder="e.g. NL8492018 or 12345678Z"
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 uppercase font-mono font-bold text-slate-900"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-semibold text-slate-700">
              Phone Number (Teléfono) *
            </label>
            {bookingPhone && guest.telefono !== bookingPhone && (
              <button
                type="button"
                onClick={() => onUpdate(guest.id, { telefono: bookingPhone })}
                className="text-[10px] text-red-600 hover:text-red-700 font-medium underline"
                title="Synchroniseer met het centrale telefoonnummer van de boeking"
              >
                Sync boeking
              </button>
            )}
          </div>
          <input
            type="tel"
            value={guest.telefono || ''}
            onChange={(e) => onUpdate(guest.id, { telefono: e.target.value })}
            placeholder={bookingPhone || '+31 6 12345678'}
            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-xs font-medium text-slate-900"
          />
          {guest.telefono && bookingPhone && guest.telefono === bookingPhone ? (
            <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
              ✓ Gesynchroniseerd met boeking
            </span>
          ) : !guest.telefono && bookingPhone ? (
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Gebruikt boeking: {bookingPhone}
            </span>
          ) : null}
        </div>

        <div
          className={`p-2.5 rounded-xl border transition ${
            missingNumSoporte
              ? 'bg-red-50/70 border-red-300 ring-1 ring-red-400'
              : guest.numSoporte
              ? 'bg-emerald-50/30 border-emerald-200'
              : 'bg-slate-50/50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <label className="font-bold text-slate-800 flex items-center gap-1 text-xs">
              <span>Num Soporte (Número de Soporte)</span>
              {isSpanishDoc ? (
                <span className="text-red-600 font-extrabold">*</span>
              ) : (
                <span className="text-slate-400 font-normal text-[10px]">(Optioneel)</span>
              )}
            </label>

            {onOpenNumSoporteModal && (
              <button
                type="button"
                onClick={() => onOpenNumSoporteModal(guest.id)}
                className="text-[10px] text-amber-700 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-1.5 py-0.5 rounded font-bold transition flex items-center gap-1 border border-amber-300"
                title="Open het speciale Num Soporte venster met visuele gids"
              >
                <CreditCard className="w-3 h-3" />
                <span>Venster &amp; Uitleg</span>
              </button>
            )}
          </div>

          <input
            type="text"
            value={guest.numSoporte || ''}
            onChange={(e) =>
              onUpdate(guest.id, { numSoporte: e.target.value.toUpperCase().replace(/\s/g, '') })
            }
            placeholder={
              isSpanishDoc
                ? 'bijv. IDESP004918 of E12345678'
                : 'bijv. IDESP... of Kaartnummer'
            }
            className={`w-full px-2.5 py-1.5 border rounded-lg outline-none uppercase font-mono font-bold text-xs ${
              missingNumSoporte
                ? 'border-red-400 bg-white text-slate-900 focus:ring-2 focus:ring-red-500'
                : 'border-slate-300 focus:ring-2 focus:ring-red-500 bg-white text-slate-900'
            }`}
          />

          {/* Quick prefix helper buttons */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            <span className="text-[9.5px] text-slate-400 font-medium">Snel:</span>
            <button
              type="button"
              onClick={() => {
                const cur = guest.numSoporte || '';
                if (!cur.startsWith('IDESP')) {
                  onUpdate(guest.id, { numSoporte: ('IDESP' + cur).toUpperCase() });
                }
              }}
              className="px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded"
              title="DNI Supportnummer (IDESP)"
            >
              +IDESP
            </button>
            <button
              type="button"
              onClick={() => {
                const cur = guest.numSoporte || '';
                if (!cur.startsWith('E')) {
                  onUpdate(guest.id, { numSoporte: ('E' + cur).toUpperCase() });
                }
              }}
              className="px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded"
              title="TIE Buitenlanders (E...)"
            >
              +E
            </button>
            <button
              type="button"
              onClick={() => {
                const cur = guest.numSoporte || '';
                if (!cur.startsWith('C')) {
                  onUpdate(guest.id, { numSoporte: ('C' + cur).toUpperCase() });
                }
              }}
              className="px-1.5 py-0.5 text-[9.5px] font-mono font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded"
              title="Certificado UE Groen (C...)"
            >
              +C
            </button>
          </div>

          {missingNumSoporte && (
            <p className="text-[10px] text-red-700 mt-1 font-semibold leading-tight">
              ⚠️ SES Fout voorkomen: [Ha de informar el número de soporte del documento.]
            </p>
          )}
        </div>

        <div>
          <label className="block font-medium text-slate-600 mb-1">
            Document Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={guest.fechaCaducidad || ''}
            onChange={(e) => onUpdate(guest.id, { fechaCaducidad: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-slate-700 text-xs"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-600 mb-1">
            Document Issue Date (Optional)
          </label>
          <input
            type="date"
            value={guest.fechaExpedicion || ''}
            onChange={(e) => onUpdate(guest.id, { fechaExpedicion: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-mono text-slate-700 text-xs"
          />
        </div>

        {guest.notes && (
          <div className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{guest.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
