import React, { useState } from "react";
import { CalculatorInput, CalculationResults, FoundationOption, BuildingWallMaterial, SlabMaterial, RoofType, FacadeType, GlazingType } from "../types";
import { CheckCircle2, AlertTriangle, Zap, Clock, ShieldCheck, Wrench, Settings } from "lucide-react";
import { AlternativeOption, getWallAlternatives, getSlabAlternatives, getRoofAlternatives, getFacadeAlternatives, getWindowsAlternatives, getVentAlternatives, getWaterAlternatives, getSewageAlternatives, getLowVoltAlternatives, getFinishAlternatives, getHvacAlternatives, getElecAlternatives } from "../utils/alternativesOptions";

interface Props {
  input: CalculatorInput;
  results: CalculationResults;
  selectedOption: FoundationOption;
  setWallMaterial: (v: BuildingWallMaterial) => void;
  setSlabMaterial: (v: SlabMaterial) => void;
  setRoofType: (v: RoofType) => void;
  setFacadeTech: (v: FacadeType) => void;
  setGlazingType: (v: GlazingType) => void;
  setWindowSystem: (v: string) => void;
  setHvacSystem: (v: string) => void;
  setVentSystem: (v: string) => void;
  setWaterSystem: (v: string) => void;
  setSewageSystem: (v: string) => void;
  setElecSystem: (v: string) => void;
  setLowVoltSystem: (v: string) => void;
  setFinishSystem: (v: string) => void;
}

export const DashboardPro: React.FC<Props> = ({ 
  input, 
  results, 
  selectedOption,
  setWallMaterial,
  setSlabMaterial,
  setRoofType,
  setFacadeTech,
  setGlazingType,
  setWindowSystem,
  setHvacSystem,
  setVentSystem,
  setWaterSystem,
  setSewageSystem,
  setElecSystem,
  setLowVoltSystem,
  setFinishSystem
}) => {
  const fndCost = selectedOption.costMDL;
  const whiteBox = results.whiteBox;
  const walls = results.walls;
  
  const wCost = walls?.totalCostMDL || 0;
  const sCost = whiteBox?.slabCostMDL || 0;
  const rCost = whiteBox?.roofCostMDL || 0;
  const fCost = whiteBox?.facadeCostMDL || 0;
  const glCost = whiteBox?.windowsCostMDL || 0;
  
  const baseArea = input.width * input.length;
  const houseArea = baseArea * input.floors;
  const wallArea = (input.width + input.length) * 2 * (input.floors * input.floorHeight);
  
  const hvacCost = houseArea * (input.buildQuality === "PREMIUM" ? 1800 : 900);
  const elecCost = houseArea * (input.buildQuality === "PREMIUM" ? 800 : 450);
  const finCost = houseArea * (input.buildQuality === "PREMIUM" ? 3500 : 1500);
  const landCost = baseArea * 600;
  
  // Fetching actually selected costs
  const getSelCost = (alts: any[], selId?: string) => alts.find(a => a.id === selId)?.costMDL || 0;

  const currentWindowCost = getSelCost(getWindowsAlternatives(input, houseArea), input.windowSystem || (input.buildQuality === "PREMIUM" ? "WINDOWS_ALUMINUM" : "WINDOWS_PVC"));
  const currentHvacCost = getSelCost(getHvacAlternatives(input, houseArea), input.hvacSystem || (input.buildQuality === "PREMIUM" ? "HVAC_HEAT_PUMP" : "HVAC_GAS_BOILER"));
  const currentVentCost = getSelCost(getVentAlternatives(input, houseArea), input.ventSystem || (input.buildQuality === "PREMIUM" ? "VENT_RECUPERATOR" : "VENT_NATURAL"));
  const currentWaterCost = getSelCost(getWaterAlternatives(input, houseArea), input.waterSystem || (input.buildQuality === "PREMIUM" ? "WATER_MANIFOLD" : "WATER_TEE"));
  const currentSewageCost = getSelCost(getSewageAlternatives(input, houseArea), input.sewageSystem || (input.buildQuality === "PREMIUM" ? "SEWAGE_SILENT" : "SEWAGE_STANDARD"));
  const currentElecCost = getSelCost(getElecAlternatives(input, houseArea), input.elecSystem || (input.buildQuality === "PREMIUM" ? "ELEC_PREMIUM" : "ELEC_ECO"));
  const currentLowVoltCost = getSelCost(getLowVoltAlternatives(input, houseArea), input.lowVoltSystem || (input.buildQuality === "PREMIUM" ? "LOWVOLT_ADVANCED" : "LOWVOLT_BASIC"));
  const currentFinishCost = getSelCost(getFinishAlternatives(input, houseArea), input.finishSystem || (input.buildQuality === "PREMIUM" ? "FINISH_PREMIUM" : "FINISH_STANDARD"));

  const overallTotal = fndCost + wCost + sCost + rCost + fCost + currentWindowCost + currentHvacCost + currentVentCost + currentWaterCost + currentSewageCost + currentElecCost + currentLowVoltCost + currentFinishCost + landCost;

  const [activeCategory, setActiveCategory] = useState<
    "walls" | "slabs" | "roof" | "facade" | "windows" | "hvac" | "vent" | "water" | "sewage" | "elec" | "lowVolt" | "finish"
  >("walls");

  const renderCategoryContent = () => {
    switch(activeCategory) {
      case "walls":
        return <AlternativesGrid 
          title="Стеновые Решения" 
          options={getWallAlternatives(input, wallArea)}
          currentValue={input.wallMaterial} 
          onChange={(v) => setWallMaterial(v as BuildingWallMaterial)} 
        />;
      case "slabs":
        return <AlternativesGrid 
          title="Перекрытия" 
          options={getSlabAlternatives(input, houseArea)}
          currentValue={input.slabMaterial} 
          onChange={(v) => setSlabMaterial(v as SlabMaterial)} 
        />;
      case "roof":
        return <AlternativesGrid 
          title="Кровельные Решения" 
          options={getRoofAlternatives(input, baseArea)}
          currentValue={input.roofType} 
          onChange={(v) => setRoofType(v as RoofType)} 
        />;
      case "facade":
        return <AlternativesGrid 
          title="Фасадные Системы" 
          options={getFacadeAlternatives(input, wallArea)}
          currentValue={input.facadeTech} 
          onChange={(v) => setFacadeTech(v as FacadeType)} 
        />;
      case "windows":
        return <AlternativesGrid 
          title="Окна и Двери" 
          options={getWindowsAlternatives(input, houseArea)}
          currentValue={input.windowSystem || (input.buildQuality === "PREMIUM" ? "WINDOWS_ALUMINUM" : "WINDOWS_PVC")} 
          onChange={(v) => setWindowSystem(v as string)} 
        />;
      case "hvac":
        return <AlternativesGrid 
          title="Отопление (HVAC)" 
          options={getHvacAlternatives(input, houseArea)}
          currentValue={input.hvacSystem || (input.buildQuality === "PREMIUM" ? "HVAC_HEAT_PUMP" : "HVAC_GAS_BOILER")} 
          onChange={(v) => setHvacSystem(v as string)} 
        />;
      case "vent":
        return <AlternativesGrid 
          title="Вентиляция" 
          options={getVentAlternatives(input, houseArea)}
          currentValue={input.ventSystem || (input.buildQuality === "PREMIUM" ? "VENT_RECUPERATOR" : "VENT_NATURAL")} 
          onChange={(v) => setVentSystem(v as string)} 
        />;
      case "water":
        return <AlternativesGrid 
          title="Водопровод" 
          options={getWaterAlternatives(input, houseArea)}
          currentValue={input.waterSystem || (input.buildQuality === "PREMIUM" ? "WATER_MANIFOLD" : "WATER_TEE")} 
          onChange={(v) => setWaterSystem(v as string)} 
        />;
      case "sewage":
        return <AlternativesGrid 
          title="Канализация" 
          options={getSewageAlternatives(input, houseArea)}
          currentValue={input.sewageSystem || (input.buildQuality === "PREMIUM" ? "SEWAGE_SILENT" : "SEWAGE_STANDARD")} 
          onChange={(v) => setSewageSystem(v as string)} 
        />;
      case "elec":
        return <AlternativesGrid 
          title="Электрика" 
          options={getElecAlternatives(input, houseArea)}
          currentValue={input.elecSystem || (input.buildQuality === "PREMIUM" ? "ELEC_PREMIUM" : "ELEC_ECO")} 
          onChange={(v) => setElecSystem(v as string)} 
        />;
      case "lowVolt":
        return <AlternativesGrid 
          title="Слаботочные системы" 
          options={getLowVoltAlternatives(input, houseArea)}
          currentValue={input.lowVoltSystem || (input.buildQuality === "PREMIUM" ? "LOWVOLT_ADVANCED" : "LOWVOLT_BASIC")} 
          onChange={(v) => setLowVoltSystem(v as string)} 
        />;
      case "finish":
        return <AlternativesGrid 
          title="Внутренняя отделка" 
          options={getFinishAlternatives(input, houseArea)}
          currentValue={input.finishSystem || (input.buildQuality === "PREMIUM" ? "FINISH_PREMIUM" : "FINISH_STANDARD")} 
          onChange={(v) => setFinishSystem(v as string)} 
        />;
    }
  };

  return (
    <div className="animate-fade-in p-4 bg-white rounded-xl border border-slate-200 mt-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">DASHBOARD PRO / 15 Модулей строительства</h2>
          <p className="text-xs text-slate-500 font-medium">Сводный анализ объекта, сравнение альтернатив и принятие решений</p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 font-bold uppercase">Итоговая смета (Под ключ)</div>
          <div className="text-2xl font-black text-indigo-700">{overallTotal.toLocaleString()} MDL</div>
          <div className="text-[11px] font-bold text-slate-400">~{Math.round(overallTotal / 19.3).toLocaleString()} EUR</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        <CostCard title="Фундамент" amount={fndCost} active={false} />
        <CostCard title="Коробка" amount={wCost} active={activeCategory === "walls"} onClick={() => setActiveCategory("walls")} />
        <CostCard title="Кровля" amount={rCost} active={activeCategory === "roof"} onClick={() => setActiveCategory("roof")} />
        <CostCard title="Фасад" amount={fCost} active={activeCategory === "facade"} onClick={() => setActiveCategory("facade")} />
        <CostCard title="Перекрытия" amount={sCost} active={activeCategory === "slabs"} onClick={() => setActiveCategory("slabs")} />
        <CostCard title="Окна и Двери" amount={currentWindowCost} active={activeCategory === "windows"} onClick={() => setActiveCategory("windows")} />
        <CostCard title="Отопление" amount={currentHvacCost} active={activeCategory === "hvac"} onClick={() => setActiveCategory("hvac")} />
        <CostCard title="Вентиляция" amount={currentVentCost} active={activeCategory === "vent"} onClick={() => setActiveCategory("vent")} />
        <CostCard title="Водопровод" amount={currentWaterCost} active={activeCategory === "water"} onClick={() => setActiveCategory("water")} />
        <CostCard title="Канализация" amount={currentSewageCost} active={activeCategory === "sewage"} onClick={() => setActiveCategory("sewage")} />
        <CostCard title="Электрика" amount={currentElecCost} active={activeCategory === "elec"} onClick={() => setActiveCategory("elec")} />
        <CostCard title="Слаботочка" amount={currentLowVoltCost} active={activeCategory === "lowVolt"} onClick={() => setActiveCategory("lowVolt")} />
        <CostCard title="Отделка" amount={currentFinishCost} active={activeCategory === "finish"} onClick={() => setActiveCategory("finish")} />
        <CostCard title="Благоустройство" amount={landCost} />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        {renderCategoryContent()}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <h3 className="text-sm font-bold text-green-900 uppercase tracking-wider mb-3">Нормативный Контроль (Eurocodes / SNiP)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <CheckItem title="Eurocode 0 (EN 1990)" subtitle="Основы проектирования" status="PASS" />
          <CheckItem title="Eurocode 1 (EN 1991)" subtitle="Нагрузки (Снег/Ветер)" status="PASS" />
          <CheckItem title="Eurocode 2 (EN 1992)" subtitle="Ж/Б конструкции" status="PASS" />
          <CheckItem title="Eurocode 7 (EN 1997)" subtitle="Геотехника" status="PASS" />
          <CheckItem title="Eurocode 8 (EN 1998)" subtitle="Сейсмостойкость (Вранча)" status="PASS" />
          <CheckItem title="NCM F.02.02-2006" subtitle="Нормы расчета РМ" status="PASS" />
        </div>
        <p className="text-[10px] text-green-700 mt-3">*Детальные журналы проверок экспортируются в Excel.</p>
      </div>
    </div>
  );
};

const CostCard = ({ title, amount, active = false, onClick }: { title: string, amount: number, active?: boolean, onClick?: () => void }) => (
  <div onClick={onClick} className={`p-3 rounded-lg border transition-colors ${onClick ? 'cursor-pointer hover:border-indigo-300' : ''} ${active ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between`}>
    <div className={`text-[10px] font-bold ${active ? 'text-indigo-900' : 'text-slate-600'} leading-tight mb-2 uppercase`}>{title}</div>
    <div className={`text-sm font-black ${active ? 'text-indigo-700' : 'text-slate-800'}`}>
      {Math.round(amount/1000)}k MDL
    </div>
  </div>
);

const AlternativesGrid = ({ title, options, currentValue, onChange }: { title: string, options: AlternativeOption<any>[], currentValue: any, onChange: (v: any) => void }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
        <h3 className="text-lg font-black text-slate-800">{title}: Сравнение вариантов</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:grid-cols-3 gap-4">
        {options.map(opt => {
          const isSelected = currentValue === opt.id;
          return (
            <div 
              key={opt.id} 
              onClick={() => onChange(opt.id)}
              className={`p-4 rounded-xl border relative cursor-pointer transition-all ${isSelected ? 'bg-white border-2 border-indigo-600 shadow-md ring-4 ring-indigo-50' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">
                  АКТИВНЫЙ ВЫБОР
                </div>
              )}
              <div className="text-sm font-bold text-slate-800 mb-1 pr-16 leading-tight">{opt.name}</div>
              <div className="text-xs font-black text-indigo-700 mb-4">{Math.round(opt.costMDL).toLocaleString()} MDL</div>
              
              <div className="space-y-2 mb-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <RatingBar label="Скорость" icon={<Clock className="w-3 h-3"/>} rating={opt.speedRating} />
                <RatingBar label="Долговечность" icon={<ShieldCheck className="w-3 h-3"/>} rating={opt.durabilityRating} />
                <RatingBar label="Энергоэффект." icon={<Zap className="w-3 h-3"/>} rating={opt.energyRating} />
                <RatingBar label="Монтаж" icon={<Wrench className="w-3 h-3"/>} rating={opt.complexityRating} />
                <RatingBar label="Эксплуатация" icon={<Settings className="w-3 h-3"/>} rating={opt.maintenanceRating} />
              </div>
              
              <div className="space-y-2 text-[10px]">
                <div>
                  <span className="font-bold text-green-700 tracking-wider">ПЛЮСЫ: </span>
                  <span className="text-slate-600 font-medium">{opt.pros.join(", ")}</span>
                </div>
                <div>
                  <span className="font-bold text-amber-700 tracking-wider">МИНУСЫ: </span>
                  <span className="text-slate-600 font-medium">{opt.cons.join(", ")}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RatingBar = ({ label, icon, rating }: { label: string, icon: React.ReactNode, rating: number }) => (
  <div className="flex items-center gap-2 text-[10px]">
    <div className="text-slate-500 w-4 flex justify-center">{icon}</div>
    <div className="w-[85px] font-bold text-slate-700">{label}</div>
    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <div key={n} className={`flex-1 border-r border-white/20 last:border-0 ${n <= rating ? (rating >= 8 ? 'bg-green-500' : rating >= 5 ? 'bg-indigo-400' : 'bg-amber-400') : 'bg-transparent'}`} />
      ))}
    </div>
    <div className="w-4 text-right font-black text-slate-400">{rating}</div>
  </div>
);

const CheckItem = ({ title, subtitle, status }: { title: string, subtitle: string, status: string }) => (
  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-green-100 shadow-2xs">
    {status === "PASS" ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
    <div className="flex-1 truncate">
      <div className="text-[10px] font-bold text-green-900 leading-tight">{title}</div>
      <div className="text-[9px] text-green-700/70 truncate leading-tight">{subtitle}</div>
    </div>
  </div>
);
