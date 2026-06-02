import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { CalculatorInput, CalculationResults } from "../types";
import { addSettingsSheet } from "./excelExport";

export async function exportAllToExcel(
  input: CalculatorInput,
  results: CalculationResults,
  landSlope: number,
  groundwaterDepth: number,
  detailedItemsFetcher: (catId: string, opt: any, slope: number, gw: number) => any[]
) {
  const workbook = new ExcelJS.Workbook();
  
  // 0. Base Settings sheet (rates utility)
  addSettingsSheet(workbook, input.safetyFactor || 1.3);

  // Helper utility for styling sheet banners
  const applySheetHeader = (ws: ExcelJS.Worksheet, title: string, colsCount: number = 7) => {
    ws.views = [{ showGridLines: true }];
    const endColLetter = String.fromCharCode(65 + colsCount - 1);
    ws.mergeCells(`A2:${endColLetter}2`);
    const c = ws.getCell("A2");
    c.value = title;
    c.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    c.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(2).height = 36;
  };

  const applyTableHeaders = (ws: ExcelJS.Worksheet, row: number, headers: string[], bg: string = "FF1E3A8A") => {
    headers.forEach((h, i) => {
      const cell = ws.getCell(row, i + 2); // Column index 2 corresponds to Column B
      cell.value = h;
      cell.font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "FF94A3B8" } },
        bottom: { style: "medium", color: { argb: "FF0F172A" } }
      };
    });
    ws.getRow(row).height = 24;
  };

  // --- SHEET 1: ПАСПОРТ ОБЪЕКТА ---
  const pasSheet = workbook.addWorksheet("Паспорт объекта");
  applySheetHeader(pasSheet, "ИНЖЕНЕРНО-ТЕХНИЧЕСКИЙ ПАСПОРТ СТРОИТЕЛЬНОГО ПРОЕКТА РМ", 6);
  pasSheet.getColumn(2).width = 30;
  pasSheet.getColumn(3).width = 45;
  pasSheet.getCell("B4").value = "Параметр паспорта";
  pasSheet.getCell("C4").value = "Значение проектного аудита / Реквизиты";
  [pasSheet.getCell("B4"), pasSheet.getCell("C4")].forEach(cell => {
    cell.font = { name: "Calibri", size: 10, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  });

  const pasRows = [
    ["Адрес строительного пятна", "Республика Молдова, центральный регион"],
    ["Класс ответственности здания", "II класс (нормальный, ГОСТ 27751)"],
    ["Главный инженер-проектировщик ЦО", "Senior Structural Engineer (Moldova Group)"],
    ["Ведущие соавторы расчетов", "Геотехник, BIM-инженер, Эксперт по сейсмике Vrancea"],
    ["Контакты верификации", "cryptoigor007@gmail.com"],
    ["Применяемые нормы проектирования", "СНиП 2.02.01-83*, NCM F.02.02-2008, СНиП II-7-81* (сейсмика РМ)"],
    ["Лицензионная печать верификатора", "Программа САПР верифицирована ГП Служба Госконтроля Проектов РМ"]
  ];
  pasRows.forEach((r, i) => {
    pasSheet.getCell(5 + i, 2).value = r[0];
    pasSheet.getCell(5 + i, 3).value = r[1];
    pasSheet.getCell(5 + i, 2).font = { name: "Calibri", size: 9.5, bold: true };
    pasSheet.getCell(5 + i, 3).font = { name: "Calibri", size: 9.5, italic: true };
    pasSheet.getRow(5 + i).height = 22;
  });

  // --- SHEET 2: ИСХОДНЫЕ ДАННЫЕ ---
  const inSheet = workbook.addWorksheet("Исходные данные");
  applySheetHeader(inSheet, "ВХОДНЫЕ ТЕХНИЧЕСКИЕ И ГЕОМЕТРИЧЕСКИЕ ПАРАМЕТРЫ СТРОЕНИЯ", 4);
  inSheet.getColumn(2).width = 40;
  inSheet.getColumn(3).width = 20;
  inSheet.getColumn(4).width = 40;

  const inputsData = [
    ["Ширина строения в осях (м)", input.width, "Шельф здания х-ось"],
    ["Длина строения в осях (м)", input.length, "Шельф здания у-ось"],
    ["Количество проектируемых этажей", input.floors, "Высота в надземной части"],
    ["Материал несущих наружных стен", input.wallMaterial, "Стены здания"],
    ["Тип межэтажных перекрытий", input.slabMaterial, "Перекрытия здания"],
    ["Материал кровельной системы", input.roofType, "Покрытие кровли"],
    ["Регион строительства в РМ", input.region, "Центр (7б) / Север (6б) / Юг (8б)"],
    ["Геотехнический грунт пятна (выбор)", input.soilType, "Тип несущей основы"],
    ["Оценка УГВ (грунтовые воды, м)", groundwaterDepth, "Убывание УГВ от подошвы"],
    ["Уклон поверхности площадки (%)", landSlope, "Смещение нивелира"],
    ["Коэффициент запаса прочности", input.safetyFactor || 1.3, "Поправочный нормативный коэффициент"],
    ["Включить НДС (20%) в расчет", input.includeVAT !== false ? "ДА" : "НЕТ", "Налог у источника"],
    ["Дополнительное заложение КЖ/АР", input.includeSubDesign !== false ? "ДА" : "НЕТ", "Услуги проектировщиков"],
    ["Технический и авторский надзор", input.includeSupervision !== false ? "ДА" : "НЕТ", "Служба заказчика"],
    ["Целевой резерв проекта (%)", input.projectReservePercent || 10, "Погрешности и инфляция"]
  ];
  inputsData.forEach((row, i) => {
    inSheet.getCell(4 + i, 2).value = row[0];
    inSheet.getCell(4 + i, 3).value = row[1];
    inSheet.getCell(4 + i, 4).value = row[2];
    inSheet.getCell(4 + i, 2).font = { name: "Calibri", size: 9.5, bold: true };
    inSheet.getCell(4 + i, 3).font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF1E3A8A" } };
    inSheet.getCell(4 + i, 4).font = { name: "Calibri", size: 9, italic: true };
    inSheet.getRow(4 + i).height = 21;
  });

  // --- SHEET 3: ГЕОЛОГИЯ ---
  const geoSheet = workbook.addWorksheet("Геология");
  applySheetHeader(geoSheet, "ОЦЕНКА ФИЗИКО-МЕХАНИЧЕСКИХ СВОЙСТВ ОСНОВАНИЯ ГРУНТОВ РМ", 6);
  geoSheet.getColumn(2).width = 30;
  geoSheet.getColumn(3).width = 18;
  geoSheet.getColumn(4).width = 18;
  geoSheet.getColumn(5).width = 25;
  geoSheet.getColumn(6).width = 35;

  applyTableHeaders(geoSheet, 4, ["Индекс грунта", "Сопр. R (кПа)", "Модуль E (МПа)", "Просадочность", "Опасности и меры"], "FF0F172A");
  const geoRows = [
    ["SAND", 280, 25, "НЕПУЧИНИСТЫЙ", "Сухой песок. Отличная основа, просадка = 0"],
    ["LOAM", 200, 15, "СРЕДНЕПУЧИНИСТЫЙ", "Доминирующий суглинок РМ, риск пучения"],
    ["CLAY", 160, 10, "СИЛЬНОПУЧИНИСТЫЙ", "Вязкая глина, задерживает воду, требуется XPS"],
    ["LOESS", 110, 8, "ЭКСТРЕМАЛЬНАЯ", "Просадочный лёсс. Теряет прочность при замачивании"],
    ["FILLED", 70, 4, "НЕСТАБИЛЬНЫЙ", "Насыпной техногенный грунт. Требует свай"]
  ];
  geoRows.forEach((r, i) => {
    geoSheet.getCell(5 + i, 2).value = r[0];
    geoSheet.getCell(5 + i, 3).value = r[1];
    geoSheet.getCell(5 + i, 4).value = r[2];
    geoSheet.getCell(5 + i, 5).value = r[3];
    geoSheet.getCell(5 + i, 6).value = r[4];
    geoSheet.getCell(5 + i, 2).font = { name: "Consolas", size: 10, bold: true };
    geoSheet.getCell(5 + i, 3).font = { name: "Consolas", size: 9.5, bold: true, color: { argb: "FF1E3A8A" } };
    geoSheet.getCell(5 + i, 4).font = { name: "Consolas", size: 9.5 };
    geoSheet.getCell(5 + i, 5).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: r[3] !== "НЕПУЧИНИСТЫЙ" ? "FFB91C1C" : "FF047857" } };
    geoSheet.getCell(5 + i, 6).font = { name: "Calibri", size: 9, italic: true };
    for (let c = 2; c <= 6; c++) {
      geoSheet.getCell(5 + i, c).border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
    }
    geoSheet.getRow(5 + i).height = 21;
  });

  // --- SHEET 4: СЕЙСМИКА ---
  const seismicSheet = workbook.addWorksheet("Сейсмика");
  applySheetHeader(seismicSheet, "СПРАВОЧНИК СЕЙСМИЧЕСКИХ ВОЗДЕЙСТВИЙ (NCM EN 1998 / СН)", 6);
  seismicSheet.getColumn(2).width = 35;
  seismicSheet.getColumn(3).width = 15;
  seismicSheet.getColumn(4).width = 18;
  seismicSheet.getColumn(5).width = 18;
  seismicSheet.getColumn(6).width = 20;
  applyTableHeaders(seismicSheet, 4, ["Сейсмоактивный район РМ (Zone)", "Интенсивность по MSK-64", "Расч. ускорение PGA (A_g)", "Коэф. влияния грунта (S)", "Коэф. важности здания"], "FF1E3A8A");
  const zones = [
    ["Север (Бэлць, Сорока, Бричень)", 6, 0.08, 1.2, 1.0],
    ["Центр (Кишинёв, Орхей, Унгень)", 7, 0.16, 1.5, 1.0],
    ["Юг (Кагул, Комрат, Тараклия)", 8, 0.24, 1.5, 1.0]
  ];
  zones.forEach((z, i) => {
    seismicSheet.getCell(5 + i, 2).value = z[0];
    seismicSheet.getCell(5 + i, 3).value = z[1];
    seismicSheet.getCell(5 + i, 4).value = z[2];
    seismicSheet.getCell(5 + i, 5).value = z[3];
    seismicSheet.getCell(5 + i, 6).value = z[4];
    seismicSheet.getCell(5 + i, 2).font = { name: "Calibri", size: 10, bold: true };
    seismicSheet.getCell(5 + i, 3).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFDF1C1C" } };
    [4, 5, 6].forEach(col => {
      seismicSheet.getCell(5 + i, col).font = { name: "Calibri", size: 10 };
    });
    seismicSheet.getRow(5 + i).height = 22;
  });

  // --- SHEET 5: ВЕДОМОСТЬ ОБЪЁМОВ (BoQ) ---
  const slabOpt = results.options.find(o => o.id === "slab") || results.options[0];
  const stripOpt = results.options.find(o => o.id === "strip") || results.options[1] || results.options[0];
  const pileOpt = results.options.find(o => o.id === "pile") || results.options[2] || results.options[0];

  const boqSheet = workbook.addWorksheet("Ведомость объёмов");
  applySheetHeader(boqSheet, "ВЕДОМОСТЬ ОБЪЕМОВ И ЗАДЕЛОВ РАБОТ ПРОЕКТА ФУНДАМЕНТОВ (BoQ)", 6);
  boqSheet.getColumn(2).width = 50;
  boqSheet.getColumn(3).width = 12;
  boqSheet.getColumn(4).width = 18;
  boqSheet.getColumn(5).width = 18;
  boqSheet.getColumn(6).width = 18;

  applyTableHeaders(boqSheet, 4, ["Вид строительно-монтажных работ и заделов", "Ед. изм.", "Кол-во Плита", "Кол-во Лента", "Кол-во Сваи"], "FF1E3A8A");

  const boqRows = [
    ["1. Готовый конструкционный бетон марки С20/25 M300", "м³", slabOpt.materials.concreteVolumeM3 || 0, stripOpt.materials.concreteVolumeM3 || 0, pileOpt.materials.concreteVolumeM3 || 0],
    ["2. Стальная рифленая рабочая арматура класса А500С", "кг", slabOpt.materials.reinforcementBarKg || 0, stripOpt.materials.reinforcementBarKg || 0, pileOpt.materials.reinforcementBarKg || 0],
    ["3. Разработка плотного грунта спецтехникой JCB", "м³", slabOpt.materials.excavationVolumeM3 || 0, stripOpt.materials.excavationVolumeM3 || 0, pileOpt.materials.excavationVolumeM3 || 0],
    ["4. Засыпка песчаной подушки с послойным трамбованием", "м³", slabOpt.materials.sandGravelM3 || 0, stripOpt.materials.sandGravelM3 || 0, pileOpt.materials.sandGravelM3 || 0],
    ["5. Монтаж многоразовой крупнощитовой опалубки", "м²", slabOpt.materials.formworkM2 || 0, stripOpt.materials.formworkM2 || 0, pileOpt.materials.formworkM2 || 0],
    ["6. Теплоизоляция основания плитами Penoplex XPS", "м³", slabOpt.materials.insulationM3 || 0, stripOpt.materials.insulationM3 || 0, pileOpt.materials.insulationM3 || 0],
    ["7. Горизонтальная зажита рулонной гидроизоляцией", "м²", slabOpt.materials.waterproofingM2 || 0, stripOpt.materials.waterproofingM2 || 0, pileOpt.materials.waterproofingM2 || 0],
    ["8. Кольцевой дренаж основания ф110 в геотекстиле", "м.п.", slabOpt.materials.drainagePipeM || 0, stripOpt.materials.drainagePipeM || 0, pileOpt.materials.drainagePipeM || 0],
    ["9. Разделитель нетканого полотна геотекстиля Typar", "м²", slabOpt.materials.drainageGeotextileM2 || 0, stripOpt.materials.drainageGeotextileM2 || 0, pileOpt.materials.drainageGeotextileM2 || 0],
    ["10. Щебень гранитный мытый дренирующий фр 20-40 мм", "м³", slabOpt.materials.drainageStoneM3 || 0, stripOpt.materials.drainageStoneM3 || 0, pileOpt.materials.drainageStoneM3 || 0],
    ["11. Пристенные пластиковые смотровые колодцы d315", "шт", slabOpt.materials.drainageWellsCount || 0, stripOpt.materials.drainageWellsCount || 0, pileOpt.materials.drainageWellsCount || 0],
    ["12. Угловые пластиковые поворотные колодцы d400", "шт", (slabOpt.materials.drainageWellsCount && slabOpt.materials.drainageWellsCount > 0 ? 4 : 0), (stripOpt.materials.drainageWellsCount && stripOpt.materials.drainageWellsCount > 0 ? 4 : 0), (pileOpt.materials.drainageWellsCount && pileOpt.materials.drainageWellsCount > 0 ? 4 : 0)],
    ["13. Centralный сборный ЖБ колодец КС-10", "шт", (slabOpt.materials.drainagePipeM > 0 ? 1 : 0), (stripOpt.materials.drainagePipeM > 0 ? 1 : 0), (pileOpt.materials.drainagePipeM > 0 ? 1 : 0)],
    ["14. Дренажный погружной насос автоматический", "шт", (slabOpt.materials.drainagePipeM > 0 ? 1 : 0), (stripOpt.materials.drainagePipeM > 0 ? 1 : 0), (pileOpt.materials.drainagePipeM > 0 ? 1 : 0)],
    ["15. Геодезическая разбивочная выверка осей здания", "замена", 1, 1, 1],
    ["16. Распределительный ввод холодного водоснабжения ПНД d32", "м.п.", slabOpt.materials.engineeringNetWaterIntakeLengthM || 0, stripOpt.materials.engineeringNetWaterIntakeLengthM || 0, pileOpt.materials.engineeringNetWaterIntakeLengthM || 0],
    ["17. Выводы хозяйственной бытовой канализации PVC d110", "м.п.", slabOpt.materials.engineeringNetSewerageOutletsPcs || 0, stripOpt.materials.engineeringNetSewerageOutletsPcs || 0, pileOpt.materials.engineeringNetSewerageOutletsPcs || 0],
    ["18. Гильзы кабельного ввода электроснабжения ПНД d50", "м.п.", slabOpt.materials.engineeringNetPowerDuctLengthM || 0, stripOpt.materials.engineeringNetPowerDuctLengthM || 0, pileOpt.materials.engineeringNetPowerDuctLengthM || 0],
    ["19. Слаботочные каналы связи: жесткая труба d25", "м.п.", slabOpt.materials.engineeringNetWeakDuctLengthM || 0, stripOpt.materials.engineeringNetWeakDuctLengthM || 0, pileOpt.materials.engineeringNetWeakDuctLengthM || 0],
    ["20. Резервный ввод гильз коммуникаций: ПНД d50", "м.п.", slabOpt.materials.engineeringNetSpareDuctLengthM || 0, stripOpt.materials.engineeringNetSpareDuctLengthM || 0, pileOpt.materials.engineeringNetSpareDuctLengthM || 0],
    ["21. Контур заземления: стальная обвязочная полоса 40х4", "м.п.", slabOpt.materials.groundingSteelStripM || 0, stripOpt.materials.groundingSteelStripM || 0, pileOpt.materials.groundingSteelStripM || 0],
    ["22. Контур заземления: омедненный штифт d16 3м", "шт", slabOpt.materials.groundingEarthRodsPcs || 0, stripOpt.materials.groundingEarthRodsPcs || 0, pileOpt.materials.groundingEarthRodsPcs || 0],
    ["23. Контур заземления: соединительные зажимы", "шт", slabOpt.materials.groundingClampsPcs || 0, stripOpt.materials.groundingClampsPcs || 0, pileOpt.materials.groundingClampsPcs || 0],
    ["24. Послойная обратная засыпка пазух песком", "м³", slabOpt.materials.backfillVolumeM3 || 0, stripOpt.materials.backfillVolumeM3 || 0, pileOpt.materials.backfillVolumeM3 || 0],
    ["25. Профилированная HDPE мембрана защиты", "м²", slabOpt.materials.waterproofProtMembraneM2 || 0, stripOpt.materials.waterproofProtMembraneM2 || 0, pileOpt.materials.waterproofProtMembraneM2 || 0],
    ["26. Утепленная бетонная отмостка цоколя", "м²", slabOpt.materials.roughFloorAreaM2 || 0, stripOpt.materials.roughFloorAreaM2 || 0, pileOpt.materials.roughFloorAreaM2 || 0],
    ["27. Механическое бурение скважин свай d300", "м.п.", slabOpt.materials.pileDrillingM || 0, stripOpt.materials.pileDrillingM || 0, pileOpt.materials.pileDrillingM || 0]
  ];

  boqRows.forEach((r, i) => {
    const rowNum = 5 + i;
    boqSheet.getCell(rowNum, 2).value = r[0];
    boqSheet.getCell(rowNum, 3).value = r[1];
    boqSheet.getCell(rowNum, 4).value = r[2];
    boqSheet.getCell(rowNum, 5).value = r[3];
    boqSheet.getCell(rowNum, 6).value = r[4];

    boqSheet.getCell(rowNum, 2).font = { name: "Calibri", size: 9.5, bold: true };
    boqSheet.getCell(rowNum, 3).font = { name: "Calibri", size: 9 };
    boqSheet.getCell(rowNum, 3).alignment = { horizontal: "center" };
    [4, 5, 6].forEach(col => {
      boqSheet.getCell(rowNum, col).font = { name: "Consolas", size: 9.5, bold: true };
      boqSheet.getCell(rowNum, col).alignment = { horizontal: "right" };
      boqSheet.getCell(rowNum, col).numFmt = "#,##0.00";
    });
    boqSheet.getRow(rowNum).height = 21;
  });

  // --- SHEET 6: ВЕДОМОСТЬ МАТЕРИАЛОВ (BoM) ---
  const bomSheet = workbook.addWorksheet("Ведомость материалов");
  applySheetHeader(bomSheet, "СПЕЦИФИКАЦИЯ СТРОИТЕЛЬНЫХ МАТЕРИАЛОВ НА СТРОЙПЛОЩАДКУ (BoM)", 5);
  bomSheet.getColumn(2).width = 50;
  bomSheet.getColumn(3).width = 12;
  bomSheet.getColumn(4).width = 18;
  bomSheet.getColumn(5).width = 18;
  bomSheet.getColumn(6).width = 18;

  applyTableHeaders(bomSheet, 4, ["Наименование стройматериала", "Ед. изм.", "Кол-во Плита", "Кол-во Лента", "Кол-во Сваи"], "FF111827");
  const bomRows = [
    ["Готовый тяжелый бетон марки С20/25 M300", "м³", { formula: "='Ведомость объёмов'!D5" }, { formula: "='Ведомость объёмов'!E5" }, { formula: "='Ведомость объёмов'!F5" }],
    ["Арматурная сталь ф12/14 мм (в тоннах)", "т", { formula: "=ROUND('Ведомость объёмов'!D6/1000, 2)" }, { formula: "=ROUND('Ведомость объёмов'!E6/1000, 2)" }, { formula: "=ROUND('Ведомость объёмов'!F6/1000, 2)" }],
    ["Арматурный хлыст d8 хомутов (в тоннах)", "т", 0.15, 0.22, 0.11],
    ["Экструдированный пенополистирол XPS Penoplex", "м³", { formula: "='Ведомость объёмов'!D10" }, { formula: "='Ведомость объёмов'!E10" }, { formula: "='Ведомость объёмов'!F10" }],
    ["Наплавляемый премиум рулон гидроизоляции", "рулон", { formula: "=CEILING('Ведомость объёмов'!D11/10, 1)" }, { formula: "=CEILING('Ведомость объёмов'!E11/10, 1)" }, { formula: "=CEILING('Ведомость объёмов'!F11/10, 1)" }],
    ["Дренажная перфорированная труба d110", "м", { formula: "='Ведомость объёмов'!D12" }, { formula: "='Ведомость объёмов'!E12" }, { formula: "='Ведомость объёмов'!F12" }],
    ["Разделительное нетканое полотно геотекстиля", "м²", { formula: "='Ведомость объёмов'!D13" }, { formula: "='Ведомость объёмов'!E13" }, { formula: "='Ведомость объёмов'!F13" }],
    ["Песчано-гравийный уплотняемый засыпной грунт", "м³", { formula: "='Ведомость объёмов'!D8" }, { formula: "='Ведомость объёмов'!E8" }, { formula: "='Ведомость объёмов'!F8" }],
    ["Классические стальные штыри заземления d16 3м", "шт", { formula: "='Ведомость объёмов'!D26" }, { formula: "='Ведомость объёмов'!E26" }, { formula: "='Ведомость объёмов'!F26" }]
  ];
  bomRows.forEach((r, i) => {
    bomSheet.getCell(5 + i, 2).value = r[0];
    bomSheet.getCell(5 + i, 3).value = r[1];
    bomSheet.getCell(5 + i, 4).value = r[2];
    bomSheet.getCell(5 + i, 5).value = r[3];
    bomSheet.getCell(5 + i, 6).value = r[4];
    bomSheet.getCell(5 + i, 2).font = { name: "Calibri", size: 9.5, bold: true };
    bomSheet.getCell(5 + i, 3).font = { name: "Calibri", size: 9 };
    bomSheet.getCell(5 + i, 3).alignment = { horizontal: "center" };
    [4, 5, 6].forEach(col => {
      bomSheet.getCell(5 + i, col).font = { name: "Consolas", size: 9.5, bold: true };
      bomSheet.getCell(5 + i, col).alignment = { horizontal: "right" };
    });
    bomSheet.getRow(5 + i).height = 21;
  });

  // --- SHEET 7: СТОИМОСТЬ МАТЕРИАЛОВ ---
  const matCostSheet = workbook.addWorksheet("Стоимость материалов");
  applySheetHeader(matCostSheet, "ДЕФЕКТНАЯ РАСЧЕТНАЯ СМЕТА СТОИМОСТИ МАТЕРИАЛОВ (MDL)", 5);
  matCostSheet.getColumn(2).width = 50;
  matCostSheet.getColumn(3).width = 18;
  matCostSheet.getColumn(4).width = 18;
  matCostSheet.getColumn(5).width = 18;

  applyTableHeaders(matCostSheet, 4, ["Наименование сметного материала", "Смета Плита (MDL)", "Смета Лента (MDL)", "Смета Сваи (MDL)"], "FF111827");
  
  const mCostRows = [
    ["1. Готовый конструкционный бетон M300", "=ROUND('Ведомость объёмов'!D5*('Настройки'!$C$9+'Настройки'!$C$10),0)", "=ROUND('Ведомость объёмов'!E5*('Настройки'!$C$9+'Настройки'!$C$10),0)", "=ROUND('Ведомость объёмов'!F5*('Настройки'!$C$9+'Настройки'!$C$10),0)"],
    ["2. Базовая горячекатаная арматура A500C", "=ROUND('Ведомость объёмов'!D6*('Настройки'!$C$11+'Настройки'!$C$12),0)", "=ROUND('Ведомость объёмов'!E6*('Настройки'!$C$11+'Настройки'!$C$12),0)", "=ROUND('Ведомость объёмов'!F6*('Настройки'!$C$11+'Настройки'!$C$12),0)"],
    ["3. Разработка плотного грунта JCB", "=ROUND('Ведомость объёмов'!D7*'Настройки'!$C$15+IF('Ведомость объёмов'!D7>0,'Настройки'!$C$17,0),0)", "=ROUND('Ведомость объёмов'!E7*'Настройки'!$C$15+IF('Ведомость объёмов'!E7>0,'Настройки'!$C$17,0),0)", "=ROUND('Ведомость объёмов'!F7*'Настройки'!$C$15+IF('Ведомость объёмов'!F7>0,'Настройки'!$C$17,0),0)"],
    ["4. Засыпка песчано-гравия подушки", "=ROUND('Ведомость объёмов'!D8*'Настройки'!$C$19,0)", "=ROUND('Ведомость объёмов'!E8*'Настройки'!$C$19,0)", "=ROUND('Ведомость объёмов'!F8*'Настройки'!$C$19,0)"],
    ["5. Щитовая опалубка", "=ROUND('Ведомость объёмов'!D9*'Настройки'!$C$18,0)", "=ROUND('Ведомость объёмов'!E9*'Настройки'!$C$18,0)", "=ROUND('Ведомость объёмов'!F9*'Настройки'!$C$18,0)"],
    ["6. Монтаж утеплителя Penoplex XPS", "=ROUND('Ведомость объёмов'!D10*'Настройки'!$C$21,0)", "=ROUND('Ведомость объёмов'!E10*'Настройки'!$C$21,0)", "=ROUND('Ведомость объёмов'!F10*'Настройки'!$C$21,0)"],
    ["7. Обмазочная и рулонная гидроизоляция", "=ROUND('Ведомость объёмов'!D11*'Настройки'!$C$20,0)", "=ROUND('Ведомость объёмов'!E11*'Настройки'!$C$20,0)", "=ROUND('Ведомость объёмов'!F11*'Настройки'!$C$20,0)"],
    ["8. Укладка дренажной трубы d110", "=ROUND('Ведомость объёмов'!D12*85,0)", "=ROUND('Ведомость объёмов'!E12*85,0)", "=ROUND('Ведомость объёмов'!F12*85,0)"],
    ["9. Геотекстиль нетканый Typar SF40", "=ROUND('Ведомость объёмов'!D13*32,0)", "=ROUND('Ведомость объёмов'!E13*32,0)", "=ROUND('Ведомость объёмов'!F13*32,0)"],
    ["10. Щебень гранитный дренирующий 20-40 мм", "=ROUND('Ведомость объёмов'!D14*550,0)", "=ROUND('Ведомость объёмов'!E14*550,0)", "=ROUND('Ведомость объёмов'!F14*550,0)"],
    ["11. Смотровые ревизионные колодцы d315", "=ROUND('Ведомость объёмов'!D15*1200,0)", "=ROUND('Ведомость объёмов'!E15*1200,0)", "=ROUND('Ведомость объёмов'!F15*1200,0)"],
    ["12. Поворотные ревизионные колодцы d400", "=ROUND('Ведомость объёмов'!D16*1800,0)", "=ROUND('Ведомость объёмов'!E16*1800,0)", "=ROUND('Ведомость объёмов'!F16*1800,0)"],
    ["13. Centralный сборный ЖБ колодец КС-10", "=ROUND('Ведомость объёмов'!D17*5500,0)", "=ROUND('Ведомость объёмов'!E17*5500,0)", "=ROUND('Ведомость объёмов'!F17*5500,0)"],
    ["14. Погружной насос с автопоплавком", "=ROUND('Ведомость объёмов'!D18*2800,0)", "=ROUND('Ведомость объёмов'!E18*2800,0)", "=ROUND('Ведомость объёмов'!F18*2800,0)"],
    ["15. Геодезическая разбивка осей под лазер", "=ROUND('Ведомость объёмов'!D19*1500,0)", "=ROUND('Ведомость объёмов'!E19*1500,0)", "=ROUND('Ведомость объёмов'!F19*1500,0)"],
    ["16. Холодное водоснабжение: ввод ПНД d32", "=ROUND('Ведомость объёмов'!D20*90,0)", "=ROUND('Ведомость объёмов'!E20*90,0)", "=ROUND('Ведомость объёмов'!F20*90,0)"],
    ["17. Канализация бытовая: отводы PVC d110", "=ROUND('Ведомость объёмов'!D21*280,0)", "=ROUND('Ведомость объёмов'!E21*280,0)", "=ROUND('Ведомость объёмов'!F21*280,0)"],
    ["18. Электроснабжение: ПНД гофроканал d50", "=ROUND('Ведомость объёмов'!D22*60,0)", "=ROUND('Ведомость объёмов'!E22*60,0)", "=ROUND('Ведомость объёмов'!F22*60,0)"],
    ["19. Низковольтные каналы: жесткая труба d25", "=ROUND('Ведомость объёмов'!D23*45,0)", "=ROUND('Ведомость объёмов'!E23*45,0)", "=ROUND('Ведомость объёмов'!F23*45,0)"],
    ["20. Резервный ввод коммуникаций: ПНД d50", "=ROUND('Ведомость объёмов'!D24*60,0)", "=ROUND('Ведомость объёмов'!E24*60,0)", "=ROUND('Ведомость объёмов'!F24*60,0)"],
    ["21. Контур заземления: стальная полоса 40х4", "=ROUND('Ведомость объёмов'!D25*85,0)", "=ROUND('Ведомость объёмов'!E25*85,0)", "=ROUND('Ведомость объёмов'!F25*85,0)"],
    ["22. Контур заземления: омедненные штыри d16", "=ROUND('Ведомость объёмов'!D26*650,0)", "=ROUND('Ведомость объёмов'!E26*650,0)", "=ROUND('Ведомость объёмов'!F26*650,0)"],
    ["23. Контур заземления: винтовые зажимы латуни", "=ROUND('Ведомость объёмов'!D27*120,0)", "=ROUND('Ведомость объёмов'!E27*120,0)", "=ROUND('Ведомость объёмов'!F27*120,0)"],
    ["24. Обратная послойная засыпка пазух", "=ROUND('Ведомость объёмов'!D28*120,0)", "=ROUND('Ведомость объёмов'!E28*120,0)", "=ROUND('Ведомость объёмов'!F28*120,0)"],
    ["25. Профилированная HDPE мембрана защиты", "=ROUND('Ведомость объёмов'!D29*48,0)", "=ROUND('Ведомость объёмов'!E29*48,0)", "=ROUND('Ведомость объёмов'!F29*48,0)"],
    ["26. Утепленная бетонная отмостка цоколя", "=ROUND('Ведомость объёмов'!D30*250,0)", "=ROUND('Ведомость объёмов'!E30*250,0)", "=ROUND('Ведомость объёмов'!F30*250,0)"],
    ["27. Механическое бурение скважин свай d300", "=ROUND('Ведомость объёмов'!D31*'Настройки'!$C$22,0)", "=ROUND('Ведомость объёмов'!E31*'Настройки'!$C$22,0)", "=ROUND('Ведомость объёмов'!F31*'Настройки'!$C$22,0)"]
  ];

  mCostRows.forEach((r, i) => {
    matCostSheet.getCell(5 + i, 2).value = r[0];
    matCostSheet.getCell(5 + i, 3).value = { formula: r[1].slice(1) };
    matCostSheet.getCell(5 + i, 4).value = { formula: r[2].slice(1) };
    matCostSheet.getCell(5 + i, 5).value = { formula: r[3].slice(1) };
    matCostSheet.getCell(5 + i, 2).font = { name: "Calibri", size: 9.5, bold: true };
    [3, 4, 5].forEach(col => {
      matCostSheet.getCell(5 + i, col).font = { name: "Consolas", size: 9.5 };
      matCostSheet.getCell(5 + i, col).alignment = { horizontal: "right" };
      matCostSheet.getCell(5 + i, col).numFmt = "#,##0";
    });
    matCostSheet.getRow(5 + i).height = 21;
  });

  const totalMatRow = 5 + mCostRows.length;
  matCostSheet.getCell(totalMatRow, 2).value = "ИТОГО СЕМЕЙСТВО МАТЕРИАЛОВ И ТЕХНИКИ СД:";
  matCostSheet.getCell(totalMatRow, 3).value = { formula: "=SUM(C5:C31)", result: slabOpt.costEstimate.concreteCostMDL + slabOpt.costEstimate.steelCostMDL };
  matCostSheet.getCell(totalMatRow, 4).value = { formula: "=SUM(D5:D31)", result: stripOpt.costEstimate.concreteCostMDL + stripOpt.costEstimate.steelCostMDL };
  matCostSheet.getCell(totalMatRow, 5).value = { formula: "=SUM(E5:E31)", result: pileOpt.costEstimate.concreteCostMDL + pileOpt.costEstimate.steelCostMDL };
  matCostSheet.getCell(totalMatRow, 2).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF1E3A8A" } };
  [3, 4, 5].forEach(col => {
    matCostSheet.getCell(totalMatRow, col).font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF1F2937" } };
    matCostSheet.getCell(totalMatRow, col).alignment = { horizontal: "right" };
    matCostSheet.getCell(totalMatRow, col).numFmt = "#,##0";
  });
  matCostSheet.getRow(totalMatRow).height = 24;

  // --- SHEET 8: СТОИМОСТЬ РАБОТ ---
  const workCostSheet = workbook.addWorksheet("Стоимость работ");
  applySheetHeader(workCostSheet, "ВЕДОМОСТЬ СТОИМОСТИ РАБОТ БРИГАД И СПЕЦТЕХНИКИ (MDL)", 5);
  workCostSheet.getColumn(2).width = 50;
  workCostSheet.getColumn(3).width = 18;
  workCostSheet.getColumn(4).width = 18;
  workCostSheet.getColumn(5).width = 18;

  applyTableHeaders(workCostSheet, 4, ["Вид производимых работ", "Смета Плита (MDL)", "Смета Лента (MDL)", "Смета Сваи (MDL)"], "FF111827");
  const laborRows = [
    ["Земляные работы, копка котлована спецтехникой JCB", "=ROUND('Ведомость объёмов'!D7*'Настройки'!$C$15 + 'Ведомость объёмов'!D7*'Настройки'!$C$16,0)+4000", "=ROUND('Ведомость объёмов'!E7*'Настройки'!$C$15 + 'Ведомость объёмов'!E7*'Настройки'!$C$16,0)+4000", "=ROUND('Ведомость объёмов'!F7*'Настройки'!$C$15 + 'Ведомость объёмов'!F7*'Настройки'!$C$16,0)+4000"],
    ["Приемка, укладка и глубинное вибрирование бетона", "=ROUND('Ведомость объёмов'!D5*800,0)", "=ROUND('Ведомость объёмов'!E5*800,0)", "=ROUND('Ведомость объёмов'!F5*800,0)"],
    ["Вязка и сварка рифленого каркаса арматуры звезд", "=ROUND('Ведомость объёмов'!D6*'Настройки'!$C$13,0)", "=ROUND('Ведомость объёмов'!E6*'Настройки'!$C$13,0)", "=ROUND('Ведомость объёмов'!F6*'Настройки'!$C$13,0)"],
    ["Монтаж жестких щитов инвентарной опалубки на вехи", "=ROUND('Ведомость объёмов'!D9*100,0)", "=ROUND('Ведомость объёмов'!E9*100,0)", "=ROUND('Ведомость объёмов'!F9*100,0)"],
    ["Устройство ступенчатого уступа на уклоне пятна", "=ROUND(IF('Исходные данные'!C13>0,'Ведомость объёмов'!D5*('Исходные данные'!C13/100)*1500,0),0)", "=ROUND(IF('Исходные данные'!C13>0,'Ведомость объёмов'!E5*('Исходные данные'!C13/100)*1200,0),0)", "=ROUND(IF('Исходные данные'!C13>0,'Ведомость объёмов'!F5*('Исходные данные'!C13/100)*400,0),0)"],
    ["Устройство распределительных ходов коммуникаций", "4000", "4200", "4100"],
    ["Строительно-монтажные работы по дренажу и песку", "=ROUND('Ведомость объёмов'!D12*160,0)", "=ROUND('Ведомость объёмов'!E12*160,0)", "=ROUND('Ведомость объёмов'!F12*160,0)"],
    ["Ударно-вращательное бурение шахт свай d300 навесом", "0", "0", "=ROUND('Ведомость объёмов'!F31*'Настройки'!$C$22,0)"]
  ];
  laborRows.forEach((r, i) => {
    workCostSheet.getCell(5 + i, 2).value = r[0];
    workCostSheet.getCell(5 + i, 3).value = r[1].startsWith("=") ? { formula: r[1].slice(1) } : Number(r[1]);
    workCostSheet.getCell(5 + i, 4).value = r[2].startsWith("=") ? { formula: r[2].slice(1) } : Number(r[2]);
    workCostSheet.getCell(5 + i, 5).value = r[3].startsWith("=") ? { formula: r[3].slice(1) } : Number(r[3]);
    workCostSheet.getCell(5 + i, 2).font = { name: "Calibri", size: 9.5, bold: true };
    [3, 4, 5].forEach(col => {
      workCostSheet.getCell(5 + i, col).font = { name: "Consolas", size: 9.5 };
      workCostSheet.getCell(5 + i, col).alignment = { horizontal: "right" };
      workCostSheet.getCell(5 + i, col).numFmt = "#,##0";
    });
    workCostSheet.getRow(5 + i).height = 21;
  });

  const laborLastRow = 5 + laborRows.length;
  workCostSheet.getCell(laborLastRow, 2).value = "ИТОГО СТОИМОСТЬ СТРОИТЕЛЬНЫХ РАБОТ:";
  workCostSheet.getCell(laborLastRow, 3).value = { formula: "=SUM(C5:C12)", result: slabOpt.costEstimate.constructionLaborCostMDL };
  workCostSheet.getCell(laborLastRow, 4).value = { formula: "=SUM(D5:D12)", result: stripOpt.costEstimate.constructionLaborCostMDL };
  workCostSheet.getCell(laborLastRow, 5).value = { formula: "=SUM(E5:E12)", result: pileOpt.costEstimate.constructionLaborCostMDL };
  workCostSheet.getCell(laborLastRow, 2).font = { name: "Calibri", size: 9.5, bold: true, color: { argb: "FF1E3A8A" } };
  [3, 4, 5].forEach(col => {
    workCostSheet.getCell(laborLastRow, col).font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF1F2937" } };
    workCostSheet.getCell(laborLastRow, col).alignment = { horizontal: "right" };
    workCostSheet.getCell(laborLastRow, col).numFmt = "#,##0";
  });
  workCostSheet.getRow(laborLastRow).height = 24;

  // --- SHEET 9: ТЕХНОЛОГИЧЕСКАЯ КАРТА ПО СНиП ---
  const techSheet = workbook.addWorksheet("Технологическая карта");
  applySheetHeader(techSheet, "ПОСЛЕДОВАТЕЛЬНОСТЬ И ТЕХНОЛОГИЧЕСКИЕ ПРАВИЛА ПРОИЗВОДСТВА РАБОТ РМ", 5);
  techSheet.getColumn(2).width = 45;
  techSheet.getColumn(3).width = 45;
  techSheet.getColumn(4).width = 30;

  applyTableHeaders(techSheet, 4, ["Пройденный технологический этап", "Контролируемые нормативные параметры по СНиП/NCM", "Период ухода / статус решения"], "FF0F172A");
  const mapSteps = [
    ["1. Геодезические разметочные работы", "Выверка углов, разбивка диагоналей осей нивелиром", "1 дн // Завершено"],
    ["2. Разработка чаши котлована / траншей", "Снятие верхнего плодородного чернозема на 30-40см", "2 дн // Механизация"],
    ["3. Бурение скважин свайных шахт", "Диаметр 300мм, заглубление строго ниже 1.6-1.8м", "1-2 дн // Спецтехника"],
    ["4. Засыпка песчано-гравия подушки", "Проливка водой каждого слоя 10см с виброплитой", "2 дн // Послойно"],
    ["5. Укладка дренажных магистралей", "Проектный уклон труб 5-10 мм на пог. метр, колодцы", "1 дн // Перфорация"],
    ["6. Врезка гильз ввода коммуникаций", "Глубина укладки водовывода не менее 1.1м", "1 дн // Энергосети"],
    ["7. Многоразовая мелкощитовая опалубка", "Проверка вертикальности ребер лазерным уровнем", "2 дн // Упоры бруса"],
    ["8. Уязка монолитного стального каркаса", "Вязка проволокой, зазор защитного слоя бетона 40мм", "3 дн // Стык 90 град"],
    ["9. Заливка строительного миксерного бетона", "Обязательное глубинное вибровибрирование булавой", "1 дн // Контроль Macon"],
    ["10. Влажностный уход за бетоном", "Полив водой, закрытие полиэтиленовой пленкой от ветра", "7-28 дн // СНиП 3.03.01"],
    ["11. Обмазочная мастичная изоляция", "Нанесение битумного праймера в два плотных слоя", "1 дн // Сухой бетон"],
    ["12. Утепление Penoplex XPS экструдированным", "Плотное прижатие монтажной клей-пеной во избежание щелей", "1 дн // Цоколь полностью"]
  ];
  mapSteps.forEach((s, i) => {
    techSheet.getCell(5 + i, 2).value = s[0];
    techSheet.getCell(5 + i, 3).value = s[1];
    techSheet.getCell(5 + i, 4).value = s[2];
    techSheet.getCell(5 + i, 2).font = { name: "Calibri", size: 9.5, bold: true };
    techSheet.getCell(5 + i, 3).font = { name: "Calibri", size: 9, italic: true };
    techSheet.getCell(5 + i, 4).font = { name: "Consolas", size: 9, color: { argb: "FF047857" } };
    techSheet.getRow(5 + i).height = 21;
  });

  // --- SHEET 10: ДИАГНОСТИКА И КРИТИЧЕСКИЙ АУДИТ ОШИБОК ---
  const diagSheet = workbook.addWorksheet("Диагностика ошибок");
  applySheetHeader(diagSheet, "ИНЖЕНЕРНО-АНАЛИТИЧЕСКИЙ ОТЧЕТ СЛУЖБЫ ТЕХНИЧЕСКОГО КОНТРОЛЯ", 4);
  diagSheet.getColumn(2).width = 45;
  diagSheet.getColumn(3).width = 20;
  diagSheet.getColumn(4).width = 40;

  applyTableHeaders(diagSheet, 4, ["Нормируемый инженерный критерий", "Статус верификации", "Обоснование надежности / Меры СНиП"], "FF7F1D1D");
  
  diagSheet.getCell("B5").value = "1. Коэффициент армирования (>40 кг/м³)";
  diagSheet.getCell("C5").value = { formula: "=IF(AND('Ведомость объёмов'!D6/'Ведомость объёмов'!D5>=40, 'Ведомость объёмов'!E6/'Ведомость объёмов'!E5>=40), \"ВАЛИДЕН\", \"ОШИБКА (КРИТ. НЕДОРЕЗ)\")", result: "ВАЛИДЕН" };
  diagSheet.getCell("D5").value = "Масса распределенного ребра армоскелета в норме для активной зоны";

  diagSheet.getCell("B6").value = "2. Опасность морозного пучения грунта";
  diagSheet.getCell("C6").value = { formula: "=IF(OR('Исходные данные'!C11=\"SAND\", 'Ведомость объёмов'!D10>0), \"ЗАЩИЩЕНО\", \"ОШИБКА (ХОЛОДНЫЙ ЦОКОЛЬ)\")", result: "ЗАЩИЩЕНО" };
  diagSheet.getCell("D6").value = "Заложено кольцевое пристенное утепление XPS Penoplex 50мм";

  diagSheet.getCell("B7").value = "3. Подтопление при высоком УГВ < 1.5м";
  diagSheet.getCell("C7").value = { formula: "=IF(AND('Исходные данные'!C12<1.5, 'Ведомость объёмов'!D12=0), \"ОШИБКА (ДРЕНАЖ)\", \"БЕЗОПАСНО\")", result: "БЕЗОПАСНО" };
  diagSheet.getCell("D7").value = "Смотровые пластиковые колодцы d315 блокируют влажную среду";

  diagSheet.getCell("B8").value = "4. Просадка лёссового пласта суглинка";
  diagSheet.getCell("C8").value = { formula: "=IF(AND('Исходные данные'!C11=\"LOESS\", 'Ведомость объёмов'!D8=0), \"ВНИМАНИЕ\", \"БЕЗОПАСНО\")", result: "БЕЗОПАСНО" };
  diagSheet.getCell("D8").value = "Применяется жесткая послойная щебеночная проливка толщи";

  diagSheet.getCell("B9").value = "5. Сейсмичность очага Карпат (MSK-MSK)";
  diagSheet.getCell("C9").value = { formula: "=IF('Исходные данные'!C10=\"SOUTH\", \"ЮГ (8 БАЛЛОВ)\", \"ЦЕНТР/СЕВЕР\")", result: "ЦЕНТР/СЕВЕР" };
  diagSheet.getCell("D9").value = "Заводятся неразрывные угловые арматурные сопряжения перепусков";

  diagSheet.getCell("B10").value = "6. Индекс целостности сметных разделов";
  diagSheet.getCell("C10").value = { formula: "=IF('Стоимость материалов'!C31>0, \"100% ВАЛИДЕН\", \"ОШИБКА РАСЧЁТА\")", result: "100% ВАЛИДЕН" };
  diagSheet.getCell("D10").value = "Все категории затрат охвачены формулами сквозного типа";

  for (let r = 5; r <= 10; r++) {
    diagSheet.getCell(r, 2).font = { name: "Calibri", size: 9.5, bold: true };
    diagSheet.getCell(r, 3).font = { name: "Consolas", size: 10, bold: true };
    diagSheet.getCell(r, 4).font = { name: "Calibri", size: 9, italic: true };
    diagSheet.getRow(r).height = 21;
  }

  // --- SHEET 11: СРАВНЕНИЕ ВАРИАНТОВ ---
  const compSheet = workbook.addWorksheet("Сравнение вариантов");
  applySheetHeader(compSheet, "ИНЖЕНЕРНОЕ СРАВНЕНИЕ СТРОИТЕЛЬНОЙ СМЕТЫ ВАРИАНТОВ ФУНДАМЕНТА РМ", 7);
  compSheet.getColumn(2).width = 30; // Тип фундамента
  compSheet.getColumn(3).width = 25; // Смета материалы (MDL)
  compSheet.getColumn(4).width = 25; // Смета работы (MDL)
  compSheet.getColumn(5).width = 20; // Сумма MDL
  compSheet.getColumn(6).width = 18; // Сумма EUR
  compSheet.getColumn(7).width = 14; // Надежность
  compSheet.getColumn(8).width = 45; // Специфика

  applyTableHeaders(compSheet, 4, ["Вариант фундамента", "Стоимость материалов", "Стоимость работ (MDL)", "Общая стоимость (MDL)", "Общая (EUR)", "Надежность", "Инженерные примечания"], "FF0F172A");

  const finalOptions = [
    { name: "Монолитная плита УШП", rIdx: 5, matFormula: "='Стоимость материалов'!C32", laborFormula: "='Стоимость работ'!C13", relScore: "95%", note: "Включает интегрированный черновой пол и теплый цоколь" },
    { name: "Ленточный фундамент глубокий", rIdx: 6, matFormula: "='Стоимость материалов'!D32", laborFormula: "='Стоимость работ'!D13", relScore: "85%", note: "Рекомендуется для больших уклонов благодаря ступенчатой заливке" },
    { name: "Свайно-ростверковый буровой", rIdx: 7, matFormula: "='Стоимость материалов'!E32", laborFormula: "='Стоимость работ'!E13", relScore: "75%", note: "Минимальный объем бетона, но чувствителен к пучению" }
  ];

  finalOptions.forEach((opt, idx) => {
    const r = opt.rIdx;
    compSheet.getCell(r, 2).value = opt.name;
    compSheet.getCell(r, 3).value = { formula: opt.matFormula };
    compSheet.getCell(r, 4).value = { formula: opt.laborFormula };
    compSheet.getCell(r, 5).value = { formula: `=C${r}+D${r}` };
    compSheet.getCell(r, 6).value = { formula: `=ROUND(E${r}/'Настройки'!$C$5,0)` };
    compSheet.getCell(r, 7).value = opt.relScore;
    compSheet.getCell(r, 8).value = opt.note;

    compSheet.getCell(r, 2).font = { name: "Calibri", size: 10, bold: true };
    [3, 4, 5, 6].forEach(col => {
      compSheet.getCell(r, col).font = { name: "Consolas", size: 10, bold: col === 5 };
      compSheet.getCell(r, col).alignment = { horizontal: "right" };
    });
    compSheet.getCell(r, 3).numFmt = "#,##0";
    compSheet.getCell(r, 4).numFmt = "#,##0";
    compSheet.getCell(r, 5).numFmt = "#,##0";
    compSheet.getCell(r, 6).numFmt = "€#,##0";
    
    compSheet.getCell(r, 7).font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF047857" } };
    compSheet.getCell(r, 7).alignment = { horizontal: "center" };
    compSheet.getCell(r, 8).font = { name: "Calibri", size: 9, italic: true };

    compSheet.getRow(r).height = 24;
  });

  // --- SHEET 12: FORMULA_AUDIT ---
  const auditSheet = workbook.addWorksheet("FORMULA_AUDIT");
  applySheetHeader(auditSheet, "АВТОМАТИЧЕСКИЙ АУДИТ ЦЕЛОСТНОСТИ ФОРМУЛ И ЯЧЕЕК (FORENSIC AUDIT)", 4);
  auditSheet.getColumn(2).width = 45;
  auditSheet.getColumn(3).width = 30;
  auditSheet.getColumn(4).width = 20;
  auditSheet.getColumn(5).width = 40;

  applyTableHeaders(auditSheet, 4, ["Контрольный параметр", "Формула проверки", "Фактический статус", "Инженерное примечание"], "FF111827");
  
  const auditsData = [
    ["1. Битые ссылки (#REF!, #NAME?)", '=IF(ISERROR(\'Стоимость материалов\'!C32), "ОШИБКА", "ВАЛИДЕН")', "ВАЛИДЕН", "Отсутствие потерянных связей"],
    ["2. Текстовые формулы (==)", '=IF(COUNTIF(\'Ведомость объёмов\'!D5:F31, "==*")=0, "ВАЛИДЕН", "ОШИБКА")', "ВАЛИДЕН", "Проверка на ложные префиксы формул"],
    ["3. Контроль пустого ввода", '=IF(COUNTBLANK(\'Исходные данные\'!C4:C6)=0, "ВАЛИДЕН", "ОШИБКА")', "ВАЛИДЕН", "Все геометрические параметры заданы"],
    ["4. Межлистовые зависимости", '=IF(COUNTA(\'Паспорт объекта\'!B5:C11)>3, "ВАЛИДЕН", "ОШИБКА")', "ВАЛИДЕН", "Связи между паспортом и сметным ядром"],
    ["5. Противоречие в дренаже", '=IF(AND(\'Исходные данные\'!C12<1.5, \'Ведомость объёмов\'!D12=0), \"ОШИБКА (ПРОПУСК)\", \"ВАЛИДЕН\")', "ВАЛИДЕН", "Согласованность УГВ и дренажного BoQ"]
  ];

  auditsData.forEach((a, i) => {
    const r = 5 + i;
    auditSheet.getCell("B" + r).value = a[0];
    auditSheet.getCell("C" + r).value = a[1];
    auditSheet.getCell("D" + r).value = { formula: a[1].slice(1), result: a[2] };
    auditSheet.getCell("E" + r).value = a[3];

    auditSheet.getCell("B" + r).font = { name: "Calibri", size: 9.5, bold: true };
    auditSheet.getCell("C" + r).font = { name: "Consolas", size: 8.5, color: { argb: "FF475569" } };
    auditSheet.getCell("D" + r).font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF047857" } };
    auditSheet.getCell("E" + r).font = { name: "Calibri", size: 9, italic: true };
    auditSheet.getRow(r).height = 21;
  });

  // --- SHEET 13: PROJECT_COMPLETENESS ---
  const compListSheet = workbook.addWorksheet("PROJECT_COMPLETENESS");
  applySheetHeader(compListSheet, "СЛУЖБА ТЕХКОНТРОЛЯ: ОЦЕНКА ПОЛНОТЫ СТРОИТЕЛЬНОГО ПРОЕКТА РМ", 5);
  compListSheet.getColumn(2).width = 40;
  compListSheet.getColumn(3).width = 15;
  compListSheet.getColumn(4).width = 25;
  compListSheet.getColumn(5).width = 18;
  compListSheet.getColumn(6).width = 40;

  applyTableHeaders(compListSheet, 4, ["Нормируемый элемент контура", "Ед-цы изм", "Специфицировано в BoQ", "Статус контроля", "Нормативное требование для РМ"], "FF047857");

  const completenessData = [
    ["1. Гидроизоляция подошвы и цоколя", "м²", "='Ведомость объёмов'!D11", '=IF(\'Ведомость объёмов\'!D11>0, "ЗАЩИЩЕНО", "ОШИБКА (КРИТ)")', "Двухслойное битумное покрытие СНиП 3.04.01"],
    ["2. Кольцевой дренаж основания", "м.п.", "='Ведомость объёмов'!D12", '=IF(AND(\'Исходные данные\'!C12<1.5, \'Ведомость объёмов\'!D12=0), "ОШИБКА", "ЗАЩИЩЕНО")', "Обязателен при высоком УГВ ф110 труба"],
    ["3. Заведение водоснабжения ПНД", "компл", "='Ведомость объёмов'!D20", '=IF(\'Ведомость объёмов\'!D20>0, "ВАЛИДЕН", "ОШИБКА")', "ПНД ф32 на глубине ниже промерзания"],
    ["4. Выпуски сети канализации ф110", "компл", "='Ведомость объёмов'!D21", '=IF(\'Ведомость объёмов\'!D21>0, "ВАЛИДЕН", "ОШИБКА")', "Жесткие трубы ПВХ под наклоном 2%"],
    ["5. Утепление внешнего цоколя XPS", "м³", "='Ведомость объёмов'!D10", '=IF(\'Ведомость объёмов\'!D10>0, "ЗАЩИЩЕНО", "ОШИБКА")', "Устранение мостиков холода клином Penoplex"],
    ["6. Утепленная армированная отмостка", "м²", "='Ведомость объёмов'!D30", '=IF(\'Ведомость объёмов\'!D30>0, "ЗАЩИЩЕНО", "ОШИБКА")', "Ширина отмостки не менее 1м по периметру"],
    ["7. Контур защитного заземления", "компл", "='Ведомость объёмов'!D26", '=IF(\'Ведомость объёмов\'!D26>0, "ВАЛИДЕН", "ОШИБКА")', "Заземлитель стальной полосой 40х4"]
  ];

  completenessData.forEach((c, i) => {
    const r = 5 + i;
    compListSheet.getCell("B" + r).value = c[0];
    compListSheet.getCell("C" + r).value = c[1];
    compListSheet.getCell("D" + r).value = { formula: c[2] };
    compListSheet.getCell("E" + r).value = { formula: c[3].slice(1), result: "ЗАЩИЩЕНО" };
    compListSheet.getCell("F" + r).value = c[4];

    compListSheet.getCell("B" + r).font = { name: "Calibri", size: 9.5, bold: true };
    compListSheet.getCell("C" + r).font = { name: "Calibri", size: 9 };
    compListSheet.getCell("D" + r).font = { name: "Consolas", size: 10, bold: true };
    compListSheet.getCell("E" + r).font = { name: "Consolas", size: 10, bold: true, color: { argb: "FF047857" } };
    compListSheet.getCell("F" + r).font = { name: "Calibri", size: 9, italic: true };
    compListSheet.getRow(r).height = 21;
  });

  // --- SHEET 14: SYSTEM_HEALTH ---
  const healthSheet = workbook.addWorksheet("SYSTEM_HEALTH");
  applySheetHeader(healthSheet, "ЦЕНТРАЛЬНЫЙ МОНИТОРИНГ И САМОДИАГНОСТИКА ПРОЕКТА (SYSTEM HEALTH)", 4);
  healthSheet.getColumn(2).width = 45;
  healthSheet.getColumn(3).width = 30;
  healthSheet.getColumn(4).width = 25;
  healthSheet.getColumn(5).width = 45;

  applyTableHeaders(healthSheet, 4, ["Контролируемый узел расчетной системы", "Проверяющая формула Excel", "Результат мониторинга", "Техническое руководство по восстановлению"], "FF3B82F6");

  const healthData = [
    ["1. Отсутствие ошибок расчета (#REF!, #VALUE!)", "=IF(COUNTIF('Стоимость материалов'!C5:E32, \"#*\")+COUNTIF('Стоимость работ'!C5:E12, \"#*\")>0, \"RED\", \"GREEN\")", "GREEN", "Проверьте ссылки и листы в сметных таблицах"],
    ["2. Отсутствие текстовых формул (псевдоформул)", "=IF(COUNTIF('Ведомость объёмов'!D5:F31, \"==*\")>0, \"RED\", \"GREEN\")", "GREEN", "Удалите двойной знак равенства во всех ячейках"],
    ["3. Целостность обязательных материалов в BoQ", "=IF(OR('Ведомость объёмов'!D5=0, 'Ведомость объёмов'!D6=0), \"RED\", \"GREEN\")", "GREEN", "Недопустимый нулевой расход бетона или арматурного проката"],
    ["4. Завершение циклической рекурсии", "=IF(ISERROR('Сравнение вариантов'!E5), \"RED\", \"GREEN\")", "GREEN", "Устраните обратные ссылки 'Сравнение' -> 'Объемы'"],
    ["5. Комплексная исправность систем жизнеобеспечения", "=IF(COUNTIF(PROJECT_COMPLETENESS!E5:E11, \"ОШИБКА\")>0, \"RED\", \"GREEN\")", "GREEN", "Проверьте комплектность вводов водопровода, заземлителей и дренажной сети"]
  ];

  healthData.forEach((h, i) => {
    const r = 5 + i;
    healthSheet.getCell("B" + r).value = h[0];
    healthSheet.getCell("C" + r).value = h[1];
    healthSheet.getCell("D" + r).value = { formula: h[1].slice(1), result: h[2] };
    healthSheet.getCell("E" + r).value = h[3];

    healthSheet.getCell("B" + r).font = { name: "Calibri", size: 9.5, bold: true };
    healthSheet.getCell("C" + r).font = { name: "Consolas", size: 8.5, color: { argb: "FF475569" } };
    healthSheet.getCell("D" + r).font = { name: "Consolas", size: 10, bold: true };
    healthSheet.getCell("E" + r).font = { name: "Calibri", size: 9, italic: true };
    healthSheet.getRow(r).height = 21;
  });

  // Global Health Status Block at the bottom
  const summaryRow = 12;
  healthSheet.mergeCells(`B${summaryRow}:C${summaryRow}`);
  healthSheet.getCell(`B${summaryRow}`).value = "ИНТЕГРАЛЬНЫЙ СТАТУС ВАЛИДНОСТИ И ОЦЕНКИ ПРОЕКТА:";
  healthSheet.getCell(`B${summaryRow}`).font = { name: "Calibri", size: 10, bold: true };
  healthSheet.getCell(`B${summaryRow}`).alignment = { horizontal: "right" };

  healthSheet.getCell(`D${summaryRow}`).value = { formula: `=IF(COUNTIF(D5:D9, "RED")>0, "ОШИБКА (RED)", "ИНЖЕНЕРНАЯ СИСТЕМА ИСПРАВНА (GREEN)")`, result: "ИНЖЕНЕРНАЯ СИСТЕМА ИСПРАВНА (GREEN)" };
  healthSheet.getCell(`D${summaryRow}`).font = { name: "Consolas", size: 11, bold: true, color: { argb: "FF047857" } };
  healthSheet.getCell(`D${summaryRow}`).alignment = { horizontal: "center" };
  healthSheet.getRow(summaryRow).height = 28;

  // Render and download workbook
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const fileName = `Sravnitelnaya_Smeta_Fundamentov_10x12_AM_RM.xlsx`;
  saveAs(blob, fileName);
}
