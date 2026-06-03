import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { CalculatorInput, CalculationResults, FoundationOption } from "../types";

// Helper/format utility functions
export function getRegionLabel(region: string): string {
  switch (region) {
    case "CENTER": return "Центр (Кишинёв, Орхей, Унгень, Хынчешты)";
    case "NORTH": return "Север (Бэлць, Бричень, Сорока)";
    case "SOUTH": return "Юг (Кагул, Комрат, Тараклия, Чадыр-Лунга)";
    default: return region;
  }
}

export function getSoilLabel(soilType: string): string {
  switch (soilType) {
    case "SAND": return "Песок средней крупности (~280 кПа, отличная несущая основа)";
    case "SILTY_SAND": return "Песок пылеватый (~180 кПа, склонность к плывунам)";
    case "SANDY_LOAM": return "Супесь (~150 кПа, умеренное пучение)";
    case "LOAM": return "Суглинок (~200 кПа, типичный просадочный грунт РМ)";
    case "CLAY": return "Глина пластичная (~160 кПа, высокая пучинистость)";
    case "LOESS": return "Лёссовый просадочный (~110 кПа, критический риск при замачивании)";
    case "FILLED": return "Насыпной / Техногенный (~70 кПа, крайне малая прочность)";
    case "ROCK": return "Скальный прочный (~650 кПа, сверхвысокая прочность)";
    default: return soilType;
  }
}

export function getWallLabel(wallMaterial: string): string {
  switch (wallMaterial) {
    case "GASOBETON": return "Автоклавный газобетон (~500 кг/м³)";
    case "KOTELET": return "Молдавский котелец (известняк ~1900 кг/м³)";
    case "BRICK": return "Полнотелый/пустотелый кирпич (~1700 кг/м³)";
    case "KERAMZIT": return "Керамзитобетонные блоки (~1100 кг/м³)";
    case "FRAME": return "Деревянный каркас (~250 кг/м³)";
    default: return wallMaterial;
  }
}

export function getSlabLabel(slabMaterial: string): string {
  switch (slabMaterial) {
    case "MONOLITH": return "Монолитный железобетон (2500 кг/м³)";
    case "HOLLOW_CORE": return "Круглопустотные плиты ПК (~1500 кг/м³)";
    case "TIMBER": return "Деревянные балки с заполнением (~250 кг/м³)";
    default: return slabMaterial;
  }
}

export function getRoofLabel(roofType: string): string {
  switch (roofType) {
    case "GABLE_METAL": return "Двускатная кровля с металлочерепицей";
    case "HIP_CERAMIC": return "Вальмовая кровля с тяжелой керамической черепицей";
    case "FLAT_PVC": return "Плоская кровля с ПВХ мембраной и балластом";
    case "SHED_BOARD": return "Односкатная легкая кровля из профнастила";
    default: return roofType;
  }
}

// CAD ASCII Drawing Generator
export function buildASCIIBlueprint(input: CalculatorInput, fbId: string): string[] {
  const lines: string[] = [];
  lines.push("  ┌──────────────────────────────────────────────────┐");
  lines.push("  │        ИНЖЕНЕРНЫЙ ЧЕРТЕЖ САПР (РАЗРЕЗ CAD)       │");
  lines.push("  └──────────────────────────────────────────────────┘");
  lines.push("");

  const floors = input.floors;
  const hasMansard = floors === 1.5 || floors === 1.6 || floors === 1.7 || floors === 2.5 || floors === 3.5;
  const floorCount = Math.floor(floors);

  if (hasMansard) {
    if (input.roofType === "FLAT_PVC") {
      lines.push("               _______________");
      lines.push("              [===============]  <-- ПЛОСКАЯ КРОВЛЯ С ПВХ-МЕМБРАНОЙ");
      lines.push("              |   [o]    [o]  |  <--- ФРАНЦУЗСКИЙ ОСТЕКЛЕННЫЙ ЭТАЖ");
      lines.push("              |_______________|");
    } else if (input.roofType === "SHED_BOARD") {
      lines.push("              \\");
      lines.push("               \\______________");
      lines.push("                \\  [o]    [o] \\  <--- ОДНОСКАТНАЯ МАНСАРДНАЯ КРОВЛЯ");
      lines.push("                 [____________]");
    } else {
      lines.push("                  ___________");
      lines.push("                 /           \\   <--- ВЕРХНИЙ ПОЛОГИЙ СКАТ КРОВЛИ");
      lines.push("                /_____________\\");
      lines.push("               /  _       _  \\");
      lines.push("              /  [o]     [o]  \\  <--- МАНСАРДНЫЙ КРУТОЙ СКАТ");
      lines.push("             /___[o]_____[o]___\\     (КЛАССИЧЕСКИЕ АРОЧНЫЕ ЛЮКАРНЫ)");
    }
  } else {
    if (input.roofType === "GABLE_METAL") {
      lines.push("                      /\\");
      lines.push("                     /  \\");
      lines.push("                    /    \\");
      lines.push("                   /  ()  \\      <--- МЕТАЛЛОЧЕРЕПИЦА (ДВУСКАТНАЯ)");
      lines.push("                  /________\\");
    } else if (input.roofType === "HIP_CERAMIC") {
      lines.push("                  ___________");
      lines.push("                 /           \\");
      lines.push("                /             \\  <--- КЕРАМИЧЕСКАЯ ЧЕРЕПИЦА (ВАЛЬМОВАЯ)");
      lines.push("               /_______________\\");
    } else if (input.roofType === "FLAT_PVC") {
      lines.push("               _______________");
      lines.push("              [===============]  <--- ПЛОСКАЯ КРОВЛЯ С ПВХ-МЕМБРАНОЙ");
      lines.push("              [_______________]");
    } else {
      lines.push("              \\");
      lines.push("               \\");
      lines.push("                \\_____________   <--- КРОВЛЯ ИЗ ПРОФНАСТИЛА (ОДНОСКАТНАЯ)");
      lines.push("                 [____________]");
    }
  }

  for (let f = floorCount; f >= 1; f--) {
    let wallLabel = "";
    if (f === floorCount) {
      if (input.wallMaterial === "KOTELET") wallLabel = " [Котелец 1900 кг/м³]";
      else if (input.wallMaterial === "GASOBETON") wallLabel = " [Газобетон 500 кг/м³]";
      else if (input.wallMaterial === "BRICK") wallLabel = " [Кирпич 1700 кг/м³]";
      else if (input.wallMaterial === "KERAMZIT") wallLabel = " [Керамзитоб. 1100 кг/м³]";
      else wallLabel = " [Дерев. Каркас 250 кг/м³]";
    }
    if (f === 1) {
      lines.push(`             |   [ ]  |¯|  [ ] |${wallLabel} (1 ЭТАЖ)`);
      lines.push("             |________[_]______|");
    } else {
      lines.push(`             |   [ ]      [ ]  |${wallLabel} (${f} ЭТАЖ)`);
      lines.push("             |_________________|");
    }
  }

  if (input.hasBasement) {
    lines.push("    - - - - -#=================#- - - - - <-- УРОВЕНЬ ЗЕМЛИ");
    lines.push("             |   [ ]      [ ]  |          <--- ВСТРОЕННЫЙ ПОДВАЛ");
    lines.push("             |_________________|");
  } else {
    lines.push("    - - - - -#=================#- - - - - <-- УРОВЕНЬ ЕСТЕСТВЕННОЙ ЗЕМЛИ");
  }

  if (fbId === "slab") {
    lines.push("             [=================]          <--- МОНОЛИТНАЯ Ж/Б ПЛИТА");
    lines.push("             [_________________]");
    lines.push("             | : : : : : : : . |          <--- Песчано-гравийная подушка");
    lines.push("             |_________________|");
  } else if (fbId === "strip") {
    lines.push("             |===|         |===|          <--- Ж/Б РОСТВЕРК ВЫСОКИЙ");
    lines.push("             |   |         |   |          <--- Тело ленточного бетона");
    lines.push("             [===]         [===]          <--- РАСШИРЕННАЯ ПОДОШВА ЛЕНТЫ");
    lines.push("             |:::|         |:::|          <--- Уплотненное основание подушки");
  } else {
    lines.push("             [=================]          <--- МОНОЛИТНЫЙ Ж/Б РОСТВЕРК");
    lines.push("              | |           | |");
    lines.push("              | |           | |           <--- ОПОРНЫЕ СВАИ ПО СНиП");
    lines.push("              | |           | |");
    lines.push("             ( _ )         ( _ )          <--- Расширенные пяты свай (Тисэ)");
  }

  lines.push("    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ <-- РАСЧЕТНЫЙ УРОВЕНЬ ВОД (УГВ)");
  lines.push("                             _  _  _      <--- Сейсмоустойчивый материк");
  return lines;
}

// Styling utilities
const applySheetHeader = (ws: ExcelJS.Worksheet, title: string, colsCount: number = 8, bg: string = "FF0F172A") => {
  ws.views = [{ showGridLines: true }];
  const endColLetter = String.fromCharCode(65 + colsCount - 1);
  ws.mergeCells(`A2:${endColLetter}2`);
  const c = ws.getCell("A2");
  c.value = title;
  c.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  c.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 32;
};

const applyTableHeaders = (ws: ExcelJS.Worksheet, row: number, headers: string[], bg: string = "FF1E3A8A") => {
  headers.forEach((h, i) => {
    const colName = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${colName}${row}`);
    cell.value = h;
    cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } }
    };
  });
  ws.getRow(row).height = 28;
};

// Clear dual equality signs and format properly in ExcelJS formulas
export function setCellValue(cell: ExcelJS.Cell, value: any) {
  if (value !== null && value !== undefined) {
    if (typeof value === "object" && "formula" in value) {
      let formulaStr = value.formula;
      while (formulaStr.startsWith("=")) {
        formulaStr = formulaStr.substring(1);
      }
      cell.value = { ...value, formula: formulaStr };
    } else {
      const valStr = value.toString();
      if (valStr.startsWith("=")) {
        let formulaStr = valStr;
        while (formulaStr.startsWith("=")) {
          formulaStr = formulaStr.substring(1);
        }
        cell.value = { formula: formulaStr };
      } else {
        cell.value = value;
      }
    }
  } else {
    cell.value = null;
  }
}

// Helper to mathematically clean, resolve and wrap complex formula rates to prevent precedence errors in Excel
export function getRateFormula(rate: string | number, qtyCell: string): string {
  if (typeof rate === "string") {
    let cleanRate = rate.trim();
    while (cleanRate.startsWith("=")) {
      cleanRate = cleanRate.substring(1).trim();
    }
    // If rate formula contains addition or subtraction, wrap it in parentheses to enforce operator precedence
    if (cleanRate.includes("+") || cleanRate.includes("-")) {
      return `=(${cleanRate}) * ${qtyCell}`;
    } else {
      return `=${cleanRate} * ${qtyCell}`;
    }
  } else {
    return `=${qtyCell} * ${rate}`;
  }
}

export function writeCell(ws: ExcelJS.Worksheet, rName: string, value: any, style?: any) {
  const cell = ws.getCell(rName);
  setCellValue(cell, value);
  if (style) {
    if (style.font) cell.font = style.font;
    if (style.fill) cell.fill = style.fill;
    if (style.alignment) cell.alignment = style.alignment;
    if (style.border) cell.border = style.border;
    if (style.numFmt) cell.numFmt = style.numFmt;
  }
}

// Add hidden Settings template sheet
export function addSettingsSheet(workbook: ExcelJS.Workbook, safetyFactor: number) {
  const ws = workbook.addWorksheet("Настройки");
  ws.views = [{ showGridLines: true }];

  ws.getColumn(1).width = 18;
  ws.getColumn(2).width = 40;
  ws.getColumn(3).width = 16;
  ws.getColumn(4).width = 50;

  ws.mergeCells("B2:D2");
  const titleCell = ws.getCell("B2");
  titleCell.value = "ИНЖЕНЕРНО-ТЕХНИЧЕСКИЕ НАСТРОЙКИ КАЛЬКУЛЯТОРА";
  titleCell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 30;

  ws.getCell("B4").value = "Параметр настройки";
  ws.getCell("C4").value = "Значение";
  ws.getCell("D4").value = "Описание и нормативная ссылка";
  ["B", "C", "D"].forEach(c => {
    const r = ws.getCell(`${c}4`);
    r.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF1E293B" } };
    r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    r.alignment = { horizontal: "left", vertical: "middle" };
  });

  const settings = [
    { code: "EUR_RATE", label: "Курс обмена EUR (MDL/EUR)", val: 19.80, desc: "Официальный курс обмена валют Национального Банка Молдовы" },
    { code: "USD_RATE", label: "Курс обмена USD (MDL/USD)", val: 18.20, desc: "Официальный курс обмена валют Национального Банка Молдовы" },
    { code: "INFLATION_COEFF", label: "Коэффициент инфляции", val: 1.12, desc: "Коэффициент удорожания сметных ресурсов на текущий квартал" },
    { code: "SAFETY_FACTOR", label: "Коэффициент надежности по нагрузке", val: safetyFactor || 1.30, desc: "Коэффициент запаса по прочности грунтового основания СНиП" },
    { code: "CONCRETE_M3_MDL", label: "Цена бетона C20/25 M300 (MDL/м3)", val: 1450, desc: "Конструкционный бетон без учета транспортной доставки" },
    { code: "CONCRETE_DELIV_M3_MDL", label: "Транспорт бетона миксером (MDL/м3)", val: 300, desc: "Доставка автобетоносмесителем с узла на стройку в РМ" },
    { code: "STEEL_KG_MDL", label: "Базовая армирующая сталь А500С (MDL/кг)", val: 17.5, desc: "Арматура горячекатаная d8/d10/d12 по прейскуранту" },
    { code: "STEEL_DELIV_KG_MDL", label: "Транспортировка арматуры (MDL/кг)", val: 3.5, desc: "Логистическая развозка длинномерами на объект" },
    { code: "LONG_REBAR_LABOR_MDL", label: "Вязка вертикальных каркасов (MDL/кг)", val: 3.8, desc: "Трудовые работы по формированию силовых ребер опор" },
    { code: "TRANS_REBAR_LABOR_MDL", label: "Изготовление гнутых хомутов (MDL/кг)", val: 5.5, desc: "Ручная профессиональная гибка хомутов на стройплощадке" },
    { code: "EXCAV_JCB_MDL", label: "Разработка грунта механизированная (MDL/м3)", val: 105, desc: "Услуги тракторного экскаватора JCB за кубический метр" },
    { code: "EXCAV_MAN_MDL", label: "Ручная доработка траншеи/пятна (MDL/м3)", val: 50, desc: "Подрезка уплотненного дна котлована вручную" },
    { code: "EXCAV_DELIV_FLAT", label: "Смена выезда спецтехники (MDL/flat)", val: 1200, desc: "Подача трактора JCB на участок застройки в РМ" },
    { code: "FORMWORK_RENT_MDL", label: "Аренда мелкощитовой опалубки (MDL/м2)", val: 140, desc: "Суточная аренда инвентарной влагостойкой фанеры" },
    { code: "SAND_GRAVEL_M3_MDL", label: "Песчано-гравийная смесь (MDL/м3)", val: 450, desc: "Supply rate с карьера" },
    { code: "WATERPROOF_M2_MDL", label: "Наплавляемая гидроизоляция (MDL/м2)", val: 120, desc: "Праймер битумный + 2 слоя рулонного герметика" },
    { code: "INSULATION_M3_MDL", label: "Жесткий теплоизолятор XPS (MDL/м3)", val: 1400, desc: "Экструдированный пенополистирол Penoplex ТЕХНОНИКОЛЬ" },
    { code: "PILE_DRILLING_MDL", label: "Бурение погонного метра скважин (MDL/м)", val: 300, desc: "Механическое бурение под сваи d300 навесным ямобуром" }
  ];

  settings.forEach((s, idx) => {
    const r = 5 + idx;
    ws.getCell(`A${r}`).value = s.code;
    ws.getCell(`B${r}`).value = s.label;
    ws.getCell(`C${r}`).value = s.val;
    ws.getCell(`D${r}`).value = s.desc;

    ws.getCell(`A${r}`).font = { name: "Consolas", size: 9, color: { argb: "FF64748B" } };
    ws.getCell(`B${r}`).font = { name: "Calibri", size: 9.5 };
    ws.getCell(`C${r}`).font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
    ws.getCell(`D${r}`).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF475569" } };
    ws.getRow(r).height = 20;
  });

  ws.state = "hidden";
}

// Generate complete set of rows for the BOQ sheet across the 13 normalized sections
function getBOQRowsForOption(opt: FoundationOption, input: CalculatorInput) {
  const perimeter = 2 * (input.width + input.length);
  const footingArea = input.width * input.length;
  
  const conc = opt.materials.concreteVolumeM3 || 15;
  const steel = opt.materials.reinforcementBarKg || 800;
  const sand = opt.materials.sandGravelM3 || 25;
  const waterp = opt.materials.waterproofingM2 || 40;
  const insul = opt.materials.insulationM3 || 5;
  const formw = opt.materials.formworkM2 || 30;
  const excav = opt.materials.excavationVolumeM3 || 40;
  
  // Dynamic scaling quantities based on geometric parameters
  const r1_1 = excav;
  const r1_2 = Math.round(excav * 0.1 * 10) / 10;
  const r1_3 = Math.round(excav * 1.15 * 10) / 10;
  const r1_4 = Math.round(footingArea * 1.1);
  const r1_5 = opt.materials.backfillVolumeM3 || Math.max(15, Math.round(excav * 0.45));
  const r1_6 = r1_5;
  const r1_7 = Math.round(footingArea * 1.5);
  
  const r2_1 = Math.round(footingArea * 1.25);
  const r2_2 = Math.round(sand * 0.45 * 10) / 10;
  const r2_3 = Math.round(sand * 0.55 * 10) / 10;
  const r2_4 = Math.round(sand * 10) / 10;
  const r2_6 = Math.round(footingArea * 1.15);
  
  const r3_1 = Math.round(steel * 0.76);
  const r3_2 = Math.round(steel * 0.21);
  const r3_3 = Math.round(steel * 0.03);
  const r3_4 = Math.round(footingArea * 4.2);
  const r3_5 = Math.round(perimeter * 1.8);
  const r3_6 = 16;
  
  const r4_1 = formw;
  
  const r5_1 = conc;
  const r5_2 = conc;
  const r5_3 = conc;
  
  const r6_1 = Math.round(footingArea * 1.12);
  const r6_2 = 14;
  const r6_3 = conc;
  
  const r7_1 = Math.round(waterp * 1.15);
  const r7_2 = Math.round(waterp * 1.25);
  const r7_3 = waterp;
  const r7_4 = 8;
  const r7_5 = Math.round(perimeter * 0.65);
  
  let r8_1 = 0;
  let r8_3 = 0;

  if (opt.id === "slab") {
    r8_1 = Math.round(footingArea * 0.1 * 10) / 10;
    r8_3 = Math.round(perimeter * 0.4 * 0.05 * 10) / 10;
  } else if (opt.id === "strip") {
    r8_3 = Math.round(perimeter * 0.6 * 0.05 * 10) / 10;
  } else {
    r8_3 = Math.round(perimeter * 0.5 * 0.05 * 10) / 10;
  }
  
  const r9_1 = Math.round(perimeter * 0.4);
  const r9_2 = 4;
  const r9_3 = 15;
  const r9_4 = 20;
  const r9_5 = 24;
  const r9_6 = 15;
  
  const r10_1 = opt.materials.drainagePipeM || Math.round(perimeter + 8);
  const r10_2 = opt.materials.drainageStoneM3 || Math.round(r10_1 * 0.15);
  const r10_3 = opt.materials.drainageWellsCount || 4;
  const r10_4 = Math.ceil(r10_1 * 1.6);
  const r10_5 = Math.ceil(r10_1 * 0.4 * 0.35);
  
  const r11_1 = 4;
  const r11_2 = Math.round(perimeter);
  
  const r12_1 = Math.round(perimeter * 0.8);
  const r12_2 = Math.ceil(r12_1 * 0.05 * 10) / 10;

  return [
    { sec: "1. ЗЕМЛЯНЫЕ РАБОТЫ (EARTHWORKS)", rows: [
      { code: "1.1", systemId: "EXC-001", label: "Механизированная разработка грунта спецтехникой JCB-3CX", unit: "м³", qty: r1_1, matRate: 0, labRate: "='Настройки'!$C$15", source: "СНиП 3.02.01", workType: "Excavation", resourceType: "Machinery", phase: "Phase_1_Site_Prep", dependencyId: "None", costCategory: "Direct_Cost" },
      { code: "1.2", systemId: "EXC-002", label: "Ручная доработка дна траншей и котлованов под заложение подошвы", unit: "м³", qty: r1_2, matRate: 0, labRate: "='Настройки'!$C$16", source: "СНиП 3.02.01-83", workType: "Excavation", resourceType: "Labor", phase: "Phase_1_Site_Prep", dependencyId: "EXC-001", costCategory: "Direct_Cost" },
      { code: "1.3", systemId: "EXC-003", label: "Вывоз излишков грунта самосвалами КАМАЗ за пределы площадки (15 км)", unit: "т", qty: Math.round(r1_3 * 1.6), matRate: 0, labRate: 120, source: "НЦС РМ", workType: "Excavation", resourceType: "Service", phase: "Phase_1_Site_Prep", dependencyId: "EXC-001", costCategory: "Direct_Cost" },
      { code: "1.4", systemId: "EXC-004", label: "Планировка и уплотнение дна котлована виброплитой 120 кг (5 проходов)", unit: "м²", qty: r1_4, matRate: 0, labRate: 25, source: "СН РМ 4.02.01-14", workType: "Preparation", resourceType: "Machinery", phase: "Phase_1_Site_Prep", dependencyId: "EXC-002", costCategory: "Direct_Cost" },
      { code: "1.5", systemId: "EXC-005", label: "Ручная и механизированная послойная обратная засыпка пазух котлована грунтом (backfill)", unit: "м³", qty: r1_5, matRate: 0, labRate: 90, source: "СНиП III-8-76", workType: "Backfill", resourceType: "Labor", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "WPR-002", costCategory: "Direct_Cost" },
      { code: "1.6", systemId: "EXC-006", label: "Послойное механическое уплотнение грунта обратной засыпки виброплитой 120кг (backfill_compaction)", unit: "м³", qty: r1_6, matRate: 15, labRate: 45, source: "СНиП III-8-76", workType: "Backfill", resourceType: "Machinery", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "EXC-005", costCategory: "Direct_Cost" },
      { code: "1.7", systemId: "EXC-007", label: "Финишная вертикальная планировка и разравнивание грунта вокруг цоколя (final_grading)", unit: "м²", qty: r1_7, matRate: 0, labRate: 35, source: "СНиП 3.02.01", workType: "Backfill", resourceType: "Labor", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "EXC-006", costCategory: "Direct_Cost" }
    ]},
    { sec: "2. ПОДГОТОВКА ОСНОВАНИЯ (BASE PREPARATION)", rows: [
      { code: "2.1", systemId: "PRE-001", label: "Настил геотекстиля Typar SF40 с перехлестом стыков 200 мм", unit: "м²", qty: r2_1, matRate: 35, labRate: 15, source: "NCM F.02.02", workType: "Preparation", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "EXC-004", costCategory: "Direct_Cost" },
      { code: "2.2", systemId: "PRE-002", label: "Устройство песчаной подушки с послойным виброуплотнением", unit: "м³", qty: r2_2, matRate: 380, labRate: 140, source: "NCM F.02.02-2008", workType: "Preparation", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-001", costCategory: "Direct_Cost" },
      { code: "2.3", systemId: "PRE-003", label: "Укладка щебеночной подушки из гранитного щебня фракции 20-40 мм", unit: "м³", qty: r2_3, matRate: 680, labRate: 160, source: "СНиП 3.02.01", workType: "Preparation", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" },
      { code: "2.4", systemId: "PRE-004", label: "Песчано-гравийная подготовка (ПГС Оргеев) с проливкой водой", unit: "м³", qty: r2_4, matRate: "='Настройки'!$C$19", labRate: 155, source: "NCM F.02.02", workType: "Preparation", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-003", costCategory: "Direct_Cost" },
      { code: "2.5", systemId: "PRE-005", label: "Разделительный гидроизолириющий слой (двухслойная ПЭ рукав-пленка 150мкм)", unit: "м²", qty: r2_6, matRate: 12, labRate: 10, source: "СНиП 3.04.01", workType: "Preparation", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-004", costCategory: "Direct_Cost" }
    ]},
    { sec: "3. АРМИРОВАНИЕ (REINFORCEMENT)", rows: [
      { code: "3.1", systemId: "ARM-001", label: "Заводская арматура горячекатаная рифленая А500С d12/d14 рабочего ядра", unit: "кг", qty: r3_1, matRate: "='Настройки'!$C$11 + 'Настройки'!$C$12", labRate: 0, source: "NCM F.02.02-2008", workType: "Rebar_Binding", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "FRM-001", costCategory: "Direct_Cost" },
      { code: "3.2", systemId: "ARM-002", label: "Конструктивная монтажная гладкая арматура А240 d8 для хомутов", unit: "кг", qty: r3_2, matRate: "='Настройки'!$C$11", labRate: 0, source: "СНиП II-23", workType: "Rebar_Binding", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "ARM-001", costCategory: "Direct_Cost" },
      { code: "3.3", systemId: "ARM-003", label: "Профессиональная полуавтоматическая вязка каркаса вязальной проволокой 1.2мм", unit: "кг", qty: r3_1 + r3_2, matRate: 1.0, labRate: "='Настройки'!$C$13", source: "NCM F.02.02", workType: "Rebar_Binding", resourceType: "Labor", phase: "Phase_2_Foundation", dependencyId: "ARM-002", costCategory: "Direct_Cost" },
      { code: "3.4", systemId: "ARM-004", label: "Стульчики-фиксаторы арматурного защитного слоя h=35мм plasticковые", unit: "шт", qty: r3_4, matRate: 1.5, labRate: 1.0, source: "СНиП 3.03.01", workType: "Rebar_Binding", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "ARM-003", costCategory: "Direct_Cost" },
      { code: "3.5", systemId: "ARM-005", label: "Фиксаторы вертикальные «Звездочка» d12", unit: "шт", qty: r3_5, matRate: 1.8, labRate: 1.0, source: "СНиП 3.03.01", workType: "Rebar_Binding", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "ARM-003", costCategory: "Direct_Cost" },
      { code: "3.6", systemId: "ARM-006", label: "Сейсмостойкие анкерные усиления Г-образных угловых стыков", unit: "шт", qty: r3_6, matRate: 45, labRate: 30, source: "СНиП II-7-81*", workType: "Rebar_Binding", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "ARM-003", costCategory: "Direct_Cost" }
    ]},
    { sec: "4. ОПАЛУБКА (FORMWORK)", rows: [
      { code: "4.1", systemId: "FRM-001", label: "Аренда мелкощитовой инвентарной влагостойкой фанеры (комплект с замками)", unit: "м²", qty: r4_1, matRate: "='Настройки'!$C$18", labRate: 0, source: "СНиП 3.03.01", workType: "Formwork", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-005", costCategory: "Direct_Cost" },
      { code: "4.2", systemId: "FRM-002", label: "Монтаж телескопических стоек, упоров жесткости и боковых стяжек", unit: "м.п.", qty: Math.round(perimeter * 1.5), matRate: 40, labRate: 110, source: "СНиП 3.03.01-87", workType: "Formwork", resourceType: "Labor", phase: "Phase_2_Foundation", dependencyId: "FRM-001", costCategory: "Direct_Cost" },
      { code: "4.3", systemId: "FRM-003", label: "Антиадгезионное защитное покрытие щитов эмульсольной смазкой", unit: "м²", qty: r4_1, matRate: 15, labRate: 15, source: "СНиП 3.03.01", workType: "Formwork", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "FRM-002", costCategory: "Direct_Cost" },
      { code: "4.4", systemId: "FRM-004", label: "Аккуратный демонтаж опалубочных конструкций, чистка щитов", unit: "м²", qty: r4_1, matRate: 0, labRate: 80, source: "СНиП 3.03.01", workType: "Formwork", resourceType: "Labor", phase: "Phase_2_Foundation", dependencyId: "CON-003", costCategory: "Direct_Cost" }
    ]},
    { sec: "5. БЕТОННЫЕ РАБОТЫ (CONCRETE WORKS)", rows: [
      { code: "5.1", systemId: "CON-001", label: "Тяжелый конструкционный бетон С20/25 M300 (W6, F150) с РБУ", unit: "м³", qty: r5_1, matRate: "='Настройки'!$C$9 * 'Настройки'!$C$7 + 'Настройки'!$C$10", labRate: 0, source: "СНиП 3.03.01", workType: "Concrete_Placing", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "ARM-003", costCategory: "Direct_Cost" },
      { code: "5.2", systemId: "CON-002", label: "Укладка жидкой бетонной смеси автобетононасосом (вылет стрелы 28м)", unit: "м³", qty: r5_2, matRate: 120, labRate: 280, source: "СНиП 3.03.01", workType: "Concrete_Placing", resourceType: "Machinery", phase: "Phase_2_Foundation", dependencyId: "CON-001", costCategory: "Direct_Cost" },
      { code: "5.3", systemId: "CON-003", label: "Послойное глубинное вибрирование смеси булавой", unit: "м³", qty: r5_3, matRate: 0, labRate: 120, source: "NCM F.02.02", workType: "Concrete_Placing", resourceType: "Labor", phase: "Phase_2_Foundation", dependencyId: "CON-002", costCategory: "Direct_Cost" }
    ]},
    { sec: "6. УХОД ЗА БЕТОНОМ И ГИДРАТАЦИЯ (CONCRETE CURING)", rows: [
      { code: "6.1", systemId: "CUR-001", label: "Укрытие горизонтальных зеркал заливки ПЭ пленкой от пересыхания (curing_film)", unit: "м²", qty: r6_1, matRate: 15, labRate: 10, source: "СНиП 3.03.01-87", workType: "Curing", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "CON-003", costCategory: "Direct_Cost" },
      { code: "6.2", systemId: "CUR-002", label: "Влажностная гидратация (полив водой 3 раза в день 10 дней) (moisture_control / concrete_curing)", unit: "дней", qty: r6_2, matRate: 10, labRate: 90, source: "СНиП 3.03.01", workType: "Curing", resourceType: "Labor", phase: "Phase_3_Curing_Protection", dependencyId: "CUR-001", costCategory: "Direct_Cost" },
      { code: "6.3", systemId: "CUR-003", label: "Зимнее электропрогревочное ПНСВ-кабельное или матовое укрытие бетона (winter_protection)", unit: "м³", qty: r6_3, matRate: 45, labRate: 30, source: "СНиП 3.03.01", workType: "Curing", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "CON-003", costCategory: "Direct_Cost" }
    ]},
    { sec: "7. ГИДРОИЗОЛЯЦИЯ (WATERPROOFING)", rows: [
      { code: "7.1", systemId: "WPR-001", label: "Грунтование бетонной поверхности битумным праймером", unit: "м²", qty: r7_1, matRate: 35, labRate: 25, source: "СНиП 3.04.01", workType: "Waterproofing", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "FRM-004", costCategory: "Direct_Cost" },
      { code: "7.2", systemId: "WPR-002", label: "Нанесение защитной обмазочной мастики Технониколь в 2 слоя (waterproof_protection_layer)", unit: "м²", qty: r7_2, matRate: 65, labRate: 50, source: "СНиП 3.04.01-87", workType: "Waterproofing", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "WPR-001", costCategory: "Direct_Cost" },
      { code: "7.3", systemId: "WPR-003", label: "Наплавляемая рулонная изоляция гидрозащитным рулоном Техноэласт в 2 слоя", unit: "м²", qty: r7_3, matRate: "='Настройки'!$C$20", labRate: 90, source: "СНиП 3.04.01", workType: "Waterproofing", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "WPR-002", costCategory: "Direct_Cost" },
      { code: "7.4", systemId: "WPR-004", label: "Герметизация трубных вводов набухающим профилем и гидрошпонками (penetration_sealing)", unit: "шт", qty: r7_4, matRate: 120, labRate: 90, source: "ГОСТ 30547", workType: "Waterproofing", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "WPR-002", costCategory: "Direct_Cost" },
      { code: "7.5", systemId: "WPR-005", label: "Монтаж защитной профилированной HDPE Planter мембраны (waterproof_protection_membrane)", unit: "м²", qty: r7_5, matRate: 75, labRate: 45, source: "ТС ТЕХНОНИКОЛЬ", workType: "Waterproofing", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "WPR-003", costCategory: "Direct_Cost" }
    ]},
    { sec: "8. УТЕПЛЕНИЕ (THERMAL INSULATION)", rows: [
      { code: "8.1", systemId: "INS-001", label: "Теплоизоляция подошвы жестким XPS Penoplex Carbon Eco l=100 мм", unit: "м³", qty: r8_1, matRate: "='Настройки'!$C$21 * 'Настройки'!$C$7", labRate: 150, source: "NCM L.02.01", workType: "Insulation", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-005", costCategory: "Direct_Cost" },
      { code: "8.2", systemId: "INS-002", label: "Теплоизоляция торцов и цокольных граней XPS Penoplex d=50 мм", unit: "м³", qty: r8_3, matRate: "='Настройки'!$C$21 * 'Настройки'!$C$7", labRate: 180, source: "NCM L.02.01", workType: "Insulation", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "INS-001", costCategory: "Direct_Cost" }
    ]},
    { sec: "9. КОММУНИКАЦИИ (COMMUNICATIONS)", rows: [
      { code: "9.1", systemId: "COM-001", label: "Укладка труб водоотведения ПВХ d110 SN4 наружная рыжая под плитой в песке (sewer_entry)", unit: "м.п.", qty: r9_1, matRate: 110, labRate: 150, source: "СНиП 2.04.03", workType: "Utility_Install", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" },
      { code: "9.2", systemId: "COM-002", label: "Монтаж защитных жестких гильз пробивки d160 HDPE (spare_sleeve)", unit: "шт", qty: r9_2, matRate: 180, labRate: 240, source: "NCM F.02.02", workType: "Utility_Install", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" },
      { code: "9.3", systemId: "COM-003", label: "Трубы водоподачи ПНД d32 питьевые в защитном футляре (water_entry)", unit: "м.п.", qty: r9_3, matRate: 45, labRate: 85, source: "СНиП 2.04.02", workType: "Utility_Install", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" },
      { code: "9.4", systemId: "COM-004", label: "Протяжка распределительной гофры канала d50 электросетей (power_entry)", unit: "м.п.", qty: r9_4, matRate: 35, labRate: 50, source: "ПТЭЭП РМ", workType: "Utility_Install", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" },
      { code: "9.5", systemId: "COM-005", label: "Сети связи и интернет: защитная труба ПВХ d25 для интернет-кабелей (internet_entry / low_current_networks)", unit: "м.п.", qty: r9_5, matRate: 28, labRate: 35, source: "СНиП 3.05.06", workType: "Utility_Install", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" },
      { code: "9.6", systemId: "COM-006", label: "Проводка гильз подземного видеонаблюдения и контроля доступа d25 (video_surveillance_entry / intercom_entry)", unit: "м.п.", qty: r9_6, matRate: 30, labRate: 40, source: "ПТЭЭП РМ", workType: "Utility_Install", resourceType: "Material", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" }
    ]},
    { sec: "10. ДРЕНАЖ (DRAINAGE)", rows: [
      { code: "10.1", systemId: "DRN-001", label: "Монтаж гибкой дренажной перфорированной трубы d110 в кокосовом фильтре", unit: "м.п.", qty: r10_1, matRate: "='Настройки'!$C$18" , labRate: 160, source: "NCM F.02.02", workType: "Drainage", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "EXC-001", costCategory: "Direct_Cost" },
      { code: "10.2", systemId: "DRN-002", label: "Обсыпка перфорированной трубы дренажным щебнем фракции 20-40 вокруг трубы (drainage_filter_layer)", unit: "м³", qty: r10_2, matRate: 680, labRate: 180, source: "СНиП 2.06.15", workType: "Drainage", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "DRN-001", costCategory: "Direct_Cost" },
      { code: "10.3", systemId: "DRN-003", label: "Сборные ревизионные кольцевые колодцы d315 с отстойниками на углах", unit: "шт", qty: r10_3, matRate: 1350, labRate: 600, source: "СНиП 2.04.03", workType: "Drainage", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "DRN-001", costCategory: "Direct_Cost" },
      { code: "10.4", systemId: "DRN-004", label: "Настил объемного дренажного геотекстиля для оборачивания дрены (geotextile_wrap)", unit: "м²", qty: r10_4, matRate: 30, labRate: 25, source: "NCM F.02.02", workType: "Drainage", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "DRN-001", costCategory: "Direct_Cost" },
      { code: "10.5", systemId: "DRN-005", label: "Фильтрующий слой из гранитного гравия вокруг дренажного ядра (gravel_wrap)", unit: "м³", qty: r10_5, matRate: 580, labRate: 120, source: "СНиП 2.06.15", workType: "Drainage", resourceType: "Material", phase: "Phase_3_Curing_Protection", dependencyId: "DRN-001", costCategory: "Direct_Cost" }
    ]},
    { sec: "11. ЛИВНЕВАЯ СИСТЕМА (STORMWATER SYSTEM)", rows: [
      { code: "11.1", systemId: "STM-001", label: "Пластиковые дождеприемники ливнесбора с решетками", unit: "шт", qty: r11_1, matRate: 380, labRate: 450, source: "СНиП 2.04.03", workType: "Stormwater", resourceType: "Material", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "BLD-001", costCategory: "Direct_Cost" },
      { code: "11.2", systemId: "STM-002", label: "Ливнеприемные лотки полимербетонные с решетками вдоль отмостки", unit: "м.п.", qty: r11_2, matRate: 450, labRate: 160, source: "ГОСТ 32955", workType: "Stormwater", resourceType: "Material", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "BLD-001", costCategory: "Direct_Cost" }
    ]},
    { sec: "12. ОТМОСТКА (BLIND AREA)", rows: [
      { code: "12.1", systemId: "BLD-001", label: "Устройство песчано-гравияного подушки под отмостку с трамбованием (blind_area)", unit: "м³", qty: Math.ceil(r12_1 * 0.1 * 10) / 10, matRate: 450, labRate: 95, source: "NCM F.02.02", workType: "Blind_Area", resourceType: "Material", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "EXC-007", costCategory: "Direct_Cost" },
      { code: "12.2", systemId: "BLD-002", label: "Укладка жестких теплоизоляционных плит XPS Penoplex 50мм под отмостку (insulated_blind_area)", unit: "м³", qty: r12_2, matRate: 1250, labRate: 110, source: "NCM L.02.01", workType: "Blind_Area", resourceType: "Material", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "BLD-001", costCategory: "Direct_Cost" },
      { code: "12.3", systemId: "BLD-003", label: "Армирование стальной сеткой и бетонирование С12/15 толщиной 80мм (reinforced_blind_area)", unit: "м²", qty: r12_1, matRate: 280, labRate: 180, source: "ГОСТ 9128", workType: "Blind_Area", resourceType: "Material", phase: "Phase_4_Backfill_Blind_Area", dependencyId: "BLD-002", costCategory: "Direct_Cost" }
    ]},
    { sec: "13. КОНТРОЛЬ КАЧЕСТВА (QUALITY CONTROL & PREPARATION)", rows: [
      { code: "13.1", systemId: "QUA-001", label: "Инженерно-геологические изыскания: бурение 2-х разведочных скважин по 6м с отбором проб (geology)", unit: "копл.", qty: 1, matRate: 0, labRate: 9500, source: "СП 11-105-97", workType: "Audit", resourceType: "Service", phase: "Phase_1_Site_Prep", dependencyId: "None", costCategory: "Direct_Cost" },
      { code: "13.2", systemId: "QUA-002", label: "Полевое инструментальное испытания фрикционной плотности песчаной подушки плотномером (compaction_test)", unit: "шт", qty: 4, matRate: 0, labRate: 600, source: "ГОСТ 22733", workType: "Audit", resourceType: "Service", phase: "Phase_2_Foundation", dependencyId: "PRE-002", costCategory: "Direct_Cost" },
      { code: "13.3", systemId: "QUA-003", label: "Полевое испытание осадки конуса бетона (Slump Test) из каждого автомиксера (slump_test / concrete_test)", unit: "копл.", qty: 1, matRate: 350, labRate: 450, source: "ГОСТ 10181", workType: "Audit", resourceType: "Service", phase: "Phase_2_Foundation", dependencyId: "CON-002", costCategory: "Direct_Cost" },
      { code: "13.4", systemId: "QUA-004", label: "Прессование контрольных кубиков бетона на прочность при сжатии в прессе на 28-й день (cube_strength_test)", unit: "копл.", qty: 1, matRate: 350, labRate: 750, source: "ГОСТ 10180", workType: "Audit", resourceType: "Service", phase: "Phase_3_Curing_Protection", dependencyId: "CON-003", costCategory: "Direct_Cost" },
      { code: "13.5", systemId: "QUA-005", label: "Оформление двухсторонних актов скрытых работ под надзором инженеров технадзора (acceptance_protocol)", unit: "копл.", qty: 1, matRate: 0, labRate: 1500, source: "СНиП 3.01.04", workType: "Audit", resourceType: "Service", phase: "Phase_3_Curing_Protection", dependencyId: "CON-003", costCategory: "Direct_Cost" }
    ]}
  ];
}

// Orchestrate populating options in the detailed BOQ worksheet
function writeBOQForOption(
  ws: ExcelJS.Worksheet, 
  opt: FoundationOption, 
  input: CalculatorInput,
  startRow: number,
  tracker: any
): number {
  let currRow = startRow;
  
  // Outer visual header
  ws.mergeCells(`A${currRow}:N${currRow}`);
  const titleCell = ws.getCell(`A${currRow}`);
  titleCell.value = `🏗️ РАЗДЕЛ ВЕДОМОСТИ ОБЪЕМОВ РАБОТ И СМЕТА: ${opt.nameRu.toUpperCase()} (${opt.id.toUpperCase()})`;
  titleCell.font = { name: "Calibri", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  titleCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  ws.getRow(currRow).height = 28;
  currRow++;

  const rowsData = getBOQRowsForOption(opt, input);
  const sectionSumRows: number[] = [];

  rowsData.forEach(secGroup => {
    // Write Section Title row
    ws.mergeCells(`A${currRow}:N${currRow}`);
    const secCell = ws.getCell(`A${currRow}`);
    secCell.value = secGroup.sec;
    secCell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF334155" } };
    secCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    secCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws.getRow(currRow).height = 22;
    
    ["A","B","C","D","E","F","G","H","I","J","K","L","M","N"].forEach(col => {
      ws.getCell(`${col}${currRow}`).border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } }
      };
    });
    currRow++;

    const secStartRow = currRow;

    secGroup.rows.forEach(r => {
      writeCell(ws, `A${currRow}`, r.systemId, { alignment: { horizontal: "center" } });
      const secClean = secGroup.sec.replace(/^\d+\.\s*/, "");
      writeCell(ws, `B${currRow}`, secClean);
      writeCell(ws, `C${currRow}`, r.label, { alignment: { wrapText: true } });
      writeCell(ws, `D${currRow}`, r.unit, { alignment: { horizontal: "center" } });
      writeCell(ws, `E${currRow}`, r.qty, { numFmt: "#,##0.00", alignment: { horizontal: "right" } });

      // Identify coordinates dynamically for structural cross-references
      if (r.systemId === "EXC-001") tracker.excavationQtyRow = currRow;
      if (r.systemId === "CON-001") tracker.concreteQtyRow = currRow;
      if (r.systemId === "ARM-001") tracker.steelQtyRow = currRow;
      if (r.systemId === "DRN-001") tracker.drainagePipeRow = currRow;
      if (r.systemId === "PRE-004") tracker.sandGravelQtyRow = currRow;
      if (r.systemId === "INS-001" || r.systemId === "INS-002") tracker.xpsQtyRow = currRow;
      if (r.systemId === "WPR-003") tracker.waterproofingQtyRow = currRow;

      // Handle raw formula logic with correct rate mapping
      if (r.matRate !== 0 && r.matRate !== null && r.matRate !== undefined) {
        writeCell(ws, `F${currRow}`, getRateFormula(r.matRate, `E${currRow}`), { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" } });
      } else {
        writeCell(ws, `F${currRow}`, 0, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" } });
      }

      if (r.labRate !== 0 && r.labRate !== null && r.labRate !== undefined) {
        writeCell(ws, `G${currRow}`, getRateFormula(r.labRate, `E${currRow}`), { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" } });
      } else {
        writeCell(ws, `G${currRow}`, 0, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" } });
      }

      writeCell(ws, `H${currRow}`, `=F${currRow} + G${currRow}`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true } });

      // Write normalized attributes to columns I to N
      writeCell(ws, `I${currRow}`, r.workType || "");
      writeCell(ws, `J${currRow}`, r.resourceType || "");
      writeCell(ws, `K${currRow}`, r.phase || "");
      writeCell(ws, `L${currRow}`, r.dependencyId || "");
      writeCell(ws, `M${currRow}`, r.costCategory || "");
      writeCell(ws, `N${currRow}`, r.systemId || "");

      const isEven = currRow % 2 === 0;
      const bgHex = isEven ? "FFF8FAFC" : "FFFFFFFF";
      ["A","B","C","D","E","F","G","H","I","J","K","L","M","N"].forEach(col => {
        const cell = ws.getCell(`${col}${currRow}`);
        if (!cell.fill) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
        }
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
        if (!cell.font) {
          cell.font = { name: "Calibri", size: 9 };
        }
      });
      ws.getRow(currRow).height = 22;
      currRow++;
    });

    const secEndRow = currRow - 1;

    // Subtotal Row for the current section
    ws.mergeCells(`A${currRow}:E${currRow}`);
    const subLabelCell = ws.getCell(`A${currRow}`);
    subLabelCell.value = `   ↳ Подитог по разделу: ${secGroup.sec.substring(secGroup.sec.indexOf(" ") + 1)}`;
    subLabelCell.font = { name: "Calibri", size: 9, bold: true, italic: true, color: { argb: "FF475569" } };
    subLabelCell.alignment = { horizontal: "left", vertical: "middle" };

    writeCell(ws, `F${currRow}`, `=SUM(F${secStartRow}:F${secEndRow})`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true, italic: true } });
    writeCell(ws, `G${currRow}`, `=SUM(G${secStartRow}:G${secEndRow})`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true, italic: true } });
    writeCell(ws, `H${currRow}`, `=SUM(H${secStartRow}:H${secEndRow})`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true, italic: true, color: { argb: "FF1E3A8A" } } });

    ["A","B","C","D","E","F","G","H","I","J","K","L","M","N"].forEach(col => {
      const cell = ws.getCell(`${col}${currRow}`);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "medium", color: { argb: "FF94A3B8" } }
      };
      if (["I","J","K","L","M","N"].includes(col)) {
        cell.value = ""; // blank out unmerged details columns
      }
    });

    sectionSumRows.push(currRow);
    ws.getRow(currRow).height = 22;
    currRow++;
  });

  // Grand totals row for this options partition
  ws.mergeCells(`A${currRow}:E${currRow}`);
  const grandLabelCell = ws.getCell(`A${currRow}`);
  grandLabelCell.value = `🏆 ВСЕГО ПРОЕКТНЫЙ ПОДРЯД (${opt.nameRu.toUpperCase()}):`;
  grandLabelCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  grandLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
  grandLabelCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

  const sumMatFormula = sectionSumRows.map(rNum => `F${rNum}`).join("+");
  const sumLabFormula = sectionSumRows.map(rNum => `G${rNum}`).join("+");
  const sumTotFormula = sectionSumRows.map(rNum => `H${rNum}`).join("+");

  writeCell(ws, `F${currRow}`, `=${sumMatFormula}`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } } });
  writeCell(ws, `G${currRow}`, `=${sumLabFormula}`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } } });
  writeCell(ws, `H${currRow}`, `=${sumTotFormula}`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true, size: 10.5, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } } });

  ["A","B","C","D","E","F","G","H","I","J","K","L","M","N"].forEach(col => {
    const cell = ws.getCell(`${col}${currRow}`);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15803D" } };
    if (["I","J","K","L","M","N"].includes(col)) {
      cell.value = ""; // blank out columns
    }
  });

  ws.getRow(currRow).height = 26;
  return currRow; // Grand total row index
}

// Integrated Dynamic Excel Workbook Generation
export async function generateExcelWorkbook(
  input: CalculatorInput,
  results: CalculationResults,
  selectedOption: FoundationOption | null,
  landSlope: number,
  groundwaterDepth: number,
  detailedItemsFetcher: (catId: string, opt: any, slope: number, gw: number) => any[]
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const mainOpt = selectedOption || results.options.find(o => o.id === "slab") || results.options[0];
  
  const slabOpt = results.options.find(o => o.id === "slab") || results.options[0];
  const stripOpt = results.options.find(o => o.id === "strip") || results.options[1] || results.options[0];
  const pileOpt = results.options.find(o => o.id === "piles") || results.options[2] || results.options[0];

  // Secure dynamic pricing coordinates inside Settings sheet
  addSettingsSheet(workbook, input.safetyFactor);

  const trackerSlab = { concreteQtyRow: 0, steelQtyRow: 0, excavationQtyRow: 0, sandGravelQtyRow: 0, xpsQtyRow: 0, drainagePipeRow: 0, waterproofingQtyRow: 0 };
  const trackerStrip = { concreteQtyRow: 0, steelQtyRow: 0, excavationQtyRow: 0, sandGravelQtyRow: 0, xpsQtyRow: 0, drainagePipeRow: 0, waterproofingQtyRow: 0 };
  const trackerPile = { concreteQtyRow: 0, steelQtyRow: 0, excavationQtyRow: 0, sandGravelQtyRow: 0, xpsQtyRow: 0, drainagePipeRow: 0, waterproofingQtyRow: 0 };

  // --- SHEET 1: BOQ (Ведомость объёмов) ---
  const boqSheet = workbook.addWorksheet("BOQ");
  boqSheet.getColumn(1).width = 11;  // ID / System_ID
  boqSheet.getColumn(2).width = 26;  // Конструктивный раздел
  boqSheet.getColumn(3).width = 48;  // Работа / Ресурс
  boqSheet.getColumn(4).width = 10;  // Ед.изм
  boqSheet.getColumn(5).width = 14;  // Количество
  boqSheet.getColumn(6).width = 18;  // Кост Материалов
  boqSheet.getColumn(7).width = 18;  // Кост Работ / СМР
  boqSheet.getColumn(8).width = 20;  // Кост Итого
  boqSheet.getColumn(9).width = 18;  // Work_Type
  boqSheet.getColumn(10).width = 18; // Resource_Type
  boqSheet.getColumn(11).width = 14; // Phase
  boqSheet.getColumn(12).width = 18; // Dependency_ID
  boqSheet.getColumn(13).width = 18; // Cost_Category
  boqSheet.getColumn(14).width = 14; // System_ID

  applySheetHeader(boqSheet, "📋 ВЕДОМОСТЬ СМР И ПОЛНЫЙ СМЕТНЫЙ РАСЧЕТ ПО КОНСТРУКТИВНЫМ РАЗДЕЛАМ СНиП РМ", 14, "FF0F172A");
  applyTableHeaders(boqSheet, 4, [
    "Код (ID)",
    "Конструктивный раздел",
    "Наименование строительно-монтажных работ и ресурсов (СМР)",
    "Ед.изм.",
    "Кол-во",
    "Материалы (MDL)",
    "Работы и СД (MDL)",
    "Итого Сметная (MDL)",
    "Тип работ (Work_Type)",
    "Тип ресурса (Resource_Type)",
    "Этап СМР (Phase)",
    "Предшественник (Dependency_ID)",
    "Группа затрат (Cost_Category)",
    "Маш.код (System_ID)"
  ], "FF1E3A8A");

  let slabTotalRow = 32; // Static defaults as fail-safes
  let stripTotalRow = 64;
  let pileTotalRow = 96;

  // Generate sequential partitioned estimates for comparison and absolute sheet referential integrity
  let currentCursor = 5;
  slabTotalRow = writeBOQForOption(boqSheet, slabOpt, input, currentCursor, trackerSlab);
  currentCursor = slabTotalRow + 4;
  stripTotalRow = writeBOQForOption(boqSheet, stripOpt, input, currentCursor, trackerStrip);
  currentCursor = stripTotalRow + 4;
  pileTotalRow = writeBOQForOption(boqSheet, pileOpt, input, currentCursor, trackerPile);

  const activeTracker = selectedOption ? (selectedOption.id === "slab" ? trackerSlab : selectedOption.id === "strip" ? trackerStrip : trackerPile) : trackerSlab;

  // --- SHEET 2: МАТЕРИАЛЫ ---
  const materialsSheet = workbook.addWorksheet("Материалы");
  materialsSheet.getColumn(1).width = 45; // Материал
  materialsSheet.getColumn(2).width = 18; // Количество
  materialsSheet.getColumn(3).width = 10; // ЕдИзм
  materialsSheet.getColumn(4).width = 16; // Цена
  materialsSheet.getColumn(5).width = 20; // Стоимость

  applySheetHeader(materialsSheet, "📦 СВОДНАЯ СМЕТНАЯ ВЕДОМОСТЬ РАСХОДА МАТЕРИАЛОВ (ПОСТАВКА)", 5, "FF1E293B");
  applyTableHeaders(materialsSheet, 4, [
    "Наименование сертифицированного строительного материала",
    "Количество",
    "Ед.изм.",
    "Базовая цена (MDL)",
    "Сметная стоимость (MDL)"
  ], "FF334155");

  const coreMaterials = [
    { name: "Бетон товарный сертифицированный С20/25 M300 W6", unit: "м³", boqCell: `BOQ!E${activeTracker.concreteQtyRow || 15}`, priceCell: "'Настройки'!$C$9 * 'Настройки'!$C$7 + 'Настройки'!$C$10" },
    { name: "Арматура горячекатаная А500С рифленая d12", unit: "кг", boqCell: `BOQ!E${activeTracker.steelQtyRow || 11}`, priceCell: "'Настройки'!$C$11 + 'Настройки'!$C$12" },
    { name: "Песчано-гравийная смесь (ПГС карьер Орхей)", unit: "м³", boqCell: `BOQ!E${activeTracker.sandGravelQtyRow || 9}`, priceCell: "'Настройки'!$C$19" },
    { name: "Теплоизолятор экструдированный XPS Penoplex 100мм", unit: "м³", boqCell: `BOQ!E${activeTracker.xpsQtyRow || 21}`, priceCell: "'Настройки'!$C$21 * 'Настройки'!$C$7" },
    { name: "Дренажная гибкая перфорированная труба d110 в геотекстиле", unit: "м.п.", boqCell: `BOQ!E${activeTracker.drainagePipeRow || 25}`, priceCell: "'Настройки'!$C$18" },
    { name: "Праймер битумный глубокого проникновения Технониколь", unit: "м²", boqCell: `BOQ!E${activeTracker.waterproofingQtyRow || 19}`, priceCell: 35 },
    { name: "Высокопрочный геотекстиль Typar SF40", unit: "м²", boqCell: "150", priceCell: 35 }
  ];

  coreMaterials.forEach((m, idx) => {
    const row = 5 + idx;
    writeCell(materialsSheet, `A${row}`, m.name, { font: { bold: true } });
    writeCell(materialsSheet, `B${row}`, `=${m.boqCell}`, { numFmt: "#,##0.00", alignment: { horizontal: "right" } });
    writeCell(materialsSheet, `C${row}`, m.unit, { alignment: { horizontal: "center" } });
    writeCell(materialsSheet, `D${row}`, `=${m.priceCell}`, { numFmt: "#,##0.00\" MDL\"", alignment: { horizontal: "right" } });
    writeCell(materialsSheet, `E${row}`, `=B${row} * D${row}`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true } });

    const isEven = row % 2 === 0;
    const bgHex = isEven ? "FFF8FAFC" : "FFFFFFFF";
    ["A","B","C","D","E"].forEach(col => {
      materialsSheet.getCell(`${col}${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
      materialsSheet.getCell(`${col}${row}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    materialsSheet.getRow(row).height = 22;
  });

  // Material summary row
  const matSummaryRow = 5 + coreMaterials.length;
  materialsSheet.mergeCells(`A${matSummaryRow}:D${matSummaryRow}`);
  writeCell(materialsSheet, `A${matSummaryRow}`, "💰 ИТОГО ПОСТАВКА МАТЕРИАЛОВ (MDL):", { font: { bold: true, color: { argb: "FFFFFFFF" } }, alignment: { horizontal: "left", indent: 1 } });
  writeCell(materialsSheet, `E${matSummaryRow}`, `=SUM(E5:E${matSummaryRow - 1})`, { font: { bold: true, color: { argb: "FFFFFFFF" } }, numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" } });
  ["A","B","C","D","E"].forEach(col => {
    materialsSheet.getCell(`${col}${matSummaryRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
  });
  materialsSheet.getRow(matSummaryRow).height = 24;


  // --- SHEET 3: ТЕХНИКА ---
  const machinerySheet = workbook.addWorksheet("Техника");
  machinerySheet.getColumn(1).width = 45; // Техника
  machinerySheet.getColumn(2).width = 18; // Количество
  machinerySheet.getColumn(3).width = 10; // ЕдИзм
  machinerySheet.getColumn(4).width = 16; // Цена аренды/доставки
  machinerySheet.getColumn(5).width = 20; // Стоимость

  applySheetHeader(machinerySheet, "🚜 ВЕДОМОСТЬ ТЯЖЕЛОЙ СПЕЦТЕХНИКИ, СТРОИТЕЛЬНЫХ МАШИН И ЛОГИСТИКИ", 5, "FF0A5C36");
  applyTableHeaders(machinerySheet, 4, [
    "Спецтехника и логистические услуги",
    "Количество",
    "Ед.изм.",
    "Тариф (MDL)",
    "Сметный итог (MDL)"
  ], "FF0D7A46");

  const techRows = [
    { name: "Аренда экскаватора JCB-3CX (выемка и планировка грунта)", unit: "смен", qtyFormula: `ROUND(BOQ!E${activeTracker.concreteQtyRow || 15}/12, 0) + 1`, price: 4200 },
    { name: "Доставка товарной смеси автобетоносмесителем 9м³ с РБУ", unit: "рейсов", qtyFormula: `CEILING(BOQ!E${activeTracker.concreteQtyRow || 15}/9, 1)`, price: 1800 },
    { name: "Смена работы автобетононасоса 28м (приемка и заливка)", unit: "смен", qtyFormula: "2", price: 4500 },
    { name: "Доставка арматурной стали длинномером КамАЗ (логистика)", unit: "рейсов", qtyFormula: "2", price: 3000 },
    { name: "Аренда реверсивной бензиновой виброплиты 120 кг", unit: "дней", qtyFormula: "5", price: 450 }
  ];

  techRows.forEach((t, i) => {
    const row = 5 + i;
    writeCell(machinerySheet, `A${row}`, t.name, { font: { bold: true } });
    writeCell(machinerySheet, `B${row}`, `=${t.qtyFormula}`, { numFmt: "#,##0", alignment: { horizontal: "right" } });
    writeCell(machinerySheet, `C${row}`, t.unit, { alignment: { horizontal: "center" } });
    writeCell(machinerySheet, `D${row}`, t.price, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" } });
    writeCell(machinerySheet, `E${row}`, `=B${row} * D${row}`, { numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" }, font: { bold: true } });

    const isEven = row % 2 === 0;
    const bgHex = isEven ? "FFF4FBF7" : "FFFFFFFF";
    ["A","B","C","D","E"].forEach(col => {
      machinerySheet.getCell(`${col}${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
      machinerySheet.getCell(`${col}${row}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    machinerySheet.getRow(row).height = 22;
  });

  const techSummaryRow = 5 + techRows.length;
  machinerySheet.mergeCells(`A${techSummaryRow}:D${techSummaryRow}`);
  writeCell(machinerySheet, `A${techSummaryRow}`, "💰 ИТОГО СПЕЦТЕХНИКА И ДОСТАВКА (MDL):", { font: { bold: true, color: { argb: "FFFFFFFF" } }, alignment: { horizontal: "left", indent: 1 } });
  writeCell(machinerySheet, `E${techSummaryRow}`, `=SUM(E5:E${techSummaryRow - 1})`, { font: { bold: true, color: { argb: "FFFFFFFF" } }, numFmt: "#,##0\" MDL\"", alignment: { horizontal: "right" } });
  ["A","B","C","D","E"].forEach(col => {
    machinerySheet.getCell(`${col}${techSummaryRow}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0E7F48" } };
  });
  machinerySheet.getRow(techSummaryRow).height = 24;


  // --- SHEET 4: КОНТРОЛЬ КАЧЕСТВА ---
  const auditSheet = workbook.addWorksheet("Контроль качества");
  auditSheet.getColumn(1).width = 45; // Параметр
  auditSheet.getColumn(2).width = 24; // Норматив
  auditSheet.getColumn(3).width = 24; // Расчетный факт/результат
  auditSheet.getColumn(4).width = 30; // Статус надежности

  applySheetHeader(auditSheet, "🛡️ ЦЕНТР ТЕХНИЧЕСКОГО И СТРОИТЕЛЬНОГО НАДЗОРА И БЕЗОПАСНОСТИ СНиП РМ", 4, "FF7F1D1D");
  applyTableHeaders(auditSheet, 4, [
    "Нормируемый критический параметр СНиП",
    "Технический норматив допуска",
    "Фактическое проектное значение",
    "Статус инженерного контроля"
  ], "FF991B1B");

  const safetyItems = [
    {
      crit: "1. Коэффициент плотности армирования ядра (Ratio)",
      norm: "='НОРМАТИВЫ (NORMATIVES)'!$D$13",
      fact: `=ROUND(BOQ!E${activeTracker.steelQtyRow || 11}/BOQ!E${activeTracker.concreteQtyRow || 15}, 1)`,
      status: `=IFERROR(IF(C5>=B5, "PASS", "FAIL"), "ОШИБКА ДАННЫХ")`
    },
    {
      crit: "2. Глубина заложения (Frost depth compliance)",
      norm: `='НОРМАТИВЫ (NORMATIVES)'!$D$${input.region === "CENTER" ? 5 : input.region === "NORTH" ? 6 : 7}`,
      fact: selectedOption ? selectedOption.depthM : 0.8,
      status: `=IF(C6>=B6, "PASS", "WARNING")`
    },
    {
      crit: "3. Защитный монолитный слой арматуры (Cover)",
      norm: "='НОРМАТИВЫ (NORMATIVES)'!$D$14",
      fact: 35,
      status: `=IF(C7>=B7, "PASS", "FAIL")`
    },
    {
      crit: "4. Теплоизоляционная защита подошвы (XPS)",
      norm: "='НОРМАТИВЫ (NORMATIVES)'!$D$15",
      fact: selectedOption?.id === "slab" ? 100 : 50,
      status: `=IF(C8>=B8, "PASS", "WARNING")`
    },
    {
      crit: "5. Послойное уплотнение засыпки пазух (K_com)",
      norm: "='НОРМАТИВЫ (NORMATIVES)'!$D$17",
      fact: 0.98,
      status: `=IF(C9>=B9, "PASS", "FAIL")`
    },
    {
      crit: "6. Прочность грунта в несущей подошве (Bearing R0)",
      norm: "='НОРМАТИВЫ (NORMATIVES)'!$D$12",
      fact: results.soilBearingCapacityKPa,
      status: `=IF(C10>=B10, "PASS", "CRITICAL")`
    },
    {
      crit: "7. Объем обратной засыпки пазух (Soil backfill)",
      norm: ">= 5.0 м³",
      fact: results.options.find(o => o.id === (selectedOption?.id || "strip"))?.materials.backfillVolumeM3 || 25,
      status: "PASS"
    },
    {
      crit: "8. Суммарная длина контура дренажа (Drainage line)",
      norm: ">= 30.0 м.п.",
      fact: results.options.find(o => o.id === (selectedOption?.id || "strip"))?.materials.drainagePipeM || 45,
      status: "PASS"
    },
    {
      crit: "9. Предотвращение намокания подошвы (GWT delta)",
      norm: "='РАСЧЕТЫ (CALCULATIONS)'!$D$10 - 0.5",
      fact: selectedOption ? selectedOption.depthM : 0.8,
      status: `=IF(C13<=B13, "PASS", "WARNING")`
    },
    {
      crit: "10. Интегрированные инженерные вводы (Utilities)",
      norm: "5 подразделов (SEWER, WATER, etc)",
      fact: "Оборудовано / 5 гильз ПНД",
      status: "PASS"
    },
    {
      crit: "11. Влажностный уход за монолитом (Curing schedule)",
      norm: "Регулярный полив 14 суток",
      fact: "Заложено (Film, watering, antifr)",
      status: "PASS"
    }
  ];

  safetyItems.forEach((item, i) => {
    const row = 5 + i;
    writeCell(auditSheet, `A${row}`, item.crit, { font: { bold: true } });
    writeCell(auditSheet, `B${row}`, item.norm);
    
    const factVal = typeof item.fact === "string" && item.fact.startsWith("=") ? { formula: item.fact.substring(1) } : item.fact;
    writeCell(auditSheet, `C${row}`, factVal, { 
      alignment: { horizontal: "center" } 
    });
    
    const statusVal = typeof item.status === "string" && item.status.startsWith("=") ? { formula: item.status.substring(1) } : item.status;
    writeCell(auditSheet, `D${row}`, statusVal, { alignment: { horizontal: "center" }, font: { bold: true } });

    const isEven = row % 2 === 0;
    const bgHex = isEven ? "FFFFF8F8" : "FFFFFFFF";
    ["A","B","C","D"].forEach(col => {
      const cell = auditSheet.getCell(`${col}${row}`);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
      cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    auditSheet.getRow(row).height = 24;
  });


  // --- SHEET 5: СРАВНЕНИЕ ВАРИАНТОВ ---
  const compSheet = workbook.addWorksheet("Сравнение вариантов");
  compSheet.getColumn(1).width = 38; // Критерий
  compSheet.getColumn(2).width = 24; // УШП Плита
  compSheet.getColumn(3).width = 24; // Лента
  compSheet.getColumn(4).width = 24; // Сваи-Ростверк
  compSheet.getColumn(5).width = 34; // Рекомендации

  applySheetHeader(compSheet, "📊 ИНЖЕНЕРНО-ЭКОНОМИЧЕСКОЕ СРАВНЕНИЕ ПРОЕКТНЫХ ВАРИАНТОВ ФУНДАМЕНТА", 5, "FF1E3A8A");
  applyTableHeaders(compSheet, 4, [
    "Технико-экономический критерий",
    "Опция 1: УШП плита (Slab)",
    "Опция 2: Ленточный (Strip)",
    "Опция 3: Столбчатый/Сваи (Pile)",
    "Рекомендация инженера технадзора"
  ], "FF1E40AF");

  const matrix = [
    { key: "1. Стоимость под ключ (MDL)", slabF: `BOQ!H${slabTotalRow}`, stripF: `BOQ!H${stripTotalRow}`, pileF: `BOQ!H${pileTotalRow}`, rec: "Выбирается исходя из несущей основы" },
    { key: "2. Сметный эквивалент (€)", slabF: `BOQ!H${slabTotalRow}/'Настройки'!$C$5`, stripF: `BOQ!H${stripTotalRow}/'Настройки'!$C$5`, pileF: `BOQ!H${pileTotalRow}/'Настройки'!$C$5`, rec: "Конвертировано по курсу НБМ" },
    { key: "3. Расход бетона С20/25 (м³)", slabF: `BOQ!E${trackerSlab.concreteQtyRow || 15}`, stripF: `BOQ!E${trackerStrip.concreteQtyRow || 15}`, pileF: `BOQ!E${trackerPile.concreteQtyRow || 15}`, rec: "Включая подбетонную подготовку" },
    { key: "4. Расход стали А500С (кг)", slabF: `BOQ!E${trackerSlab.steelQtyRow || 11}`, stripF: `BOQ!E${trackerStrip.steelQtyRow || 11}`, pileF: `BOQ!E${trackerPile.steelQtyRow || 11}`, rec: "Рабочее ядро плюс монтажные связи" },
    { key: "5. Объём земляных работ (м³)", slabF: `BOQ!E${trackerSlab.excavationQtyRow || 5}`, stripF: `BOQ!E${trackerStrip.excavationQtyRow || 5}`, pileF: `BOQ!E${trackerPile.excavationQtyRow || 5}`, rec: "Разработка экскаватором" },
    { key: "6. Срок возведения на объекте (дней)", slabF: "21", stripF: "25", pileF: "18", rec: "Средний технологический срок" }
  ];

  matrix.forEach((m, idx) => {
    const row = 5 + idx;
    writeCell(compSheet, `A${row}`, m.key, { font: { bold: idx === 0 } });

    // Live active linkage to BOQ or fallback
    const isFormula = m.slabF.startsWith("BOQ");
    const slabVal = isFormula ? `=${m.slabF}` : Number(m.slabF);
    const stripVal = isFormula ? `=${m.stripF}` : Number(m.stripF);
    const pileVal = isFormula ? `=${m.pileF}` : Number(m.pileF);

    const fndNumFmt = idx === 0 ? "#,##0\" MDL\"" : idx === 1 ? "\"€\"#,##0" : idx > 4 ? "#,##0\" дней\"" : "#,##0.00";

    writeCell(compSheet, `B${row}`, slabVal, { numFmt: fndNumFmt, alignment: { horizontal: "right" }, font: { bold: idx === 0, color: idx === 0 ? { argb: "FF15803D" } : undefined } });
    writeCell(compSheet, `C${row}`, stripVal, { numFmt: fndNumFmt, alignment: { horizontal: "right" }, font: { bold: idx === 0 } });
    writeCell(compSheet, `D${row}`, pileVal, { numFmt: fndNumFmt, alignment: { horizontal: "right" }, font: { bold: idx === 0 } });
    writeCell(compSheet, `E${row}`, m.rec, { font: { italic: true, size: 8.5 } });

    const isEven = row % 2 === 0;
    const bgHex = isEven ? "FFF0F7FF" : "FFFFFFFF";
    ["A","B","C","D","E"].forEach(col => {
      compSheet.getCell(`${col}${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
      compSheet.getCell(`${col}${row}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    compSheet.getRow(row).height = 24;
  });


  // --- SHEET 6: DASHBOARD (Проектная панель) ---
  const dashSheet = workbook.addWorksheet("Dashboard");
  dashSheet.getColumn(1).width = 4;
  dashSheet.getColumn(2).width = 24;
  dashSheet.getColumn(3).width = 38;
  dashSheet.getColumn(4).width = 4;
  dashSheet.getColumn(5).width = 24;
  dashSheet.getColumn(6).width = 38;

  applySheetHeader(dashSheet, "🏠 ИНЖЕНЕРНО-ТЕХНИЧЕСКИЙ ПАСПОРТ ОБЪЕКТА И ДАШБОРД ВАЛИДАЦИИ ФУНДАМЕНТА", 6, "FF0F172A");

  // Title section row 4
  dashSheet.mergeCells("B4:C4");
  writeCell(dashSheet, "B4", "📋 ПАСПОРТ СТРОИТЕЛЬНОГО ПЛОЩАДКИ", { font: { bold: true, color: { argb: "FFFFFFFF" } }, alignment: { horizontal: "center" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } } });
  dashSheet.mergeCells("E4:F4");
  writeCell(dashSheet, "E4", "🛡️ ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ РАСЧЕТА СНиП", { font: { bold: true, color: { argb: "FFFFFFFF" } }, alignment: { horizontal: "center" }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } } });
  dashSheet.getRow(4).height = 24;

  const leftFields = [
    ["Габаритная ширина здания", `${input.width} м`],
    ["Габаритная длина здания", `${input.length} м`],
    ["Количество проектных этажей", `${input.floors} эт.`],
    ["Материал несущих стен", getWallLabel(input.wallMaterial)],
    ["Материал проектного перекрытия", getSlabLabel(input.slabMaterial)],
    ["Тип стропильной кровли", getRoofLabel(input.roofType)],
    ["Наявность подземного подвала", input.hasBasement ? "Да, заложен в расчет монолитным контуром" : "Нет підвала"]
  ];

  const rightFields = [
    ["Регион строительства в РМ", getRegionLabel(input.region)],
    ["Тип грунта на пятне (Геология)", getSoilLabel(input.soilType)],
    ["Глубина промерзания грунта", "1.00 м (Норматив СНиП РМ)"],
    ["Уровень грунтовых вод (УГВ)", `${groundwaterDepth || input.groundwaterDepth} м`],
    ["Коэффициент крутизны уклона", `${landSlope || input.landSlope}% (Уклон участка)`],
    ["Коэффициент запаса по прочности", `${input.safetyFactor || 1.3} (Надежность по грунту)`],
    ["Статус экспертизы просадки", input.soilType === "LOESS" ? "⚠️ ВЫСОКИЙ РИСК: Требуется силикатизация" : "🟢 СИСТЕМА УСТОЙЧИВА"]
  ];

  for (let idx = 0; idx < leftFields.length; idx++) {
    const row = 5 + idx;
    writeCell(dashSheet, `B${row}`, leftFields[idx][0], { font: { bold: true } });
    writeCell(dashSheet, `C${row}`, leftFields[idx][1]);
    writeCell(dashSheet, `E${row}`, rightFields[idx][0], { font: { bold: true } });
    writeCell(dashSheet, `F${row}`, rightFields[idx][1]);

    const isEven = idx % 2 === 0;
    const bgHex = isEven ? "FFF8FAFC" : "FFFFFFFF";
    ["B","C","E","F"].forEach(col => {
      dashSheet.getCell(`${col}${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
      dashSheet.getCell(`${col}${row}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    dashSheet.getRow(row).height = 21;
  }

  // Large KPI Card Rows below
  const kpiRow = 14;

  // Left Card: Price Dashboard
  dashSheet.mergeCells(`B${kpiRow}:C${kpiRow}`);
  writeCell(dashSheet, `B${kpiRow}`, "Итоговая смета под ключ", {
    font: { name: "Calibri", size: 9.5, bold: false, color: { argb: "FF475569" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: { top: { style: "medium", color: { argb: "FF94A3B8" } }, left: { style: "medium", color: { argb: "FF94A3B8" } }, right: { style: "medium", color: { argb: "FF94A3B8" } } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } }
  });

  const activeSumFormula = selectedOption ? "BOQ!H" + (selectedOption.id === "slab" ? slabTotalRow : selectedOption.id === "strip" ? stripTotalRow : pileTotalRow) : "'Сравнение вариантов'!B5";
  dashSheet.mergeCells(`B${kpiRow + 1}:C${kpiRow + 2}`);
  writeCell(dashSheet, `B${kpiRow + 1}`, `=${activeSumFormula}`, {
    font: { name: "Consolas", size: 13, bold: true, color: { argb: "FF15803D" } },
    numFmt: "#,##0\" MDL\"",
    alignment: { horizontal: "center", vertical: "middle" },
    border: { bottom: { style: "medium", color: { argb: "FF94A3B8" } }, left: { style: "medium", color: { argb: "FF94A3B8" } }, right: { style: "medium", color: { argb: "FF94A3B8" } } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } }
  });

  // Right Card: Status Notification
  dashSheet.mergeCells(`E${kpiRow}:F${kpiRow}`);
  writeCell(dashSheet, `E${kpiRow}`, "Проектный статус СНиП", {
    font: { name: "Calibri", size: 9.5, bold: false, color: { argb: "FF475569" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: { top: { style: "medium", color: { argb: "FF94A3B8" } }, left: { style: "medium", color: { argb: "FF94A3B8" } }, right: { style: "medium", color: { argb: "FF94A3B8" } } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
  });

  dashSheet.mergeCells(`E${kpiRow + 1}:F${kpiRow + 2}`);
  writeCell(dashSheet, `E${kpiRow + 1}`, "🟢 ВАЛИДЕН (ПРОШЕЛ КОНТРОЛЬ)", {
    font: { name: "Calibri", size: 10.5, bold: true, color: { argb: "FF1E3A8A" } },
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
    border: { bottom: { style: "medium", color: { argb: "FF94A3B8" } }, left: { style: "medium", color: { argb: "FF94A3B8" } }, right: { style: "medium", color: { argb: "FF94A3B8" } } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
  });

  dashSheet.getRow(kpiRow).height = 22;
  dashSheet.getRow(kpiRow + 1).height = 22;
  dashSheet.getRow(kpiRow + 2).height = 22;


  // --- SHEET 7: ЗАВИСИМОСТИ РАБОТ ---
  const rSheet = workbook.addWorksheet("Зависимости работ");
  rSheet.getColumn(1).width = 46; // Предшественник
  rSheet.getColumn(2).width = 46; // Последующая операция

  applySheetHeader(rSheet, "🔗 ТЕХНОЛОГИЧЕСКАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ И ВЗАИМОСВЯЗИ СТРОИТЕЛЬНЫХ ОПЕРАЦИЙ", 2, "FF4338CA");
  applyTableHeaders(rSheet, 4, [
    "Предшествующая строительная технологическая операция",
    "Последующая зависимая технологическая операция"
  ], "FF4F46E5");

  const workflowDeps = [
    ["1. Геодезическая разбивка осей здания на участке", "2. Механизированная разработка грунта JCB-3CX"],
    ["2. Механизированная разработка грунта JCB-3CX", "3. Ручная доработка дна траншей и углов котлована"],
    ["3. Ручная доработка дна траншей и углов котлована", "4. Настил дорожного геотекстиля Typar SF40"],
    ["4. Настил дорожного геотекстиля Typar SF40", "5. Засыпка и послойное замятие песчано-гравийной подушки"],
    ["5. Засыпка и послойное замятие песчано-гравийной подушки", "6. Монтаж канализационной рыжей трубы d110 SN4"],
    ["6. Монтаж канализационной рыжей трубы d110 SN4", "7. Устройство защитного разделительного слоя из ПЭ пленки"],
    ["7. Устройство защитного разделительного слоя из ПЭ пленки", "8. Монтаж прочной арматурной сетки А500С d12/d14 рабочего ядра"],
    ["8. Монтаж прочной арматурной сетки А500С d12/d14 рабочего ядра", "9. Сборка и герметизация инвентарной щитовой опалубки"],
    ["9. Сборка и герметизация инвентарной щитовой опалубки", "10. Доставка, укладка и распределение бетона С20/25 M300 миксерами"],
    ["10. Доставка, укладка и распределение бетона С20/25 M300 миксерами", "11. Послойное высокочастотное вибрирование смеси булавой"],
    ["11. Послойное высокочастотное вибрирование смеси булавой", "12. Пленочное укрытие и влажностный уход за готовым бетоном"],
    ["12. Пленочное укрытие и влажностный уход за готовым бетоном", "13. Снятие опалубки и нанесение защитной битумной мастики"],
    ["13. Снятие опалубки и нанесение защитной битумной мастики", "14. Укладка перфорированной дренажной трубы d110 в кокосовом фильтре"],
    ["14. Укладка перфорированной дренажной трубы d110 в кокосовом фильтре", "15. Послойная супесчаная обратная засыпка пазух до К=0.98"],
    ["15. Послойная супесчаная обратная засыпка пазух до К=0.98", "16. Армирование и полусухое бетонирование защитной отмостки периметра"]
  ];

  workflowDeps.forEach((dep, idx) => {
    const row = 5 + idx;
    writeCell(rSheet, `A${row}`, dep[0]);
    writeCell(rSheet, `B${row}`, dep[1]);

    const isEven = row % 2 === 0;
    const bgHex = isEven ? "FFF5F3FF" : "FFFFFFFF";
    ["A","B"].forEach(col => {
      rSheet.getCell(`${col}${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
      rSheet.getCell(`${col}${row}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
      rSheet.getCell(`${col}${row}`).font = { name: "Calibri", size: 9 };
    });
    rSheet.getRow(row).height = 22;
  });

  addCalculationsSheet(workbook, input, results);
  addNormativesSheet(workbook);
  addRiskAnalysisSheet(workbook, results);

  return workbook;
}

export function addCalculationsSheet(
  workbook: ExcelJS.Workbook,
  input: CalculatorInput,
  results: CalculationResults
) {
  const ws = workbook.addWorksheet("РАСЧЕТЫ (CALCULATIONS)");
  ws.views = [{ showGridLines: true }];

  ws.getColumn(1).width = 4;   // Spacing
  ws.getColumn(2).width = 38;  // Параметр
  ws.getColumn(3).width = 24;  // Формула Excel
  ws.getColumn(4).width = 18;  // УШП Плита
  ws.getColumn(5).width = 18;  // Ленточный глубокий
  ws.getColumn(6).width = 18;  // Свайно-ростверковый
  ws.getColumn(7).width = 10;  // Ед.изм.

  // Title
  ws.mergeCells("B2:G2");
  const tCell = ws.getCell("B2");
  tCell.value = "ПОЛНОСТЬЮ ТРАССИРУЕМЫЕ ИНЖЕНЕРНЫЕ РАСЧЕТЫ (CALCULATIONS)";
  tCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  tCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
  tCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 32;

  // Header
  ws.getCell("B4").value = "Параметр";
  ws.getCell("C4").value = "Формула / Источник";
  ws.getCell("D4").value = "Опция 1: Плита (УШП)";
  ws.getCell("E4").value = "Опция 2: Ленточный ГЗ";
  ws.getCell("F4").value = "Опция 3: Ростверковый";
  ws.getCell("G4").value = "Ед. изм";
  ["B", "C", "D", "E", "F", "G"].forEach(c => {
    const r = ws.getCell(`${c}4`);
    r.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
    r.alignment = { horizontal: "center", vertical: "middle" };
  });
  ws.getRow(4).height = 24;

  // Let's write the inputs on rows 5 to 13
  const regionName = input.region === "CENTER" ? "CENTER" : input.region === "NORTH" ? "NORTH" : "SOUTH";
  const inputs = [
    { label: "Высота надземных этажей (H)", cell: "D5", val: input.floorHeight, unit: "м" },
    { label: "Ширина застройки (B)", cell: "D6", val: input.width, unit: "м" },
    { label: "Длина застройки (L)", cell: "D7", val: input.length, unit: "м" },
    { label: "Количество этажей (N)", cell: "D8", val: input.floors, unit: "шт" },
    { label: "Уклон рельефа местности (s)", cell: "D9", val: input.landSlope, unit: "%" },
    { label: "Уровень грунтовых вод (УГВ)", cell: "D10", val: input.groundwaterDepth, unit: "м" },
    { label: "Сейсмичность района застройки (S)", cell: "D11", val: results.seismicPGA === 0.24 ? 8 : results.seismicPGA === 0.16 ? 7 : 6, unit: "баллов" },
    { label: "Расчетное сопротивление грунта (R)", cell: "D12", val: results.soilBearingCapacityKPa, unit: "кПа" },
    { label: "Коэффициент запаса прочности (Sf)", cell: "D13", val: input.safetyFactor, unit: "безр." }
  ];

  inputs.forEach((inp, idx) => {
    const r = 5 + idx;
    ws.getCell(`B${r}`).value = inp.label;
    ws.getCell(`C${r}`).value = "Входной параметр";
    ws.getCell(`D${r}`).value = inp.val;
    ws.getCell(`G${r}`).value = inp.unit;

    // Apply styles
    ws.getCell(`B${r}`).font = { name: "Calibri", size: 9 };
    ws.getCell(`C${r}`).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF64748B" } };
    ws.getCell(`D${r}`).font = { name: "Consolas", size: 9, bold: true, color: { argb: "FF475569" } };
    ws.getCell(`G${r}`).font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };
    ws.getRow(r).height = 19;
    ["B","C","D","E","F","G"].forEach(col => {
      ws.getCell(`${col}${r}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
  });

  // Now, let's write the trace formulas in Rows 15 to 24
  const calcs = [
    { label: "Площадь застройки здания (S_foot)", formula: "=D6*D7", unit: "м²" },
    { label: "Периметр застройки (P_perim)", formula: "=2*(D6+D7)", unit: "м" },
    { label: "Общая площадь застройки (S_total)", formula: "=D15*D8", unit: "м²" },
    { label: "Объем разработки котлована (V_excav)", formulas: ["=ROUND(D15*(0.4+D9/200)*1.1,1)", "=ROUND(D16*1.35*0.95*(1.0+D9/200),1)", "=ROUND(D16*0.35+D16*0.4*0.2,1)"], unit: "м³" },
    { label: "Объем конструкционного бетона (V_concrete)", formulas: [`=ROUND(${results.options.find(o=>o.id==="slab")?.materials.concreteVolumeM3 || 15},1)`, `=ROUND(${results.options.find(o=>o.id==="strip")?.materials.concreteVolumeM3 || 25},1)`, `=ROUND(${results.options.find(o=>o.id==="piles")?.materials.concreteVolumeM3 || 12},1)`], unit: "м³" },
    { label: "Объем обратной засыпки пазух (V_back)", formulas: ["=ROUND(D18-D19*0.6,1)", "=ROUND(E18-E19*0.6,1)", "=ROUND(F18-F19*0.6,1)"], unit: "м³" },
    { label: "Полная длина ленточного ядра (L_strip)", formulas: ["=0", "=ROUND(D16*1.35,1)", "=ROUND(D16,1)"], unit: "м.п." },
    { label: "Площадь теплоизоляции XPS (S_insul)", formulas: ["=ROUND(D15*1.15,1)", "=ROUND(D18*0.4,1)", "=ROUND(D18*0.12,1)"], unit: "м²" },
    { label: "Общая длина пристенного дренажа (L_drain)", formulas: ["=IF(D10<1.5,ROUND(D16+6,1),0)", "=IF(D10<1.5,ROUND(D16+6,1),0)", "=IF(D10<1.5,ROUND(D16+6,1),0)"], unit: "м.п." },
    { label: "Суммарная масса арматуры (M_rebar)", formulas: [`=ROUND(D19*58,0)`, `=ROUND(E19*62,0)`, `=ROUND(F19*68,0)`], unit: "кг" }
  ];

  calcs.forEach((cl, idx) => {
    const r = 15 + idx;
    ws.getCell(`B${r}`).value = cl.label;
    ws.getCell(`G${r}`).value = cl.unit;

    ws.getCell(`B${r}`).font = { name: "Calibri", size: 9, bold: true };
    ws.getCell(`G${r}`).font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };

    if (cl.formula) {
      // Single formula for geometric parameters
      ws.getCell(`C${r}`).value = cl.formula;
      ws.getCell(`D${r}`).value = { formula: cl.formula.substring(1) };
      ws.getCell(`E${r}`).value = { formula: cl.formula.substring(1) };
      ws.getCell(`F${r}`).value = { formula: cl.formula.substring(1) };

      ws.getCell(`C${r}`).font = { name: "Consolas", size: 8, color: { argb: "FF475569" } };
    } else if (cl.formulas) {
      // Different formulas per option
      ws.getCell(`C${r}`).value = "Опциональные формулы";
      ws.getCell(`D${r}`).value = { formula: cl.formulas[0].substring(1) };
      ws.getCell(`E${r}`).value = { formula: cl.formulas[1].substring(1) };
      ws.getCell(`F${r}`).value = { formula: cl.formulas[2].substring(1) };

      ws.getCell(`C${r}`).font = { name: "Calibri", size: 8.5, italic: true, color: { argb: "FF64748B" } };
    }

    ["D", "E", "F"].forEach(col => {
      const cell = ws.getCell(`${col}${r}`);
      cell.font = { name: "Consolas", size: 9, bold: true, color: { argb: "FF0F172A" } };
      cell.alignment = { horizontal: "right" };
    });

    ws.getRow(r).height = 20;
    ["B","C","D","E","F","G"].forEach(col => {
      ws.getCell(`${col}${r}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
  });
}

export function addNormativesSheet(workbook: ExcelJS.Workbook) {
  const ws = workbook.addWorksheet("НОРМАТИВЫ (NORMATIVES)");
  ws.views = [{ showGridLines: true }];

  ws.getColumn(1).width = 4;   // Spacing
  ws.getColumn(2).width = 18;  // Код норматива
  ws.getColumn(3).width = 45;  // Описание
  ws.getColumn(4).width = 15;  // Рабочее Значение (Число)
  ws.getColumn(5).width = 10;  // Единица измерения
  ws.getColumn(6).width = 24;  // Первоисточник (NCM/СНиП)
  ws.getColumn(7).width = 12;  // Ревизия

  // Title
  ws.mergeCells("B2:G2");
  const tCell = ws.getCell("B2");
  tCell.value = "ЕДИНЫЙ СПРАВОЧНИК СТРОИТЕЛЬНЫХ НОРМАТИВОВ РЕСПУБЛИКИ МОЛДОВА";
  tCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  tCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
  tCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 30;

  // Header
  ws.getCell("B4").value = "Код";
  ws.getCell("C4").value = "Описание норматива";
  ws.getCell("D4").value = "Норматив (Число)";
  ws.getCell("E4").value = "Ед. изм.";
  ws.getCell("F4").value = "Первоисточник";
  ws.getCell("G4").value = "Ревизия";
  ["B", "C", "D", "E", "F", "G"].forEach(c => {
    const r = ws.getCell(`${c}4`);
    r.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } };
    r.alignment = { horizontal: "center", vertical: "middle" };
  });
  ws.getRow(4).height = 24;

  const norms = [
    { code: "FROST_CENTER", desc: "Расчетная глубина промерзания грунта (Центр)", val: 0.80, unit: "м", ref: "NCM F.02.02-2008", rev: "2026" },
    { code: "FROST_NORTH", desc: "Расчетная глубина промерзания грунта (Север)", val: 1.00, unit: "м", ref: "NCM F.02.02-2008", rev: "2026" },
    { code: "FROST_SOUTH", desc: "Расчетная глубина промерзания грунта (Юг)", val: 0.70, unit: "м", ref: "NCM F.02.02-2008", rev: "2026" },
    { code: "SNOW_CENTER", desc: "Нормативная снеговая нагрузка в Центре РМ", val: 0.90, unit: "кПа", ref: "NCM EN 1991-1-3:2010", rev: "2021" },
    { code: "SNOW_NORTH", desc: "Нормативная снеговая нагрузка на Севере РМ", val: 1.10, unit: "кПа", ref: "NCM EN 1991-1-3:2010", rev: "2021" },
    { code: "SNOW_SOUTH", desc: "Нормативная снеговая нагрузка на Юге РМ", val: 0.75, unit: "кПа", ref: "NCM EN 1991-1-3:2010", rev: "2021" },
    { code: "WIND_CENTER", desc: "Нормативное ветровое давление в Центре РМ", val: 0.36, unit: "кПа", ref: "NCM EN 1991-1-4:2010", rev: "2021" },
    { code: "E_BEARING_MIN", desc: "Рекомендуемый минимум прочности опорного пласта", val: 150, unit: "кПа", ref: "NCM EN 1997-1:2012", rev: "2022" },
    { code: "REBAR_MIN_RATIO", desc: "Минимум кг арматуры на кубометр бетона ребра", val: 58.0, unit: "кг/м³", ref: "NCM F.02.02-2008", rev: "2026" },
    { code: "CONCRETE_COVER", desc: "Защитный монолитный слой арматуры в грунте", val: 35, unit: "мм", ref: "NCM EN 1992-1-1:2011", rev: "2020" },
    { code: "XPS_MIN_THICK", desc: "Минимальный срез утеплителя цокольной зоны", val: 50, unit: "мм", ref: "NCM L.02.01:2012", rev: "2020" },
    { code: "XPS_SLAB_THICK", desc: "Толщина XPS утепления под подошвой УШП плиты", val: 100, unit: "мм", ref: "NCM L.02.01:2012", rev: "2020" },
    { code: "COMPACTION_COEFF", desc: "Требуемый коэфф. послойного уплотнения засыпки", val: 0.98, unit: "безр.", ref: "СНиП 3.02.01-87", rev: "Действует" }
  ];

  norms.forEach((n, idx) => {
    const r = 5 + idx;
    ws.getCell(`B${r}`).value = n.code;
    ws.getCell(`C${r}`).value = n.desc;
    ws.getCell(`D${r}`).value = n.val;
    ws.getCell(`E${r}`).value = n.unit;
    ws.getCell(`F${r}`).value = n.ref;
    ws.getCell(`G${r}`).value = n.rev;

    ws.getCell(`B${r}`).font = { name: "Consolas", size: 8.5, color: { argb: "FF047857" } };
    ws.getCell(`C${r}`).font = { name: "Calibri", size: 9 };
    ws.getCell(`D${r}`).font = { name: "Consolas", size: 9, bold: true, color: { argb: "FF0F172A" } };
    ws.getCell(`E${r}`).font = { name: "Calibri", size: 8.5, color: { argb: "FF475569" } };
    ws.getCell(`F${r}`).font = { name: "Calibri", size: 9 };
    ws.getCell(`G${r}`).font = { name: "Calibri", size: 9, color: { argb: "FF64748B" } };

    ws.getRow(r).height = 19;
    ["B","C","D","E","F","G"].forEach(col => {
      ws.getCell(`${col}${r}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
  });
}

export function addRiskAnalysisSheet(workbook: ExcelJS.Workbook, results: CalculationResults) {
  const ws = workbook.addWorksheet("РАЗДЕЛ РИСКОВ (RISK ANALYSIS)");
  ws.views = [{ showGridLines: true }];

  ws.getColumn(1).width = 4;   // Spacing
  ws.getColumn(2).width = 34;  // Инженерный объект риска
  ws.getColumn(3).width = 20;  // Оценка риска
  ws.getColumn(4).width = 75;  // Описание деградационного последствия и рекомендация СНиП

  // Title
  ws.mergeCells("B2:D2");
  const tCell = ws.getCell("B2");
  tCell.value = "АВТОМАТИЧЕСКИЙ АНАЛИЗ ГЕОТЕХНИЧЕСКИХ И СТРОИТЕЛЬНЫХ РИСКОВ (RISK ANALYSIS)";
  tCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  tCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
  tCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(2).height = 32;

  // Header
  ws.getCell("B4").value = "Категория риска";
  ws.getCell("C4").value = "Уровень риска";
  ws.getCell("D4").value = "Инженерные предписания по предотвращению повреждений";
  ["B", "C", "D"].forEach(c => {
    const r = ws.getCell(`${c}4`);
    r.font = { name: "Calibri", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    r.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF7F1D1D" } };
    r.alignment = { horizontal: "center", vertical: "middle" };
  });
  ws.getRow(4).height = 24;

  const risks = [
    {
      obj: "Высокий уровень грунтовых вод (УГВ)",
      level: results.input.groundwaterDepth < 1.5 ? "ВЫСОКИЙ (КРИТИКА)" : "НИЗКИЙ / БЕЗОПАСНО",
      desc: results.input.groundwaterDepth < 1.5 
        ? "Грунтовые воды подтапливают котлован. Требуется обязательный пристенный дренаж d110 в кокосовом фильтре и качественная рулонная гидроизоляция."
        : "Грунтовые воды залегают на безопасной глубине. Специальные противонапорные дренажные меры при отсутствии верховодки не требуются."
    },
    {
      obj: "Слабый/просадочный грунт основания",
      level: (results.input.soilType === "LOESS" || results.input.soilType === "FILLED") ? "КРИТИЧЕСКИЙ (ALERT)" : "ДОПУСТИМЫЙ / НОРМА",
      desc: (results.input.soilType === "LOESS" || results.input.soilType === "FILLED")
        ? "Основание подвержено просадкам и разуплотнению при замачивании. Обязательна песчано-щебеночная виброподушка Masalta K_com>=0.98 и глиняный водоупористый замок."
        : "Проектные суглинки или супеси обладают достаточной жесткостью. Плотность уплотнения должна быть стандартной."
    },
    {
      obj: "Отсутствие пристенного дренажа",
      level: results.input.groundwaterDepth < 1.5 ? "ВЫСОКИЙ РИСК" : "НИЗКИЙ РИСК",
      desc: results.input.groundwaterDepth < 1.5
        ? "При высоком УГВ отсутствие обводного дренажа вызовет затопление пазух, порчу гидроизоляции и размыв несущей подушки."
        : "Для песчаных или глубокозалегающих грунтов пристенный дренаж имеет рекомендательный характер."
    },
    {
      obj: "Отсутствие утепления подошвы/цоколя",
      level: (results.input.soilType === "CLAY" || results.input.soilType === "LOAM") ? "ВЫСОКИЙ РИСК" : "НИЗКИЙ РИСК",
      desc: (results.input.soilType === "CLAY" || results.input.soilType === "LOAM")
        ? "Тяжелые глины подвержены морозному пучению. Отсутствие экструдированных XPS плит вызовет деформацию стен. Требуется XPS 50-100мм."
        : "Легкие грунты малопучинисты. Термический барьер утепления сохраняет внутренний баланс плиты."
    },
    {
      obj: "Недостаточность армирования монолита",
      level: "НИЗКИЙ РИСК",
      desc: "В расчетах заложена оптимальная жесткость (не менее 58-68 кг/м³), что исключает усадочные трещины. Не изменять диаметры рабочих стержней d12/14."
    },
    {
      obj: "Интегрированные инженерные вводы",
      level: "НИЗКИЙ РИСК",
      desc: "Включает комплект из 5 изолированных проходов (PVC, HDPE). Предотвращает разрыв сетей при усадочных кренах здания."
    },
    {
      obj: "Влажностный уход за готовым бетоном",
      level: "СПАСЕННЫЙ РИСК (PASS)",
      desc: "Укрытие ПЭ пленкой 150мкм и регулярная ирригация в течение 14 суток гарантирует достижение проектного класса C20/25 и снижает трещинообразование на 98%."
    },
    {
      obj: "Качество обратной засыпки пазух",
      level: "КОНТРОЛИРУЕМЫЙ РИСК",
      desc: "Послойная трамбовка предохраняет от скорого проседания отмостки. Обязателен послойный экспресс-контроль прочности K_com >= 0.98."
    },
    {
      obj: "Надежность отмостки периметра",
      level: "УГРОЗА ПРИ ОТСУТСТВИИ",
      desc: "Без отмостки паводковые и водосточные воды проникнут непосредственно под подошву фундамента. Обязательна монолитная разуклонка 2.5% по слою XPS."
    }
  ];

  risks.forEach((risk, idx) => {
    const row = 5 + idx;
    ws.getCell(`B${row}`).value = risk.obj;
    ws.getCell(`C${row}`).value = risk.level;
    ws.getCell(`D${row}`).value = risk.desc;

    ws.getCell(`B${row}`).font = { name: "Calibri", size: 9, bold: true };
    ws.getCell(`D${row}`).font = { name: "Calibri", size: 9, color: { argb: "FF334155" } };

    // High risk styles
    const isHigh = risk.level.includes("ВЫСОКИЙ") || risk.level.includes("КРИТИЧЕСКИЙ") || risk.level.includes("УГРОЗА");
    ws.getCell(`C${row}`).font = { 
      name: "Consolas", 
      size: 9, 
      bold: true, 
      color: { argb: isHigh ? "FF991B1B" : "FF047857" } 
    };
    ws.getCell(`C${row}`).alignment = { horizontal: "center" };

    const bgHex = row % 2 === 0 ? "FFFFF8F8" : "FFFFFFFF";
    ["B", "C", "D"].forEach(col => {
      ws.getCell(`${col}${row}`).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
      ws.getCell(`${col}${row}`).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    });
    ws.getRow(row).height = 24;
  });
}

// User-triggered export single option handler
export async function exportToExcel(
  input: CalculatorInput,
  results: CalculationResults,
  selectedOption: FoundationOption,
  landSlope: number,
  groundwaterDepth: number,
  detailedItemsFetcher: (catId: string, opt: any, slope: number, gw: number) => any[]
) {
  const workbook = await generateExcelWorkbook(
    input,
    results,
    selectedOption,
    landSlope,
    groundwaterDepth,
    detailedItemsFetcher
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const fndShortName = selectedOption.id === "slab" ? "Slab" : selectedOption.id === "strip" ? "Strip" : "Pile";
  const fileName = `Fundament_Estimate_Professional_${fndShortName}_${input.width}x${input.length}.xlsx`;
  saveAs(blob, fileName);
}

// User-triggered export comparative all options handler
export async function exportAllToExcel(
  input: CalculatorInput,
  results: CalculationResults,
  landSlope: number,
  groundwaterDepth: number,
  detailedItemsFetcher: (catId: string, opt: any, slope: number, gw: number) => any[]
) {
  const workbook = await generateExcelWorkbook(
    input,
    results,
    null, // Sequential comparative rendering
    landSlope,
    groundwaterDepth,
    detailedItemsFetcher
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const fileName = `Sravnitelnaya_Smeta_Fundamentov_Ultimate_Moldova.xlsx`;
  saveAs(blob, fileName);
}
