const fs = require('fs');

const code = `
export function addEngineeringProofSheet(workbook: ExcelJS.Workbook, results: CalculationResults) {
  const ws = workbook.addWorksheet("Расчетное обоснование");
  ws.views = [{ showGridLines: true }];

  ws.getColumn(1).width = 4;   // Spacing
  ws.getColumn(2).width = 30;  // Система / Раздел
  ws.getColumn(3).width = 25;  // Норматив
  ws.getColumn(4).width = 20;  // Пункт документа
  ws.getColumn(5).width = 40;  // Детали расчета (Calculation Details)
  ws.getColumn(6).width = 15;  // Результат проверки

  applySheetHeader(ws, "Расчётное обоснование (Eurocode & NCM Compliance)", 6, "FF1E3A8A");
  
  applyTableHeaders(ws, 4, [
    "Система / Технология",
    "Нормативный документ",
    "Пункт нормативного документа",
    "Расчёт",
    "Результат"
  ], "FF1E40AF");

  let currentRow = 5;

  if (results && results.options) {
    results.options.forEach((opt: any) => {
      if (!opt.justification || opt.justification.normativeChecks.length === 0) return;

      // Header for option
      ws.mergeCells(\`B\${currentRow}:F\${currentRow}\`);
      const hdrCell = ws.getCell(\`B\${currentRow}\`);
      hdrCell.value = \`📍 \${opt.nameRu || opt.type}\`;
      hdrCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF0F172A" } };
      hdrCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
      currentRow++;

      // Data rows
      opt.justification.normativeChecks.forEach((check: any) => {
        writeCell(ws, \`B\${currentRow}\`, opt.type);
        writeCell(ws, \`C\${currentRow}\`, check.normativeDocument, { font: { bold: true } });
        writeCell(ws, \`D\${currentRow}\`, check.clause, { font: { italic: true } });
        writeCell(ws, \`E\${currentRow}\`, check.calculationDetails, { font: { name: "Consolas", size: 9 } });
        
        const statusCell = ws.getCell(\`F\${currentRow}\`);
        statusCell.value = check.isPass ? "PASS ✔️" : "FAIL ❌";
        statusCell.font = { bold: true, color: check.isPass ? { argb: "FF166534" } : { argb: "FF991B1B" } };
        statusCell.alignment = { horizontal: "center" };

        const bgHex = (currentRow % 2 === 0) ? "FFF8FAFC" : "FFFFFFFF";
        ["B","C","D","E","F"].forEach(col => {
          const cell = ws.getCell(\`\${col}\${currentRow}\`);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgHex } };
          cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
        });

        currentRow++;
      });
      
      // Add gap between options
      currentRow++;
    });
  }
}
`;

fs.appendFileSync('src/utils/excelExport.ts', code);
