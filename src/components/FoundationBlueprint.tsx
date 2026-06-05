import React, { useState, useRef, useEffect } from "react";
import { CalculatorInput, CalculationResults, FoundationOption } from "../types";
import { REGION_DATA } from "../utils/calc";
import { 
  Compass, 
  Layers, 
  Grid, 
  FileImage, 
  HelpCircle, 
  Maximize2, 
  Bookmark, 
  Activity,
  ArrowRight,
  Clipboard,
  ShieldAlert,
  ArrowDownToLine
} from "lucide-react";

interface FoundationBlueprintProps {
  selectedOption: FoundationOption;
  results: CalculationResults;
}

export default function FoundationBlueprint({ selectedOption, results }: FoundationBlueprintProps) {
  const [activeTab, setActiveTab] = useState<"blueprint" | "rebar" | "layers">("blueprint");
  const [scalePix, setScalePix] = useState<number>(1); // Zoom factor
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const fndId = selectedOption.id; // slab | strip | piles
  const input = results.input;

  // --- MATHEMATICALLY ACCURATE BLUEPRINT DIMENSIONS (in mm) ---
  const widthM = selectedOption.widthM || 0.4;
  const depthM = selectedOption.depthM || 1.0;

  const footingWidth = Math.round(widthM * 1000); // e.g. 600 or 800 mm
  const embedDepth = Math.round(depthM * 1000); // e.g. 1000 or 1200 mm
  const plinthHeight = fndId === "slab" ? 150 : 400; // Above ground height (цоколь)
  const totalConcreteHeight = embedDepth + plinthHeight; // Ground line references
  
  // Stem wall (тело ленты) width
  const stemWidth = input.wallMaterial === "KOTELET" ? 400 : 300; 

  // Cushion thickness
  const cushionThickness = fndId === "slab" ? 250 : 150; 
  // Insulation thickness
  const insulationThickness = fndId === "slab" ? 100 : 50; 

  // Rebar specs
  const longDiameter = selectedOption.materials.rebarLongitudinalDiameter || 12;
  const transDiameter = selectedOption.materials.rebarTransverseDiameter || 8;
  const concreteCover = 40; // protective cover 40mm

  // Drawing scaling factor (mm to pixels)
  // We want to fit within a 640x440 canvas
  const canvasWidth = 640;
  const canvasHeight = 440;

  // Render on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background with crisp modern CAD blueprint slate fill
    ctx.fillStyle = "#0f172a"; // Slate-900
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid lines
    ctx.strokeStyle = "rgba(51, 65, 85, 0.35)"; // Slate-700
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }

    // Title / Border
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)"; // Blue-500
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvasWidth - 20, canvasHeight - 20);

    ctx.font = "bold 11px 'JetBrains Mono', Courier, monospace";
    ctx.fillStyle = "#60a5fa"; // Blue-400
    ctx.fillText("BIM-CAD STRUCTURAL CROSS SECTION", 25, 28);
    ctx.fillStyle = "#94a3b8"; // Slate-400
    ctx.fillText(`Scale: 1:15 | Option: ${selectedOption.type}`, 25, 42);

    // Coordinate centers
    const centerX = canvasWidth / 2 - 30;
    const groundY = 240; // Ground line

    // Render depending on foundation type
    if (fndId === "slab") {
      drawSlabCrossSection(ctx, centerX, groundY);
    } else if (fndId === "strip") {
      drawStripCrossSection(ctx, centerX, groundY);
    } else {
      drawPileCrossSection(ctx, centerX, groundY);
    }

  }, [fndId, activeTab, selectedOption, results]);

  // --- DRAWING THE MONOLITHIC SLAB (ПЛИТА) ---
  const drawSlabCrossSection = (
    ctx: CanvasRenderingContext2D,
    cX: number,
    gY: number
  ) => {
    // Dimension scale multiplier: 1mm = 0.25 pixels (e.g. 1000mm = 250px)
    const scale = 0.42;
    const slabW = Math.max(10, Math.min(12, input.width)) * 1000; // map to fits
    const drawW = 380; // width of slab shown on screen
    const slabH = embedDepth + plinthHeight; // e.g. 200 + 150 = 350mm
    const drawH = slabH * scale; // draw height

    const leftX = cX - drawW / 2;
    const rightX = cX + drawW / 2;
    const topY = gY - plinthHeight * scale;
    const bottomY = topY + drawH;

    // 1. Sand-gravel подушка (Cushion)
    const cushionH = cushionThickness * scale;
    ctx.fillStyle = "rgba(234, 179, 8, 0.15)"; // Yellow-500 (sand)
    ctx.fillRect(leftX - 15, bottomY + insulationThickness * scale, drawW + 30, cushionH);
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX - 15, bottomY + insulationThickness * scale, drawW + 30, cushionH);

    // Geotextile layer line
    ctx.strokeStyle = "#a1a1aa";
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(leftX - 25, bottomY + insulationThickness * scale + cushionH);
    ctx.lineTo(rightX + 25, bottomY + insulationThickness * scale + cushionH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cushion annotation
    drawDimensionArrow(ctx, leftX - 15, bottomY + insulationThickness * scale + cushionH, leftX - 15, bottomY + insulationThickness * scale, "H=" + cushionThickness + " мм", -40);

    // 2. Heat insulation XPS layer
    const xpsH = insulationThickness * scale;
    ctx.fillStyle = "rgba(249, 115, 22, 0.25)"; // Orange-500 XPS
    ctx.fillRect(leftX - 10, bottomY, drawW + 20, xpsH);
    ctx.strokeStyle = "#f97316";
    ctx.strokeRect(leftX - 10, bottomY, drawW + 20, xpsH);

    // Side XPS vertical
    ctx.fillRect(leftX - 10, topY, 10, drawH);
    ctx.strokeRect(leftX - 10, topY, 10, drawH);
    ctx.fillRect(rightX, topY, 10, drawH);
    ctx.strokeRect(rightX, topY, 10, drawH);

    // 3. Concrete Slab fill
    ctx.fillStyle = "rgba(148, 163, 184, 0.3)"; // Slate concrete
    ctx.fillRect(leftX, topY, drawW, drawH);
    ctx.strokeStyle = "#38bdf8"; // Light Blue
    ctx.lineWidth = 2;
    ctx.strokeRect(leftX, topY, drawW, drawH);

    // Concrete hatch strokes (classical triangle aggregates)
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let x = leftX + 15; x < rightX; x += 45) {
      drawConcreteChipplies(ctx, x, topY + drawH / 2);
    }

    // Ground level line left & right
    ctx.strokeStyle = "#10b981"; // Emerald-500
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(25, gY);
    ctx.lineTo(leftX - 10, gY);
    ctx.moveTo(rightX + 10, gY);
    ctx.lineTo(canvasWidth - 25, gY);
    ctx.stroke();

    // Natural soil slope line
    ctx.fillStyle = "rgba(16, 185, 129, 0.1)";
    ctx.beginPath();
    ctx.moveTo(25, gY);
    ctx.lineTo(leftX - 10, gY);
    ctx.lineTo(leftX - 10, canvasHeight - 20);
    ctx.lineTo(25, canvasHeight - 20);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(rightX + 10, gY);
    ctx.lineTo(canvasWidth - 25, gY);
    ctx.lineTo(canvasWidth - 25, canvasHeight - 20);
    ctx.lineTo(rightX + 10, canvasHeight - 20);
    ctx.closePath();
    ctx.fill();

    // Rebar representation
    if (activeTab === "rebar" || activeTab === "blueprint") {
      const cover = concreteCover * scale;
      const rebarSpacing = 200 * scale; // 200mm spacing

      ctx.strokeStyle = "#ef4444"; // Red for steel rebar
      ctx.lineWidth = 1.8;
      
      // Bottom longitudinal
      ctx.beginPath();
      ctx.moveTo(leftX + cover, bottomY - cover);
      ctx.lineTo(rightX - cover, bottomY - cover);
      // Top longitudinal
      ctx.moveTo(leftX + cover, topY + cover);
      ctx.lineTo(rightX - cover, topY + cover);
      ctx.stroke();

      // Transverse dots / circles
      ctx.fillStyle = "#ef4444";
      for (let rx = leftX + cover + 5; rx < rightX - cover; rx += rebarSpacing) {
        // bottom dots
        ctx.beginPath();
        ctx.arc(rx, bottomY - cover, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // top dots
        ctx.beginPath();
        ctx.arc(rx, topY + cover, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Support spacers / plastic chairs (стульчики / чашки защитного слоя)
        if (Math.round(rx) % 3 === 0 || (rx > leftX + 35 && rx < leftX + 55) || (rx > rightX - 55 && rx < rightX - 35)) {
          ctx.strokeStyle = "#94a3b8"; // Slate-400
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rx - 5, bottomY);
          ctx.lineTo(rx - 2.5, bottomY - cover + 3);
          ctx.lineTo(rx + 2.5, bottomY - cover + 3);
          ctx.lineTo(rx + 5, bottomY);
          ctx.stroke();
        }

        // Frog spacer (лягушки) linking meshes shown at regular spaces
        if (Math.round(rx) % 3 === 0 || rx > leftX + 80 && rx < leftX + 120) {
          ctx.beginPath();
          ctx.moveTo(rx - 8, bottomY - cover);
          ctx.lineTo(rx, topY + cover);
          ctx.lineTo(rx + 8, bottomY - cover);
          ctx.stroke();
        }
      }

      // Rebar labels
      if (activeTab === "rebar") {
        drawPointerLabel(ctx, rightX - 60, topY + cover, "Верхняя рабочая сетка d" + longDiameter + " А500С шаг 200 (ДБН / СП)", 35, -45);
        drawPointerLabel(ctx, rightX - 100, bottomY - cover, "Нижняя рабочая сетка d" + longDiameter + " А500С шаг 200 (СП 63 / ГОСТ)", 60, 40);
        drawPointerLabel(ctx, leftX + 50, topY + (bottomY - topY)/2, "Разделитель сеток 'Лягушка' h=" + Math.round(slabH - 2*concreteCover) + " мм из d8", -20, -25);
        drawPointerLabel(ctx, leftX + 35, bottomY - cover / 2, "Фиксаторы защитного слоя (чашки/стульчики) h=40 мм", -45, 35);
      }
    }

    // DIMENSION ANNOTATIONS
    // Slab thickness
    drawDimensionArrow(ctx, rightX + 25, topY, rightX + 25, bottomY, "H = " + slabH + " мм", 35);
    // Plinth height
    drawDimensionArrow(ctx, rightX + 25, topY, rightX + 25, gY, "Цоколь " + plinthHeight + " мм", 100);
    // Sand bedding cushion depth text
    if (activeTab === "layers") {
      drawPointerLabel(ctx, leftX + 40, bottomY + 30, "Песчано-гравийная подушка " + cushionThickness + "мм (трамбованная)", -30, 25);
      drawPointerLabel(ctx, leftX - 5, topY + drawH / 2, "Penoplex XPS " + insulationThickness + "мм цокольный", -100, -30);
      drawPointerLabel(ctx, rightX - 40, bottomY + 5, "Пеноплэкс XPS " + insulationThickness + "мм подплитный", 55, 30);
    }
  };

  // --- DRAWING THE STRIP FOUNDATION (ЛЕНТОЧНЫЙ) ---
  const drawStripCrossSection = (
    ctx: CanvasRenderingContext2D,
    cX: number,
    _unused_gY: number
  ) => {
    // Dynamic Scale Calculation to prevent any bottom clipping (canvas height is 440)
    // Total vertical physical size = Plinth (400) + Embed depth (e.g. 1000) + Cushion (100) = 1500mm
    const physicalHeight = plinthHeight + embedDepth + 100;
    const verticalBudget = 330; // Max pixels of vertical space inside 440
    const scale = Math.min(0.24, verticalBudget / physicalHeight);

    const drawStemW = stemWidth * scale; // stem wall top width
    const drawFootingW = footingWidth * scale; // footing bottom width (плита-пята)
    const drawEmbedH = embedDepth * scale; // buried height
    const drawPlinthH = plinthHeight * scale; // above ground height
    const footingH = 300 * scale; // footing height (пята всегда 300мм)

    // Base of sand bedding anchored near the bottom of canvas (at 395px)
    const cushionBottomY = 395;
    const cushionVal = 100;
    const cushionH = cushionVal * scale;
    const bottomY = cushionBottomY - cushionH; // footing bottom concrete level
    const footingY = bottomY - footingH; // top of footing
    const gY = bottomY - drawEmbedH; // ground level
    const topY = gY - drawPlinthH; // top of concrete stem

    const stemLeftX = cX - drawStemW / 2;
    const stemRightX = cX + drawStemW / 2;
    const footingLeftX = cX - drawFootingW / 2;
    const footingRightX = cX + drawFootingW / 2;

    // 1. Sand cushion base (Песчаная подготовка под подошву)
    ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
    ctx.fillRect(footingLeftX - 15, bottomY, drawFootingW + 30, cushionH);
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 1;
    ctx.strokeRect(footingLeftX - 15, bottomY, drawFootingW + 30, cushionH);
    drawDimensionArrow(ctx, footingLeftX - 15, bottomY + cushionH, footingLeftX - 15, bottomY, cushionVal + " мм", -30);

    // 2. Concrete Footing (плита-пята / подошва)
    ctx.fillStyle = "rgba(148, 163, 184, 0.3)";
    ctx.fillRect(footingLeftX, footingY, drawFootingW, footingH);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(footingLeftX, footingY, drawFootingW, footingH);

    // 3. Concrete Stem (стена ленты / цоколь)
    ctx.fillRect(stemLeftX, topY, drawStemW, footingY - topY);
    ctx.strokeRect(stemLeftX, topY, drawStemW, footingY - topY);

    // Triangles concrete style
    drawConcreteChipplies(ctx, cX, topY + 40);
    drawConcreteChipplies(ctx, cX - 15, footingY + 15);
    drawConcreteChipplies(ctx, cX + 15, footingY + 15);

    // Ground level line (Земля)
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, gY);
    ctx.lineTo(stemLeftX - 15, gY); // left ground
    ctx.moveTo(stemRightX + 15, gY); // right ground
    ctx.lineTo(canvasWidth - 30, gY);
    ctx.stroke();

    // Exterior ground shading
    ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
    ctx.fillRect(30, gY, stemLeftX - 45, canvasHeight - gY - 20);
    ctx.fillRect(stemRightX + 45, gY, canvasWidth - 30 - (stemRightX + 45), canvasHeight - gY - 20);

    // Blind area (Отмостка) on the right side of stem
    const drawBlindW = 160; 
    const drawBlindH1 = 22; 
    ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
    ctx.beginPath();
    ctx.moveTo(stemRightX, gY - 5);
    ctx.lineTo(stemRightX + drawBlindW, gY + 10);
    ctx.lineTo(stemRightX + drawBlindW, gY + 10 + drawBlindH1);
    ctx.lineTo(stemRightX, gY + drawBlindH1 + 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Drainage on the right side bottom next to footing
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.fillRect(footingRightX + 5, footingY - 10, 40, 50);
    ctx.strokeStyle = "#3b82f6";
    ctx.strokeRect(footingRightX + 5, footingY - 10, 40, 50);
    // Pipe circle
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(footingRightX + 25, footingY + 15, 12 * scale * 4, 0, Math.PI*2);
    ctx.stroke();
    ctx.fill();

    // Heat Insulation Penoplex on outer side
    ctx.fillStyle = "#f97316"; // Orange
    ctx.fillRect(stemRightX, topY, 8, gY - topY + 40); 
    ctx.strokeRect(stemRightX, topY, 8, gY - topY + 40);

    // REBAR REINFORCEMENT DRAWING FOR STRIP FOUNDATION WITH PROPER HOOKS & LABELS
    if (activeTab === "rebar" || activeTab === "blueprint") {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.8;
      const cover = concreteCover * scale;

      // 1. Footing (Подошва) transverse primary tension rebar block
      ctx.beginPath();
      ctx.moveTo(footingLeftX + cover, bottomY - cover);
      ctx.lineTo(footingRightX - cover, bottomY - cover);
      ctx.stroke();

      // Footing longitudinal reinforcement dots (СП 63.13330 / ДБН)
      ctx.fillStyle = "#ef4444";
      const dotsSpacing = (drawFootingW - 2 * cover) / 5;
      for (let i = 0; i <= 5; i++) {
        const fx = footingLeftX + cover + i * dotsSpacing;
        ctx.beginPath();
        ctx.arc(fx, bottomY - cover, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Support spacers (стульчики / чашки) on the concrete preparation bedding
        if (i === 1 || i === 4) {
          ctx.strokeStyle = "#94a3b8"; // Slate-400 spacer
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(fx - 5, bottomY);
          ctx.lineTo(fx - 2, bottomY - cover + 2);
          ctx.lineTo(fx + 2, bottomY - cover + 2);
          ctx.lineTo(fx + 5, bottomY);
          ctx.stroke();
        }
      }

      // 2. Vertical main framework in stem with bottom bent anchor hooks into footing
      const stemCover = (concreteCover + 10) * scale;
      const rebarLeftX = stemLeftX + stemCover;
      const rebarRightX = stemRightX - stemCover;

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      // Left vertical rebar: Top down to footing bottom with L-bend anchor hooks pointing outward
      ctx.moveTo(rebarLeftX, topY + stemCover);
      ctx.lineTo(rebarLeftX, bottomY - cover - 3);
      ctx.lineTo(rebarLeftX - 35 * scale * 4, bottomY - cover - 3); // L-bend лапка в подошву

      // Right vertical rebar: Top down with L-bend outward hooks
      ctx.moveTo(rebarRightX, topY + stemCover);
      ctx.lineTo(rebarRightX, bottomY - cover - 3);
      ctx.lineTo(rebarRightX + 35 * scale * 4, bottomY - cover - 3); // L-bend лапка
      ctx.stroke();

      // Horizontal closed rings/stirrups (поперечные хомуты) spaced vertically inside the stem
      const ringSpacing = 200 * scale; // 200mm step in seismic/active zones
      const startRingY = topY + stemCover + 5;
      const endRingY = footingY - 5;
      ctx.lineWidth = 1.2;
      for (let ry = startRingY; ry < endRingY; ry += ringSpacing) {
        ctx.strokeRect(rebarLeftX, ry, rebarRightX - rebarLeftX, 1.5);
        
        // Tie dots representation
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(rebarLeftX, ry, 2.2, 0, Math.PI*2);
        ctx.arc(rebarRightX, ry, 2.2, 0, Math.PI*2);
        ctx.fill();
        
        // Mid-rebar support dot if height is large (ДБН / СП конструктивная арматура)
        if (ry > startRingY + 50 && ry < endRingY - 50) {
          ctx.beginPath();
          ctx.arc(rebarLeftX + (rebarRightX - rebarLeftX)/2, ry, 2.2, 0, Math.PI*2);
          ctx.fill();
        }
      }

      if (activeTab === "rebar") {
        drawPointerLabel(ctx, rebarLeftX, topY + 30, "Вертикальная рабочая арматура д" + longDiameter + " А500С (СП 63 / ДБН)", -50, -25);
        drawPointerLabel(ctx, rebarRightX, footingY - 30, "Поперечные закрытые хомуты d" + transDiameter + " шаг 200 мм", 40, -15);
        drawPointerLabel(ctx, footingLeftX + cover + 15, bottomY - cover, "Распределительная сетка подошвы d12 шаг 200 (А500С)", -60, 40);
        drawPointerLabel(ctx, rebarLeftX, bottomY - cover - 10, "Г-образная жесткая анкеровка 'лапка' l >= 40d", -60, -35);
        drawPointerLabel(ctx, cX, topY + 15, "Сейсмопояс " + (REGION_DATA[input.region]?.beltMandatory ? "Обязательно (NCM EN 1998)" : "Рекоменд."), -20, 45);
        drawPointerLabel(ctx, footingLeftX + 25, bottomY - cover / 2, "Фиксаторы-стульчики подошвы h=40 мм (на подбетонке)", -60, 25);
      }
    }

    // DIMENSIONS - perfectly scaled and aligned
    // Embedded depth
    drawDimensionArrow(ctx, footingLeftX - 45, gY, footingLeftX - 45, bottomY, "dfund = " + embedDepth + " мм", -35);
    // Plinth height
    drawDimensionArrow(ctx, footingLeftX - 45, topY, footingLeftX - 45, gY, "Цоколь " + plinthHeight + " мм", -35);
    // Total Height
    drawDimensionArrow(ctx, stemRightX + 105, topY, stemRightX + 105, bottomY, "Высота ленты " + totalConcreteHeight + " мм", 35);
    // Footing Width
    drawDimensionArrow(ctx, footingLeftX, bottomY + 35, footingRightX, bottomY + 35, "Ширина подошвы = " + footingWidth + " мм", 25);
    // Stem wall width
    drawDimensionArrow(ctx, stemLeftX, topY - 15, stemRightX, topY - 15, "Ширина ленты " + stemWidth + " мм", -20);

    if (activeTab === "layers") {
      drawPointerLabel(ctx, stemRightX + drawBlindW / 2, gY + 5, "Отмостка 800мм с уклоном 3%", 45, -35);
      drawPointerLabel(ctx, footingRightX + 25, footingY + 25, "Пристенный дренаж d110 в щебне", 60, -45);
      drawPointerLabel(ctx, stemRightX, topY + drawPlinthH + 20, "XPS утеплитель Penoplex 50мм", 55, 30);
    }
  };

  // --- DRAWING THE PILE FOUNDATION (СВАЙНЫЙ С РОСТВЕРКОМ & ТИСЭ УШИРЕНИЕМ) ---
  const drawPileCrossSection = (
    ctx: CanvasRenderingContext2D,
    cX: number,
    _unused_gY: number
  ) => {
    // Dynamic Scale Calculation for Piles to fit 2000mm length completely inside the 440px canvas
    // Total Height = Grillage Top (gY - 400) down to Pile Bottom (gY + 2000). Budget = 340 pixels
    const totalPhysicalLength = 2000 + 400; // 2400 mm
    const scale = Math.min(0.15, 340 / totalPhysicalLength);

    const drawStemW = stemWidth * scale; // Grillage width
    const drawGrillageH = 500 * scale; // high grillage 500mm
    const drawPileDia = 300 * scale; // 300mm pile diameter
    const drawPileD = 2000 * scale; // pile depth below ground 2000mm

    // Anchoring the bottom-most point of the TISE expansion bulb at 385px
    const pileBottomY = 385; 
    const gY = pileBottomY - drawPileD; // ground level
    const grillageTopY = gY - 400 * scale; // high grillage sitting 400mm above ground level
    const grillageBottomY = grillageTopY + drawGrillageH;

    const grillageLeftX = cX - drawStemW / 2;
    const grillageRightX = cX + drawStemW / 2;

    const pileTopY = grillageBottomY;
    const pileLeftX = cX - drawPileDia / 2;
    const pileRightX = cX + drawPileDia / 2;

    // Airgap / expansion clearance below high grillage (Противопучинистый зазор)
    const gapH = 100 * scale;
    ctx.fillStyle = "rgba(14, 165, 233, 0.12)"; // Cyan airgap color
    ctx.fillRect(grillageLeftX - 15, grillageBottomY, drawStemW + 30, gapH);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(grillageLeftX - 15, grillageBottomY, drawStemW + 30, gapH);

    // 1. Concrete TISE Expanded Base (Пята сопряжения ТИСЭ d=600 мм)
    const flareRadiusMultiplier = 2.0; // TISE double diameter expansion (from 300mm to 600mm)
    const flareW = drawPileDia * flareRadiusMultiplier;
    const flareH = 180 * scale; // height of the hemispherical/trapezoidal bulb at bottom

    // Draw Concrete Pile Shaft and Flared Bulb smoothly
    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Start at top pile shaft left
    ctx.moveTo(pileLeftX, pileTopY);
    // Down to top of flared bulb
    ctx.lineTo(pileLeftX, pileBottomY - flareH);
    // Slope outwards to left base of TISE bulb
    ctx.lineTo(cX - flareW / 2, pileBottomY - 10 * scale);
    // Bottom curved dome of TISE bulb
    ctx.quadraticCurveTo(cX, pileBottomY + 5 * scale, cX + flareW / 2, pileBottomY - 10 * scale);
    // Slope inwards to pile shaft right
    ctx.lineTo(pileRightX, pileBottomY - flareH);
    // Up to top pile shaft right
    ctx.lineTo(pileRightX, pileTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Concrete Grillage (Ростверк монолитный)
    ctx.fillRect(grillageLeftX, grillageTopY, drawStemW, drawGrillageH);
    ctx.strokeRect(grillageLeftX, grillageTopY, drawStemW, drawGrillageH);

    // Hatch concrete marks
    drawConcreteChipplies(ctx, cX, grillageTopY + 25);
    drawConcreteChipplies(ctx, cX, pileTopY + 80);
    drawConcreteChipplies(ctx, cX, pileBottomY - flareH - 20);

    // Ground line representation
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, gY);
    ctx.lineTo(grillageLeftX - 10, gY);
    ctx.moveTo(grillageRightX + 10, gY);
    ctx.lineTo(canvasWidth - 35, gY);
    ctx.stroke();

    // Multi-layer Soil Hatching under ground
    ctx.fillStyle = "rgba(168, 162, 158, 0.08)"; // stone layer
    ctx.fillRect(35, gY, grillageLeftX - 45, (pileBottomY - flareH) - gY);
    ctx.fillRect(grillageRightX + 45, gY, canvasWidth - 30 - (grillageRightX + 45), (pileBottomY - flareH) - gY);

    ctx.fillStyle = "rgba(120, 113, 108, 0.12)"; // loam layer (глина) near bottom
    ctx.fillRect(35, pileBottomY - flareH, grillageLeftX - 45, flareH + 20);
    ctx.fillRect(grillageRightX + 45, pileBottomY - flareH, canvasWidth - 30 - (grillageRightX + 45), flareH + 20);

    // REBAR REINFORCEMENT FRAMEWORK WITH ANCHORED FLARING INSIDE TISE BULB
    if (activeTab === "rebar" || activeTab === "blueprint") {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.8;
      const cover = concreteCover * scale;

      // Pile reinforcement rods (4 vertical bars d12 class A500C)
      const rLeft = pileLeftX + cover;
      const rRight = pileRightX - cover;

      ctx.beginPath();
      // Left vertical rebar: from inside TISE bulb, flaring slightly outward, up through pile shaft into grillage
      ctx.moveTo(cX - (flareW / 2) + cover, pileBottomY - 15 * scale); // anchored in flared base
      ctx.lineTo(rLeft, pileBottomY - flareH); // goes up to shaft width
      ctx.lineTo(rLeft, grillageTopY + cover + 4); // goes all the way up into grillage
      ctx.lineTo(rLeft + 15, grillageTopY + cover + 4); // L-bend hooks into grillage seismic zone

      // Right vertical rebar: anchored in bulb, up through shaft into top grillage
      ctx.moveTo(cX + (flareW / 2) - cover, pileBottomY - 15 * scale);
      ctx.lineTo(rRight, pileBottomY - flareH);
      ctx.lineTo(rRight, grillageTopY + cover + 4);
      ctx.lineTo(rRight - 15, grillageTopY + cover + 4); // L-bend
      ctx.stroke();

      // Horizontal circular spiral confinement stirrups in pile shaft (СП 24.13330 / ТИСЭ)
      const tieSpacing = 200 * scale; // 200mm seismic confining step
      ctx.lineWidth = 1.2;
      for (let ty = pileTopY + 30; ty < pileBottomY - flareH - 10; ty += tieSpacing) {
        ctx.beginPath();
        ctx.moveTo(rLeft, ty);
        ctx.lineTo(rRight, ty);
        ctx.stroke();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(rLeft, ty, 2, 0, Math.PI*2);
        ctx.arc(rRight, ty, 2, 0, Math.PI*2);
        ctx.fill();
      }

      // Reinforcement inside the Grillage (Ростверк - 4 x d14 long bars and hoops)
      const grilCover = (concreteCover + 5) * scale;
      const grilRL = grillageLeftX + grilCover;
      const grilRR = grillageRightX - grilCover;
      
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      // Upper longitudinal bars
      ctx.moveTo(grilRL, grillageTopY + grilCover);
      ctx.lineTo(grilRR, grillageTopY + grilCover);
      // Lower longitudinal bars
      ctx.moveTo(grilRL, grillageBottomY - grilCover);
      ctx.lineTo(grilRR, grillageBottomY - grilCover);
      ctx.stroke();

      // Stirrup hoops wrapping grillage
      for (let gx = grilRL + 10; gx < grilRR; gx += 25) {
        ctx.lineWidth = 1.0;
        ctx.strokeRect(gx, grillageTopY + grilCover, 1.5, drawGrillageH - 2 * grilCover);
      }

      if (activeTab === "rebar") {
        drawPointerLabel(ctx, rLeft, pileTopY + 60, "Рабочий каркас сваи d12 А500С (4 стержня)", -50, 45);
        drawPointerLabel(ctx, grilRL, grillageTopY + grilCover + 5, "Продольные стержни ростверка d14 А500С", -45, -35);
        drawPointerLabel(ctx, cX, grillageTopY + grilCover + 12, "Жесткий стыковочный узел с анкеровкой l >= 40d", 45, 25);
        drawPointerLabel(ctx, cX - (flareW/2) + cover + 10, pileBottomY - 15 * scale, "Анкеровка расширения пяты d=600 мм", -60, -25);
      }
    }

    // DIMENSIONS
    // Pile depth below ground
    drawDimensionArrow(ctx, pileLeftX - 60, gY, pileLeftX - 60, pileBottomY, "Lсваи = 2000 мм", -35);
    // Grillage dimensions
    drawDimensionArrow(ctx, grillageLeftX - 25, grillageTopY, grillageLeftX - 25, grillageBottomY, "Hроств = 500 мм", -40);
    drawDimensionArrow(ctx, grillageLeftX, grillageTopY - 15, grillageRightX, grillageTopY - 15, "Ширина ростверка = " + stemWidth + " мм", -30);
    // Air gap dimension label
    drawDimensionArrow(ctx, grillageRightX + 15, grillageBottomY, grillageBottomY + gapH, grillageBottomY, "Зазор 100 мм", 40);
    // TISE Expanded Base Width
    drawDimensionArrow(ctx, cX - flareW / 2, pileBottomY + 25, cX + flareW / 2, pileBottomY + 25, "Диаметр пяты ТИСЭ = 600 мм", 25);

    if (activeTab === "layers") {
      drawPointerLabel(ctx, cX, grillageBottomY + 5, "Противопучинистый воздушный зазор 100мм", 45, 30);
      drawPointerLabel(ctx, cX + flareW / 4, pileBottomY - 10, "Полусферическая пята уширения d=600мм ТИСЭ", 65, 35);
    }
  };

  // --- DRAW BLUEPRINT RENDERING UTILITIES ---

  const drawDimensionArrow = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    text: string,
    offset: number
  ) => {
    ctx.strokeStyle = "#60a5fa"; // Indigo Blue annotation
    ctx.lineWidth = 1;
    ctx.fillStyle = "#60a5fa";

    const isVertical = x1 === x2;
    
    ctx.beginPath();
    if (isVertical) {
      const annotX = x1 + offset;
      // Draw extension lines
      ctx.strokeStyle = "rgba(96, 165, 250, 0.3)";
      ctx.moveTo(x1, y1);
      ctx.lineTo(annotX, y1);
      ctx.moveTo(x2, y2);
      ctx.lineTo(annotX, y2);
      ctx.stroke();

      ctx.strokeStyle = "#60a5fa";
      // Main arrow body line
      ctx.beginPath();
      ctx.moveTo(annotX, y1 + 5);
      ctx.lineTo(annotX, y2 - 5);
      ctx.stroke();

      // Arrow heads
      drawArrowHead(ctx, annotX, y1, "UP");
      drawArrowHead(ctx, annotX, y2, "DOWN");

      // Text label centered rotated vertical or simply aligned
      ctx.save();
      ctx.translate(annotX - 6, y1 + (y2 - y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, 0, 0);
      ctx.restore();
    } else {
      const annotY = y1 + offset;
      // Draw extension lines
      ctx.strokeStyle = "rgba(96, 165, 250, 0.3)";
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1, annotY);
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2, annotY);
      ctx.stroke();

      ctx.strokeStyle = "#60a5fa";
      // Main arrow line
      ctx.beginPath();
      ctx.moveTo(x1 + 5, annotY);
      ctx.lineTo(x2 - 5, annotY);
      ctx.stroke();

      // Arrow heads
      drawArrowHead(ctx, x1, annotY, "LEFT");
      drawArrowHead(ctx, x2, annotY, "RIGHT");

      // Text label
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(text, x1 + (x2 - x1) / 2, annotY - 5);
    }
  };

  const drawArrowHead = (ctx: CanvasRenderingContext2D, x: number, y: number, dir: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.moveTo(x, y);
    if (dir === "UP") {
      ctx.lineTo(x - 3, y + 6);
      ctx.lineTo(x + 3, y + 6);
    } else if (dir === "DOWN") {
      ctx.lineTo(x - 3, y - 6);
      ctx.lineTo(x + 3, y - 6);
    } else if (dir === "LEFT") {
      ctx.lineTo(x + 6, y - 3);
      ctx.lineTo(x + 6, y + 3);
    } else if (dir === "RIGHT") {
      ctx.lineTo(x - 6, y - 3);
      ctx.lineTo(x - 6, y + 3);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawPointerLabel = (
    ctx: CanvasRenderingContext2D,
    rawX: number,
    rawY: number,
    text: string,
    dx: number,
    dy: number
  ) => {
    const endX = rawX + dx;
    const endY = rawY + dy;

    ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; // Red or Orange
    ctx.lineWidth = 1;
    
    // Circle at spot
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(rawX, rawY, 3, 0, Math.PI*2);
    ctx.fill();

    // Line from spot to label
    ctx.beginPath();
    ctx.moveTo(rawX, rawY);
    ctx.lineTo(endX, endY);
    ctx.lineTo(endX + (dx > 0 ? 20 : -20), endY);
    ctx.stroke();

    // Text label
    ctx.fillStyle = "#f8fafc"; // White text
    ctx.font = "9px 'Inter', sans-serif";
    ctx.textAlign = dx > 0 ? "left" : "right";
    ctx.fillText(text, endX + (dx > 0 ? 5 : -5), endY - 3);
  };

  const drawConcreteChipplies = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.strokeStyle = "rgba(148, 163, 184, 0.5)";
    ctx.lineWidth = 1;
    // Tiny triangles + dots
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y - 5);
    ctx.lineTo(x + 6, y);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x - 10, y + 5, 0.8, 0, Math.PI*2);
    ctx.arc(x + 12, y - 2, 0.8, 0, Math.PI*2);
    ctx.fill();
  };

  return (
    <div id="foundation-blueprint-panel" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-inner mt-5 text-white max-w-full">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <span className="text-[10px] bg-blue-500/15 text-blue-400 font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md mb-1 inline-block">
            BIM-АРХИТЕКТУРНЫЙ РАЗРЕЗ CAD
          </span>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-mono">
            📐 Чертеж пирога и каркаса: <span className="text-blue-400">{selectedOption.type}</span>
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            Автоматическое масштабирование и спецификация сечений по проектной калькуляции Молдовы 
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/60 shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("blueprint")}
            className={`py-1 px-3.5 text-center text-[10.5px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "blueprint" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Проектировочный
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rebar")}
            className={`py-1 px-3.5 text-center text-[10.5px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "rebar" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Схема Армирования
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("layers")}
            className={`py-1 px-3.5 text-center text-[10.5px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === "layers" ? "bg-blue-600 text-white shadow-xs" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Послойность (Пирог)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Draw Board Canvas block */}
        <div className="lg:col-span-8 flex flex-col justify-center items-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800/50 shadow-inner relative group overflow-hidden">
          <canvas 
            ref={canvasRef} 
            width={canvasWidth} 
            height={canvasHeight} 
            className="w-full max-w-full rounded-xl border border-slate-800 bg-[#0f172a] shadow-inner"
          />
          
          <div className="absolute right-6 top-6 bg-slate-900/90 border border-slate-800 text-[10px] px-2 py-1.5 rounded-xl font-mono text-slate-400 backdrop-blur-xs flex items-center gap-1 select-none">
            <Maximize2 className="w-3 h-3 text-blue-500 animate-pulse" />
            <span>Interactive AutoCAD View</span>
          </div>
        </div>

        {/* CAD Specs Table Block */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl shadow-inner space-y-3.5">
            <span className="text-[10px] font-bold tracking-widest text-[#60a5fa] font-mono block uppercase">
              ⚙️ Инженерно-конструкторские нормы
            </span>

            <div className="space-y-2 text-xs divide-y divide-slate-800/50">
              <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                <span className="text-slate-400">Глубина заложения d_fund:</span>
                <span className="font-mono font-bold text-slate-200">{embedDepth} мм</span>
              </div>
              <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                <span className="text-slate-400">Высота над землей (цоколь):</span>
                <span className="font-mono font-bold text-slate-200">{plinthHeight} мм</span>
              </div>
              
              {fndId === "strip" && (
                <>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Ширина подошвы (плиты-пяты):</span>
                    <span className="font-mono font-bold text-slate-200">{footingWidth} мм</span>
                  </div>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Высота подошвы (пяты):</span>
                    <span className="font-mono font-bold text-slate-200">300 мм</span>
                  </div>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Ширина ленты на выходе:</span>
                    <span className="font-mono font-bold text-slate-200">{stemWidth} мм</span>
                  </div>
                </>
              )}

              {fndId === "slab" && (
                <>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Толщина монолитной плиты:</span>
                    <span className="font-mono font-bold text-slate-200">{embedDepth + plinthHeight} мм</span>
                  </div>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Песчано-гравийная подушка:</span>
                    <span className="font-mono font-bold text-slate-200">{cushionThickness} мм</span>
                  </div>
                </>
              )}

              {fndId === "piles" && (
                <>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Сечение монолитного ростверка:</span>
                    <span className="font-mono font-bold text-slate-200">{stemWidth}x500 мм</span>
                  </div>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Глубина бурения свай под УП:</span>
                    <span className="font-mono font-bold text-[#f43f5e]">{selectedOption.depthM * 1000} мм</span>
                  </div>
                  <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                    <span className="text-slate-400">Диаметр опорных свай d:</span>
                    <span className="font-mono font-bold text-slate-200">300 мм</span>
                  </div>
                </>
              )}

              <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                <span className="text-slate-400">Рабочая арматура каркаса:</span>
                <span className="font-mono font-bold text-slate-200">d{longDiameter} мм A500C</span>
              </div>
              <div className="flex justify-between py-1.5 transition-colors hover:bg-slate-900/30 px-1 rounded-md">
                <span className="text-slate-400">Защитный слой бетона (СП 63):</span>
                <span className="font-mono font-bold text-slate-200">{concreteCover} мм</span>
              </div>
            </div>
          </div>

          {/* Quick PDF / Excel manual tips */}
          <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">
              📥 ТРАНСЛЯЦИЯ В EXCEL
            </span>
            <p className="text-[10.5px] text-slate-350 leading-relaxed font-sans">
              При выгрузке локальной сметы, данный чертеж рендерится и <strong>автоматически встраивается в Excel как полноценное изображение исходного разрешения</strong>. Чертеж дополняется послойной детализацией слоев, чертежными размерами и детальными ссылками на СНиП / NCM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Global drawing helper to paint onto Excel sheet images dynamically or on export
export function drawToCanvasBase64(
  fndId: string,
  widthM: number,
  depthM: number,
  wallMaterial: string,
  region: string
): string {
  // Let's create an offscreen canvas to render a high-res design
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Render blueprint to this canvas
  ctx.fillStyle = "#0f172a"; // Slate-900
  ctx.fillRect(0, 0, 1200, 800);

  // Draw CAD grids
  ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Draw frame
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 1160, 760);

  // Text
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("BIM-CAD STRUCTURAL PLOT & REINFORCEMENT DETAILS", 50, 60);
  ctx.font = "16px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`Foundation Spec: ${fndId === "slab" ? "Slab" : fndId === "strip" ? "Strip" : "Piles"} | Deep: ${depthM}m | Width: ${widthM}m`, 50, 90);

  // Let's draw the specific profile inside this canvas
  const cX = 600;

  if (fndId === "slab") {
    const scale = 0.8;
    const gY = 400;
    // 1. Cushion
    const cushionH = 250 * scale;
    ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
    ctx.fillRect(cX - 350, gY + 100 * scale, 700, cushionH);
    ctx.strokeStyle = "#eab308";
    ctx.strokeRect(cX - 350, gY + 100 * scale, 700, cushionH);

    // 2. Insul
    const insH = 100 * scale;
    ctx.fillStyle = "rgba(249, 115, 22, 0.25)";
    ctx.fillRect(cX - 330, gY, 660, insH);

    // 3. Concrete Slab
    ctx.fillStyle = "rgba(148, 163, 184, 0.3)";
    ctx.fillRect(cX - 320, gY - 150 * scale, 640, 300 * scale);
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(cX - 320, gY - 150 * scale, 640, 300 * scale);

    // Render ground
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(50, gY); ctx.lineTo(cX - 330, gY);
    ctx.moveTo(cX + 330, gY); ctx.lineTo(1150, gY);
    ctx.stroke();

    // Rebar representation
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cX - 300, gY - 100 * scale); ctx.lineTo(cX + 300, gY - 100 * scale);
    ctx.moveTo(cX - 300, gY + 100 * scale); ctx.lineTo(cX + 300, gY + 100 * scale);
    ctx.stroke();
  } else if (fndId === "strip") {
    // Dynamic Scale for 1200x800 high-res plot
    const embedDepth = Math.round(depthM * 1000);
    const physicalHeight = 400 + embedDepth + 100; // plinth + embed + sand cushion
    const scale = Math.min(0.45, 600 / physicalHeight);

    const drawStemW = (wallMaterial === "KOTELET" ? 400 : 300) * scale;
    const drawFootingW = (widthM * 1000) * scale;
    const drawEmbedH = embedDepth * scale;
    const drawPlinthH = 400 * scale;
    const footingH = 300 * scale;

    const cushionBottomY = 720;
    const cushionH = 100 * scale;
    const bottomY = cushionBottomY - cushionH; // bottom concrete level
    const footingY = bottomY - footingH;
    const gY = bottomY - drawEmbedH;
    const topY = gY - drawPlinthH;

    const stemLeftX = cX - drawStemW / 2;
    const stemRightX = cX + drawStemW / 2;
    const footingLeftX = cX - drawFootingW / 2;
    const footingRightX = cX + drawFootingW / 2;

    // Cushion
    ctx.fillStyle = "rgba(234, 179, 8, 0.2)";
    ctx.fillRect(footingLeftX - 30, bottomY, drawFootingW + 60, cushionH);
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 2;
    ctx.strokeRect(footingLeftX - 30, bottomY, drawFootingW + 60, cushionH);

    // Footing
    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.fillRect(footingLeftX, footingY, drawFootingW, footingH);
    ctx.strokeStyle = "#38bdf8";
    ctx.strokeRect(footingLeftX, footingY, drawFootingW, footingH);

    // Stem
    ctx.fillRect(stemLeftX, topY, drawStemW, footingY - topY);
    ctx.strokeRect(stemLeftX, topY, drawStemW, footingY - topY);

    // Ground line
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(50, gY); ctx.lineTo(stemLeftX - 30, gY);
    ctx.moveTo(stemRightX + 30, gY); ctx.lineTo(1150, gY);
    ctx.stroke();

    // Rebar Cage with Anchoring L-Bends exactly like UI
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3.5;
    const cover = 40 * scale;

    const rebarLeftX = stemLeftX + (40 + 10) * scale;
    const rebarRightX = stemRightX - (40 + 10) * scale;

    ctx.beginPath();
    // Left vertical bar with L-bend
    ctx.moveTo(rebarLeftX, topY + cover);
    ctx.lineTo(rebarLeftX, bottomY - cover);
    ctx.lineTo(rebarLeftX - 35 * scale * 4, bottomY - cover);

    // Right vertical bar with L-bend
    ctx.moveTo(rebarRightX, topY + cover);
    ctx.lineTo(rebarRightX, bottomY - cover);
    ctx.lineTo(rebarRightX + 35 * scale * 4, bottomY - cover);
    ctx.stroke();

    // Footing bottom transverse cage bar line
    ctx.beginPath();
    ctx.moveTo(footingLeftX + cover, bottomY - cover);
    ctx.lineTo(footingRightX - cover, bottomY - cover);
    ctx.stroke();

    // Stirrups (Хомуты)
    const ringSpacing = 200 * scale;
    ctx.lineWidth = 1.8;
    for (let ry = topY + cover + 20; ry < footingY - 10; ry += ringSpacing) {
      ctx.strokeRect(rebarLeftX, ry, rebarRightX - rebarLeftX, 2);
    }
  } else {
    // Pile TISE
    const embedDepth = Math.round(depthM * 1000);
    const physicalHeight = embedDepth + 400; // pile length + above ground
    const scale = Math.min(0.28, 620 / physicalHeight);

    const drawStemW = 300 * scale; // Grillage width
    const drawGrillageH = 500 * scale;
    const drawPileDia = 300 * scale;
    const drawPileD = embedDepth * scale;

    const pileBottomY = 720;
    const gY = pileBottomY - drawPileD;
    const grillageTopY = gY - 400 * scale;
    const grillageBottomY = grillageTopY + drawGrillageH;

    const grillageLeftX = cX - drawStemW / 2;
    const grillageRightX = cX + drawStemW / 2;

    const pileTopY = grillageBottomY;
    const pileLeftX = cX - drawPileDia / 2;
    const pileRightX = cX + drawPileDia / 2;

    // Air gap
    const gapH = 100 * scale;
    ctx.fillStyle = "rgba(14, 165, 233, 0.12)";
    ctx.fillRect(grillageLeftX - 30, grillageBottomY, drawStemW + 60, gapH);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
    ctx.strokeRect(grillageLeftX - 30, grillageBottomY, drawStemW + 60, gapH);

    // Concrete TISE Flared Base ( Bulb d=600mm )
    const flareW = drawPileDia * 2.0;
    const flareH = 180 * scale;

    ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(pileLeftX, pileTopY);
    ctx.lineTo(pileLeftX, pileBottomY - flareH);
    ctx.lineTo(cX - flareW / 2, pileBottomY - 10 * scale);
    ctx.quadraticCurveTo(cX, pileBottomY + 5 * scale, cX + flareW / 2, pileBottomY - 10 * scale);
    ctx.lineTo(pileRightX, pileBottomY - flareH);
    ctx.lineTo(pileRightX, pileTopY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Grillage
    ctx.fillRect(grillageLeftX, grillageTopY, drawStemW, drawGrillageH);
    ctx.strokeRect(grillageLeftX, grillageTopY, drawStemW, drawGrillageH);

    // Ground line
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(50, gY); ctx.lineTo(grillageLeftX - 30, gY);
    ctx.moveTo(grillageRightX + 30, gY); ctx.lineTo(1150, gY);
    ctx.stroke();

    // Steel Rebar Cage
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3.5;
    const cover = 40 * scale;

    const rLeft = pileLeftX + cover;
    const rRight = pileRightX - cover;

    ctx.beginPath();
    // Left vertical rebar with flared end inside bulb and L-bend top
    ctx.moveTo(cX - (flareW / 2) + cover, pileBottomY - 15 * scale);
    ctx.lineTo(rLeft, pileBottomY - flareH);
    ctx.lineTo(rLeft, grillageTopY + cover + 6);
    ctx.lineTo(rLeft + 20, grillageTopY + cover + 6);

    // Right vertical rebar
    ctx.moveTo(cX + (flareW / 2) - cover, pileBottomY - 15 * scale);
    ctx.lineTo(rRight, pileBottomY - flareH);
    ctx.lineTo(rRight, grillageTopY + cover + 6);
    ctx.lineTo(rRight - 20, grillageTopY + cover + 6);
    ctx.stroke();

    // Grillage Rebar long bars
    const grilCover = 45 * scale;
    ctx.beginPath();
    ctx.moveTo(grillageLeftX + grilCover, grillageTopY + grilCover);
    ctx.lineTo(grillageRightX - grilCover, grillageTopY + grilCover);
    ctx.moveTo(grillageLeftX + grilCover, grillageBottomY - grilCover);
    ctx.lineTo(grillageRightX - grilCover, grillageBottomY - grilCover);
    ctx.stroke();
  }

  // Draw some labels onto the exported image
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("ВЫСОТА ЦОКОЛЯ: " + (fndId === "slab" ? 150 : 400) + " мм", 750, 200);
  ctx.fillText("ГЛУБИНА ЗАЛОЖЕНИЯ: " + Math.round(depthM * 1000) + " мм", 750, 240);
  ctx.fillText("РАБОЧАЯ АРМАТУРА: A500C d12", 750, 280);
  ctx.fillText("МАРКА БЕТОНА: C20/25 M300", 750, 320);

  return canvas.toDataURL("image/png");
}
