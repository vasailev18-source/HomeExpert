import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { Scale, Info, PieChart as PieIcon, BarChart2, CheckCircle2 } from "lucide-react";

interface WeightDistributionAuditProps {
  results: {
    wallWeightTons: number;
    slabWeightTons: number;
    roofWeightTons: number;
    liveLoadTons: number;
    snowLoadTons: number;
    windLoadTons: number;
    seismicForceTons: number;
    totalFactoredWeightTons: number;
    bearingAreaRequiredM2: number;
  };
}

export default function WeightDistributionAudit({ results }: WeightDistributionAuditProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const rawPieData = [
    { name: "Стены здания", value: results.wallWeightTons || 0, color: "#3b82f6", desc: "Постоянная сухая масса несущих стен и перегородок здания" },
    { name: "Ж/б плиты и перекрытия", value: results.slabWeightTons || 0, color: "#6366f1", desc: "Вес монолитных перекрытий, балок и чернового пола" },
    { name: "Крыша и кровля", value: results.roofWeightTons || 0, color: "#06b6d4", desc: "Вес стропильной деревянной фермы, обрешетки и покрытия" },
    { name: "Полезная нагрузка (NCM)", value: results.liveLoadTons || 0, color: "#10b981", desc: "Нормативная эксплуатационная нагрузка первого/второго этажей (мебель, люди)" },
    { name: "Снеговой зимний нанос", value: results.snowLoadTons || 0, color: "#38bdf8", desc: "Климатическая нагрузка удержания осадков по зонам РМ" },
    { name: "Боковой напор ветра", value: results.windLoadTons || 0, color: "#f59e0b", desc: "Аэродинамическое ветровое давление на фронтоны кровли" },
    { name: "Сейсмический сдвиг", value: results.seismicForceTons || 0, color: "#f43f5e", desc: "Горизонтальные сейсмические векторы сил по нормам Молдовы (СНиП)" },
  ];

  // Only take components with registered masses > 0 to render cleanly
  const chartData = rawPieData.filter((d) => d.value > 0);
  const totalWeight = chartData.reduce((sum, item) => sum + item.value, 0);

  // Grouped comparison data for bar chart
  const staticLoads = (results.wallWeightTons || 0) + (results.slabWeightTons || 0) + (results.roofWeightTons || 0);
  const dynamicLoads = (results.liveLoadTons || 0) + (results.snowLoadTons || 0) + (results.windLoadTons || 0);
  const seismicLoads = results.seismicForceTons || 0;

  const barData = [
    {
      category: "Постоянные (Статика)",
      tonnage: Math.round(staticLoads * 10) / 10,
      fill: "#3b82f6",
      desc: "Вес конструкций"
    },
    {
      category: "Временные (Динамика)",
      tonnage: Math.round(dynamicLoads * 10) / 10,
      fill: "#10b981",
      desc: "Люди, мебель, ветер, снег"
    },
    {
      category: "Сейсмические (Гориз.)",
      tonnage: Math.round(seismicLoads * 10) / 10,
      fill: "#f43f5e",
      desc: "Инерция при землетрясении"
    }
  ];

  // Custom Pie Tooltip to make it look native and elegant
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalWeight) * 100).toFixed(1);
      return (
        <div className="bg-slate-900 text-white rounded-xl p-3 shadow-lg border border-slate-850 text-xs text-left max-w-[220px]">
          <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: data.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
            {data.name}
          </div>
          <p className="text-slate-300 mb-1.5 font-sans leading-normal">{data.desc}</p>
          <div className="flex justify-between items-center text-[10.5px] font-mono border-t border-slate-800 pt-1.5">
            <span>Масса: <strong>{data.value.toLocaleString()} т</strong></span>
            <span className="text-blue-400">Доля: <strong>{percentage}%</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Bar Tooltip
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white rounded-xl p-2.5 shadow-lg border border-slate-850 text-xs">
          <p className="font-bold mb-1" style={{ color: data.fill }}>{data.category}</p>
          <p className="text-slate-400 text-[10px] mb-1">{data.desc}</p>
          <div className="font-mono text-slate-200">
            Нагрузка: <strong>{data.tonnage.toLocaleString()} тонн</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Scale className="w-4.5 h-4.5" />
          </div>
          <div>
            <h4 className="text-[12.5px] font-display font-bold text-slate-850">
              Верифицированный аудит распределения нагрузок
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Внутренний сбор постоянных весов и климатических сил СНиП РМ</p>
          </div>
        </div>

        {/* View Switch Pill Control */}
        <div className="bg-slate-100/90 p-0.5 rounded-full inline-flex self-start sm:self-center">
          <button
            onClick={() => setChartType("pie")}
            className={`px-3 py-1 rounded-full text-[10.5px] font-medium flex items-center gap-1 cursor-pointer transition-all ${
              chartType === "pie"
                ? "bg-white text-blue-600 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" /> Круговая
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-3 py-1 rounded-full text-[10.5px] font-medium flex items-center gap-1 cursor-pointer transition-all ${
              chartType === "bar"
                ? "bg-white text-blue-600 shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Группы сил
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
        {/* Left Side: Chart Display Area */}
        <div className="md:col-span-6 flex items-center justify-center min-h-[220px] bg-slate-50/50 border border-slate-200/30 rounded-2xl p-2 relative">
          <ResponsiveContainer width="100%" height={210}>
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, idx) => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.65}
                      className="transition-opacity duration-200 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={barData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 9.5, fill: "#64748b" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 9.5, fill: "#64748b" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                <Bar 
                  dataKey="tonnage" 
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                >
                  {barData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>

          {/* Absolute Donut Center Metrics */}
          {chartType === "pie" && (
            <div className="absolute flex flex-col items-center justify-center pointer-events-none select-none">
              <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Всего вес</span>
              <strong className="text-base font-extrabold text-slate-800 font-mono tracking-tight leading-tight">
                {results.totalFactoredWeightTons} т
              </strong>
              <span className="text-[8px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100 font-bold block mt-0.5">
                9.8м/с² СНиП
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Detailed Legends & Descriptions */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5 scrollbar-thin overflow-y-auto max-h-[175px] pr-1">
            {chartType === "pie" ? (
              chartData.map((d, index) => {
                const proportion = ((d.value / totalWeight) * 100).toFixed(1);
                const isHovered = activeIndex === index;
                return (
                  <div
                    key={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`flex items-start justify-between p-2 rounded-xl border transition-all duration-150 select-none ${
                      isHovered 
                        ? "bg-slate-50 border-slate-200 translate-x-1 shadow-xs" 
                        : "border-transparent text-slate-650"
                    }`}
                  >
                    <div className="flex gap-2 min-w-0 pr-1.5">
                      <span className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: d.color }} />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 block truncate">{d.name}</span>
                        <span className="text-[9px] text-slate-400 block truncate font-sans leading-normal mt-0.5">{d.desc}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[11.5px] font-bold text-slate-900 block">{d.value} т</span>
                      <span className="text-[9.5px] text-slate-500 font-semibold font-mono block mt-0.2">{proportion}%</span>
                    </div>
                  </div>
                );
              })
            ) : (
              barData.map((b, index) => {
                const totalCalculated = staticLoads + dynamicLoads + seismicLoads;
                const portion = ((b.tonnage / totalCalculated) * 100).toFixed(1);
                return (
                  <div key={index} className="flex flex-col p-2.5 bg-slate-50 border border-slate-200/55 rounded-xl text-[11px]">
                    <div className="flex items-center justify-between font-bold text-slate-850">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.fill }} />
                        {b.category}
                      </span>
                      <span className="font-mono text-[11.5px]">{b.tonnage} т</span>
                    </div>
                    <div className="flex items-center justify-between text-[9.5px] text-slate-400 font-sans mt-1">
                      <span>{b.desc}</span>
                      <span className="font-semibold font-mono bg-white border border-slate-200/60 text-slate-600 px-1.5 py-0.2 rounded-md">
                        {portion}% от сил сдвига
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="p-2.5 bg-blue-50/40 rounded-xl border border-blue-100/40 text-[9.5px] text-slate-500 leading-normal flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              Собранный вес учитывается при расчёте предельных состояний 1-й и 2-й группы (прочность и осадки). Коэффициенты надежности приняты по <strong>NCM EN 1990</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
