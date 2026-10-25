import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  Upload,
  Search,
  BookOpen,
  User,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Sparkles,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ArchivedBooking, Guest, PropertySettings } from '../types';
import { getCountryByCode } from '../utils/countries';

interface AnnualRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  archive: ArchivedBooking[];
  onUpdateArchive: (updated: ArchivedBooking[]) => void;
  currentProperty: PropertySettings;
  properties?: PropertySettings[];
}

export const AnnualRegisterModal: React.FC<AnnualRegisterModalProps> = ({
  isOpen,
  onClose,
  archive,
  onUpdateArchive,
  currentProperty,
  properties = [],
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(currentYear);
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'table' | 'official-print'>('table');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Available years from archive plus current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);
    archive.forEach((item) => {
      if (item.year) yearsSet.add(item.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [archive, currentYear]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return archive.filter((item) => {
      const matchesYear = selectedYear === 'all' || item.year === selectedYear;
      if (!matchesYear) return false;

      const matchesProp =
        selectedPropertyFilter === 'all' ||
        item.property.codigoEstablecimiento === selectedPropertyFilter ||
        item.property.nombreEstablecimiento === selectedPropertyFilter ||
        (item.property as any).id === selectedPropertyFilter;
      if (!matchesProp) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();

      const matchesRef = item.referenciaReserva.toLowerCase().includes(term);
      const matchesGuest = item.guests.some(
        (g) =>
          g.nombre.toLowerCase().includes(term) ||
          g.primerApellido.toLowerCase().includes(term) ||
          (g.segundoApellido && g.segundoApellido.toLowerCase().includes(term)) ||
          g.numeroDocumento.toLowerCase().includes(term) ||
          (g.numSoporte && g.numSoporte.toLowerCase().includes(term)) ||
          g.paisNacionalidad.toLowerCase().includes(term)
      );

      return matchesRef || matchesGuest;
    });
  }, [archive, selectedYear, selectedPropertyFilter, searchTerm]);

  // Total guests in filtered set
  const totalGuests = useMemo(() => {
    return filteredBookings.reduce((acc, curr) => acc + curr.guests.length, 0);
  }, [filteredBookings]);

  // Nationalities summary
  const topNationalities = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      b.guests.forEach((g) => {
        const country = g.paisNacionalidad || 'UNK';
        counts[country] = (counts[country] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [filteredBookings]);

  if (!isOpen) return null;

  // Export annual CSV
  const handleExportCsv = () => {
    const headers = [
      'Nº Orden',
      'Año',
      'Referencia Reserva',
      'Fecha Entrada',
      'Hora Entrada',
      'Fecha Salida',
      'Establecimiento',
      'Código Establecimiento',
      '1º Apellido',
      '2º Apellido',
      'Nombre',
      'Sexo',
      'Tipo Doc',
      'Número Documento',
      'Nº Soporte',
      'Fecha Nacimiento',
      'Nacionalidad',
      'Fecha Expedición',
      'Fecha Caducidad',
    ];

    const rows: string[][] = [];
    let orderNum = 1;

    filteredBookings.forEach((b) => {
      b.guests.forEach((g) => {
        rows.push([
          String(orderNum++),
          String(b.year),
          `"${b.referenciaReserva}"`,
          b.fechaEntrada,
          b.horaEntrada || '15:00',
          b.fechaSalida,
          `"${b.property.nombreEstablecimiento}"`,
          b.property.codigoEstablecimiento,
          `"${g.primerApellido}"`,
          `"${g.segundoApellido || ''}"`,
          `"${g.nombre}"`,
          g.sexo,
          g.tipoDocumento,
          `"${g.numeroDocumento}"`,
          `"${g.numSoporte || ''}"`,
          g.fechaNacimiento,
          g.paisNacionalidad,
          g.fechaExpedicion || '',
          g.fechaCaducidad || '',
        ]);
      });
    });

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `LIBRO_REGISTRO_VIAJEROS_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export JSON backup
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(archive, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SES_ARCHIVE_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          // Merge with existing avoiding duplicate IDs
          const existingIds = new Set(archive.map((a) => a.id));
          const newEntries = parsed.filter((item: any) => item.id && !existingIds.has(item.id));
          const merged = [...archive, ...newEntries];
          onUpdateArchive(merged);
          alert(`Successfully imported ${newEntries.length} booking records!`);
        } else {
          alert('Invalid archive file structure.');
        }
      } catch (err) {
        alert('Could not read archive file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete single entry
  const handleDeleteEntry = (id: string) => {
    if (window.confirm('Are you sure you want to remove this booking from the annual register?')) {
      onUpdateArchive(archive.filter((a) => a.id !== id));
    }
  };

  // Seed sample historical data (2025 & 2026)
  const handleSeedHistorical = () => {
    const sampleYear2025: ArchivedBooking[] = [
      {
        id: 'arch-2025-01',
        year: 2025,
        referenciaReserva: 'AIRBNB-HM84102',
        fechaEntrada: '2025-06-12',
        horaEntrada: '15:00',
        fechaSalida: '2025-06-19',
        property: currentProperty,
        createdAt: '2025-06-12T15:00:00.000Z',
        guests: [
          {
            id: 'g-25-1',
            nombre: 'MARK',
            primerApellido: 'DE VRIES',
            segundoApellido: '',
            sexo: 'M',
            fechaNacimiento: '1985-04-18',
            paisNacionalidad: 'NLD',
            tipoDocumento: 'P',
            numeroDocumento: 'NL9841028',
            fechaCaducidad: '2030-05-10',
            mrzValid: true,
            confidence: 'high',
          },
          {
            id: 'g-25-2',
            nombre: 'ANOUK',
            primerApellido: 'DE VRIES',
            segundoApellido: 'BAKKER',
            sexo: 'F',
            fechaNacimiento: '1987-11-23',
            paisNacionalidad: 'NLD',
            tipoDocumento: 'I',
            numeroDocumento: 'IB8491029',
            fechaCaducidad: '2032-02-14',
            mrzValid: true,
            confidence: 'high',
          },
        ],
      },
      {
        id: 'arch-2025-02',
        year: 2025,
        referenciaReserva: 'BOOKING-9182390',
        fechaEntrada: '2025-08-01',
        horaEntrada: '16:00',
        fechaSalida: '2025-08-10',
        property: currentProperty,
        createdAt: '2025-08-01T16:00:00.000Z',
        guests: [
          {
            id: 'g-25-3',
            nombre: 'EMMA',
            primerApellido: 'PEETERS',
            segundoApellido: '',
            sexo: 'F',
            fechaNacimiento: '1993-07-09',
            paisNacionalidad: 'BEL',
            tipoDocumento: 'P',
            numeroDocumento: 'BE8491032',
            fechaCaducidad: '2031-09-12',
            mrzValid: true,
            confidence: 'high',
          },
          {
            id: 'g-25-4',
            nombre: 'THOMAS',
            primerApellido: 'CLAES',
            segundoApellido: '',
            sexo: 'M',
            fechaNacimiento: '1990-12-14',
            paisNacionalidad: 'BEL',
            tipoDocumento: 'P',
            numeroDocumento: 'BE3928109',
            fechaCaducidad: '2030-10-20',
            mrzValid: true,
            confidence: 'high',
          },
        ],
      },
      {
        id: 'arch-2025-03',
        year: 2025,
        referenciaReserva: 'VRBO-774912',
        fechaEntrada: '2025-10-14',
        horaEntrada: '14:30',
        fechaSalida: '2025-10-21',
        property: currentProperty,
        createdAt: '2025-10-14T14:30:00.000Z',
        guests: [
          {
            id: 'g-25-5',
            nombre: 'JAMES',
            primerApellido: 'WILSON',
            segundoApellido: '',
            sexo: 'M',
            fechaNacimiento: '1982-03-30',
            paisNacionalidad: 'GBR',
            tipoDocumento: 'P',
            numeroDocumento: 'GB5928104',
            fechaCaducidad: '2029-08-15',
            mrzValid: true,
            confidence: 'high',
          },
        ],
      },
    ];

    const sampleYear2026: ArchivedBooking[] = [
      {
        id: 'arch-2026-01',
        year: 2026,
        referenciaReserva: 'AIRBNB-HM98412',
        fechaEntrada: '2026-03-10',
        horaEntrada: '16:00',
        fechaSalida: '2026-03-17',
        property: currentProperty,
        createdAt: '2026-03-10T16:00:00.000Z',
        guests: [
          {
            id: 'g-26-1',
            nombre: 'TRISTAN',
            primerApellido: 'ROBERS',
            segundoApellido: '',
            sexo: 'M',
            fechaNacimiento: '1988-06-14',
            paisNacionalidad: 'NLD',
            tipoDocumento: 'P',
            numeroDocumento: 'NL8849102',
            fechaCaducidad: '2031-04-10',
            mrzValid: true,
            confidence: 'high',
          },
          {
            id: 'g-26-2',
            nombre: 'SOPHIE',
            primerApellido: 'VAN DEN BERG',
            segundoApellido: '',
            sexo: 'F',
            fechaNacimiento: '1991-09-22',
            paisNacionalidad: 'NLD',
            tipoDocumento: 'I',
            numeroDocumento: 'IBA781920',
            fechaCaducidad: '2032-01-15',
            mrzValid: true,
            confidence: 'high',
          },
        ],
      },
    ];

    onUpdateArchive([...sampleYear2025, ...sampleYear2026]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh] text-slate-800">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Libro-Registro Anual (RD 933/2021)</h3>
                <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                  3-Year Legal Retention
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official guest registration archive for Spanish police &amp; tourism audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload previous backup file"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Archive</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              title="Download entire JSON backup"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition p-1.5 ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
          {/* Year selector & Search */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Apartment Filter */}
            {properties.length > 1 && (
              <select
                value={selectedPropertyFilter}
                onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none text-slate-800 shadow-sm focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Apartments</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.codigoEstablecimiento || p.id}>
                    {p.nombreEstablecimiento}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setSelectedYear('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  selectedYear === 'all'
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Years
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    selectedYear === yr
                      ? 'bg-red-600 text-white shadow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guest, surname, doc number, ref..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 font-medium"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView(activeView === 'table' ? 'official-print' : 'table')}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>{activeView === 'table' ? 'Official Print View' : 'Table View'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={filteredBookings.length === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export {selectedYear === 'all' ? 'All' : selectedYear} CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredBookings.length === 0}
              className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Stats banner */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between flex-wrap gap-3 text-xs print:hidden">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Year: </span>
              <strong className="text-slate-900 font-bold">{selectedYear === 'all' ? 'All Years' : selectedYear}</strong>
            </div>
            <div>
              <span className="text-slate-500">Stays: </span>
              <strong className="text-slate-900 font-bold">{filteredBookings.length}</strong>
            </div>
            <div>
              <span className="text-slate-500">Total Travelers: </span>
              <strong className="text-slate-900 font-bold">{totalGuests}</strong>
            </div>
          </div>

          {topNationalities.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Nationalities:</span>
              <div className="flex gap-1.5">
                {topNationalities.map(([code, count]) => {
                  const country = getCountryByCode(code);
                  return (
                    <span
                      key={code}
                      className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <span>{country?.flag || '🌐'}</span>
                      <span>{code}</span>
                      <span className="text-slate-400 font-mono text-[10px]">({count})</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/60 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">
                  No guest registrations found for {selectedYear === 'all' ? 'any year' : selectedYear}
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Whenever you scan and download an XML file for a booking, it can be saved directly into your annual register!
                </p>
              </div>
              <button
                type="button"
                onClick={handleSeedHistorical}
                className="mt-2 inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Load Sample Historical Bookings (2025 &amp; 2026)</span>
              </button>
            </div>
          ) : activeView === 'table' ? (
            /* Table View */
            <div className="space-y-4">
              {filteredBookings.map((b, bIdx) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{bIdx + 1}
                      </span>
                      <strong className="text-slate-900 font-mono text-sm">
                        {b.referenciaReserva}
                      </strong>
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold">
                        {b.fechaEntrada} &rarr; {b.fechaSalida}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">
                        {b.guests.length} {b.guests.length === 1 ? 'traveler' : 'travelers'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(b.id)}
                        title="Delete from register"
                        className="text-slate-400 hover:text-red-600 transition p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Guests in this stay */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {b.guests.map((g, gIdx) => {
                      const country = getCountryByCode(g.paisNacionalidad);
                      return (
                        <div
                          key={g.id || gIdx}
                          className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">
                              {g.primerApellido}, {g.nombre}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {country?.flag || '🌐'} {g.paisNacionalidad}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-600 font-mono">
                            <span>
                              [{g.tipoDocumento}] {g.numeroDocumento}
                              {g.numSoporte && <span className="text-amber-700 ml-1">({g.numSoporte})</span>}
                            </span>
                            <span>{g.sexo === 'M' ? 'Male' : 'Female'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            DOB: {g.fechaNacimiento}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Official Printable View (Libro-Registro Official Format) */
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 space-y-6">
              <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                    LIBRO-REGISTRO DE ENTRADA DE VIAJEROS
                  </h2>
                  <p className="text-xs text-slate-600 font-semibold">
                    REAL DECRETO 933/2021 &bull; REGISTRO DOCUMENTAL DE HOSPEDAJE
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    AÑO DE REGISTRO: <strong>{selectedYear === 'all' ? 'TODOS' : selectedYear}</strong>
                  </p>
                </div>
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-900">
                    {currentProperty.nombreEstablecimiento}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    CÓDIGO: {currentProperty.codigoEstablecimiento || 'H03-1284920'}
                  </div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    NIF/NIE: {currentProperty.codigoArrendador || '-'}
                  </div>
                </div>
              </div>

              {/* Printable Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                      <th className="p-2 border-r border-slate-300">Nº</th>
                      <th className="p-2 border-r border-slate-300">Fecha Entrada</th>
                      <th className="p-2 border-r border-slate-300">Apellidos y Nombre</th>
                      <th className="p-2 border-r border-slate-300">Sexo</th>
                      <th className="p-2 border-r border-slate-300">Doc / Nº</th>
                      <th className="p-2 border-r border-slate-300">Nacionalidad</th>
                      <th className="p-2 border-r border-slate-300">F. Nacimiento</th>
                      <th className="p-2 border-r border-slate-300">Ref. Reserva</th>
                      <th className="p-2">Firma / Conforme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.flatMap((b) =>
                      b.guests.map((g, idx) => (
                        <tr key={`${b.id}-${idx}`} className="border-b border-slate-200">
                          <td className="p-2 border-r border-slate-300 font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {b.fechaEntrada}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-bold">
                            {g.primerApellido} {g.segundoApellido || ''}, {g.nombre}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-center">{g.sexo}</td>
                          <td className="p-2 border-r border-slate-300 font-mono font-bold">
                            [{g.tipoDocumento}] {g.numeroDocumento}
                          </td>
                          <td className="p-2 border-r border-slate-300">{g.paisNacionalidad}</td>
                          <td className="p-2 border-r border-slate-300 font-mono">
                            {g.fechaNacimiento}
                          </td>
                          <td className="p-2 border-r border-slate-300 font-mono text-slate-600">
                            {b.referenciaReserva}
                          </td>
                          <td className="p-2 text-slate-400 italic text-[10px]">Firmado en Parte</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-200">
                El presente libro-registro cumple con las obligaciones estipuladas en el Real Decreto 933/2021 de 26 de octubre, por el que se establecen las obligaciones de registro documental e información de las personas físicas o jurídicas que ejercen actividades de hospedaje y alquiler de vehículos de motor.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center print:hidden">
          <p className="text-xs text-slate-500">
            Total of <strong>{filteredBookings.length}</strong> bookings ({totalGuests} travelers) recorded.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
