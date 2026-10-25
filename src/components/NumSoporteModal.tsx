import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Save,
  Download,
  Info,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { Guest, DocumentType } from '../types';
import { mapTipoDocumento, isSpanishOrNieDoc } from '../utils/xmlGenerator';
import { getCountryByCode } from '../utils/countries';

interface NumSoporteModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  onSaveGuests: (updatedGuests: Guest[]) => void;
  onDownloadXml?: () => void;
  targetGuestId?: string;
}

export const NumSoporteModal: React.FC<NumSoporteModalProps> = ({
  isOpen,
  onClose,
  guests,
  onSaveGuests,
  onDownloadXml,
  targetGuestId,
}) => {
  // Local state for editing guest soporte numbers
  const [localGuests, setLocalGuests] = useState<Guest[]>(guests);
  const [activeTab, setActiveTab] = useState<'form' | 'guide'>('form');

  useEffect(() => {
    if (isOpen) {
      setLocalGuests(guests);
    }
  }, [isOpen, guests]);

  if (!isOpen) return null;

  const handleUpdateNumSoporte = (id: string, value: string) => {
    const clean = value.toUpperCase().replace(/\s/g, '');
    setLocalGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, numSoporte: clean } : g))
    );
  };

  const handleApplyPrefix = (id: string, prefix: string) => {
    setLocalGuests((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const current = g.numSoporte || '';
        // If current already starts with prefix, don't duplicate
        if (current.startsWith(prefix)) return g;
        return { ...g, numSoporte: `${prefix}${current}`.toUpperCase() };
      })
    );
  };

  const handleSave = (andDownload = false) => {
    onSaveGuests(localGuests);
    if (andDownload && onDownloadXml) {
      onDownloadXml();
    }
    onClose();
  };

  const missingSpanishCount = localGuests.filter(
    (g) => isSpanishOrNieDoc(g) && (!g.numSoporte || !g.numSoporte.trim())
  ).length;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto text-slate-800 max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Num Soporte Invoervenster (Número de Soporte)
                </h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  RD 933/2021
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Verplicht veld voor Spaanse autoriteiten (SES.HOSPEDAJES / Ministerio del Interior)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Error Banner (highlighting the exact portal error message) */}
        <div className="bg-red-50 border-b border-red-200 p-3.5 sm:px-5 flex items-start gap-3 text-red-950 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-mono font-bold text-red-800 bg-red-100/80 px-2 py-0.5 rounded inline-block text-[11px] border border-red-200">
              Error de validación en la comunicación [1]: [Ha de informar el número de soporte del documento.]
            </div>
            <p className="text-slate-700 leading-relaxed text-[11.5px]">
              <strong>Waarom deze melding verschijnt:</strong> Het Spaanse ministerie keurt het XML-bestand af als voor een Spaans document (DNI, NIE of verblijfskaart) het fysieke kaartnummer (<strong>Número de Soporte</strong>) niet is ingevuld in de XML tag <code className="bg-red-100 px-1 py-0.5 rounded text-red-900 font-mono text-[10.5px]">&lt;numSoporte&gt;</code>.
            </p>
          </div>
        </div>

        {/* Tab switcher: Quick form vs Visual guide */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`py-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'form'
                ? 'border-red-600 text-red-600 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Num Soporte Invullen ({localGuests.length} gasten)</span>
            {missingSpanishCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {missingSpanishCount} ontbreekt
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-2 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-red-600 text-red-600 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Waar vind ik het Num Soporte? (Visuele gids)</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'form' ? (
            <div className="space-y-4">
              {localGuests.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Er zijn momenteel geen gasten geregistreerd. Voeg eerst gasten toe of laad demo-gasten.
                </div>
              ) : (
                localGuests.map((guest, idx) => {
                  const country = getCountryByCode(guest.paisNacionalidad);
                  const isSpanish = isSpanishOrNieDoc(guest);
                  const isMissing = isSpanish && (!guest.numSoporte || !guest.numSoporte.trim());
                  const officialDocType = mapTipoDocumento(guest);
                  const isTarget = targetGuestId === guest.id;

                  return (
                    <div
                      key={guest.id}
                      className={`p-4 rounded-xl border transition space-y-3 ${
                        isTarget
                          ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-400'
                          : isMissing
                          ? 'border-red-300 bg-red-50/20'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono text-xs flex items-center justify-center font-bold">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 text-xs">
                            {guest.primerApellido} {guest.segundoApellido || ''}, {guest.nombre}
                          </span>
                          <span className="text-slate-500 text-xs flex items-center gap-1 font-medium">
                            <span>{country?.flag || '🌐'}</span>
                            <span>{country?.nameEn || guest.paisNacionalidad}</span>
                          </span>
                          <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                            {guest.tipoDocumento} &bull; {guest.numeroDocumento || 'GEEN DOC NR'}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded">
                            Schema: {officialDocType}
                          </span>
                        </div>

                        <div>
                          {isMissing ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                              <AlertTriangle className="w-3 h-3 text-red-600" /> Num Soporte Vereist!
                            </span>
                          ) : guest.numSoporte?.trim() ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ingevuld ({guest.numSoporte})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Optioneel voor {guest.paisNacionalidad} Paspoort
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Input row */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        <div className="md:col-span-6">
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                            <span>
                              Num Soporte (Número de Soporte){' '}
                              {isSpanish && <span className="text-red-500">*</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Geen spaties, alleen hoofdletters/cijfers
                            </span>
                          </label>
                          <input
                            type="text"
                            value={guest.numSoporte || ''}
                            onChange={(e) => handleUpdateNumSoporte(guest.id, e.target.value)}
                            placeholder={
                              officialDocType === 'NIF'
                                ? 'bijv. IDESP004918 of 9 cijfers'
                                : officialDocType === 'NIE'
                                ? 'bijv. E12345678 (TIE) of C12345678 (Groen)'
                                : 'bijv. Kaartnummer of IDESP...'
                            }
                            className={`w-full px-3 py-2 border rounded-xl outline-none uppercase font-mono font-bold text-xs ${
                              isMissing
                                ? 'border-red-400 bg-red-50/50 focus:ring-2 focus:ring-red-500 text-slate-900 ring-1 ring-red-300'
                                : 'border-slate-300 focus:ring-2 focus:ring-red-500 text-slate-900'
                            }`}
                          />
                        </div>

                        {/* Quick Format Help Buttons */}
                        <div className="md:col-span-6 space-y-1">
                          <span className="text-[10px] font-semibold text-slate-500 block">
                            Snelle opmaakhulp (klik om prefix toe te voegen):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleApplyPrefix(guest.id, 'IDESP')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-mono font-bold border border-slate-300 transition"
                              title="Voor Spaans DNI (begint met IDESP)"
                            >
                              + IDESP... (DNI)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyPrefix(guest.id, 'E')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-mono font-bold border border-slate-300 transition"
                              title="Voor TIE / Buitenlandse Verblijfskaart (begint met E)"
                            >
                              + E... (TIE/NIE)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyPrefix(guest.id, 'C')}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-mono font-bold border border-slate-300 transition"
                              title="Voor EU Certificaat / Groen briefje (begint met C)"
                            >
                              + C... (Cert. UE)
                            </button>
                            {guest.numeroDocumento && (
                              <button
                                type="button"
                                onClick={() => handleUpdateNumSoporte(guest.id, guest.numeroDocumento)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[10px] font-mono font-semibold border border-amber-300 transition"
                                title="Gebruik documentnummer als ondersteuningsnummer"
                              >
                                Gebruik Doc Nº
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error helper callout when missing */}
                      {isMissing && (
                        <div className="text-[11px] text-red-700 bg-red-100/60 p-2 rounded-lg border border-red-200 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                          <span>
                            Dit Spaanse document (DNI/NIE) heeft nog geen Num Soporte. Zonder dit nummer geeft het portaal de foutmelding: [Ha de informar el número de soporte del documento.]
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Visual Guide Tab */
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 space-y-2">
                <h4 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Wat is het &quot;Número de Soporte&quot; in Spanje?
                </h4>
                <p className="leading-relaxed">
                  Het <strong>Número de Soporte</strong> is het fysieke productienummer van de identiteitskaart (het serienummer van het plastic pasje of certificaat), onderscheiden van het persoonsgebonden DNI/NIE-nummer. Het Ministerie van Binnenlandse Zaken (Ministerio del Interior) gebruikt dit om te controleren of het pasje niet als gestolen of verloren geregistreerd staat.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* DNI 3.0/4.0 Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                    DNI
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">1. Spaans DNI (3.0 of 4.0)</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Op de <strong>voorkant</strong> van de kaart, direct onder de foto of bij de chip.
                  </p>
                  <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800">
                    Begint met: <strong className="text-red-600">IDESP</strong> + cijfers (bv. IDESP004918) of 9 alfanumerieke tekens onder &quot;NUM SOPORTE&quot;.
                  </div>
                </div>

                {/* TIE Card */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    TIE
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">2. TIE (Verblijfskaart Buitenlanders)</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Voor buitenlanders met verblijfsvergunning in Spanje. Staat rechtsboven op de kaart.
                  </p>
                  <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800">
                    Begint met de letter: <strong className="text-amber-700">E</strong> gevolgd door 8 cijfers (bv. E12345678).
                  </div>
                </div>

                {/* Certificado UE (Green paper) */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    UE
                  </div>
                  <h5 className="font-bold text-slate-900 text-xs">3. Groen Certificaat UE (NIE)</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Het groene papiertje / kaartje van EU-burgers (Nederlanders, Belgen) woonachtig in Spanje.
                  </p>
                  <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800">
                    Begint met de letter: <strong className="text-emerald-700">C</strong> gevolgd door 8 cijfers (bv. C12345678).
                  </div>
                </div>
              </div>

              {/* International guests info */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                <strong>Internationale toeristen (Nederlands/Belgisch paspoort):</strong> Toeristen met een gewoon buitenlands paspoort (<code className="font-mono bg-white px-1 py-0.5 rounded">&lt;tipoDocumento&gt;PAS&lt;/tipoDocumento&gt;</code>) hebben meestal geen Spaanse Número de Soporte nodig. Het portaal vereist Num Soporte specifiek wanneer het type <strong>NIF</strong> of <strong>NIE</strong> is.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            {missingSpanishCount > 0 ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Let op: nog {missingSpanishCount} Spaanse gast(en) zonder Num Soporte!
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                Alle verplichte documenten hebben een Número de Soporte.
              </span>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition"
            >
              Annuleren
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Opslaan &amp; Toepassen</span>
            </button>

            {onDownloadXml && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 hover:from-red-500 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs transition shadow flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Opslaan &amp; XML Downloaden</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
