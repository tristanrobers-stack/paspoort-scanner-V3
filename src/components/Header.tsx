import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Sliders,
  ExternalLink,
  Sparkles,
  Building2,
  FileCheck2,
  BookOpen,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react';
import { PropertySettings } from '../types';

interface HeaderProps {
  property: PropertySettings;
  properties: PropertySettings[];
  onSelectProperty: (id: string) => void;
  onOpenSettings: () => void;
  onOpenGuide: () => void;
  onOpenAnnualRegister: () => void;
  archivedCount: number;
  hasServerAi: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  property,
  properties,
  onSelectProperty,
  onOpenSettings,
  onOpenGuide,
  onOpenAnnualRegister,
  archivedCount,
  hasServerAi,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900 text-white shadow-xl border-b border-slate-800 sticky top-0 z-40">
      {/* Top Spanish flag ribbon */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/4 bg-red-600"></div>
        <div className="h-full w-2/4 bg-amber-400"></div>
        <div className="h-full w-1/4 bg-red-600"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-3.5 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md font-black text-xl shrink-0">
            <span className="tracking-tighter">ES</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5">
                SES.HOSPEDAJES AutoScanner
              </h1>
              <span className="bg-red-500/20 text-red-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-red-400" /> RD 933/2021
              </span>
            </div>

            {/* Property Selector Dropdown */}
            <div className="relative mt-0.5" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80 transition"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-slate-100 max-w-[200px] truncate">
                  {property.nombreEstablecimiento || 'Select Apartment'}
                </span>
                <span className="text-slate-500 font-normal">&bull;</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {property.codigoEstablecimiento
                    ? property.codigoEstablecimiento
                    : 'No code'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition ml-0.5" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Apartment / Property:
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 my-1">
                    {properties.map((p) => {
                      const isCurrent = p.id === property.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onSelectProperty(p.id);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between gap-2 ${
                            isCurrent
                              ? 'bg-red-600 text-white font-bold'
                              : 'text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-xs">
                              {p.nombreEstablecimiento || 'Unnamed Apartment'}
                            </div>
                            <div
                              className={`text-[10px] font-mono truncate ${
                                isCurrent ? 'text-amber-200' : 'text-slate-400'
                              }`}
                            >
                              Code: {p.codigoEstablecimiento || 'Not configured'}
                            </div>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 border-t border-slate-800 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-amber-300 hover:bg-slate-800 rounded-lg transition flex items-center gap-1.5 font-semibold text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ Add or Manage Apartments</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* AI Status Badge */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700 text-emerald-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{hasServerAi ? 'Gemini 3.8 Flash Vision' : 'AI Active'}</span>
          </div>

          <button
            type="button"
            onClick={onOpenAnnualRegister}
            className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Libro-Registro</span>
            {archivedCount > 0 && (
              <span className="bg-slate-950/80 text-amber-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                {archivedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Guide</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Apartments ({properties.length})</span>
          </button>

          <a
            href="https://hospedajes.ses.mir.es"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
          >
            <span>SES Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
};
