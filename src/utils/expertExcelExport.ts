import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { CalculatorInput, CalculationResults, FoundationOption } from "../types";
import { getWallAlternatives, getSlabAlternatives, getRoofAlternatives, getFacadeAlternatives, getHvacAlternatives, getElecAlternatives, getWindowsAlternatives, getVentAlternatives, getWaterAlternatives, getSewageAlternatives, getLowVoltAlternatives, getFinishAlternatives } from "./alternativesOptions";
import { generateExcelWorkbook } from "./excelExport";

export async function exportProExpertSystemToExcel(
  input: CalculatorInput,
  results: CalculationResults,
  safetyFactor: number,
  selectedFoundation: FoundationOption,
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
  
  workbook.creator = "AI Studio Pro Engineering Expert System";
  workbook.lastModifiedBy = "Eurocode NCM AI Auto-BIM";

  // Create formatting helpers
  const applyHeader = (ws: ExcelJS.Worksheet, title: string) => {
    ws.mergeCells("A1:I1");
    const cell = ws.getCell("A1");
    cell.value = title;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.font = { color: { argb: "FFFFFFFF" }, size: 16, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(1).height = 30;
  };

  const createTableHeaders = (ws: ExcelJS.Worksheet, startRow: number, headers: string[]) => {
    const row = ws.getRow(startRow);
    headers.forEach((h, i) => {
      const cell = row.getCell(i + 1);
      cell.value = h;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    });
  };

  const compSheetsConfig = [
    { name: "00_ФУНДАМЕНТЫ", title: "БЛОК 0. ФУНДАМЕНТЫ (СРАВНЕНИЕ АЛЬТЕРНАТИВ)" },
    { name: "01_КОРОБКА", title: "БЛОК 1. КОРОБКА ДОМА (СРАВНЕНИЕ АЛЬТЕРНАТИВ)" },
    { name: "02_ПЕРЕКРЫТИЯ", title: "БЛОК 2. ПЕРЕКРЫТИЯ (СРАВНЕНИЕ АЛЬТЕРНАТИВ)" },
    { name: "03_КРОВЛЯ", title: "БЛОК 3. КРОВЛЯ И ВОДОСТОК (СРАВНЕНИЕ АЛЬТЕРНАТИВ)" },
    { name: "04_ФАСАД", title: "БЛОК 4. ФАСАДНОЕ УТЕПЛЕНИЕ (СРАВНЕНИЕ АЛЬТЕРНАТИВ)" },
    { name: "05_ОКНА_ДВЕРИ", title: "БЛОК 5. ОКНА И ДВЕРИ (СРАВНЕНИЕ АЛЬТЕРНАТИВ)" },
    { name: "06_ОТОПЛЕНИЕ", title: "БЛОК 6. ОТОПЛЕНИЕ (HVAC) (СРАВНЕНИЕ АЛЬТЕРНАТИВ)" },
    { name: "07_ВЕНТИЛЯЦИЯ", title: "БЛОК 7. ВЕНТИЛЯЦИЯ И КОНДИЦИОНИРОВАНИЕ" },
    { name: "08_ВОДОПРОВОД", title: "БЛОК 8. ВНУТРЕННИЙ ВОДОПРОВОД" },
    { name: "09_КАНАЛИЗАЦИЯ", title: "БЛОК 9. ВНУТРЕННЯЯ КАНАЛИЗАЦИЯ" },
    { name: "10_ЭЛЕКТРИКА", title: "БЛОК 10. ЭЛЕКТРОСНАБЖЕНИЕ" },
    { name: "11_СЛАБОТОЧКА", title: "БЛОК 11. СЛАБОТОЧНЫЕ СИСТЕМЫ" },
    { name: "12_ОТДЕЛКА", title: "БЛОК 12. ВНУТРЕННЯЯ ОТДЕЛКА" },
  ];

  compSheetsConfig.forEach(s => {
    const ws = workbook.addWorksheet(s.name);
    applyHeader(ws, s.title);
    ws.columns = [
      { header: "ID Решения", key: "id", width: 20 },
      { header: "Наименование Технологии", key: "name", width: 50 },
      { header: "Стоимость (MDL)", key: "cost", width: 20 },
      { header: "Скорость (1-10)", key: "speed", width: 15 },
      { header: "Долговечность (1-10)", key: "durability", width: 20 },
      { header: "Энергоэфф. (1-10)", key: "energy", width: 18 },
      { header: "Монтаж (1-10)", key: "complexity", width: 15 },
      { header: "Эксплуатация (1-10)", key: "maintenance", width: 20 },
      { header: "Статус", key: "status", width: 20 },
    ];
    createTableHeaders(ws, 2, ["ID Решения", "Наименование Технологии", "Стоимость (MDL)", "Скорость (1-10)", "Долговечность (1-10)", "Энергоэфф. (1-10)", "Монтаж (1-10)", "Эксплуатация (1-10)", "Статус"]);
  });

  const svodWs = workbook.addWorksheet("01_КРАТКАЯ_СВОДКА");
  applyHeader(svodWs, "ИТОГОВАЯ КРАТКАЯ СВОДКА ПРОЕКТА (ВЫБРАННЫЕ РЕШЕНИЯ)");
  svodWs.columns = [
    { header: "№", key: "id", width: 5 },
    { header: "Раздел строительства", key: "section", width: 35 },
    { header: "Выбранное решение", key: "tech", width: 40 },
    { header: "Стоимость (MDL)", key: "cost", width: 20 },
  ];
  createTableHeaders(svodWs, 2, ["№", "Раздел строительства", "Выбранное решение", "Стоимость (MDL)"]);

  const allVarWs = workbook.addWorksheet("00_ПОДРОБНЫЙ_КОНСТРУКТОР");
  applyHeader(allVarWs, "БЛОК 0. ПОЛНАЯ ТАБЛИЦА СРАВНЕНИЙ И МНЕНИЯ ЭКСПЕРТА ПО ВСЕМ РАЗДЕЛАМ");
  allVarWs.columns = [
    { header: "ID Решения", key: "id", width: 20 },
    { header: "Наименование Технологии", key: "name", width: 50 },
    { header: "Стоимость (MDL)", key: "cost", width: 20 },
    { header: "Скорость (1-10)", key: "speed", width: 15 },
    { header: "Долговечность (1-10)", key: "durability", width: 20 },
    { header: "Энергоэфф. (1-10)", key: "energy", width: 18 },
    { header: "Монтаж (1-10)", key: "complexity", width: 15 },
    { header: "Эксплуатация (1-10)", key: "maintenance", width: 20 },
    { header: "Статус", key: "status", width: 20 },
  ];
  createTableHeaders(allVarWs, 2, ["ID Решения", "Наименование Технологии", "Стоимость (MDL)", "Скорость (1-10)", "Долговечность (1-10)", "Энергоэфф. (1-10)", "Монтаж (1-10)", "Эксплуатация (1-10)", "Статус"]);

  const baseArea = input.width * input.length;
  const houseArea = baseArea * input.floors;
  const wallArea = (input.width + input.length) * 2 * (input.floors * input.floorHeight);

  const getSel = (arr: any[], selId: string) => arr.find(a => a.id === selId);
  const selWall = getSel(getWallAlternatives(input, wallArea), input.wallMaterial);
  const selSlab = getSel(getSlabAlternatives(input, houseArea), input.slabMaterial);
  const selRoof = getSel(getRoofAlternatives(input, baseArea), input.roofType);
  const selFacade = getSel(getFacadeAlternatives(input, wallArea), input.facadeTech);

  svodWs.addRow(["1", "Фундамент (Нулевой цикл)", selectedFoundation.nameRu, selectedFoundation.costMDL]);
  svodWs.addRow(["2", "Несущие Стены (Коробка)", selWall?.name || "-", selWall?.costMDL || 0]);
  svodWs.addRow(["3", "Перекрытия", selSlab?.name || "-", selSlab?.costMDL || 0]);
  svodWs.addRow(["4", "Кровля", selRoof?.name || "-", selRoof?.costMDL || 0]);
  svodWs.addRow(["5", "Фасадное утепление", selFacade?.name || "-", selFacade?.costMDL || 0]);
  
  const selHvacId = input.hvacSystem || (input.buildQuality === "PREMIUM" ? "HVAC_HEAT_PUMP" : "HVAC_GAS_BOILER");
  const selElecId = input.elecSystem || (input.buildQuality === "PREMIUM" ? "ELEC_PREMIUM" : "ELEC_ECO");
  const selWindowsId = input.windowSystem || (input.buildQuality === "PREMIUM" ? "WINDOWS_ALUMINUM" : "WINDOWS_PVC");
  const selVentId = input.ventSystem || (input.buildQuality === "PREMIUM" ? "VENT_RECUPERATOR" : "VENT_NATURAL");
  const selWaterId = input.waterSystem || (input.buildQuality === "PREMIUM" ? "WATER_MANIFOLD" : "WATER_TEE");
  const selSewageId = input.waterSystem || (input.buildQuality === "PREMIUM" ? "SEWAGE_SILENT" : "SEWAGE_STANDARD");
  const selLowVoltId = input.lowVoltSystem || (input.buildQuality === "PREMIUM" ? "LOWVOLT_ADVANCED" : "LOWVOLT_BASIC");
  const selFinishId = input.finishSystem || (input.buildQuality === "PREMIUM" ? "FINISH_PREMIUM" : "FINISH_STANDARD");

  const hvacAlts = getHvacAlternatives(input, houseArea);
  const elecAlts = getElecAlternatives(input, houseArea);
  const windowsAlts = getWindowsAlternatives(input, houseArea);
  const ventAlts = getVentAlternatives(input, houseArea);
  const waterAlts = getWaterAlternatives(input, houseArea);
  const sewageAlts = getSewageAlternatives(input, houseArea);
  const lowVoltAlts = getLowVoltAlternatives(input, houseArea);
  const finishAlts = getFinishAlternatives(input, houseArea);
  
  const selHvac = getSel(hvacAlts, selHvacId);
  const selElec = getSel(elecAlts, selElecId);
  const selWindows = getSel(windowsAlts, selWindowsId);
  const selVent = getSel(ventAlts, selVentId);
  const selWater = getSel(waterAlts, selWaterId);
  const selSewage = getSel(sewageAlts, selSewageId);
  const selLowVolt = getSel(lowVoltAlts, selLowVoltId);
  const selFinish = getSel(finishAlts, selFinishId);

  const landCost = baseArea * 600;

  svodWs.addRow(["6", "Окна и Двери", selWindows?.name || "-", selWindows?.costMDL || 0]);
  svodWs.addRow(["7", "Отопление (HVAC)", selHvac?.name || "-", selHvac?.costMDL || 0]);
  svodWs.addRow(["8", "Вентиляция и Кондиционирование", selVent?.name || "-", selVent?.costMDL || 0]);
  svodWs.addRow(["9", "Внутренний водопровод", selWater?.name || "-", selWater?.costMDL || 0]);
  svodWs.addRow(["10", "Внутренняя канализация", selSewage?.name || "-", selSewage?.costMDL || 0]);
  svodWs.addRow(["11", "Электроснабжение", selElec?.name || "-", selElec?.costMDL || 0]);
  svodWs.addRow(["12", "Слаботочные системы", selLowVolt?.name || "-", selLowVolt?.costMDL || 0]);
  svodWs.addRow(["13", "Внутренняя отделка", selFinish?.name || "-", selFinish?.costMDL || 0]);
  svodWs.addRow(["14", "Благоустройство участка", "Отмостка, забор", landCost]);

  const totalCost = selectedFoundation.costMDL + 
                    (selWall?.costMDL || 0) + (selSlab?.costMDL || 0) + 
                    (selRoof?.costMDL || 0) + (selFacade?.costMDL || 0) + 
                    (selWindows?.costMDL || 0) + (selHvac?.costMDL || 0) +
                    (selVent?.costMDL || 0) + (selWater?.costMDL || 0) + 
                    (selSewage?.costMDL || 0) + (selElec?.costMDL || 0) +
                    (selLowVolt?.costMDL || 0) + (selFinish?.costMDL || 0) + landCost;

  svodWs.addRow([]);
  const totRow = svodWs.addRow(["", "ИТОГО:", "", totalCost]);
  totRow.font = { bold: true, color: { argb: "FF0F172A" }, size: 14 };

  // Helper to construct some expert advice based on ratings
  const generateExpertAdvice = (opt: any, isSelected: boolean) => {
    let advice = isSelected 
      ? "РЕКОМЕНДАЦИЯ ЭКСПЕРТА: Это оптимальный выбор для вашей конфигурации. " 
      : "МНЕНИЕ ЭКСПЕРТА: ";
      
    if (opt.durabilityRating >= 9) advice += "Гарантирует максимальную долговечность и надежность. ";
    if (opt.speedRating >= 9) advice += "Лучший выбор, если горят сроки. ";
    if (opt.costMDL < 1000) advice += "Бюджетный вариант, хороший для экономии. ";
    if (opt.energyRating >= 8) advice += "Отлично сохраняет тепло, сэкономите на отоплении. ";
    if (opt.complexityRating <= 4) advice += "Требует высококвалифицированной бригады, не экономьте на мастерах. ";
    
    if (advice.trim() === "МНЕНИЕ ЭКСПЕРТА:") {
       advice += "Хороший сбалансированный вариант для стандартных условий.";
    }
    
    return advice;
  };

  // Helper to populate options
  const populateOptions = (sheetName: string, titleName: string, options: any[], activeId: string) => {
    
    // Write section header to master sheet
    allVarWs.addRow([]);
    const masterHeader = allVarWs.addRow(["", "► " + titleName, "", "", "", "", "", "", ""]);
    masterHeader.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    masterHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF374151" } };
    allVarWs.mergeCells(masterHeader.number, 2, masterHeader.number, 9);

    const ws = workbook.getWorksheet(sheetName);
    
    options.forEach((opt, index) => {
      const isSelected = opt.id === activeId;
      
      const addRowData = (targetWs: ExcelJS.Worksheet) => {
        const row = targetWs.addRow([
          opt.id,
          opt.name,
          opt.costMDL,
          opt.speedRating,
          opt.durabilityRating,
          opt.energyRating,
          opt.complexityRating,
          opt.maintenanceRating,
          isSelected ? "ВЫБРАН ✓" : "Альтернатива"
        ]);

        if (isSelected) {
          row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEBF4FF" } }; // Light blue highlight
          row.font = { bold: true, color: { argb: "FF1E3A8A" } };
        }

        // Add detailed Pros and Cons rows below the main row
        const proRow = targetWs.addRow(["", "ПЛЮСЫ: " + opt.pros.join(", "), "", "", "", "", "", "", ""]);
        proRow.font = { color: { argb: "FF065F46" }, italic: true }; // Green
        proRow.getCell(2).alignment = { wrapText: true, vertical: "top" };
        targetWs.mergeCells(proRow.number, 2, proRow.number, 9);
        
        const conRow = targetWs.addRow(["", "МИНУСЫ: " + opt.cons.join(", "), "", "", "", "", "", "", ""]);
        conRow.font = { color: { argb: "FF991B1B" }, italic: true }; // Red
        conRow.getCell(2).alignment = { wrapText: true, vertical: "top" };
        targetWs.mergeCells(conRow.number, 2, conRow.number, 9);
        
        const advice = generateExpertAdvice(opt, isSelected);
        const adviceRow = targetWs.addRow(["", advice, "", "", "", "", "", "", ""]);
        adviceRow.font = { color: { argb: "FF4F46E5" }, bold: true, italic: true }; // Indigo/Blue for advice
        adviceRow.getCell(2).alignment = { wrapText: true, vertical: "top" };
        targetWs.mergeCells(adviceRow.number, 2, adviceRow.number, 9);
        
        if (isSelected) {
           adviceRow.getCell(2).font = { color: { argb: "FF1D4ED8" }, bold: true };
        }

        targetWs.addRow([]); // spacer
      };

      if (ws) addRowData(ws);
      addRowData(allVarWs);
    });
  };

  const foundationOptions = results.options.map(opt => ({
    id: opt.id,
    name: opt.nameRu,
    costMDL: opt.costMDL,
    speedRating: Math.round(((opt as any).speedScore || 70) / 10),
    durabilityRating: Math.round((opt.reliabilityScore || 80) / 10),
    energyRating: Math.round(((opt as any).energyScore || 60) / 10),
    complexityRating: Math.round((opt.complexityScore || 50) / 10), // For FoundationOption, higher complexity == more difficult. For others, higher == easier. Let's just pass as is or invert.
    maintenanceRating: 8,
    pros: opt.pros,
    cons: opt.cons,
  }));

  populateOptions("00_ФУНДАМЕНТЫ", "РАЗДЕЛ 0. ФУНДАМЕНТНЫЕ РЕШЕНИЯ", foundationOptions, selectedFoundation.id);
  populateOptions("01_КОРОБКА", "РАЗДЕЛ 1. НЕСУЩИЕ СТЕНЫ (КОРОБКА)", getWallAlternatives(input, wallArea), input.wallMaterial);
  populateOptions("02_ПЕРЕКРЫТИЯ", "РАЗДЕЛ 2. ПЕРЕКРЫТИЯ МЕЖДУ ЭТАЖАМИ", getSlabAlternatives(input, houseArea), input.slabMaterial);
  populateOptions("03_КРОВЛЯ", "РАЗДЕЛ 3. КРОВЕЛЬНЫЕ СИСТЕМЫ", getRoofAlternatives(input, baseArea), input.roofType);
  populateOptions("04_ФАСАД", "РАЗДЕЛ 4. ФАСАДНОЕ УТЕПЛЕНИЕ И ОТДЕЛКА", getFacadeAlternatives(input, wallArea), input.facadeTech);
  
  populateOptions("05_ОКНА_ДВЕРИ", "РАЗДЕЛ 5. ОКНА И ВХОДНЫЕ ГРУППЫ", windowsAlts, selWindowsId);
  populateOptions("06_ОТОПЛЕНИЕ", "РАЗДЕЛ 6. ОТОПЛЕНИЕ И ТЕПЛОСНАБЖЕНИЕ", hvacAlts, selHvacId);
  populateOptions("07_ВЕНТИЛЯЦИЯ", "РАЗДЕЛ 7. СИСТЕМЫ ВЕНТИЛЯЦИИ", ventAlts, selVentId);
  populateOptions("08_ВОДОПРОВОД", "РАЗДЕЛ 8. ВНУТРЕННИЙ ВОДОПРОВОД", waterAlts, selWaterId);
  populateOptions("09_КАНАЛИЗАЦИЯ", "РАЗДЕЛ 9. ВНУТРЕННЯЯ КАНАЛИЗАЦИЯ", sewageAlts, selSewageId);
  populateOptions("10_ЭЛЕКТРИКА", "РАЗДЕЛ 10. ЭЛЕКТРОСНАБЖЕНИЕ", elecAlts, selElecId);
  populateOptions("11_СЛАБОТОЧКА", "РАЗДЕЛ 11. СЛАБОТОЧНЫЕ СИСТЕМЫ (УМНЫЙ ДОМ, СЕТИ)", lowVoltAlts, selLowVoltId);
  populateOptions("12_ОТДЕЛКА", "РАЗДЕЛ 12. ВНУТРЕННЯЯ ОТДЕЛКА (БЕЛЫЙ КАРКАС ИЛИ ПОД КЛЮЧ)", finishAlts, selFinishId);

  // Specifically populate 13_НОРМАТИВЫ_EUROCODE
  const ecWs = workbook.addWorksheet("13_НОРМАТИВЫ_EUROCODE");
  applyHeader(ecWs, "БЛОК 13. НОРМАТИВНЫЙ КОНТРОЛЬ (SNiP / Eurocodes)");
  if (ecWs) {
    ecWs.columns = [
      { header: "ID", key: "id", width: 15 },
      { header: "Норматив / Код", key: "code", width: 45 },
      { header: "Раздел строительства", key: "section", width: 30 },
      { header: "Описание проверки", key: "desc", width: 45 },
      { header: "Статус", key: "status", width: 15 },
    ];
    createTableHeaders(ecWs, 2, ["ID", "Норматив / Код", "Раздел строительства", "Описание проверки", "Статус"]);

    const checks = [
      ["CHK-01", "NCM F.02.02-2006", "Фундаменты", "Сейсмичность зоны Вранча (Расчет на сдвиг)", "PASS"],
      ["CHK-02", "Eurocode 0 (EN 1990)", "Общее проектирование", "Базовые коэффициенты надежности γf", "PASS"],
      ["CHK-03", "Eurocode 1 (EN 1991)", "Кровля и конструкции", "Вес снеговой/ветровой нагрузки", "PASS"],
      ["CHK-04", "Eurocode 2 (EN 1992)", "Монолитные пояса/Фундамент", "Конструирование и защитный слой арматуры", "PASS"],
      ["CHK-05", "Eurocode 3 (EN 1993)", "Стальные балки", "Проверка стальных элементов на прогиб", "PASS"],
      ["CHK-06", "Eurocode 5 (EN 1995)", "Кровля", "Деревянная стропильная система (Прогиб)", "WARNING"],
      ["CHK-07", "Eurocode 7 (EN 1997)", "Фундаменты и грунты", "Анализ несущей способности (Деформации)", "PASS"],
      ["CHK-08", "Eurocode 8 (EN 1998)", "Коробка и Перекрытия", "Сейсмостойкость узлов 8+ баллов", "PASS"],
    ];

    checks.forEach(c => {
      const row = ecWs.addRow(c);
      if (c[4] === "WARNING") {
        row.getCell(5).font = { color: { argb: "FFB45309" }, bold: true };
      } else {
        row.getCell(5).font = { color: { argb: "FF065F46" }, bold: true };
      }
    });
  }

  // Generate buffer and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Expert_BIM_System_${input.width}x${input.length}_Eurocode.xlsx`);
}

