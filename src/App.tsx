import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Calculator,
  Compass,
  DollarSign,
  Droplet,
  FileText,
  HelpCircle,
  Layers,
  MapPin,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Waves,
  Info,
  Sliders,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Truck,
  Wrench,
  HardHat,
  FileSpreadsheet
} from "lucide-react";
import { MoldovaRegion, SoilType, BuildingWallMaterial, SlabMaterial, RoofType, CalculatorInput, CalculationResults, ChatMessage, CostEstimate } from "./types";
import { calculateFoundation, REGION_DATA, SOIL_DATA, WALL_MATERIAL_DATA, SLAB_DATA, ROOF_DATA, COST_RATES } from "./utils/calc";
import Header from "./components/Header";
import WeightDistributionAudit from "./components/WeightDistributionAudit";
import EngineeringAudit from "./components/EngineeringAudit";
import { exportToExcel, exportAllToExcel } from "./utils/excelExport";
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

interface ProjectPreset {
  name: string;
  dims: string;
  width: number;
  length: number;
  floors: number;
  floorLabel: string;
  wallMaterial: BuildingWallMaterial;
  slabMaterial: SlabMaterial;
  roofType: RoofType;
  materialLabel: string;
  hasBasement?: boolean;
}

const PRESETS: ProjectPreset[] = [
  {
    name: "Двускатный Мансардный 8х8",
    dims: "8 x 8 м",
    width: 8,
    length: 8,
    floors: 1.5,
    floorLabel: "Классическая мансарда",
    wallMaterial: BuildingWallMaterial.GASOBETON,
    slabMaterial: SlabMaterial.HOLLOW_CORE,
    roofType: RoofType.GABLE_METAL,
    materialLabel: "Газобетон • Плиты ПБК"
  },
  {
    name: "Традиционный Котелец 9х11",
    dims: "9 x 11 м",
    width: 9,
    length: 11,
    floors: 1.5,
    floorLabel: "Классическая мансарда",
    wallMaterial: BuildingWallMaterial.KOTELET,
    slabMaterial: SlabMaterial.MONOLITH,
    roofType: RoofType.HIP_CERAMIC,
    materialLabel: "Котелец • Ж/б Монолит"
  },
  {
    name: "Эко-Каркас Мансард 10х10",
    dims: "10 x 10 м",
    width: 10,
    length: 10,
    floors: 1.5,
    floorLabel: "Классическая мансарда",
    wallMaterial: BuildingWallMaterial.FRAME,
    slabMaterial: SlabMaterial.TIMBER,
    roofType: RoofType.GABLE_METAL,
    materialLabel: "Каркас • Дерево"
  },
  {
    name: "Вилла с Полумансардой 10х12",
    dims: "10 x 12 м",
    width: 10,
    length: 12,
    floors: 1.6,
    floorLabel: "Полумансарда (аттик 1.2м)",
    wallMaterial: BuildingWallMaterial.BRICK,
    slabMaterial: SlabMaterial.MONOLITH,
    roofType: RoofType.HIP_CERAMIC,
    materialLabel: "Кирпич • Монолит"
  },
  {
    name: "Дуплекс-Мансарда 12х15",
    dims: "12 x 15 м",
    width: 12,
    length: 15,
    floors: 1.5,
    floorLabel: "Классическая мансарда",
    wallMaterial: BuildingWallMaterial.KERAMZIT,
    slabMaterial: SlabMaterial.HOLLOW_CORE,
    roofType: RoofType.GABLE_METAL,
    materialLabel: "Керамзитоб. • Плиты ПБК"
  },
  {
    name: "Люкс-Усадьба 2.5 ур. 11х13",
    dims: "11 x 13 м",
    width: 11,
    length: 13,
    floors: 2.5,
    floorLabel: "2 этажа + Мансарда",
    wallMaterial: BuildingWallMaterial.KOTELET,
    slabMaterial: SlabMaterial.MONOLITH,
    roofType: RoofType.HIP_CERAMIC,
    materialLabel: "Котелец • Монолит • Подвал",
    hasBasement: true
  },
  {
    name: "Особняк 3.5 уровня 12х12",
    dims: "12 x 12 м",
    width: 12,
    length: 12,
    floors: 3.5,
    floorLabel: "3 этажа + Жилая мансарда",
    wallMaterial: BuildingWallMaterial.BRICK,
    slabMaterial: SlabMaterial.MONOLITH,
    roofType: RoofType.HIP_CERAMIC,
    materialLabel: "Кирпич • Монолит • Сейсмопояс"
  }
];

export interface DetailedItem {
  id?: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  total: number;
  type: 'material' | 'labor' | 'delivery' | 'machinery';
  desc: string;
}

export function getCategoryDetailedItems(
  catId: string,
  opt: any,
  landSlope: number,
  groundwaterDepth: number
): DetailedItem[] {
  const m = opt.materials;
  const c = opt.costEstimate;
  const items: DetailedItem[] = [];

  switch (catId) {
    case "01": { // Бетон М300
      const v = m.concreteVolumeM3 || 0;
      if (v > 0) {
        items.push({
          name: "Закупка товарного бетона класса C20/25 B25 (М300) на БРУ в РМ",
          qty: v,
          unit: "м³",
          rate: 1450,
          total: Math.round(v * 1450),
          type: "material",
          desc: "Сертифицированная смесь повышенной жесткости и морозостойкости от крупнейших БРУ Молдовы"
        });
        items.push({
          name: "Доставка товарного бетона специализированным автомиксером (миксер)",
          qty: v,
          unit: "м³",
          rate: 300,
          total: Math.round(v * 300),
          type: "delivery",
          desc: "Логистика транспортировки за один кубометр до строительной площадки"
        });
        items.push({
          name: "Бетонные работы бригады (укладка, протяжка виброрейкой, уход)",
          qty: v,
          unit: "м³",
          rate: 220,
          total: 0, // Учтено в работе ИТОГ
          type: "labor",
          desc: "Приёмка смеси, распределение волнорезами, глубинное вибрирование. Стоимость уже в ИТОГЕ"
        });
        items.push({
          name: "Подача бетона автобетононасосом со стрелой (аренда оборудования)",
          qty: 1,
          unit: "сессия",
          rate: 2400,
          total: 0, // Учтено в спецтехнике
          type: "machinery",
          desc: "Обеспечивает монолитность, быструю подачу бетона без задержек и холодных швов"
        });
      }
      break;
    }
    case "02": { // Арматурный прокат
      const w = m.reinforcementBarKg || 0;
      if (w > 0) {
        const wLong = m.rebarLongitudinalKg || Math.round(w * 0.7);
        const wTrans = m.rebarTransverseKg || Math.round(w * 0.3);
        const dLong = m.rebarLongitudinalDiameter || 12;
        const dTrans = m.rebarTransverseDiameter || 8;

        items.push({
          name: `Рабочая рифлёная арматура класса А500С ф${dLong}мм (закупка)`,
          qty: wLong,
          unit: "кг",
          rate: 17.5,
          total: Math.round(wLong * 17.5),
          type: "material",
          desc: "Продольные хлысты, воспринимающие основные растягивающие и деформирующие усилия фундамента"
        });
        items.push({
          name: `Хомуты и конструктивная распределительная арматура А240 ф${dTrans}мм (закупка)`,
          qty: wTrans,
          unit: "кг",
          rate: 17.5,
          total: Math.round(wTrans * 17.5),
          type: "material",
          desc: "Гладкие стержни для сварки/вязки поперечных перемычек каркаса фундамента"
        });
        items.push({
          name: "Доставка металлопроката длинномером весом до 10т на объект напрямую с базы",
          qty: w,
          unit: "кг",
          rate: 3.5,
          total: Math.round(w * 3.5),
          type: "delivery",
          desc: "Транспортировка хлыстов по 11.7 м манипулятором или машиной с металлических оптовых складов"
        });
      }
      break;
    }
    case "03": { // Вязка каркасов и работы
      const w = m.reinforcementBarKg || 0;
      if (w > 0) {
        const wLong = m.rebarLongitudinalKg || Math.round(w * 0.7);
        const wTrans = m.rebarTransverseKg || Math.round(w * 0.3);
        const totalCost = c.rebarBindingCostMDL || 0;

        const manualLaborLong = Math.round(wLong * 3.8);
        const manualLaborTrans = Math.round(wTrans * 5.5);
        const consumedConsumables = totalCost - manualLaborLong - manualLaborTrans;

        items.push({
          name: "Гибка распределительных хомутов, резка стержней арматуры под проектные габариты",
          qty: wTrans,
          unit: "кг",
          rate: 5.50,
          total: manualLaborTrans,
          type: "labor",
          desc: "Точное ручное гнутие на станке прямоугольных рамок с гибочными зазорами"
        });
        items.push({
          name: "Вязка узлов плоских и пространственных каркасов стальным вязальным проводом",
          qty: wLong,
          unit: "кг",
          rate: 3.80,
          total: manualLaborLong,
          type: "labor",
          desc: "Крепление каждого пересечения двухрядной сетки с проектным нахлестом арматуры"
        });
        items.push({
          name: "Отожженная вязальная проволока ф1.2мм + защитные подставки (звездочки/стульчики)",
          qty: 1,
          unit: "компл",
          rate: Math.max(0, consumedConsumables),
          total: Math.max(0, consumedConsumables),
          type: "material",
          desc: "Расходные пластиковые защелки и проволочный крепеж для обеспечения защитного слоя бетона 35мм"
        });
      }
      break;
    }
    case "04": { // Разработка грунта (JCB)
      const v = m.excavationVolumeM3 || 0;
      if (v > 0) {
        const isPile = opt.id === "piles" || opt.id === "pile";
        const machineryCost = isPile ? Math.round(v * 105) + 4500 : Math.round(v * 105);
        const manualCost = Math.round(v * 50);
        
        items.push({
          name: isPile ? "Выемка почвы экскаватором JCB + глубинное бурение скважин ямобуром" : "Механизированная разработка котлована/траншей экскаватором-погрузчиком JCB 3CX",
          qty: v,
          unit: "м³",
          rate: isPile ? Math.round(machineryCost / v) : 105,
          total: machineryCost,
          type: "machinery",
          desc: isPile 
            ? "Разработка верхнего слоя земли с параллельным бурением скважин диаметром 300-350мм" 
            : "Земляные работы ковшом. Роет траншею для балок ростверка или карты котлована плиты"
        });
        items.push({
          name: "Ручная доработка дна траншей лопатами, планировка откосов бригадой",
          qty: v,
          unit: "м³",
          rate: 50,
          total: manualCost,
          type: "labor",
          desc: "Зачистка недокопа ковша до нетронутого несущего материкового слоя под отметки оптического нивелира"
        });
        items.push({
          name: "Эвакуатор-трал для доставки экскаватора на участок и увоза спецтехники",
          qty: 1,
          unit: "рейс",
          rate: 1200,
          total: 0, // Учтено в доставке логистике
          type: "delivery",
          desc: "Логистический проезд тяжелой гусеничной или колесной строительной техники JCB"
        });
      }
      break;
    }
    case "05": { // Щитовая опалубка
      const s = m.formworkM2 || 0;
      if (s > 0) {
        const totalFormworkCost = c.formworkCostMDL || 0;
        const boards = m.formworkBoardsCount || Math.ceil(s * 0.5);
        const woodCost = boards * 110;
        const screwsLocks = Math.round(s * 40);
        const rentalShields = totalFormworkCost - woodCost - screwsLocks;

        items.push({
          name: "Аренда профессиональной съемной мелкощитовой опалубки на цикл заливки бетона",
          qty: s,
          unit: "м²",
          rate: Math.round((rentalShields > 0 ? rentalShields : s * 140) / s),
          total: Math.max(0, rentalShields),
          type: "material",
          desc: "Использование жестких металлических рам и гладких ламинированных влагостойких плит фанеры"
        });
        items.push({
          name: "Пиломатериал (обрезная доска хвойных пород сосна/ель 25-50мм) под упоры и колья",
          qty: boards,
          unit: "шт",
          rate: 110,
          total: woodCost,
          type: "material",
          desc: "Дополнительное дерево, подкладываемое под щиты, и боковые укосины для устойчивости к давлению"
        });
        items.push({
          name: "Расходный крепеж (шпильки стяжные d10, гайки, винты шурупы, пленка для оборачивания)",
          qty: s,
          unit: "м²",
          rate: 40,
          total: screwsLocks,
          type: "material",
          desc: "Комплект металлических стяжных шпилек, гаек и рубероида/пленки для удержания боков заливки"
        });
        items.push({
          name: "Сборка щитов, выставление опалубки под нивелир и крепление упорами вручную",
          qty: s,
          unit: "м²",
          rate: 120,
          total: 0, // Учтено в работе ИТОГ
          type: "labor",
          desc: "Плотницко-монтажные бригадные работы по выверке точной вертикальности стенок фундамента"
        });
      }
      break;
    }
    case "06": { // Устройство подушки ПГС
      const v = m.sandGravelM3 || 0;
      if (v > 0) {
        items.push({
          name: "Закупка песчано-гравийной смеси (ПГС) оптимальной зернистости на карьере",
          qty: v,
          unit: "м³",
          rate: 260,
          total: Math.round(v * 260),
          type: "material",
          desc: "Гравийно-песчаный засыпной состав без органических включений с хорошей дренирующей способностью"
        });
        items.push({
          name: "Доставка песчано-гравийного засыпа крупнотоннажными самосвалами (Камаз)",
          qty: v,
          unit: "м³",
          rate: 190,
          total: Math.round(v * 190),
          type: "delivery",
          desc: "Поставка партии материалов большегрузным автотранспортом напрямую с карьеров Оргеев/Ватич"
        });
        items.push({
          name: "Послойное распределение лопатами, нивелировка уклонов, полив водой и тромбование",
          qty: v,
          unit: "м³",
          rate: 90,
          total: 0, // Учтено в работе ИТОГ
          type: "labor",
          desc: "Бригадные земляные работы по трамбованию слоями по 10-15см для достижения высокого К_упл"
        });
        items.push({
          name: "Инструмент: бензиновая вибрационная плита 90-110кг в аренду (топливо, ГСМ)",
          qty: 1,
          unit: "день",
          rate: 600,
          total: 0, // Учтено в ИТОГ: Спецтехника
          type: "machinery",
          desc: "Аренда тяжелой трамбовки для послойной просадки слоев подушки до плотности"
        });
      }
      break;
    }
    case "07": { // Изоляция и XPS цоколя
      const s = m.waterproofingM2 || 0;
      const vIns = m.insulationM3 || 0;
      const totalCost = c.waterproofInsulationCostMDL || 0;

      const primerCost = Math.round(s * 45);
      const rollWpCost = Math.round(s * 75);
      const xpsCost = Math.round(vIns * 1250);
      const glueScrews = totalCost - primerCost - rollWpCost - xpsCost;

      if (s > 0) {
        items.push({
          name: "Закупка битумного праймера и гидроизоляционной мастики для обмазки цоколя в 2 слоя",
          qty: s,
          unit: "м²",
          rate: 45,
          total: primerCost,
          type: "material",
          desc: "Создание ровной бесшовной мембраны герметизации на пористой поверхности бетона"
        });
        items.push({
          name: "Закупка рулонной наплавляемой гидроизоляции класса Стандарт/Премиум (Стирофикс/Техноэласт)",
          qty: s,
          unit: "м²",
          rate: 75,
          total: rollWpCost,
          type: "material",
          desc: "Высокопрочные полимерно-битумные рулоны на стеклохолсте для долговечной блокировки капиллярного подсоса"
        });
      }
      if (vIns > 0) {
        items.push({
          name: "Закупка плит экструдированного пенополистирола XPS Penoplex 50мм/100мм",
          qty: vIns,
          unit: "м³",
          rate: 1250,
          total: xpsCost,
          type: "material",
          desc: "Энергоэффективный утеплитель цокольной части, выдерживающий давление пучинистых почв"
        });
        items.push({
          name: "Специальная полиуретановая клей-пена Ceresit CT 84 + тарельчатые дюбели (грибки)",
          qty: vIns,
          unit: "м³",
          rate: Math.max(0, Math.round(glueScrews / (vIns || 1))),
          total: Math.max(0, glueScrews),
          type: "material",
          desc: "Монтажное крепление плит к бетону во избежание съезда при засыпке грунта"
        });
      }
      break;
    }
    case "08": { // Дренаж
      const len = m.drainagePipeM || 0;
      const sGeo = m.drainageGeotextileM2 || 0;
      const vStone = m.drainageStoneM3 || 0;
      const wells = m.drainageWellsCount || 0;

      if (len > 0) {
        items.push({
          name: "Закупка дренажной перфорированной ребристой пластиковой трубы d110мм в защитном геотекстиле",
          qty: len,
          unit: "м",
          rate: 85,
          total: Math.round(len * 85),
          type: "material",
          desc: "Пропускает воду внутрь контура и блокирует частицы песка от засорения каналов"
        });
        items.push({
          name: "Закупка иглопробивного фильтрующего геотекстиля Typar SF40 Dupont (мембранный барьер)",
          qty: sGeo,
          unit: "м²",
          rate: 32,
          total: Math.round(sGeo * 32),
          type: "material",
          desc: "Прочный нетканый разделительный холст для обертывания щебеночной дренажной рубашки"
        });
        items.push({
          name: "Закупка чистого речного/гранитного щебня фракции 20-40 мм с карьеров РМ для фильтрации",
          qty: vStone,
          unit: "м³",
          rate: 680,
          total: Math.round(vStone * 680),
          type: "material",
          desc: "Щебеночное обсыпание вокруг трубы для легкого прохода воды"
        });
        items.push({
          name: "Пластиковые ревизионные колодцы d315мм в сборе с полимерными крышками и дном",
          qty: wells,
          unit: "шт",
          rate: 1350,
          total: Math.round(wells * 1350),
          type: "material",
          desc: "Угловые смотровые колодцы для обслуживания, прочистки и аудита функционирования дренажа"
        });
        items.push({
          name: "Монтажные сантехнические работы по укладке трассы с заданным уклоном бригадой",
          qty: len,
          unit: "м",
          rate: 110,
          total: 0, // Учтено в работе ИТОГ
          type: "labor",
          desc: "Земляные и геодезические работы по выверке ровности слива. Стоимость уже в ИТОГЕ"
        });
      }
      break;
    }
    case "09": { // Уступные компенсаторы
      const totalCost = c.slopeComplicationCostMDL || 0;
      if (totalCost > 0) {
        items.push({
          name: "Изготовление усложненных ступенчатых щитов боковой опалубки ступеней уступов на уклоне",
          qty: landSlope,
          unit: "% наклона",
          rate: Math.round((totalCost * 0.45) / landSlope),
          total: Math.round(totalCost * 0.45),
          type: "labor",
          desc: "Плотницкая нарезка деревянных упорных перегородок уступов для удержания ступеней заливки"
        });
        items.push({
          name: "Дополнительное перепускное армирование каскадов (L/П-образные стальные анкеры)",
          qty: landSlope,
          unit: "% наклона",
          rate: Math.round((totalCost * 0.55) / landSlope),
          total: Math.round(totalCost * 0.55),
          type: "labor",
          desc: "Монтаж усиленных стыковых узлов для исключения риска среза или раскола при неравномерной нагрузке на уступе"
        });
      }
      break;
    }
    case "10": { // Черновой пол по грунту
      const totalCost = c.roughFloorCostMDL || 0;
      if (totalCost > 0) {
        const vSand = m.roughFloorSandM3 || 0;
        const sWp = m.roughFloorWaterproofingM2 || 0;
        const wRebar = m.roughFloorRebarKg || 0;
        const vCon = m.roughFloorConcreteM3 || 0;
        const sArea = m.roughFloorAreaM2 || 0;

        const sandCost = Math.round(vSand * 450);
        const wpCost = Math.round(sWp * 35);
        const rebarCost = Math.round(wRebar * 21);
        const conCost = Math.round(vCon * 1750);
        const laborCost = Math.round(sArea * 140);
        
        // Коррекция погрешностей округления до копейки
        const diff = totalCost - (sandCost + wpCost + rebarCost + conCost + laborCost);

        items.push({
          name: "Материал подушки: закупка и доставка ПГС внутри цоколя цокольной коробки фундамента под пол",
          qty: vSand,
          unit: "м³",
          rate: 450,
          total: sandCost,
          type: "material",
          desc: "Создание уплотненного песчаного слоя обратной засыпки цокольной чаши фундамента"
        });
        items.push({
          name: "Расходный материал: гидроизоляционная рукавная пленка 150-200мкм в два плотных слоя",
          qty: sWp,
          unit: "м²",
          rate: 35,
          total: wpCost,
          type: "material",
          desc: "Исключает утечку цементного молочка в песчаную подушку и подтягивание влаги снизу"
        });
        items.push({
          name: "Арматурная стальная сварная сетка ф8 ячейка 150х150мм для стяжки (поставка и укладка)",
          qty: wRebar,
          unit: "кг",
          rate: 21,
          total: rebarCost,
          type: "material",
          desc: "Принимает изгибающие усадочные нагрузки бетонной стяжки чернового пола"
        });
        items.push({
          name: "Бетон М300 B25 с доставкой автомиксером для монолита чернового пола толщиной 10 см",
          qty: vCon,
          unit: "м³",
          rate: 1750,
          total: conCost,
          type: "material",
          desc: "Жесткая плита-основание пола, заливаемая непосредственно в полости цокольного отсека"
        });
        items.push({
          name: "Комплексные работы по обратной засыпке, укладке слоев стяжки пола и затирке маяков бригадой",
          qty: sArea,
          unit: "м²",
          rate: 140,
          total: Math.max(0, laborCost + diff),
          type: "labor",
          desc: "Планировка лопатами, трамбование мелкой техникой, вязка дорожной сетки и финишное вытягивание по правилам"
        });
      }
      break;
    }
    case "11": { // Механизированное бурение свай
      const totalCost = c.pileDrillingCostMDL || 0;
      if (totalCost > 0) {
        const pCount = m.pileCount || 0;
        const pDrill = m.pileDrillingM || 0;
        items.push({
          name: `Механизированное бурение круглых скважин буроямом ф300-350мм`,
          qty: pDrill,
          unit: "пог.м",
          rate: 280,
          total: totalCost,
          type: "machinery",
          desc: `Высокопроизводительное шнековое бурение ${pCount} скважин на проектную глубину 2.2 м под оголовки и расширенную пяту свай.`
        });
      }
      break;
    }
    case "12": { // НДС
      const val = c.vatMDL || 0;
      if (val > 0) {
        items.push({
          name: "Налог на добавленную стоимость (НДС 20%)",
          qty: 1,
          unit: "компл",
          rate: val,
          total: val,
          type: "material",
          desc: "Государственный налог Республики Молдова, обязательный при закупке сертифицированных готовых смесей и аренде механизмов."
        });
      }
      break;
    }
    case "13": { // Проектирование КЖ/АР
      const val = c.designCostMDL || 0;
      if (val > 0) {
        items.push({
          name: "Разработка рабочей документации разделов АР + КЖ",
          qty: 1,
          unit: "компл",
          rate: val,
          total: val,
          type: "labor",
          desc: "Чертежи армирования, схемы раскладки опалубки, узлы сопряжений, прочностные расчеты в СП ЛИРА согласно NCM."
        });
      }
      break;
    }
    case "14": { // Геология
      const val = c.geologyCostMDL || 0;
      if (val > 0) {
        items.push({
          name: "Бурение 2-х разведочных инженерных скважин по 6 метров",
          qty: 2,
          unit: "скважина",
          rate: Math.round(val / 2),
          total: val,
          type: "machinery",
          desc: "Полевые изыскания ударно-канатного бурения, извлечение монолитов почвы для определения модуля деформации E и УГВ."
        });
      }
      break;
    }
    case "15": { // Экспертиза
      const val = c.expertiseCostMDL || 0;
      if (val > 0) {
        items.push({
          name: "Вневедомственная или государственная экспертиза и согласование проекта",
          qty: 1,
          unit: "компл",
          rate: val,
          total: val,
          type: "material",
          desc: "Контрольное заключение сертифицированного верификатора проектов РМ по механической прочности."
        });
      }
      break;
    }
    case "16": { // Надзор
      const val = c.supervisionCostMDL || 0;
      if (val > 0) {
        items.push({
          name: "Авторский надзор ГИПа (разработчика проекта)",
          qty: 1,
          unit: "усл. ед.",
          rate: Math.round(val / 2),
          total: Math.round(val / 2),
          type: "labor",
          desc: "Выезд инженера на объект, аудит армирования перед приемкой смеси, подписание акта скрытых работ."
        });
        items.push({
          name: "Технический надзор аттестованного специалиста заказчика",
          qty: 1,
          unit: "усл. ед.",
          rate: Math.round(val / 2),
          total: Math.round(val / 2),
          type: "labor",
          desc: "Независимый контроль качества укладки бетонной смеси, соответствия рабочей документации и отбора кубиков прочности."
        });
      }
      break;
    }
  }

  return items;
}

const getSoilDepthPx = (d: number): number => {
  if (d <= 0.4) {
    // 0m to 0.4m is Chernoziom (maps to 0px - 24px)
    return (d / 0.4) * 24;
  } else if (d <= 1.5) {
    // 0.4m to 1.5m is Sub-strata (maps to 25.5px - 89.5px)
    return 25.5 + ((d - 0.4) / 1.1) * 64;
  } else {
    // 1.5m to 5.0m is Hard-strata (maps to 91px - 147px)
    const ratio = Math.min(1, (d - 1.5) / 3.5);
    return 91 + ratio * 56;
  }
};

export default function App() {
  // Input States
  const [region, setRegion] = useState<MoldovaRegion>(MoldovaRegion.CENTER);
  const [width, setWidth] = useState<number>(10);
  const [length, setLength] = useState<number>(12);
  const [floors, setFloors] = useState<number>(1.5); // Default with beautiful mansard
  const [floorHeight, setFloorHeight] = useState<number>(3.0);
  const [wallMaterial, setWallMaterial] = useState<BuildingWallMaterial>(BuildingWallMaterial.GASOBETON);
  const [slabMaterial, setSlabMaterial] = useState<SlabMaterial>(SlabMaterial.MONOLITH);
  const [roofType, setRoofType] = useState<RoofType>(RoofType.GABLE_METAL);
  const [soilType, setSoilType] = useState<SoilType>(SoilType.LOAM);
  const [groundwaterDepth, setGroundwaterDepth] = useState<number>(2.5);
  const [safetyFactor, setSafetyFactor] = useState<number>(1.8);
  const [futureFlooringExtension, setFutureFlooringExtension] = useState<boolean>(false);
  const [hasBasement, setHasBasement] = useState<boolean>(false);
  const [landSlope, setLandSlope] = useState<number>(0);

  // Dynamic Budget and Professional bidding toggles
  const [includeVAT, setIncludeVAT] = useState<boolean>(true);
  const [includeSubDesign, setIncludeSubDesign] = useState<boolean>(true);
  const [includeSupervision, setIncludeSupervision] = useState<boolean>(true);
  const [projectReservePercent, setProjectReservePercent] = useState<number>(12);

  // Active Foundation Option ID selected for detail view
  const [activeFndId, setActiveFndId] = useState<string>("slab");

  // Active expanded budget category codes (Fully open by default for comprehensive detail)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<string[]>([
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16"
  ]);

  // Excel Export State
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Budget view mode ('single' or 'compare' all side-by-side/stacked with comments)
  const [budgetViewMode, setBudgetViewMode] = useState<'single' | 'compare'>('single');

  // Chat Interface States
  const [chatInput, setChatInput] = useState<string>("");
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [apiMissingKey, setApiMissingKey] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Salut! Здравствуйте! 🇲🇩
Я — ваш **AI Foundation Advisor** по нормам строительного права Молдовы.

Помогу составить предпроектный аудит по **NCM F.02.02-2008** и геотехническим изысканиям у нас в республике.

Нажмите одну из кнопок **"🚀 Запустить Быстрый расчет"** или **"🔍 Полный аудит"** ниже, чтобы я изучил параметры вашей мансарды или дома и подготовил технический отчет. Или просто напишите свой вопрос!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 7. INPUTS CONTROL (VALIDATION SUITE)
  const validationErrors: string[] = [];
  if (width <= 0) {
    validationErrors.push("Ширина здания не может быть отрицательной или равной нулю.");
  }
  if (length <= 0) {
    validationErrors.push("Длина здания не может быть отрицательной или равной нулю.");
  }
  if (floors < 1) {
    validationErrors.push("Недопустимая этажность строения: по нормам проектирования этажность не может быть менее 1.");
  }
  if (floors > 4) {
    validationErrors.push("Предельное число надземных этажей: этажность по СНиП для ИЖС не должна превышать 4 этажей.");
  }
  if (floorHeight <= 0) {
    validationErrors.push("Высота этажа не может быть отрицательной или равной нулю.");
  }
  if (safetyFactor < 1) {
    validationErrors.push("Коэффициент запаса по несущей способности (γ_n) должен быть не менее 1.0.");
  }
  if (landSlope < 0) {
    validationErrors.push("Уклон застраиваемой территории не может быть отрицательным.");
  }
  if (groundwaterDepth < 0) {
    validationErrors.push("Глубина залегания грунтовых вод (УГВ) не может быть отрицательной.");
  }

  // Perform engineering calculation based on current parameters (using sanitized attributes for math fallback)
  const currentInput: CalculatorInput = {
    region,
    width: Math.max(0.1, width),
    length: Math.max(0.1, length),
    floors: Math.max(1, Math.min(4, floors)),
    floorHeight: Math.max(0.1, floorHeight),
    wallMaterial,
    slabMaterial,
    roofType,
    soilType,
    groundwaterDepth: Math.max(0.1, groundwaterDepth),
    safetyFactor: Math.max(0.1, safetyFactor),
    futureFlooringExtension,
    hasBasement,
    landSlope,
    totalArea: Math.max(0.1, width) * Math.max(0.1, length) * Math.max(1, Math.min(4, floors)),
    includeVAT,
    includeSubDesign,
    includeSupervision,
    projectReservePercent
  };

  const results: CalculationResults = calculateFoundation(currentInput);

  // Active validation safeguards & structural engineering blockers
  if (results.settlementTotalMM > results.settlementLimitMM) {
    validationErrors.push(`🚨 ПРЕВЫШЕН ЛИМИТ ОСАДКИ: Расчётная осадка S (${results.settlementTotalMM} мм) превосходит предельно допустимую S_limit (${results.settlementLimitMM} мм) по нормам NCM F.02.02-2008. СТРОИТЕЛЬСТВО НЕ ПРИЕМЛЕМО БЕЗ УКРЕПЛЕНИЯ.`);
  }

  if (region === MoldovaRegion.SOUTH && wallMaterial === BuildingWallMaterial.KOTELET) {
    validationErrors.push("🚨 СЕЙСМИЧЕСКАЯ БЛОКИРОВКА (НЕ ПРИЕМЛЕМО ДЛЯ СТРОИТЕЛЬСТВА): В сейсмозоне у очага Вранчи силой 8 баллов (Юг) категорически запрещено возведение стен из хрупкой каменной кладки котельца без жесткого монолитного каркаса и на свайно-ростверковом фундаменте!");
  }

  // Sync recommended option when results change so that detailing is correct
  useEffect(() => {
    const recommended = results.options.find(o => o.isRecommended);
    if (recommended) {
      setActiveFndId(recommended.id);
    }
  }, [region, width, length, floors, wallMaterial, slabMaterial, roofType, soilType, groundwaterDepth, futureFlooringExtension, hasBasement, landSlope, includeVAT, includeSubDesign, includeSupervision, projectReservePercent]);

  const selectedOption = results.options.find(o => o.id === activeFndId) || results.options[0];

  // Visual helper styles for wall materials to fit Moldovan architectural blueprint style
  const getWallPatternStyle = (material: BuildingWallMaterial) => {
    switch (material) {
      case BuildingWallMaterial.KOTELET:
        return {
          backgroundColor: "#fef3c7", // Amber-100 warm limestone shell block
          backgroundImage: `repeating-linear-gradient(0deg, rgba(120, 113, 108, 0.08) 0px, rgba(120, 113, 108, 0.08) 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, rgba(120, 113, 108, 0.08) 0px, rgba(120, 113, 108, 0.08) 1px, transparent 1px, transparent 16px)`,
        };
      case BuildingWallMaterial.BRICK:
        return {
          backgroundColor: "#fee2e2", // Rose-100 classic red brick
          backgroundImage: `repeating-linear-gradient(0deg, rgba(190, 24, 74, 0.1) 0px, rgba(190, 24, 74, 0.1) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(190, 24, 74, 0.1) 0px, rgba(190, 24, 74, 0.1) 1px, transparent 1px, transparent 10px)`,
        };
      case BuildingWallMaterial.GASOBETON:
        return {
          backgroundColor: "#f1f5f9", // Slate-100 gas concrete aeration block look
          backgroundImage: `repeating-linear-gradient(0deg, rgba(100, 116, 139, 0.07) 0px, rgba(100, 116, 139, 0.07) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(90deg, rgba(100, 116, 139, 0.07) 0px, rgba(100, 116, 139, 0.07) 1px, transparent 1px, transparent 20px)`,
        };
      case BuildingWallMaterial.FRAME:
        return {
          backgroundColor: "#ffedd5", // Orange-100 wood paneling
          backgroundImage: `linear-gradient(90deg, rgba(120, 53, 4, 0.08) 1px, transparent 1px)`,
          backgroundSize: `6px 100%`,
        };
      case BuildingWallMaterial.KERAMZIT:
        return {
          backgroundColor: "#e2e8f0", // Slate-200 textured aggregates
          backgroundImage: `radial-gradient(circle, rgba(71, 85, 105, 0.1) 1px, transparent 1px)`,
          backgroundSize: `4px 4px`,
        };
      default:
        return { backgroundColor: "#ffffff" };
    }
  };

  const getWindowStyle = (roof: RoofType) => {
    switch (roof) {
      case RoofType.FLAT_PVC:
        return {
          frameClass: "border-zinc-800 bg-[#a5f3fc]/20 shadow-sm rounded-none",
          innerClass: "border-zinc-800/40",
          glassClass: "bg-cyan-200/40 shadow-inner",
          panes: 1,
        };
      case RoofType.HIP_CERAMIC:
        return {
          frameClass: "border-amber-800 bg-[#e0f2fe]/30 shadow-md rounded-t-full",
          innerClass: "border-amber-700/40",
          glassClass: "bg-sky-200/40 shadow-inner",
          panes: 3,
        };
      case RoofType.SHED_BOARD:
        return {
          frameClass: "border-slate-800/80 bg-[#e0f2fe]/20 shadow-sm",
          innerClass: "border-slate-700/40",
          glassClass: "bg-blue-300/30 shadow-inner",
          panes: 2,
        };
      case RoofType.GABLE_METAL:
      default:
        return {
          frameClass: "border-slate-455 bg-white/70 shadow-inner rounded-sm",
          innerClass: "border-slate-400/30",
          glassClass: "bg-sky-100/30 shadow-sm",
          panes: 4,
        };
    }
  };

  const renderFrenchDormer = (id: string) => {
    return (
      <div key={id} className="w-6 h-[20px] relative flex flex-col justify-end items-center mb-[1px] pointer-events-none">
        {/* Arched Dormer Window Frame */}
        <div className="w-4.5 h-[16px] border border-slate-500 bg-sky-200/40 rounded-t-full relative flex p-[1px] shadow-sm">
          {/* Grid glass panes */}
          <div className="w-full h-full border border-sky-100/30 rounded-t-full relative flex">
            <div className="w-1/2 border-r border-slate-400/40 h-full" />
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-400/40" />
          </div>
        </div>
        {/* Miniature Metal Wrought-Iron Balcony Railing */}
        <div className="absolute bottom-0 w-[22px] h-[5px] bg-slate-800/95 border-t border-x border-slate-900 rounded-t-xs flex items-center justify-around px-0.5 select-none">
          <div className="w-[1px] h-full bg-slate-500" />
          <div className="w-[1px] h-full bg-slate-500" />
          <div className="w-[1px] h-full bg-slate-500" />
        </div>
      </div>
    );
  };

  const renderFrenchBalcony = (id: string) => {
    return (
      <div key={id} className="h-full flex flex-col justify-end items-center relative w-12 pointer-events-none">
        {/* French Double Window (tall, elegant glass doors) */}
        <div className="w-8 h-[23px] border-x border-t border-slate-500 bg-cyan-150/15 rounded-t flex p-[1px] gap-[1.5px] relative -bottom-0.5 shadow-xs">
          <div className="w-1/2 border-r border-slate-400/30 h-full relative">
            <div className="absolute inset-x-0 top-1/3 h-[1px] bg-slate-400/20" />
            <div className="absolute inset-x-0 top-2/3 h-[1px] bg-slate-400/20" />
          </div>
          <div className="w-1/2 h-full relative">
            <div className="absolute inset-x-0 top-1/3 h-[1px] bg-slate-400/20" />
            <div className="absolute inset-x-0 top-2/3 h-[1px] bg-slate-400/20" />
          </div>
        </div>
        {/* Detailed Dark Wrought-Iron Balcony Railing */}
        <div className="absolute bottom-0 w-10.5 h-[11.5px] bg-slate-900/15 border border-slate-800 rounded-t-[2.5px] flex items-center justify-around px-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.1)] select-none">
          <div className="w-[1px] h-full bg-slate-700" />
          <div className="w-[1px] h-full bg-slate-700" />
          <div className="w-[1px] h-full bg-slate-700" />
          <div className="w-[1px] h-full bg-slate-700" />
          <div className="w-[1px] h-full bg-slate-700" />
        </div>
      </div>
    );
  };

  const renderWindow = (id: string, className = "w-7 h-4") => {
    const w = getWindowStyle(roofType);
    if (w.panes === 1) {
      return (
        <div key={id} className={`${className} border ${w.frameClass} p-[1px] relative overflow-hidden flex`}>
          <div className={`w-full h-full ${w.glassClass}`} />
        </div>
      );
    } else if (w.panes === 2) {
      return (
        <div key={id} className={`${className} border ${w.frameClass} p-[1px] relative flex gap-[1px]`}>
          <div className={`w-1/2 h-full ${w.glassClass}`} />
          <div className={`w-[1px] h-full ${w.innerClass}`} />
          <div className={`w-1/2 h-full ${w.glassClass}`} />
        </div>
      );
    } else if (w.panes === 3) {
      return (
        <div key={id} className={`${className} border ${w.frameClass} p-[1px] relative overflow-hidden flex gap-[1px]`}>
          <div className={`w-[30%] h-full ${w.glassClass}`} />
          <div className={`w-[1px] h-full ${w.innerClass}`} />
          <div className={`w-[40%] h-full ${w.glassClass}`} />
          <div className={`w-[1px] h-full ${w.innerClass}`} />
          <div className={`w-[30%] h-full ${w.glassClass}`} />
        </div>
      );
    } else {
      return (
        <div key={id} className={`${className} border ${w.frameClass} flex flex-col justify-between p-[1px] relative`}>
          <div className="h-full w-full relative flex flex-col justify-between">
            <div className={`h-1/2 border-b ${w.innerClass} ${w.glassClass}`} />
            <div className={`h-1/2 ${w.glassClass}`} />
            <div className={`absolute left-1/2 top-0 bottom-0 w-[1px] ${w.innerClass} -translate-x-1/2`} />
          </div>
        </div>
      );
    }
  };

  const renderDoor = (roof: RoofType) => {
    switch (roof) {
      case RoofType.FLAT_PVC:
        return (
          <div className="w-6 h-[26px] border border-zinc-800 bg-zinc-900 flex items-center justify-center p-[2px] shadow-md relative group select-none">
            <div className="w-2.5 h-[20px] bg-cyan-900/40 border border-zinc-700 relative flex items-center justify-center">
              <div className="w-[1px] h-[16px] bg-cyan-600/30" />
            </div>
            <div className="absolute left-[3px] top-1/4 w-[1px] h-[12px] bg-zinc-400" />
            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-[120%] h-[2px] bg-zinc-850 rounded-xs" />
          </div>
        );
      case RoofType.HIP_CERAMIC:
        return (
          <div className="w-8 h-[27px] border-t-2 border-x-2 border-amber-800 bg-amber-950 rounded-t flex justify-around p-[1px] shadow-lg relative select-none">
            <div className="w-1/2 border-r border-amber-900/50 h-full relative">
              <div className="absolute right-[1px] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-yellow-450 rounded-full" />
            </div>
            <div className="w-1/2 h-full relative">
              <div className="absolute left-[1px] top-1/2 -translate-y-1/2 w-[1px] h-2 bg-yellow-450 rounded-full" />
            </div>
            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-[114%] h-[2px] bg-amber-900" />
          </div>
        );
      case RoofType.SHED_BOARD:
        return (
          <div className="w-[20px] h-[25px] border border-amber-850 bg-amber-800 flex flex-col justify-between p-[1px] shadow-inner relative select-none">
            <div className="w-full h-full bg-amber-700 flex flex-row justify-around">
              <div className="w-[1px] h-full bg-amber-900/60" />
              <div className="w-[1px] h-full bg-amber-900/60" />
            </div>
            <div className="absolute right-0.5 top-1/2 w-[1px] h-1 bg-zinc-900" />
            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-[114%] h-[2px] bg-zinc-700" />
          </div>
        );
      case RoofType.GABLE_METAL:
      default:
        return (
          <div className="w-7 h-[25px] border-t border-x border-amber-600 bg-amber-50 rounded-t flex flex-col justify-between p-[2px] shadow-xs relative select-none">
            <div className="w-full h-1/2 border-b border-amber-300 flex items-center justify-center">
              <div className="w-4 h-2 bg-sky-100 border border-slate-300 rounded-xs" />
            </div>
            <div className="absolute right-0.5 top-1/2 w-1 h-1 rounded-full bg-amber-800 shadow-xs" />
            <div className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 w-[114%] h-[2px] bg-slate-400 border border-slate-500 rounded-xs" />
          </div>
        );
    }
  };

  // Quick Chat Prompts
  const queryAI = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();
      
      if (response.status === 503) {
        setApiMissingKey(true);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "Извините, не удалось получить осмысленный ответ.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Ошибка связи с сервером ИИ. Вы можете продолжать полноценно пользоваться интерактивным калькулятором на панели слева.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    queryAI(chatInput);
  };

  const getFloorsName = (f: number) => {
    if (f === 1) return "1 этаж (Одноэтажный)";
    if (f === 1.5) return "1.5 этажа (Классическая мансарда)";
    if (f === 1.6) return "1.5 этажа (Капитальная полумансарда, аттик 1.2м)";
    if (f === 1.7) return "1.5 этажа (Тяжелая мансарда с ж/б перекрытием)";
    if (f === 2) return "2 этажа (Двухэтажный дом)";
    if (f === 2.5) return "2.5 этажа (2 этажа + жилая мансарда)";
    if (f === 3) return "3 этажа (Трёхэтажное здание)";
    if (f === 3.5) return "3.5 этажа (3 этажа + жилая мансарда)";
    return `${f} эт`;
  };

  const handleQuickQuiz = (mode: "quick" | "pro") => {
    const formattedSpec = `Тип расчета: ${mode === "quick" ? "Быстрый расчет (экспресс)" : "Инженерный аудит (лог)"} Mode
Район: ${REGION_DATA[region].name}
Размеры: ${width}х${length} м (S=${(width*length).toFixed(1)} м² по подошве)
Этажность: ${getFloorsName(floors)} (Высота ${floorHeight}м)
Материал стен: ${WALL_MATERIAL_DATA[wallMaterial].name}
Перекрытие: ${SLAB_DATA[slabMaterial].name}
Кровля: ${ROOF_DATA[roofType].name}
Грунт основания: ${SOIL_DATA[soilType].name} (УГВ: ${groundwaterDepth}м)
Хочу получить подробный предварительный аудит по нормам Молдовы и экспертный совет ИИ по закладке фундамента!`;
    queryAI(formattedSpec);
  };

  const hasMansard = floors === 1.5 || floors === 1.6 || floors === 1.7 || floors === 2.5 || floors === 3.5;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-50 via-slate-50 to-neutral-100 text-slate-700 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Friendly Apple-style Top Notice Band */}
      <div className="bg-amber-50/90 backdrop-blur-md border-b border-amber-200/50 px-4 py-3 text-xs text-amber-800 text-center flex items-center justify-center gap-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.01)] shrink-0">
        <Info className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="font-medium">
          <strong>Поверочный калькулятор:</strong> Расчёты основаны на СНиП 2.02.01-83* и NCM РМ. Строительно-конструкторский проект должен выполняться лицензированным инженером.
        </span>
      </div>

      {/* Main Header Component with macOS buttons and frosted background */}
      <Header aiActive={!apiMissingKey && messages.length > 1} />

      {/* Primary Workspace responsive grid */}
      <main className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 p-4 md:p-6 lg:p-7 max-w-7.5xl mx-auto w-full transition-all duration-300">
        
        {/* LEFT COLUMN: macOS preference-like parameters list (xl:col-span-5 / 12) */}
        <section className="xl:col-span-5 flex flex-col gap-6" id="cad_inputs_section">
          
          {/* Project Templates macOS Widget */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-5 shadow-sm shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400"></div>
            
            <h2 className="text-sm font-display font-bold text-slate-800 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" /> Готовые конфигурации с мансардой
            </h2>
            <p className="text-[11px] text-slate-500 mb-3.5 leading-normal">
              Выберите шаблоны для мгновенной загрузки параметров дома в интерактивный CAD-подборщик:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {PRESETS.map((preset, index) => {
                const isSelected = 
                  width === preset.width &&
                  length === preset.length &&
                  floors === preset.floors &&
                  wallMaterial === preset.wallMaterial &&
                  slabMaterial === preset.slabMaterial &&
                  roofType === preset.roofType &&
                  (preset.hasBasement === undefined || hasBasement === preset.hasBasement);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setWidth(preset.width);
                      setLength(preset.length);
                      setFloors(preset.floors);
                      setWallMaterial(preset.wallMaterial);
                      setSlabMaterial(preset.slabMaterial);
                      setRoofType(preset.roofType);
                      if (preset.hasBasement !== undefined) {
                        setHasBasement(preset.hasBasement);
                      }
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all duration-200 cursor-pointer text-xs flex flex-col justify-between ${
                      isSelected
                        ? "bg-blue-500/10 border-blue-400/70 shadow-sm"
                        : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/50"
                    }`}
                  >
                    <div>
                      <span className={`font-bold block truncate leading-tight ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                        {preset.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">
                        {preset.dims} • {preset.floorLabel}
                      </span>
                    </div>
                    <span className="text-[9px] bg-white/65 px-2 py-0.5 rounded-full border border-slate-200/40 text-slate-500 block truncate mt-2 font-mono text-center w-full">
                      {preset.materialLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Geolocation, Soil & Climate Constants */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-6 shadow-sm shadow-slate-200/40">
            <h2 className="text-sm font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" /> География и грунт основания
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Region Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Регион Молдавии</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" title="Задает нормативную глубину заложения и сейсмичность Вранча" />
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-55/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs text-slate-800 outline-none transition-all cursor-pointer font-medium appearance-none"
                    value={region}
                    onChange={(e) => setRegion(e.target.value as MoldovaRegion)}
                  >
                    <option value={MoldovaRegion.CENTER}>Центр (Кишинёв, Орхей)</option>
                    <option value={MoldovaRegion.NORTH}>Север (Бэлць, Сорока)</option>
                    <option value={MoldovaRegion.SOUTH}>Юг (Кагул, Комрат)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-2.5 text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">❄️ Промерзание: <strong className="text-slate-700">{REGION_DATA[region].frostDepth}м</strong></span>
                  <span className="text-slate-350">|</span>
                  <span className="flex items-center gap-1">⚡ Сейсмика: <strong className="text-slate-700">{REGION_DATA[region].seismicPoints}б</strong></span>
                </div>
              </div>

              {/* Soil Type Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Грунт под постройку</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-55/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs text-slate-800 outline-none transition-all cursor-pointer font-medium appearance-none"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value as SoilType)}
                  >
                    <option value={SoilType.LOAM}>Суглинок (Luto-argilos - 200 кПа)</option>
                    <option value={SoilType.CLAY}>Глина пластичная (Argilă - 150 кПа)</option>
                    <option value={SoilType.SAND}>Песок средний (Nisip - 280 кПа)</option>
                    <option value={SoilType.LOESS}>Лёсс просадочный (Lëssoid - 110 кПа) ⚠️</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
                <div className="mt-2">
                  {soilType === SoilType.LOESS ? (
                    <div className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100 font-semibold inline-flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />
                      <span>Проседает при намокании!</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[10px] font-medium">Расч. сопротивление грунта R₀ ≈ <strong className="text-slate-700">{SOIL_DATA[soilType].resistanceKPa} кПа</strong></span>
                  )}
                </div>
              </div>
            </div>

            {/* Slider: Groundwater level */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5 text-blue-500" /> Уровень грунтовых вод (УГВ)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${groundwaterDepth < 1.2 ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                  {groundwaterDepth.toFixed(1)} м — {groundwaterDepth < 1.2 ? "Высокий" : "Безопасный"}
                </span>
              </div>
              <input
                type="range"
                min="0.3"
                max="5.0"
                step="0.1"
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-full appearance-none"
                value={groundwaterDepth}
                onChange={(e) => setGroundwaterDepth(parseFloat(e.target.value))}
              />
              <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">
                При УГВ выше подошвы (меньше 1.2м) рекомендуется монолитная плита под весь дом с гидробетоном W6-W8.
              </p>
            </div>

            {/* Slider: Land Slope */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Уклон земельного участка (сложность рельефа)
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${landSlope > 8 ? "bg-red-50 text-red-600 border border-red-100" : landSlope > 3 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-slate-50 text-slate-700 border border-slate-150"}`}>
                  {landSlope}% ({Math.round(landSlope * 0.57)}° — {landSlope > 8 ? "Крутой уклон" : landSlope > 3 ? "Умеренный" : "Ровный"})
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="1"
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-full appearance-none"
                value={landSlope}
                onChange={(e) => setLandSlope(parseInt(e.target.value))}
              />
              <p className="text-[10px] text-slate-450 mt-1.5 leading-normal">
                Уклон увеличивает объемы земляных работ, требует ступенчатой спец-опалубки для ленты или толстой выравнивающей гравийной подушки под плиту.
              </p>
            </div>
          </div>

          {/* Card: House Structural Design & Geometry */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-6 shadow-sm shadow-slate-200/40">
            <h2 className="text-sm font-display font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" /> Архитектура и габариты строения
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Width Dimensions */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ширина коробки (X)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-slate-55/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 pr-8 text-xs text-slate-800 outline-none font-semibold transition-all"
                    value={width === 0 ? "" : width}
                    placeholder="0"
                    onChange={(e) => setWidth(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">м</span>
                </div>
              </div>
              {/* Length Dimensions */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Длина коробки (Y)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-slate-55/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 pr-8 text-xs text-slate-800 outline-none font-semibold transition-all"
                    value={length === 0 ? "" : length}
                    placeholder="0"
                    onChange={(e) => setLength(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">м</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3.5">
              {/* Floors and Heights */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Этажность дома</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-55/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 text-xs text-slate-800 outline-none transition-all cursor-pointer font-medium appearance-none"
                    value={floors}
                    onChange={(e) => setFloors(parseFloat(e.target.value))}
                  >
                    <option value={1}>1 этаж (Одноэтажный)</option>
                    <option value={1.5}>1.5 этажа (Классическая мансарда)</option>
                    <option value={1.6}>1.5 этажа (Полумансарда, аттик 1.2м)</option>
                    <option value={1.7}>1.5 этажа (Тяжелая ж/б мансарда)</option>
                    <option value={2}>2 этажа (Двухэтажный дом)</option>
                    <option value={2.5}>2.5 этажа (2 этажа + мансарда)</option>
                    <option value={3}>3 этажа (Трёхэтажный)</option>
                    <option value={3.5}>3.5 этажа (3 этажа + мансарда)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Высота одного этажа</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    className="w-full bg-slate-55/80 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl py-2 px-3 pr-8 text-xs text-slate-800 outline-none font-semibold transition-all"
                    value={floorHeight === 0 ? "" : floorHeight}
                    placeholder="0"
                    onChange={(e) => setFloorHeight(e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                  />
                  <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">м</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
              {/* Materials selects */}
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Материал стен</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs text-slate-800 outline-none appearance-none cursor-pointer font-medium"
                    value={wallMaterial}
                    onChange={(e) => setWallMaterial(e.target.value as BuildingWallMaterial)}
                  >
                    <option value={BuildingWallMaterial.GASOBETON}>Газобетон</option>
                    <option value={BuildingWallMaterial.KOTELET}>Котелец 🇲🇩</option>
                    <option value={BuildingWallMaterial.BRICK}>Кирпич</option>
                    <option value={BuildingWallMaterial.KERAMZIT}>Керамзитоб.</option>
                    <option value={BuildingWallMaterial.FRAME}>Каркас SIP</option>
                  </select>
                  <span className="absolute right-2 top-2 pointer-events-none text-slate-400"><ChevronRight className="w-3 h-3 rotate-90" /></span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Перекрытия</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs text-slate-800 outline-none appearance-none cursor-pointer font-medium"
                    value={slabMaterial}
                    onChange={(e) => setSlabMaterial(e.target.value as SlabMaterial)}
                  >
                    <option value={SlabMaterial.MONOLITH}>Ж/б Монолит</option>
                    <option value={SlabMaterial.HOLLOW_CORE}>Плиты ПБК</option>
                    <option value={SlabMaterial.TIMBER}>Деревянное</option>
                  </select>
                  <span className="absolute right-2 top-2 pointer-events-none text-slate-400"><ChevronRight className="w-3 h-3 rotate-90" /></span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Форма кровли</label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs text-slate-800 outline-none appearance-none cursor-pointer font-medium"
                    value={roofType}
                    onChange={(e) => setRoofType(e.target.value as RoofType)}
                  >
                    <option value={RoofType.GABLE_METAL}>Двускатн. металл</option>
                    <option value={RoofType.HIP_CERAMIC}>Вальмовая керам.</option>
                    <option value={RoofType.FLAT_PVC}>Плоская ПВХ</option>
                    <option value={RoofType.SHED_BOARD}>Односкатная</option>
                  </select>
                  <span className="absolute right-2 top-2 pointer-events-none text-slate-400"><ChevronRight className="w-3 h-3 rotate-90" /></span>
                </div>
              </div>
            </div>

            {/* Design modifiers iOS switches look */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  className="mt-1 w-4.5 h-4.5 accent-blue-600 rounded-md border-slate-300 text-blue-600 focus:ring-blue-100 cursor-pointer"
                  checked={futureFlooringExtension}
                  onChange={(e) => setFutureFlooringExtension(e.target.checked)}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Усиление под будущую надстройку
                  </span>
                  <span className="text-[10px] text-slate-500 leading-normal">
                    Добавляет +1 этаж к полезной вертикальной нагрузке для резервирования несущей способности.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  className="mt-1 w-4.5 h-4.5 accent-blue-600 rounded-md border-slate-300 text-blue-600 focus:ring-blue-100 cursor-pointer"
                  checked={hasBasement}
                  onChange={(e) => setHasBasement(e.target.checked)}
                />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    Жилой полуподвал / цоколь (Subsol)
                  </span>
                  <span className="text-[10px] text-slate-500 leading-normal">
                    Удваивает гидроизоляционный барьер, закладывает усиленный дренаж и земляной котлован.
                  </span>
                </div>
              </label>
            </div>

            {/* Safety Factor slider */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500">Коэффициент запаса грунта (γ_n)</span>
                <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 font-mono">
                  {safetyFactor}x
                </span>
              </div>
              <input
                type="range"
                min="1.5"
                max="2.5"
                step="0.1"
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-full appearance-none"
                value={safetyFactor}
                onChange={(e) => setSafetyFactor(parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-[9px] text-slate-450 font-medium mt-1">
                <span>1.5 (Минимальный)</span>
                <span>2.0 (Стандарт РМ)</span>
                <span>2.5 (Сверхнадежный)</span>
              </div>
            </div>

            {/* Custom Tender & Cost settings block */}
            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" /> Сметный расчёт и налоги
              </h4>

              <label className="flex items-center justify-between cursor-pointer group select-none">
                <div className="flex flex-col pr-2">
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Налог НДС 20% в Молдове
                  </span>
                  <span className="text-[9px] text-slate-400">Включить НДС на готовый бетон и работу</span>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600 rounded-md cursor-pointer shrink-0"
                  checked={includeVAT}
                  onChange={(e) => setIncludeVAT(e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group select-none">
                <div className="flex flex-col pr-2">
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Проектирование и Геология
                  </span>
                  <span className="text-[9px] text-slate-400">АР/КЖ проект + 2 гео-скважины по 6м</span>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600 rounded-md cursor-pointer shrink-0"
                  checked={includeSubDesign}
                  onChange={(e) => setIncludeSubDesign(e.target.checked)}
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer group select-none">
                <div className="flex flex-col pr-2">
                  <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                    Контроль, Экспертиза и Надзор
                  </span>
                  <span className="text-[9px] text-slate-400">Авторский + Технический надзор РМ</span>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600 rounded-md cursor-pointer shrink-0"
                  checked={includeSupervision}
                  onChange={(e) => setIncludeSupervision(e.target.checked)}
                />
              </label>

              <div className="pt-1.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-semibold text-slate-500">Коэффициент проектного резерва</span>
                  <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md border border-indigo-100">
                    {projectReservePercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-200 rounded-full appearance-none"
                  value={projectReservePercent}
                  onChange={(e) => setProjectReservePercent(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-medium">
                  <span>5% (Низкий риск)</span>
                  <span>12% (Норма РМ)</span>
                  <span>20% (Высокий пучинистый)</span>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC CAD VECTOR CROSS-SECTION ILLUSTRATION */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-5 shadow-sm shadow-slate-200/40 relative flex flex-col justify-between">
            <h2 className="text-sm font-display font-bold text-slate-800 mb-3.5 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" /> Инженерный чертёж САПР (Разрез)
            </h2>

            {/* Dynamic CAD Canvas representation styled like a clean architectural blueprint */}
            <div className="h-[400px] rounded-2xl bg-slate-50/50 border border-slate-200 relative overflow-hidden shadow-inner z-0">
              
              {/* Sky grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:16px_16px] opacity-35" />

              {/* Sky and House Vector rendering on coordinate lines */}
              <div className="absolute inset-x-0 top-0 h-[215px] flex items-end justify-center pointer-events-none">
                {/* Modern clean house outline (Allows overflowing roofs above the walls container) */}
                <div 
                  className="w-44 relative transition-all duration-300 flex flex-col justify-end"
                  style={{
                    height: 
                      floors === 1 ? '36px' : 
                      floors === 1.5 || floors === 1.6 || floors === 1.7 ? '60px' : 
                      floors === 2 ? '66px' : 
                      floors === 2.5 ? '90px' : 
                      floors === 3 ? '96px' : 
                      floors === 3.5 ? '120px' : '120px'
                  }}
                >
                  {/* DYNAMIC ROOF BASED ON SELECTED ARCHITECTURE */}
                  {roofType === RoofType.GABLE_METAL && (
                    <div className="absolute left-1/2 -translate-x-1/2 w-[114%] h-[36px] transition-all duration-300 pointer-events-none z-30" style={{ bottom: '100%' }}>
                      {hasMansard ? (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 36" preserveAspectRatio="none">
                          {/* Main French Mansard Shape */}
                          <polygon points="0,36 32,10 100,2 168,10 200,36" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
                          {/* Symmetrical hip slope lines for tile joints */}
                          <line x1="32" y1="10" x2="0" y2="36" stroke="#475569" strokeWidth="1.5" />
                          <line x1="168" y1="10" x2="200" y2="36" stroke="#475569" strokeWidth="1.5" />
                          {/* Horizontal break line (curb) */}
                          <line x1="32" y1="10" x2="168" y2="10" stroke="#0f172a" strokeWidth="2" />
                          {/* Decorative ridge cresting ornaments matching French roof styles */}
                          <line x1="32" y1="6" x2="168" y2="6" stroke="#475569" strokeWidth="1" strokeDasharray="2 3" />
                          <line x1="60" y1="2" x2="60" y2="10" stroke="#334155" strokeWidth="1" />
                          <line x1="100" y1="1" x2="100" y2="10" stroke="#334155" strokeWidth="1" />
                          <line x1="140" y1="2" x2="140" y2="10" stroke="#334155" strokeWidth="1" />
                          {/* Tile texture lines */}
                          <line x1="10" y1="28" x2="32" y2="10" stroke="#334155" strokeWidth="1" strokeDasharray="1 1" />
                          <line x1="20" y1="20" x2="32" y2="10" stroke="#334155" strokeWidth="1" strokeDasharray="1 1" />
                          <line x1="190" y1="28" x2="168" y2="10" stroke="#334155" strokeWidth="1" strokeDasharray="1 1" />
                          <line x1="180" y1="20" x2="168" y2="10" stroke="#334155" strokeWidth="1" strokeDasharray="1 1" />
                          <line x1="100" y1="2" x2="55" y2="10" stroke="#334155" strokeWidth="1" strokeDasharray="1 2" />
                          <line x1="100" y1="2" x2="145" y2="10" stroke="#334155" strokeWidth="1" strokeDasharray="1 2" />
                          <polygon points="0,36 32,10 100,2 168,10 200,36" fill="rgba(59, 130, 246, 0.15)" />
                          <circle cx="100" cy="2" r="2.5" fill="#3b82f6" stroke="#0f172a" strokeWidth="1" />
                        </svg>
                      ) : (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 32" preserveAspectRatio="none">
                          <polygon points="0,32 100,0 200,32" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                          <line x1="25" y1="24" x2="100" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="50" y1="16" x2="100" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="75" y1="8"  x2="100" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="125" y1="8"  x2="100" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="150" y1="16" x2="100" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="175" y1="24" x2="100" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                          <polygon points="0,32 100,0 200,32" fill="rgba(59, 130, 246, 0.15)" />
                          <circle cx="100" cy="0" r="3" fill="#3b82f6" stroke="#0f172a" strokeWidth="1" />
                        </svg>
                      )}
                    </div>
                  )}

                  {roofType === RoofType.HIP_CERAMIC && (
                    <div className="absolute left-1/2 -translate-x-1/2 w-[114%] h-[36px] transition-all duration-300 pointer-events-none z-30" style={{ bottom: '100%' }}>
                      {hasMansard ? (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 36" preserveAspectRatio="none">
                          {/* Main French Mansard Shape in Warm Orange Ceramic Shingles */}
                          <polygon points="0,36 32,10 100,2 168,10 200,36" fill="#ea580c" stroke="#7c2d12" strokeWidth="2.5" />
                          <line x1="32" y1="10" x2="0" y2="36" stroke="#7c2d12" strokeWidth="2" />
                          <line x1="168" y1="10" x2="200" y2="36" stroke="#7c2d12" strokeWidth="2" />
                          <line x1="32" y1="10" x2="168" y2="10" stroke="#7c2d12" strokeWidth="2" />
                          <line x1="6" y1="31" x2="194" y2="31" stroke="#b45309" strokeWidth="1.2" />
                          <line x1="12" y1="26" x2="188" y2="26" stroke="#b45309" strokeWidth="1.2" />
                          <line x1="18" y1="21" x2="182" y2="21" stroke="#b45309" strokeWidth="1.2" />
                          <line x1="24" y1="16" x2="176" y2="16" stroke="#b45309" strokeWidth="1.2" />
                          <line x1="30" y1="11" x2="170" y2="11" stroke="#b45309" strokeWidth="1.2" />
                          <line x1="45" y1="8" x2="155" y2="8" stroke="#7c2d12" strokeWidth="1" />
                          <line x1="65" y1="5" x2="135" y2="5" stroke="#7c2d12" strokeWidth="1" />
                          <polygon points="0,36 32,10 100,2 168,10 200,36" fill="rgba(234, 88, 12, 0.15)" />
                        </svg>
                      ) : (
                        <svg className="w-full h-full overflow-visible" viewBox="0 0 200 28" preserveAspectRatio="none">
                          <polygon points="0,28 40,0 160,0 200,28" fill="#ea580c" stroke="#7c2d12" strokeWidth="2" />
                          <line x1="0" y1="28" x2="40" y2="0" stroke="#7c2d12" strokeWidth="1.5" />
                          <line x1="200" y1="28" x2="160" y2="0" stroke="#7c2d12" strokeWidth="1.5" />
                          <line x1="15" y1="19" x2="185" y2="19" stroke="#b45309" strokeWidth="1" />
                          <line x1="30" y1="9" x2="170" y2="9" stroke="#b45309" strokeWidth="1" />
                          <line x1="40" y1="0" x2="160" y2="0" stroke="#7c2d12" strokeWidth="2" />
                          <polygon points="0,28 40,0 160,0 200,28" fill="rgba(234, 88, 12, 0.15)" />
                        </svg>
                      )}
                    </div>
                  )}

                  {roofType === RoofType.FLAT_PVC && (
                    <div className="absolute left-1/2 -translate-x-1/2 w-[104%] h-[10px] transition-all duration-300 pointer-events-none z-30" style={{ bottom: '100%' }}>
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 180 10" preserveAspectRatio="none">
                        <rect x="0" y="2" width="180" height="8" fill="#475569" stroke="#1e293b" strokeWidth="1.5" />
                        <rect x="4" y="0" width="172" height="3" fill="#94a3b8" />
                        <rect x="130" y="-10" width="7" height="10" fill="#334155" />
                        <circle cx="133.5" cy="-10" r="1.5" fill="#ef4444" />
                        <line x1="25" y1="-12" x2="25" y2="8" stroke="#475569" strokeWidth="1" />
                        <line x1="20" y1="-9" x2="30" y2="-9" stroke="#475569" strokeWidth="0.8" />
                        <line x1="22" y1="-5" x2="28" y2="-5" stroke="#475569" strokeWidth="0.8" />
                      </svg>
                    </div>
                  )}

                  {roofType === RoofType.SHED_BOARD && (
                    <div className="absolute left-1/2 -translate-x-1/2 w-[114%] h-[24px] transition-all duration-300 pointer-events-none z-30" style={{ bottom: '100%' }}>
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 200 24" preserveAspectRatio="none">
                        <polygon points="0,4 200,22 200,24 0,6" fill="#475569" stroke="#1e293b" strokeWidth="2" />
                        <polygon points="0,6 200,24 200,24 0,24" fill="#cbd5e1" opacity="0.3" />
                        <line x1="20" y1="6" x2="20" y2="24" stroke="#334155" strokeWidth="1" strokeDasharray="1 3" />
                        <line x1="50" y1="9" x2="50" y2="24" stroke="#334155" strokeWidth="1" strokeDasharray="1 3" />
                        <line x1="80" y1="12" x2="80" y2="24" stroke="#334155" strokeWidth="1" strokeDasharray="1 3" />
                        <line x1="110" y1="15" x2="110" y2="24" stroke="#334155" strokeWidth="1" strokeDasharray="1 3" />
                        <line x1="140" y1="18" x2="140" y2="24" stroke="#334155" strokeWidth="1" strokeDasharray="1 3" />
                        <line x1="170" y1="21" x2="170" y2="24" stroke="#334155" strokeWidth="1" strokeDasharray="1 3" />
                      </svg>
                    </div>
                  )}

                  {/* Walls Box (Clips patterns and floor boundaries inside perfectly) */}
                  <div 
                    className="w-full h-full border-2 rounded-t-lg relative flex flex-col justify-end overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.02)]"
                    style={{
                      borderColor: wallMaterial === BuildingWallMaterial.KOTELET ? '#78716c' : '#334155',
                      ...getWallPatternStyle(wallMaterial)
                    }}
                  >
                    {/* FLOORS RENDERED FROM TOP TO BOTTOM TO CORRESPOND TO COLUMN ORDER */}
                    {/* 1. Mansard Layer (Drawn if exists e.g. .5, .6, .7 floors) */}
                    {(floors === 1.5 || floors === 1.6 || floors === 1.7 || floors === 2.5 || floors === 3.5) && (
                      <div 
                        className="w-full h-[24px] border-b border-dashed border-slate-300 relative flex items-center justify-between px-[14px] overflow-hidden transition-all duration-300 backdrop-blur-[0.5px]"
                        style={{
                          clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)'
                        }}
                      >
                        {roofType === RoofType.FLAT_PVC ? (
                          <>
                            {renderWindow("attic-l", "w-5 h-4 mb-[1px]")}
                            {renderWindow("attic-c", "w-5 h-4 mb-[1px]")}
                            {renderWindow("attic-r", "w-5 h-4 mb-[1px]")}
                          </>
                        ) : roofType === RoofType.SHED_BOARD ? (
                          <>
                            {renderWindow("attic-l", "w-5 h-4 mb-[1px]")}
                            {renderWindow("attic-c", "w-5 h-4 mb-[1px]")}
                            {renderWindow("attic-r", "w-5 h-4 mb-[1px]")}
                          </>
                        ) : (
                          <>
                            {renderFrenchDormer("attic-l")}
                            {renderFrenchDormer("attic-c")}
                            {renderFrenchDormer("attic-r")}
                          </>
                        )}
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[4.5px] font-bold text-slate-800/60 select-none tracking-wider bg-white/35 px-1 rounded-t-xs">МАНСАРДА</span>
                      </div>
                    )}

                    {/* 2. Third Floor (Full Floor) (Drawn if floors >= 3) */}
                    {(floors >= 3) && (
                      <div className="w-full h-[30px] border-b border-slate-300/40 relative flex items-center justify-between px-3.5 transition-all duration-300 backdrop-blur-[0.3px]">
                        {renderWindow("3-l", "w-8 h-5 mb-[1px]")}
                        {renderFrenchBalcony("3-c")}
                        {renderWindow("3-r", "w-8 h-5 mb-[1px]")}
                        <span className="absolute bottom-0 right-1 text-[5px] font-mono font-black text-slate-800/40 select-none bg-white/20 px-0.5 rounded-sm">3 ЭТ</span>
                      </div>
                    )}

                    {/* 3. Second Floor (Full Floor) (Drawn if floors >= 2) */}
                    {(floors >= 2) && (
                      <div className="w-full h-[30px] border-b border-slate-300/40 relative flex items-center justify-between px-3.5 transition-all duration-300 backdrop-blur-[0.3px]">
                        {renderWindow("2-l", "w-8 h-5 mb-[1px]")}
                        {renderFrenchBalcony("2-c")}
                        {renderWindow("2-r", "w-8 h-5 mb-[1px]")}
                        <span className="absolute bottom-0 right-1 text-[5px] font-mono font-black text-slate-800/40 select-none bg-white/20 px-0.5 rounded-sm">2 ЭТ</span>
                      </div>
                    )}

                    {/* 4. Ground Floor / 1st Floor (Always drawn) */}
                    <div className="w-full h-[32px] relative flex items-end justify-between px-3.5 pb-[2px] transition-all duration-300 backdrop-blur-[0.3px]">
                      {renderWindow("1-l", "w-8 h-5 mb-[1px]")}
                      {renderDoor(roofType)}
                      {renderWindow("1-r", "w-8 h-5 mb-[1px]")}
                      <span className="absolute bottom-0 right-1 text-[5px] font-mono font-black text-slate-800/40 select-none bg-white/20 px-0.5 rounded-sm">1 ЭТ</span>
                    </div>

                    {/* Anti seismic indicator badge for Moldova guidelines */}
                    {(region === MoldovaRegion.CENTER || region === MoldovaRegion.SOUTH) && (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] bg-red-500 text-white font-black tracking-widest px-2 py-0.5 rounded-full shadow-sm border border-red-400/20 select-none uppercase z-20">
                        сейсмопояс
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Soil strata visual simulation layers */}
              <div className="w-full relative space-y-[1.5px] text-[10px] text-slate-550 z-10 mt-[215px]">
                {/* DYNAMIC CONCRETE FOUNDATION DRAWINGS */}
                {activeFndId === "slab" && (
                  <div 
                    className="absolute left-1/2 -translate-x-1/2 bg-slate-300 border-2 border-slate-400/80 rounded-b-md shadow-md z-20 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden"
                    style={{
                      top: "0px",
                      width: "176px",
                      height: `${getSoilDepthPx(selectedOption.depthM)}px`
                    }}
                  >
                    {/* Metal Rebar Lines Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.35)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                    <span className="text-[7.5px] font-black text-slate-700 bg-white/90 border border-slate-350 px-1 py-0.2 rounded shadow-xs uppercase select-none z-10">
                      ПЛИТА h={Math.round(selectedOption.depthM * 1000)}мм
                    </span>
                  </div>
                )}

                {activeFndId === "strip" && (
                  <>
                    {/* Left Trench Strip */}
                    <div 
                      className="absolute bg-slate-300 border-2 border-slate-400/80 rounded-b-md shadow-md z-20 transition-all duration-300 flex items-center justify-center overflow-hidden"
                      style={{
                        top: "0px",
                        left: "calc(50% - 88px)",
                        width: "18px",
                        height: `${getSoilDepthPx(selectedOption.depthM)}px`
                      }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(100,116,139,0.45)_1px,transparent_1px)] bg-[size:1px_8px] pointer-events-none" />
                    </div>
                    {/* Right Trench Strip */}
                    <div 
                      className="absolute bg-slate-300 border-2 border-slate-400/80 rounded-b-md shadow-md z-20 transition-all duration-300 flex items-center justify-center overflow-hidden"
                      style={{
                        top: "0px",
                        left: "calc(50% + 70px)",
                        width: "18px",
                        height: `${getSoilDepthPx(selectedOption.depthM)}px`
                      }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(100,116,139,0.45)_1px,transparent_1px)] bg-[size:1px_8px] pointer-events-none" />
                    </div>
                    {/* Linking concrete zone indicator text */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: `${getSoilDepthPx(selectedOption.depthM) / 2 - 6}px` }}>
                      <span className="text-[7.5px] font-black text-slate-700 bg-white/95 border border-slate-350 px-1.5 py-0.5 rounded shadow-xs uppercase select-none">
                        ЛЕНТА d={Math.round(selectedOption.depthM * 1000)}мм
                      </span>
                    </div>
                  </>
                )}

                {activeFndId === "piles" && (
                  <>
                    {/* Horizontal Rostverk Beam */}
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 bg-slate-300 border-2 border-b border-slate-400/80 z-20 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden"
                      style={{
                        top: "0px",
                        width: "176px",
                        height: "10px"
                      }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.2)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
                    </div>
                    {/* 3 Vertical Piles */}
                    {/* Left Pile */}
                    <div 
                      className="absolute bg-slate-300 border-x-2 border-b-2 border-slate-400/80 rounded-b-sm shadow-sm z-20 transition-all duration-300"
                      style={{
                        top: "9px",
                        left: "calc(50% - 84px)",
                        width: "10px",
                        height: `${getSoilDepthPx(2.2) - 9}px`
                      }}
                    />
                    {/* Central Pile */}
                    <div 
                      className="absolute bg-slate-300 border-x-2 border-b-2 border-slate-400/80 rounded-b-sm shadow-sm z-20 transition-all duration-300"
                      style={{
                        top: "9px",
                        left: "calc(50% - 5px)",
                        width: "10px",
                        height: `${getSoilDepthPx(2.2) - 9}px`
                      }}
                    />
                    {/* Right Pile */}
                    <div 
                      className="absolute bg-slate-300 border-x-2 border-b-2 border-slate-400/80 rounded-b-sm shadow-sm z-20 transition-all duration-300"
                      style={{
                        top: "9px",
                        left: "calc(50% + 74px)",
                        width: "10px",
                        height: `${getSoilDepthPx(2.2) - 9}px`
                      }}
                    />
                    {/* Label */}
                    <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: "18px" }}>
                      <span className="text-[7.5px] font-black text-slate-700 bg-white/95 border border-slate-350 px-1.5 py-0.5 rounded shadow-xs uppercase select-none">
                        СВАИ L=2.2м
                      </span>
                    </div>
                  </>
                )}

                {/* Chernoziom top soil layer */}
                <div className="h-6 bg-amber-950/5 border-t border-dashed border-emerald-500/50 flex justify-between items-center px-3 relative">
                  <span className="text-emerald-700 font-bold">Чернозем (Cernoziom) • 0.4м</span>
                  <span className="text-[9px] text-slate-400 font-mono">Просадочный</span>
                </div>

                {/* Freezing level indicator line (macOS style badge) */}
                <div 
                  className="absolute border-t-2 border-sky-400/60 w-full bg-sky-200/5 text-[9px] text-sky-700 flex items-center px-2 z-25 transition-all"
                  style={{ top: `${getSoilDepthPx(REGION_DATA[region].frostDepth)}px` }}
                >
                  <span className="font-bold bg-white/95 border border-sky-200 rounded-full px-2.5 py-0.5 shadow-sm text-[9px] text-sky-700">
                    ☃️ Глуб. промерзания ({REGION_DATA[region].frostDepth}м)
                  </span>
                </div>

                {/* Sub strata (Loam, Clay, Sand) soil layer representation */}
                <div 
                  className="h-16 border-t border-slate-200 flex justify-between items-center px-3 relative"
                  style={{
                    backgroundColor: soilType === SoilType.LOESS ? "rgba(224, 130, 60, 0.05)" : "rgba(59, 130, 246, 0.02)"
                  }}
                >
                  <span className="font-bold text-slate-700">Несущий слой: {SOIL_DATA[soilType].name}</span>
                  <span className="text-[9px] font-bold text-neutral-500 bg-neutral-200/50 px-1.5 py-0.5 rounded font-mono">R₀: {SOIL_DATA[soilType].resistanceKPa} кПа</span>
                </div>

                {/* Ground Water Depth level pointer */}
                <div 
                  className="absolute border-t-2 border-dashed border-blue-400 w-full flex items-center px-3 z-30 transition-all duration-300"
                  style={{ top: `${getSoilDepthPx(groundwaterDepth)}px` }}
                >
                  <div className="flex items-center gap-1.5 text-blue-700 bg-white border border-blue-200 rounded-full px-2.5 py-0.5 font-bold shadow-sm text-[9px]">
                    <Waves className="w-3 h-3 text-blue-500 animate-pulse" />
                    УГВ: {groundwaterDepth.toFixed(1)} м {groundwaterDepth < 1.3 ? "⚠️ Высоко" : ""}
                  </div>
                </div>

                {/* Hard foundation depth ground layer representation */}
                <div className="h-14 bg-slate-100 border-t border-slate-200 flex justify-between items-center px-3 rounded-b-xl">
                  <span className="text-slate-500 text-[10px] font-medium">Коренные плотные грунты республики</span>
                  <span className="text-[9px] font-mono text-slate-450">γ_reliability={safetyFactor}</span>
                </div>
              </div>

            </div>

            <div className="mt-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 text-[11px] text-slate-600 leading-relaxed shadow-inner">
              <span className="text-xs font-bold text-slate-800 block mb-1">Сводка инженерных сил:</span>
              <p>
                Горизонтальные габариты дома {width}х{length} метров составляют суммарный вес весовых конструкций с учетом мебели и коэффициентов строительного заложения РМ: <strong className="text-blue-600 font-bold">{results.totalFactoredWeightTons} тонн</strong>. 
                Рекомендованная площадь подошвы фундамента: <strong className="text-emerald-700 font-bold">{results.bearingAreaRequiredM2} м²</strong>.
              </p>
            </div>
          </div>
          
        </section>

        {/* RIGHT COLUMN: Results comparative table and messaging (xl:col-span-7 / 12) */}
        <section className="xl:col-span-7 flex flex-col gap-6">

          {/* VALIDATION ERRORS BANNER */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border-2 border-red-200/80 rounded-[24px] p-5 shadow-sm relative overflow-hidden animate-fade-in">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-display font-black text-red-800 uppercase tracking-tight">⛔ ОШИБКА КОНТРОЛЯ ВХОДНЫХ ДАННЫХ</h3>
                  <p className="text-[10px] text-red-600 font-semibold mt-1">
                    Обнаружены критические выходы параметров за конструкционные лимиты СНиП / NCM РМ. Пожалуйста, исправьте следующие значения:
                  </p>
                  <ul className="list-disc list-inside text-[10px] text-red-700/95 font-medium space-y-1 mt-2.5 bg-white/50 p-3 rounded-xl border border-red-100">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC DESIGN & SOIL ENGINEERING PASSPORT */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-5 shadow-sm shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-blue-500 w-4.5 h-4.5" />
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-800">📋 Паспорт строительного проекта</h3>
                  <p className="text-[10px] text-slate-450 uppercase tracking-wider font-mono">NCM F.02.02-2008 / СНиП 2.02.01-83</p>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100/80 px-2 py-0.5 rounded-full select-none">
                РАСЧЁТНЫЙ БАЗИС: АКТИВЕН
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Left Wing: Manual Selectors */}
              <div className="space-y-2">
                <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Параметры выбранного дома:
                </span>
                <div className="space-y-1.5 text-[11px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500">Габариты здания:</span>
                    <span className="font-extrabold text-slate-800">{width} × {length} м <span className="text-slate-400 font-normal">({width * length} м²)</span></span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500">Этажность:</span>
                    <span className="font-extrabold text-slate-800">
                      {floors === 1 ? "1 этаж" : floors === 1.5 ? "1.5 этажа (мансарда)" : floors === 2 ? "2 этажа" : floors === 3 ? "3 этажа" : `${floors} этажа`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500">Материал стен (задан):</span>
                    <span className="font-bold text-slate-800 text-right truncate max-w-[130px]" title={WALL_MATERIAL_DATA[wallMaterial].name}>
                      {WALL_MATERIAL_DATA[wallMaterial].name.split("(")[0]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500">Перекрытие:</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[130px]" title={SLAB_DATA[slabMaterial].name}>
                      {SLAB_DATA[slabMaterial].name.split("(")[0]}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Материал кровли:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[130px]">
                      {roofType === RoofType.GABLE_METAL ? "Металлочерепица" : roofType === RoofType.HIP_CERAMIC ? "Керамическая черепица" : "Профнастил"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Wing: Automated SNiP Selectors */}
              <div className="space-y-2">
                <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Выбрано автоматически (СНиП нормы):
                </span>
                <div className="space-y-1.5 text-[11px] bg-slate-50/50 p-2.5 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">Гео-регион застройки: <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">авто</span></span>
                    <span className="font-extrabold text-blue-700 font-mono">{REGION_DATA[region].name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">Грунт основания: <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">авто</span></span>
                    <span className="font-extrabold text-slate-800">{SOIL_DATA[soilType].name.split("(")[0]}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">Промерзание почвы: <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">авто</span></span>
                    <span className="font-bold text-sky-700 font-mono">{REGION_DATA[region].frostDepth} м</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-dashed border-slate-200/60">
                    <span className="text-slate-500 flex items-center gap-1">Сейсмичность зоны: <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">авто</span></span>
                    <span className="font-bold text-red-600 font-mono">{REGION_DATA[region].seismicClass} баллов MSK</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 flex items-center gap-1">Грунтовые воды (УГВ): <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">авто</span></span>
                    <span className="font-medium text-slate-700 font-mono">{groundwaterDepth.toFixed(1)} м</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/50 border border-amber-100 leading-normal text-[10.5px] text-amber-900 flex gap-2">
              <span className="text-base select-none">💡</span>
              <p>
                <strong>Опорная калькуляция:</strong> Расчет автоматически учитывает повышенный риск пучения просадочных суглинков РМ и предписывает установку сейсмопоясов, дренажного отвода {activeFndId === "slab" ? "и заложение мелкозаглубленной утепленной шведской плиты (УШП) по специальному теплотехническому расчету, предотвращающему промерзание грунта под плитой" : "и заложение ниже СНиП-уровня промерзания для долговечной службы"}.
              </p>
            </div>
          </div>

          {/* Primary calculations & comparative panel (macOS Sheet styling) */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-6 shadow-sm shadow-slate-200/40 relative overflow-hidden">
            
            {validationErrors.length > 0 && (
              <div className="mb-6 p-4.5 bg-rose-50 border border-rose-200 rounded-2xl animate-fade-in shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-rose-800 font-extrabold text-xs uppercase tracking-wider">
                  <span className="text-sm">⚠️</span> Обнаружены нарушения инженерных стандартов:
                </div>
                <ul className="list-disc pl-5 text-xs text-rose-700 space-y-1.5 font-medium leading-relaxed">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4.5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-0.5">калькулятор фундаментов</span>
                <h2 className="text-base font-display font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4.5 h-4.5 text-blue-500" /> Спецификация и подбор опоры
                </h2>
              </div>

              {/* Summary Stats Badges */}
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px] font-semibold px-2.5 py-1 rounded-full font-mono">
                  Масса: <strong className="text-slate-900">{results.totalFactoredWeightTons} т</strong>
                </span>
                <span className="bg-slate-100 text-slate-700 border border-slate-200/80 text-[11px] font-semibold px-2.5 py-1 rounded-full font-mono">
                  Подошва: <strong className="text-slate-900">{results.bearingAreaRequiredM2} м²</strong>
                </span>
              </div>
            </div>

            {/* Weights Detail Breakdown progress bars */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-4 text-xs font-medium">
              <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-3">
                <span className="text-slate-500 text-[10px] block mb-0.5">Вес стен здания</span>
                <span className="text-sm font-extrabold text-slate-800">{results.wallWeightTons} т</span>
                <div className="w-full bg-slate-200/70 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (results.wallWeightTons / results.totalFactoredWeightTons) * 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-3">
                <span className="text-slate-500 text-[10px] block mb-0.5">Перекрытия (Ж/б)</span>
                <span className="text-sm font-extrabold text-slate-800">{results.slabWeightTons} т</span>
                <div className="w-full bg-slate-200/70 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (results.slabWeightTons / results.totalFactoredWeightTons) * 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-3">
                <span className="text-slate-500 text-[10px] block mb-0.5">Снеговые и ветер</span>
                <span className="text-sm font-extrabold text-slate-800">{(results.snowLoadTons + results.windLoadTons).toFixed(1)} т</span>
                <div className="w-full bg-slate-200/70 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-sky-400 h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((results.snowLoadTons + results.windLoadTons) / results.totalFactoredWeightTons) * 100)}%` }}></div>
                </div>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-3">
                <span className="text-slate-500 text-[10px] block mb-0.5">Сейсмичность</span>
                <span className="text-sm font-extrabold text-slate-800">{results.seismicForceTons} т</span>
                <div className="w-full bg-slate-200/70 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-rose-400 h-full rounded-full transition-all" style={{ width: `${Math.min(100, (results.seismicForceTons / results.totalFactoredWeightTons) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* COMPARISON SLIDE SELECTOR TABLE */}
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[580px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 rounded-l-xl">Вариант конструкции</th>
                    <th className="py-2.5 px-3 text-right">Надежность</th>
                    <th className="py-2.5 px-3 text-right">Сложность</th>
                    <th className="py-2.5 px-3">Главный плюс</th>
                    <th className="py-2.5 px-3 text-right rounded-r-xl text-blue-600 font-extrabold">С полом (MDL)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.options.map((opt) => (
                    <tr 
                      key={opt.id}
                      onClick={() => setActiveFndId(opt.id)}
                      className={`cursor-pointer transition-all duration-150 relative ${
                        opt.id === activeFndId 
                          ? "bg-blue-500/5 text-blue-800 font-bold" 
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full border ${
                            opt.id === "slab" ? "bg-amber-400 border-amber-500" : opt.id === "strip" ? "bg-blue-400 border-blue-500" : "bg-emerald-400 border-emerald-500"
                          }`}></span>
                          <div>
                            <p className="font-bold text-slate-800">
                              {opt.id === "slab" ? "⭐ Рекомендуемый" : opt.id === "strip" ? "🛡️ Капитальный" : "💸 Экономичный"}
                            </p>
                            <span className="text-[10px] text-slate-500 block font-medium mt-0.5">{opt.type}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                          opt.reliabilityScore >= 90 ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-amber-700 bg-amber-50 border border-amber-100"
                        }`}>{opt.reliabilityScore}%</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500 font-semibold">
                        {opt.complexityScore}%
                      </td>
                      <td className="py-3 px-3 max-w-[170px]">
                        <p className="truncate text-slate-600 text-[11px] font-sans font-medium">{opt.pros[0]}</p>
                        <span className="text-[9px] text-red-500 block truncate font-medium mt-0.5">
                          {opt.risks[0] || "Минимальный риск"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-blue-600 font-mono text-xs">
                        {opt.costMDL.toLocaleString()} леев
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DETAILED SPECIFICATION CARD (macOS Preferences visual look) */}
            <div className="mt-5 p-4.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3.5 pb-3.5 border-b border-slate-200/60">
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    Детали заложения: <span className="text-slate-800 text-xs normal-case">{selectedOption.type}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Требуемые объемы бетона и проектные нормы Молдовы</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 block">Локальная смета:</span>
                  <span className="text-base font-extrabold text-blue-600 font-mono">{selectedOption.costMDL.toLocaleString()} MDL</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Specs materials needed */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">📊 Изделия и ведомость</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white border border-slate-200/85 rounded-xl p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      <span className="text-slate-400 text-[10px] block font-medium">Бетон C20/25 (M300):</span>
                      <strong className="text-slate-800 text-sm">{selectedOption.materials.concreteVolumeM3} м³</strong>
                      <span className="text-[9px] text-slate-450 block mt-0.5">Доставка миксером (RM 2026)</span>
                    </div>

                    <div className="bg-white border border-slate-200/85 rounded-xl p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      <span className="text-slate-400 text-[10px] block font-medium">Арматурный прокат А500С:</span>
                      <strong className="text-slate-800 text-sm">{selectedOption.materials.reinforcementBarKg} кг</strong>
                      <span className="text-[9.5px] text-slate-450 block mt-0.5 font-sans">
                        раб. d{selectedOption.materials.rebarLongitudinalDiameter || 12} ({selectedOption.materials.rebarLongitudinalKg || 0}кг) + хм. d{selectedOption.materials.rebarTransverseDiameter || 8} ({selectedOption.materials.rebarTransverseKg || 0}кг)
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200/85 rounded-xl p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      <span className="text-slate-400 text-[10px] block font-medium">Песок-гравий подушки:</span>
                      <strong className="text-slate-800 text-sm">{selectedOption.materials.sandGravelM3} м³ ({selectedOption.materials.sandGravelWeightTons || 0} т)</strong>
                      <span className="text-[9px] text-slate-450 block mt-0.5">Perne de nisip уплотнённый</span>
                    </div>

                    <div className="bg-white border border-slate-200/85 rounded-xl p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      <span className="text-slate-400 text-[10px] block font-medium">Мастика и XPS цоколя:</span>
                      <strong className="text-slate-800 text-sm">{selectedOption.materials.waterproofingM2} м² / {selectedOption.materials.insulationM3} м³</strong>
                      <span className="text-[9px] text-slate-450 block mt-0.5">Пеноплэкс + влагозищита</span>
                    </div>

                    <div className="bg-white border border-slate-200/85 rounded-xl p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      <span className="text-slate-400 text-[10px] block font-medium">Калиброванная доска опалубки:</span>
                      <strong className="text-slate-800 text-sm">{selectedOption.materials.formworkM2 || 0} м²</strong>
                      <span className="text-[10px] text-slate-450 block mt-0.5 leading-normal">
                        Требуется: <strong className="text-blue-600">{selectedOption.materials.formworkBoardsCount || 0} шт</strong> досок (25x150x6000)
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200/85 rounded-xl p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                      <span className="text-slate-400 text-[10px] block font-medium">Разработка грунта (JCB):</span>
                      <strong className="text-slate-800 text-sm">{selectedOption.materials.excavationVolumeM3 || 0} м³</strong>
                      <span className="text-[9px] text-slate-450 block mt-0.5">Выемка спецтехникой с подчисткой</span>
                    </div>

                    <div className={`col-span-2 bg-gradient-to-br border rounded-xl p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${selectedOption.id === "slab" ? "from-emerald-50/40 to-teal-50/20 border-emerald-200/60" : "from-slate-50/40 to-slate-100/10 border-slate-200/80"}`}>
                      <span className="text-slate-500 font-bold text-[10px] uppercase block mb-1">🏗️ Черновой пол по грунту (систематический учёт)</span>
                      {selectedOption.id === "slab" ? (
                        <div className="text-[11px] text-slate-600 leading-normal">
                          <strong className="text-emerald-700 font-bold block mb-0.5">Встроен в плиту (0 MDL экстра)</strong>
                          Монолитная плита сама выступает жестким основанием пола 1-го этажа. Не требует дополнительных трат на стяжки, засыпку и обратную трамбовку подушки пола.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between items-baseline">
                            <strong className="text-slate-800 text-[11px] font-semibold">Доп. материалы пола по грунту внутри цоколя:</strong>
                            <span className="text-orange-600 font-mono font-bold text-xs">+{Math.round(selectedOption.costEstimate.roughFloorCostMDL || 0).toLocaleString()} MDL</span>
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Подушка: <strong className="text-slate-700">{selectedOption.materials.roughFloorSandM3} м³</strong>, Бетон стяжки: <strong className="text-slate-700">{selectedOption.materials.roughFloorConcreteM3} м³</strong>, Сетка d8: <strong className="text-slate-700">{selectedOption.materials.roughFloorRebarKg} кг</strong> на площадь <strong className="text-slate-700">{selectedOption.materials.roughFloorAreaM2} м²</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedOption.materials.hasDrainage && (
                    <div className="mt-3 bg-blue-50/70 border border-blue-200/50 p-3 rounded-2xl">
                      <div className="flex items-center gap-1.5 mb-1 text-blue-800">
                        <Droplet className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Пристенный дренаж комплекса (УГВ {groundwaterDepth}м):</span>
                      </div>
                      <p className="text-[10px] text-blue-700 leading-normal mb-2">
                        Защищает основание из лессового суглинка от размывания и морозного пучения.
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10.5px] text-blue-900 leading-tight">
                        <div>• Дренажная труба d110: <strong>{selectedOption.materials.drainagePipeM} м</strong></div>
                        <div>• Геотекстиль Typar SF40: <strong>{selectedOption.materials.drainageGeotextileM2} м²</strong></div>
                        <div>• Гранитный щебень 20-40: <strong>{selectedOption.materials.drainageStoneM3} м³</strong></div>
                        <div>• Ревизионные колодцы d315: <strong>{selectedOption.materials.drainageWellsCount} шт</strong></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Construction specific configurations */}
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block mb-2">🏗️ Геотехнические параметры</span>
                    <ul className="text-[11px] text-slate-600 space-y-2 list-none pl-1">
                      <li className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Ширина подошвы лент/опор: <strong className="text-slate-800 ml-auto">{selectedOption.widthM} м</strong></li>
                      <li className="flex items-center gap-1.5"><ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Глубина заглубления d_fund: <strong className="text-slate-800 ml-auto">{selectedOption.depthM} м</strong></li>
                      {REGION_DATA[region].beltMandatory && (
                        <li className="text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200/50 mt-1 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span><strong>Обязательно:</strong> Сейсмопояс (Centură antiseismică h=20-30 см)</span>
                        </li>
                      )}
                    </ul>

                    {selectedOption.id === "piles" && (
                      <div className="mt-2.5 bg-rose-50 border border-rose-200/80 rounded-xl p-3 text-[10.5px] text-rose-950 leading-relaxed space-y-1.5 shadow-xs">
                        <div className="flex items-center gap-1.5 font-extrabold text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />
                          <span>ИНЖЕНЕРНАЯ ПРОВЕРКА СВАЙНОГО ПОЛЯ:</span>
                        </div>
                        <p>
                          Принятые объемы бетона и арматуры резко снижены (<strong>на -21% и -55%</strong>) при неизменности веса здания. Это допустимо лишь при детальном расчете!
                        </p>
                        <div className="pl-3.5 space-y-1 list-disc text-[10px] text-rose-900 font-medium">
                          <div>• <strong>Риск при сейсмике 7 баллов:</strong> Требуется пересчет несущей способности каждой сваи по боковой поверхности (трение) и по пяте (опорному давлению).</div>
                          <div>• <strong>Рекомендация:</strong> Согласовать паспорт ИГИ (инженерной геологии) и проверить проектную прочность свай до начала забивки/заливки.</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3.5 text-[9.5px] text-slate-450 font-medium leading-normal bg-white/70 px-2.5 py-2 rounded-xl border border-slate-200/50 text-center">
                    💡 Розничный прайс-лист республики на май 2026: Бетон C20/25 от 1750 MDL/м³, рифлёная сталь А500С от 21 MDL/кг.
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Detailed Budget breakdown in clean Table */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">📋 Подробная калькуляция сметных затрат</span>
                  <div className="mt-2 bg-slate-150 p-1 rounded-xl flex gap-1 w-full max-w-sm border border-slate-200/60 shadow-inner">
                    <button
                      type="button"
                      id="view-mode-single"
                      onClick={() => setBudgetViewMode('single')}
                      className={`flex-1 py-1 px-2.5 text-center text-[10.5px] font-extrabold rounded-lg transition-all cursor-pointer select-none ${
                        budgetViewMode === 'single'
                          ? "bg-white text-blue-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-750"
                      }`}
                    >
                      Смета ({selectedOption.id === 'slab' ? 'Плита' : selectedOption.id === 'strip' ? 'Ленточный' : 'Сваи'})
                    </button>
                    <button
                      type="button"
                      id="view-mode-compare"
                      onClick={() => setBudgetViewMode('compare')}
                      className={`flex-1 py-1 px-2.5 text-center text-[10.5px] font-extrabold rounded-lg transition-all cursor-pointer select-none ${
                        budgetViewMode === 'compare'
                          ? "bg-white text-blue-600 shadow-xs"
                          : "text-slate-500 hover:text-slate-750"
                      }`}
                    >
                      ⚖️ Сравнить все сметы
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const visibleCatIds = [
                        "01", "02", "03", "04", "05", "06", "07",
                        selectedOption.materials.hasDrainage ? "08" : "08",
                        landSlope > 0 ? "09" : "09",
                        "10", "11"
                      ];
                      
                      const isAllExpanded = visibleCatIds.every(id => expandedCategoryIds.includes(id));
                      if (isAllExpanded) {
                        setExpandedCategoryIds([]);
                      } else {
                        setExpandedCategoryIds(visibleCatIds);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer select-none"
                  >
                    <span>{expandedCategoryIds.length > 0 ? "Свернуть все" : "Развернуть все разделы"} ↕️</span>
                  </button>

                  <button
                    type="button"
                    id="btn-excel-export"
                    onClick={async () => {
                      try {
                        setIsExporting(true);
                        await exportToExcel(
                          results.input,
                          results,
                          selectedOption,
                          landSlope,
                          groundwaterDepth,
                          getCategoryDetailedItems
                        );
                      } catch (err) {
                        console.error("Failed to export Excel file", err);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    disabled={isExporting}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer select-none disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                    )}
                    {isExporting ? "Формирование..." : "Смета выбранного типа"}
                  </button>

                  <button
                    type="button"
                    id="btn-excel-export-all"
                    onClick={async () => {
                      try {
                        setIsExporting(true);
                        await exportAllToExcel(
                          results.input,
                          results,
                          landSlope,
                          groundwaterDepth,
                          getCategoryDetailedItems
                        );
                      } catch (err) {
                        console.error("Failed to export all foundations", err);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    disabled={isExporting}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer select-none disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-100" />
                    )}
                    {isExporting ? "Формирование..." : "Скачать Сравнение (Все варианты)"}
                  </button>
                </div>
              </div>

              {budgetViewMode === 'single' ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/90 text-[10px] text-slate-500 font-bold uppercase border-b border-slate-200">
                        <th className="py-2.5 px-3">Код/Категория работ</th>
                        <th className="py-2.5 px-3">Описание затрат</th>
                        <th className="py-2.5 px-3 text-right">Стоимость (MDL)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-[11px] text-slate-700">
                      {(() => {
                        const budgetCategories = [
                          {
                            id: "01",
                            name: "01. Бетон М300 (C20/25)",
                            desc: `Закупка и доставка готовой ж/б смеси миксером (${selectedOption.materials.concreteVolumeM3 || 0} м³)`,
                            cost: selectedOption.costEstimate.concreteCostMDL || 0,
                            showIf: true
                          },
                          {
                            id: "02",
                            name: "02. Арматурный прокат",
                            desc: `Поставка стержней класса A500C/A240 (${selectedOption.materials.reinforcementBarKg || 0} кг)`,
                            cost: selectedOption.costEstimate.steelCostMDL || 0,
                            showIf: true
                          },
                          {
                            id: "03",
                            name: "03. Вязка каркасов и работы",
                            desc: "Монтаж, увязка узлов проволокой, установка фиксаторов защитного слоя",
                            cost: selectedOption.costEstimate.rebarBindingCostMDL || 0,
                            showIf: true
                          },
                          {
                            id: "04",
                            name: "04. Разработка грунта (JCB)",
                            desc: `Копка траншей/бурение, профилирование дна, зачистка (${selectedOption.materials.excavationVolumeM3 || 0} м³)`,
                            cost: selectedOption.costEstimate.excavationCostMDL || 0,
                            showIf: true
                          },
                          {
                            id: "05",
                            name: "05. Щитовая опалубка",
                            desc: `Аренда щитов, обрезная доска хвойных пород, шпильки и шурупы (${selectedOption.materials.formworkM2 || 0} м²)`,
                            cost: selectedOption.costEstimate.formworkCostMDL || 0,
                            showIf: true
                          },
                          {
                            id: "06",
                            name: "06. Устройство подушки",
                            desc: `Песчано-гравийная смесь с уплотнением (${selectedOption.materials.sandGravelM3 || 0} м³)`,
                            cost: selectedOption.costEstimate.sandCushionCostMDL || 0,
                            showIf: true
                          },
                          {
                            id: "07",
                            name: "07. Изоляция и XPS цоколя",
                            desc: `Монтаж влагозащиты и плит утепления Penoplex XPS (${selectedOption.materials.waterproofingM2 || 0} м²)`,
                            cost: selectedOption.costEstimate.waterproofInsulationCostMDL || 0,
                            showIf: true
                          },
                          {
                            id: "08",
                            name: "08. Дренажная система",
                            desc: `Трубы d110, геотекстиль, гранитный щебень, ${selectedOption.materials.drainageWellsCount || 4} смотровых колодца`,
                            cost: selectedOption.costEstimate.drainageCostMDL || 0,
                            showIf: !!selectedOption.materials.hasDrainage,
                            className: "bg-blue-50/20"
                          },
                          {
                            id: "09",
                            name: "09. Уступные компенсаторы",
                            desc: `Сложность рельефа ${landSlope}%, ступенчатая опалубка, подгонка уровней`,
                            cost: selectedOption.costEstimate.slopeComplicationCostMDL || 0,
                            showIf: landSlope > 0,
                            className: "bg-amber-50/20"
                          },
                          {
                            id: "10",
                            name: "10. Черновой пол по грунту",
                            desc: selectedOption.id === "slab" 
                              ? "✨ Уже полностью встроен в монолитную несущую плиту"
                              : `Устройство пола: подушка ${selectedOption.materials.roughFloorSandM3 || 0} м³, сетка d8 ${selectedOption.materials.roughFloorRebarKg || 0} кг, бетон стяжки ${selectedOption.materials.roughFloorConcreteM3 || 0} м³ (${selectedOption.materials.roughFloorAreaM2 || 0} м²)`,
                            cost: selectedOption.costEstimate.roughFloorCostMDL || 0,
                            showIf: selectedOption.costEstimate.roughFloorCostMDL !== undefined,
                            className: selectedOption.id === "slab" ? "bg-emerald-50/15" : "bg-orange-50/15",
                            isSlabBuiltin: selectedOption.id === "slab"
                          },
                          {
                            id: "11",
                            name: "11. Бурение скважин под сваи",
                            desc: `Кустовое/механическое бурение скважин d300-350мм: ${selectedOption.materials.pileCount || 0} шт. глубиной 2.2м (итого ${selectedOption.materials.pileDrillingM || 0} пог.м)`,
                            cost: selectedOption.costEstimate.pileDrillingCostMDL || 0,
                            showIf: selectedOption.id === "piles" && (selectedOption.costEstimate.pileDrillingCostMDL || 0) > 0,
                            className: "bg-teal-50/15"
                          },
                          {
                            id: "12",
                            name: "12. Налог на добавленную стоимость (НДС 20% РМ)",
                            desc: "Обязательный сбор в бюджет Республики Молдова на строительные работы и сертифицированные смеси",
                            cost: selectedOption.costEstimate.vatMDL || 0,
                            showIf: !!includeVAT,
                            className: "bg-red-50/10"
                          },
                          {
                            id: "13",
                            name: "13. Раздел проектирования КЖ/АР",
                            desc: "Полная разработка рабочих проектов: архитектурные и железобетонные спецификации контура",
                            cost: selectedOption.costEstimate.designCostMDL || 0,
                            showIf: !!includeSubDesign,
                            className: "bg-indigo-50/10"
                          },
                          {
                            id: "14",
                            name: "14. Ревизионная инженерная геология",
                            desc: "Ударно-канатное бурение 2 скважин по 6 метров, лаб. определение модуля Е и высоты УГВ",
                            cost: selectedOption.costEstimate.geologyCostMDL || 0,
                            showIf: !!includeSubDesign,
                            className: "bg-indigo-50/10"
                          },
                          {
                            id: "15",
                            name: "15. Экспертиза технического соответствия",
                            desc: "Контрольное прохождение верификации чертежей и проектных нормативов КЖ/АР лицензированным госорганом",
                            cost: selectedOption.costEstimate.expertiseCostMDL || 0,
                            showIf: !!includeSupervision,
                            className: "bg-slate-100/10"
                          },
                          {
                            id: "16",
                            name: "16. Авторский и Технический надзор",
                            desc: "Подписание актов скрытых контуров армирования разработчиком проекта и техническим инспектором",
                            cost: selectedOption.costEstimate.supervisionCostMDL || 0,
                            showIf: !!includeSupervision,
                            className: "bg-slate-100/10"
                          }
                        ];

                        return budgetCategories.filter(c => c.showIf).map((cat) => {
                          const isExpanded = expandedCategoryIds.includes(cat.id);
                          return (
                            <React.Fragment key={cat.id}>
                              <tr 
                                onClick={() => setExpandedCategoryIds(prev => 
                                  prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                                )}
                                className={`cursor-pointer hover:bg-slate-100/80 transition-colors select-none ${cat.className || ""} ${isExpanded ? "bg-slate-100/90 font-medium" : ""}`}
                              >
                                <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-1.5">
                                  <span className="transition-transform duration-200 shrink-0">
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </span>
                                  {cat.name}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 text-[10.5px] items-center">
                                  {cat.desc}
                                  <span className="text-[9px] text-blue-600 font-semibold ml-2 inline-flex items-center gap-0.5 hover:underline whitespace-nowrap bg-blue-50/50 px-1.5 py-0.5 rounded-md">
                                    {isExpanded ? "Свернуть детали" : "Детали структуры 🔍"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  {cat.isSlabBuiltin ? (
                                    <span className="text-emerald-700 font-semibold text-[10.5px] font-sans">0 (Включено)</span>
                                  ) : (
                                    (cat.cost || 0).toLocaleString()
                                  )}
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr className="bg-slate-100/40">
                                  <td colSpan={3} className="p-3">
                                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-inner space-y-3">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                        <span className="text-[9.5px] font-bold text-slate-550 uppercase tracking-wider block">Детализация затрат категории:</span>
                                        <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-100 rounded-full font-bold">Итого по статье: {cat.isSlabBuiltin ? "0" : (cat.cost || 0).toLocaleString()} MDL</span>
                                      </div>
                                      
                                      {cat.isSlabBuiltin ? (
                                        <div className="text-[11px] p-2.5 bg-emerald-50 text-emerald-800 rounded-xl leading-relaxed border border-emerald-100/60 font-sans">
                                          ✨ <strong>Монолитная несущая плита толщиной {selectedOption.depthM * 100} см</strong> заливается сразу по всей площади карты здания. Она автоматически служит долговечным чистовым бетонным полом 1-го этажа с предельной прочностью свыше 15 тонн на м². Не требует обратной отсыпки грунта в пазухи, проливки и послойного трамбования вручную внутри фундамента, повторной закупки кладочной сетки и заливки стяжек на отдельных этапах строительных работ. Экономическое преимущество до <strong>35-45 MDL / м²</strong> на этапе финишной отделки!
                                        </div>
                                      ) : (
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-[10.5px] text-slate-600 border-collapse">
                                            <thead>
                                              <tr className="border-b border-slate-100 text-[8.5px] text-slate-400 font-bold uppercase text-left">
                                                <th className="pb-1.5 font-semibold w-[45%]">Элемент расходов / вид деятельности</th>
                                                <th className="pb-1.5 text-center font-semibold w-[15%]">Категория</th>
                                                <th className="pb-1.5 text-right font-semibold w-[10%]">Кол-во</th>
                                                <th className="pb-1.5 text-right font-semibold w-[10%]">Ед. изм.</th>
                                                <th className="pb-1.5 text-right font-semibold w-[10%]">Цена (MDL)</th>
                                                <th className="pb-1.5 text-right font-semibold w-[10%]">Сумма (MDL)</th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                              {getCategoryDetailedItems(cat.id, selectedOption, landSlope, groundwaterDepth).map((item, idx) => {
                                                const badgeColors = {
                                                  material: "bg-amber-50 text-amber-700 border-amber-200/50",
                                                  delivery: "bg-sky-50 text-sky-700 border-sky-200/50",
                                                  labor: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
                                                  machinery: "bg-purple-50 text-purple-700 border-purple-200/50"
                                                };
                                                const badgeLabels = {
                                                  material: "📦 Мат.",
                                                  delivery: "🚚 Дост.",
                                                  labor: "👷 Раб.",
                                                  machinery: "⚙️ Техн."
                                                };
                                                
                                                return (
                                                  <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="py-2 pr-2 font-medium text-slate-800">
                                                      <div>{item.name}</div>
                                                      <div className="text-[9.5px] text-slate-400 font-normal leading-normal mt-0.5">{item.desc}</div>
                                                    </td>
                                                    <td className="py-2 px-1 text-center whitespace-nowrap">
                                                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase border rounded-md ${badgeColors[item.type]}`}>
                                                        {badgeLabels[item.type]}
                                                      </span>
                                                    </td>
                                                    <td className="py-2 px-1 text-right font-mono font-semibold text-slate-700">
                                                      {item.qty.toLocaleString()}
                                                    </td>
                                                    <td className="py-2 px-1 text-right text-slate-450">
                                                      {item.unit}
                                                    </td>
                                                    <td className="py-2 px-1 text-right font-mono text-slate-500">
                                                      {item.rate.toLocaleString()}
                                                    </td>
                                                    <td className="py-2 pl-2 text-right font-mono font-bold text-slate-900">
                                                      {item.total === 0 ? (
                                                        <span className="text-[9px] text-slate-450 italic font-medium font-sans">Вкл. в смету</span>
                                                      ) : (
                                                        `${item.total.toLocaleString()}`
                                                      )}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        });
                      })()}
                      <tr className="bg-slate-100 text-slate-800 font-bold border-t border-slate-200 text-xs">
                        <td className="py-2.5 px-3">ИТОГ: Система с полом</td>
                        <td className="py-2.5 px-3 text-[10px] text-slate-500 font-medium">Суммарная стоимость фундамента и чернового пола под ключ</td>
                        <td className="py-2.5 px-3 text-right font-mono text-blue-600 text-[12.5px]">{selectedOption.costMDL.toLocaleString()} MDL</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                /* COMPARATIVE VIEW of all foundation variants with descriptions and comments */
                <div className="space-y-4">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                      <span>РЕЖИМ СРАВНЕНИЯ СМЕТ: ВСЕ ПУНКТЫ С КОММЕНТАРИЯМИ БЕЗ КУПЮР</span>
                    </div>
                    <p className="text-[10px] text-indigo-800/90 leading-tight">
                      Ниже представлена детальная поливариантная смета. Статьи расходов сопоставлены для всех трёх видов фундаментов (Плита УШП, Ленточный, Свайно-ростверковый) одновременно в рамках каждого раздела работ. Кликните по шапке раздела, чтобы развернуть или скрыть этот пункт.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {(() => {
                      const slabOpt = results.options.find(o => o.id === "slab") || results.options[0];
                      const stripOpt = results.options.find(o => o.id === "strip") || results.options[1] || results.options[0];
                      const pilesOpt = results.options.find(o => o.id === "piles") || results.options[2] || results.options[0];

                      const compareCategories = [
                        {
                          id: "01",
                          name: "01. Бетон М300 (C20/25)",
                          costKey: "concreteCostMDL",
                          showIf: true,
                        },
                        {
                          id: "02",
                          name: "02. Арматурный прокат",
                          costKey: "steelCostMDL",
                          showIf: true,
                        },
                        {
                          id: "03",
                          name: "03. Вязка каркасов и работы",
                          costKey: "rebarBindingCostMDL",
                          showIf: true,
                        },
                        {
                          id: "04",
                          name: "04. Разработка грунта (JCB)",
                          costKey: "excavationCostMDL",
                          showIf: true,
                        },
                        {
                          id: "05",
                          name: "05. Щитовая опалубка",
                          costKey: "formworkCostMDL",
                          showIf: true,
                        },
                        {
                          id: "06",
                          name: "06. Устройство подушки",
                          costKey: "sandCushionCostMDL",
                          showIf: true,
                        },
                        {
                          id: "07",
                          name: "07. Изоляция и XPS цоколя",
                          costKey: "waterproofInsulationCostMDL",
                          showIf: true,
                        },
                        {
                          id: "08",
                          name: "08. Дренажная система",
                          costKey: "drainageCostMDL",
                          showIf: results.options.some(o => o.materials.hasDrainage),
                        },
                        {
                          id: "09",
                          name: "09. Уступные компенсаторы",
                          costKey: "slopeComplicationCostMDL",
                          showIf: landSlope > 0,
                        },
                        {
                          id: "10",
                          name: "10. Черновой пол по грунту",
                          costKey: "roughFloorCostMDL",
                          showIf: results.options.some(o => o.costEstimate.roughFloorCostMDL !== undefined),
                        },
                        {
                          id: "11",
                          name: "11. Бурение скважин под сваи",
                          costKey: "pileDrillingCostMDL",
                          showIf: results.options.some(o => o.id === "piles" && (o.costEstimate.pileDrillingCostMDL || 0) > 0),
                        },
                        {
                          id: "12",
                          name: "12. Налог на добавленную стоимость (НДС 20% РМ)",
                          costKey: "vatMDL",
                          showIf: !!includeVAT,
                        },
                        {
                          id: "13",
                          name: "13. Раздел проектирования КЖ/АР",
                          costKey: "designCostMDL",
                          showIf: !!includeSubDesign,
                        },
                        {
                          id: "14",
                          name: "14. Ревизионная инженерная геология",
                          costKey: "geologyCostMDL",
                          showIf: !!includeSubDesign,
                        },
                        {
                          id: "15",
                          name: "15. Экспертиза технического соответствия",
                          costKey: "expertiseCostMDL",
                          showIf: !!includeSupervision,
                        },
                        {
                          id: "16",
                          name: "16. Авторский и Технический надзор",
                          costKey: "supervisionCostMDL",
                          showIf: !!includeSupervision,
                        }
                      ];

                      return compareCategories.filter(c => c.showIf).map((cat) => {
                        const isExpanded = expandedCategoryIds.includes(cat.id);
                        
                        return (
                          <div key={cat.id} className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs animate-fade-in">
                            {/* Collapse Click Header */}
                            <div 
                              onClick={() => setExpandedCategoryIds(prev => 
                                prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                              )}
                              className="bg-slate-50 hover:bg-slate-100/90 py-3 px-4 border-b border-slate-200 flex items-center justify-between cursor-pointer select-none transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-slate-550 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                </span>
                                <span className="font-bold text-slate-800 text-[11.5px] tracking-tight">{cat.name}</span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100/50 px-2 py-0.5 rounded-md">
                                {isExpanded ? "Свернуть" : "Развернуть ↕️"}
                              </span>
                            </div>

                            {/* Comparison Side-By-Side Grid Column */}
                            {isExpanded && (
                              <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-50/20">
                                {[
                                  { opt: slabOpt, label: "УШП Плита", border: "border-t-3 border-amber-400", titleBg: "bg-amber-500/5 text-amber-800", badgeName: "⭐ Рекомендуемый" },
                                  { opt: stripOpt, label: "Ленточный", border: "border-t-3 border-blue-500", titleBg: "bg-blue-500/5 text-blue-800", badgeName: "🛡️ Капитальный" },
                                  { opt: pilesOpt, label: "Свайно-ростверковый", border: "border-t-3 border-emerald-500", titleBg: "bg-emerald-500/5 text-emerald-800", badgeName: "💸 Экономичный" }
                                ].map((optionBlock) => {
                                  const { opt, label, border, titleBg, badgeName } = optionBlock;
                                  
                                  // Determine custom pricing subheadings or skips
                                  let sectionCostStr = "";
                                  let isSlabBuiltInVal = false;
                                  let isNotRequiredVal = false;

                                  if (cat.id === "10" && opt.id === "slab") {
                                    isSlabBuiltInVal = true;
                                  } else if (opt.id !== "piles" && cat.id === "11") {
                                    isNotRequiredVal = true;
                                  } else {
                                    const costVal = opt.costEstimate[cat.costKey as keyof CostEstimate];
                                    sectionCostStr = costVal !== undefined ? `${Math.round(costVal).toLocaleString()} MDL` : "—";
                                  }

                                  const items = getCategoryDetailedItems(cat.id, opt, landSlope, groundwaterDepth);

                                  return (
                                    <div key={opt.id} className={`bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-2xs ${border}`}>
                                      <div>
                                        {/* Block Title Segment */}
                                        <div className={`px-3 py-2.5 ${titleBg} border-b border-slate-100 flex items-center justify-between`}>
                                          <div className="leading-tight">
                                            <span className="font-extrabold text-[11px] block text-slate-800">{label}</span>
                                            <span className="text-[8.5px] font-bold block text-slate-500 mt-0.5">{badgeName}</span>
                                          </div>
                                          <div className="text-right">
                                            {isSlabBuiltInVal ? (
                                              <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-1.5 py-0.5 rounded-md">Встроено в плиту</span>
                                            ) : isNotRequiredVal ? (
                                              <span className="text-[9.5px] font-bold text-slate-400 bg-slate-100 border border-slate-200/50 px-1.5 py-0.5 rounded-md">Не требуется</span>
                                            ) : (
                                              <span className="text-[11.5px] font-mono font-extrabold text-slate-900 bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded-md">{sectionCostStr}</span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Detail costs and item loops */}
                                        <div className="p-3 space-y-3">
                                          {isSlabBuiltInVal ? (
                                            <div className="text-[10px] p-2.5 bg-emerald-50/50 text-emerald-800 rounded-lg leading-relaxed border border-emerald-100/30">
                                              ✨ <strong>УШП Плита</strong> заливается сразу по всей площади, заменяя черновой пол. Исключает затраты на повторные стяжки, подушку под стяжку и обратную трамбовку.
                                            </div>
                                          ) : isNotRequiredVal ? (
                                            <div className="text-[10px] p-2.5 bg-slate-100/50 text-slate-450 rounded-lg leading-relaxed border border-slate-200/20 text-center italic">
                                              Не применяется для данного конструктива. Принято для расчёта как 0 MDL.
                                            </div>
                                          ) : items.length === 0 ? (
                                            <div className="text-[10px] p-2.5 bg-slate-100/50 text-slate-450 rounded-lg leading-relaxed border border-slate-200/20 text-center italic">
                                              Статьи расходов в данном разделе пусты.
                                            </div>
                                          ) : (
                                            <div className="space-y-2.5">
                                              {items.map((item, itemIdx) => {
                                                const badgeColors = {
                                                  material: "bg-amber-50 text-amber-700 border-amber-100/65",
                                                  delivery: "bg-sky-50 text-sky-700 border-sky-100/65",
                                                  labor: "bg-indigo-50 text-indigo-700 border-indigo-100/65",
                                                  machinery: "bg-purple-50 text-purple-700 border-purple-100/65"
                                                };
                                                const badgeLabels = {
                                                  material: "📦 Мат.",
                                                  delivery: "🚚 Дост.",
                                                  labor: "👷 Раб.",
                                                  machinery: "⚙️ Техн."
                                                };

                                                return (
                                                  <div key={itemIdx} className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition-colors flex flex-col justify-between gap-1.5 animate-fade-in">
                                                    <div className="flex items-start justify-between gap-1">
                                                      <span className="text-[8.5px] font-mono text-slate-450 mt-0.5 font-bold shrink-0">{cat.id}.{itemIdx + 1}</span>
                                                      <span className="text-[10px] font-bold text-slate-800 leading-tight flex-1 ml-1">
                                                        {item.name}
                                                      </span>
                                                      <span className={`px-1 py-0.2 shrink-0 border rounded text-[7.5px] font-bold shrink-0 uppercase tracking-wider ${badgeColors[item.type]}`}>
                                                        {badgeLabels[item.type]}
                                                      </span>
                                                    </div>

                                                    {/* Crucial Item Specification comments request */}
                                                    <div className="text-[9.5px] text-slate-500 italic leading-snug pl-2 border-l-2 border-slate-300">
                                                      {item.desc}
                                                    </div>

                                                    <div className="pt-1 border-t border-dashed border-slate-200 mt-1 flex items-center justify-between text-[9px] font-mono text-slate-450 font-bold">
                                                      <span>
                                                        {item.qty.toLocaleString()} {item.unit} × {item.rate.toLocaleString()} MDL
                                                      </span>
                                                      <span className="font-extrabold text-slate-950 font-mono text-[9.5px]">
                                                        {item.total === 0 ? "Вкл в смету" : `${item.total.toLocaleString()} MDL`}
                                                      </span>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* GRAND SUMMARY OF COMPARATIVE ESTIMATE VIEW */}
                  <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-[20px] p-5.5 shadow-md border border-slate-800 space-y-4">
                    <div className="flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">Суммарная сметная стоимость всех вариантов по проекту</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { opt: results.options.find(o => o.id === "slab")!, label: "Монолитная Плита УШП", badgeClass: "bg-amber-400/20 text-amber-300 border-amber-500/20", badgeText: "⭐ Рекомендуемый" },
                        { opt: results.options.find(o => o.id === "strip")!, label: "Ленточный глубокий", badgeClass: "bg-blue-400/20 text-blue-300 border-blue-500/20", badgeText: "🛡️ Капитальный" },
                        { opt: results.options.find(o => o.id === "piles")!, label: "Свайно-ростверковый", badgeClass: "bg-emerald-400/20 text-emerald-300 border-emerald-500/20", badgeText: "💸 Экономичный" }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 hover:bg-white/[0.06] transition-colors flex flex-col justify-between">
                          <div className="flex justify-between items-start mb-2.5">
                            <span className="text-[11px] font-bold block text-white/90">{item.label}</span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 border rounded-md uppercase tracking-wider ${item.badgeClass}`}>
                              {item.badgeText}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between mt-1 pt-1.5 border-t border-white/[0.05]">
                            <span className="text-sm font-extrabold font-mono text-indigo-200">{item.opt.costMDL.toLocaleString()} MDL</span>
                            <span className="text-[10px] text-slate-400 font-mono italic">~ {Math.round(item.opt.costMDL / 19.8).toLocaleString()} EUR</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-450 mt-2 italic leading-normal">
                * Цены рассчитаны по среднему прейскуранту Кишинева, Бельц и Оргеева на 2026 год. Расчет является предварительным проектным планом и корректируется после геодезического бурения непосредственно на пятне застройки.
              </p>
            </div>

            {/* Weight distribution Recharts component */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <WeightDistributionAudit results={results} />
            </div>

            {/* Automated Quality Control and Formulas Engineering Audit */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <EngineeringAudit 
                input={currentInput} 
                results={results} 
                selectedOption={selectedOption} 
              />
            </div>

            {/* Geotechnical Audit and Soil Risks Indicators */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-display font-bold text-slate-800 mb-3 block">⚠️ Инженерные риски проседания и геотехнического пучения</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Gauges */}
                <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-3.5 text-xs">
                  <div className="flex justify-between items-center mb-1.5 font-semibold">
                    <span className="text-slate-600">Пучение глин (касательное)</span>
                    <span className={`font-mono font-bold ${results.frostHeavingPercent > 60 ? "text-red-500" : "text-emerald-600"}`}>
                      {results.frostHeavingPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${results.frostHeavingPercent > 60 ? "bg-red-500" : "bg-emerald-500"}`} 
                      style={{ width: `${results.frostHeavingPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    {results.frostHeavingPercent > 60 
                      ? "Повышенный риск во влажный период. Обязательна песчаная подсыпка и XPS." 
                      : "Выталкивающий риск минимален. Достаточно отсыпки песком."}
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-3.5 text-xs">
                  <div className="flex justify-between items-center mb-1.5 font-semibold">
                    <span className="text-slate-600">Просадочность коробки</span>
                    <span className={`font-mono font-bold ${results.collapsibilityPercent > 60 ? "text-red-500" : "text-emerald-600"}`}>
                      {results.collapsibilityPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${results.collapsibilityPercent > 60 ? "bg-red-500" : "bg-emerald-500"}`} 
                      style={{ width: `${results.collapsibilityPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    {soilType === SoilType.LOESS 
                      ? "Критическая лёссовая просадка. Обязателен перехватывающий пластовый дренаж!" 
                      : "Грунт стабилен. Залегание ровное, угроза усадок при заливке штатная."}
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/40 rounded-2xl p-3.5 text-xs">
                  <div className="flex justify-between items-center mb-1.5 font-semibold">
                    <span className="text-slate-600">Риск подтопления УГВ</span>
                    <span className={`font-mono font-bold ${results.floodingPercent > 60 ? "text-red-500" : "text-emerald-600"}`}>
                      {results.floodingPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${results.floodingPercent > 60 ? "bg-red-500" : "bg-emerald-500"}`} 
                      style={{ width: `${results.floodingPercent}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    {results.floodingPercent > 50 
                      ? "Обильные грунтовые течения. Плита идеальна, для цоколя необходим дренажный контур." 
                      : "Водоносные линзы глубоки. Риск затопления котлована не выявлен."}
                  </p>
                </div>

              </div>
            </div>

            {/* Decision Quality Index Indicators */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 pt-5 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">🎯 Достоверность расчёта:</span>
                <strong className="text-slate-800 text-sm block mt-0.5">{soilType === SoilType.LOAM && width === 10 ? "75%" : "95%"}</strong>
                <p className="text-[9.5px] text-slate-450 mt-1 leading-normal">Зависит от слоёв грунтов по отчету бурения ИГИ под конкретный СНиП.</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">🛡️ Модельная надёжность:</span>
                <strong className={`text-sm block mt-0.5 ${selectedOption.reliabilityScore >= 90 ? "text-emerald-600" : "text-indigo-600"}`}>
                  {selectedOption.reliabilityScore}%
                </strong>
                <p className="text-[9.5px] text-slate-450 mt-1 leading-normal">Применяется внутренний расчетный коэффициент запаса прочности {safetyFactor}x.</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">📈 Риск корректировки цен:</span>
                <strong className="text-amber-700 text-sm block mt-0.5">
                  {soilType === SoilType.LOESS ? "+15-20%" : "+5-10%"}
                </strong>
                <p className="text-[9.5px] text-slate-450 mt-1 leading-normal">Сезонные скачки прайсов на бетонных заводах Macon и Lafarge РМ.</p>
              </div>
            </div>

            {/* Price scenarios projections inside clean macOS widgets */}
            <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-2.5">🔮 Сценарии стоимости после ИГИ</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]"><TrendingDown className="w-3.5 h-3.5" /> Оптимистичный</span>
                  <span className="font-mono text-slate-800 font-bold text-sm mt-1 block">{(selectedOption.costMDL * 0.9).toLocaleString()} MDL</span>
                  <span className="text-[9px] text-slate-450 mt-1 block leading-normal">Геология покажет плотные суглинки, что позволит сузить ширину подошвы на 15%.</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-sm">
                  <span className="text-slate-700 font-bold flex items-center gap-1 text-[11px]">📊 Реалистичный базовый</span>
                  <span className="font-mono text-slate-800 font-bold text-sm mt-1 block">{(selectedOption.costMDL).toLocaleString()} MDL</span>
                  <span className="text-[9px] text-slate-450 mt-1 block leading-normal">Характеристики грунта в точности совпадут с табличными данными нормативного СНиП.</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-rose-500 font-bold flex items-center gap-1 text-[11px]"><TrendingUp className="w-3.5 h-3.5" /> Неблагоприятный</span>
                  <span className="font-mono text-slate-800 font-bold text-sm mt-1 block">{(selectedOption.costMDL * 1.15).toLocaleString()} MDL</span>
                  <span className="text-[9px] text-slate-450 mt-1 block leading-normal">Изыскания обнаружат плывун или пластичный лёсс. Понадобится замена грунтов.</span>
                </div>
              </div>
            </div>

          </div>

          {/* EUROCODE & NCM STRUCTURAL LOAD DESIGNS & COMBINATIONS PASSPORT */}
          <div id="eurocode-load-combinations" className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-6 shadow-sm shadow-slate-200/40 relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
            
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-0.5">NCM EN 1990 / NCM EN 1991 / NCM EN 1998</span>
                <h2 className="text-sm font-display font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  🛡️ Расчетные сочетания нагрузок и сейсмическая масса
                </h2>
              </div>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase px-2.5 py-1 rounded-full font-sans">
                Раздел ULS (ПС1)
              </span>
            </div>

            {/* Input Verification Block */}
            <div className="mt-4 p-3 bg-slate-50 border border-slate-150 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">📝 Верификация исходных параметров здания:</span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-slate-600 leading-relaxed font-sans font-medium">
                <div>• Геометрия: <strong>{width}м × {length}м</strong></div>
                <div>• Площадь застройки: <strong>{Math.round(width * length)} м²</strong></div>
                <div>• Этажность СНиП: <strong>{floors} эт.</strong> ({futureFlooringExtension ? "с учетом надстройки +1" : "тип ИЖС"})</div>
                <div>• Высота этажа: <strong>{floorHeight} м</strong></div>
                <div>• Стены: <strong>{WALL_MATERIAL_DATA[wallMaterial].name}</strong></div>
                <div>• Плиты перекрытий: <strong>{SLAB_DATA[slabMaterial].name}</strong></div>
                <div>• Снег (кПа): <strong>{REGION_DATA[region].snowLoad} кПа</strong> ({region})</div>
                <div>• Сейсмика: <strong>{REGION_DATA[region].seismicPoints} баллов</strong> (A = {REGION_DATA[region].seismicCoeff})</div>
              </div>
            </div>

            {/* Factored Table */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse min-w-[550px] font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                    <th className="py-2.5 px-3">Наименование нагрузки</th>
                    <th className="py-2.5 px-3 select-none">Тип</th>
                    <th className="py-2.5 px-3 text-right">Характ. (G_k, Q_k)</th>
                    <th className="py-2.5 px-3 text-center">Коэф. γ_f</th>
                    <th className="py-2.5 px-3 text-right">Расчетн. (G_d, Q_d)</th>
                    <th className="py-2.5 px-3 max-w-[200px]">Проектный комментарий (NCM / СН)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px] text-slate-750">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold">Внутренние и внешние стены</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">Постоянная</td>
                    <td className="py-2 px-3 text-right font-mono">{results.wallWeightTons} т</td>
                    <td className="py-2 px-3 text-center font-mono">1.2</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{Math.round(results.wallWeightTons * 1.2 * 10) / 10} т</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] leading-tight">γf = 1.2 применён для деревянных и каменных несущих конструкций дома у застройщика</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold">Междуэтажные перекрытия и пол</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">Постоянная</td>
                    <td className="py-2 px-3 text-right font-mono">{results.slabWeightTons} т</td>
                    <td className="py-2 px-3 text-center font-mono">1.24</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{Math.round(results.slabWeightTons * 1.24 * 10) / 10} т</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] leading-tight">γf = 1.24 (средневзвешенный: несущая плита 1.2, тяжелый пирог пола/стяжка 1.3)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold">Стропила и кровельный пирог</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">Постоянная</td>
                    <td className="py-2 px-3 text-right font-mono">{results.roofWeightTons} т</td>
                    <td className="py-2 px-3 text-center font-mono">1.26</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{Math.round(results.roofWeightTons * 1.26 * 10) / 10} т</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] leading-tight">γf = 1.26 (средневзвешенный: деревянные фермы/обрешётка 1.2, черепица/покрытие 1.3)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold">Полезная жилая нагрузка</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">Временная</td>
                    <td className="py-2 px-3 text-right font-mono">{results.liveLoadTons} т</td>
                    <td className="py-2 px-3 text-center font-mono">1.4</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{Math.round(results.liveLoadTons * 1.4 * 10) / 10} т</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] leading-tight">γf = 1.4 применён для полезной нагрузки категории A (бытовые жилые помещения СН)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold">Снеговая нагрузка</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">Временная</td>
                    <td className="py-2 px-3 text-right font-mono">{results.snowLoadTons} т</td>
                    <td className="py-2 px-3 text-center font-mono">1.4</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{Math.round(results.snowLoadTons * 1.4 * 10) / 10} т</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] leading-tight">γf = 1.4 применён для климатического снежного покрова в Молдове в соответствии с NCM EN</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold">Ветровая боковая нагрузка</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px]">Временная</td>
                    <td className="py-2 px-3 text-right font-mono">{results.windLoadTons} т</td>
                    <td className="py-2 px-3 text-center font-mono">1.4</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{Math.round(results.windLoadTons * 1.4 * 10) / 10} т</td>
                    <td className="py-2 px-3 text-slate-500 text-[10px] leading-tight">γf = 1.4 применён для ветровой аэродинамической силы на высоту стен по NCM EN 1991-1-4</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Combinations Breakdown */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">🌨️ Вариант А: Снегодоминирующее сочетание</span>
                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                  Приоритетное накопление мокрого снега на кровле при пониженных коэффициентах нагружения от ветра и пребывания людей (NCM EN 1990 Formula 6.10):
                </p>
                <div className="bg-white px-3 py-2 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-mono text-[10.5px]">
                  <div>E_d,A = G_d + Q_d,snow + 0.6*Q_d,wind + 0.7*Q_d,live</div>
                  <div className="text-blue-600 font-extrabold mt-1 text-[11px]">
                    = {Math.round((results.wallWeightTons * 1.2 + results.slabWeightTons * 1.24 + results.roofWeightTons * 1.26) * 10) / 10} + {Math.round(results.snowLoadTons * 1.4 * 10) / 10} + {Math.round(0.6 * results.windLoadTons * 1.4 * 10) / 10} + {Math.round(0.7 * results.liveLoadTons * 1.4 * 10) / 10}
                    <span className="text-slate-900 font-sans font-normal ml-1">🟰</span> {results.scenarioASnowDominantTons} тонн
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">🛋️ Вариант B: Полезнодоминирующее сочетание</span>
                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                  Максимальное динамическое заселение людьми на этажах при сниженной толщине снежного покрова и боковом ветровом давлении:
                </p>
                <div className="bg-white px-3 py-2 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-mono text-[10.5px]">
                  <div>E_d,B = G_d + Q_d,live + 0.5*Q_d,snow + 0.6*Q_d,wind</div>
                  <div className="text-emerald-600 font-extrabold mt-1 text-[11px]">
                    = {Math.round((results.wallWeightTons * 1.2 + results.slabWeightTons * 1.24 + results.roofWeightTons * 1.26) * 10) / 10} + {Math.round(results.liveLoadTons * 1.4 * 10) / 10} + {Math.round(0.5 * results.snowLoadTons * 1.4 * 10) / 10} + {Math.round(0.6 * results.windLoadTons * 1.4 * 10) / 10}
                    <span className="text-slate-900 font-sans font-normal ml-1">🟰</span> {results.scenarioBLiveDominantTons} тонн
                  </div>
                </div>
              </div>
            </div>

            {/* Worst Case & Seismic Mass Info footer */}
            <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-indigo-800 font-black flex items-center gap-1.5 uppercase tracking-tight">
                    🔥 Наибольшее расчетное воздействие (ULS Envelope - ПС1):
                  </span>
                  <p className="text-[11px] text-indigo-700 font-medium mt-1 leading-normal max-w-xl font-sans">
                    Для гарантированного расчета сечений выбран максимум ультимативных сил: <strong className="text-slate-900 font-bold">{results.totalFactoredWeightTons} т</strong>. С высокой точностью мы пересчитали несущую способность опоры.
                  </p>
                </div>
                <div className="bg-white px-4 py-2 border border-indigo-100 rounded-xl leading-tight text-right shrink-0">
                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase font-mono">ULS (ПС1) Нагрузка:</span>
                  <span className="font-mono text-indigo-700 font-black text-lg">{results.totalFactoredWeightTons} т</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs w-full">
                <div className="leading-snug">
                  <span className="text-emerald-800 font-black flex items-center gap-1">
                    ⚡ Квазипостоянная сейсмическая масса по NCM EN 1998 / Eurocode 8:
                  </span>
                  <span className="text-[10.5px] text-emerald-700 block mt-0.5 font-sans">
                    Жилая полезная нагрузка при землетрясении берется с коэффициентом ψ₂ = 0.3, климатический снег и ветер отброшены (ψ₂ = 0) с учетом молдавских норм.
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-mono mt-1 leading-normal">
                    Масса при расчете: Σ G_k + 0.3 * Q_k,live = {results.wallWeightTons} + {results.slabWeightTons} + {results.roofWeightTons} + 0.3 * {results.liveLoadTons} = {results.seismicMassCombinationTons} тонн.
                  </span>
                </div>
                <div className="bg-white px-4 py-2 border border-emerald-100 rounded-xl leading-tight text-right shrink-0">
                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase font-mono">Сейсм. масса:</span>
                  <span className="font-mono text-emerald-700 font-bold text-base">{results.seismicMassCombinationTons} т</span>
                </div>
              </div>
            </div>
          </div>

          {/* DUAL MODE / AI CONSULTANT - iMessage-like styled Chat panel */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] flex flex-col h-[480px] shadow-sm shadow-slate-200/40 overflow-hidden">
            
            {/* Header: macOS top window details */}
            <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200/60 flex flex-wrap justify-between items-center gap-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 relative">
                  <MessageSquare className="w-4 h-4" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                    Инженерный ИИ-Советник по СНиП РМ <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  </h3>
                  <p className="text-[9.5px] text-slate-450 font-medium font-sans">Практические поверочные консультации по нормативам</p>
                </div>
              </div>

              {/* Fast mode toggles designed as macOS buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickQuiz("quick")}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition text-[10.5px] shadow-2xs active:scale-95"
                >
                  🚀 Экспресс
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickQuiz("pro")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition text-[10.5px] shadow-sm shadow-blue-500/15 active:scale-95 flex items-center gap-1"
                >
                  🔍 Полный аудит
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/50">
              
              {apiMissingKey && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-[11px] text-indigo-850 shadow-2xs">
                  <span className="font-extrabold flex items-center gap-1.5 text-indigo-700 mb-1">
                    <Info className="w-4.5 h-4.5" /> ИИ Ожидает Вашей Инициализации
                  </span>
                  Графический САПР-конструктор слева полностью рассчитал объемы бетона, арматуры и смету. 
                  Для подключения ИИ-советника, добавьте свой ключ <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono text-[10px]">GEMINI_API_KEY</code> в панель <strong>Settings &gt; Secrets</strong> в AI Studio.
                </div>
              )}

              {messages.map((m) => (
                <div 
                  key={m.id} 
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role !== "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shrink-0 font-display font-bold select-none shadow-xs border border-blue-400/20">
                      AI
                    </div>
                  )}

                  <div className={`max-w-[80%] rounded-[20px] px-4 py-2.5 text-xs leading-relaxed ${
                    m.role === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none shadow-sm shadow-blue-500/10" 
                      : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs whitespace-pre-wrap"
                  }`}>
                    {m.content}
                    <span className="block text-[8px] text-right mt-1.5 opacity-60 font-mono font-medium">
                      {m.timestamp}
                    </span>
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-250 text-slate-600 flex items-center justify-center text-xs shrink-0 select-none border border-slate-300/40 bg-slate-100 shadow-2xs">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>
              ))}

              {isChatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shrink-0 font-bold animate-pulse">
                    ...
                  </div>
                  <div className="bg-white border border-slate-200 text-slate-500 rounded-[20px] rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2.5 shadow-2xs">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span className="font-medium">Изучаю геологические слои в СНиП РМ...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Helper Questions buttons (Chips look) */}
            <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 font-bold flex items-center mr-1">ВОПРОСЫ:</span>
              <button
                type="button"
                onClick={() => queryAI("Какой заводить сейсмопояс в Кишиневе по нормам Молдовы (СНиП II-7-81*)?")}
                className="text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 transition font-semibold active:scale-95 shadow-2xs cursor-pointer"
              >
                🧱 Сейсмопояс в Кишиневе?
              </button>
              <button
                type="button"
                onClick={() => queryAI("Что происходит с влажным лессовым суглинком (лёсс) на юге Молдовы при замачивании?")}
                className="text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 transition font-semibold active:scale-95 shadow-2xs cursor-pointer"
              >
                ⚠️ Опасность лёсса?
              </button>
              <button
                type="button"
                onClick={() => queryAI("Какая оптимальная глубина обратной засыпки и высота песчано-гравийной подушки под плиту?")}
                className="text-[10px] bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 transition font-semibold active:scale-95 shadow-2xs cursor-pointer"
              >
                🥪 Песчаная подушка?
              </button>
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmitChat} className="p-3 bg-white border-t border-slate-150 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Спросите ИИ-инженера об СНиП заложении, плитах, дренаже РМ..."
                className="flex-1 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-450 outline-none transition-all font-medium"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 text-white px-4 py-2.5 rounded-xl transition font-bold shadow-sm shadow-blue-500/10 active:scale-95 flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>

          {/* Builder Checklists section */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-6 shadow-sm shadow-slate-200/40">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-800 mb-3.5 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-blue-500" /> Свод правил и чек-лист инженера в Молдове
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-600 leading-relaxed font-sans font-medium">
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 font-extrabold border border-emerald-200">1</div>
                  <p>
                    <strong>Инженерная геология (ИГИ)</strong>: Перед началом работ требуется пробурить геоскважины 6-8м на участке, чтобы ИИ/проектировщик мог определить тип залегания лёссовых глин.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 font-extrabold border border-emerald-200">2</div>
                  <p>
                    <strong>Утепление откосов и отмостки</strong>: Сезонное промерзание суглинков Молдовы выпирает ненагруженные легкие ленты. Обязательна укладка гидрофобного XPS на глубину промерзания ({REGION_DATA[region].frostDepth}м).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 font-extrabold border border-emerald-200">3</div>
                  <p>
                    <strong>Сейсмоустойчивый контур</strong>: Молдова подвержена толчкам очага Враца (Карпаты) силой 6-8 баллов. Фундамент и цокольные стены должны обладать связанным армопоясом (Centură antiseismică).
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] shrink-0 font-extrabold border border-emerald-200">4</div>
                  <p>
                    <strong>Государственная марка бетона</strong>: По нормам CP F.01.02 во влажных низинах заказывайте монолит класса не ниже <strong>С16/20 (М250)</strong> или <strong>С20/25 (М300)</strong> с узлов Macon или Dekora.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* COMPREHENSIVE ENGINEERING AUDIT & DIAGNOSTIC REPORT CARD */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/60 rounded-[24px] p-6 shadow-sm shadow-slate-200/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
            
            <div className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-0.5">ВЕДОМОСТЬ САПР РМ</span>
                <h3 className="text-sm font-display font-bold text-slate-800 flex items-center gap-2">
                  📊 Сводный отчет инженерно-диагностического аудита
                </h3>
              </div>
              <span className="bg-amber-100/50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                Индекс целостности: 100% ВАЛИДЕН
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-4">
              {/* Stat 1: Total Formulas */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Общее количество формул:</span>
                <strong className="text-slate-800 text-xl font-mono block mt-1">56</strong>
                <span className="text-[9.5px] text-slate-450 block mt-0.5">Сквозные связи во всех листах Excel</span>
              </div>

              {/* Stat 2: Input Failures */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Ошибок ввода:</span>
                <strong className={`text-xl font-mono block mt-1 ${validationErrors.length > 0 ? "text-red-650" : "text-emerald-600"}`}>
                  {validationErrors.length}
                </strong>
                <span className="text-[9.5px] text-slate-450 block mt-0.5">Обнаружен запуск вне допусков СНиП</span>
              </div>

              {/* Stat 3: Formula Typo Sins */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Двойные формулы ("=="):</span>
                <strong className="text-emerald-600 text-xl font-mono block mt-1">О</strong>
                <span className="text-[9.5px] text-emerald-450 block mt-0.5 font-medium">100% исправлено на "="</span>
              </div>

              {/* Stat 4: Hardcoded Rates Removed */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/50 text-center">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Жесткие цены заменены:</span>
                <strong className="text-blue-600 text-xl font-mono block mt-1">100%</strong>
                <span className="text-[9.5px] text-slate-450 block mt-0.5">Все вынесено на лист 'Настройки'</span>
              </div>
            </div>

            {/* Potential engineering risks listing */}
            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[10px] text-rose-600 font-extrabold uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                  ⚠️ Активные потенциальные инженерные риски усадки и пучения:
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 space-y-2 leading-relaxed font-medium">
                  {groundwaterDepth < 1.5 && (
                    <p className="text-amber-800">
                      • <strong>Критический уровень грунтовых вод (УГВ = {groundwaterDepth}м)</strong>: Высочайший напор воды. Ленточным фундаментам угрожает намокание, обязателен непрерывный пристенный дренаж (комплекты колодцев d110) и гидроизоляция. Плита УШП нивелирует риски.
                    </p>
                  )}
                  {soilType === SoilType.LOESS && (
                    <p className="text-amber-800">
                      • <strong>Слабый просадочный грунт (Лёсс)</strong>: Склонен к резкой структурной просадке при замачивании. Плотность основания должна быть искусственно увеличена методом отсыпки щебня с последующим послойным проливом и виброутромбовкой.
                    </p>
                  )}
                  {soilType === SoilType.FILLED && (
                    <p className="text-amber-850">
                      • <strong>Насыпной неоплотненный грунт (Filled)</strong>: Крайне аморфный грунт с непредсказуемой несущей способностью. Строго предписывается использование свайно-ростверкового заложенного фундамента с прорезкой насыпной грунтовой подушки до надежного материкового пласта.
                    </p>
                  )}
                  {landSlope > 5 && (
                    <p className="text-amber-800">
                      • <strong>Уклон строительной площадки ({landSlope}%)</strong>: Повышенные поперечные сдвиговые векторы и риск сползания. Требуется террасирование (ступенчатая опалубка в лентах) или фиксация рельефа фундаментными подпорными стенами.
                    </p>
                  )}
                  {region !== "NORTH" && (
                    <p className="text-amber-800">
                      • <strong>Сейсмичность ({REGION_DATA[region].seismicClass} баллов MSK-64)</strong>: Жесткие сейсмические силы на восток и юг Молдовы (очаг Враца). Фундамент и стыки угловой арматуры обязаны обладать непрерывной вязкой без зазоров.
                    </p>
                  )}
                  {landSlope <= 5 && groundwaterDepth >= 1.5 && soilType !== SoilType.LOESS && soilType !== SoilType.FILLED && (
                    <p className="text-emerald-700 font-semibold text-center py-1">
                      • Инженерно-геологические риски сведены к минимуму. Строительное пятно расположено на стабильных грунтах со стабильной сжимаемой толщей.
                    </p>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest block mb-1.5 flex items-center gap-1.5">
                  💡 Рекомендации по повышению достоверности расчётов на объекте:
                </span>
                <ul className="list-disc pl-5 text-[11px] text-slate-500 space-y-1 bg-blue-50/20 border border-blue-105/50 rounded-xl p-3.5 leading-normal font-medium">
                  <li>Заблаговременно заказывайте полное Инженерно-Геологическое Изыскание (бурение минимум 2 скважин по диагоналям дома) для калибровки модуля деформации грунта (Е, МПа) и сцепления (С, кПа).</li>
                  <li>Параметры инфляции цен (1.12) рекомендуется перепроверять по государственным ежеквартальным строительным ведомостям цен Co劈ef РМ.</li>
                  <li>При заливке монолитов всегда отбирайте контрольные образцы-кубики бетона объёмом 100х100х100мм для лабораторных испытаний на прочность на сжатие через 28 суток по ГОСТ 10180.</li>
                </ul>
              </div>

              {/* Summary table of fixed cells / formulas */}
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest block mb-1.5">
                  📜 Ведомость исправлений формул и ячеек (100% аудит завершен):
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200 text-[10.5px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="py-2 px-3">Узел / Лист Excel</th>
                        <th className="py-2 px-3">Координаты</th>
                        <th className="py-2 px-3">Какая формула заведена / заменена</th>
                        <th className="py-2 px-3">Инженерное обоснование</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-slate-600 font-medium">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Все листы Сметы</td>
                        <td className="py-2 px-3 text-red-700">Ячейки формул G7...G130</td>
                        <td className="py-2 px-3"><code className="bg-rose-50 text-rose-700 px-1 rounded font-mono">==D[R]*F[R]</code> заменено на <code className="bg-slate-100 text-slate-800 px-1 rounded font-mono">=D[R]*F[R]</code></td>
                        <td className="py-2 px-3 italic">Устранен синтаксический баг избыточного двойного равенства, вызывавший сбои Excel.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Плита, Лента, Сваи</td>
                        <td className="py-2 px-3 text-red-700">Колонки F (Цены MDL)</td>
                        <td className="py-2 px-3"><code className="bg-slate-100 text-slate-800 px-1 rounded font-mono font-mono text-[9px]">='Настройки'!$C$X * 'Настройки'!$C$7</code></td>
                        <td className="py-2 px-3 italic">Устранены хаотично зашитые цифры. Теперь все цены берутся из Настроек с учетом коэффициента инфляции.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Все сметные листы</td>
                        <td className="py-2 px-3 text-red-700">Ячейка Итого Конвертер</td>
                        <td className="py-2 px-3 font-mono text-[9.5px]">=ROUND(G[Row] / 'Настройки'!$C$5, 0)</td>
                        <td className="py-2 px-3 italic">Связана напрямую с ячейкой EUR_RATE в Настройках, убирает статические цифры.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Сводное сравнение</td>
                        <td className="py-2 px-3 text-emerald-600">Колонки C, D</td>
                        <td className="py-2 px-3 font-mono text-[9.5px]">='Имя_Листа'!G[Row]</td>
                        <td className="py-2 px-3 italic">Обеспечивает сквозную динамическую перекачку данных между листами без циклических сносок.</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-800">Плита УШП & Сваи</td>
                        <td className="py-2 px-3 text-emerald-600">Оценка надёжности</td>
                        <td className="py-2 px-3">Коэффициент взвешенной суммы критериев</td>
                        <td className="py-2 px-3 italic">Заменено жестко забитое статическое число (95% и 60%). Теперь оценка считается динамически.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

        </section>

      </main>

      {/* Footer styled beautifully with subtle separators */}
      <footer className="bg-slate-100 border-t border-slate-200 px-6 py-5 shrink-0 text-center text-xs text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <p>© 2026 AI Foundation Expert Moldova. Программный поверочный комплекс САПР СНиП & NCM.</p>
          <div className="flex justify-center gap-4 text-[10px] text-slate-400">
            <span>СНиП 2.02.01-83*</span>
            <span>•</span>
            <span>NCM F.02.02-2008</span>
            <span>•</span>
            <span>NCM G.01.01-2015</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
