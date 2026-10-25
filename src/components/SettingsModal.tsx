import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Key,
  MapPin,
  Save,
  Info,
  Plus,
  Trash2,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { PropertySettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: PropertySettings[];
  activePropertyId: string;
  onSelectProperty: (id: string) => void;
  onSaveProperties: (properties: PropertySettings[], activeId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  properties,
  activePropertyId,
  onSelectProperty,
  onSaveProperties,
}) => {
  const [propList, setPropList] = useState<PropertySettings[]>(properties);
  const [currentSelectedId, setCurrentSelectedId] = useState<string>(activePropertyId);
  const [editingId, setEditingId] = useState<string>(activePropertyId);

  // Sync with incoming props when opening
  useEffect(() => {
    if (isOpen) {
      setPropList(properties);
      setCurrentSelectedId(activePropertyId);
      setEditingId(activePropertyId);
    }
  }, [isOpen, properties, activePropertyId]);

  if (!isOpen) return null;

  const activeEditingProp =
    propList.find((p) => p.id === editingId) || propList[0] || {
      id: 'prop-' + Date.now(),
      codigoEstablecimiento: '',
      codigoArrendador: '',
      nombreEstablecimiento: 'New Apartment',
      municipio: '',
      provincia: 'Alicante',
      direccion: '',
    };

  const handleFieldChange = (field: keyof PropertySettings, value: string) => {
    setPropList((prev) =>
      prev.map((item) => (item.id === activeEditingProp.id ? { ...item, [field]: value } : item))
    );
  };

  const handleAddNewProperty = () => {
    const newId = 'prop-' + Date.now();
    const newProp: PropertySettings = {
      id: newId,
      codigoEstablecimiento: '',
      codigoArrendador: '',
      nombreEstablecimiento: 'New Apartment ' + (propList.length + 1),
      municipio: 'Alicante',
      provincia: 'Alicante',
      direccion: '',
    };
    setPropList((prev) => [...prev, newProp]);
    setEditingId(newId);
    setCurrentSelectedId(newId);
  };

  const handleDeleteProperty = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (propList.length <= 1) {
      alert('At least one apartment must remain in the system.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this apartment?')) {
      const remaining = propList.filter((p) => p.id !== idToDelete);
      setPropList(remaining);
      const nextActive = remaining[0].id;
      setEditingId(nextActive);
      if (currentSelectedId === idToDelete) {
        setCurrentSelectedId(nextActive);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProperties(propList, currentSelectedId);
    onSelectProperty(currentSelectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col text-slate-800 max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Manage Apartments &amp; Properties (Multi-Property)
              </h3>
              <p className="text-[11px] text-slate-400">
                Easily switch between different rental properties and configure individual establishment codes
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

        {/* Modal Body: Left sidebar with properties, Right form */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left: Property Selector List */}
          <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-3 sm:p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Properties ({propList.length})</span>
              </div>

              {propList.map((p) => {
                const isEditing = p.id === activeEditingProp.id;
                const isActiveInApp = p.id === currentSelectedId;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setEditingId(p.id);
                      setCurrentSelectedId(p.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setEditingId(p.id);
                        setCurrentSelectedId(p.id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-start justify-between gap-2 text-left ${
                      isEditing
                        ? 'bg-white border-red-500 shadow-md ring-1 ring-red-500'
                        : 'bg-white/60 hover:bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                        <span>{p.nombreEstablecimiento || 'Unnamed Property'}</span>
                        {isActiveInApp && (
                          <span
                            title="Active in scanner"
                            className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                          />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                        {p.codigoEstablecimiento
                          ? `Code: ${p.codigoEstablecimiento}`
                          : 'Code not configured'}
                      </div>
                      {isActiveInApp && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          Active in scanner
                        </span>
                      )}
                    </div>

                    {propList.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProperty(p.id, e)}
                        title="Delete this apartment"
                        className="text-slate-300 hover:text-red-600 transition p-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleAddNewProperty}
              className="mt-3 w-full py-2 px-3 border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-red-600" />
              <span>+ Add New Apartment</span>
            </button>
          </div>

          {/* Right: Form to edit selected property */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 text-xs flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Settings for: {activeEditingProp.nombreEstablecimiento}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Official registration details with Spanish Ministry (SES.HOSPEDAJES)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentSelectedId(activeEditingProp.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentSelectedId === activeEditingProp.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {currentSelectedId === activeEditingProp.id
                      ? 'Currently Active'
                      : 'Set as Active Property'}
                  </span>
                </button>
              </div>

              {/* Establishment info notice */}
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-[11.5px] flex items-start gap-2.5 leading-relaxed">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Código de Establecimiento:</strong> This is the unique 10-digit accommodation code
                  assigned by the Spanish police (Policía Nacional or Guardia Civil) to your apartment or holiday rental
                  (e.g. 0000472036). Without this code, the ministry portal will reject your XML file.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Apartment / Property Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={activeEditingProp.nombreEstablecimiento}
                    onChange={(e) => handleFieldChange('nombreEstablecimiento', e.target.value)}
                    placeholder="e.g. LETICIA - Apartment"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código de Establecimiento (Establishment Code) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={activeEditingProp.codigoEstablecimiento}
                      onChange={(e) =>
                        handleFieldChange('codigoEstablecimiento', e.target.value.toUpperCase().trim())
                      }
                      placeholder="e.g. 0000472036"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none uppercase font-mono font-bold"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código de Arrendador (Host/Owner NIF / NIE / CIF)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeEditingProp.codigoArrendador}
                      onChange={(e) =>
                        handleFieldChange('codigoArrendador', e.target.value.toUpperCase().trim())
                      }
                      placeholder="e.g. Y8491023B or B12345678"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none uppercase font-mono"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Municipality / City (Municipio)
                  </label>
                  <input
                    type="text"
                    value={activeEditingProp.municipio}
                    onChange={(e) => handleFieldChange('municipio', e.target.value)}
                    placeholder="e.g. Alicante or Torrevieja"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Address in Spain (Dirección)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={activeEditingProp.direccion}
                    onChange={(e) => handleFieldChange('direccion', e.target.value)}
                    placeholder="e.g. Calle Principal 1, 3ºB"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center gap-3">
              <span className="text-[11px] text-slate-500">
                Stored locally in your browser for all future scans.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-red-600 via-amber-500 to-amber-400 hover:from-red-500 hover:to-amber-300 text-slate-950 font-black rounded-xl transition shadow flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save &amp; Apply</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
