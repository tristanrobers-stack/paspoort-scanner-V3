import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  FileCode,
  Download,
  Copy,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  Printer,
  HelpCircle,
  Play,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Guest, PropertySettings, BookingData, DocumentType, ArchivedBooking } from './types';
import { Header } from './components/Header';
import { GuestCard } from './components/GuestCard';
import { SettingsModal } from './components/SettingsModal';
import { CameraModal } from './components/CameraModal';
import { ParteViajerosModal } from './components/ParteViajerosModal';
import { PortalGuide } from './components/PortalGuide';
import { AnnualRegisterModal } from './components/AnnualRegisterModal';
import { generateSesXml, generateSesCsv } from './utils/xmlGenerator';
import { parseAndValidateMrz } from './utils/mrzValidator';
import { compressImageForOcr } from './utils/imageCompressor';
import { SAMPLE_PROPERTY, SAMPLE_BOOKING, SAMPLE_GUESTS } from './utils/sampleData';

const DEFAULT_PROPERTIES: PropertySettings[] = [
  {
    id: 'prop-leticia',
    codigoEstablecimiento: '0000472036',
    codigoArrendador: '',
    nombreEstablecimiento: 'LETICIA - Apartment',
    municipio: 'Alicante',
    provincia: 'Alicante',
    direccion: '',
  },
  {
    id: 'prop-schoonouders',
    codigoEstablecimiento: '',
    codigoArrendador: '',
    nombreEstablecimiento: 'Second Apartment (In-Laws)',
    municipio: 'Torrevieja',
    provincia: 'Alicante',
    direccion: '',
  },
];

const DEFAULT_BOOKING: BookingData = {
  referenciaReserva: 'AIRBNB-' + Math.floor(100000 + Math.random() * 900000),
  fechaEntrada: new Date().toISOString().split('T')[0],
  horaEntrada: '15:00',
  fechaSalida: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  numeroPersonas: 1,
  tipoPago: 'PLATF',
  medioPago: 'PLATAFORMA VIRTUAL',
};

interface QueueFileItem {
  id: string;
  name: string;
  file?: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  errorMsg?: string;
}

export default function App() {
  // Multi-property state
  const [properties, setProperties] = useState<PropertySettings[]>(() => {
    try {
      const saved = localStorage.getItem('ses_properties_list_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const oldSingle = localStorage.getItem('ses_property_v2');
      if (oldSingle) {
        const parsedOld = JSON.parse(oldSingle);
        if (parsedOld && parsedOld.codigoEstablecimiento) {
          return [
            { ...parsedOld, id: 'prop-leticia' },
            DEFAULT_PROPERTIES[1],
          ];
        }
      }
      return DEFAULT_PROPERTIES;
    } catch {
      return DEFAULT_PROPERTIES;
    }
  });

  const [activePropertyId, setActivePropertyId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('ses_active_property_id_v2');
      if (savedId) return savedId;
    } catch {}
    return 'prop-leticia';
  });

  const property =
    properties.find((p) => p.id === activePropertyId) || properties[0] || DEFAULT_PROPERTIES[0];

  const [booking, setBooking] = useState<BookingData>(() => {
    try {
      const saved = localStorage.getItem('ses_booking_v2');
      return saved ? JSON.parse(saved) : DEFAULT_BOOKING;
    } catch {
      return DEFAULT_BOOKING;
    }
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    try {
      const saved = localStorage.getItem('ses_guests_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isParteOpen, setIsParteOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnnualRegisterOpen, setIsAnnualRegisterOpen] = useState(false);

  // Annual register / historical archive state
  const [archive, setArchive] = useState<ArchivedBooking[]>(() => {
    try {
      const saved = localStorage.getItem('ses_archive_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active view tab for output
  const [outputTab, setOutputTab] = useState<'xml' | 'csv'>('xml');

  // Copy feedback
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Batch queue state
  const [queue, setQueue] = useState<QueueFileItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Server health
  const [hasServerAi, setHasServerAi] = useState(true);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ses_property_v2', JSON.stringify(property));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [property]);

  useEffect(() => {
    try {
      localStorage.setItem('ses_booking_v2', JSON.stringify(booking));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [booking]);

  useEffect(() => {
    try {
      localStorage.setItem('ses_guests_v2', JSON.stringify(guests));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [guests]);

  useEffect(() => {
    try {
      localStorage.setItem('ses_archive_v2', JSON.stringify(archive));
    } catch (e) {
      console.warn('Archive storage error:', e);
    }
  }, [archive]);

  // Save current booking into annual register archive
  const saveBookingToArchive = () => {
    if (guests.length === 0) return;
    const yearParsed = parseInt(
      booking.fechaEntrada?.split('-')[0] || String(new Date().getFullYear()),
      10
    );
    const validYear = isNaN(yearParsed) ? new Date().getFullYear() : yearParsed;

    const newArchived: ArchivedBooking = {
      id: 'arch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      year: validYear,
      referenciaReserva: booking.referenciaReserva || 'RES-' + Date.now(),
      fechaEntrada: booking.fechaEntrada || new Date().toISOString().split('T')[0],
      horaEntrada: booking.horaEntrada || '15:00',
      fechaSalida: booking.fechaSalida || new Date().toISOString().split('T')[0],
      property,
      guests: [...guests],
      createdAt: new Date().toISOString(),
    };

    setArchive((prev) => {
      // Overwrite if same reference already exists in archive
      const filtered = prev.filter((b) => b.referenciaReserva !== newArchived.referenciaReserva);
      return [newArchived, ...filtered];
    });
  };

  // Check server health on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setHasServerAi(Boolean(data.hasGeminiKey));
        }
      })
      .catch(() => {
        setHasServerAi(true);
      });
  }, []);

  // Update booking field
  const updateBooking = (field: keyof BookingData, value: any) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  };

  // Guest operations
  const handleUpdateGuest = (id: string, updated: Partial<Guest>) => {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...updated } : g)));
  };

  const handleDeleteGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const handleDuplicateGuest = (guest: Guest) => {
    const duplicated: Guest = {
      ...guest,
      id: 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      numeroDocumento: guest.numeroDocumento + '_COPY',
    };
    setGuests((prev) => [...prev, duplicated]);
  };

  const handleAddManualGuest = () => {
    const newGuest: Guest = {
      id: 'guest-' + Date.now(),
      nombre: '',
      primerApellido: '',
      segundoApellido: '',
      sexo: 'M',
      fechaNacimiento: '1990-01-01',
      paisNacionalidad: 'NLD',
      tipoDocumento: 'P',
      numeroDocumento: '',
      numSoporte: '',
      fechaExpedicion: '',
      fechaCaducidad: '',
      paisExpedicion: 'NLD',
    };
    setGuests((prev) => [...prev, newGuest]);
  };

  const handleClearAllGuests = () => {
    if (guests.length > 0 && window.confirm('Are you sure you want to clear all registered guests?')) {
      setGuests([]);
    }
  };

  // Load sample demo data
  const handleLoadDemoData = () => {
    setActivePropertyId('prop-leticia');
    setBooking(SAMPLE_BOOKING);
    setGuests(SAMPLE_GUESTS);
  };

  // Process a document (PDF or image) via backend API
  const processDocumentScan = async (
    base64Data: string,
    fileName = 'Document',
    explicitMimeType?: string
  ): Promise<Guest[]> => {
    let detectedMime = explicitMimeType;
    if (!detectedMime) {
      const match = base64Data.match(/^data:([a-zA-Z0-9/+-]+);base64,/);
      if (match) {
        detectedMime = match[1];
      } else if (fileName.toLowerCase().endsWith('.pdf')) {
        detectedMime = 'application/pdf';
      } else {
        detectedMime = 'image/jpeg';
      }
    }
    const isPdf = detectedMime.includes('pdf');

    // Automatically downscale high-res photos on client side to avoid Vercel 413 (Payload Too Large)
    let payloadBase64 = base64Data;
    let payloadMime = detectedMime;
    if (!isPdf) {
      try {
        const compressed = await compressImageForOcr(base64Data);
        if (compressed.base64) {
          payloadBase64 = compressed.base64;
          payloadMime = compressed.mimeType;
        }
      } catch (compErr) {
        console.warn('Client image compression skipped:', compErr);
      }
    }

    const response = await fetch('/api/scan-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: payloadBase64,
        mimeType: payloadMime,
      }),
    });

    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson.error) {
          errorMsg = errJson.error;
        }
      } catch {
        try {
          const errText = await response.text();
          if (errText && errText.length < 200) {
            errorMsg = errText;
          }
        } catch {}
      }
      if (response.status === 413) {
        errorMsg = 'File is too large for the server. The image has been automatically compressed, please try again.';
      } else if (response.status === 500 && errorMsg.includes('500')) {
        errorMsg = 'AI processing timeout or error. Check that GEMINI_API_KEY is configured in Vercel settings.';
      }
      throw new Error(errorMsg);
    }

    const resData = await response.json();
    if (!resData.success) {
      throw new Error(resData.error || 'Failed to analyze document');
    }

    // Support multiple travelers per document (e.g. multi-page PDF booking or family scan)
    const travelersList =
      resData.travelers && resData.travelers.length > 0
        ? resData.travelers
        : resData.data
        ? [resData.data]
        : [];

    if (travelersList.length === 0) {
      throw new Error('No traveler identity data found in document');
    }

    return travelersList.map((d: any, idx: number) => {
      // Check MRZ if returned
      let mrzValid = false;
      if (d.mrzLines && Array.isArray(d.mrzLines) && d.mrzLines.length > 0) {
        const mrzResult = parseAndValidateMrz(d.mrzLines);
        if (mrzResult) {
          mrzValid = mrzResult.isValid;
        }
      }

      return {
        id: 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5) + '-' + idx,
        imagePreview: base64Data.startsWith('data:')
          ? base64Data
          : `data:${detectedMime};base64,${base64Data}`,
        fileType: isPdf ? 'pdf' : 'image',
        fileName,
        nombre: (d.nombre || '').toUpperCase().trim(),
        primerApellido: (d.primerApellido || '').toUpperCase().trim(),
        segundoApellido: (d.segundoApellido || '').toUpperCase().trim(),
        sexo: d.sexo === 'F' ? 'F' : 'M',
        fechaNacimiento: d.fechaNacimiento || '1990-01-01',
        paisNacionalidad: (d.paisNacionalidad || 'NLD').toUpperCase().trim(),
        tipoDocumento: (d.tipoDocumento as DocumentType) || 'P',
        numeroDocumento: (d.numeroDocumento || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
        numSoporte: (d.numSoporte || '').toUpperCase().replace(/[^A-Z0-9]/g, ''),
        fechaExpedicion: d.fechaExpedicion || '',
        fechaCaducidad: d.fechaCaducidad || '',
        paisExpedicion: (d.paisExpedicion || d.paisNacionalidad || 'NLD').toUpperCase().trim(),
        mrzLines: d.mrzLines,
        mrzValid,
        confidence: d.confidence || 'high',
        notes:
          d.notes ||
          (isPdf
            ? `${fileName} (PDF): Traveler ${idx + 1} processed`
            : `${fileName} successfully processed`),
      };
    });
  };

  // Handle batch file upload
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    const initialQueue: QueueFileItem[] = files.map((f, i) => ({
      id: `queue-${Date.now()}-${i}`,
      name: f.name,
      file: f,
      status: 'pending',
    }));

    setQueue(initialQueue);
    setIsProcessingQueue(true);

    const newGuestsList: Guest[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const queueId = initialQueue[i].id;

      // Update status to processing
      setQueue((prev) =>
        prev.map((item) => (item.id === queueId ? { ...item, status: 'processing' } : item))
      );

      try {
        const base64 = await fileToBase64(file);
        const parsedGuests = await processDocumentScan(base64, file.name, file.type);
        newGuestsList.push(...parsedGuests);

        setQueue((prev) =>
          prev.map((item) => (item.id === queueId ? { ...item, status: 'success' } : item))
        );
      } catch (err: any) {
        console.error('File scan error:', file.name, err);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === queueId
              ? { ...item, status: 'error', errorMsg: err.message || 'Scanning failed' }
              : item
          )
        );
      }
    }

    if (newGuestsList.length > 0) {
      setGuests((prev) => [...prev, ...newGuestsList]);
    }
    setIsProcessingQueue(false);
  };

  // Retry an individual failed queue item
  const handleRetryQueueItem = async (item: QueueFileItem) => {
    if (!item.file) return;
    setQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'processing', errorMsg: undefined } : q))
    );

    try {
      const base64 = await fileToBase64(item.file);
      const parsedGuests = await processDocumentScan(base64, item.file.name, item.file.type);
      setGuests((prev) => [...prev, ...parsedGuests]);
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'success' } : q))
      );
    } catch (err: any) {
      console.error('Retry error:', err);
      setQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'error', errorMsg: err.message || 'Retry failed' } : q
        )
      );
    }
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  // Camera capture callback
  const handleCameraCapture = async (dataUrl: string) => {
    try {
      const parsedGuests = await processDocumentScan(dataUrl, 'Camera Snapshot', 'image/jpeg');
      setGuests((prev) => [...prev, ...parsedGuests]);
    } catch (err: any) {
      alert(`Error scanning photo: ${err?.message || 'Unknown error'}`);
    }
  };

  // Generate XML & CSV strings
  const xmlOutput = generateSesXml(guests, property, booking);
  const csvOutput = generateSesCsv(guests, property, booking);

  const isValidForExport = Boolean(property.codigoEstablecimiento.trim() && guests.length > 0);

  // Download files
  const handleDownloadXml = () => {
    saveBookingToArchive();
    const blob = new Blob([xmlOutput], { type: 'text/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeRef = (booking.referenciaReserva || 'BALCONES_MAR').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `SES_HOSPEDAJES_${safeRef}_${new Date().toISOString().split('T')[0]}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    saveBookingToArchive();
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeRef = (booking.referenciaReserva || 'BALCONES_MAR').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `SES_HOSPEDAJES_${safeRef}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Queue completed count
  const queueCompletedCount = queue.filter((q) => q.status === 'success' || q.status === 'error').length;
  const queueTotal = queue.length;
  const queueProgressPct = queueTotal > 0 ? Math.round((queueCompletedCount / queueTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-amber-400 selection:text-slate-950">
      <Header
        property={property}
        properties={properties}
        onSelectProperty={(id) => setActivePropertyId(id)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAnnualRegister={() => setIsAnnualRegisterOpen(true)}
        archivedCount={archive.length}
        hasServerAi={hasServerAi}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Inputs & Guest Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Demo & Test Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Instant Testing for Spanish Government (SES.HOSPEDAJES)
                </h3>
                <p className="text-xs text-slate-300">
                  Load sample guests (Dutch, Belgian) to immediately verify the XML file, CSV table, and report output.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoadDemoData}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shrink-0 shadow-md"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load Demo Guests</span>
            </button>
          </div>

          {/* Section 1: Booking Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                1. Booking Details (Reserva)
              </h2>
              <span className="text-[11px] text-slate-400">Automatically stored in your browser</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Booking Reference / ID *
                </label>
                <input
                  type="text"
                  value={booking.referenciaReserva}
                  onChange={(e) => updateBooking('referenciaReserva', e.target.value.toUpperCase())}
                  placeholder="e.g. AIRBNB-HM9821"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none uppercase font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Check-in Date &amp; Time (Entrada) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={booking.fechaEntrada}
                    onChange={(e) => updateBooking('fechaEntrada', e.target.value)}
                    className="w-2/3 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono"
                  />
                  <input
                    type="time"
                    value={booking.horaEntrada}
                    onChange={(e) => updateBooking('horaEntrada', e.target.value)}
                    className="w-1/3 px-2 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Check-out Date (Salida)
                </label>
                <input
                  type="date"
                  value={booking.fechaSalida}
                  onChange={(e) => updateBooking('fechaSalida', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Payment Method (Tipo de Pago)
                </label>
                <select
                  value={booking.tipoPago || 'PLATF'}
                  onChange={(e) => updateBooking('tipoPago', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-semibold text-xs bg-white"
                >
                  <option value="PLATF">PLATF - Plataforma Online (Airbnb / Booking)</option>
                  <option value="TARJT">TARJT - Tarjeta de Crédito / Débito</option>
                  <option value="EFECT">EFECT - Efectivo (Cash)</option>
                  <option value="TRANS">TRANS - Transferencia Bancaria</option>
                  <option value="OTRO">OTRO - Otro</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Upload & Camera */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-red-600" />
                2. Scan Passports, IDs &amp; PDF Documents (Batch or Camera)
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Take Photo with Camera</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.length) {
                  handleFilesSelected(Array.from(e.dataTransfer.files));
                }
              }}
              onClick={() => document.getElementById('passportFileInput')?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-red-500 bg-slate-50 hover:bg-red-50/20 rounded-2xl p-7 text-center cursor-pointer transition group"
            >
              <input
                id="passportFileInput"
                type="file"
                multiple
                accept="image/*,application/pdf,.pdf,.heic,.heif,.tiff,.tif,.bmp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleFilesSelected(Array.from(e.target.files));
                  }
                }}
              />

              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 group-hover:scale-110 transition flex items-center justify-center mx-auto mb-3 text-xl shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Click or drag &amp; drop PDF documents or passport photos here
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                Supports <strong>PDF</strong> (single or multi-page), <strong>JPG</strong>, <strong>PNG</strong>, <strong>WEBP</strong>, <strong>HEIC</strong>, and <strong>TIFF</strong>.
                If a PDF contains multiple passports, all travelers will be automatically extracted!
              </p>

              {/* Supported format badges */}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap text-[10px] font-mono text-slate-500">
                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded font-bold">
                  PDF (Multi-page)
                </span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  JPG / JPEG
                </span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  PNG
                </span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  WEBP
                </span>
                <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  HEIC / TIFF
                </span>
              </div>
            </div>

            {/* Batch Progress List */}
            {queue.length > 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    {isProcessingQueue ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-600" />
                        <span>AI analyzing documents...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Batch processing completed!</span>
                      </>
                    )}
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                    {queueCompletedCount} / {queueTotal}
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-600 to-amber-500 h-2 transition-all duration-300"
                    style={{ width: `${queueProgressPct}%` }}
                  ></div>
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1 pt-1">
                  {queue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                    >
                      <span className="font-mono text-slate-700 truncate max-w-[220px]">
                        {item.name}
                      </span>
                      {item.status === 'pending' && (
                        <span className="text-slate-400">In queue...</span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Scanning...
                        </span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Processed
                        </span>
                      )}
                      {item.status === 'error' && (
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-semibold flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {item.errorMsg || 'Failed'}
                          </span>
                          {item.file && (
                            <button
                              type="button"
                              onClick={() => handleRetryQueueItem(item)}
                              className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-bold text-[10px] transition shrink-0"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section 3: Registered Guests */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  3. Registered Guests (Viajeros)
                </h2>
                <span className="bg-slate-900 text-white font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {guests.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {guests.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllGuests}
                    className="text-xs text-slate-500 hover:text-red-600 transition flex items-center gap-1 px-2 py-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear all
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAddManualGuest}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Manually</span>
                </button>
              </div>
            </div>

            {/* Empty state */}
            {guests.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center mx-auto">
                  <Building className="w-6 h-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No guests registered yet</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Upload passport photos above, take a snapshot with your camera, or click "Load
                    Demo Guests" to preview the result immediately.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  className="mt-2 inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Load Sample Demo Guests</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {guests.map((guest, idx) => (
                  <GuestCard
                    key={guest.id}
                    guest={guest}
                    index={idx}
                    onUpdate={handleUpdateGuest}
                    onDelete={handleDeleteGuest}
                    onDuplicate={handleDuplicateGuest}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): Live XML Preview, CSV & Government Export */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 p-5 space-y-4 sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="text-xs font-bold tracking-wide uppercase">
                  SES.HOSPEDAJES Export
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded border border-slate-700">
                RD 933/2021
              </span>
            </div>

            {/* Establishment check */}
            {!property.codigoEstablecimiento.trim() && (
              <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Establishment Code Missing</strong>
                  Please set your Código de Establecimiento in{' '}
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="underline font-bold text-amber-400"
                  >
                    Settings
                  </button>
                  .
                </div>
              </div>
            )}

            {/* Tab selection */}
            <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setOutputTab('xml')}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                  outputTab === 'xml'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>XML Format</span>
              </button>
              <button
                type="button"
                onClick={() => setOutputTab('csv')}
                className={`flex-1 py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                  outputTab === 'csv'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV Table</span>
              </button>
            </div>

            {/* Output code preview */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">
                  {outputTab === 'xml' ? 'Generated XML Output' : 'Generated CSV Table Rows'}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold ${
                    isValidForExport ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isValidForExport
                    ? `Ready (${guests.length} ${guests.length === 1 ? 'guest' : 'guests'})`
                    : 'Waiting for data'}
                </span>
              </div>

              <textarea
                readOnly
                rows={12}
                value={outputTab === 'xml' ? xmlOutput : csvOutput}
                className="w-full p-3 font-mono text-[11px] leading-relaxed bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl outline-none resize-none select-all focus:ring-1 focus:ring-amber-400"
              />
            </div>

            {/* Primary Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={!isValidForExport}
                onClick={outputTab === 'xml' ? handleDownloadXml : handleDownloadCsv}
                className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 hover:from-red-500 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>
                  {outputTab === 'xml'
                    ? 'Download SES.HOSPEDAJES XML'
                    : 'Download SES.HOSPEDAJES CSV'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!isValidForExport}
                  onClick={() =>
                    handleCopyToClipboard(outputTab === 'xml' ? xmlOutput : csvOutput)
                  }
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copyFeedback ? 'Copied!' : 'Copy Code'}</span>
                </button>

                <button
                  type="button"
                  disabled={guests.length === 0}
                  onClick={() => setIsParteOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Parte de Viajeros</span>
                </button>
              </div>

              {/* Annual Register Action */}
              <button
                type="button"
                disabled={guests.length === 0}
                onClick={() => {
                  saveBookingToArchive();
                  setIsAnnualRegisterOpen(true);
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-amber-300 font-bold py-2.5 px-3 rounded-xl text-xs transition border border-amber-500/30 flex items-center justify-center gap-2 shadow"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Save to Annual Register ({archive.length} stored)</span>
              </button>
            </div>

            {/* Government Step Guide Box */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-amber-400 font-bold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> How to submit to Spanish portal:
                </span>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="text-white hover:underline text-[10px]"
                >
                  Full guide &rarr;
                </button>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-300">
                <li>
                  Go to{' '}
                  <a
                    href="https://hospedajes.ses.mir.es"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline font-semibold"
                  >
                    hospedajes.ses.mir.es
                  </a>
                </li>
                <li>
                  Click on <strong>Comunicaciones</strong> &rarr; <strong>Carga de ficheros</strong>
                </li>
                <li>Upload the downloaded XML file and submit</li>
              </ol>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-4 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Complies with Spanish <strong>Real Decreto 933/2021</strong> (Ministerio del Interior).
          </p>
          <p className="text-slate-500 font-mono text-[11px]">
            Data is securely processed in your browser session.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        properties={properties}
        activePropertyId={activePropertyId}
        onSelectProperty={(id) => setActivePropertyId(id)}
        onSaveProperties={(updatedList, newActiveId) => {
          setProperties(updatedList);
          setActivePropertyId(newActiveId);
        }}
      />

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <ParteViajerosModal
        isOpen={isParteOpen}
        onClose={() => setIsParteOpen(false)}
        guests={guests}
        property={property}
        booking={booking}
      />

      <PortalGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <AnnualRegisterModal
        isOpen={isAnnualRegisterOpen}
        onClose={() => setIsAnnualRegisterOpen(false)}
        archive={archive}
        onUpdateArchive={setArchive}
        currentProperty={property}
        properties={properties}
      />
    </div>
  );
}
