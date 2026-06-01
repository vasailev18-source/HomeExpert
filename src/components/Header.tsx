import React from "react";
import { Compass, Landmark, Cpu, Layers } from "lucide-react";

export default function Header({ aiActive }: { aiActive: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full select-none border-b border-slate-200/50 bg-white/80 backdrop-blur-md px-6 py-4 shadow-[0_1px_10px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        
        {/* Left Side: macOS Window Controls & Title */}
        <div className="flex items-center gap-4">
          
          {/* Authentic macOS Window Dots - Desktop Aesthetic */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 pr-1">
            <span className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-500 border border-red-500/10 transition-colors cursor-pointer" title="Закрыть"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400/80 hover:bg-amber-500 border border-amber-500/10 transition-colors cursor-pointer" title="Свернуть"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 hover:bg-emerald-500 border border-emerald-500/10 transition-colors cursor-pointer" title="Развернуть"></span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20">
              <span className="text-sm font-display tracking-wide">MD</span>
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="font-display font-bold tracking-tight text-[18px] text-slate-800">
                  AI Foundation Expert Moldova
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                  Pre-Project CAD
                </span>
              </div>
              <p className="text-slate-500 text-[11px] font-sans mt-0.5 font-medium">
                Подбор и просчёт фундаментов малоэтажного жилья по строительным нормам Республики Молдова
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Tactile macOS Control Center Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-200/50 text-slate-600 font-medium">
            <Landmark className="w-3.5 h-3.5 text-slate-500" />
            <span>NCM F.02.02 & СНиП РМ</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-200/50 text-slate-600 font-medium">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>Курс: 1 USD ≈ 18.00 MDL</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 transition-colors border border-slate-200/50 text-slate-600 font-medium">
            <Cpu className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {aiActive ? (
                <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                  Gemini Active
                </span>
              ) : (
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <span className="h-2 w-2 bg-slate-400 rounded-full inline-block"></span>
                  CAD-Only
                </span>
              )}
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}
