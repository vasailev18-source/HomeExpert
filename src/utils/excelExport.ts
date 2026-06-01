import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { CalculatorInput, CalculationResults, FoundationOption } from "../types";

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
    case "LOAM": return "Суглинок ( типичная прочность ~180 КПа )";
    case "CLAY": return "Глина уплотнённая ( ~160 КПа, умеренная усадка )";
    case "SAND": return "Песок средний ( ~220 КПа, отличная дренируемость )";
    case "LOESS": return "Лёсс / Просадочный суглинок ( ~110 КПа, опасный )";
    default: return soilType;
  }
}

export function getWallLabel(wallMaterial: string): string {
  switch (wallMaterial) {
    case "GASOBETON": return "Автоклавный газобетон (~500 кг/м³)";
    case "KOTELET": return "Молдавский котелец ( природный пиленый камень ~1900 кг/м³)";
    case "BRICK": return "Полнотелый / пустотелый кирпич (~1700 кг/м³)";
    case "KERAMZIT": return "Керамзитобетонные блоки (~1100 кг/м³)";
    case "FRAME": return "Энергоэффективный деревянный каркас (~250 кг/м³)";
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

// Generates an interactive, dynamic ASCII CAD blueprint in monospaced format for Excel
export function buildASCIIBlueprint(input: CalculatorInput, fbId: string): string[] {
  const lines: string[] = [];
  
  lines.push("  ┌──────────────────────────────────────────────────┐");
  lines.push("  │        ИНЖЕНЕРНЫЙ ЧЕРТЕЖ САПР (РАЗРЕЗ CAD)       │");
  lines.push("  └──────────────────────────────────────────────────┘");
  lines.push("");

  // 1 & 2. INTEGRATED ROOF & MANSARD (КРОВЛЯ И МАНСАРДНЫЙ ЭТАЖ ВО ФРАНЦУЗСКОМ СТИЛЕ)
  const floors = input.floors;
  const hasMansard = floors === 1.5 || floors === 1.6 || floors === 1.7 || floors === 2.5 || floors === 3.5;
  const floorCount = Math.floor(floors);

  if (hasMansard) {
    if (input.roofType === "FLAT_PVC") {
      lines.push("               _______________");
      lines.push("              [===============]  <-- ПЛОСКАЯ КРОВЛЯ С ПВХ-МЕМБРАНОЙ");
      lines.push("              |   [o]    [o]  |  <-- ФРАНЦУЗСКИЙ ОСТЕКЛЕННЫЙ ЭТАЖ");
      lines.push("              |_______________|");
    } else if (input.roofType === "SHED_BOARD") {
      lines.push("              \\");
      lines.push("               \\______________");
      lines.push("                \\  [o]    [o] \\  <-- ОДНОСКАТНАЯ МАНСАРДНАЯ КРОВЛЯ");
      lines.push("                 [____________]");
    } else {
      // Classic French Mansard double-pitch roof shape (Формат двойного излома во французском стиле)
      lines.push("                  ___________");
      lines.push("                 /           \\   <-- ВЕРХНИЙ ПОЛОГИЙ СКАТ КРОВЛИ");
      lines.push("                /_____________\\");
      lines.push("               /  _       _  \\");
      lines.push("              /  [o]     [o]  \\  <-- МАНСАРДНЫЙ КРУТОЙ СКАТ (ФРАНЦУЗСКИЙ)");
      lines.push("             /___[o]_____[o]___\\     (КЛАССИЧЕСКИЕ АРОЧНЫЕ ЛЮКАРНЫ)");
    }
  } else {
    // Normal Empty Roof (Без мансардного этажа)
    if (input.roofType === "GABLE_METAL") {
      lines.push("                      /\\");
      lines.push("                     /  \\");
      lines.push("                    /    \\");
      lines.push("                   /  ()  \\      <-- МЕТАЛЛОЧЕРЕПИЦА (ДВУСКАТНАЯ)");
      lines.push("                  /________\\");
    } else if (input.roofType === "HIP_CERAMIC") {
      lines.push("                  ___________");
      lines.push("                 /           \\");
      lines.push("                /             \\  <-- КЕРАМИЧЕСКАЯ ЧЕРЕПИЦА (ВАЛЬМОВАЯ)");
      lines.push("               /_______________\\");
    } else if (input.roofType === "FLAT_PVC") {
      lines.push("               _______________");
      lines.push("              [===============]  <-- ПЛОСКАЯ КРОВЛЯ С ПВХ-МЕМБРАНОЙ");
      lines.push("              [_______________]");
    } else { // SHED_BOARD
      lines.push("              \\");
      lines.push("               \\");
      lines.push("                \\_____________   <-- КРОВЛЯ ИЗ ПРОФНАСТИЛА (ОДНОСКАТНАЯ)");
      lines.push("                 [____________]");
    }
  }

  // 3. FULL FLOORS (ЭТАЖНОСТЬ)
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

  // 4. BASEMENT COOPERATIVE LAYER (ЦОКОЛЬ / ПОДВАЛ)
  if (input.hasBasement) {
    lines.push("    - - - - -#=================#- - - - - <-- УРОВЕНЬ ЗЕМЛИ");
    lines.push("             |   [ ]      [ ]  |          <-- ВСТРОЕННЫЙ ПОДВАЛ");
    lines.push("             |_________________|");
  } else {
    lines.push("    - - - - -#=================#- - - - - <-- УРОВЕНЬ ЕСТЕСТВЕННОЙ ЗЕМЛИ");
  }

  // 5. CONSTRUCTIVE FOUNDATION SECTION (ФУНДАМЕНТ)
  if (fbId === "slab") {
    lines.push("             [=================]          <-- МОНОЛИТНАЯ Ж/Б ПЛИТА");
    lines.push("             [_________________]");
    lines.push("             | : : : : : : : . |          <-- Песчано-гравийная подушка");
    lines.push("             |_________________|");
  } else if (fbId === "strip") {
    lines.push("             |===|         |===|          <-- Ж/Б РОСТВЕРК ВЫСОКИЙ");
    lines.push("             |   |         |   |          <-- Тело ленточного бетона");
    lines.push("             [===]         [===]          <-- РАСШИРЕННАЯ ПОДОШВА ЛЕНТЫ");
    lines.push("             |:::|         |:::|          <-- Уплотненное основание подушки");
  } else { // piles SWEDA
    lines.push("             [=================]          <-- МОНОЛИТНЫЙ Ж/Б РОСТВЕРК");
    lines.push("              | |           | |");
    lines.push("              | |           | |           <-- ОПОРНЫЕ СВАИ ПО СНиП");
    lines.push("              | |           | |");
    lines.push("             ( _ )         ( _ )          <-- Расширенные пяты свай (Тисэ)");
  }

  // 6. SOIL BASE AND WATER TABLE (ГРУНТ / ВОДА)
  lines.push("    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ <-- РАСЧЕТНЫЙ УРОВЕНЬ ВОД (УГВ)");
  lines.push("                             _  _  _      <-- Сейсмоустойчивый материк");
  
  return lines;
}

export async function exportToExcel(
  input: CalculatorInput,
  results: CalculationResults,
  selectedOption: FoundationOption,
  landSlope: number,
  groundwaterDepth: number,
  detailedItemsFetcher: (catId: string, opt: any, slope: number, gw: number) => any[]
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Smeta_Fundament");

  // Show grid lines explicitly
  worksheet.views = [{ showGridLines: true }];

  // Column Setup (A - G for inputs, results and costs, H for separator, I - O for CAD blueprint)
  worksheet.getColumn(1).width = 10;  // Код
  worksheet.getColumn(2).width = 65;  // Наименование
  worksheet.getColumn(3).width = 18;  // Категория
  worksheet.getColumn(4).width = 13;  // Кол-во
  worksheet.getColumn(5).width = 10;  // Ед. изм.
  worksheet.getColumn(6).width = 16;  // Цена за ед.
  worksheet.getColumn(7).width = 20;  // Сумма
  worksheet.getColumn(8).width = 4;   // Spacer Column
  worksheet.getColumn(9).width = 10;  // CAD I
  worksheet.getColumn(10).width = 10; // CAD J
  worksheet.getColumn(11).width = 10; // CAD K
  worksheet.getColumn(12).width = 10; // CAD L
  worksheet.getColumn(13).width = 10; // CAD M
  worksheet.getColumn(14).width = 10; // CAD N
  worksheet.getColumn(15).width = 18; // CAD O

  // Row heights
  worksheet.getRow(1).height = 15;

  // Title Block (B-G + I-O across entire sheet block)
  worksheet.mergeCells("A2:O2");
  const titleCell = worksheet.getCell("A2");
  titleCell.value = "КИШИНЕВСКИЙ КАЛЬКУЛЯТОР ФУНДАМЕНТА - СМЕТНО-ПАСПОРТНАЯ ВЕДОМОСТЬ";
  titleCell.font = { name: "Calibri", family: 2, charset: 204, size: 14, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0F172A" } // Dark Slate (Tailwind Slate-900)
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(2).height = 42;

  // Header passport block
  worksheet.mergeCells("A4:G4");
  const subHeaderCell = worksheet.getCell("A4");
  subHeaderCell.value = "ПОЛНЫЙ ТЕХНИЧЕСКИЙ ПАСПОРТ РАСЧЕТА (ВВОДНЫЕ И РАСЧЕТНЫЕ ДАННЫЕ)";
  subHeaderCell.font = { name: "Calibri", family: 2, charset: 204, size: 10.5, bold: true, color: { argb: "FF0F172A" } };
  subHeaderCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE2E8F0" } // Slate-200
  };
  subHeaderCell.alignment = { vertical: "middle", indent: 1 };
  worksheet.getRow(4).height = 26;

  // Build absolutely comprehensive list of inputs and outputs
  const params = [
    // --- ВХОДНЫЕ ДАННЫЕ (INPUTS) ---
    { label: "--- ВХОДНЫЕ ГЕОМЕТРИЧЕСКИЕ И ТЕХНИЧЕСКИЕ ПАРАМЕТРЫ ---", val: "" },
    { label: "Регион застройки в Республике Молдова:", val: getRegionLabel(input.region) },
    { label: "Тип грунта строительного пятна:", val: getSoilLabel(input.soilType) },
    { label: "Габариты здания в осях:", val: `${input.width} м × ${input.length} м` },
    { label: "Количество этажей (по проекту застройки):", val: `${input.floors} этаж(а) (высота этажа ${input.floorHeight} м)` },
    { label: "Общая площадь помещений поме пятна:", val: `${(input.width * input.length * input.floors).toFixed(1)} м²` },
    { label: "Материал наружных и внутренних несущих стен:", val: getWallLabel(input.wallMaterial) },
    { label: "Тип перекрытий этажей:", val: getSlabLabel(input.slabMaterial) },
    { label: "Конструкция крыши / кровли:", val: getRoofLabel(input.roofType) },
    { label: "Уровень грунтовых вод от поверхности (УГВ):", val: groundwaterDepth > 4 ? "Глубокое залегание (>4 м)" : `${groundwaterDepth} м от поверхности` },
    { label: "Средний уклон ландшафта (строительное пятно):", val: `${landSlope}% (${landSlope > 5 ? "Требует уступных компенсаторов" : "Допускает ровную поверхность"})` },
    { label: "Коэффициент надежности по нагрузке (запаса):", val: `${input.safetyFactor || 1.3} (по СНиП 2.01.07-85)` },
    { label: "Наличие цокольного этажа / полноразмерного подвала:", val: input.hasBasement ? "Да (Конструкция с заглубленным подвалом)" : "Нет (Строительство без подвала)" },
    { label: "Опция (перспектива надстройки этажей в будущем):", val: input.futureFlooringExtension ? "Да (Заложено увеличение несущей способности фундамента)" : "Нет" },

    // --- РАСЧЕТНЫЕ НАГРУЗКИ ПО СНиП (CALCULATED LOADS) ---
    { label: "--- РАСЧЕТНЫЕ СТАТИЧЕСКИЕ И КЛИМАТИЧЕСКИЕ НАГРУЗКИ (СНиП) ---", val: "" },
    { label: "Собственный вес несущих и внутренних стен здания:", val: `${results.wallWeightTons.toFixed(1)} тонн` },
    { label: "Собственный вес междуэтажных перекрытий:", val: `${results.slabWeightTons.toFixed(1)} тонн` },
    { label: "Собственный вес кровельной и стропильной систем:", val: `${results.roofWeightTons.toFixed(1)} тонн` },
    { label: "Полезная жилая/эксплуатационная расчетная нагрузка:", val: `${results.liveLoadTons.toFixed(1)} тонн` },
    { label: "Снеговая климатическая расчетная нагрузка РМ:", val: `${results.snowLoadTons.toFixed(1)} тонн` },
    { label: "Ветровая динамическая расчетная нагрузка РМ:", val: `${results.windLoadTons.toFixed(1)} тонн` },
    { label: "Сейсмическая эквивалентная сила сдвига (СНиП II-7-81*):", val: `${results.seismicForceTons.toFixed(1)} тонн` },
    { label: "Суммарный вес здания под подошвой фундамента (всего):", val: `${results.totalFactoredWeightTons.toFixed(1)} тонн` },

    // --- РАСЧЕТ ГРУНТОВОГО ОСНОВАНИЯ (GEOTECHNICS & SIZING) ---
    { label: "--- ХАРАКТЕРИСТИКИ ОСНОВАНИЯ И ВЫБРАННЫЕ РЕЗЕРВЫ ---", val: "" },
    { label: "Выбранный конструктив опорного фундамента:", val: `${selectedOption.type} / ${selectedOption.nameRu}` },
    { label: "Расчетное сопротивление грунта (R):", val: `${results.soilBearingCapacityKPa} кПа` },
    { label: "Требуемая расчетная площадь подошвы опирания:", val: `${results.bearingAreaRequiredM2.toFixed(2)} м²` },
    { label: "Ширина фундамента / Ленты / Свайного ростверка:", val: `${selectedOption.widthM} м (проектная по расчету)` },
    { label: "Проектная глубина заложения фундамента:", val: `${selectedOption.depthM} м (ниже уровня промерзания по СНиП)` },

    // --- ГЕОТЕХНИЧЕСКИЕ РИСКИ (GEOTECHNICAL RISKS) ---
    { label: "--- ИНЖЕНЕРНО-ГЕОЛОГИЧЕСКИЕ И СЕЙСМИЧЕСКИЕ РИСКИ ГРУНТА ---", val: "" },
    { label: "Потенциальный риск морозного пучения грунта:", val: `${results.frostHeavingPercent}% (${results.frostHeavingPercent > 60 ? "ВЫСОКИЙ - требуется песчаная подушка" : "Низкий"})` },
    { label: "Риск просадочности однородных суглинков (Лёсс):", val: `${results.collapsibilityPercent}% (${results.collapsibilityPercent > 60 ? "ВЫСОКИЙ - требуется трамбование" : "Низкий"})` },
    { label: "Риск подтопления со стороны грунтовых вод:", val: `${results.floodingPercent}% (${results.floodingPercent > 60 ? "КРИТИЧЕСКИЙ - требуется периметральный дренаж" : "Умеренный/Низкий"})` },
    { label: "Надобность сейсмического пояса (СНиП II-7-81*):", val: input.region !== "NORTH" ? "ОБЯЗАТЕЛЬНА (Сейсмозона 7-8 баллов - требуется монолит)" : "Рекомендована (Сейсмозона 6 баллов)" }
  ];

  let pRow = 5;
  params.forEach((param, idx) => {
    if (param.val === "") {
      // Style Section Separator Row beautifully
      worksheet.mergeCells(`B${pRow}:G${pRow}`);
      const headerCell = worksheet.getCell(`B${pRow}`);
      headerCell.value = param.label;
      headerCell.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, bold: true, color: { argb: "FF1E3A8A" } }; // Royal Blue
      headerCell.alignment = { horizontal: "center", vertical: "middle" };

      ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
        const c = worksheet.getCell(`${col}${pRow}`);
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" } // Slate-200
        };
        c.border = {
          top: { style: "thin", color: { argb: "FF94A3B8" } },
          bottom: { style: "thin", color: { argb: "FF94A3B8" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
      });
    } else {
      // Normal parameter value row
      worksheet.mergeCells(`B${pRow}:C${pRow}`);
      worksheet.mergeCells(`D${pRow}:G${pRow}`);

      const cellLabel = worksheet.getCell(`B${pRow}`);
      cellLabel.value = param.label;
      cellLabel.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, bold: true, color: { argb: "FF475569" } };
      cellLabel.alignment = { horizontal: "left", vertical: "middle" };

      const cellVal = worksheet.getCell(`D${pRow}`);
      cellVal.value = param.val;
      cellVal.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, color: { argb: "FF0F172A" } };
      
      // Accents for critical outputs
      if (param.label.includes("Выбранный конструктив") || param.label.includes("Суммарный вес")) {
        cellVal.font = { name: "Calibri", family: 2, charset: 204, size: 10, bold: true, color: { argb: "FF2563EB" } }; // Accent blue
      } else if (param.label.includes("Риск") && (param.val.includes("ВЫСОКИЙ") || param.val.includes("КРИТИЧЕСКИЙ"))) {
        cellVal.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, bold: true, color: { argb: "FFDF1C1C" } }; // Warning red
      } else if (param.label.includes("сейсмического пояса") && param.val.includes("ОБЯЗАТЕЛЬНА")) {
        cellVal.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, bold: true, color: { argb: "FFB45309" } }; // Warning gold
      }
      cellVal.alignment = { horizontal: "left", vertical: "middle" };

      // Fill alternating row colors
      const rowFill = idx % 2 === 0 ? "FFF8FAFC" : "FFFFFFFF";
      ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
        const c = worksheet.getCell(`${col}${pRow}`);
        c.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowFill }
        };
        c.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
      });
    }

    worksheet.getRow(pRow).height = 21;
    pRow++;
  });

  // --- RENDER GLOWING CAD BLUEPRINT SCHEMATIC AT COLUMNS I TO O (Rows 4 to 41) ---
  worksheet.mergeCells("I4:O4");
  const cadTitle = worksheet.getCell("I4");
  cadTitle.value = "ИНЖЕНЕРНЫЙ ЧЕРТЁЖ САПР (СХЕМАТИЧЕСКИЙ РАЗРЕЗ COLD CAD)";
  cadTitle.font = { name: "Calibri", family: 2, charset: 204, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  cadTitle.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0284C7" } // Blue sky accent header
  };
  cadTitle.alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(4).height = 26;

  // Render outline rows around parameters height
  const cadLines = buildASCIIBlueprint(input, selectedOption.id as string);
  cadLines.forEach((cadLine, idx) => {
    const drawingRow = 5 + idx;
    worksheet.mergeCells(`I${drawingRow}:O${drawingRow}`);
    const drawingCell = worksheet.getCell(`I${drawingRow}`);
    drawingCell.value = cadLine;
    drawingCell.font = { name: "Consolas", size: 9, bold: true, color: { argb: "FF38BDF8" } }; // Glowing blueprint cyan
    drawingCell.alignment = { horizontal: "left", vertical: "middle" };

    ["I", "J", "K", "L", "M", "N", "O"].forEach(col => {
      const cell = worksheet.getCell(`${col}${drawingRow}`);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0F172A" } // Dark Slate Blueprint space
      };

      const borderConfig: any = {};
      if (idx === 0) borderConfig.top = { style: "medium", color: { argb: "FF475569" } };
      if (idx === cadLines.length - 1) borderConfig.bottom = { style: "medium", color: { argb: "FF475569" } };
      if (col === "I") borderConfig.left = { style: "medium", color: { argb: "FF475569" } };
      if (col === "O") borderConfig.right = { style: "medium", color: { argb: "FF475569" } };

      cell.border = borderConfig;
    });

    if (worksheet.getRow(drawingRow).height === undefined || worksheet.getRow(drawingRow).height < 16) {
      worksheet.getRow(drawingRow).height = 16;
    }
  });

  // Ensure spacing is perfect and does not overlap Cost Estimation Header
  if (pRow < 5 + cadLines.length) {
    pRow = 5 + cadLines.length;
  }

  // Spacing before smeta starts
  pRow++;
  worksheet.getRow(pRow).height = 15;
  pRow++;

  worksheet.mergeCells(`A${pRow}:G${pRow}`);
  const tableHeaderCell = worksheet.getCell(`A${pRow}`);
  tableHeaderCell.value = `ПОДРОБНАЯ КАЛЬКУЛЯЦИЯ СМЕТНЫХ ЗАТРАТ - ${selectedOption.nameRu.toUpperCase()} (MDL)`;
  tableHeaderCell.font = { name: "Calibri", family: 2, charset: 204, size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
  tableHeaderCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" } // Deep Blue
  };
  tableHeaderCell.alignment = { vertical: "middle", indent: 1 };
  worksheet.getRow(pRow).height = 28;

  pRow++;

  // Write Table Column Headers
  const colHeaders = [
    { cell: `A${pRow}`, val: "Код" },
    { cell: `B${pRow}`, val: "Наименование затрат и элементов" },
    { cell: `C${pRow}`, val: "Категория" },
    { cell: `D${pRow}`, val: "Кол-во" },
    { cell: `E${pRow}`, val: "Ед. изм." },
    { cell: `F${pRow}`, val: "Цена (MDL)" },
    { cell: `G${pRow}`, val: "Итого (MDL)" }
  ];

  colHeaders.forEach(header => {
    const cell = worksheet.getCell(header.cell);
    cell.value = header.val;
    cell.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, bold: true, color: { argb: "FF334155" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" }
    };
    cell.alignment = { horizontal: header.cell.startsWith("A") || header.cell.startsWith("B") ? "left" : "right", vertical: "middle" };
    if (header.cell.startsWith("C") || header.cell.startsWith("E")) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF64748b" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } }
    };
  });
  worksheet.getRow(pRow).height = 24;
  pRow++;

  // Prep the categories data matching UI
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
      showIf: !!selectedOption.materials.hasDrainage
    },
    {
      id: "09",
      name: "09. Уступные компенсаторы",
      desc: `Сложность рельефа ${landSlope}%, ступенчатая опалубка, подгонка уровней`,
      cost: selectedOption.costEstimate.slopeComplicationCostMDL || 0,
      showIf: landSlope > 0
    },
    {
      id: "10",
      name: "10. Черновой пол по грунту",
      desc: selectedOption.id === "slab" 
        ? "Монолитная несущая плита (Черновой пол встроен по технологии)"
        : `Устройство пола: подушка ${selectedOption.materials.roughFloorSandM3 || 0} м³, сетка d8 ${selectedOption.materials.roughFloorRebarKg || 0} кг, стяжка ${selectedOption.materials.roughFloorConcreteM3 || 0} м³`,
      cost: selectedOption.costEstimate.roughFloorCostMDL || 0,
      showIf: selectedOption.costEstimate.roughFloorCostMDL !== undefined,
      isSlabBuiltin: selectedOption.id === "slab"
    }
  ];

  const subtotalCellsRowNumbers: number[] = [];

  for (const cat of budgetCategories) {
    if (!cat.showIf) continue;

    // A. Subheader category row
    worksheet.mergeCells(`A${pRow}:G${pRow}`);
    const catTitleCell = worksheet.getCell(`A${pRow}`);
    catTitleCell.value = `РАЗДЕЛ ${cat.name}`;
    catTitleCell.font = { name: "Calibri", family: 2, charset: 204, size: 10, bold: true, color: { argb: "FF0F172A" } };
    catTitleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" }
    };
    catTitleCell.alignment = { vertical: "middle", indent: 1 };
    
    // Set borders for section header
    ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
      const c = worksheet.getCell(`${col}${pRow}`);
      c.border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } }
      };
    });
    worksheet.getRow(pRow).height = 23;
    pRow++;

    const startDetailedRow = pRow;

    if (cat.isSlabBuiltin) {
      // Monolithic slab simple item
      worksheet.getCell(`A${pRow}`).value = "10.1";
      worksheet.getCell(`B${pRow}`).value = "Монолитный несущий черновой пол (Заливка встроена в общую плиту)";
      worksheet.getCell(`C${pRow}`).value = "Конструкция";
      worksheet.getCell(`D${pRow}`).value = 1;
      worksheet.getCell(`D${pRow}`).numFmt = "#,##0";
      worksheet.getCell(`E${pRow}`).value = "компл";
      worksheet.getCell(`F${pRow}`).value = 0;
      worksheet.getCell(`F${pRow}`).numFmt = "#,##0.00";
      worksheet.getCell(`G${pRow}`).value = { formula: `=D${pRow}*F${pRow}`, result: 0 };
      worksheet.getCell(`G${pRow}`).numFmt = "#,##0";

      ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
        const cell = worksheet.getCell(`${col}${pRow}`);
        cell.font = { name: "Calibri", family: 2, charset: 204, size: 9, italic: true };
        if (col === "B") {
          cell.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, italic: true, bold: true, color: { argb: "FF10B981" } };
        }
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } }
        };
      });
      worksheet.getRow(pRow).height = 20;
      pRow++;
    } else {
      // Get detailed list
      const detailedItems = detailedItemsFetcher(cat.id, selectedOption, landSlope, groundwaterDepth);
      
      detailedItems.forEach((item, itemIdx) => {
        const itemCode = `${cat.id}.${itemIdx + 1}`;
        worksheet.getCell(`A${pRow}`).value = itemCode;
        worksheet.getCell(`B${pRow}`).value = item.name;
        
        const typeLabels: Record<string, string> = {
          material: "Материал",
          delivery: "Доставка",
          labor: "Работа",
          machinery: "Техника"
        };
        worksheet.getCell(`C${pRow}`).value = typeLabels[item.type] || item.type;
        worksheet.getCell(`D${pRow}`).value = item.qty;
        worksheet.getCell(`D${pRow}`).numFmt = "#,##0.00";
        worksheet.getCell(`E${pRow}`).value = item.unit;
        worksheet.getCell(`F${pRow}`).value = item.rate;
        worksheet.getCell(`F${pRow}`).numFmt = "#,##0.00";
        
        // INTERACTIVE EXCEL FORMULA -> Qty * Rate preserved in G column
        worksheet.getCell(`G${pRow}`).value = {
          formula: `=D${pRow}*F${pRow}`,
          result: item.total
        };
        worksheet.getCell(`G${pRow}`).numFmt = "#,##0";

        ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
          const cell = worksheet.getCell(`${col}${pRow}`);
          cell.font = { name: "Calibri", family: 2, charset: 204, size: 9 };
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } }
          };
          if (col === "G") {
            cell.font = { name: "Calibri", family: 2, charset: 204, size: 9, bold: true };
          }
        });
        
        worksheet.getRow(pRow).height = 20;
        pRow++;
      });
    }

    const endDetailedRow = pRow - 1;

    // B. Subtotal row for Category
    worksheet.mergeCells(`B${pRow}:F${pRow}`);
    const subtotalLabel = worksheet.getCell(`B${pRow}`);
    subtotalLabel.value = `Итого по подразделу [ ${cat.name.replace(/^\d+\.\s*/, "")} ]`;
    subtotalLabel.font = { name: "Calibri", family: 2, charset: 204, size: 9.5, bold: true, color: { argb: "FF1E40AF" } };
    subtotalLabel.alignment = { horizontal: "right", vertical: "middle" };

    // INTERACTIVE SUM FORMULA -> sums the section rows
    const subtotalCell = worksheet.getCell(`G${pRow}`);
    subtotalCell.value = {
      formula: `=SUM(G${startDetailedRow}:G${endDetailedRow})`,
      result: cat.cost
    };
    subtotalCell.font = { name: "Calibri", family: 2, charset: 204, size: 10, bold: true, color: { argb: "FF1E40AF" } };
    subtotalCell.numFmt = "#,##0";

    // Style the subtotal row
    subtotalCellsRowNumbers.push(pRow);

    ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
      const cell = worksheet.getCell(`${col}${pRow}`);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F9FF" } // Tailwind Sky-50
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF93C5FD" } },
        bottom: { style: "medium", color: { argb: "FF3B82F6" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } }
      };
    });
    worksheet.getRow(pRow).height = 24;
    pRow++;

    // Extra little spacer
    worksheet.getRow(pRow).height = 5;
    pRow++;
  }

  // Double spacing before GRAND TOTAL
  pRow++;
  worksheet.getRow(pRow).height = 15;
  pRow++;

  // C. GRAND TOTAL EXCEL BLOCK
  worksheet.mergeCells(`B${pRow}:F${pRow}`);
  const grandLabelCell = worksheet.getCell(`B${pRow}`);
  grandLabelCell.value = "ИТОГ: Полная сметная стоимость фундамента под ключ (MDL):";
  grandLabelCell.font = { name: "Calibri", family: 2, charset: 204, size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  grandLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  // INTERACTIVE GRAND TOTAL FORMULA -> sums all subtotals
  const subtotalRefs = subtotalCellsRowNumbers.map(r => `G${r}`).join("+");
  const grandTotalCell = worksheet.getCell(`G${pRow}`);
  grandTotalCell.value = {
    formula: `=${subtotalRefs}`,
    result: selectedOption.costMDL
  };
  grandTotalCell.font = { name: "Calibri", family: 2, charset: 204, size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  grandTotalCell.numFmt = "#,##0";

  ["B", "C", "D", "E", "F", "G"].forEach(col => {
    const cell = worksheet.getCell(`${col}${pRow}`);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E3A8A" } // Deep Slate Royal Blue
    };
    cell.border = {
      top: { style: "double", color: { argb: "FF60A5FA" } },
      bottom: { style: "medium", color: { argb: "FF1E3A8A" } }
    };
  });
  worksheet.getRow(pRow).height = 34;
  pRow++;

  // D. EUR conversion row
  worksheet.mergeCells(`B${pRow}:F${pRow}`);
  const eurLabelCell = worksheet.getCell(`B${pRow}`);
  eurLabelCell.value = "Курсовой эквивалент в Евро (ориентир по курсу ~19.80 MDL/EUR):";
  eurLabelCell.font = { name: "Calibri", family: 2, charset: 204, size: 10, italic: true, bold: true, color: { argb: "FF475569" } };
  eurLabelCell.alignment = { horizontal: "right", vertical: "middle" };

  const eurTotalCell = worksheet.getCell(`G${pRow}`);
  eurTotalCell.value = {
    formula: `=ROUND(G${pRow - 1}/19.8, 0)`,
    result: Math.round(selectedOption.costMDL / 19.8)
  };
  eurTotalCell.font = { name: "Calibri", family: 2, charset: 204, size: 10, italic: true, bold: true, color: { argb: "FF475569" } };
  eurTotalCell.numFmt = "€#,##0";

  ["B", "C", "D", "E", "F", "G"].forEach(col => {
    const cell = worksheet.getCell(`${col}${pRow}`);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF8FAFC" }
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFE2E8F0" } }
    };
  });
  worksheet.getRow(pRow).height = 24;
  pRow += 3;

  // E. Footnote static warnings
  worksheet.mergeCells(`B${pRow}:G${pRow}`);
  const noteTitleCell = worksheet.getCell(`B${pRow}`);
  noteTitleCell.value = "ПРИМЕЧАНИЕ ГОРОДСКОЙ ИНЖЕНЕРНОЙ СЛУЖБЫ РМ:";
  noteTitleCell.font = { name: "Calibri", family: 2, charset: 204, size: 10, bold: true, color: { argb: "FF64748B" } };
  pRow++;

  worksheet.mergeCells(`B${pRow}:G${pRow + 3}`);
  const noteDescCell = worksheet.getCell(`B${pRow}`);
  noteDescCell.value = 
    "1. Ведомость объемов работ составлена на основе усредненного нормативного давления грунта.\n" +
    "2. Перед заложением фундамента ОБЯЗАТЕЛЬНО выполнение шурфования и проверки физико-механических свойств грунтовых напластований.\n" +
    "3. Сейсмопояс (Centură antiseismică) толщиной h=20-30 см выполняется непрерывно по всему наружному контуру.\n" +
    "4. Настоящая смета с формулами позволяет интерактивно изменять цены ресурсов в столбце F для автоматической адаптации к рынку.";
  noteDescCell.font = { name: "Calibri", family: 2, charset: 204, size: 8.5, italic: true, color: { argb: "FF64748B" } };
  noteDescCell.alignment = { wrapText: true, vertical: "top" };
  worksheet.getRow(pRow).height = 15;

  // Render file block download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  
  const fndShortName = selectedOption.id === "slab" ? "Slab" : selectedOption.id === "strip" ? "Strip" : "Pile";
  const fileName = `Fundament_Estimate_${fndShortName}_${input.width}x${input.length}.xlsx`;
  saveAs(blob, fileName);
}
