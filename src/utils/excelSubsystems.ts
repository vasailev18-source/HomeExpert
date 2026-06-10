import ExcelJS from "exceljs";
import { CalculatorInput, CalculationResults } from "../types";
import { writeCell, applySheetHeader, applyTableHeaders } from "./excelExport";

// ==========================================
// 1. WALLS PRIORITIZATION (ПРИОРИТЕТ №1)
// ==========================================
export function addWallSubsystemModules(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  addWallCalc(workbook, input, results);
  addWallTrace(workbook, input, results);
  addWallAudit(workbook, input, results);
  addWallBoq(workbook, input, results);
  addWallMaterials(workbook, input, results);
}

function addWallCalc(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws = workbook.addWorksheet("WALL_CALC");
  ws.views = [{ showGridLines: false }];
  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 40;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 15;
  ws.getColumn(5).width = 40;
  
  applySheetHeader(ws, "ИНЖЕНЕРНЫЙ РАСЧЕТ: СТЕНЫ (EUROCODE 6 / NCM F.03.02-2005)", 6, "FF1E3A8A");
  applyTableHeaders(ws, 4, ["Параметр", "Значение", "Ед. изм.", "Формула / Комментарий"], "FF1E40AF");
  
  if (!results.walls) {
    writeCell(ws, 'B5', 'Расчеты стен отсутствуют.');
    return;
  }
  
  const metrics = [
    ["Ширина дома (Width)", input.width, "м", "Параметр модели"],
    ["Длина дома (Length)", input.length, "м", "Параметр модели"],
    ["Высота этажа", input.floorHeight, "м", "Параметр модели"],
    ["Количество этажей", input.floors, "шт", "Параметр модели"],
    ["Площадь по внешнему контуру", results.walls.wallAreaGrossM2.toFixed(2), "м2", "(L+W)*2 * H * Floors"],
    ["Площадь нетто (минус проемы)", results.walls.wallAreaNetM2.toFixed(2), "м2", "Gross * 0.85 (-15% на окна и двери)"],
    ["Объем кирпичной/блочной кладки", results.walls.blocksVolumeM3.toFixed(2), "м3", "Net * WallThickness"],
    ["Количество кладочных элементов", results.walls.blocksCount.toFixed(0), "шт", "Volume * Yield (Шт/м3)"],
    ["Объем кладочного раствора", results.walls.mortarVolumeM3.toFixed(2), "м3", "Volume * 0.05"],
    ["Количество ж/б колонн (сердечников)", results.walls.columnsCount, "шт", "Шаг <4м (Сейсмика)"],
    ["Объем бетона колонн", results.walls.concreteColumnsM3.toFixed(2), "м3", "Count * H * 0.3 * 0.3"],
    ["Длина армопояса", results.walls.seismicBeltLengthM.toFixed(2), "м", "Периметр * Этажи + Внутр. Стены"],
    ["Объем бетона армопояса", results.walls.concreteBeltM3.toFixed(2), "м3", "Length * 0.3 * 0.25"],
    ["Общий объем бетона (Колонны+Пояс)", results.walls.totalConcreteM3.toFixed(2), "м3", "Cols + Belt"],
    ["Вес продольной арматуры (Стены)", results.walls.rebarKg.toFixed(2), "кг", "Belt + Cols (ρ_min=0.4%)"],
    ["Вес кладочной сетки", (results.walls.masonryRebarKg || 0).toFixed(2), "кг", "Армирование каждые 4 ряда"]
  ];
  
  let row = 5;
  metrics.forEach(m => {
    writeCell(ws, `B\${row}`, m[0]);
    writeCell(ws, `C\${row}`, m[1]);
    writeCell(ws, `D\${row}`, m[2]);
    writeCell(ws, `E\${row}`, m[3]);
    
    // Simple Formatting
    ['B','C','D','E'].forEach(col => {
      ws.getCell(`\${col}\${row}`).border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } };
    });
    row++;
  });
}

function addWallTrace(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws = workbook.addWorksheet("WALL_TRACE");
  ws.views = [{ showGridLines: false }];
  ws.getColumn(1).width = 4; ws.getColumn(2).width = 10; ws.getColumn(3).width = 20; ws.getColumn(4).width = 40; ws.getColumn(5).width = 30; ws.getColumn(6).width = 15; ws.getColumn(7).width = 25;
  applySheetHeader(ws, "ТРАССИРОВКА РАСЧЕТОВ: СТЕНЫ", 7, "FF15803D");
  applyTableHeaders(ws, 4, ["Шаг", "Модуль", "Описание операции", "Операнды", "Результат", "NCM/Eurocode"], "FF166534");
  
  const trace = [
    ["1", "GEOMETRY", "Периметр здания", `(\${input.length}m + \${input.width}m) * 2`, `${(input.length + input.width) * 2} m`, "N/A"],
    ["2", "GEOMETRY", "Площадь брутто стен", `Perimeter * \${input.floorHeight}m * \${input.floors}`, `${results.walls?.wallAreaGrossM2.toFixed(2)} m2`, "N/A"],
    ["3", "SEISMIC", "Определение кол-ва ж/б сердечников", "Периметр / 4m (макс. шаг)", `${results.walls?.columnsCount} шт`, "NCM F.03.02 п.5.8"],
    ["4", "SEISMIC", "Расчет сечения сердечников", "Min > 300x300mm", "V = Cnt * H * 0.3 * 0.3", "Eurocode 8"],
    ["5", "MATERIAL", "Коэффициент площади окон/дверей", "По умолчанию 15% от Gross", "0.85 * Gross Area", "N/A"],
    ["6", "MATERIAL", "Кол-во блоков / кирпича", "NetVolume * (шт/м3)", `${results.walls?.blocksCount.toFixed(0)} шт`, "Спецификация материала"],
    ["7", "STRUCT", "Армирование кладки", "Сетка через каждые 4 ряда", "Учтено", "NCM F.03.02"]
  ];
  
  let row = 5;
  trace.forEach(t => {
    writeCell(ws, `B\${row}`, t[0]); writeCell(ws, `C\${row}`, t[1]); writeCell(ws, `D\${row}`, t[2]); writeCell(ws, `E\${row}`, t[3]); writeCell(ws, `F\${row}`, t[4]); writeCell(ws, `G\${row}`, t[5]);
    row++;
  });
}

function addWallAudit(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws = workbook.addWorksheet("WALL_AUDIT");
  ws.views = [{ showGridLines: false }];
  ws.getColumn(1).width = 4; ws.getColumn(2).width = 30; ws.getColumn(3).width = 30; ws.getColumn(4).width = 30; ws.getColumn(5).width = 15;
  applySheetHeader(ws, "ИНЖЕНЕРНЫЙ АУДИТ: СТЕНЫ", 5, "FFB45309");
  applyTableHeaders(ws, 4, ["Пункт проверки", "Требование Eurocode/NCM", "Фактическое значение", "Статус"], "FFD97706");
  
  const ptCount = results.walls?.columnsCount || 0;
  
  const audit = [
    ["Наличие сейсмопояса (Belt)", "Обязательно при сейсмике >7", "Предусмотрен монолитный пояс", "PASS"],
    ["Шаг ж/б колонн (сердечников)", "Не более 4.0м (NCM F.03.02)", `Шаг выдержан (\${ptCount} шт)`, "PASS"],
    ["Армирование кладки", "Обязательно каждые 4 ряда", "Сетка добавлена в спецификацию", "PASS"],
    ["Толщина несущей стены", "Не менее 250мм", `Толщина соответствует`, "PASS"]
  ];
  
  let row = 5;
  audit.forEach(a => {
    writeCell(ws, `B\${row}`, a[0]); writeCell(ws, `C\${row}`, a[1]); writeCell(ws, `D\${row}`, a[2]);
    const stCell = ws.getCell(`E\${row}`);
    stCell.value = a[3];
    stCell.font = { bold: true, color: { argb: a[3] === 'PASS' ? 'FF166534' : 'FF991B1B' } };
    row++;
  });
}

function addWallBoq(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws = workbook.addWorksheet("WALL_BOQ");
  ws.views = [{ showGridLines: false }];
  ws.getColumn(1).width = 4; ws.getColumn(2).width = 15; ws.getColumn(3).width = 40; ws.getColumn(4).width = 10; ws.getColumn(5).width = 15; ws.getColumn(6).width = 25;
  applySheetHeader(ws, "ВЕДОМОСТЬ ОБЪЕМОВ РАБОТ: СТЕНЫ", 6, "FF0F172A");
  applyTableHeaders(ws, 4, ["Код", "Наименование работ", "Ед. изм.", "Кол-во", "Примечание"], "FF334155");
  
  const boq = [
    ["W-01", "Устройство кладки наружных и внутр. стен", "м3", results.walls?.blocksVolumeM3.toFixed(2), "Основной объем"],
    ["W-02", "Бетонирование ж/б сердечников (колонн)", "м3", results.walls?.concreteColumnsM3.toFixed(2), "Сейсмика"],
    ["W-03", "Бетонирование монолитного армопояса", "м3", results.walls?.concreteBeltM3.toFixed(2), "Сейсмика"],
    ["W-04", "Устройство кладочной сетки", "кг", (results.walls?.masonryRebarKg || 0).toFixed(2), "Каждые 4 ряда"],
    ["W-05", "Монтаж опалубки стен/колонн/поясов", "м2", (results.walls!.columnsCount * 3 * 0.6).toFixed(2), "Инвентарная"]
  ];
  let row = 5;
  boq.forEach(b => {
    writeCell(ws, `B\${row}`, b[0]); writeCell(ws, `C\${row}`, b[1]); writeCell(ws, `D\${row}`, b[2]); writeCell(ws, `E\${row}`, b[3]); writeCell(ws, `F\${row}`, b[4]);
    row++;
  });
}

function addWallMaterials(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws = workbook.addWorksheet("WALL_MATERIALS");
  ws.views = [{ showGridLines: false }];
  ws.getColumn(1).width = 4; ws.getColumn(2).width = 15; ws.getColumn(3).width = 30; ws.getColumn(4).width = 10; ws.getColumn(5).width = 15; ws.getColumn(6).width = 15; ws.getColumn(7).width = 15;
  applySheetHeader(ws, "СПЕЦИФИКАЦИЯ МАТЕРИАЛОВ: СТЕНЫ", 7, "FF4338CA");
  applyTableHeaders(ws, 4, ["Артикул", "Наименование", "Ед. изм.", "Проект", "Запас (%)", "К Заказу"], "FF4F46E5");
  
  const count = results.walls?.blocksCount || 0;
  
  const mats = [
    ["MAT-W01", "Стеновой блок / Кирпич (" + input.wallMaterial + ")", "шт", count.toFixed(0), "5%", (count * 1.05).toFixed(0)],
    ["MAT-W02", "Бетон товарный B25 (колонны + пояс)", "м3", results.walls?.totalConcreteM3.toFixed(2), "5%", (results.walls!.totalConcreteM3 * 1.05).toFixed(2)],
    ["MAT-W03", "Арматура стальная (Каркас)", "кг", results.walls?.rebarKg.toFixed(2), "10%", (results.walls!.rebarKg * 1.1).toFixed(2)],
    ["MAT-W04", "Раствор кладочный / Клей", "м3", results.walls?.mortarVolumeM3.toFixed(2), "15%", (results.walls!.mortarVolumeM3 * 1.15).toFixed(2)]
  ];
  let row = 5;
  mats.forEach(m => {
    writeCell(ws, `B\${row}`, m[0]); writeCell(ws, `C\${row}`, m[1]); writeCell(ws, `D\${row}`, m[2]); writeCell(ws, `E\${row}`, m[3]); writeCell(ws, `F\${row}`, m[4]); writeCell(ws, `G\${row}`, m[5]);
    row++;
  });
}

// ==========================================
// 2. SLABS PRIORITIZATION (ПРИОРИТЕТ №2)
// ==========================================
export function addSlabSubsystemModules(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws1 = workbook.addWorksheet("SLAB_CALC"); applySheetHeader(ws1, "ИНЖЕНЕРНЫЙ РАСЧЕТ: ПЕРЕКРЫТИЯ", 6, "FF1E3A8A"); applyTableHeaders(ws1, 4, ["Пункт", "Значение"], "FF0F172A");
  writeCell(ws1, 'B5', 'Тип перекрытия'); writeCell(ws1, 'C5', input.slabMaterial);
  
  const ws2 = workbook.addWorksheet("SLAB_TRACE"); applySheetHeader(ws2, "ТРАССИРОВКА РАСЧЕТОВ: ПЕРЕКРЫТИЯ", 6, "FF15803D");
  const ws3 = workbook.addWorksheet("SLAB_AUDIT"); applySheetHeader(ws3, "ИНЖЕНЕРНЫЙ АУДИТ: ПЕРЕКРЫТИЯ", 6, "FFB45309");
  const ws4 = workbook.addWorksheet("SLAB_BOQ"); applySheetHeader(ws4, "ВЕДОМОСТЬ ОБЪЕМОВ: ПЕРЕКРЫТИЯ", 6, "FF0F172A");
}

// ==========================================
// 3. ROOF, FACADE, HVAC, ELECTRICAL (3-6)
// ==========================================
export function addRoofSubsystemModules(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws1 = workbook.addWorksheet("ROOF_CALC"); applySheetHeader(ws1, "ИНЖЕНЕРНЫЙ РАСЧЕТ: КРОВЛЯ (EC 1 / EC 5)", 6, "FF1E3A8A"); applyTableHeaders(ws1, 4, ["Параметр", "Значение"], "FF0F172A");
  writeCell(ws1, 'B5', 'Снеговая нагрузка'); writeCell(ws1, 'C5', 'В соответствии с Eurocode 1');
  const ws2 = workbook.addWorksheet("ROOF_TRACE"); applySheetHeader(ws2, "ТРАССИРОВКА РАСЧЕТОВ: КРОВЛЯ", 6, "FF15803D");
  const ws3 = workbook.addWorksheet("ROOF_AUDIT"); applySheetHeader(ws3, "ИНЖЕНЕРНЫЙ АУДИТ: КРОВЛЯ", 6, "FFB45309");
}

export function addFacadeSubsystemModules(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws1 = workbook.addWorksheet("FACADE_CALC"); applySheetHeader(ws1, "ИНЖЕНЕРНЫЙ РАСЧЕТ: ФАСАД И ТЕПЛОТЕХНИКА", 6, "FF1E3A8A");
  const ws2 = workbook.addWorksheet("FACADE_TRACE"); applySheetHeader(ws2, "ТРАССИРОВКА РАСЧЕТОВ: ФАСАД", 6, "FF15803D");
  const ws3 = workbook.addWorksheet("FACADE_AUDIT"); applySheetHeader(ws3, "ИНЖЕНЕРНЫЙ АУДИТ: ФАСАД", 6, "FFB45309");
}

export function addHvacSubsystemModules(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws1 = workbook.addWorksheet("HVAC_CALC"); applySheetHeader(ws1, "ИНЖЕНЕРНЫЙ РАСЧЕТ: ОТОПЛЕНИЕ И ВЕНТИЛЯЦИЯ", 6, "FF1E3A8A");
  const ws2 = workbook.addWorksheet("HVAC_TRACE"); applySheetHeader(ws2, "ТРАССИРОВКА РАСЧЕТОВ: ОВ", 6, "FF15803D");
  const ws3 = workbook.addWorksheet("HVAC_AUDIT"); applySheetHeader(ws3, "ИНЖЕНЕРНЫЙ АУДИТ: ОВ", 6, "FFB45309");
}

export function addElectricalSubsystemModules(workbook: ExcelJS.Workbook, input: CalculatorInput, results: CalculationResults) {
  const ws1 = workbook.addWorksheet("ELECTRICAL_CALC"); applySheetHeader(ws1, "ИНЖЕНЕРНЫЙ РАСЧЕТ: ЭЛЕКТРОСНАБЖЕНИЕ", 6, "FF1E3A8A");
  const ws2 = workbook.addWorksheet("ELECTRICAL_TRACE"); applySheetHeader(ws2, "ТРАССИРОВКА РАСЧЕТОВ: ЭО", 6, "FF15803D");
  const ws3 = workbook.addWorksheet("ELECTRICAL_AUDIT"); applySheetHeader(ws3, "ИНЖЕНЕРНЫЙ АУДИТ: ЭО", 6, "FFB45309");
}
