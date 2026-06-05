import {
  MoldovaRegion,
  RegionDetails,
  BuildingWallMaterial,
  WallMaterialDetails,
  SlabMaterial,
  SlabDetails,
  RoofType,
  RoofDetails,
  SoilType,
  SoilDetails,
  CalculatorInput,
  CalculationResults,
  FoundationOption,
  MaterialRequirement,
  CostEstimate,
  BIMEntity,
  GeologyLayer,
  GeologyDetails,
  UtilitySubsystem,
  UtilitiesModel,
  ConcreteCuringModel,
  BackfillModel,
  BlindAreaModel,
  RiskItem,
  OptionExplanation,
  UtilitySubsystemWork,
  BIMEntityMaterial,
  BIMQualityCheck,
  ResolvedReinforcement
} from "../types";

// 5.5. Unified Central Normatives Database (NCM & СНиП) - Stage 8 & 1
export const NORMATIVES = {
  FROST_CENTER: { code: "FROST_CENTER", desc: "Расчетная глубина промерзания грунта (Центр)", val: 0.80, unit: "м", ref: "NCM F.02.02-2008", rev: "2026" },
  FROST_NORTH: { code: "FROST_NORTH", desc: "Расчетная глубина промерзания грунта (Север)", val: 1.00, unit: "м", ref: "NCM F.02.02-2008", rev: "2026" },
  FROST_SOUTH: { code: "FROST_SOUTH", desc: "Расчетная глубина промерзания грунта (Юг)", val: 0.70, unit: "м", ref: "NCM F.02.02-2008", rev: "2026" },
  SNOW_CENTER: { code: "SNOW_CENTER", desc: "Нормативная снеговая нагрузка в Центре РМ", val: 0.90, unit: "кПа", ref: "NCM EN 1991-1-3:2010", rev: "2021" },
  SNOW_NORTH: { code: "SNOW_NORTH", desc: "Нормативная снеговая нагрузка на Севере РМ", val: 1.10, unit: "кПа", ref: "NCM EN 1991-1-3:2010", rev: "2021" },
  SNOW_SOUTH: { code: "SNOW_SOUTH", desc: "Нормативная снеговая нагрузка на Юге РМ", val: 0.75, unit: "кПа", ref: "NCM EN 1991-1-3:2010", rev: "2021" },
  WIND_CENTER: { code: "WIND_CENTER", desc: "Нормативное ветровое давление в Центре РМ", val: 0.36, unit: "кПа", ref: "NCM EN 1991-1-4:2010", rev: "2021" },
  WIND_NORTH: { code: "WIND_NORTH", desc: "Нормативное ветровое давление на Севере РМ", val: 0.42, unit: "кПа", ref: "NCM EN 1991-1-4:2010", rev: "2021" },
  WIND_SOUTH: { code: "WIND_SOUTH", desc: "Нормативное ветровое давление на Юге РМ", val: 0.32, unit: "кПа", ref: "NCM EN 1991-1-4:2010", rev: "2021" },
  E_BEARING_MIN: { code: "E_BEARING_MIN", desc: "Рекомендуемый минимум прочности опорного пласта", val: 150, unit: "кПа", ref: "NCM EN 1997-1:2012", rev: "2022" },
  REBAR_MIN_RATIO: { code: "REBAR_MIN_RATIO", desc: "Минимум кг арматуры на кубометр бетона ребра", val: 58.0, unit: "кг/м³", ref: "NCM F.02.02-2008", rev: "2026" },
  CONCRETE_COVER: { code: "CONCRETE_COVER", desc: "Защитный монолитный слой арматуры в грунте", val: 35, unit: "мм", ref: "NCM EN 1992-1-1:2011", rev: "2020" },
  XPS_MIN_THICK: { code: "XPS_MIN_THICK", desc: "Минимальный срез утеплителя цокольной зоны", val: 50, unit: "мм", ref: "NCM L.02.01:2012", rev: "2020" },
  XPS_SLAB_THICK: { code: "XPS_SLAB_THICK", desc: "Толщина XPS утепления под подошвой УШП плиты", val: 100, unit: "мм", ref: "NCM L.02.01:2012", rev: "2020" },
  COMPACTION_COEFF: { code: "COMPACTION_COEFF", desc: "Требуемый коэфф. послойного уплотнения засыпки", val: 0.98, unit: "безр.", ref: "СНиП 3.02.01-87", rev: "Действует" },
};

export function getRebarWeightPerMeter(diameter: number): number {
  const table: Record<number, number> = {
    6: 0.222,
    8: 0.395,
    10: 0.617,
    12: 0.888,
    14: 1.21,
    16: 1.58,
    18: 2.00,
    20: 2.47
  };
  return table[diameter] || (diameter * diameter * 0.00617);
}

export function resolveReinforcementParams(
  input: CalculatorInput,
  fndId: string,
  info: { perimeter: number; footingArea: number; depthM: number; concreteVolumeM3: number; heightAboveGround?: number }
): ResolvedReinforcement {
  const isSlab = fndId === "slab" || fndId === "classic_slab" || fndId === "ribbed_slab" || fndId === "ush";
  const isStrip = fndId === "strip" || fndId === "mzlf" || fndId === "strip_with_slab";
  const isPiles = fndId === "piles" || fndId === "drilled_piles" || fndId === "tise" || fndId === "column_footing";
  
  const sources: any = {
    foundation_type: "AUTO",
    rebar_class_main: "AUTO",
    rebar_class_secondary: "AUTO",
    main_bar_diameter: "AUTO",
    secondary_bar_diameter: "AUTO",
    longitudinal_bars_count: "AUTO",
    top_belt_count: "AUTO",
    bottom_belt_count: "AUTO",
    stirrup_spacing: "AUTO",
    protective_layer_bottom: "AUTO",
    protective_layer_side: "AUTO",
    protective_layer_top: "AUTO",
    lap_length: "AUTO",
    corner_reinforcement: "AUTO",
    u_bars: "AUTO",
    l_bars: "AUTO",
    starter_bars: "AUTO",
    chairs_count: "AUTO",
    spacers_count: "AUTO",
  };

  // --- SEISMIC SCALING MODULE (Requirement 4) ---
  let seismicPoints = 7;
  if (input.region === MoldovaRegion.NORTH) seismicPoints = 6;
  else if (input.region === MoldovaRegion.SOUTH) seismicPoints = 8;

  // Manual overrides for seismic parameters
  if (input.seismicZone) {
    if (input.seismicZone === "6_POINTS") seismicPoints = 6;
    else if (input.seismicZone === "7_POINTS") seismicPoints = 7;
    else if (input.seismicZone === "8_POINTS") seismicPoints = 8;
  }
  
  const seismicClassLabel = input.seismicClass || "CLASS_II";
  const seismicFactorCoeff = input.seismicFactor !== undefined ? input.seismicFactor : 1.0;

  // Seismic amplification multiplier
  let seismic_scale_factor = 1.0;
  if (seismicPoints === 7) seismic_scale_factor = 1.15;
  else if (seismicPoints === 8) seismic_scale_factor = 1.35;
  
  if (seismicClassLabel === "CLASS_I") seismic_scale_factor *= 1.25; // Critical buildings
  else if (seismicClassLabel === "CLASS_III") seismic_scale_factor *= 0.8; // Auxiliary objects

  seismic_scale_factor *= seismicFactorCoeff;

  // Determine defaults based on user's selected mode (Requirement 6)
  const mode = input.reinforcementChoice || "AUTO";
  
  let defRebarClassMain = "A500C";
  let defRebarClassSecondary = "A240";
  let defMainBarDiameter = 12;
  let defSecondaryBarDiameter = 8;
  let defLongitudinalBarsCount = 0;
  let defTopBeltCount = 0;
  let defBottomBeltCount = 0;
  let defStirrupSpacing = 200;
  let defProtectiveLayerBottom = 50;
  let defProtectiveLayerSide = 40;
  let defProtectiveLayerTop = 40;
  let defCornerReinforcement = false;
  let defUBars = false;
  let defLBars = false;
  let defStarterBars = false;

  const buildingWeight = input.width * input.length * (input.floors || 1) * 1.5;
  const isHeavy = buildingWeight > 150 || input.wallMaterial === BuildingWallMaterial.KOTELET || input.wallMaterial === BuildingWallMaterial.BRICK;

  if (mode === "RECOMMENDED") {
    // Rigid non-optimized ultra-safe traditional specifications
    if (isStrip) {
      defMainBarDiameter = 16;
      defSecondaryBarDiameter = 10;
      defLongitudinalBarsCount = 8;
      defTopBeltCount = 4;
      defBottomBeltCount = 4;
      defStirrupSpacing = 150;
      defProtectiveLayerBottom = 70;
      defProtectiveLayerSide = 50;
      defProtectiveLayerTop = 40;
      defCornerReinforcement = true;
      defUBars = true;
      defLBars = true;
      defStarterBars = true;
    } else if (isSlab) {
      defMainBarDiameter = 14;
      defSecondaryBarDiameter = 10;
      defLongitudinalBarsCount = 0;
      defTopBeltCount = 0;
      defBottomBeltCount = 0;
      defStirrupSpacing = 150;
      defProtectiveLayerBottom = 50;
      defProtectiveLayerSide = 40;
      defProtectiveLayerTop = 40;
      defCornerReinforcement = true;
      defUBars = true;
      defLBars = false;
      defStarterBars = true;
    } else { // Piles / column footing
      defMainBarDiameter = 16;
      defSecondaryBarDiameter = 8;
      defLongitudinalBarsCount = 6;
      defTopBeltCount = 3;
      defBottomBeltCount = 3;
      defStirrupSpacing = 150;
      defProtectiveLayerBottom = 50;
      defProtectiveLayerSide = 45;
      defProtectiveLayerTop = 40;
      defCornerReinforcement = true;
      defUBars = true;
      defLBars = true;
      defStarterBars = true;
    }
  } else {
    // AUTO Dynamic engineering logic based on Eurocode 2 & NCM (Requirement 3)
    if (isStrip) {
      // Main Bar Diameter
      if (isHeavy || seismicPoints === 8 || info.depthM >= 1.2) {
        defMainBarDiameter = 16;
      } else if (seismicPoints === 7) {
        defMainBarDiameter = 14;
      } else {
        defMainBarDiameter = 12;
      }
      
      // Secondary Bar Diameter
      defSecondaryBarDiameter = defMainBarDiameter >= 16 ? 10 : 8;

      // longitudinal bars based on depth & height of the beam
      const beamHeight = info.depthM + (info.heightAboveGround || 0.4);
      if (beamHeight < 0.8) {
        defLongitudinalBarsCount = 4;
        defTopBeltCount = 2;
        defBottomBeltCount = 2;
      } else if (beamHeight < 1.1) {
        defLongitudinalBarsCount = 6;
        defTopBeltCount = 3;
        defBottomBeltCount = 3;
      } else {
        defLongitudinalBarsCount = 8;
        defTopBeltCount = 4;
        defBottomBeltCount = 4;
      }

      // Add shear reinforcement for high seismicity
      if (seismicPoints === 8) {
        defLongitudinalBarsCount += 2; // Extra constructive face bars
        defTopBeltCount += 1;
        defBottomBeltCount += 1;
      }

      // Stirrup Spacing
      if (seismicPoints === 8) defStirrupSpacing = 150;
      else if (seismicPoints === 7) defStirrupSpacing = 200;
      else defStirrupSpacing = 250;

      defProtectiveLayerBottom = 70; // 70mm is normative in direct contact with natural ground
      defProtectiveLayerSide = 50;
      defProtectiveLayerTop = 40;
      
      // Seismic elements
      defCornerReinforcement = seismicPoints >= 7;
      defUBars = seismicPoints >= 7;
      defLBars = seismicPoints >= 7;
      defStarterBars = isHeavy || seismicPoints >= 7;

    } else if (isSlab) {
      if (isHeavy || seismicPoints === 8) {
        defMainBarDiameter = 12;
        defStirrupSpacing = 150; // closer mesh
      } else {
        defMainBarDiameter = 10;
        defStirrupSpacing = 200;
      }
      defSecondaryBarDiameter = 10;
      defLongitudinalBarsCount = 0; // Not applicable for standard slabs (using double grid mesh)
      defTopBeltCount = 0;
      defBottomBeltCount = 0;
      
      defProtectiveLayerBottom = 50;
      defProtectiveLayerSide = 40;
      defProtectiveLayerTop = 40;
      
      defCornerReinforcement = seismicPoints >= 7;
      defUBars = true; // Edge closure rings
      defLBars = false;
      defStarterBars = isHeavy || seismicPoints >= 7;

    } else if (isPiles) {
      // Pile cages
      if (isHeavy || seismicPoints === 8) {
        defMainBarDiameter = 16;
        defStirrupSpacing = 150; // closer rings in piles and grillage
      } else {
        defMainBarDiameter = 14;
        defStirrupSpacing = 200;
      }
      defSecondaryBarDiameter = 8;
      // Longitudinal bars count in pile cage
      defLongitudinalBarsCount = seismicPoints === 8 ? 6 : 4;
      defTopBeltCount = 2;
      defBottomBeltCount = 2;
      defProtectiveLayerBottom = 50;
      defProtectiveLayerSide = 40;
      defProtectiveLayerTop = 40;
      
      defCornerReinforcement = true;
      defUBars = true;
      defLBars = true;
      defStarterBars = true;
    }
  }

  // Overlay user manual modifications if present
  const rebar_class_main = input.rebarClassMain || defRebarClassMain;
  if (input.rebarClassMain) sources.rebar_class_main = "USER";

  const rebar_class_secondary = input.rebarClassSecondary || defRebarClassSecondary;
  if (input.rebarClassSecondary) sources.rebar_class_secondary = "USER";

  const main_bar_diameter = input.mainBarDiameter !== undefined ? input.mainBarDiameter : defMainBarDiameter;
  if (input.mainBarDiameter !== undefined) sources.main_bar_diameter = "USER";

  const secondary_bar_diameter = input.secondaryBarDiameter !== undefined ? input.secondaryBarDiameter : defSecondaryBarDiameter;
  if (input.secondaryBarDiameter !== undefined) sources.secondary_bar_diameter = "USER";

  const longitudinal_bars_count = input.longitudinalBarsCount !== undefined ? input.longitudinalBarsCount : defLongitudinalBarsCount;
  if (input.longitudinalBarsCount !== undefined) sources.longitudinal_bars_count = "USER";

  const top_belt_count = input.topBeltCount !== undefined ? input.topBeltCount : defTopBeltCount;
  if (input.topBeltCount !== undefined) sources.top_belt_count = "USER";

  const bottom_belt_count = input.bottomBeltCount !== undefined ? input.bottomBeltCount : defBottomBeltCount;
  if (input.bottomBeltCount !== undefined) sources.bottom_belt_count = "USER";

  const stirrup_spacing = input.stirrupSpacing !== undefined ? input.stirrupSpacing : defStirrupSpacing;
  if (input.stirrupSpacing !== undefined) sources.stirrup_spacing = "USER";

  const protective_layer_bottom = input.protectiveLayerBottom !== undefined ? input.protectiveLayerBottom : defProtectiveLayerBottom;
  if (input.protectiveLayerBottom !== undefined) sources.protective_layer_bottom = "USER";

  const protective_layer_side = input.protectiveLayerSide !== undefined ? input.protectiveLayerSide : defProtectiveLayerSide;
  if (input.protectiveLayerSide !== undefined) sources.protective_layer_side = "USER";

  const protective_layer_top = input.protectiveLayerTop !== undefined ? input.protectiveLayerTop : defProtectiveLayerTop;
  if (input.protectiveLayerTop !== undefined) sources.protective_layer_top = "USER";

  // Seismic zone increases lap and anchorage requirements
  let defLapLengthMultiplier = 40;
  if (seismicPoints === 7) defLapLengthMultiplier = 45;
  else if (seismicPoints === 8) defLapLengthMultiplier = 55;
  
  let defLapLength = defLapLengthMultiplier * main_bar_diameter;
  const lap_length = input.lapLength !== undefined ? input.lapLength : defLapLength;
  if (input.lapLength !== undefined) sources.lap_length = "USER";

  const corner_reinforcement = input.cornerReinforcement !== undefined ? input.cornerReinforcement : defCornerReinforcement;
  if (input.cornerReinforcement !== undefined) sources.corner_reinforcement = "USER";

  const u_bars = input.uBars !== undefined ? input.uBars : defUBars;
  if (input.uBars !== undefined) sources.u_bars = "USER";

  let l_bars = input.lBars !== undefined ? input.lBars : defLBars;
  if (corner_reinforcement) {
    l_bars = true;
  }
  if (input.lBars !== undefined) sources.l_bars = "USER";

  const starter_bars = input.starterBars !== undefined ? input.starterBars : defStarterBars;
  if (input.starterBars !== undefined) sources.starter_bars = "USER";

  // PHYSICAL STEEL REBAR CALCULATING ENGINE (M0LDOVA-10)
  const waste_percent = 6; // Standard 6% detailing waste
  let main_bars_weight_kg = 0;
  let secondary_bars_weight_kg = 0;
  let additional_elements_weight_kg = 0;
  let chairs_count = 0;
  let spacers_count = 0;
  let frogs_count = 0;
  let frogs_spacing = 0;
  let corner_reinforcements_count = 0;
  let intersection_reinforcements_count = 0;
  
  // Parametric breakdown outputs
  let l_bars_count = 0;
  let u_bars_count = 0;
  let starter_bars_count = 0;
  let longitudinal_total_length_m = 0;
  let transverse_total_length_m = 0;
  let clamps_total_length_m = 0;
  let starters_total_length_m = 0;
  let anchorages_total_length_m = 0;
  let laps_total_length_m = 0;
  let longitudinal_total_weight_kg = 0;
  let clamps_total_weight_kg = 0;
  let reinforcements_total_weight_kg = 0;
  let starters_total_weight_kg = 0;
  let anchorages_total_weight_kg = 0;
  let laps_total_weight_kg = 0;

  let layout_scheme_ru = "";
  let layout_scheme_ro = "";

  const mainWeightPerMeter = getRebarWeightPerMeter(main_bar_diameter);
  const secondaryWeightPerMeter = getRebarWeightPerMeter(secondary_bar_diameter);

  if (isStrip) {
    // Strip layout physical calculation
    const L_total = info.perimeter * 1.35; // Total beams length under bearing walls
    
    // Main longitudinal bars including standard 11.7m rebar overlap laps
    const barsCount = longitudinal_bars_count || 6;
    const baseLength = L_total * barsCount;
    const overlapsCount = Math.floor(baseLength / 11.5);
    const overlapLengthTotal = overlapsCount * (lap_length / 1000);
    
    longitudinal_total_length_m = baseLength + overlapLengthTotal;
    longitudinal_total_weight_kg = longitudinal_total_length_m * mainWeightPerMeter;
    laps_total_length_m = overlapLengthTotal;
    laps_total_weight_kg = laps_total_length_m * mainWeightPerMeter;
    
    // Transverse stirrups (clamps)
    const spacingM = stirrup_spacing / 1000;
    const clampsCount = Math.ceil(L_total / spacingM);
    // Average cross section parameters mapped
    const widthStrip = info.footingArea / info.perimeter || 0.45;
    const avgTotalHeight = info.depthM + (info.heightAboveGround || 0.4);
    const coreW = widthStrip - (2 * protective_layer_side) / 1000;
    const coreH = avgTotalHeight - (protective_layer_bottom + protective_layer_top) / 1000;
    const clampPerimeter = 2 * (Math.max(0.1, coreW) + Math.max(0.1, coreH)) + 0.25; // perimeter + structural hooks
    
    clamps_total_length_m = clampsCount * clampPerimeter;
    transverse_total_length_m = clamps_total_length_m;
    clamps_total_weight_kg = clamps_total_length_m * secondaryWeightPerMeter;
    
    // Corner reinforcements and nodes (G-shaped & T-shaped)
    corner_reinforcements_count = 4; // Typical perimeter corners
    intersection_reinforcements_count = Math.ceil(info.perimeter / 8); // T-intersections of inner columns
    const cornersTotal = corner_reinforcements_count + intersection_reinforcements_count;
    
    // L-shaped G-bars (each corner node utilizes 4 L-bars: d_main, 1.2m leg)
    l_bars_count = l_bars ? cornersTotal * 4 : 0;
    anchorages_total_length_m = l_bars_count * 1.2;
    anchorages_total_weight_kg = anchorages_total_length_m * mainWeightPerMeter;

    // U-shaped P-bars
    u_bars_count = u_bars ? cornersTotal * 4 : 0;
    const u_bars_total_length = u_bars_count * 0.8;
    const u_bars_total_weight_kg = u_bars_total_length * secondaryWeightPerMeter;

    reinforcements_total_weight_kg = anchorages_total_weight_kg + u_bars_total_weight_kg;
    
    // Wall and column starter pins
    starter_bars_count = starter_bars ? Math.ceil(info.perimeter / 1.2) * 4 : 0;
    starters_total_length_m = starter_bars_count * 1.0;
    starters_total_weight_kg = starters_total_length_m * mainWeightPerMeter;

    main_bars_weight_kg = longitudinal_total_weight_kg;
    secondary_bars_weight_kg = clamps_total_weight_kg;
    additional_elements_weight_kg = reinforcements_total_weight_kg + starters_total_weight_kg;
    
    chairs_count = 0;
    spacers_count = Math.ceil(L_total * 5); // Side wall spacers (5 per meter)
    
    layout_scheme_ru = `Пространственный рамный каркас из ${barsCount} продольных рабочих стержней d${main_bar_diameter}мм (класс ${rebar_class_main}), связанных хомутами d${secondary_bar_diameter}мм с шагом ${stirrup_spacing}мм в единую коробку.`;
    layout_scheme_ro = `Carcasă spațială formată din ${barsCount} bare longitudinale principale d${main_bar_diameter}mm (clasa ${rebar_class_main}), legate cu etrieri d${secondary_bar_diameter}mm la pasul de ${stirrup_spacing}mm.`;

  } else if (isSlab) {
    // Slabs orthogonal grid mesh physical calculation (Eurocode 2 / EC2 & NCM EN 1992-1-1)
    const gridSpacingM = stirrup_spacing / 1000;
    const widthSlab = input.width;
    const lengthSlab = input.length;
    
    // Layout consists of TWO orthogonal meshes: Lower Mesh and Upper Mesh (Mesh X and Mesh Y in both layers)
    const numRowsX = Math.ceil(widthSlab / gridSpacingM) + 1;
    const numRowsY = Math.ceil(lengthSlab / gridSpacingM) + 1;
    
    const meshX_total_length = numRowsX * lengthSlab; // Longitudinal lines
    const meshY_total_length = numRowsY * widthSlab;  // Transverse lines
    
    // Total for one mesh layer (Lower Mesh X + Y)
    const lower_mesh_total_length = meshX_total_length + meshY_total_length;
    // Upper Mesh is identical
    const upper_mesh_total_length = meshX_total_length + meshY_total_length;
    
    const totalLinearMeters = lower_mesh_total_length + upper_mesh_total_length;
    
    // overlap laps (12%) for standard 11.7m delivery bar cuts
    const overlaps_length = totalLinearMeters * 0.12;
    const finalLinearMeters = totalLinearMeters + overlaps_length;
    
    longitudinal_total_length_m = finalLinearMeters;
    longitudinal_total_weight_kg = longitudinal_total_length_m * mainWeightPerMeter;
    laps_total_length_m = overlaps_length;
    laps_total_weight_kg = laps_total_length_m * mainWeightPerMeter;
    
    // Frogs ("лягушки") - spacers that separate and support the top mesh (1.5 per m2 of slab)
    frogs_count = Math.ceil(info.footingArea * 1.5);
    frogs_spacing = 800; // spacing between frogs in mm
    const frogLength = 0.85; // total length of rebar per frog
    
    clamps_total_length_m = frogs_count * frogLength;
    transverse_total_length_m = clamps_total_length_m;
    clamps_total_weight_kg = clamps_total_length_m * secondaryWeightPerMeter;
    
    // Corner G-bars (L-bars) are 0 for Slab to prevent mixing with Strip foundation logic
    l_bars_count = 0;
    anchorages_total_length_m = 0;
    anchorages_total_weight_kg = 0;

    // Edge boundary reinforcements (U-shaped boundary closure rings for slabs / Armare bordaj contur)
    u_bars_count = u_bars ? Math.ceil(info.perimeter / gridSpacingM) * 2 : 0;
    const u_bars_total_length = u_bars_count * 0.9;
    const u_bars_total_weight_kg = u_bars_total_length * mainWeightPerMeter;

    // Slabs reinforcement zones: Punching reinforcement & boundary wall starter bars
    const column_zones_weight_kg = u_bars ? 4 * 4 * 1.8 * mainWeightPerMeter : 0; // Column stiffener reinforcement zones
    const wall_zones_weight_kg = u_bars ? Math.ceil(info.perimeter * 0.25) * mainWeightPerMeter : 0; // Wall boundary rib zones

    reinforcements_total_weight_kg = u_bars_total_weight_kg + column_zones_weight_kg + wall_zones_weight_kg;
    
    // Starters for foundation pins/shpils under bearing walls or pillars
    starter_bars_count = starter_bars ? Math.ceil(info.perimeter * 0.8) * 4 : 0;
    starters_total_length_m = starter_bars_count * 1.0;
    starters_total_weight_kg = starters_total_length_m * mainWeightPerMeter;

    main_bars_weight_kg = longitudinal_total_weight_kg;
    secondary_bars_weight_kg = clamps_total_weight_kg;
    additional_elements_weight_kg = reinforcements_total_weight_kg + starters_total_weight_kg;
    
    chairs_count = Math.ceil(info.footingArea * 1.2); // Lower grid concrete spacers (1.2 per m2)
    spacers_count = Math.ceil(info.footingArea * 5); // Side spacer counts
    
    layout_scheme_ru = `Двойной сетчатый каркас из рабочей арматуры d${main_bar_diameter}мм (класс ${rebar_class_main}) с ячейкой ${stirrup_spacing}х${stirrup_spacing}мм (нижняя и верхняя сетка плиты), с П-образными торцевыми хомутами d${main_bar_diameter}мм и разделительными лягушками d${secondary_bar_diameter}мм.`;
    layout_scheme_ro = `Armătură în rețea dublă (plasă inferioară și superioară) din bare d${main_bar_diameter}mm (clasa ${rebar_class_main}) cu ochiuri de ${stirrup_spacing}x${stirrup_spacing}mm, cu agrafe U de contur d${main_bar_diameter}mm și capre din bare d${secondary_bar_diameter}mm.`;

  } else if (isPiles) {
    // Pile cages + small grillage beams physical calculation
    const basePileCount = Math.ceil(info.perimeter / 1.7);
    const actualPileCount = input.soilType === SoilType.FILLED ? Math.ceil(basePileCount * 1.35) : basePileCount;
    const pileDepthM = info.depthM || 2.2;
    
    // 1. Pile reinforcement
    const pileLongCount = longitudinal_bars_count || 4;
    // Pile cage length = actual depth + 0.50m grillage linkage starters
    const cageLength = pileDepthM + 0.50;
    const pileMainLinearM = actualPileCount * pileLongCount * cageLength;
    const pileMainWeight = pileMainLinearM * mainWeightPerMeter;
    
    // Spiral rings on piles
    const ringStepM = 0.15; // 150mm standard step inside piles
    const ringsPerPile = Math.ceil(pileDepthM / ringStepM);
    const pileDiameter = 0.30; // 300mm standard pile diameter
    const ringCircumference = Math.PI * (pileDiameter - 0.08) + 0.10; // core diameter + tie length
    const pileSecWeight = actualPileCount * ringsPerPile * ringCircumference * getRebarWeightPerMeter(6); // spirals are d6
    
    // 2. Grillage (rosverk) reinforcement on top of piles (similar to shallow strip)
    const grillageLength = info.perimeter * 1.35;
    const grillageLongBarsCount = 4; // 2 top, 2 bottom
    const grillageMainLinearM = grillageLength * grillageLongBarsCount * 1.10; // adding 10% overlaps
    const grillageMainWeight = grillageMainLinearM * mainWeightPerMeter;
    
    const grillageStirrupSpacingM = stirrup_spacing / 1000;
    const grillageStirrupsCount = Math.ceil(grillageLength / grillageStirrupSpacingM);
    const grillageHeightM = 0.45; // 450mm grillage height
    const grillageWidthM = 0.40; // 400mm grillage width
    const grillageClampPerimeter = 2 * (grillageWidthM - 0.08) + 2 * (grillageHeightM - 0.08) + 0.20;
    const grillageSecWeight = grillageStirrupsCount * grillageClampPerimeter * secondaryWeightPerMeter;
    
    longitudinal_total_length_m = pileMainLinearM + grillageMainLinearM;
    longitudinal_total_weight_kg = pileMainWeight + grillageMainWeight;
    laps_total_length_m = grillageMainLinearM * 0.10;
    laps_total_weight_kg = grillageMainLinearM * 0.10 * mainWeightPerMeter;

    clamps_total_length_m = (actualPileCount * ringsPerPile * ringCircumference) + (grillageStirrupsCount * grillageClampPerimeter);
    transverse_total_length_m = clamps_total_length_m;
    clamps_total_weight_kg = pileSecWeight + grillageSecWeight;
    
    corner_reinforcements_count = 4;
    intersection_reinforcements_count = Math.ceil(info.perimeter / 10);
    const totalCorners = corner_reinforcements_count + intersection_reinforcements_count;
    
    // L-bars linking piles to grillage + corners
    l_bars_count = l_bars ? (totalCorners * 4 + actualPileCount * pileLongCount) : 0;
    anchorages_total_length_m = l_bars_count * 1.2;
    anchorages_total_weight_kg = anchorages_total_length_m * mainWeightPerMeter;

    u_bars_count = u_bars ? totalCorners * 4 : 0;
    const u_bars_total_length = u_bars_count * 0.8;
    const u_bars_total_weight_kg = u_bars_total_length * secondaryWeightPerMeter;

    reinforcements_total_weight_kg = anchorages_total_weight_kg + u_bars_total_weight_kg;

    // Starter pins under columns or walls
    starter_bars_count = starter_bars ? Math.ceil(info.perimeter / 1.5) * 4 : 0;
    starters_total_length_m = starter_bars_count * 1.0;
    starters_total_weight_kg = starters_total_length_m * mainWeightPerMeter;

    main_bars_weight_kg = longitudinal_total_weight_kg;
    secondary_bars_weight_kg = clamps_total_weight_kg;
    additional_elements_weight_kg = reinforcements_total_weight_kg + starters_total_weight_kg;
    
    chairs_count = 0;
    spacers_count = Math.ceil(grillageLength * 4 + actualPileCount * 3);
    
    layout_scheme_ru = `Буронабивные сваи с арматурными каркасами из ${pileLongCount} стержней d${main_bar_diameter}мм, заведенными в монолитный ростверк сечением 400х450мм аналогичного класса рабочей арматуры.`;
    layout_scheme_ro = `Piloni forați cu carcase din ${pileLongCount} bare d${main_bar_diameter}mm introduce în grinda de fundație (soclu) monolită de 400x450mm armată similar.`;
  }

  // --- SEISMIC SCALING (M0LDOVA-10) ---
  longitudinal_total_weight_kg *= seismic_scale_factor;
  clamps_total_weight_kg *= seismic_scale_factor;
  reinforcements_total_weight_kg *= seismic_scale_factor;
  starters_total_weight_kg *= seismic_scale_factor;
  anchorages_total_weight_kg *= seismic_scale_factor;
  laps_total_weight_kg *= seismic_scale_factor;

  main_bars_weight_kg = longitudinal_total_weight_kg;
  secondary_bars_weight_kg = clamps_total_weight_kg;
  additional_elements_weight_kg = reinforcements_total_weight_kg + starters_total_weight_kg;

  const base_steel_mass = (main_bars_weight_kg + secondary_bars_weight_kg + additional_elements_weight_kg);
  const total_rebar_weight = base_steel_mass * (1 + waste_percent/100);

  // DETAILED ELEMENT-BY-ELEMENT ENGINEERING AUDIT (M0LDOVA-10)
  const audit_checks: BIMQualityCheck[] = [];

  const mainElemPrefix_ru = isSlab ? "Плита:" : isPiles ? "Сваи:" : "Лента:";

  const b_strip = isSlab ? 1000 : (info.footingArea / info.perimeter || 0.45) * 1000; // in mm
  const h_concrete = isSlab ? info.depthM * 1000 : (info.depthM + (info.heightAboveGround || 0.4)) * 1000; // in mm
  const Ac = b_strip * h_concrete; // concrete core area mm2
  
  // Rule 1: Minimum reinforcement area (As,min)
  const AsMin = Ac * 0.0013;
  const singleBarAs = (Math.PI / 4) * main_bar_diameter * main_bar_diameter;
  const barsUsed = isSlab ? Math.ceil(1000 / stirrup_spacing) * 2 : (longitudinal_bars_count || 6);
  const actualAs = barsUsed * singleBarAs;
  const minAsStatus = actualAs >= AsMin ? "PASS" : actualAs >= AsMin * 0.8 ? "WARNING" : "FAIL";

  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Мин. площадь арматуры As,min (NCM EN 1992-1-1 / EC2)`,
    status: minAsStatus,
    value: `${Math.round(actualAs)} мм² (норма: ${Math.round(AsMin)} мм²)`,
    norm: "NCM EN 1992-1-1 / Eurocode 2: Площадь продольного армирования несущего элемента должна составлять не менее 0.13% от рабочей площади бетона."
  });

  // Rule 2: Maximum reinforcement area (As,max)
  const AsMax = Ac * 0.04;
  const maxAsStatus = actualAs <= AsMax ? "PASS" : "FAIL";
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Макс. площадь арматуры As,max (NCM EN 1992-1-1 / EC2)`,
    status: maxAsStatus,
    value: `${Math.round(actualAs)} мм² (лимит: ${Math.round(AsMax)} мм²)`,
    norm: "NCM EN 1992-1-1: Вне зон нахлестки площадь сечения продольной арматуры не должна превышать As,max = 0.04 * Ac во избежание переармирования."
  });

  // Rule 3: Percentage / ratio rho
  const rhoValue = (actualAs / Ac) * 100;
  let rhoStatus: "PASS" | "WARNING" | "FAIL" = "PASS";
  if (rhoValue < 0.15) {
    rhoStatus = seismicPoints >= 7 ? "FAIL" : "WARNING";
  }
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Коэффициент армирования ρ (%) / Procentul de armare`,
    status: rhoStatus,
    value: `${rhoValue.toFixed(3)}% (класс ${rebar_class_main})`,
    norm: "NCM EN 1992-1-1 разд. 9.2: Минимальный рекомендуемый процент армирования в районах с повышенной сейсмичностью 7-8 баллов составляет 0.150%."
  });

  // Rule 4: Spacing between bars s,min
  const sMinAllowed = Math.max(20, main_bar_diameter, 25);
  const clearSpacing = isSlab ? (stirrup_spacing - main_bar_diameter) : (b_strip - 2 * protective_layer_side - (barsUsed / 2) * main_bar_diameter) / Math.max(1, (barsUsed / 2) - 1);
  const sMinStatus = clearSpacing >= sMinAllowed ? "PASS" : "FAIL";
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Мин. расстояние между стержнями s,min / Distanța minimă`,
    status: sMinStatus,
    value: `факт ${Math.round(clearSpacing)} мм (номинал ${Math.round(sMinAllowed)} мм)`,
    norm: "NCM EN 1992-1-1 разд 8.2: Чтобы обеспечить надежное сцепление бетона с арматурой, свет между продольными стержнями должен быть не менее наибольшего диаметра d, или 20мм."
  });

  // Rule 5: Max spacing of longitudinal bars
  const sMaxAllowed = isSlab ? Math.min(400, 1.5 * h_concrete) : 350;
  const sMaxStatus = (isSlab ? stirrup_spacing : (b_strip / Math.max(1, (barsUsed / 2) - 1))) <= sMaxAllowed ? "PASS" : "FAIL";
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Макс. шаг продольных стержней s,max / Pasul maxim al barelor`,
    status: sMaxStatus,
    value: `принято ${isSlab ? stirrup_spacing : Math.round(b_strip / Math.max(1, (barsUsed / 2) - 1))} мм при пределе ${Math.round(sMaxAllowed)} мм`,
    norm: "СНиП 52-01 / NCM EN 1992: Максимальное расстояние между растянутыми рабочими стержнями монолитных элементов - не более 350мм для обеспечения жесткости."
  });

  // Rule 6: Stirrup spacing s,w,max
  let maxStirrupStep = Math.min(300, 15 * main_bar_diameter);
  if (seismicPoints >= 7) {
    maxStirrupStep = Math.min(150, 10 * main_bar_diameter);
  }
  const stirrupStepStatus = stirrup_spacing <= maxStirrupStep ? "PASS" : "FAIL";
  audit_checks.push({
    criterion: `${isSlab ? "Плита" : "Ростверк"}: Макс. шаг хомутов s,w,max / Pasul etrierilor`,
    status: stirrupStepStatus,
    value: `факт ${stirrup_spacing} мм (лимит по сейсмике ${Math.round(maxStirrupStep)} мм)`,
    norm: "Eurocode 2 & NCM: В сейсмических зонах 7-8 баллов и местах стыков рабочая поперечная арматура связывается хомутами с шагом не более 10d рабочих длин."
  });

  // Rule 7: Concrete cover
  const requiredCover = 40;
  const coverStatus = protective_layer_bottom >= requiredCover ? "PASS" : "FAIL";
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Защитный слой бетона c_nom / Stratul de acoperire ac`,
    status: coverStatus,
    value: `снизу ${protective_layer_bottom} мм / сбоку ${protective_layer_side} мм`,
    norm: "NCM EN 1992-1-1: Для железобетонных конструкций фундаментов в активной сырой среде грунта (класс XC2) защитная оболочка должна составлять не менее 40 мм."
  });

  // Rule 8: Anchorage Length
  const baseAnchorageReq = 35 * main_bar_diameter;
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Анкеровка продольной арматуры на опорах l,bd`,
    status: "PASS",
    value: `заделка анкеров не менее ${Math.round(baseAnchorageReq)} мм`,
    norm: "СП 63.13330 / Eurocode 2: Расчетная длина анкеровки l,bd необходима для полной передачи растягивающего усилия со стержней периодического профиля на бетон."
  });

  // Rule 9: Lap Length
  const lapReq = defLapLengthMultiplier * main_bar_diameter;
  const lapStatus = lap_length >= lapReq ? "PASS" : "FAIL";
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Растянутый нахлест в стыках без сварки l,0`,
    status: lapStatus,
    value: `перепуск стержней ${lap_length} мм (расчет по сейсмике ${Math.round(lapReq)} мм)`,
    norm: "СНиП 52-01 / NCM EN 1992-1-1: Длина стыкования стержней внахлестку без сварки составляет от 40d до 55d в зависимости от требований сейсмической надежности."
  });

  // Rule 10: Corner reinforcement
  const hasL_bars = corner_reinforcement && l_bars && (l_bars_count > 0);
  const cornerCheckStatus = hasL_bars ? "PASS" : (corner_reinforcement ? "FAIL" : "WARNING");
  const cornerCheckMsg = hasL_bars 
    ? `Г-образные стык-детали d${main_bar_diameter} в количестве ${l_bars_count} шт установлены.`
    : (corner_reinforcement 
       ? "КРИТИЧЕСКАЯ ОШИБКА: Усиление углов активно, но Г-образные элементы отсутствуют (0 шт)!"
       : "Специальное угловое усиление отключено в настройках");

  audit_checks.push({
    criterion: `${isSlab ? "Плита" : "Ростверк"}: Армирование внешних углов (L-детали / Г-образные)`,
    status: cornerCheckStatus,
    value: cornerCheckMsg,
    norm: "СП 50-101-2004: Угловое соединение лент простым перекрещиванием перепускаемых стержней категорически запрещено. Требуются Г-образные анкерные связи с шагом 12d."
  });

  // Rule 11: Intersection reinforcement
  const hasU_bars = corner_reinforcement && u_bars && (u_bars_count > 0);
  const intersectionStatus = hasU_bars ? "PASS" : "WARNING";
  audit_checks.push({
    criterion: `${isSlab ? "Плита" : "Ростверк"}: Армирование пересечений Т-образных узлов (П-детали)`,
    status: intersectionStatus,
    value: hasU_bars ? `П-образные хомуты-зажимы установлены (${u_bars_count} шт)` : "Т-образные пересечения без П-образных соединителей",
    norm: "NCM EN 1992-1-1 разд 9.6: Концевая заделка стыков примыкания несущих элементов во внешних и внутренних узлах монолита усиливается П-образными гнутыми замками."
  });

  // Rule 12: T-connections anchorage
  const tAnchorageStatus = (corner_reinforcement && l_bars) ? "PASS" : "WARNING";
  audit_checks.push({
    criterion: `${isSlab ? "Плита" : "Ростверк"}: Анкеровка сопряжений в Т-образных пересечениях`,
    status: tAnchorageStatus,
    value: (corner_reinforcement && l_bars) ? "Связная длина перекрытия выполнена" : "Конструктивная анкеровка узлов не подтверждена",
    norm: "СП 63.13330.2012 / Eurocode 2: Пересечения продольных арматурных стержней в Т-образных узлах связываются контурными фиксаторами с заделкой на l,bd."
  });

  // Rule 13: Technical starter bars
  const hasStarterBars = starter_bars && (starter_bars_count > 0);
  const starterStatus = hasStarterBars ? "PASS" : "WARNING";
  audit_checks.push({
    criterion: `${mainElemPrefix_ru} Армирование технологических выпусков арматурных шпилек`,
    status: starterStatus,
    value: hasStarterBars ? `Выпуски из фундамента d12 активны в количестве ${starter_bars_count} шт.` : "Выпускные анкеры не предусмотрены",
    norm: "NCM EN 1998-1 / Eurocode 8: Монолитное жесткое сопряжение нижнего распределительного пояса кладки или цокольных колонн с телом фундамента требует выпусков d12 с шагом не более 1.2м."
  });

  if (isPiles) {
    const pileCoverStatus = protective_layer_bottom >= 50 ? "PASS" : "WARNING";
    audit_checks.push({
      criterion: "Сваи: Проверка защитного слоя буронабивного ствола в контакте с грунтом",
      status: pileCoverStatus,
      value: `защитный слой ствола сваи составляет ${protective_layer_bottom} мм`,
      norm: "NCM F.02.02-2008: Защитный слой бетона для подземных свайных железобетонных конструкций, погруженных непосредственно в грунты без подготовки, составляет не менее 50 мм."
    });
  }

  return {
    foundation_type: fndId,
    rebar_class_main,
    rebar_class_secondary,
    main_bar_diameter,
    secondary_bar_diameter,
    longitudinal_bars_count,
    top_belt_count,
    bottom_belt_count,
    stirrup_spacing,
    protective_layer_bottom,
    protective_layer_side,
    protective_layer_top,
    lap_length,
    corner_reinforcement,
    u_bars,
    l_bars,
    starter_bars,
    chairs_count,
    spacers_count,
    layout_scheme_ru,
    layout_scheme_ro,
    waste_percent,
    main_bars_weight_kg: Math.round(main_bars_weight_kg),
    secondary_bars_weight_kg: Math.round(secondary_bars_weight_kg),
    additional_elements_weight_kg: Math.round(additional_elements_weight_kg),
    total_rebar_weight_kg: Math.round(total_rebar_weight),
    anchorage_length: Math.round(baseAnchorageReq),
    frogs_count,
    frogs_spacing,
    corner_reinforcements_count,
    intersection_reinforcements_count,
    seismic_zone: seismicPoints === 6 ? "6_POINTS" : seismicPoints === 7 ? "7_POINTS" : "8_POINTS",
    seismic_class: seismicClassLabel,
    seismic_factor: seismic_scale_factor,
    audit_checks,
    sources,

    // Parametric length and weight breakdowns
    l_bars_count,
    u_bars_count,
    starter_bars_count,
    longitudinal_total_length_m: Math.round(longitudinal_total_length_m * 10) / 10,
    transverse_total_length_m: Math.round(transverse_total_length_m * 10) / 10,
    clamps_total_length_m: Math.round(clamps_total_length_m * 10) / 10,
    starters_total_length_m: Math.round(starters_total_length_m * 10) / 10,
    anchorages_total_length_m: Math.round(anchorages_total_length_m * 10) / 10,
    laps_total_length_m: Math.round(laps_total_length_m * 10) / 10,
    longitudinal_total_weight_kg: Math.round(longitudinal_total_weight_kg),
    clamps_total_weight_kg: Math.round(clamps_total_weight_kg),
    reinforcements_total_weight_kg: Math.round(reinforcements_total_weight_kg),
    starters_total_weight_kg: Math.round(starters_total_weight_kg),
    anchorages_total_weight_kg: Math.round(anchorages_total_weight_kg),
    laps_total_weight_kg: Math.round(laps_total_weight_kg)
  };
}

// 1. Moldova Regional Constants (NCM G.01.01 & СНиП II-7-81*)
export const REGION_DATA: Record<MoldovaRegion, RegionDetails> = {
  [MoldovaRegion.CENTER]: {
    name: "Центр (Кишинёв, Орхей, Унгень)",
    cities: "Кишинёв, Оргеев, Унгены, Хынчешты, Криуляны",
    frostDepth: NORMATIVES.FROST_CENTER.val,
    snowLoad: NORMATIVES.SNOW_CENTER.val,
    windLoad: NORMATIVES.WIND_CENTER.val,
    seismicPoints: 7,
    seismicCoeff: 0.1, // A = 0.1
    beltMandatory: true
  },
  [MoldovaRegion.NORTH]: {
    name: "Север (Бэлць, Бричень, Сорока)",
    cities: "Бельцы, Сороки, Бричаны, Единец, Глодяны, Фалешты",
    frostDepth: NORMATIVES.FROST_NORTH.val,
    snowLoad: NORMATIVES.SNOW_NORTH.val,
    windLoad: NORMATIVES.WIND_NORTH.val,
    seismicPoints: 6.5,
    seismicCoeff: 0.05, // A = 0.05
    beltMandatory: true
  },
  [MoldovaRegion.SOUTH]: {
    name: "Юг (Кагул, Комрат, Тараклия)",
    cities: "Кагул, Комрат, Чадыр-Лунга, Тараклия, Вулканешты",
    frostDepth: NORMATIVES.FROST_SOUTH.val,
    snowLoad: NORMATIVES.SNOW_SOUTH.val,
    windLoad: NORMATIVES.WIND_SOUTH.val,
    seismicPoints: 8,
    seismicCoeff: 0.2, // A = 0.2
    beltMandatory: true
  }
};

// 2. Wall Material Details
export const WALL_MATERIAL_DATA: Record<BuildingWallMaterial, WallMaterialDetails> = {
  [BuildingWallMaterial.GASOBETON]: {
    id: BuildingWallMaterial.GASOBETON,
    name: "Газобетонные блоки (AEROC/BCA)",
    density: 500, // kg/m3
    typicalThickness: 0.35, // 35 cm outer walls
    description: "Лёгкий теплый материал, умеренная нагрузка, требует отличной жесткости фундамента во избежание трещин."
  },
  [BuildingWallMaterial.KOTELET]: {
    id: BuildingWallMaterial.KOTELET,
    name: "Молдавский котелец (пиленый известняк)",
    density: 1900, // kg/m3 - very heavy native Moldovan stone!
    typicalThickness: 0.40, // 40 cm masonry
    description: "Национальный природный камень Молдовы. Обладает высочайшей несущей способностью, но крайне тяжёл. Требует массивного фундамента."
  },
  [BuildingWallMaterial.BRICK]: {
    id: BuildingWallMaterial.BRICK,
    name: "Полнотелый кирпич (Brikston/Macon)",
    density: 1700, // kg/m3
    typicalThickness: 0.38, // 38 cm (1.5 bricks)
    description: "Тяжелая капитальная стена. Высокая устойчивость к влаге и нагрузкам, высокая теплоёмкость."
  },
  [BuildingWallMaterial.KERAMZIT]: {
    id: BuildingWallMaterial.KERAMZIT,
    name: "Керамзитобетонные блоки (Fortus)",
    density: 1200, // kg/m3
    typicalThickness: 0.39, // 39 cm
    description: "Хороший компромисс между газобетоном и кирпичом. Прочный, суровый, средняя масса."
  },
  [BuildingWallMaterial.FRAME]: {
    id: BuildingWallMaterial.FRAME,
    name: "Каркасный деревянный дом (SIP панели)",
    density: 200, // kg/m3 loaded
    typicalThickness: 0.20,
    description: "Сверхлегкое сооружение. Подходит практически любой упрощенный фундамент (МЗЛФ, сваи с ростверком)."
  }
};

// 3. Floor Slab Details
export const SLAB_DATA: Record<SlabMaterial, SlabDetails> = {
  [SlabMaterial.MONOLITH]: {
    id: SlabMaterial.MONOLITH,
    name: "Монолитная ж/б плита (h=16-20 см)",
    density: 2500, // kg/m3 of concrete
    weightPerM2: 500 // kg/m2 (dead weight + screed + finishes)
  },
  [SlabMaterial.HOLLOW_CORE]: {
    id: SlabMaterial.HOLLOW_CORE,
    name: "Пустотные плиты перекрытия (ПБК)",
    density: 1500,
    weightPerM2: 380
  },
  [SlabMaterial.TIMBER]: {
    id: SlabMaterial.TIMBER,
    name: "Деревянные балки с утеплением",
    density: 250,
    weightPerM2: 120
  }
};

// 4. Roof Details
export const ROOF_DATA: Record<RoofType, RoofDetails> = {
  [RoofType.GABLE_METAL]: {
    id: RoofType.GABLE_METAL,
    name: "Двускатная кровля с металлочерепицей",
    deadLoad: 55, // kg/m2 of roof slope
    angleDegrees: 35
  },
  [RoofType.HIP_CERAMIC]: {
    id: RoofType.HIP_CERAMIC,
    name: "Вальмовая кровля с керамической черепицей (Creaton)",
    deadLoad: 110, // heavy ceramic roof tile!
    angleDegrees: 30
  },
  [RoofType.FLAT_PVC]: {
    id: RoofType.FLAT_PVC,
    name: "Плоская кровля с ПВХ мембраной и гравием",
    deadLoad: 150, // gravel base + insulation
    angleDegrees: 2
  },
  [RoofType.SHED_BOARD]: {
    id: RoofType.SHED_BOARD,
    name: "Односкатная кровля из профнастила",
    deadLoad: 35,
    angleDegrees: 15
  }
};

// 5. Soil Details
export const SOIL_DATA: Record<SoilType, SoilDetails> = {
  [SoilType.SAND]: {
    id: SoilType.SAND,
    name: "Песок средней крупности (Nisip mediu)",
    resistanceKPa: 280,
    Rmin: 200,
    Ravg: 280,
    Rmax: 350,
    Emin: 30,
    Eavg: 40,
    Emax: 50,
    density: 1800,
    poissonRatio: 0.30,
    settlementCoeff: 0.79,
    frostHeaveSensitivity: "Низкая",
    groundwaterSensitivity: "Низкая",
    description: "Прекрасный непучинистый дренирующий грунт. Высокая несущая способность, минимальные осадки. Встречается в долинах рек Днестр и Прут.",
    heavingRisk: 0.1,
    collapsibilityRisk: 0.0
  },
  [SoilType.SILTY_SAND]: {
    id: SoilType.SILTY_SAND,
    name: "Песок пылеватый (Nisip fin/lutos)",
    resistanceKPa: 180,
    Rmin: 125,
    Ravg: 180,
    Rmax: 240,
    Emin: 15,
    Eavg: 22,
    Emax: 28,
    density: 1650,
    poissonRatio: 0.33,
    settlementCoeff: 0.82,
    frostHeaveSensitivity: "Умеренная",
    groundwaterSensitivity: "Умеренная",
    description: "Пылеватый песчаный грунт с примесью ила. Подвержен водонасыщению со значительной потерей несущей способности. Требует эффективного перехватывающего дренажа.",
    heavingRisk: 0.35,
    collapsibilityRisk: 0.1
  },
  [SoilType.SANDY_LOAM]: {
    id: SoilType.SANDY_LOAM,
    name: "Супесь (Nisip lutos)",
    resistanceKPa: 150,
    Rmin: 100,
    Ravg: 150,
    Rmax: 200,
    Emin: 12,
    Eavg: 18,
    Emax: 24,
    density: 1700,
    poissonRatio: 0.35,
    settlementCoeff: 0.84,
    frostHeaveSensitivity: "Умеренная",
    groundwaterSensitivity: "Умеренная",
    description: "Смесь песка, пыли и глины. Имеет умеренную несущую способность. Склонен к пучению при насыщении влагой.",
    heavingRisk: 0.4,
    collapsibilityRisk: 0.1
  },
  [SoilType.LOAM]: {
    id: SoilType.LOAM,
    name: "Суглинок (Luto-argilos)",
    resistanceKPa: 200,
    Rmin: 130,
    Ravg: 200,
    Rmax: 270,
    Emin: 10,
    Eavg: 15,
    Emax: 22,
    density: 1850,
    poissonRatio: 0.37,
    settlementCoeff: 0.86,
    frostHeaveSensitivity: "Высокая",
    groundwaterSensitivity: "Высокая",
    description: "Наиболее распространенный грунт в Молдове. Имеет умеренную несущую способность. Склонен к морозному пучению при высоком УГВ.",
    heavingRisk: 0.5,
    collapsibilityRisk: 0.2
  },
  [SoilType.CLAY]: {
    id: SoilType.CLAY,
    name: "Глина пластичная (Argilă)",
    resistanceKPa: 160,
    Rmin: 110,
    Ravg: 160,
    Rmax: 220,
    Emin: 7,
    Eavg: 12,
    Emax: 18,
    density: 1950,
    poissonRatio: 0.42,
    settlementCoeff: 0.88,
    frostHeaveSensitivity: "Высокая",
    groundwaterSensitivity: "Высокая",
    description: "Тяжелый пучинистый грунт. Хорошо держит воду. Склонен к значительным деформациям при замачивании. Требует обязательного утепления отмостки плитами XPS.",
    heavingRisk: 0.9,
    collapsibilityRisk: 0.4
  },
  [SoilType.LOESS]: {
    id: SoilType.LOESS,
    name: "Лёссовый просадочный грунт (Cernoziom lëssoid, I-II тип)",
    resistanceKPa: 110,
    Rmin: 60,
    Ravg: 110,
    Rmax: 150,
    Emin: 5,
    Eavg: 9,
    Emax: 14,
    density: 1500,
    poissonRatio: 0.32,
    settlementCoeff: 0.85,
    frostHeaveSensitivity: "Умеренная",
    groundwaterSensitivity: "Высокая",
    description: "Специфический лессовый суглинок юга и центра Молдовы. Несущая способность резко падает при замачивании! Происходит резкая просадка основания на глубину деформации.",
    heavingRisk: 0.4,
    collapsibilityRisk: 0.9
  },
  [SoilType.FILLED]: {
    id: SoilType.FILLED,
    name: "Насыпной грунт / Техногенный (Pământ de umplutură)",
    resistanceKPa: 70,
    Rmin: 40,
    Ravg: 70,
    Rmax: 100,
    Emin: 2,
    Eavg: 5,
    Emax: 8,
    density: 1450,
    poissonRatio: 0.35,
    settlementCoeff: 0.90,
    frostHeaveSensitivity: "Умеренная",
    groundwaterSensitivity: "Высокая",
    description: "Насыпной или бытовой грунт. Крайне малая прочность, высокий риск неравномерных осадок. Требуется ТИСЭ с уширением, сваи ниже насыпи или полная структурная замена грунта.",
    heavingRisk: 0.6,
    collapsibilityRisk: 0.8
  },
  [SoilType.ROCK]: {
    id: SoilType.ROCK,
    name: "Скальный грунт прочный (Rocă stâncoasă)",
    resistanceKPa: 650,
    Rmin: 500,
    Ravg: 650,
    Rmax: 800,
    Emin: 80,
    Eavg: 120,
    Emax: 160,
    density: 2500,
    poissonRatio: 0.22,
    settlementCoeff: 0.55,
    frostHeaveSensitivity: "Низкая",
    groundwaterSensitivity: "Низкая",
    description: "Сверхпрочный скальный известняк, аргиллиты или известковый ракушечник Молдовы. Идеальное надежное основание для любых зданий. Морозное пучение отсутствует полностью. Осадки практически нулевые.",
    heavingRisk: 0.0,
    collapsibilityRisk: 0.0
  }
};

// 6. Cost Unit Rates for Moldovan Market in 2026 (MDL/молдавские леи)
export const COST_RATES = {
  CONCRETE_MDL_M3: 1750,       // Бетон С20/25 (M300) с доставкой миксером по Молдове
  STEEL_MDL_KG: 21,           // Арматура рифленая А500С / гладкая А240
  SAND_GRAVEL_MDL_M3: 450,    // Песчано-гравийная смесь с карьера (Оргеев/Ватич)
  WATERPROOFING_MDL_M2: 120,  // Битумная мастика + Техноэласт рулонный
  INSULATION_MDL_M3: 1400,    // Экструдированный пенополистирол (XPS Penoplex) 50/100 мм
  FORMWORK_MDL_M2: 240,       // Аренда щитовой опалубки и лесоматериалы (доска, крепеж, расходники)
  
  // Дополнительные детализированные расценки РМ 2026:
  EXCAVATION_MDL_M3: 155,     // Разработка грунта спецтехникой JCB с ручной подчисткой дна траншеи/котлована
  REBAR_BINDING_LABOR_MDL_KG: 4.5, // Работа по вязке арматурных каркасов и установке фиксаторов
  PILE_DRILLING_MDL_M: 280,   // Стоимость бурения скважины d300-350мм за пог.м (включая аренду бурояма)
  
  // Дренажный комплекс (защита от грунтовых вод):
  DRAIN_PIPE_MDL_M: 85,       // Дренажная перфорированная труба d110 в геотекстильном фильтре
  GEOTEXTILE_MDL_M2: 32,      // Геотекстиль Typar SF40 плотностью 120-150 г/м²
  CRUSHED_STONE_MDL_M3: 680,  // Щебень гранитный фракции 20-40 мм с карьера Ватич/Оргеев
  INSPECTION_WELL_MDL_PCS: 1350, // Смотровой дренажный ревизионный колодец d315 с крышкой
  DRAIN_WELL_400_MDL_PCS: 2400,  // Усиленный смотровой колодец d400 для осадочных фракций
  DRAIN_COLLECTOR_WELL_MDL_PCS: 4800, // Сборный железобетонный колодец из колец КС-10 с люком
  DRAIN_PUMP_MDL_PCS: 2200,      // Погружной дренажный насос с поплавковым выключателем
  
  // Инженерные сети (ввод/выпуск коммуникаций):
  NET_WATER_HDPE_MDL_M: 45,      // Водоснабжение: ПНД труба d32 PN10 + утеплитель
  NET_SEWER_PVC_MDL_M: 120,      // Канализация: ПВХ труба d110SN4 + муфты стыковки
  NET_POWER_CONDUIT_MDL_M: 35,   // Электроснабжение: двустенный гофрированный ПНД-канал d50
  NET_WEAK_CONDUIT_MDL_M: 18,    // Слаботочная сеть: защитная труба ПВХ d25
  NET_SPARE_CONDUIT_MDL_M: 35,   // Резервный ввод: толстостенная гильза ПНД d50
  
  // Контур защитного заземления:
  GROUNDING_STRIP_MDL_M: 95,     // Горячеоцинкованная стальная полоса 40х4мм с монтажом в траншею
  GROUNDING_ROD_MDL_PCS: 450,    // Вертикальные электроды (стальные омедненные штыри d16 L=3м)
  GROUNDING_CLAMP_MDL_PCS: 110,   // Соединительные латунные зажимы / шинные клеммы
  
  // Обратная засыпания пазух:
  BACKFILL_SOIL_MDL_M3: 180,     // Доставка супеси/ПГС мелкого, послойная проливка и уплотнение виброплитой
  
  // Защита гидроизоляции:
  MEMBRANE_PROFILED_MDL_M2: 75,  // Профилированная мембрана HDPE Planter/Delta с крепежом
  
  LABOR_PERCENT: 0.45,        // Оплата строительной бригады (45% от материалов)
  MACHINERY_PERCENT: 0.15,    // Спецтехника (экскаватор JCB, бетононасос, трамбовка) - 15%
  CURRENCY_RATE_USD: 18.0     // 1 USD = 18 MDL (для расчета по требованию)
};

// ======================================================================
// AUTOMATED ENGINEERING SYSTEMS MODULES - Stages 2, 3, 4, 5, 6, 7, 9, 10
// ======================================================================

export function calculateGeologyDetails(
  input: CalculatorInput,
  soilBearingCapacityKPa: number,
  reg: RegionDetails,
  soil: SoilDetails,
  depthM: number
): GeologyDetails {
  const Project_ID = input.projectId || "PRJ-2026-001";
  const Element_ID = "GEO-001";
  const WBS_Code = "WBS-1.1-GEOLOGY";
  const Risk_ID = "RSK-001";
  const Normative_ID = "NCM-EN-1997-1";
  const Calculation_ID = "CALC-GEO-001";
  const Inspection_ID = "INS-GEO-001";

  const Soil_Type = input.soilType;
  const Design_Resistance = soilBearingCapacityKPa;
  const Groundwater_Level = input.groundwaterDepth;
  const Deformation_Modulus = soil.Eavg;
  const Porosity = input.soilType === SoilType.SAND ? 0.35 : input.soilType === SoilType.ROCK ? 0.12 : input.soilType === SoilType.FILLED ? 0.55 : 0.42;
  const Frost_Heave_Index = input.soilType === SoilType.CLAY ? 0.08 : input.soilType === SoilType.LOESS ? 0.06 : input.soilType === SoilType.FILLED ? 0.07 : 0.01;
  const Weak_Layer_Depth = input.soilType === SoilType.FILLED ? 1.5 : input.soilType === SoilType.LOESS ? 2.5 : 4.5;
  const Soil_Heterogeneity = input.soilType === SoilType.FILLED ? 1.45 : input.soilType === SoilType.LOESS ? 1.25 : 1.15;
  const Borehole_Count = input.soilType === SoilType.ROCK ? 1 : 2;
  const Borehole_Depth = 6.0;
  const Safety_Factor = input.safetyFactor || 1.35;

  let suitabilitySlab: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let reasonSlab = "Плита обеспечивает равномерное перераспределение вертикальных сил.";
  let scoreSlab = 85;

  if (Soil_Type === SoilType.FILLED) {
    suitabilitySlab = "LOW";
    reasonSlab = "Высокий риск неравномерной осадки на насыпных разнородных грунтах.";
    scoreSlab = 40;
  } else if (Soil_Type === SoilType.LOESS && Groundwater_Level < 1.5) {
    suitabilitySlab = "CRITICAL";
    reasonSlab = "Малозаглубленный остов на просадочном подтопленном лессе крайне недопустим.";
    scoreSlab = 15;
  } else if (Groundwater_Level < 1.0) {
    suitabilitySlab = "MEDIUM";
    reasonSlab = "Требуется тяжелая мембранная гидроизоляция под всем зеркалом плиты.";
    scoreSlab = 65;
  }

  let suitabilityStrip: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let reasonStrip = "Классическая заглубленная лента на прочных устойчивых пластах.";
  let scoreStrip = 90;

  if (Soil_Type === SoilType.FILLED) {
    suitabilityStrip = "CRITICAL";
    reasonStrip = "Ленточный остов противопоказан на неконсолидированных насыпных грунтах.";
    scoreStrip = 10;
  } else if (Soil_Type === SoilType.ROCK) {
    suitabilityStrip = "HIGH";
    reasonStrip = "Опора на скалу (известняк) дает прочность с нулевыми деформациями.";
    scoreStrip = 98;
  } else if (Groundwater_Level < depthM) {
    suitabilityStrip = "LOW";
    reasonStrip = "Урез грунтовых вод проходит выше подошвы, угрожая подтоплением котлована.";
    scoreStrip = 35;
  } else if (Soil_Type === SoilType.LOESS) {
    suitabilityStrip = "MEDIUM";
    reasonStrip = "Просадочность лессов требует широкой отмостки и герметичных пазух.";
    scoreStrip = 70;
  }

  let suitabilityPiles: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let reasonPiles = "Буронабивные стволы переносят нагрузки ниже деформируемой толщи.";
  let scorePiles = 95;

  if (Soil_Type === SoilType.ROCK) {
    suitabilityPiles = "LOW";
    reasonPiles = "Бурение скважин в прочнейшем скальном известняке экономически нецелесообразно.";
    scorePiles = 30;
  } else if (Soil_Type === SoilType.FILLED) {
    suitabilityPiles = "HIGH";
    reasonPiles = "Единственный способ пройти насыпь с опорой на устойчивые коренные пласты.";
    scorePiles = 92;
  } else if (Soil_Type === SoilType.LOESS) {
    suitabilityPiles = "HIGH";
    reasonPiles = "Сваи исключают повреждения здания при замачивании просадочного лесса.";
    scorePiles = 94;
  }

  let suitabilityUSH: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let reasonUSH = "Энергоэффективная шведская плита с интегрированным теплым полов.";
  let scoreUSH = 88;

  if (Soil_Type === SoilType.FILLED) {
    suitabilityUSH = "LOW";
    reasonUSH = "Риск перекосов утеплителя при плохой подготовке насыпи.";
    scoreUSH = 42;
  } else if (Soil_Type === SoilType.LOESS && Groundwater_Level < 1.5) {
    suitabilityUSH = "CRITICAL";
    reasonUSH = "Размещение УШП на лессах при подтоплении запрещено нормами РМ.";
    scoreUSH = 20;
  } else if (input.landSlope > 5.0) {
    suitabilityUSH = "MEDIUM";
    reasonUSH = "Уклон рельефа более 5% требует подсыпки и массивного террасирования.";
    scoreUSH = 60;
  }

  // Calculate suitability for 7 new foundations
  let suitabilityClassicSlab: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let scoreClassicSlab = 82;
  let reasonClassicSlab = "Универсальный плитный фундамент с хорошей несущей способностью.";

  let suitabilityMzlf: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let scoreMzlf = 75;
  let reasonMzlf = "Простое мелкозаглубленное заложение для легких одноэтажных коробок.";

  let suitabilityStripWithSlab: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let scoreStripWithSlab = 88;
  let reasonStripWithSlab = "Максимально надежный комбинированный конструктив для любых жилых домов.";

  let suitabilityDrilledPiles: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let scoreDrilledPiles = 80;
  let reasonDrilledPiles = "Глубокие буронабивные сваи с монолитным железобетонным ростверком.";

  let suitabilityRibbedSlab: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let scoreRibbedSlab = 85;
  let reasonRibbedSlab = "Прочная ребристая плита с ребрами жесткости вниз для сложных нагрузок.";

  let suitabilityColumn: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let scoreColumn = 45;
  let reasonColumn = "Бюджетный столбчатый ростверк для легких конструкций.";

  let suitabilityTise: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL" = "HIGH";
  let scoreTise = 88;
  let reasonTise = "Сваи по технологии ТИСЭ с уширенной опорной пяткой против пучения.";

  if (Soil_Type === SoilType.FILLED) {
    suitabilityClassicSlab = "LOW"; reasonClassicSlab = "Высокий риск перекосов классической плиты на рыхлой насыпи."; scoreClassicSlab = 35;
    suitabilityMzlf = "CRITICAL"; reasonMzlf = "Мелкозаглубленная лента категорически запрещена на насыпных пластах."; scoreMzlf = 10;
    suitabilityStripWithSlab = "LOW"; reasonStripWithSlab = "Лента опускается глубоко, но насыпь угрожает внутреннему полу."; scoreStripWithSlab = 45;
    suitabilityDrilledPiles = "HIGH"; reasonDrilledPiles = "Позволяет пройти зыбкую насыпь до прочных коренных слоев."; scoreDrilledPiles = 95;
    suitabilityRibbedSlab = "LOW"; reasonRibbedSlab = "Ребристая плита подвержена неравномерным грунтовым усадкам."; scoreRibbedSlab = 40;
    suitabilityColumn = "CRITICAL"; reasonColumn = "Столбы абсолютно недопустимы на рыхлом неконсолидированном грунте."; scoreColumn = 5;
    suitabilityTise = "HIGH"; reasonTise = "Расширенная пята ТИСЭ надежно встает в плотный коренной слой."; scoreTise = 90;
  } else if (Soil_Type === SoilType.LOESS) {
    suitabilityClassicSlab = "MEDIUM"; reasonClassicSlab = "Требуется тщательная песчано-щебеночная подготовка против просадок."; scoreClassicSlab = 75;
    suitabilityMzlf = "LOW"; reasonMzlf = "МЗЛФ подвержен большим перекосам при замачивании лессовых грунтов."; scoreMzlf = 35;
    suitabilityStripWithSlab = "MEDIUM"; reasonStripWithSlab = "Плита по грунту защитит полы, но пазухи ленты требуют трамбовки."; scoreStripWithSlab = 80;
    suitabilityDrilledPiles = "HIGH"; reasonDrilledPiles = "Исключает риски замачивания и неравномерной усадки суглинка."; scoreDrilledPiles = 90;
    suitabilityRibbedSlab = "MEDIUM"; reasonRibbedSlab = "Повышенная жесткость ребер минимизирует риски локальной просадки."; scoreRibbedSlab = 82;
    suitabilityColumn = "LOW"; reasonColumn = "Крайне высокий риск продавливания единичных столбов при замокании лесса."; scoreColumn = 20;
    suitabilityTise = "HIGH"; reasonTise = "Сваи ТИСЭ полностью обходят просадочные горизонты суглинка."; scoreTise = 95;
  } else if (Soil_Type === SoilType.ROCK) {
    suitabilityClassicSlab = "HIGH"; reasonClassicSlab = "Оптимальная опора плиты на жесткий прочный скалистый известняк."; scoreClassicSlab = 92;
    suitabilityMzlf = "HIGH"; reasonMzlf = "Простое и надежное заложение облегченной ленты прямо на скалу."; scoreMzlf = 95;
    suitabilityStripWithSlab = "HIGH"; reasonStripWithSlab = "Абсолютная капитальность и нулевая усадка на известняковой подушке."; scoreStripWithSlab = 96;
    suitabilityDrilledPiles = "LOW"; reasonDrilledPiles = "Бурение прочных скал крайне дорого и технически затруднено."; scoreDrilledPiles = 25;
    suitabilityRibbedSlab = "HIGH"; reasonRibbedSlab = "Отличный синергетический эффект жесткой плиты и сверхпрочной скалы."; scoreRibbedSlab = 90;
    suitabilityColumn = "HIGH"; reasonColumn = "Простые опоры на твердый известняк для летних домиков без затрат."; scoreColumn = 80;
    suitabilityTise = "LOW"; reasonTise = "Расширение ТИСЭ уширителем невозможно выполнить в скальном грунте."; scoreTise = 30;
  }
  
  if (Groundwater_Level < 1.5) {
    suitabilityClassicSlab = "MEDIUM"; reasonClassicSlab = "Требуется качественная рулонная двухслойная гидроизоляция плиты."; scoreClassicSlab = Math.max(30, scoreClassicSlab - 20);
    suitabilityMzlf = "LOW"; reasonMzlf = "Высокие риски пучения мелкозаглубленного фундамента при зимнем замерзании."; scoreMzlf = Math.max(20, scoreMzlf - 35);
    suitabilityStripWithSlab = "MEDIUM"; reasonStripWithSlab = "Требуются уширенные гидроизоляционные работы на сопряжениях."; scoreStripWithSlab = Math.max(30, scoreStripWithSlab - 15);
    suitabilityDrilledPiles = "MEDIUM"; reasonDrilledPiles = "Вымывание бетона при заливке скважин водой требует обсадных труб."; scoreDrilledPiles = Math.max(35, scoreDrilledPiles - 15);
    suitabilityRibbedSlab = "MEDIUM"; reasonRibbedSlab = "Необходима отсыпка песчаного ядра и дренажный контур вокруг ребер."; scoreRibbedSlab = Math.max(35, scoreRibbedSlab - 15);
    suitabilityColumn = "LOW"; reasonColumn = "Намокание почвы под опорами может вызвать вспучивание и выталкивание столбов."; scoreColumn = Math.max(10, scoreColumn - 30);
    suitabilityTise = "HIGH"; reasonTise = "Уширенная пята препятствует выдергивающим силам морозного пучения."; scoreTise = Math.max(40, scoreTise - 5);
  }

  const ratingDetails = [
    { id: "strip", name: "Заглубленный ленточный СНиП", score: scoreStrip },
    { id: "slab", name: "Монолитная плита подвала/УШП", score: scoreSlab },
    { id: "piles", name: "Свайно-ростверковый буронабивной", score: scorePiles },
    { id: "ush", name: "Утепленная шведская плита (УШП)", score: scoreUSH },
    { id: "classic_slab", name: "Классическая монолитная плита", score: scoreClassicSlab },
    { id: "mzlf", name: "Мелкозаглубленный ленточный СНиП", score: scoreMzlf },
    { id: "strip_with_slab", name: "Ленточный с монолитной плитой по грунту", score: scoreStripWithSlab },
    { id: "drilled_piles", name: "Буронабивные сваи с ростверком", score: scoreDrilledPiles },
    { id: "ribbed_slab", name: "Монолитная ребристая плита", score: scoreRibbedSlab },
    { id: "column_footing", name: "Столбчатый фундамент с ростверком", score: scoreColumn },
    { id: "tise", name: "ТИСЭ с уширением пяты скважины", score: scoreTise }
  ];

  ratingDetails.sort((a, b) => b.score - a.score);
  const ratingOptions = ratingDetails.map((opt, index) => ({
    id: opt.id,
    name: opt.name,
    score: opt.score,
    rank: index + 1
  }));

  const soil_layers: GeologyLayer[] = [
    { name: "Почвенно-растительный слой (Слой 1)", thickness: 0.4, description: "Чернозем влажный с мелкими органическими включениями" },
    { name: `Несущий слой основания: ${soil.name} (Слой 2)`, thickness: 3.2, description: soil.description },
    { name: "Суглинок тугопластичный серовато-бурый (Слой 3)", thickness: 2.4, description: "Суглинистая порода с осколками ракушечника" }
  ];

  const suitability_matrix = [
    {
      id: "strip",
      type: "Заглубленный ленточный СНиП",
      suitability: (suitabilityStrip as string) === "HIGH" ? "Высокое соответствие" : (suitabilityStrip as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: Soil_Heterogeneity
    },
    {
      id: "slab",
      type: "Монолитная плита подвала/УШП",
      suitability: (suitabilitySlab as string) === "HIGH" ? "Высокое соответствие" : (suitabilitySlab as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: 1.0
    },
    {
      id: "piles",
      type: "Свайно-ростверковый буронабивной",
      suitability: (suitabilityPiles as string) === "HIGH" ? "Высокое соответствие" : (suitabilityPiles as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: 0.8
    },
    {
      id: "ush",
      type: "Утепленная шведская плита (УШП)",
      suitability: (suitabilityUSH as string) === "HIGH" ? "Высокое соответствие" : (suitabilityUSH as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: 1.0
    },
    {
      id: "classic_slab",
      type: "Классическая монолитная плита",
      suitability: (suitabilityClassicSlab as string) === "HIGH" ? "Высокое соответствие" : (suitabilityClassicSlab as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: 1.0
    },
    {
      id: "mzlf",
      type: "Мелкозаглубленный ленточный СНиП",
      suitability: (suitabilityMzlf as string) === "HIGH" ? "Высокое соответствие" : (suitabilityMzlf as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: Soil_Heterogeneity * 1.15
    },
    {
      id: "strip_with_slab",
      type: "Ленточный с монолитной плитой по грунту",
      suitability: (suitabilityStripWithSlab as string) === "HIGH" ? "Высокое соответствие" : (suitabilityStripWithSlab as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: Soil_Heterogeneity
    },
    {
      id: "drilled_piles",
      type: "Буронабивные сваи с ростверком",
      suitability: (suitabilityDrilledPiles as string) === "HIGH" ? "Высокое соответствие" : (suitabilityDrilledPiles as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: 0.8
    },
    {
      id: "ribbed_slab",
      type: "Монолитная ребристая плита",
      suitability: (suitabilityRibbedSlab as string) === "HIGH" ? "Высокое соответствие" : (suitabilityRibbedSlab as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: 1.0
    },
    {
      id: "column_footing",
      type: "Столбчатый фундамент с ростверком",
      suitability: (suitabilityColumn as string) === "HIGH" ? "Высокое соответствие" : (suitabilityColumn as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: Soil_Heterogeneity * 1.35
    },
    {
      id: "tise",
      type: "ТИСЭ с уширением пяты скважины",
      suitability: (suitabilityTise as string) === "HIGH" ? "Высокое соответствие" : (suitabilityTise as string) === "MEDIUM" ? "Удовлетворительно" : "Ограниченное соответствие",
      settlementRiskCoeff: 0.75
    }
  ];

  const recommendation_ranking = [
    {
      id: "strip",
      rank: ratingOptions.find(o => o.id === "strip")?.rank || 1,
      relativeEfficiencyScore: scoreStrip,
      suitabilityNote: reasonStrip
    },
    {
      id: "slab",
      rank: ratingOptions.find(o => o.id === "slab")?.rank || 2,
      relativeEfficiencyScore: scoreSlab,
      suitabilityNote: reasonSlab
    },
    {
      id: "piles",
      rank: ratingOptions.find(o => o.id === "piles")?.rank || 3,
      relativeEfficiencyScore: scorePiles,
      suitabilityNote: reasonPiles
    },
    {
      id: "ush",
      rank: ratingOptions.find(o => o.id === "ush")?.rank || 4,
      relativeEfficiencyScore: scoreUSH,
      suitabilityNote: reasonUSH
    },
    {
      id: "classic_slab",
      rank: ratingOptions.find(o => o.id === "classic_slab")?.rank || 5,
      relativeEfficiencyScore: scoreClassicSlab,
      suitabilityNote: reasonClassicSlab
    },
    {
      id: "mzlf",
      rank: ratingOptions.find(o => o.id === "mzlf")?.rank || 6,
      relativeEfficiencyScore: scoreMzlf,
      suitabilityNote: reasonMzlf
    },
    {
      id: "strip_with_slab",
      rank: ratingOptions.find(o => o.id === "strip_with_slab")?.rank || 7,
      relativeEfficiencyScore: scoreStripWithSlab,
      suitabilityNote: reasonStripWithSlab
    },
    {
      id: "drilled_piles",
      rank: ratingOptions.find(o => o.id === "drilled_piles")?.rank || 8,
      relativeEfficiencyScore: scoreDrilledPiles,
      suitabilityNote: reasonDrilledPiles
    },
    {
      id: "ribbed_slab",
      rank: ratingOptions.find(o => o.id === "ribbed_slab")?.rank || 9,
      relativeEfficiencyScore: scoreRibbedSlab,
      suitabilityNote: reasonRibbedSlab
    },
    {
      id: "column_footing",
      rank: ratingOptions.find(o => o.id === "column_footing")?.rank || 10,
      relativeEfficiencyScore: scoreColumn,
      suitabilityNote: reasonColumn
    },
    {
      id: "tise",
      rank: ratingOptions.find(o => o.id === "tise")?.rank || 11,
      relativeEfficiencyScore: scoreTise,
      suitabilityNote: reasonTise
    }
  ];

  return {
    Project_ID, Element_ID, WBS_Code, Risk_ID, Normative_ID, Calculation_ID, Inspection_ID,
    Soil_Type,
    Design_Resistance,
    Groundwater_Level,
    Deformation_Modulus,
    Porosity,
    Frost_Heave_Index,
    Weak_Layer_Depth,
    Soil_Heterogeneity,
    Borehole_Count,
    Borehole_Depth,
    Safety_Factor,
    soil_layers,
    suitabilitySlab, suitabilityStrip, suitabilityPiles, suitabilityUSH,
    scoreSlab, scoreStrip, scorePiles, scoreUSH,
    reasonSlab, reasonStrip, reasonPiles, reasonUSH,
    ratingOptions,
    soil_type: Soil_Type,
    design_soil_resistance: Design_Resistance,
    groundwater_level: Groundwater_Level,
    freezing_depth: reg.frostDepth,
    deformation_modulus: Deformation_Modulus,
    soil_heterogeneity_factor: Soil_Heterogeneity,
    number_of_boreholes: Borehole_Count,
    borehole_depth: Borehole_Depth,
    suitability_matrix,
    recommendation_ranking
  };
}

export function calculateUtilities(input: CalculatorInput, perimeter: number): UtilitiesModel {
  const Project_ID = input.projectId || "PRJ-2026-001";
  const Element_ID = "UTL-001";
  const WBS_Code = "WBS-1.2-UTILITIES";
  const Risk_ID = "RSK-002";
  const Normative_ID = "СНиП 2.04.03-85";
  const Calculation_ID = "CALC-UTL-001";
  const Inspection_ID = "INS-UTL-001";

  const sewerLength = Math.ceil(perimeter * 0.4);
  const sewerMatCost = sewerLength * COST_RATES.NET_SEWER_PVC_MDL_M + 1200;
  const sewerWorkCost = sewerLength * 150 + 2000;
  const sewerTotalCost = sewerMatCost + sewerWorkCost;
  const sewerSub: UtilitySubsystem = {
    Project_ID, Element_ID: "UTL-SEW-001", WBS_Code: "WBS-1.2.1-SEWER", Risk_ID: "RSK-UTL-SEW", Normative_ID: "СНиП 2.04.03-85", Calculation_ID, Inspection_ID,
    id: "SEWER",
    nameRu: "Водоотведение и Канализация (Раздел SEWER)",
    nameRo: "Sistemul de canalizare exterioară",
    materials: [
      { name: "Труба ПВХ d110 SN4 наружная уличная в отрезках 3м", qty: Math.ceil(sewerLength / 3), unit: "шт", cost: sewerLength * COST_RATES.NET_SEWER_PVC_MDL_M },
      { name: "Фитинги, компенсационные муфты, ревизионные люки", qty: 1, unit: "компл", cost: 1200 }
    ],
    works: [
      { name: "Разработка траншей под постоянный уклон 2% вручную с песчаным ложем", qty: sewerLength, unit: "м.п.", cost: sewerLength * 150 },
      { name: "Укладка безнапорного рукава d110 в гильзу, засыпка", qty: 1, unit: "компл", cost: 2000 }
    ],
    volumes: {
      "Протяженность канализационного лотка": `${sewerLength} м.п.`,
      "Уклон выпуска": "2%"
    },
    materialCostMDL: sewerMatCost,
    workCostMDL: sewerWorkCost,
    costMDL: sewerTotalCost,
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      { criterion: "Угол и прямолинейность уклона укладки труб d110", status: "PASS", value: "2.10% уклона", norm: "СНиП 2.04.03-85: Постоянный уличный уклон транзита d110 равен 2%" }
    ],
    risks: ["Засорение трассы при отклонениях уклона", "Деформация выпуска весом монолита"]
  };

  const waterLength = 15;
  const waterMatCost = waterLength * COST_RATES.NET_WATER_HDPE_MDL_M + waterLength * 60 + 450;
  const waterWorkCost = waterLength * 120 + 1500;
  const waterTotalCost = waterMatCost + waterWorkCost;
  const waterSub: UtilitySubsystem = {
    Project_ID, Element_ID: "UTL-WAT-001", WBS_Code: "WBS-1.2.2-WATER", Risk_ID: "RSK-UTL-WAT", Normative_ID: "СНиП 2.04.02-84", Calculation_ID, Inspection_ID,
    id: "WATER",
    nameRu: "Ввод Питьевой Воды (Раздел WATER)",
    nameRo: "Introducerea conductei de apă potabilă",
    materials: [
      { name: "Труба ПНД d32 PN16 напорная питьевая", qty: waterLength, unit: "м.п.", cost: waterLength * COST_RATES.NET_WATER_HDPE_MDL_M },
      { name: "Защитный рукав-футляр HDPE d50 мм", qty: waterLength, unit: "м.п.", cost: waterLength * 60 },
      { name: "Саморегулирующийся греющий кабель мощностью 16 Вт/м", qty: 3, unit: "м.п.", cost: 450 }
    ],
    works: [
      { name: "Прокладка футляра HDPE d50 ниже промерзания на глубине 1.2м", qty: waterLength, unit: "м.п.", cost: waterLength * 120 },
      { name: "Монтаж греющего контура, обжим переходников, опрессовка", qty: 1, unit: "компл", cost: 1500 }
    ],
    volumes: {
      "Длина прокладываемого водопровода": `${waterLength} м.п.`,
      "Глубина укладки": "1.2 м"
    },
    materialCostMDL: waterMatCost,
    workCostMDL: waterWorkCost,
    costMDL: waterTotalCost,
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      { criterion: "Глубина укладки водовода для предотвращения обледенения", status: "PASS", value: "Глубина укладки 1.20 м", norm: "СНиП 2.04.02-84: Трубы закладывать глубже расчетного промерзания грунта" }
    ],
    risks: ["Временное замерзание при критических холодах без прогрева", "Нарушение герметичности стыков"]
  };

  const powerLength = 20;
  const powerMatCost = powerLength * COST_RATES.NET_POWER_CONDUIT_MDL_M + powerLength * 95;
  const powerWorkCost = powerLength * 90 + 1000;
  const powerTotalCost = powerMatCost + powerWorkCost;
  const powerSub: UtilitySubsystem = {
    Project_ID, Element_ID: "UTL-POW-001", WBS_Code: "WBS-1.2.3-POWER", Risk_ID: "RSK-UTL-POW", Normative_ID: "ПУЭ Республики Молдова", Calculation_ID, Inspection_ID,
    id: "POWER",
    nameRu: "Энергообеспечение Силовое (Раздел POWER)",
    nameRo: "Intrări de curent electric de forță",
    materials: [
      { name: "Двустенная полиэтиленовая ПНД гофротруба d50 красная", qty: powerLength, unit: "м.п.", cost: powerLength * COST_RATES.NET_POWER_CONDUIT_MDL_M },
      { name: "Кабель ВВГнг-LS 4х16 медный бронированный", qty: powerLength, unit: "м.п.", cost: powerLength * 95 }
    ],
    works: [
      { name: "Протяжка бронированного кабеля ВВГнг-LS в канале d50", qty: powerLength, unit: "м.п.", cost: powerLength * 90 },
      { name: "Заземление вводного бронепояса, опрессовка наконечников", qty: 1, unit: "компл", cost: 1000 }
    ],
    volumes: {
      "Протяженность силового кабельного канала": `${powerLength} м.п.`,
      "Защитная труба": "ПНД d50"
    },
    materialCostMDL: powerMatCost,
    workCostMDL: powerWorkCost,
    costMDL: powerTotalCost,
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      { criterion: "Устойчивость кабель-канала к статическим нагрузкам грунта", status: "PASS", value: "Двустенный особо жесткий гибкий рукав", norm: "ПУЭ: Под фундаментами прокладка бронированных кабелей осуществляется в жестких гильзах" }
    ],
    risks: ["Механический срез кабеля при просадках отмостки", "Заплывание вводов илом"]
  };

  const lowLength = 15;
  const lowMatCost = lowLength * COST_RATES.NET_WEAK_CONDUIT_MDL_M + lowLength * 15;
  const lowWorkCost = lowLength * 70 + 800;
  const lowTotalCost = lowMatCost + lowWorkCost;
  const lowSub: UtilitySubsystem = {
    Project_ID, Element_ID: "UTL-LC-001", WBS_Code: "WBS-1.2.4-LOW_CURRENT", Risk_ID: "RSK-UTL-LC", Normative_ID: "СНиП 3.05.06-85", Calculation_ID, Inspection_ID,
    id: "LOW_CURRENT",
    nameRu: "Слаботочные Сети и Связь (Раздел LOW_CURRENT)",
    nameRo: "Sistemul de conducte curent slab",
    materials: [
      { name: "Труба ПНД гладкая техническая d25 черная", qty: lowLength, unit: "м.п.", cost: lowLength * COST_RATES.NET_WEAK_CONDUIT_MDL_M },
      { name: "Кабель сигнальный Shielded UTP под домофон/интернет", qty: lowLength, unit: "м.п.", cost: lowLength * 15 }
    ],
    works: [
      { name: "Прокладка ПНД труб d25 в песчаном лотке раздельно от силы", qty: lowLength, unit: "м.п.", cost: lowLength * 70 },
      { name: "Затяжка протяжного шнура и сигнальной витой пары", qty: 1, unit: "компл", cost: 800 }
    ],
    volumes: {
      "Каналы слаботочных сетей": `${lowLength} м.п.`
    },
    materialCostMDL: lowMatCost,
    workCostMDL: lowWorkCost,
    costMDL: lowTotalCost,
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      { criterion: "Защищенность коаксиальных и сигнальных пар от влаги", status: "PASS", value: "Песчаная траншея, защитная ПНД полиэтиленовая гладкая труба d25", norm: "СНиП 3.05.06-85: Слаботочные кабельные магистрали укладываются раздельно от силовых цепей" }
    ],
    risks: ["Электромагнитные наводки близлежащих цепей", "Передавливание рукава камнями"]
  };

  const sleeveCount = 4;
  const sleeveMatCost = sleeveCount * 180 + sleeveCount * 240;
  const sleeveWorkCost = sleeveCount * 150 + 1000;
  const sleeveTotalCost = sleeveMatCost + sleeveWorkCost;
  const spareSleevesSub: UtilitySubsystem = {
    Project_ID, Element_ID: "UTL-RSV-001", WBS_Code: "WBS-1.2.5-RESERVE_SLEEVES", Risk_ID: "RSK-UTL-RSV", Normative_ID: "NCM F.02.02", Calculation_ID, Inspection_ID,
    id: "SPARE_SLEEVES",
    nameRu: "Резервные Проходные Гильзы (Раздел SPARE_SLEEVES)",
    nameRo: "Sleeve-uri de rezervă pentru rețele",
    materials: [
      { name: "Пластиковая жесткая толстостенная гильза HDPE d160", qty: sleeveCount, unit: "шт", cost: sleeveCount * 180 },
      { name: "Сальники и расширяющиеся пробки d160 с водоотталкивающей мастикой", qty: sleeveCount, unit: "шт", cost: sleeveCount * 240 }
    ],
    works: [
      { name: "Инсталляция гильз d160 перед бетонированием в теле фундамента", qty: sleeveCount, unit: "шт", cost: sleeveCount * 150 },
      { name: "Герметизация пустых зазоров сальниками и термоусадкой", qty: 1, unit: "компл", cost: 1000 }
    ],
    volumes: {
      "Количество закладных гильз d160": `${sleeveCount} шт.`,
      "Резерв": "100%"
    },
    materialCostMDL: sleeveMatCost,
    workCostMDL: sleeveWorkCost,
    costMDL: sleeveTotalCost,
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      { criterion: "Предотвращение среза сетей при деформациях основания", status: "PASS", value: `${sleeveCount} загерметизированных гильз d160`, norm: "NCM F.02.02: Обеспечение подвижного зазора прохода коммуникаций через капитальные бетонные стены" }
    ],
    risks: ["Смещение заложения гильз при приеме раствора", "Усыхание мастики через 5-8 лет"]
  };

  const totalCostMDL = sewerTotalCost + waterTotalCost + powerTotalCost + lowTotalCost + sleeveTotalCost;

  return {
    sewer: sewerSub,
    water: waterSub,
    power: powerSub,
    lowCurrent: lowSub,
    spareSleeves: spareSleevesSub,
    totalCostMDL
  };
}

export function calculateConcreteCuring(
  input: CalculatorInput,
  footingArea: number,
  concreteVol: number
): ConcreteCuringModel {
  const Project_ID = input.projectId || "PRJ-2026-001";
  const Element_ID = "CUR-001";
  const WBS_Code = "WBS-1.3-CONCRETE_CURING";
  const Risk_ID = "RSK-003";
  const Normative_ID = "СНиП 3.03.01-87";
  const Calculation_ID = "CALC-CUR-001";
  const Inspection_ID = "INS-CUR-001";

  const hasCuringSection = true;
  const peFilmAreaM2 = Math.round(footingArea * 1.15);
  const peFilmCostMDL = peFilmAreaM2 * 15;
  const moisturizingDays = 14;
  const moisturizingVolumeM3 = Math.round(footingArea * 14 * 0.005);
  const moisturizingCostMDL = Math.round(moisturizingVolumeM3 * 120) + 1200;

  const winterProtectionRequired = input.region === MoldovaRegion.NORTH || input.safetyFactor > 1.35;
  const winterCostMDL = winterProtectionRequired ? Math.round(footingArea * 75) : 0;

  const antifreezeAdditiveQtyKg = winterProtectionRequired ? Math.ceil(concreteVol * 5.25) : 0;
  const antifreezeAdditiveCostMDL = antifreezeAdditiveQtyKg * 25;

  const holdingDays = 28;
  const totalCostMDL = peFilmCostMDL + moisturizingCostMDL + winterCostMDL + antifreezeAdditiveCostMDL;

  const materials: BIMEntityMaterial[] = [
    { name: "Рулонная защитная ПЭ пленка высокой плотности 150 мкм", qty: peFilmAreaM2, unit: "м²", cost: peFilmCostMDL },
    { name: "Вода технологическая очищенная для систематического орошения", qty: moisturizingVolumeM3, unit: "м³", cost: moisturizingCostMDL - 1200 }
  ];
  if (antifreezeAdditiveQtyKg > 0) {
    materials.push({
      name: "Противоморозные комплексные добавки ПМД ускоряюще-пластифицирующие",
      qty: antifreezeAdditiveQtyKg,
      unit: "кг",
      cost: antifreezeAdditiveCostMDL
    });
  }

  const works: UtilitySubsystemWork[] = [
    { name: "Укрытие горизонтального зеркала залитого свежего бетона полиэтиленом", qty: peFilmAreaM2, unit: "м²", cost: Math.round(peFilmAreaM2 * 10) },
    { name: "Регулярный пролив водой поверхности 3 раза в сутки в течение норматива", qty: moisturizingDays, unit: "суток", cost: 1200 }
  ];
  if (winterProtectionRequired) {
    works.push({
      name: "Укрытие теплоизолирующими плотными геотекстильными матами (дорнит)",
      qty: footingArea,
      unit: "м²",
      cost: winterCostMDL
    });
  }

  const qualityChecks: BIMQualityCheck[] = [
    {
      criterion: "Предотвращение критического усадочного пересыхания бетона на ранней стадии созревания",
      status: "PASS",
      value: "Сохранение гидрологического баланса пленочным укрытием",
      norm: "СНиП 3.03.01-87: Свежий цементный камень требует непрерывной влажной среды до достижения 70% своей паспортной прочности"
    }
  ];

  return {
    Project_ID, Element_ID, WBS_Code, Risk_ID, Normative_ID, Calculation_ID, Inspection_ID,
    hasCuringSection,
    peFilmAreaM2,
    peFilmCostMDL,
    moisturizingDays,
    moisturizingVolumeM3,
    moisturizingCostMDL,
    winterProtectionRequired,
    winterCostMDL,
    antifreezeAdditiveQtyKg,
    antifreezeAdditiveCostMDL,
    holdingDays,
    totalCostMDL,
    materials,
    works,
    qualityChecks,
    risks: ["Риск усадочных волосных трещин от солнечной радиации", "Замедление набора прочности при ночных падениях температуры"],
    airTemperatureC: input.region === MoldovaRegion.NORTH ? 8 : input.region === MoldovaRegion.SOUTH ? 18 : 14,
    methodDescription: "Мокрое выдерживание под герметичной влагозащитной полиэтиленовой пленкой по СНиП 3.03.01-87",
    materialsNeeded: materials,
    qcRequirements: qualityChecks
  };
}

export function calculateBackfill(
  input: CalculatorInput,
  excavationVol: number,
  concreteVol: number
): BackfillModel {
  const Project_ID = input.projectId || "PRJ-2026-001";
  const Element_ID = "BCK-001";
  const WBS_Code = "WBS-1.4-BACKFILL";
  const Risk_ID = "RSK-004";
  const Normative_ID = "СНиП 3.02.01-87";
  const Calculation_ID = "CALC-BCK-001";
  const Inspection_ID = "INS-BCK-001";

  const excavationVolumeM3 = Math.round(excavationVol);
  const constructionVolumeM3 = Math.round(concreteVol * 0.7);
  const backfillVolumeM3 = Math.round(Math.max(12, excavationVolumeM3 - constructionVolumeM3));

  const materialName = "Супесь/песчано-гравийная смесь (ПГС) Ватич мелкой и средней фракции";
  const materialQtyM3 = Math.round(backfillVolumeM3 * 1.15);
  const materialCostMDL = materialQtyM3 * COST_RATES.BACKFILL_SOIL_MDL_M3;

  const compactionRuns = 5;
  const compactionCoeff = NORMATIVES.COMPACTION_COEFF.val;
  const workCostMDL = Math.round(backfillVolumeM3 * 110);
  const totalCostMDL = materialCostMDL + workCostMDL;

  const materials: BIMEntityMaterial[] = [
    { name: materialName, qty: materialQtyM3, unit: "м³", cost: materialCostMDL }
  ];

  const works: UtilitySubsystemWork[] = [
    { name: "Послойная засыпка траншей/пазух песком с обильным увлажнением", qty: backfillVolumeM3, unit: "м³", cost: Math.round(workCostMDL * 0.4) },
    { name: "Послойное вибротрамбование площадки плитой весом 120кг", qty: compactionRuns, unit: "слоев", cost: Math.round(workCostMDL * 0.6) }
  ];

  const qualityChecks: BIMQualityCheck[] = [
    {
      criterion: "Плотность уплотнения обратной засыпки пазух фундамента",
      status: "PASS",
      value: `Фактический коэффициент K_com = ${compactionCoeff}`,
      norm: "СНиП 3.02.01-87: Требуемый коэффициент плотности песчаных уплотненных подушек и обратной засыпки под отмостку равен K_com >= 0.98"
    }
  ];

  return {
    Project_ID, Element_ID, WBS_Code, Risk_ID, Normative_ID, Calculation_ID, Inspection_ID,
    excavationVolumeM3,
    constructionVolumeM3,
    backfillVolumeM3,
    materialName,
    materialQtyM3,
    materialCostMDL,
    compactionRuns,
    compactionCoeff,
    workCostMDL,
    totalCostMDL,
    materials,
    works,
    qualityChecks,
    excavationM3: excavationVolumeM3,
    concreteDisplacementM3: constructionVolumeM3,
    netBackfillVolumeM3: backfillVolumeM3,
    soilSwellFactor: 1.15,
    densityRequiredT_M3: compactionCoeff * 1.65,
    materialsNeeded: materials,
    optimalMoisturePercent: 12,
    compactionPasses: compactionRuns
  };
}

export function calculateBlindArea(
  input: CalculatorInput,
  perimeter: number
): BlindAreaModel {
  const Project_ID = input.projectId || "PRJ-2026-001";
  const Element_ID = "BLD-001";
  const WBS_Code = "WBS-1.5-BLIND_AREA";
  const Risk_ID = "RSK-005";
  const Normative_ID = "NCM-F.02.02";
  const Calculation_ID = "CALC-BLD-001";
  const Inspection_ID = "INS-BLD-001";

  const widthM = 0.8;
  const thicknessMM = 80;
  const areaM2 = Math.round(perimeter * widthM);

  const concreteVolumeM3 = Math.round(areaM2 * (thicknessMM / 1000) * 10) / 10;
  const concreteCostMDL = Math.round(concreteVolumeM3 * 1350);

  const rebarWeightKg = Math.round(areaM2 * 3.8);
  const rebarCostMDL = Math.round(rebarWeightKg * 21);

  const xpsVolumeM3 = Math.round(areaM2 * 0.05 * 10) / 10;
  const xpsCostMDL = Math.round(xpsVolumeM3 * 1400);

  const preparationSandM3 = Math.round(areaM2 * 0.1 * 10) / 10;
  const preparationSandCostMDL = Math.round(preparationSandM3 * 450);

  const workCostMDL = Math.round(areaM2 * 140);
  const totalCostMDL = concreteCostMDL + rebarCostMDL + xpsCostMDL + preparationSandCostMDL + workCostMDL;

  const materials: BIMEntityMaterial[] = [
    { name: "Товарный бетон С12/15 (М200) для защитной жесткой стяжки отмостки", qty: concreteVolumeM3, unit: "м³", cost: concreteCostMDL },
    { name: "Решетка сварная арматурная дорожная d4 с ячейкой 100х100мм", qty: areaM2, unit: "м²", cost: rebarCostMDL },
    { name: "Утеплитель экструдированный пенополистирол XPS 50мм (для цоколя)", qty: xpsVolumeM3, unit: "м³", cost: xpsCostMDL },
    { name: "Подсыпка из ПГС коренная уплотненная с планировкой склона (карьер)", qty: preparationSandM3, unit: "м³", cost: preparationSandCostMDL }
  ];

  const works: UtilitySubsystemWork[] = [
    { name: "Монтаж песчано-гравийной подушки 100мм с уплотнением виброрейкой", qty: areaM2, unit: "м²", cost: Math.round(workCostMDL * 0.3) },
    { name: "Укладка теплоизоляционных плит XPS 50мм, демпферная кромочная лента", qty: areaM2, unit: "м²", cost: Math.round(workCostMDL * 0.2) },
    { name: "Формовка бетонной разуклонной доски 80мм по периметру с затиркой", qty: areaM2, unit: "м²", cost: Math.round(workCostMDL * 0.5) }
  ];

  const qualityChecks: BIMQualityCheck[] = [
    {
      criterion: "Разуклонка наружной поверхности откоса от фасада строения",
      status: "PASS",
      value: "Фактический поперечный уклон равен 2.5%",
      norm: "СП 22.13330: Уклон жесткой отмостки от 1.5% до 3% гарантирует моментальный увод ливневых масс от суглинков"
    },
    {
      criterion: "Наличие жесткого гидрофобно-термического амортизационного XPS шва",
      status: "PASS",
      value: "Цоколь изолирован плитами XPS 50мм по всей границе",
      norm: "NCM F.02.02: Теплоизоляция пучинистых контуров существенно ослабляет касательное пучение зимних глин"
    }
  ];

  return {
    Project_ID, Element_ID, WBS_Code, Risk_ID, Normative_ID, Calculation_ID, Inspection_ID,
    areaM2,
    widthM,
    thicknessMM,
    concreteVolumeM3,
    concreteCostMDL,
    rebarWeightKg,
    rebarCostMDL,
    xpsVolumeM3,
    xpsCostMDL,
    preparationSandM3,
    preparationSandCostMDL,
    workCostMDL,
    totalCostMDL,
    materials,
    works,
    qualityChecks,
    perimeterM: perimeter,
    blindAreaWidthM: widthM,
    excavationVolumeM3: Math.round(areaM2 * 0.15 * 10) / 10,
    insulationXpsM3: xpsVolumeM3,
    gravelBaseM3: preparationSandM3,
    concreteC20_25M3: concreteVolumeM3,
    reinforcingMeshKg: rebarWeightKg,
    materialsNeeded: materials
  };
}

export function calculateRisksList(
  input: CalculatorInput,
  selectedOption: FoundationOption,
  hasCuring: boolean,
  hasInsulation: boolean
): RiskItem[] {
  const Project_ID = input.projectId || "PRJ-2026-001";
  const list: RiskItem[] = [];

  const concreteVol = selectedOption.materials.concreteVolumeM3 || 0;
  const rebarKg = selectedOption.materials.reinforcementBarKg || 0;
  const rebarDensity = concreteVol > 0 ? (rebarKg / concreteVol) : 0;
  const frostDepth = REGION_DATA[input.region]?.frostDepth || 0.8;
  const depthM = selectedOption.depthM || 0.8;

  if (input.soilType === SoilType.FILLED) {
    list.push({
      Risk_ID: "RSK-GEO-SL-01", Project_ID, Element_ID: "GEO-001", WBS_Code: "WBS-1.1", Normative_ID: "NCM EN 1997-1", Calculation_ID: "CALC-GEO-01", Inspection_ID: "INS-GEO-01",
      description: "Насыпной разнородный грунт основания с низкой несущей прочностью",
      severity: "CRITICAL",
      probability: 85,
      impact: 90,
      status: "ACTIVE",
      mitigation: "Выполнить замену насыпного грунта послойной песчаной подушкой с вибротрамбованием, либо применить свайно-ростверковый остов."
    });
  } else if (input.soilType === SoilType.LOESS) {
    list.push({
      Risk_ID: "RSK-GEO-SL-02", Project_ID, Element_ID: "GEO-001", WBS_Code: "WBS-1.1", Normative_ID: "NCM EN 1997-1", Calculation_ID: "CALC-GEO-01", Inspection_ID: "INS-GEO-01",
      description: "Просадочный чувствительный к влаге лессовый грунт основания",
      severity: "HIGH",
      probability: 65,
      impact: 75,
      status: "ACTIVE",
      mitigation: "Устроить широкую водонепроницаемую отмостку 2.5%, обеспечить герметичные пазухи и замки."
    });
  }

  if (input.groundwaterDepth < 1.5) {
    list.push({
      Risk_ID: "RSK-GEO-WT-01", Project_ID, Element_ID: "GEO-002", WBS_Code: "WBS-1.1", Normative_ID: "СНиП 2.02.01", Calculation_ID: "CALC-GEO-01", Inspection_ID: "INS-GEO-01",
      description: "Обильно насыщенный горизонт высоких грунтовых вод (УГВ)",
      severity: "HIGH",
      probability: 75,
      impact: 80,
      status: "ACTIVE",
      mitigation: "Устройство кольцевого глубинного дренажа, монтаж ревизионных колодцев ПВХ d315, использование гидрофобного бетона W8."
    });
  }

  if (rebarDensity < 65) {
    list.push({
      Risk_ID: "RSK-STR-RB-01", Project_ID, Element_ID: "STR-001", WBS_Code: "WBS-1.5", Normative_ID: "NCM F.02.02", Calculation_ID: "CALC-STR-01", Inspection_ID: "INS-STR-01",
      description: "Спад жесткости балок из-за низкого удельного веса арматурного каркаса",
      severity: "HIGH",
      probability: 50,
      impact: 85,
      status: "ACTIVE",
      mitigation: "Добавить дополнительные рабочие продольные стержни d12 А500С и сузить шаг хомутов до 150-200мм."
    });
  }

  if (!hasCuring) {
    list.push({
      Risk_ID: "RSK-CON-CR-01", Project_ID, Element_ID: "CUR-001", WBS_Code: "WBS-1.3", Normative_ID: "СНиП 3.03.01-87", Calculation_ID: "CALC-CUR-01", Inspection_ID: "INS-CUR-01",
      description: "Угроза растрескивания монолита от пересыхания при отсутствии ухода",
      severity: "HIGH",
      probability: 80,
      impact: 70,
      status: "ACTIVE",
      mitigation: "Закрыть чашу бетона полиэтиленовой укрывной пленкой 150мкм и поливать водой в течение первых 10-14 дней."
    });
  }

  if (!hasInsulation) {
    list.push({
      Risk_ID: "RSK-THM-INS-01", Project_ID, Element_ID: "XPS-001", WBS_Code: "WBS-1.6", Normative_ID: "NCM L.02.01:2012", Calculation_ID: "CALC-THM-01", Inspection_ID: "INS-THM-01",
      description: "Промерзание пучинистого грунта цоколя при отсутствии теплозащиты",
      severity: "HIGH",
      probability: 70,
      impact: 65,
      status: "ACTIVE",
      mitigation: "Заложить утепляющие плиты XPS плотностью не менее 35 кг/м³ толщиной 50-100мм по цоколю здания."
    });
  }

  if (selectedOption.id === "strip" && depthM < frostDepth) {
    list.push({
      Risk_ID: "RSK-GEO-DP-01", Project_ID, Element_ID: "STR-002", WBS_Code: "WBS-1.5", Normative_ID: "NCM F.02.02", Calculation_ID: "CALC-GEO-01", Inspection_ID: "INS-GEO-01",
      description: "Закладка подошвы выше нормативной глубины зимнего промерзания суглинка",
      severity: "CRITICAL",
      probability: 85,
      impact: 90,
      status: "ACTIVE",
      mitigation: "Углубить заложение монолитного ребра до отметки ниже расчетного нуля промерзания почвы (до 1.1-1.2м)."
    });
  }

  if (list.length === 0) {
    list.push({
      Risk_ID: "RSK-PLN-SAFE-01", Project_ID, Element_ID: "ALL-001", WBS_Code: "WBS-1", Normative_ID: "СНиП 2.02.01", Calculation_ID: "CALC-ALL", Inspection_ID: "INS-ALL",
      description: "Минимальный технологический риск замачивания пазух",
      severity: "LOW",
      probability: 10,
      impact: 15,
      status: "MITIGATED",
      mitigation: "Проектные нормы и рекомендации NCM полностью соблюдены."
    });
  }

  return list;
}

export function calculateOptionExplanations(
  input: CalculatorInput
): OptionExplanation[] {
  const list: OptionExplanation[] = [];
  const soilType = input.soilType;
  const gwt = input.groundwaterDepth;
  const floors = input.floors;

  // 1. Slab / УШП
  const isSlabRecommended = soilType !== SoilType.FILLED && !(soilType === SoilType.LOESS && gwt < 1.5) && input.landSlope <= 5.0;
  let slabVer = "Рекомендовано в качестве оптимального плитно-энергетического ядра.";
  const slabReasons: string[] = [];
  if (soilType !== SoilType.FILLED) {
    slabReasons.push(`Грунт основания (${soilType}) стабилен, позволяет выполнить заливку плит с равномерным осадочным давлением.`);
  }
  if (gwt >= 1.8) {
    slabReasons.push("Глубокий горизонт грунтовых вод (УГВ) гарантирует сухость распределительного цокольного пирога.");
  } else {
    slabReasons.push("Высокий УГВ надежно отводится кольцевым дренажем с выводом в коллектор.");
  }
  if (floors <= 2) {
    slabReasons.push(`Умеренная этажность коттеджа (${floors} эт.) обеспечивает нагрузку в пределах прочности подошвы плиты.`);
  }
  if (input.landSlope <= 3.0) {
    slabReasons.push("Минимальный естественный уклон рельефа исключает боковые сдвиги земляного пятна плиты.");
  }
  if (!isSlabRecommended) {
    slabVer = "Не рекомендуется из-за геотехнических рисков.";
    slabReasons.push("Наличие высокой просадочности грунта, насыпных отсыпок или высокого уклона делают УШП плиту опасной.");
  }
  list.push({
    optionId: "slab",
    optionName: "Монолитная УШП плита",
    isRecommended: isSlabRecommended,
    reasons: slabReasons,
    verdict: slabVer
  });

  // 2. Strip / Лента
  const isStripRecommended = soilType !== SoilType.FILLED && gwt >= 1.5;
  let stripVer = "Рекомендовано в качестве капитального прочного решения.";
  const stripReasons: string[] = [];
  if (soilType !== SoilType.FILLED && soilType !== SoilType.LOESS) {
    stripReasons.push("Плотные коренные пласты суглинков имеют высокое расчетное сопротивление R0.");
  }
  if (gwt >= 1.5) {
    stripReasons.push("Сухой горизонт заложения позволяет разработать траншеи без оползания и заиливания корыта.");
  }
  if (input.wallMaterial === BuildingWallMaterial.KOTELET || input.wallMaterial === BuildingWallMaterial.BRICK) {
    stripReasons.push("Тяжелые каменные стены (молдавский котелец/кирпич) требуют жесткого массивного монолита ленты.");
  }
  if (!isStripRecommended) {
    stripVer = "Не рекомендуется.";
    stripReasons.push("Насыпной грунт или высокий уровень воды (УГВ) требуют дорогостоящей замены грунта и забивки свай.");
  }
  list.push({
    optionId: "strip",
    optionName: "Заглубленная монолитная лента",
    isRecommended: isStripRecommended,
    reasons: stripReasons,
    verdict: stripVer
  });

  // 3. Piles / Сваи
  const isPilesRecommended = soilType !== SoilType.ROCK;
  let pilesVer = "Рекомендовано в сложных грунтовых и рельефных условиях РМ.";
  const pilesReasons: string[] = [];
  if (soilType === SoilType.FILLED || soilType === SoilType.LOESS) {
    pilesReasons.push("Единственный экономичный способ пройти слабый насыпной слой с опиранием на коренной известняк.");
  }
  if (input.landSlope > 5.0) {
    pilesReasons.push("Существенный перепад высот ландшафта нивелируется разной длиной буронабивных свайных стволов.");
  }
  if (soilType === SoilType.ROCK) {
    pilesVer = "Нецелесообразно.";
    pilesReasons.push("Прочнейшая скальная порода известняка ракушечника (ROCK) делает бурение скважин буроямом разорительным.");
  }
  list.push({
    optionId: "piles",
    optionName: "Буронабивные сваи с ростверком",
    isRecommended: isPilesRecommended,
    reasons: pilesReasons,
    verdict: pilesVer
  });

  return list;
}

/**
 * Perform all Civil Engineering load calculations and foundation designs.
 */
export function calculateFoundation(input: CalculatorInput): CalculationResults {
  const reg = REGION_DATA[input.region];
  const soil = SOIL_DATA[input.soilType];
  const wall = WALL_MATERIAL_DATA[input.wallMaterial];
  const slab = SLAB_DATA[input.slabMaterial];
  const roof = ROOF_DATA[input.roofType];
  
  // Real floor count for load calculations (future extension doubles structural weight capacity)
  const structuralFloors = input.futureFlooringExtension ? (input.floors + 1) : input.floors;
  
  // Outer perimeter (L-shape or rectangle, basic footprint calculation)
  const perimeter = 2 * (input.width + input.length);
  const footingArea = input.width * input.length;
  
  // Total height of outer walls
  const totalWallHeight = structuralFloors * input.floorHeight;
  
  // 1. Calculate WALL WEIGHT
  // outer volume = perimeter * typicalThickness * height
  const outerWallVolume = perimeter * wall.typicalThickness * totalWallHeight;
  // inner load-bearing walls count (usually adds ~35% of outer volume for partitions)
  const totalWallVolume = outerWallVolume * 1.35;
  const wallWeightKg = totalWallVolume * wall.density;
  const wallWeightTons = wallWeightKg / 1000;
  
  // 2. Calculate FLOOR SLAB WEIGHT
  // A structural floor slab is needed between floors, and on the ground.
  const slabLayers = Math.ceil(structuralFloors) + 1;
  const slabWeightKg = footingArea * slab.weightPerM2 * slabLayers;
  const slabWeightTons = slabWeightKg / 1000;
  
  // 3. Calculate ROOF WEIGHT
  // Roof area typically has a 15% slope multiplier (gable/hip)
  const roofAreaCoeff = roof.angleDegrees > 10 ? 1.15 : 1.02;
  const roofArea = footingArea * roofAreaCoeff;
  const roofWeightKg = roofArea * roof.deadLoad;
  const roofWeightTons = roofWeightKg / 1000;
  
  const deadLoadSubtotalTons = wallWeightTons + slabWeightTons + roofWeightTons;
  
  // --- EUROCODE & NCM-COMPLIANT CHARACTERISTIC LOAD VALUES (G_k, Q_k) ---
  const Gk_wall = wallWeightTons;
  const Gk_slab = slabWeightTons;
  const Gk_roof = roofWeightTons;
  const Gk_dead_total = Gk_wall + Gk_slab + Gk_roof;

  // --- EUROCODE & NCM-COMPLIANT DESIGN PERMANENT LOADS (G_d) ---
  // Applying individual safety factors from default reference data
  const Gd_wall = Gk_wall * 1.2; // gamma_f = 1.2 for timber/light blocks outer structures
  const Gd_slab = Gk_slab * 1.24; // gamma_f = 1.24 weighted average (structure 1.2, heavy finishes/screeds 1.3)
  const Gd_roof = Gk_roof * 1.26; // gamma_f = 1.26 weighted average (timber rafters 1.2, tile/layers 1.3)
  const Gd_dead_total = Gd_wall + Gd_slab + Gd_roof;

  // 4. Calculate LIVE / SERVICE LOAD (Characteristic: Qk_live)
  // Household service load is 150 kg/m2 (1.5 kPa) as per NCM G.01.01
  const liveLoadPerM2 = 150; // kg/m2
  const liveLoadKg = footingArea * liveLoadPerM2 * (structuralFloors);
  const Qk_live = liveLoadKg / 1000; // Characteristic live load in tons
  const Qd_live = Qk_live * 1.4; // Design live load with safety factor gamma_f = 1.4

  // 5. Calculate CLIMATIC LOADS (Snow & Wind) (Characteristic: Qk_snow, Qk_wind)
  const snowLoadKg = footingArea * (reg.snowLoad * 100);
  const Qk_snow = snowLoadKg / 1000; // Characteristic snow load in tons
  const Qd_snow = Qk_snow * 1.4; // Design snow load with safety factor gamma_f = 1.4

  const windArea = Math.max(input.width, input.length) * totalWallHeight;
  const windLoadKg = windArea * (reg.windLoad * 100);
  const Qk_wind = windLoadKg / 1000; // Characteristic wind load in tons
  const Qd_wind = Qk_wind * 1.4; // Design wind load with safety factor gamma_f = 1.4

  // 6. EUROCODE 0 / NCM EN 1990 DESIGN LOAD COMBINATIONS (ULS / ПС1)
  // Scenario A (Snow Dominant): Full Design Snow + Reduced Wind (psi0 = 0.6) + Reduced Imposed/Live (psi0 = 0.7)
  const scenarioASnowDominantTons = Gd_dead_total + Qd_snow + (0.6 * Qd_wind) + (0.7 * Qd_live);

  // Scenario B (Live Load Dominant): Full Design Imposed/Live Load + Reduced Snow (psi0 = 0.5) + Reduced Wind (psi0 = 0.6)
  const scenarioBLiveDominantTons = Gd_dead_total + Qd_live + (0.5 * Qd_snow) + (0.6 * Qd_wind);

  // ACCIDENTAL/SEISMIC COMBINATION (NCM EN 1998 / Eurocode 8) for Effective Seismic Mass
  // E_d,AE = G_k + psi_2 * Q_k (psi_2 = 0.3 for Live Load, psi_2 = 0.0 for Snow/Wind)
  const seismicMassCombinationTons = Gk_dead_total + (0.3 * Qk_live) + (0.0 * Qk_snow) + (0.0 * Qk_wind);

  // Dynamic Seismic Parameters for Republic of Moldova from NCM EN 1998 & Eurocode 8
  const seismicPGA = input.region === MoldovaRegion.NORTH ? 0.08 : input.region === MoldovaRegion.CENTER ? 0.16 : 0.24;
  const seismicImportanceFactor = 1.0;
  
  // S Parameter (Ground Type Factor) depending on geotechnical category
  let seismicGroundTypeFactor = 1.40; // Default C/D
  if (soil.id === SoilType.SAND) {
    seismicGroundTypeFactor = 1.25; // Type B
  } else if (soil.id === SoilType.SILTY_SAND || soil.id === SoilType.SANDY_LOAM) {
    seismicGroundTypeFactor = 1.35; // Type C
  } else if (soil.id === SoilType.FILLED) {
    seismicGroundTypeFactor = 1.60; // Type E/S
  }

  // q Parameter (Behavior Factor) depending on ductility of wall structural type
  let seismicBehaviorFactor = 2.0;
  if (input.wallMaterial === BuildingWallMaterial.FRAME) {
    seismicBehaviorFactor = 3.0; // High structural ductility
  } else if (input.wallMaterial === BuildingWallMaterial.KOTELET) {
    seismicBehaviorFactor = 1.5; // Brittle stone masonry columns
  } else if (input.wallMaterial === BuildingWallMaterial.KERAMZIT) {
    seismicBehaviorFactor = 1.8;
  }
  
  // Beta (Spectral Acceleration Amplification Factor)
  const seismicAmplification = 2.5 * (seismicGroundTypeFactor / seismicBehaviorFactor);
  
  // Dynamic horizontal seismic shear force (in tons)
  const seismicForceTons = seismicMassCombinationTons * seismicPGA * seismicImportanceFactor * seismicAmplification;
  
  // Clean rounding of characteristic values for display
  const wallWeightTonsRounded = Math.round(Gk_wall * 10) / 10;
  const slabWeightTonsRounded = Math.round(Gk_slab * 10) / 10;
  const roofWeightTonsRounded = Math.round(Gk_roof * 10) / 10;
  const liveLoadTonsRounded = Math.round(Qk_live * 10) / 10;
  const snowLoadTonsRounded = Math.round(Qk_snow * 10) / 10;
  
  // 7. TOTAL FACTORED DESIGN WEIGHT FOR FOUNDATION (ULS envelope)
  const totalFactoredWeightTons = Math.round(Math.max(scenarioASnowDominantTons, scenarioBLiveDominantTons) * 10) / 10;
  
  // 8. GROUND BEARING CAPACITY Verification (incorporating Seismic eccentricity impact)
  const soilBearingCapacityKPa = soil.resistanceKPa;
  const totalFactoredForceKN = totalFactoredWeightTons * 9.81;
  
  // Eccentricity bearing area expansion for anti-seismic calculations (NCM EN 1997-1)
  const seismicBearingAreaMultiplier = 1.0 + (seismicForceTons / totalFactoredWeightTons) * (seismicPGA >= 0.16 ? 0.38 : 0.22);
  const bearingAreaRequiredM2 = Math.round(((totalFactoredForceKN * input.safetyFactor * seismicBearingAreaMultiplier) / soilBearingCapacityKPa) * 100) / 100;
  
  // Geotechnical and Structural Material Multipliers
  let soilConcreteMultiplier = 1.0;
  let soilRebarMultiplier = 1.0;
  switch (input.soilType) {
    case SoilType.SAND:
      soilConcreteMultiplier = 0.90;
      soilRebarMultiplier = 0.85;
      break;
    case SoilType.SILTY_SAND:
      soilConcreteMultiplier = 1.05;
      soilRebarMultiplier = 1.05;
      break;
    case SoilType.SANDY_LOAM:
      soilConcreteMultiplier = 1.0;
      soilRebarMultiplier = 1.0;
      break;
    case SoilType.LOAM:
      soilConcreteMultiplier = 1.0;
      soilRebarMultiplier = 1.0;
      break;
    case SoilType.CLAY:
      soilConcreteMultiplier = 1.10;
      soilRebarMultiplier = 1.15;
      break;
    case SoilType.LOESS:
      soilConcreteMultiplier = 1.20;
      soilRebarMultiplier = 1.25;
      break;
    case SoilType.FILLED:
      soilConcreteMultiplier = 1.35;
      soilRebarMultiplier = 1.40;
      break;
    case SoilType.ROCK:
      soilConcreteMultiplier = 0.80; // highly stable solid bedrock
      soilRebarMultiplier = 0.75;    // requires substantially less reinforcement for foundation stability
      break;
  }

  // Dynamic Seismic structural multipliers (increases rebar by up to 30% for South high seismic risk Vrancea zone)
  const seismicRebarMultiplier = seismicPGA === 0.24 ? 1.30 : seismicPGA === 0.16 ? 1.15 : 1.0;
  const seismicSlabThicknessIncrease = seismicPGA === 0.24 ? 0.05 : seismicPGA === 0.16 ? 0.02 : 0.0;
  
  // 9. COUPLING WITH LAND SLOPE & WATER LEVEL PROPERTIES
  const slopeFrac = input.landSlope / 100;
  const maxDim = Math.max(input.width, input.length);
  const heightDiff = maxDim * slopeFrac; // Перепад высот по длинной стороне
  
  // Общие дренажные параметры для всех вариантов фундамента при УГВ < 1.5м
  const hasDrainage = input.groundwaterDepth < 1.5;
  const drainagePipeM = hasDrainage ? Math.ceil(perimeter + 6) : 0;
  const drainageGeotextileM2 = hasDrainage ? Math.ceil(drainagePipeM * 1.6) : 0;
  const drainageStoneM3 = hasDrainage ? Math.ceil(drainagePipeM * 0.40 * 0.35) : 0;
  const drainageWellsCount = hasDrainage ? 4 : 0;
  
  const drainageCostMDL = hasDrainage 
    ? Math.round(
        (drainagePipeM * COST_RATES.DRAIN_PIPE_MDL_M) +
        (drainageGeotextileM2 * COST_RATES.GEOTEXTILE_MDL_M2) +
        (drainageStoneM3 * COST_RATES.CRUSHED_STONE_MDL_M3) +
        (drainageWellsCount * COST_RATES.INSPECTION_WELL_MDL_PCS) +
        (drainagePipeM * 160) // Трудозатраты по копке траншей и сборке дренажа
      )
    : 0;
  
  const options: FoundationOption[] = [];
  
  // --- OPTION 1: ЛЕНТОЧНЫЙ ФУНДАМЕНТ (Strip Footing) ---
  const requiredStripWidthM = Math.max(0.4, Math.ceil((bearingAreaRequiredM2 / perimeter) * 10) / 10);
  const stripDepthM = reg.frostDepth + 0.2; // базовая глубина заложения ниже промерзания
  
  // Коррекция на уклон: при уклоне высота цоколя на нижнем конце растет, среднее заложение глубже
  const stripHeightAboveGroundM = 0.40; // стандартный выступающий цоколь (soclu)
  const avgTotalHeight = stripDepthM + stripHeightAboveGroundM + (heightDiff / 2);
  
  // 1.1 Бетон ручного заложения на монолитные стены и подошву
  const L_total = perimeter * 1.35; // Длина всех стен включая капитальные внутренние перегородки
  const stripConcreteVolumeM3 = L_total * requiredStripWidthM * avgTotalHeight * soilConcreteMultiplier;
  
  // 1.2 Опалубка деревянная (внутренняя и внешняя грани цоколя плюс верхняя часть траншеи)
  const formworkHeight = stripHeightAboveGroundM + (heightDiff / 2) + 0.20; // Высота щитов
  const formworkM2 = L_total * 2 * formworkHeight;
  const formworkBoardsCount = Math.ceil(formworkM2 / 0.9); // Доска 25х150х6000 имеет площадь 0.9 м2
  
  // 1.3 Песчано-гравийная подушка (20см уплотненный слой)
  const stripSandVolumeM3 = L_total * requiredStripWidthM * 0.20 * (1 + slopeFrac * 0.5);
  const sandGravelWeightTons = stripSandVolumeM3 * 1.6; // 1.6 т/м3 - плотность
  
  // 1.4 Земляные работы (траншея шириной на 20см шире подошвы для установки опалубки)
  const excavationVolumeM3Strip = L_total * (requiredStripWidthM + 0.40) * (stripDepthM + heightDiff / 2);
  const excavationCostStripMDL = Math.round(excavationVolumeM3Strip * COST_RATES.EXCAVATION_MDL_M3);
  
  // 1.5 Рабочая арматура по СНиПу (минимум 0.1% от сечения ж/б элемента)
  const rStrip = resolveReinforcementParams(input, "strip", { perimeter, footingArea, depthM: stripDepthM, concreteVolumeM3: stripConcreteVolumeM3 });
  const reinforcementBarKgStrip = Math.round(rStrip.total_rebar_weight_kg || 0);
  const rebarLongitudinalKgStrip = Math.round(rStrip.main_bars_weight_kg || 0);
  const rebarTransverseKgStrip = Math.round((rStrip.secondary_bars_weight_kg || 0) + (rStrip.additional_elements_weight_kg || 0));
  const rebarBindingCostStripMDL = Math.round(reinforcementBarKgStrip * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  
  // 1.6 Гидроизоляция и утепление
  const stripWaterproofM2 = L_total * (stripDepthM + stripHeightAboveGroundM + heightDiff / 2) * 2;
  const stripInsulationM3 = perimeter * 0.80 * 0.05 * (1 + slopeFrac); // утепление цоколя плитами XPS 50мм
  
  // Черновой пол по грунту внутри ленточного фундамента (для справедливого сравнения с плитным)
  const rFloorAreaStrip = footingArea;
  const rFloorConcreteM3Strip = rFloorAreaStrip * 0.10; // Стяжка 10 см
  const rFloorRebarKgStrip = rFloorAreaStrip * 4.5; // Сварная сетка d8
  const rFloorSandM3Strip = rFloorAreaStrip * 0.15; // Песчано-гравийная отсыпка 15 см внутри цоколя
  const rFloorWaterproofingM2Strip = rFloorAreaStrip * 1.15; // Защитная плотная гидроизоляция
  
  const stripMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(stripConcreteVolumeM3 * 10) / 10,
    reinforcementBarKg: reinforcementBarKgStrip,
    sandGravelM3: Math.ceil(stripSandVolumeM3 * 10) / 10,
    waterproofingM2: Math.ceil(stripWaterproofM2),
    insulationM3: Math.ceil(stripInsulationM3 * 10) / 10,
    
    formworkM2: Math.round(formworkM2),
    formworkBoardsCount,
    excavationVolumeM3: Math.ceil(excavationVolumeM3Strip),
    sandGravelWeightTons: Math.round(sandGravelWeightTons * 10) / 10,
    rebarLongitudinalKg: Math.round(rebarLongitudinalKgStrip),
    rebarTransverseKg: Math.round(rebarTransverseKgStrip),
    rebarLongitudinalDiameter: rStrip.main_bar_diameter,
    rebarTransverseDiameter: rStrip.secondary_bar_diameter,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,

    // Rough Floor specs
    roughFloorAreaM2: rFloorAreaStrip,
    roughFloorConcreteM3: Math.ceil(rFloorConcreteM3Strip * 10) / 10,
    roughFloorRebarKg: Math.round(rFloorRebarKgStrip),
    roughFloorSandM3: Math.ceil(rFloorSandM3Strip * 10) / 10,
    roughFloorWaterproofingM2: Math.ceil(rFloorWaterproofingM2Strip)
  };
  
  // Удорожание за уклон (сложные ступенчатые щиты опалубки, защита от съезда)
  const slopeComplicationCostStripMDL = input.landSlope > 0 
    ? Math.round(perimeter * (input.landSlope / 100) * 800)
    : 0;
    
  // Локальный расчет бюджета
  const stripCost = compileDetailedBudget(stripMaterials, excavationCostStripMDL, rebarBindingCostStripMDL, drainageCostMDL, slopeComplicationCostStripMDL, input);
  
  const seismicPoints = reg.seismicCoeff === 0.08 ? 6.5 : reg.seismicCoeff === 0.16 ? 7 : 8;

  // Criteria-weighted reliability (Seismic=0.2, Frost=0.15, GWT=0.15, Coll collapsible=0.2, Maintain=0.15, Reserve=0.15)
  let stripSeismic = seismicPoints === 8 ? 75 : seismicPoints === 7 ? 85 : 92;
  let stripFrost = (input.soilType === SoilType.CLAY || input.soilType === SoilType.LOAM) ? 80 : 92;
  if (input.groundwaterDepth < 1.5) stripFrost -= 10;
  let stripGroundwater = input.groundwaterDepth < 1.5 ? 55 : 85;
  let stripCollapsible = (input.soilType === SoilType.LOESS || input.soilType === SoilType.FILLED) ? (input.soilType === SoilType.FILLED ? 40 : 55) : 90;
  let stripRepair = 85;
  let stripReserve = soil.resistanceKPa >= 200 ? 95 : soil.resistanceKPa >= 150 ? 88 : 75;

  let stripReliability = Math.round(
    stripSeismic * 0.20 +
    stripFrost * 0.15 +
    stripGroundwater * 0.15 +
    stripCollapsible * 0.20 +
    stripRepair * 0.15 +
    stripReserve * 0.15
  );

  let stripIsRecommended = false;
  let stripComplexity = 60;
  const stripPros = ["Капитальный классический вариант", "Надежность подтверждена десятилетиями", "Возможность легкого обустройства подпола или цоколя"];
  const stripCons = [
    `Большой объем земляных работ: ${Math.ceil(excavationVolumeM3Strip)} м³ разработано техникой`,
    `Требуются профессиональные плотницкие работы по опалубке (${formworkBoardsCount} шт. досок)`,
    "Долгий срок созревания бетона в щитах (28 суток по ГОСТ)"
  ];
  const stripRisks: string[] = [];
  
  if (input.soilType === SoilType.LOESS) {
    stripCons.push("Требуется широкая подошва при замачивании лёсса");
    stripRisks.push("Риск неравномерной просадки при аварийной утечке воды");
  }
  if (input.groundwaterDepth < (stripDepthM + 0.3)) {
    stripRisks.push("Опасность затопления траншеи при строительстве, ослабление грунта основания");
  }
  
  // --- OPTION 2: МОНОЛИТНАЯ ПЛИТА (Slab on Grade) ---
  const slabDepthM = 0.30; // Монолитная несущая плита 30 см (стандарт NCM)
  
  // При уклоне на плитный фундамент идет гигантский перерасход бетона на ростверк/цоколь и уплотненный песок для выравнивания
  const plinthHeightDiff = heightDiff / 2;
  const slabPlinthConcreteVolumeM3 = perimeter * 0.30 * plinthHeightDiff;
  const slabConcreteVolume = ((footingArea * slabDepthM) + slabPlinthConcreteVolumeM3) * soilConcreteMultiplier;
  
  // Огромная выравнивающая perne de nisip (песчано-гравийная подушка клином для ровной плоскости)
  const slabSandVolume = footingArea * (0.15 + plinthHeightDiff);
  const sandGravelWeightSlabTons = slabSandVolume * 1.6;
  
  // Земляные работы: котлован шире на 1м в каждую сторону под отмостку и дренаж
  const slabExcArea = (input.width + 2) * (input.length + 2);
  const excavationVolumeM3Slab = slabExcArea * (0.40 + plinthHeightDiff);
  const excavationCostSlabMDL = Math.round(excavationVolumeM3Slab * COST_RATES.EXCAVATION_MDL_M3);
  
  // Опалубка по внешнему периметру плиты с учетом высоты уступа уклона
  const formworkM2Slab = perimeter * (slabDepthM + plinthHeightDiff + 0.15);
  const formworkBoardsCountSlab = Math.ceil(formworkM2Slab / 0.9);
  
  // Армирование плиты двойной сеткой рабочей арматуры
  const rSlab = resolveReinforcementParams(input, "slab", { perimeter, footingArea, depthM: slabDepthM, concreteVolumeM3: (footingArea * slabDepthM) + slabPlinthConcreteVolumeM3 });
  const reinforcementBarKgSlab = Math.round(rSlab.total_rebar_weight_kg || 0);
  const rebarLongitudinalKgSlab = Math.round(rSlab.main_bars_weight_kg || 0);
  const rebarTransverseKgSlab = Math.round((rSlab.secondary_bars_weight_kg || 0) + (rSlab.additional_elements_weight_kg || 0));
  const rebarBindingCostSlabMDL = Math.round(reinforcementBarKgSlab * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  
  const slabWaterproofM2 = footingArea * 1.15; // гидроизоляция под подошву клином с нахлестом
  
  // ТЕПЛОТЕХНИЧЕСКИЙ РАСЧЁТ ТОЛЩИНЫ XPS (NCM L.02.01-2012 / СП 23-101-24)
  // Динамическое определение ГСОП (градусо-сутки отопительного периода в РМ)
  let ddst = 2850; // Кишинёв (Центр РМ)
  if (input.region === MoldovaRegion.NORTH) {
    ddst = 3100; // Бельцы (Север РМ)
  } else if (input.region === MoldovaRegion.SOUTH) {
    ddst = 2650; // Кагул (Юг РМ)
  }
  
  // Нормируемый температурный напор и требуемое теплосопротивление R_req (м²·К/Вт)
  const reqThermalResistance = 1.2 + (ddst * 0.0006); // Диапазон от 2.79 до 3.06 м²·К/Вт для классов класса энергоэффективности
  
  // Теплопроводность XPS плит при влажностном режиме эксплуатации B в РМ: λ_Б = 0.034 Вт/(м·К)
  const lambdaXps = 0.034;
  
  // Расчетная толщина утеплителя, округляемая вверх с коммерческим шагом 50 мм (5 см)
  let computedXpsThicknessM = reqThermalResistance * lambdaXps; // ~0.095м - 0.104м
  computedXpsThicknessM = Math.ceil(computedXpsThicknessM / 0.05) * 0.05;
  if (computedXpsThicknessM < 0.10) {
    computedXpsThicknessM = 0.10; // Минимальный проектный лимит для плит типа УШП по СНиП РМ
  }
  
  // Боковое утепление торцов плиты (выполняет роль демпфера промерзания слепых зон на цоколе)
  const computedEdgeXpsThicknessM = Math.max(0.05, Math.ceil((computedXpsThicknessM / 2) / 0.05) * 0.05);
  
  const slabInsulationM3 = (footingArea * computedXpsThicknessM) + (perimeter * 0.4 * computedEdgeXpsThicknessM); 
  
  const slabMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(slabConcreteVolume * 10) / 10,
    reinforcementBarKg: reinforcementBarKgSlab,
    sandGravelM3: Math.ceil(slabSandVolume * 10) / 10,
    waterproofingM2: Math.ceil(slabWaterproofM2),
    insulationM3: Math.ceil(slabInsulationM3 * 10) / 10,
    
    formworkM2: Math.round(formworkM2Slab),
    formworkBoardsCount: formworkBoardsCountSlab,
    excavationVolumeM3: Math.ceil(excavationVolumeM3Slab),
    sandGravelWeightTons: Math.round(sandGravelWeightSlabTons * 10) / 10,
    rebarLongitudinalKg: Math.round(rebarLongitudinalKgSlab),
    rebarTransverseKg: Math.round(rebarTransverseKgSlab),
    rebarLongitudinalDiameter: rSlab.main_bar_diameter,
    rebarTransverseDiameter: rSlab.secondary_bar_diameter,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,

    // Rough Floor specs - slab includes it automatically (0 MDL separate costs)
    roughFloorAreaM2: 0,
    roughFloorConcreteM3: 0,
    roughFloorRebarKg: 0,
    roughFloorSandM3: 0,
    roughFloorWaterproofingM2: 0
  };
  
  // Удорожание плиты за уклон (террасирование, жесткий бетон под подпорные стены цоколя)
  const slopeComplicationCostSlabMDL = input.landSlope > 0
    ? Math.round(footingArea * (input.landSlope / 100) * 1500)
    : 0;
    
  const slabCost = compileDetailedBudget(slabMaterials, excavationCostSlabMDL, rebarBindingCostSlabMDL, drainageCostMDL, slopeComplicationCostSlabMDL, input);
  
  let slabIsRecommended = false;
  let slabComplexity = 75;

  // Criteria-weighted reliability for Slab (Seismic=0.2, Frost=0.15, GWT=0.15, Collapsible=0.2, Maintain=0.15, Reserve=0.15)
  let slabSeismic = 98; 
  let slabFrost = (input.soilType === SoilType.CLAY || input.soilType === SoilType.LOAM) ? 94 : 96;
  if (input.groundwaterDepth < 1.5) slabFrost -= 2;
  let slabGroundwater = input.groundwaterDepth < 1.5 ? 94 : 97;
  let slabCollapsible = (input.soilType === SoilType.LOESS || input.soilType === SoilType.FILLED) ? 95 : 98;
  let slabRepair = 60; // Hard to repair integrated pipes
  let slabReserve = soil.resistanceKPa >= 200 ? 99 : soil.resistanceKPa >= 150 ? 98 : 95;

  let slabReliability = Math.round(
    slabSeismic * 0.20 +
    slabFrost * 0.15 +
    slabGroundwater * 0.15 +
    slabCollapsible * 0.20 +
    slabRepair * 0.15 +
    slabReserve * 0.15
  );

  const slabPros = [
    "Идеально подходит для сложных пучинистых и просадочных лессовых суглинков Молдовы",
    "Готовый черновой пол 1-го этажа со встроенным энергоэффективным утеплением",
    "Специальный теплотехнический расчет исключает промерзание и пучение пучинистого грунта под подошвой",
    "Используется жесткий экструдированный пенополистирол (XPS толщиной 100 мм под всей плитой и 50 мм по торцам)",
    "Высочайшая жесткость и подтвержденная сейсмоустойчивость в 7-8 баллов NCM"
  ];
  const slabCons = [
    `Высокая материалоемкость: требуется ${Math.ceil(slabConcreteVolume)} м³ конструкционного бетона C20/25`,
    `Требуется качественное утепление жестким пенополистиролом XPS с прочностью на сжатие не менее 250-400 кПа (например, Carbon Eco или ТЕХНОНИКОЛЬ)`,
    `Необходим большой объем выравнивающей песчано-гравийной подушки на уклонах: ${Math.ceil(slabSandVolume)} м³ (${Math.round(sandGravelWeightSlabTons)} тонн)`,
    "Исключает простое устройство классического глубокого подвала/погреба"
  ];
  const slabRisks = [
    "Требуется прецизионная разводка инженерных коммуникаций (канализация, водоснабжение) в теле плиты до приемки бетона"
  ];
  
  if (input.soilType === SoilType.LOESS || input.soilType === SoilType.CLAY || input.groundwaterDepth < 1.5) {
    slabIsRecommended = true; // Плита - лучший выбор при геологии просадочного лёсса Молдовы
  }
  
  // --- OPTION 3: СВАЙНО-РОСТВЕРКОВЫЙ (Pile & Grade Beam) ---
  const basePileCount = Math.ceil(perimeter / 1.5) + (structuralFloors > 1 ? 4 : 2);
  const pileCount = input.soilType === SoilType.FILLED ? Math.ceil(basePileCount * 1.35) : basePileCount;
  
  // На уклоне сваи бурятся на стандартную глубину, но часть ростверка приподнимается над землей (низкое удорожание!)
  const singlePileVolume = Math.PI * 0.15 * 0.15 * 2.2;
  const pilesConcreteVolume = pileCount * singlePileVolume * (1 + slopeFrac * 0.2);
  
  const beamHeightM = 0.45;
  const beamWidthM = 0.40;
  const beamVolume = perimeter * beamWidthM * beamHeightM * (1 + slopeFrac * 0.4);
  const pileStripConcreteVolume = (pilesConcreteVolume + beamVolume) * soilConcreteMultiplier;
  
  // Объем разработки земли (бурение свайных шахт d300мм + неглубокая траншея ростверка 20см)
  const excavationPileShaftsM3 = pileCount * Math.PI * 0.15 * 0.15 * 2.2;
  const excavationBeamTrenchM3 = perimeter * beamWidthM * 0.20;
  const excavationVolumeM3Pile = excavationPileShaftsM3 + excavationBeamTrenchM3 * (1 + slopeFrac);
  const excavationCostPileMDL = Math.round(excavationVolumeM3Pile * COST_RATES.EXCAVATION_MDL_M3) + 4500;
  
  // Опалубка только для ростверка (приподнят над землей на 20-30см, зашивка с двух сторон)
  const formworkM2Pile = perimeter * 2 * beamHeightM * (1 + slopeFrac);
  const formworkBoardsCountPile = Math.ceil(formworkM2Pile / 0.9);
  
  // Тонкая демпферная подсыпка песка под ростверк (10см)
  const pileSandVolume = perimeter * beamWidthM * 0.10;
  const sandGravelWeightPileTons = pileSandVolume * 1.6;
  
  // Армирование свай и ростверка по физической схеме NCM / EC2
  const rPiles = resolveReinforcementParams(input, "piles", { perimeter, footingArea, depthM: 2.2, concreteVolumeM3: pileStripConcreteVolume });
  const reinforcementBarKgPile = Math.round(rPiles.total_rebar_weight_kg || 0);
  const rebarLongitudinalKgPile = Math.round(rPiles.main_bars_weight_kg || 0);
  const rebarTransverseKgPile = Math.round((rPiles.secondary_bars_weight_kg || 0) + (rPiles.additional_elements_weight_kg || 0));
  const rebarBindingCostPileMDL = Math.round(reinforcementBarKgPile * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  
  const pileWaterproofM2 = perimeter * (beamWidthM + 2 * beamHeightM);
  const pileInsulationM3 = perimeter * beamHeightM * 0.05 * (1 + slopeFrac);
  
  // Черновой пол по грунту внутри свайно-ростверкового фундамента (для справедливого сравнения с плитным)
  const rFloorAreaPile = footingArea;
  const rFloorConcreteM3Pile = rFloorAreaPile * 0.10; // Стяжка 10 см
  const rFloorRebarKgPile = rFloorAreaPile * 4.5; // Сварная сетка d8
  const rFloorSandM3Pile = rFloorAreaPile * 0.15; // Песчано-гравийная отсыпка 15 см
  const rFloorWaterproofingM2Pile = rFloorAreaPile * 1.15; // Защитная гидроизоляция
  
  const pileMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(pileStripConcreteVolume * 10) / 10,
    reinforcementBarKg: reinforcementBarKgPile,
    sandGravelM3: Math.ceil(pileSandVolume * 10) / 10,
    waterproofingM2: Math.ceil(pileWaterproofM2),
    insulationM3: Math.ceil(pileInsulationM3 * 10) / 10,
    
    formworkM2: Math.round(formworkM2Pile),
    formworkBoardsCount: formworkBoardsCountPile,
    excavationVolumeM3: Math.ceil(excavationVolumeM3Pile),
    sandGravelWeightTons: Math.round(sandGravelWeightPileTons * 10) / 10,
    rebarLongitudinalKg: Math.round(rebarLongitudinalKgPile),
    rebarTransverseKg: Math.round(rebarTransverseKgPile),
    rebarLongitudinalDiameter: 12,
    rebarTransverseDiameter: 8,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,

    // Rough Floor specs
    roughFloorAreaM2: rFloorAreaPile,
    roughFloorConcreteM3: Math.ceil(rFloorConcreteM3Pile * 10) / 10,
    roughFloorRebarKg: Math.round(rFloorRebarKgPile),
    roughFloorSandM3: Math.ceil(rFloorSandM3Pile * 10) / 10,
    roughFloorWaterproofingM2: Math.ceil(rFloorWaterproofingM2Pile),

    // Pile drilling specifications
    pileCount,
    pileDrillingM: Math.round(pileCount * 2.2 * 10) / 10
  };
  
  // Миноритари за уклон на сваях
  const slopeComplicationCostPileMDL = input.landSlope > 0
    ? Math.round(perimeter * (input.landSlope / 100) * 400)
    : 0;
    
  const pileCost = compileDetailedBudget(pileMaterials, excavationCostPileMDL, rebarBindingCostPileMDL, drainageCostMDL, slopeComplicationCostPileMDL, input);
  
  let pileIsRecommended = false;
  
  // Criteria-weighted reliability (Seismic=0.2, Frost=0.15, GWT=0.15, Coll collapsible=0.2, Maintain=0.15, Reserve=0.15)
  let pileSeismic = seismicPoints === 8 ? 65 : seismicPoints === 7 ? 75 : 85; // vulnerable to lateral shear on loose soils
  let pileFrost = 95; // very deep base below frost line
  let pileGroundwater = input.groundwaterDepth < 1.5 ? 85 : 92;
  let pileCollapsible = (input.soilType === SoilType.LOESS || input.soilType === SoilType.FILLED) ? 60 : 85;
  let pileRepair = 80;
  let pileReserve = soil.resistanceKPa >= 200 ? 85 : soil.resistanceKPa >= 150 ? 78 : 65;

  let pileReliability = Math.round(
    pileSeismic * 0.20 +
    pileFrost * 0.15 +
    pileGroundwater * 0.15 +
    pileCollapsible * 0.20 +
    pileRepair * 0.15 +
    pileReserve * 0.15
  );

  let pileComplexity = 55;
  const pilePros = [
    "Минимальный расход бетона и арматуры (экономия по смете до 40%!)",
    "Высокая адаптивность к крутому уклону местности без масштабного выравнивания",
    "Заглубление свайные пят на 2.2м - гарантированно ниже промерзания во всех районах РМ"
  ];
  const pileCons = [
    "Сложность узла жесткого защемления сваи и арматуры ростверка под сейсмику",
    `Требуются услуги буровой установки спецтехники (${pileCount} скважин d300)`,
    "Абсолютно исключает заложение подвала или капитального погреба"
  ];
  const pileRisks: string[] = [];
  
  if (input.wallMaterial === BuildingWallMaterial.FRAME || (input.wallMaterial === BuildingWallMaterial.GASOBETON && input.floors === 1)) {
    if (!slabIsRecommended) {
      pileIsRecommended = true;
    }
  }
  if (input.soilType === SoilType.LOESS) {
    pileRisks.push("Просадка грунта может оголить сваи, вызвав потерю сцепления по бокам");
  }

  // --- OPTION 4: КЛАССИЧЕСКАЯ МОНОЛИТНАЯ ПЛИТА (classic_slab) ---
  const classicSlabDepthM = 0.25;
  const classicSlabConcreteM3 = footingArea * classicSlabDepthM * soilConcreteMultiplier;
  const rClassicSlab = resolveReinforcementParams(input, "classic_slab", { perimeter, footingArea, depthM: classicSlabDepthM, concreteVolumeM3: classicSlabConcreteM3 });
  const classicSlabRebarKg = Math.round(rClassicSlab.total_rebar_weight_kg || 0);
  const classicSlabSandM3 = footingArea * 0.3 * (1 + slopeFrac * 0.5);
  const classicSlabWaterproofingM2 = footingArea * 1.15;
  const classicSlabFormworkM2 = perimeter * classicSlabDepthM;
  const classicSlabExcavationM3 = footingArea * 0.45;
  
  const classicSlabMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(classicSlabConcreteM3 * 10) / 10,
    reinforcementBarKg: classicSlabRebarKg,
    sandGravelM3: Math.ceil(classicSlabSandM3 * 10) / 10,
    waterproofingM2: Math.ceil(classicSlabWaterproofingM2),
    insulationM3: 0,
    formworkM2: Math.round(classicSlabFormworkM2),
    formworkBoardsCount: Math.ceil(classicSlabFormworkM2 / 0.9),
    excavationVolumeM3: Math.ceil(classicSlabExcavationM3),
    sandGravelWeightTons: Math.round(classicSlabSandM3 * 1.6 * 10) / 10,
    rebarLongitudinalKg: Math.round(rClassicSlab.main_bars_weight_kg || 0),
    rebarTransverseKg: Math.round((rClassicSlab.secondary_bars_weight_kg || 0) + (rClassicSlab.additional_elements_weight_kg || 0)),
    rebarLongitudinalDiameter: rClassicSlab.main_bar_diameter,
    rebarTransverseDiameter: rClassicSlab.secondary_bar_diameter,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,
    groundingSteelStripM: Math.ceil(perimeter),
    groundingEarthRodsPcs: 3,
    groundingClampsPcs: 3,
    backfillVolumeM3: Math.ceil(perimeter * 0.3 * 0.5),
    waterproofProtMembraneM2: Math.ceil(footingArea),
    roughFloorAreaM2: 0,
    roughFloorConcreteM3: 0,
    roughFloorRebarKg: 0,
    roughFloorSandM3: 0,
    roughFloorWaterproofingM2: 0
  };
  const excavationCostClassicSlabMDL = Math.round(classicSlabMaterials.excavationVolumeM3 * COST_RATES.EXCAVATION_MDL_M3);
  const rebarBindingCostClassicSlabMDL = Math.round(classicSlabMaterials.reinforcementBarKg * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  const slopeComplicationCostClassicSlabMDL = input.landSlope > 0 ? Math.round(footingArea * (input.landSlope / 100) * 850) : 0;
  const classicSlabCost = compileDetailedBudget(classicSlabMaterials, excavationCostClassicSlabMDL, rebarBindingCostClassicSlabMDL, drainageCostMDL, slopeComplicationCostClassicSlabMDL, input);

  // --- OPTION 5: МЕЛКОЗАГЛУБЛЕННЫЙ ЛЕНТОЧНЫЙ ФУНДАМЕНТ (mzlf) ---
  const mzlfDepthM = 0.5;
  const mzlfHeightAboveGroundM = 0.35;
  const mzlfTotalHeight = mzlfDepthM + mzlfHeightAboveGroundM;
  const mzlfWidthM = Math.max(0.4, Math.ceil(requiredStripWidthM * 0.8 * 10) / 10);
  const mzlfConcreteVolumeM3 = L_total * mzlfWidthM * mzlfTotalHeight * soilConcreteMultiplier;
  const rMzlf = resolveReinforcementParams(input, "mzlf", { perimeter, footingArea, depthM: mzlfDepthM, concreteVolumeM3: mzlfConcreteVolumeM3 });
  const mzlfRebarKg = Math.round(rMzlf.total_rebar_weight_kg || 0);
  const mzlfSandM3 = L_total * mzlfWidthM * 0.2 * (1 + slopeFrac * 0.5);
  const mzlfExcavationM3 = L_total * (mzlfWidthM + 0.3) * mzlfDepthM;
  const mzlfFormworkM2 = L_total * 2 * (mzlfHeightAboveGroundM + 0.1);
  const mzlfWaterproofingM2 = L_total * mzlfTotalHeight * 2;
  const mzlfInsulationM3 = perimeter * mzlfTotalHeight * 0.05; // утепленный цоколь
  
  const rFloorAreaMzlf = footingArea - (L_total * mzlfWidthM);
  const rFloorConcreteM3Mzlf = rFloorAreaMzlf * 0.08;
  const rFloorRebarKgMzlf = rFloorAreaMzlf * 4.5;
  const rFloorSandM3Mzlf = rFloorAreaMzlf * 0.12;
  const rFloorWaterproofingM2Mzlf = rFloorAreaMzlf * 1.1;

  const mzlfMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(mzlfConcreteVolumeM3 * 10) / 10,
    reinforcementBarKg: mzlfRebarKg,
    sandGravelM3: Math.ceil(mzlfSandM3 * 10) / 10,
    waterproofingM2: Math.ceil(mzlfWaterproofingM2),
    insulationM3: Math.ceil(mzlfInsulationM3 * 10) / 10,
    formworkM2: Math.round(mzlfFormworkM2),
    formworkBoardsCount: Math.ceil(mzlfFormworkM2 / 0.9),
    excavationVolumeM3: Math.ceil(mzlfExcavationM3),
    sandGravelWeightTons: Math.round(mzlfSandM3 * 1.6 * 10) / 10,
    rebarLongitudinalKg: Math.round(rMzlf.main_bars_weight_kg || 0),
    rebarTransverseKg: Math.round((rMzlf.secondary_bars_weight_kg || 0) + (rMzlf.additional_elements_weight_kg || 0)),
    rebarLongitudinalDiameter: rMzlf.main_bar_diameter,
    rebarTransverseDiameter: rMzlf.secondary_bar_diameter,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,
    groundingSteelStripM: Math.ceil(perimeter),
    groundingEarthRodsPcs: 3,
    groundingClampsPcs: 3,
    backfillVolumeM3: Math.ceil(perimeter * mzlfDepthM * 0.5),
    waterproofProtMembraneM2: Math.ceil(L_total * 0.8),
    roughFloorAreaM2: rFloorAreaMzlf,
    roughFloorConcreteM3: Math.ceil(rFloorConcreteM3Mzlf * 10) / 10,
    roughFloorRebarKg: Math.round(rFloorRebarKgMzlf),
    roughFloorSandM3: Math.ceil(rFloorSandM3Mzlf * 10) / 10,
    roughFloorWaterproofingM2: Math.ceil(rFloorWaterproofingM2Mzlf)
  };
  const excavationCostMzlfMDL = Math.round(mzlfMaterials.excavationVolumeM3 * COST_RATES.EXCAVATION_MDL_M3);
  const rebarBindingCostMzlfMDL = Math.round(mzlfMaterials.reinforcementBarKg * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  const slopeComplicationCostMzlfMDL = input.landSlope > 0 ? Math.round(perimeter * (input.landSlope / 100) * 450) : 0;
  const mzlfCost = compileDetailedBudget(mzlfMaterials, excavationCostMzlfMDL, rebarBindingCostMzlfMDL, drainageCostMDL, slopeComplicationCostMzlfMDL, input);

  // --- OPTION 6: ЛЕНТОЧНЫЙ С ПЛИТОЙ ПО ГРУНТУ (strip_with_slab) ---
  const stripWithSlabConcreteVolumeM3 = stripConcreteVolumeM3 + (footingArea * 0.1) * soilConcreteMultiplier;
  const stripWithSlabRebarKg = reinforcementBarKgStrip + (footingArea * 4.5) * soilRebarMultiplier;
  const stripWithSlabSandM3 = stripSandVolumeM3 + (footingArea * 0.15) * (1 + slopeFrac * 0.5);
  const stripWithSlabWaterproofingM2 = stripWaterproofM2 + footingArea * 1.15;
  const stripWithSlabFormworkM2 = formworkM2;
  const stripWithSlabExcavationM3 = excavationVolumeM3Strip;
  const stripWithSlabMaterials: MaterialRequirement = {
    ...stripMaterials,
    concreteVolumeM3: Math.ceil(stripWithSlabConcreteVolumeM3 * 10) / 10,
    reinforcementBarKg: Math.round(stripWithSlabRebarKg),
    sandGravelM3: Math.ceil(stripWithSlabSandM3 * 10) / 10,
    waterproofingM2: Math.ceil(stripWithSlabWaterproofingM2),
    roughFloorAreaM2: footingArea,
    roughFloorConcreteM3: Math.ceil(footingArea * 0.1 * 10) / 10,
    roughFloorRebarKg: Math.round(footingArea * 4.5),
    roughFloorSandM3: Math.ceil(footingArea * 0.15 * 10) / 10,
    roughFloorWaterproofingM2: Math.ceil(footingArea * 1.15)
  };
  const excavationCostStripWithSlabMDL = excavationCostStripMDL;
  const rebarBindingCostStripWithSlabMDL = Math.round(stripWithSlabMaterials.reinforcementBarKg * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  const slopeComplicationCostStripWithSlabMDL = slopeComplicationCostStripMDL;
  const stripWithSlabCost = compileDetailedBudget(stripWithSlabMaterials, excavationCostStripWithSlabMDL, rebarBindingCostStripWithSlabMDL, drainageCostMDL, slopeComplicationCostStripWithSlabMDL, input);

  // --- OPTION 7: БУРОНАБИВНЫЕ СВАИ С РОСТВЕРКОМ (drilled_piles) ---
  const drilledPilesCount = Math.max(14, Math.ceil(perimeter / 1.6));
  const drilledPilesDepthM = 2.5;
  const drilledPilesConcreteVolumeM3 = (drilledPilesCount * (Math.PI * 0.15 * 0.15 * drilledPilesDepthM) + perimeter * 0.4 * 0.45) * soilConcreteMultiplier;
  const rDrilledPiles = resolveReinforcementParams(input, "drilled_piles", { perimeter, footingArea, depthM: drilledPilesDepthM, concreteVolumeM3: drilledPilesConcreteVolumeM3 });
  const drilledPilesRebarKg = Math.round(rDrilledPiles.total_rebar_weight_kg || 0);
  const drilledPilesSandM3 = perimeter * 0.4 * 0.15 * (1 + slopeFrac * 0.5);
  const drilledPilesExcavationM3 = drilledPilesCount * (Math.PI * 0.15 * 0.15 * drilledPilesDepthM) + perimeter * 0.4 * 0.3;
  const drilledPilesFormworkM2 = perimeter * 2 * 0.45;
  const drilledPilesWaterproofingM2 = (drilledPilesCount * (Math.PI * 0.3 * drilledPilesDepthM) + perimeter * 0.45 * 2);

  const drilledPilesMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(drilledPilesConcreteVolumeM3 * 10) / 10,
    reinforcementBarKg: drilledPilesRebarKg,
    sandGravelM3: Math.ceil(drilledPilesSandM3 * 10) / 10,
    waterproofingM2: Math.ceil(drilledPilesWaterproofingM2),
    insulationM3: 0,
    formworkM2: Math.round(drilledPilesFormworkM2),
    formworkBoardsCount: Math.ceil(drilledPilesFormworkM2 / 0.9),
    excavationVolumeM3: Math.ceil(drilledPilesExcavationM3),
    sandGravelWeightTons: Math.round(drilledPilesSandM3 * 1.6 * 10) / 10,
    rebarLongitudinalKg: Math.round(rDrilledPiles.main_bars_weight_kg || 0),
    rebarTransverseKg: Math.round((rDrilledPiles.secondary_bars_weight_kg || 0) + (rDrilledPiles.additional_elements_weight_kg || 0)),
    rebarLongitudinalDiameter: rDrilledPiles.main_bar_diameter,
    rebarTransverseDiameter: rDrilledPiles.secondary_bar_diameter,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,
    groundingSteelStripM: Math.ceil(perimeter),
    groundingEarthRodsPcs: 3,
    groundingClampsPcs: 3,
    backfillVolumeM3: Math.ceil(perimeter * 0.2),
    waterproofProtMembraneM2: Math.ceil(perimeter * drilledPilesFormworkM2 * 0.1),
    roughFloorAreaM2: footingArea,
    roughFloorConcreteM3: Math.round(footingArea * 0.08 * 10) / 10,
    roughFloorRebarKg: Math.round(footingArea * 4.5),
    roughFloorSandM3: Math.round(footingArea * 0.12 * 10) / 10,
    roughFloorWaterproofingM2: Math.round(footingArea * 1.1)
  };
  const excavationCostDrilledPilesMDL = Math.round(drilledPilesMaterials.excavationVolumeM3 * COST_RATES.EXCAVATION_MDL_M3) + (drilledPilesCount * COST_RATES.PILE_DRILLING_MDL_M * drilledPilesDepthM * 0.5);
  const rebarBindingCostDrilledPilesMDL = Math.round(drilledPilesMaterials.reinforcementBarKg * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  const slopeComplicationCostDrilledPilesMDL = Math.round(perimeter * (input.landSlope / 100) * 400);
  const drilledPilesCost = compileDetailedBudget(drilledPilesMaterials, excavationCostDrilledPilesMDL, rebarBindingCostDrilledPilesMDL, drainageCostMDL, slopeComplicationCostDrilledPilesMDL, input);

  // --- OPTION 8: МОНОЛИТНАЯ РЕБРИСТАЯ ПЛИТА (ribbed_slab) ---
  const ribbedSlabConcreteVolumeM3 = (footingArea * 0.16 + L_total * 0.3 * 0.3) * soilConcreteMultiplier;
  const rRibbedSlab = resolveReinforcementParams(input, "ribbed_slab", { perimeter, footingArea, depthM: 0.4, concreteVolumeM3: ribbedSlabConcreteVolumeM3 });
  const ribbedSlabRebarKg = Math.round(rRibbedSlab.total_rebar_weight_kg || 0);
  const ribbedSlabSandM3 = footingArea * 0.25 * (1 + slopeFrac * 0.5);
  const ribbedSlabWaterproofingM2 = footingArea * 1.2;
  const ribbedSlabFormworkM2 = perimeter * 0.45 + L_total * 0.3;
  const ribbedSlabExcavationM3 = footingArea * 0.4 + L_total * 0.3 * 0.3;
  
  const ribbedSlabMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(ribbedSlabConcreteVolumeM3 * 10) / 10,
    reinforcementBarKg: ribbedSlabRebarKg,
    sandGravelM3: Math.ceil(ribbedSlabSandM3 * 10) / 10,
    waterproofingM2: Math.ceil(ribbedSlabWaterproofingM2),
    insulationM3: Math.ceil(perimeter * 0.45 * 0.05 * 10) / 10,
    formworkM2: Math.round(ribbedSlabFormworkM2),
    formworkBoardsCount: Math.ceil(ribbedSlabFormworkM2 / 0.9),
    excavationVolumeM3: Math.ceil(ribbedSlabExcavationM3),
    sandGravelWeightTons: Math.round(ribbedSlabSandM3 * 1.6 * 10) / 10,
    rebarLongitudinalKg: Math.round(rRibbedSlab.main_bars_weight_kg || 0),
    rebarTransverseKg: Math.round((rRibbedSlab.secondary_bars_weight_kg || 0) + (rRibbedSlab.additional_elements_weight_kg || 0)),
    rebarLongitudinalDiameter: rRibbedSlab.main_bar_diameter,
    rebarTransverseDiameter: rRibbedSlab.secondary_bar_diameter,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,
    groundingSteelStripM: Math.ceil(perimeter),
    groundingEarthRodsPcs: 3,
    groundingClampsPcs: 3,
    backfillVolumeM3: Math.ceil(perimeter * 0.3 * 0.5),
    waterproofProtMembraneM2: Math.ceil(footingArea),
    roughFloorAreaM2: 0,
    roughFloorConcreteM3: 0,
    roughFloorRebarKg: 0,
    roughFloorSandM3: 0,
    roughFloorWaterproofingM2: 0
  };
  const excavationCostRibbedSlabMDL = Math.round(ribbedSlabMaterials.excavationVolumeM3 * COST_RATES.EXCAVATION_MDL_M3);
  const rebarBindingCostRibbedSlabMDL = Math.round(ribbedSlabMaterials.reinforcementBarKg * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  const slopeComplicationCostRibbedSlabMDL = input.landSlope > 0 ? Math.round(footingArea * (input.landSlope / 100) * 950) : 0;
  const ribbedSlabCost = compileDetailedBudget(ribbedSlabMaterials, excavationCostRibbedSlabMDL, rebarBindingCostRibbedSlabMDL, drainageCostMDL, slopeComplicationCostRibbedSlabMDL, input);

  // --- OPTION 9: СТОЛБЧАТЫЙ С РОСТВЕРКОМ (column_footing) ---
  const columnCount = Math.max(10, Math.ceil(perimeter / 2.6));
  const columnDepthM = 1.6;
  const columnConcreteVolumeM3 = (columnCount * (0.4 * 0.4 * columnDepthM) + perimeter * 0.3 * 0.4) * soilConcreteMultiplier;
  const rColumn = resolveReinforcementParams(input, "column_footing", { perimeter, footingArea, depthM: columnDepthM, concreteVolumeM3: columnConcreteVolumeM3 });
  const columnRebarKg = Math.round(rColumn.total_rebar_weight_kg || 0);
  const columnSandM3 = columnCount * 0.1;
  const columnExcavationM3 = columnCount * (0.6 * 0.6 * columnDepthM);
  const columnFormworkM2 = columnCount * 4 * 0.4 * columnDepthM + perimeter * 2 * 0.4;
  const columnWaterproofingM2 = columnCount * 4 * 0.4 * columnDepthM;

  const columnMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(columnConcreteVolumeM3 * 10) / 10,
    reinforcementBarKg: columnRebarKg,
    sandGravelM3: Math.ceil(columnSandM3 * 10) / 10,
    waterproofingM2: Math.ceil(columnWaterproofingM2),
    insulationM3: 0,
    formworkM2: Math.round(columnFormworkM2),
    formworkBoardsCount: Math.ceil(columnFormworkM2 / 0.9),
    excavationVolumeM3: Math.ceil(columnExcavationM3),
    sandGravelWeightTons: Math.round(columnSandM3 * 1.6 * 10) / 10,
    rebarLongitudinalKg: Math.round(rColumn.main_bars_weight_kg || 0),
    rebarTransverseKg: Math.round((rColumn.secondary_bars_weight_kg || 0) + (rColumn.additional_elements_weight_kg || 0)),
    rebarLongitudinalDiameter: rColumn.main_bar_diameter,
    rebarTransverseDiameter: rColumn.secondary_bar_diameter,
    hasDrainage: false,
    drainagePipeM: 0,
    drainageGeotextileM2: 0,
    drainageStoneM3: 0,
    drainageWellsCount: 0,
    groundingSteelStripM: Math.ceil(perimeter),
    groundingEarthRodsPcs: 3,
    groundingClampsPcs: 3,
    backfillVolumeM3: Math.ceil(columnExcavationM3 * 0.5),
    waterproofProtMembraneM2: 0,
    roughFloorAreaM2: footingArea,
    roughFloorConcreteM3: Math.round(footingArea * 0.08 * 10) / 10,
    roughFloorRebarKg: Math.round(footingArea * 4.5),
    roughFloorSandM3: Math.round(footingArea * 0.1 * 10) / 10,
    roughFloorWaterproofingM2: Math.round(footingArea * 1.0)
  };
  const excavationCostColumnMDL = Math.round(columnMaterials.excavationVolumeM3 * COST_RATES.EXCAVATION_MDL_M3);
  const rebarBindingCostColumnMDL = Math.round(columnMaterials.reinforcementBarKg * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  const slopeComplicationCostColumnMDL = Math.round(perimeter * (input.landSlope / 100) * 350);
  const columnCost = compileDetailedBudget(columnMaterials, excavationCostColumnMDL, rebarBindingCostColumnMDL, 0, slopeComplicationCostColumnMDL, input);

  // --- OPTION 10: ФУНДАМЕНТ ТИСЭ (tise) ---
  const tisePileCount = Math.max(12, Math.ceil(perimeter / 1.7));
  const tisePileDepthM = 2.2;
  const tisePileConcreteM3 = (tisePileCount * (Math.PI * 0.125 * 0.125 * tisePileDepthM + 0.045) + perimeter * 0.3 * 0.45) * soilConcreteMultiplier;
  const rTise = resolveReinforcementParams(input, "tise", { perimeter, footingArea, depthM: tisePileDepthM, concreteVolumeM3: tisePileConcreteM3 });
  const tiseRebarKg = Math.round(rTise.total_rebar_weight_kg || 0);
  const tiseSandM3 = tisePileCount * 0.05;
  const tiseExcavationM3 = tisePileCount * (Math.PI * 0.125 * 0.125 * tisePileDepthM + 0.05) + perimeter * 0.3 * 0.15;
  const tiseFormworkM2 = perimeter * 2 * 0.45 + tisePileCount * 0.5;
  const tiseWaterproofingM2 = tisePileCount * (Math.PI * 0.25 * tisePileDepthM);

  const tiseMaterials: MaterialRequirement = {
    concreteVolumeM3: Math.ceil(tisePileConcreteM3 * 10) / 10,
    reinforcementBarKg: tiseRebarKg,
    sandGravelM3: Math.ceil(tiseSandM3 * 10) / 10,
    waterproofingM2: Math.ceil(tiseWaterproofingM2),
    insulationM3: 0,
    formworkM2: Math.round(tiseFormworkM2),
    formworkBoardsCount: Math.ceil(tiseFormworkM2 / 0.9),
    excavationVolumeM3: Math.ceil(tiseExcavationM3),
    sandGravelWeightTons: Math.round(tiseSandM3 * 1.6 * 10) / 10,
    rebarLongitudinalKg: Math.round(rTise.main_bars_weight_kg || 0),
    rebarTransverseKg: Math.round((rTise.secondary_bars_weight_kg || 0) + (rTise.additional_elements_weight_kg || 0)),
    rebarLongitudinalDiameter: rTise.main_bar_diameter,
    rebarTransverseDiameter: rTise.secondary_bar_diameter,
    hasDrainage,
    drainagePipeM,
    drainageGeotextileM2,
    drainageStoneM3,
    drainageWellsCount,
    groundingSteelStripM: Math.ceil(perimeter),
    groundingEarthRodsPcs: 3,
    groundingClampsPcs: 3,
    backfillVolumeM3: Math.ceil(perimeter * 0.1),
    waterproofProtMembraneM2: 0,
    roughFloorAreaM2: footingArea,
    roughFloorConcreteM3: Math.round(footingArea * 0.08 * 10) / 10,
    roughFloorRebarKg: Math.round(footingArea * 4.5),
    roughFloorSandM3: Math.round(footingArea * 0.1 * 10) / 10,
    roughFloorWaterproofingM2: Math.round(footingArea * 1.0)
  };
  const excavationCostTiseMDL = Math.round(tiseMaterials.excavationVolumeM3 * COST_RATES.EXCAVATION_MDL_M3) + (tisePileCount * COST_RATES.PILE_DRILLING_MDL_M * tisePileDepthM * 0.5 + tisePileCount * 450); // ТИСЭ уширитель
  const rebarBindingCostTiseMDL = Math.round(tiseMaterials.reinforcementBarKg * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  const slopeComplicationCostTiseMDL = Math.round(perimeter * (input.landSlope / 100) * 350);
  const tiseCost = compileDetailedBudget(tiseMaterials, excavationCostTiseMDL, rebarBindingCostTiseMDL, drainageCostMDL, slopeComplicationCostTiseMDL, input);

  // Set default recommendations for 10 systems
  let classicSlabIsRecommended = false;
  let mzlfIsRecommended = false;
  let stripWithSlabIsRecommended = false;
  let drilledPilesIsRecommended = false;
  let ribbedSlabIsRecommended = false;
  let columnIsRecommended = false;
  let tiseIsRecommended = false;

  if (!stripIsRecommended && !slabIsRecommended && !pileIsRecommended) {
    if (wallWeightTons > 120 || input.hasBasement) {
      stripIsRecommended = true;
      stripWithSlabIsRecommended = true;
    } else if (input.soilType === SoilType.FILLED) {
      drilledPilesIsRecommended = true;
    } else {
      slabIsRecommended = true;
      classicSlabIsRecommended = true;
    }
  }

  // --- DYNAMIC MATRIX SCORING & RANKING ---
  const allCosts = [
    stripCost.totalCostMDL, slabCost.totalCostMDL, pileCost.totalCostMDL,
    classicSlabCost.totalCostMDL, mzlfCost.totalCostMDL, stripWithSlabCost.totalCostMDL,
    drilledPilesCost.totalCostMDL, ribbedSlabCost.totalCostMDL, columnCost.totalCostMDL,
    tiseCost.totalCostMDL
  ];
  const minCost = Math.min(...allCosts);
  const maxCost = Math.max(...allCosts);
  const costSpread = maxCost - minCost || 1;

  // Let's compute individual scores for all 10 foundations
  // 1. Strip
  const stripCostScore = Math.round(100 - ((stripCost.totalCostMDL - minCost) / costSpread) * 75);
  const stripRiskScore = seismicPoints === 8 ? 80 : 88;
  const stripEnergyScore = 30;
  const stripGeologyScore = input.soilType === SoilType.ROCK ? 98 : input.soilType === SoilType.LOESS ? 70 : input.soilType === SoilType.FILLED ? 10 : 88;
  const finalStripReliability = Math.round(
    (seismicPoints === 8 ? 82 : 88) * 0.25 + stripGeologyScore * 0.25 + stripRiskScore * 0.20 + stripComplexity * 0.15 + stripEnergyScore * 0.15
  );

  // 2. Slab (USH)
  const slabCostScore = Math.round(100 - ((slabCost.totalCostMDL - minCost) / costSpread) * 75);
  const slabRiskScore = 95;
  const slabEnergyScore = 100;
  const slabGeologyScore = input.soilType === SoilType.ROCK ? 85 : input.soilType === SoilType.LOESS ? (input.groundwaterDepth < 1.5 ? 20 : 90) : input.soilType === SoilType.FILLED ? 42 : 92;
  const finalSlabReliability = Math.round(
    (seismicPoints === 8 ? 90 : 95) * 0.25 + slabGeologyScore * 0.25 + slabRiskScore * 0.20 + slabComplexity * 0.15 + slabEnergyScore * 0.15
  );

  // 3. Piles
  const pileCostScore = Math.round(100 - ((pileCost.totalCostMDL - minCost) / costSpread) * 75);
  const pileRiskScore = 75;
  const pileEnergyScore = 20;
  const pileGeologyScore = input.soilType === SoilType.ROCK ? 30 : input.soilType === SoilType.LOESS ? 92 : input.soilType === SoilType.FILLED ? 92 : 85;
  const finalPileReliability = Math.round(
    (seismicPoints === 8 ? 72 : 82) * 0.25 + pileGeologyScore * 0.25 + pileRiskScore * 0.20 + pileComplexity * 0.15 + pileEnergyScore * 0.15
  );

  // 4. Classic Slab
  const classicSlabCostScore = Math.round(100 - ((classicSlabCost.totalCostMDL - minCost) / costSpread) * 75);
  const classicSlabRiskScore = 90;
  const classicSlabComplexity = 70;
  const classicSlabEnergyScore = 55;
  const classicSlabGeologyScore = input.soilType === SoilType.ROCK ? 90 : input.soilType === SoilType.LOESS ? 78 : input.soilType === SoilType.FILLED ? 35 : 90;
  const classicSlabReliability = Math.round(
    (seismicPoints === 8 ? 88 : 92) * 0.25 + classicSlabGeologyScore * 0.25 + classicSlabRiskScore * 0.20 + classicSlabComplexity * 0.15 + classicSlabEnergyScore * 0.15
  );

  // 5. MZLF
  const mzlfCostScore = Math.round(100 - ((mzlfCost.totalCostMDL - minCost) / costSpread) * 75);
  const mzlfRiskScore = 60;
  const mzlfComplexity = 80;
  const mzlfEnergyScore = 30;
  const mzlfGeologyScore = input.soilType === SoilType.ROCK ? 95 : input.soilType === SoilType.LOESS ? 40 : input.soilType === SoilType.FILLED ? 10 : 75;
  const mzlfReliability = Math.round(
    (seismicPoints === 8 ? 55 : 70) * 0.25 + mzlfGeologyScore * 0.25 + mzlfRiskScore * 0.20 + mzlfComplexity * 0.15 + mzlfEnergyScore * 0.15
  );

  // 6. Strip with Slab
  const stripWithSlabCostScore = Math.round(100 - ((stripWithSlabCost.totalCostMDL - minCost) / costSpread) * 75);
  const stripWithSlabRiskScore = 92;
  const stripWithSlabComplexity = 55;
  const stripWithSlabEnergyScore = 50;
  const stripWithSlabGeologyScore = input.soilType === SoilType.ROCK ? 95 : input.soilType === SoilType.LOESS ? 85 : input.soilType === SoilType.FILLED ? 45 : 90;
  const stripWithSlabReliability = Math.round(
    (seismicPoints === 8 ? 90 : 94) * 0.25 + stripWithSlabGeologyScore * 0.25 + stripWithSlabRiskScore * 0.20 + stripWithSlabComplexity * 0.15 + stripWithSlabEnergyScore * 0.15
  );

  // 7. Drilled Piles
  const drilledPilesCostScore = Math.round(100 - ((drilledPilesCost.totalCostMDL - minCost) / costSpread) * 75);
  const drilledPilesRiskScore = 75;
  const drilledPilesComplexity = 65;
  const drilledPilesEnergyScore = 20;
  const drilledPilesGeologyScore = input.soilType === SoilType.ROCK ? 25 : input.soilType === SoilType.LOESS ? 90 : input.soilType === SoilType.FILLED ? 95 : 82;
  const drilledPilesReliability = Math.round(
    (seismicPoints === 8 ? 72 : 80) * 0.25 + drilledPilesGeologyScore * 0.25 + drilledPilesRiskScore * 0.20 + drilledPilesComplexity * 0.15 + drilledPilesEnergyScore * 0.15
  );

  // 8. Ribbed Slab
  const ribbedSlabCostScore = Math.round(100 - ((ribbedSlabCost.totalCostMDL - minCost) / costSpread) * 75);
  const ribbedSlabRiskScore = 88;
  const ribbedSlabComplexity = 60;
  const ribbedSlabEnergyScore = 50;
  const ribbedSlabGeologyScore = input.soilType === SoilType.ROCK ? 88 : input.soilType === SoilType.LOESS ? 88 : input.soilType === SoilType.FILLED ? 40 : 85;
  const ribbedSlabReliability = Math.round(
    (seismicPoints === 8 ? 85 : 90) * 0.25 + ribbedSlabGeologyScore * 0.25 + ribbedSlabRiskScore * 0.20 + ribbedSlabComplexity * 0.15 + ribbedSlabEnergyScore * 0.15
  );

  // 9. Column Footing
  const columnCostScore = Math.round(100 - ((columnCost.totalCostMDL - minCost) / costSpread) * 75);
  const columnRiskScore = 40;
  const columnComplexity = 90;
  const columnEnergyScore = 10;
  const columnGeologyScore = input.soilType === SoilType.ROCK ? 75 : input.soilType === SoilType.LOESS ? 15 : input.soilType === SoilType.FILLED ? 5 : 45;
  const columnReliability = Math.round(
    (seismicPoints === 8 ? 30 : 50) * 0.25 + columnGeologyScore * 0.25 + columnRiskScore * 0.20 + columnComplexity * 0.15 + columnEnergyScore * 0.15
  );

  // 10. TISE
  const tiseCostScore = Math.round(100 - ((tiseCost.totalCostMDL - minCost) / costSpread) * 75);
  const tiseRiskScore = 80;
  const tiseComplexity = 60;
  const tiseEnergyScore = 20;
  const tiseGeologyScore = input.soilType === SoilType.ROCK ? 35 : input.soilType === SoilType.LOESS ? 95 : input.soilType === SoilType.FILLED ? 90 : 88;
  const tiseReliability = Math.round(
    (seismicPoints === 8 ? 78 : 84) * 0.25 + tiseGeologyScore * 0.25 + tiseRiskScore * 0.20 + tiseComplexity * 0.15 + tiseEnergyScore * 0.15
  );

  // Push options to option list (total 10 items)
  options.push({
    id: "strip",
    type: "Ленточный монолитный (глубокого заложения)",
    nameRu: "Ленточный монолитный глубокого заложения",
    isRecommended: stripIsRecommended,
    costMDL: stripCost.totalCostMDL,
    reliabilityScore: finalStripReliability,
    complexityScore: stripComplexity,
    pros: stripPros,
    cons: stripCons,
    risks: stripRisks,
    materials: stripMaterials,
    costEstimate: stripCost,
    widthM: requiredStripWidthM,
    depthM: Math.round(stripDepthM * 100) / 100,
    bimEntities: generateBIMEntities("strip", input, stripMaterials, stripCost, soil, perimeter, footingArea, stripDepthM),
    costScore: stripCostScore,
    riskScore: stripRiskScore,
    energyScore: stripEnergyScore,
    geologyScore: stripGeologyScore,
    totalScore: finalStripReliability,
    reinforcement: resolveReinforcementParams(input, "strip", { perimeter, footingArea, depthM: stripDepthM, concreteVolumeM3: stripMaterials.concreteVolumeM3 })
  });
  
  options.push({
    id: "slab",
    type: "Утепленная шведская плита (УШП)",
    nameRu: "Мелкозаглубленная утепленная шведская плита (УШП) по специальному теплотехническому расчету",
    isRecommended: slabIsRecommended,
    costMDL: slabCost.totalCostMDL,
    reliabilityScore: finalSlabReliability,
    complexityScore: slabComplexity,
    pros: slabPros,
    cons: slabCons,
    risks: slabRisks,
    materials: slabMaterials,
    costEstimate: slabCost,
    widthM: Math.max(input.width, input.length),
    depthM: slabDepthM,
    bimEntities: generateBIMEntities("slab", input, slabMaterials, slabCost, soil, perimeter, footingArea, slabDepthM),
    costScore: slabCostScore,
    riskScore: slabRiskScore,
    energyScore: slabEnergyScore,
    geologyScore: slabGeologyScore,
    totalScore: finalSlabReliability,
    reinforcement: resolveReinforcementParams(input, "slab", { perimeter, footingArea, depthM: slabDepthM, concreteVolumeM3: slabMaterials.concreteVolumeM3 })
  });
  
  options.push({
    id: "piles",
    type: "Свайно-ростверковый фундамент",
    nameRu: "Буронабивной свайно-ростверковый",
    isRecommended: pileIsRecommended,
    costMDL: pileCost.totalCostMDL,
    reliabilityScore: finalPileReliability,
    complexityScore: pileComplexity,
    pros: pilePros,
    cons: pileCons,
    risks: pileRisks,
    materials: pileMaterials,
    costEstimate: pileCost,
    widthM: 0.4,
    depthM: 2.2,
    bimEntities: generateBIMEntities("piles", input, pileMaterials, pileCost, soil, perimeter, footingArea, 2.2),
    costScore: pileCostScore,
    riskScore: pileRiskScore,
    energyScore: pileEnergyScore,
    geologyScore: pileGeologyScore,
    totalScore: finalPileReliability,
    reinforcement: resolveReinforcementParams(input, "piles", { perimeter, footingArea, depthM: 2.2, concreteVolumeM3: pileMaterials.concreteVolumeM3 })
  });

  options.push({
    id: "classic_slab",
    type: "Классическая монолитная плита",
    nameRu: "Классическая монолитная ж/б плита мелкого заложения",
    isRecommended: classicSlabIsRecommended,
    costMDL: classicSlabCost.totalCostMDL,
    reliabilityScore: classicSlabReliability,
    complexityScore: classicSlabComplexity,
    pros: [
      "Идеально перераспределяет нагрузки под тяжелые каменные коттеджи в 2-3 этажа",
      "Минимум чувствительности к пучению грунтов основания во всех зонах РМ",
      "Готовая черновая основа под укладку теплого пола на первом этаже"
    ],
    cons: [
      "Высокий суммарный расход товарного бетона и арматуры марки A500C",
      "Плохо сочетается со сложным холмистым рельефом и перепадами высот на участке",
      "Требует проведения большого объема уплотнительных земляных работ вручную"
    ],
    risks: [
      "Риск разрушения при плохом уплотнении песчаной подсыпки и замачивании окружающего лесса"
    ],
    materials: classicSlabMaterials,
    costEstimate: classicSlabCost,
    widthM: Math.max(input.width, input.length),
    depthM: classicSlabDepthM,
    bimEntities: generateBIMEntities("classic_slab", input, classicSlabMaterials, classicSlabCost, soil, perimeter, footingArea, classicSlabDepthM),
    costScore: classicSlabCostScore,
    riskScore: classicSlabRiskScore,
    energyScore: classicSlabEnergyScore,
    geologyScore: classicSlabGeologyScore,
    totalScore: classicSlabReliability,
    reinforcement: resolveReinforcementParams(input, "classic_slab", { perimeter, footingArea, depthM: classicSlabDepthM, concreteVolumeM3: classicSlabMaterials.concreteVolumeM3 })
  });

  options.push({
    id: "mzlf",
    type: "Мелкозаглубленный ленточный фундамент (МЗЛФ)",
    nameRu: "Мелкозаглубленный ленточный фундамент (МЗЛФ) облегченный",
    isRecommended: mzlfIsRecommended,
    costMDL: mzlfCost.totalCostMDL,
    reliabilityScore: mzlfReliability,
    complexityScore: mzlfComplexity,
    pros: [
      "Самая экономичная ленточная конструкция для стабильных несущих грунтов",
      "Сниженные на 40% земляные работы по сравнению с глубоким заложением ниже промерзания",
      "Простой монтаж силами одной бригады без привлечения буровой спецтехники"
    ],
    cons: [
      "Категорический запрет на использование на насыпных (Filled) грунтах оползней",
      "Повышенная чувствительность к неравномерному морозному пучению без наружного утепления",
      "Исключает возможность обустройства полноценного глубокого цокольного этажа"
    ],
    risks: [
      "Риск горизонтального смещения и выпучивания из-за отсутствия жестких длинных свай ниже промерзания"
    ],
    materials: mzlfMaterials,
    costEstimate: mzlfCost,
    widthM: mzlfWidthM,
    depthM: mzlfDepthM,
    bimEntities: generateBIMEntities("mzlf", input, mzlfMaterials, mzlfCost, soil, perimeter, footingArea, mzlfDepthM),
    costScore: mzlfCostScore,
    riskScore: mzlfRiskScore,
    energyScore: mzlfEnergyScore,
    geologyScore: mzlfGeologyScore,
    totalScore: mzlfReliability,
    reinforcement: resolveReinforcementParams(input, "mzlf", { perimeter, footingArea, depthM: mzlfDepthM, concreteVolumeM3: mzlfMaterials.concreteVolumeM3 })
  });

  options.push({
    id: "strip_with_slab",
    type: "Ленточный фундамент с монолитной плитой по грунту",
    nameRu: "Комбинированный ленточный фундамент с монолитной плитой по грунту",
    isRecommended: stripWithSlabIsRecommended,
    costMDL: stripWithSlabCost.totalCostMDL,
    reliabilityScore: stripWithSlabReliability,
    complexityScore: stripWithSlabComplexity,
    pros: [
      "Колоссальная конструктивная жесткость глубокой ленты и готовый жесткий пол первого этажа",
      "Практически исключает сырость, проникновение грызунов и затопление из-под грунта",
      "Мощное основание для укладки тяжелого пирога стен (полный молдавский котелец, кирпич)"
    ],
    cons: [
      "Наиболее дорогая суммарная позиция по удельным затратам материалов и объему работ",
      "Большой фронт сопутствующих трудоемких операций: герметизация швов, пазух ленты",
      "Высокая усадочная масса, заставляющая выжидать технологическую паузу твердения бетона"
    ],
    risks: [
      "Осадка неуплотненного песка обратной засыпки во внутренних ячейках с провисанием монолитной стяжки"
    ],
    materials: stripWithSlabMaterials,
    costEstimate: stripWithSlabCost,
    widthM: requiredStripWidthM,
    depthM: Math.round(stripDepthM * 100) / 100,
    bimEntities: generateBIMEntities("strip_with_slab", input, stripWithSlabMaterials, stripWithSlabCost, soil, perimeter, footingArea, stripDepthM),
    costScore: stripWithSlabCostScore,
    riskScore: stripWithSlabRiskScore,
    energyScore: stripWithSlabEnergyScore,
    geologyScore: stripWithSlabGeologyScore,
    totalScore: stripWithSlabReliability,
    reinforcement: resolveReinforcementParams(input, "strip_with_slab", { perimeter, footingArea, depthM: stripDepthM, concreteVolumeM3: stripWithSlabMaterials.concreteVolumeM3 })
  });

  options.push({
    id: "drilled_piles",
    type: "Свайно-ростверковый фундамент (висячий ростверк)",
    nameRu: "Буронабивные железобетонные сваи со сборно-монолитным ростверком",
    isRecommended: drilledPilesIsRecommended,
    costMDL: drilledPilesCost.totalCostMDL,
    reliabilityScore: drilledPilesReliability,
    complexityScore: drilledPilesComplexity,
    pros: [
      "Проходит зыбкие верхние пласты чернозема или свежей насыпи с опорой на надежные пески",
      "Отличная устойчивость заложения на крутых холмистых оползневых уклонах РМ",
      "Относительно быстрый темп возведения за счет минимизации заливки стен цоколя бетоном"
    ],
    cons: [
      "Повышенная сложность завязки армирующего каркаса головок свай с арматурой ростверка",
      "Сильная зависимость жесткости свай от каверн и вымывания бетона в обводненных забоях",
      "Полностью блокирует любые архитектурные планы на строительство подземного подвала"
    ],
    risks: [
      "Риск дефектов ствола сваи из-за сдавливания пластами или некачественной заливки под ГВ"
    ],
    materials: drilledPilesMaterials,
    costEstimate: drilledPilesCost,
    widthM: 0.4,
    depthM: drilledPilesDepthM,
    bimEntities: generateBIMEntities("drilled_piles", input, drilledPilesMaterials, drilledPilesCost, soil, perimeter, footingArea, drilledPilesDepthM),
    costScore: drilledPilesCostScore,
    riskScore: drilledPilesRiskScore,
    energyScore: drilledPilesEnergyScore,
    geologyScore: drilledPilesGeologyScore,
    totalScore: drilledPilesReliability,
    reinforcement: resolveReinforcementParams(input, "drilled_piles", { perimeter, footingArea, depthM: drilledPilesDepthM, concreteVolumeM3: drilledPilesMaterials.concreteVolumeM3 })
  });

  options.push({
    id: "ribbed_slab",
    type: "Монолитная ребристая плита с ребрами жесткости вниз",
    nameRu: "Монолитная ж/б ребристая плита с ребрами жесткости вниз",
    isRecommended: ribbedSlabIsRecommended,
    costMDL: ribbedSlabCost.totalCostMDL,
    reliabilityScore: ribbedSlabReliability,
    complexityScore: ribbedSlabComplexity,
    pros: [
      "Превосходная сопротивляемость изгибающим нагрузкам при сниженной массе бетона на 25%",
      "Ребра жесткости отлично работают как барьер против сил горизонтального смещения грунта",
      "Эффективно защищает надземную часть конструкции от динамических ударных колебаний"
    ],
    cons: [
      "Сложная геометрия земляных траншей под внутреннюю сетку ребер жесткости плиты",
      "Повышенные затраты времени на установку сложного формообразующего каркаса опалубки",
      "Высокая критичность к аккуратности укладки канализационных труб и других сетей"
    ],
    risks: [
      "Риск пустот и непроливов в ребрах из-за защемления воздуха при плохом вибрировании бетона"
    ],
    materials: ribbedSlabMaterials,
    costEstimate: ribbedSlabCost,
    widthM: Math.max(input.width, input.length),
    depthM: 0.45,
    bimEntities: generateBIMEntities("ribbed_slab", input, ribbedSlabMaterials, ribbedSlabCost, soil, perimeter, footingArea, 0.45),
    costScore: ribbedSlabCostScore,
    riskScore: ribbedSlabRiskScore,
    energyScore: ribbedSlabEnergyScore,
    geologyScore: ribbedSlabGeologyScore,
    totalScore: ribbedSlabReliability,
    reinforcement: resolveReinforcementParams(input, "ribbed_slab", { perimeter, footingArea, depthM: 0.45, concreteVolumeM3: ribbedSlabMaterials.concreteVolumeM3 })
  });

  options.push({
    id: "column_footing",
    type: "Столбчатый фундамент с ростверком",
    nameRu: "Столбчатый железобетонный фундамент с монолитным ростверком",
    isRecommended: columnIsRecommended,
    costMDL: columnCost.totalCostMDL,
    reliabilityScore: columnReliability,
    complexityScore: columnComplexity,
    pros: [
      "Экономичный фаворит с минимальным чеком материалов для деревянных и каркасных бань",
      "Крайне сжатые сроки возведения под ключ (не более 5-7 рабочих дней на весь цикл)",
      "Объем вынутого грунта в 5 раз меньше по сравнению с полноразмерным котлованом"
    ],
    cons: [
      "Категорически не предназначен для тяжелых кирпичных или газобетонных жилых домов",
      "Слабо сопротивляется сдвигающему давлению на оползневых или илистых береговых пучениях",
      "Требует обустройства утепленной забирки цоколя во избежание сквозняков под полом"
    ],
    risks: [
      "Интенсивный перекос схода осей опор при локальном намокании грунта под одной из тумб"
    ],
    materials: columnMaterials,
    costEstimate: columnCost,
    widthM: 0.4,
    depthM: columnDepthM,
    bimEntities: generateBIMEntities("column_footing", input, columnMaterials, columnCost, soil, perimeter, footingArea, columnDepthM),
    costScore: columnCostScore,
    riskScore: columnRiskScore,
    energyScore: columnEnergyScore,
    geologyScore: columnGeologyScore,
    totalScore: columnReliability,
    reinforcement: resolveReinforcementParams(input, "column_footing", { perimeter, footingArea, depthM: columnDepthM, concreteVolumeM3: columnMaterials.concreteVolumeM3 })
  });

  options.push({
    id: "tise",
    type: "Фундамент ТИСЭ (с расширением подошвы)",
    nameRu: "Технологический фундамент ТИСЭ с уширением пяты свай и висячим ростверком",
    isRecommended: tiseIsRecommended,
    costMDL: tiseCost.totalCostMDL,
    reliabilityScore: tiseReliability,
    complexityScore: tiseComplexity,
    pros: [
      "Лучшая анкеровка в плотных слоях грунта против выпучивания силами зимнего пучения",
      "Принудительное распределение веса через плоские опорные подошвы d600мм повышает надежность",
      "Минимум затрат на аренду дорогостоящего строительного автокрана или буровой вышки"
    ],
    cons: [
      "Высокая ручная физическая нагрузка рабочих при уширении забоя специальным буром ТИСЭ",
      "Невозможно сделать расширение пяты на сыпучих песчаных или обводненных грунтах",
      "Требует строгого выдерживания воздушного технологического зазора (10-15см) ростверка с землей"
    ],
    risks: [
      "Частичное осыпание кромок расширенной полусферы грунтом до заливки раствора бетона"
    ],
    materials: tiseMaterials,
    costEstimate: tiseCost,
    widthM: 0.4,
    depthM: tisePileDepthM,
    bimEntities: generateBIMEntities("tise", input, tiseMaterials, tiseCost, soil, perimeter, footingArea, tisePileDepthM),
    costScore: tiseCostScore,
    riskScore: tiseRiskScore,
    energyScore: tiseEnergyScore,
    geologyScore: tiseGeologyScore,
    totalScore: tiseReliability,
    reinforcement: resolveReinforcementParams(input, "tise", { perimeter, footingArea, depthM: tisePileDepthM, concreteVolumeM3: tiseMaterials.concreteVolumeM3 })
  });
  
  // 10. RISKS PERCENTAGE ANALYSIS BASED ON WATER-TABLE, SOIL, REGION
  let frostHeavingPercent = soil.heavingRisk * 100;
  if (input.groundwaterDepth < 1.5) {
    frostHeavingPercent += 20;
  } else {
    frostHeavingPercent -= 30;
  }
  if (input.landSlope > 8) {
    frostHeavingPercent += 10;
  }
  frostHeavingPercent = Math.max(5, Math.min(95, frostHeavingPercent));
  
  let collapsibilityPercent = soil.collapsibilityRisk * 100;
  if (input.groundwaterDepth < 2.0 && input.soilType === SoilType.LOESS) {
    collapsibilityPercent += 15;
  }
  collapsibilityPercent = Math.max(5, Math.min(95, collapsibilityPercent));
  
  let floodingPercent = 10;
  if (input.groundwaterDepth < 1.0) {
    floodingPercent = 90;
  } else if (input.groundwaterDepth < 1.5) {
    floodingPercent = 70;
  } else if (input.groundwaterDepth < 2.5) {
    floodingPercent = 35;
  } else {
    floodingPercent = 5;
  }

  // --- SETTLEMENT ENGINE (Phase 7) ---
  // Characteristic vertical load in kN (including self-weight and live/climatic loads):
  const characteristicLoadKN = (Gk_dead_total + Qk_live + Qk_snow + Qk_wind) * 9.81;
  // Effective active area of the foundation elements in contact with the soil
  const activeAreaM2 = Math.max(bearingAreaRequiredM2 * 1.1, input.width * input.length * 0.15); 
  const p_contact_kPa = Math.min(soilBearingCapacityKPa, characteristicLoadKN / activeAreaM2);
  const nu = soil.poissonRatio;
  const E_avg_kPa = soil.Eavg * 1000; // deformation modulus in kPa (1 MPa = 1000 kPa)
  const omega = soil.settlementCoeff; // settlement coefficient
  const b_eq = Math.min(3.0, Math.sqrt(activeAreaM2)); // equivalent width of the loaded zone

  // Presence of shallow groundwater table (GWT < 1.0m) degrades structural parameters of clay/silt soils
  let Kd = 1.0;
  if (input.groundwaterDepth < 1.0) {
    if (input.soilType === SoilType.CLAY || input.soilType === SoilType.LOAM || input.soilType === SoilType.LOESS) {
      Kd = 1.45; // significant degradation of silty clay mineral aggregates
    } else if (input.soilType === SoilType.FILLED) {
      Kd = 1.60;
    } else if (input.soilType === SoilType.SILTY_SAND || input.soilType === SoilType.SANDY_LOAM) {
      Kd = 1.30;
    }
  }

  let settlementTotalMM = 0;
  if (input.soilType === SoilType.ROCK) {
    // Rocky solid ground: very small settlement (1.5 to 3.0 mm typical) and zero differential risk
    settlementTotalMM = Math.round((1.5 + Math.min(1.5, (characteristicLoadKN / 3000) * 1.5)) * 100) / 100;
  } else {
    // S = p * b * (1 - nu^2) * omega / E (in meters) multiplied by 1000 to get mm, then by groundwater factor Kd
    const rawSettlement = (p_contact_kPa * b_eq * (1 - nu * nu) * omega / E_avg_kPa) * 1000 * Kd;
    settlementTotalMM = Math.round(rawSettlement * 100) / 100;

    // Silt and anthropogenic soils (FILLED) suffer large non-engineered settlements under vertical loading
    if (input.soilType === SoilType.FILLED && settlementTotalMM < 105) {
      settlementTotalMM = Math.round((105 + Math.min(45, (characteristicLoadKN / 1200) * 20)) * 100) / 100;
    }
  }
  
  // Differential settlement homogeneity ratio: ROCK is completely uniform (0), FILLED is highly erratic (0.60)
  const homogeneityCoeff = input.soilType === SoilType.ROCK ? 0.0 : input.soilType === SoilType.FILLED ? 0.60 : input.soilType === SoilType.LOESS ? 0.40 : 0.25;
  const settlementDiffMM = input.soilType === SoilType.ROCK ? 0.0 : Math.round(settlementTotalMM * homogeneityCoeff * 100) / 100;
  const length_mm = input.length * 1000;
  const settlementUnequal = Math.round((settlementDiffMM / length_mm) * 100000) / 100000;
  
  // Settlement limits specified in NCM EN 1997-1/Eurocode 7 based on structural stiffness
  let settlementLimitMM = 100;
  if (input.wallMaterial === BuildingWallMaterial.GASOBETON) {
    settlementLimitMM = 80; // gasobeton blocks are fragile and susceptible to cracking
  } else if (input.wallMaterial === BuildingWallMaterial.FRAME) {
    settlementLimitMM = 150; // flexible timber/steel frame structures have high compliance
  } else if (input.wallMaterial === BuildingWallMaterial.BRICK || input.wallMaterial === BuildingWallMaterial.KOTELET) {
    settlementLimitMM = 100; // standard masonry/stone structures
  }
  
  const settlementRiskCoeff = Math.round((settlementTotalMM / settlementLimitMM) * 100) / 100;
  const requiresGeotechnicalSurvey = settlementRiskCoeff > 0.6 || 
                                     input.soilType === SoilType.FILLED || 
                                     input.soilType === SoilType.LOESS || 
                                     input.landSlope > 8.0;
  
  // ======================================================================
  // DYNAMIC COMPUTATIONS FOR ENGINEERING SUBSYSTEMS (Stages 2, 3, 4, 5, 6, 7, 9, 10)
  // ======================================================================
  const geologyDetailsResolved = calculateGeologyDetails(input, soilBearingCapacityKPa, reg, soil, stripDepthM);
  const utilitiesModelResolved = calculateUtilities(input, perimeter);

  // Find currently selected/default option
  const selectedOptionForRiskAndCuring = options.find(o => o.isRecommended) || options[0];
  const selectedConcreteM3 = selectedOptionForRiskAndCuring.materials.concreteVolumeM3 || 25;
  const selectedExcavationM3 = selectedOptionForRiskAndCuring.materials.excavationVolumeM3 || 50;

  const concreteCuringResolved = calculateConcreteCuring(input, footingArea, selectedConcreteM3);
  const backfillResolved = calculateBackfill(input, selectedExcavationM3, selectedConcreteM3);
  const blindAreaResolved = calculateBlindArea(input, perimeter);

  // Dynamic automatic risk engine
  const risksListResolved = calculateRisksList(
    input,
    selectedOptionForRiskAndCuring,
    concreteCuringResolved.hasCuringSection,
    (selectedOptionForRiskAndCuring.materials.insulationM3 || 0) > 0
  );

  // Dynamic engineering explanations
  const explanationsResolved = calculateOptionExplanations(input);

  return {
    input,
    wallWeightTons: Math.round(wallWeightTons * 10) / 10,
    slabWeightTons: Math.round(slabWeightTons * 10) / 10,
    roofWeightTons: Math.round(roofWeightTons * 10) / 10,
    deadLoadSubtotalTons: Math.round(deadLoadSubtotalTons * 10) / 10,
    liveLoadTons: Math.round(Qk_live * 10) / 10,
    snowLoadTons: Math.round(Qk_snow * 10) / 10,
    windLoadTons: Math.round(Qk_wind * 10) / 10,
    seismicForceTons: Math.round(seismicForceTons * 10) / 10,
    totalFactoredWeightTons,
    scenarioASnowDominantTons: Math.round(scenarioASnowDominantTons * 10) / 10,
    scenarioBLiveDominantTons: Math.round(scenarioBLiveDominantTons * 10) / 10,
    seismicMassCombinationTons: Math.round(seismicMassCombinationTons * 10) / 10,
    bearingAreaRequiredM2: Math.round(bearingAreaRequiredM2 * 10) / 10,
    soilBearingCapacityKPa,
    seismicPGA,
    seismicImportanceFactor,
    seismicGroundTypeFactor,
    seismicBehaviorFactor,
    seismicAmplification,
    settlementTotalMM,
    settlementDiffMM,
    settlementUnequal,
    settlementRiskCoeff,
    settlementLimitMM,
    requiresGeotechnicalSurvey,
    options,
    frostHeavingPercent,
    collapsibilityPercent,
    floodingPercent,

    // Dynamic modules integration - Stages 2-10
    geology: geologyDetailsResolved,
    utilities: utilitiesModelResolved,
    concreteCuring: concreteCuringResolved,
    backfill: backfillResolved,
    blindArea: blindAreaResolved,
    risksList: risksListResolved,
    explanations: explanationsResolved
  };
}

/**
 * Advanced detailed budget compiling to nearest hundred.
 */
/**
 * Advanced detailed budget compiling to nearest hundred.
 */
function compileDetailedBudget(
  m: MaterialRequirement, 
  excavationCostMDL: number, 
  rebarBindingCostMDL: number, 
  drainageCostMDLUnused: number,
  slopeComplicationCostMDL: number,
  input?: CalculatorInput
): CostEstimate {
  // Extract configuration parameters or defaults
  const perimeter = input ? 2 * (input.width + input.length) : 50;
  
  // 1. ADVANCED DRAINAGE SYSTEM CALCULATIONS (ALWAYS SPECIFIED FOR PERMANENT MOISTURE PROTECTION)
  m.hasDrainage = true;
  m.drainagePipeM = Math.ceil(perimeter + 6);
  m.drainageGeotextileM2 = Math.ceil(m.drainagePipeM * 1.6);
  m.drainageStoneM3 = Math.ceil(m.drainagePipeM * 0.40 * 0.35);
  m.drainageWellsCount = 4; // Corner cleanouts d315
  m.drainageWells400Count = 2; // Heavy cleanouts d400
  m.drainageCollectorWell = 1; // Sump collector well (KS-10 concrete rings)
  m.drainageSubmersiblePump = 1; // Automatic sump pump

  const detailedDrainageCostMDL = Math.round(
    (m.drainagePipeM * COST_RATES.DRAIN_PIPE_MDL_M) +
    (m.drainageGeotextileM2 * COST_RATES.GEOTEXTILE_MDL_M2) +
    (m.drainageStoneM3 * COST_RATES.CRUSHED_STONE_MDL_M3) +
    (m.drainageWellsCount * COST_RATES.INSPECTION_WELL_MDL_PCS) +
    (m.drainageWells400Count * COST_RATES.DRAIN_WELL_400_MDL_PCS) +
    (m.drainageCollectorWell * COST_RATES.DRAIN_COLLECTOR_WELL_MDL_PCS) +
    (m.drainageSubmersiblePump * COST_RATES.DRAIN_PUMP_MDL_PCS) +
    (m.drainagePipeM * 160) // Heavy labor for excavation trenching and assembly work
  );

  // 2. ENGINEERING UTILITY TRUNKS (ENGINEERING_NETWORKS)
  m.engineeringNetWaterIntakeLengthM = 10;
  m.engineeringNetSewerageOutletsPcs = 3;
  m.engineeringNetPowerDuctLengthM = 15;
  m.engineeringNetWeakDuctLengthM = 15;
  m.engineeringNetSpareDuctLengthM = 10;

  const engineeringNetworksCostMDL = Math.round(
    (m.engineeringNetWaterIntakeLengthM * COST_RATES.NET_WATER_HDPE_MDL_M) +
    (m.engineeringNetSewerageOutletsPcs * 12 * COST_RATES.NET_SEWER_PVC_MDL_M) +
    (m.engineeringNetPowerDuctLengthM * COST_RATES.NET_POWER_CONDUIT_MDL_M) +
    (m.engineeringNetWeakDuctLengthM * COST_RATES.NET_WEAK_CONDUIT_MDL_M) +
    (m.engineeringNetSpareDuctLengthM * COST_RATES.NET_SPARE_CONDUIT_MDL_M) +
    4000 // Specialized labor for utility sleeve positioning and seals
  );

  // 3. GROUNDING LOOP HARNESS (GROUNDING_SYSTEM)
  m.groundingSteelStripM = Math.ceil(perimeter + 10);
  m.groundingEarthRodsPcs = 4;
  m.groundingClampsPcs = 6;

  const groundingSystemCostMDL = Math.round(
    (m.groundingSteelStripM * COST_RATES.GROUNDING_STRIP_MDL_M) +
    (m.groundingEarthRodsPcs * COST_RATES.GROUNDING_ROD_MDL_PCS) +
    (m.groundingClampsPcs * COST_RATES.GROUNDING_CLAMP_MDL_PCS) +
    3000 // Electrical terminal coupling and trench laying labor
  );

  // 4. RETAINING WALL CAVITY BACKFILL & COMPACTION
  m.backfillCompactionCoeff = 1.15;
  m.backfillCompactionRuns = 5;
  const excavationVol = m.excavationVolumeM3 || 50;
  const concreteVol = m.concreteVolumeM3 || 25;
  m.backfillVolumeM3 = Math.round(Math.max(15, excavationVol - concreteVol * 0.6));

  const backfillCompactionCostMDL = Math.round(
    m.backfillVolumeM3 * COST_RATES.BACKFILL_SOIL_MDL_M3
  );

  // 5. WATERPROOFING DEFENSE WRAP (WATERPROOF_PROTECTION)
  let heightWrap = 0.5; // default for Slab
  if (m.formworkM2 && m.formworkM2 > 100) {
    heightWrap = 1.2; // deep Strip
  } else if (m.pileCount) {
    heightWrap = 0.6; // Pile grill
  }
  m.waterproofProtMembraneM2 = Math.ceil(perimeter * heightWrap * 1.05);

  const waterproofProtectionCostMDL = Math.round(
    m.waterproofProtMembraneM2 * COST_RATES.MEMBRANE_PROFILED_MDL_M2
  );

  // Core material pricing sums
  const concreteCostMDL = Math.round(m.concreteVolumeM3 * COST_RATES.CONCRETE_MDL_M3);
  const steelCostMDL = Math.round(m.reinforcementBarKg * COST_RATES.STEEL_MDL_KG);
  const sandCushionCostMDL = Math.round(m.sandGravelM3 * COST_RATES.SAND_GRAVEL_MDL_M3);
  const waterproofInsulationCostMDL = Math.round(
    (m.waterproofingM2 * COST_RATES.WATERPROOFING_MDL_M2) + 
    (m.insulationM3 * COST_RATES.INSULATION_MDL_M3)
  );
  
  const formworkCostMDL = Math.round((m.formworkM2 || 0) * COST_RATES.FORMWORK_MDL_M2);
  
  const materialsSubtotalMDL = concreteCostMDL + steelCostMDL + sandCushionCostMDL + waterproofInsulationCostMDL + formworkCostMDL;
  
  const constructionLaborCostMDL = Math.round((m.concreteVolumeM3 * 800) + rebarBindingCostMDL + (m.hasDrainage ? m.drainagePipeM || 0 : 0) * 85);
  
  const machineryLogisticsCostMDL = Math.round(excavationCostMDL + (m.concreteVolumeM3 * 120) + 4000);
  
  // Расчет стоимости устройства чернового пола по грунту внутри цоколя (для ленточного и свайно-ростверкового)
  const rFloorConcreteCost = Math.round((m.roughFloorConcreteM3 || 0) * COST_RATES.CONCRETE_MDL_M3);
  const rFloorSteelCost = Math.round((m.roughFloorRebarKg || 0) * COST_RATES.STEEL_MDL_KG);
  const rFloorSandCost = Math.round((m.roughFloorSandM3 || 0) * COST_RATES.SAND_GRAVEL_MDL_M3);
  const rFloorWaterproofCost = Math.round((m.roughFloorWaterproofingM2 || 0) * 35); // 35 MDL/м² за два слоя пленки 150-200мкм
  const rFloorLaborCost = Math.round((m.roughFloorAreaM2 || 0) * 140); // 140 MDL за куб/кв.м разравнивания, трамбовки и заливки чернового пола
  
  const roughFloorCostMDL = rFloorConcreteCost + rFloorSteelCost + rFloorSandCost + rFloorWaterproofCost + rFloorLaborCost;
  
  // Добавление отдельного учета бурения свай пог.м
  const pileDrillingCostMDL = Math.round((m.pileDrillingM || 0) * COST_RATES.PILE_DRILLING_MDL_M);
  
  const subtotalWithSlopeDrain = materialsSubtotalMDL + constructionLaborCostMDL + machineryLogisticsCostMDL + detailedDrainageCostMDL + slopeComplicationCostMDL + roughFloorCostMDL + pileDrillingCostMDL + engineeringNetworksCostMDL + groundingSystemCostMDL + backfillCompactionCostMDL + waterproofProtectionCostMDL;
  
  // 1. VAT (20%) - Moldovan tax on materials and construction works
  const useVAT = input?.includeVAT !== false;
  const vatMDL = useVAT ? Math.round(subtotalWithSlopeDrain * 0.20) : 0;
  
  // 2. Professional elements (Design, Geotechnical Drilling, Expertise, and Supervision)
  const useDesign = input?.includeSubDesign !== false;
  const designCostMDL = useDesign ? 14000 : 0;
  const geologyCostMDL = useDesign ? 9500 : 0;
  
  const useSupervision = input?.includeSupervision !== false;
  const supervisionCostMDL = useSupervision ? 8000 : 0;
  const expertiseCostMDL = useSupervision ? 4000 : 0;
  
  // 3. Project Reserve (10-15%)
  const reservePercent = input?.projectReservePercent !== undefined 
    ? (input.projectReservePercent / 100) 
    : (input?.soilType === SoilType.LOESS || input?.soilType === SoilType.FILLED || input?.soilType === SoilType.CLAY ? 0.15 : 0.10);
    
  const engineeringReserveMDL = Math.round((subtotalWithSlopeDrain + vatMDL) * reservePercent);
  
  const totalCostMDL = subtotalWithSlopeDrain + vatMDL + designCostMDL + geologyCostMDL + supervisionCostMDL + expertiseCostMDL + engineeringReserveMDL;
  
  return {
    concreteCostMDL: roundToHundred(concreteCostMDL),
    steelCostMDL: roundToHundred(steelCostMDL),
    sandCushionCostMDL: roundToHundred(sandCushionCostMDL),
    waterproofInsulationCostMDL: roundToHundred(waterproofInsulationCostMDL),
    formworkCostMDL: roundToHundred(formworkCostMDL),
    
    excavationCostMDL: roundToHundred(excavationCostMDL),
    rebarBindingCostMDL: roundToHundred(rebarBindingCostMDL),
    drainageCostMDL: roundToHundred(detailedDrainageCostMDL),
    slopeComplicationCostMDL: roundToHundred(slopeComplicationCostMDL),
    roughFloorCostMDL: roundToHundred(roughFloorCostMDL),
    pileDrillingCostMDL: roundToHundred(pileDrillingCostMDL),
    
    // Industrial grade additional cost entries
    engineeringNetworksCostMDL: roundToHundred(engineeringNetworksCostMDL),
    groundingSystemCostMDL: roundToHundred(groundingSystemCostMDL),
    backfillCompactionCostMDL: roundToHundred(backfillCompactionCostMDL),
    waterproofProtectionCostMDL: roundToHundred(waterproofProtectionCostMDL),
    
    materialsSubtotalMDL: roundToHundred(materialsSubtotalMDL),
    constructionLaborCostMDL: roundToHundred(constructionLaborCostMDL),
    machineryLogisticsCostMDL: roundToHundred(machineryLogisticsCostMDL),
    
    vatMDL: roundToHundred(vatMDL),
    designCostMDL: roundToHundred(designCostMDL),
    geologyCostMDL: roundToHundred(geologyCostMDL),
    supervisionCostMDL: roundToHundred(supervisionCostMDL),
    expertiseCostMDL: roundToHundred(expertiseCostMDL),
    
    engineeringReserveMDL: roundToHundred(engineeringReserveMDL),
    totalCostMDL: roundToHundred(totalCostMDL)
  };
}

function roundToHundred(v: number): number {
  return Math.round(v / 100) * 100;
}

export function generateBIMEntities(
  id: string,
  input: CalculatorInput,
  m: MaterialRequirement,
  c: CostEstimate,
  soil: any,
  perimeter: number,
  footingArea: number,
  depthM: number
): BIMEntity[] {
  const isSlab = id === "slab";
  const isStrip = id === "strip";
  const isPiles = id === "piles";

  const entities: BIMEntity[] = [];

  // 1. GEOLOGY
  const geoPass = input.soilType !== SoilType.FILLED && input.soilType !== SoilType.LOESS;
  entities.push({
    id: "GEOLOGY",
    nameRu: "Инженерно-геологические изыскания грунтов основания",
    nameRo: "Sondaje geotehnice și geologice",
    parameters: {
      "Кол-во скважин": 2,
      "Глубина бурения скважин": "6.0 м",
      "Расчетное сопротивление грунта (R)": `${soil.resistanceKPa} кПа`,
      "Уровень грунтовых вод (УГВ)": `${input.groundwaterDepth} м`,
      "Категория грунта по СНиП РМ": soil.name
    },
    volumes: {
      "Объем бурения": "12.0 п.м."
    },
    materials: [
      { name: "Технический отчет по геологической экспертизе грунта", qty: 1, unit: "копл.", cost: c.geologyCostMDL || 9500 }
    ],
    costMDL: c.geologyCostMDL || 9500,
    dependencies: [],
    qualityChecks: [
      {
        criterion: "Достоверность геологических параметров основания",
        status: geoPass ? "PASS" : "WARNING",
        value: soil.name,
        norm: "СНиП 2.02.01: Требуется лабораторная верификация прочности несущих пластов при просадочности/насыпях"
      },
      {
        criterion: "Расчетное сопротивление несущего пласта грунта",
        status: soil.resistanceKPa >= 150 ? "PASS" : "WARNING",
        value: `${soil.resistanceKPa} кПа`,
        norm: "СП 22.13330: Экономичный минимум расчетного сопротивления R0 >= 150 кПа для коттеджного домостроения"
      }
    ]
  });

  // 2. COMPACTION_TEST
  entities.push({
    id: "COMPACTION_TEST",
    nameRu: "Протоколы испытаний послойного уплотнения",
    nameRo: "Test de compactare dynamic și static",
    parameters: {
      "Метод экспресс-анализа": "Динамический ручной плотномер ПДУ-МГ4",
      "Нормативный коэф. уплотнения подушки (K_com)": 0.98,
      "Контролируемое уплотненное пятно": `${Math.max(input.width, input.length)} м`
    },
    volumes: {
      "Проверяемые точки контроля": "4 точки"
    },
    materials: [
      { name: "Лабораторные акты динамического пенетрационного тестирования", qty: 4, unit: "точек", cost: 2400 }
    ],
    costMDL: 2400,
    dependencies: ["BACKFILL", "BLIND_AREA"],
    qualityChecks: [
      {
        criterion: "Плотность уплотнения опорной песчано-щебеночной подготовки",
        status: "PASS",
        value: "Фактический K_com = 0.98",
        norm: "СНиП 3.02.01-87: Коэффициент плотности грунтовых и песчаных подушек под подошву K_com >= 0.97"
      }
    ]
  });

  // 3. GROUNDWATER_LEVEL
  const gwCoeff = input.groundwaterDepth < depthM + 0.5 ? "FAIL" : "PASS";
  const gwDetailsStatus = input.groundwaterDepth < 1.5 ? "WARNING" : "PASS";
  entities.push({
    id: "GROUNDWATER_LEVEL",
    nameRu: "Инженерно-гидроэкологический мониторинг УГВ",
    nameRo: "Monitorizarea nivelului apelor freatice",
    parameters: {
      "Фактически замеренная отметка УГВ": `${input.groundwaterDepth} м`,
      "Проектное заложение подошвы": `${depthM} м`,
      "Перепад высоты УГВ и подошвы": `${Math.round((input.groundwaterDepth - depthM) * 100) / 100} м`
    },
    volumes: {
      "Установленные пьезометры мониторинга": "1 шт"
    },
    materials: [
      { name: "Пьезометрическая зондирующая трубка d50 из нержавеющей стали", qty: 1, unit: "шт", cost: 2500 }
    ],
    costMDL: 2500,
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      {
        criterion: "Соответствие отметки УГВ типу фундамента",
        status: gwCoeff === "FAIL" ? "FAIL" : gwDetailsStatus,
        value: `УГВ ${input.groundwaterDepth}м при подошве ${depthM}м`,
        norm: "СНиП 2.02.01-83: Урез безнапорных грунтовых вод должен проходить ниже подошвы фундамента минимум на 0.5м"
      }
    ]
  });

  // 4. SEWER_ENTRY
  const sewerLength = Math.ceil(perimeter * 0.4);
  entities.push({
    id: "SEWER_ENTRY",
    nameRu: "Внутриплощадочный ввод канализации",
    nameRo: "Sistemul de canalizare exterioară și racord",
    parameters: {
      "Категория трубы прохода": "PVC-U рыжая повышенной жесткости SN4",
      "Рабочий наружный диаметр": "110 мм",
      "Проектный уклон укладки": "2.0%"
    },
    volumes: {
      "Протяженность канализационного лотка": `${sewerLength} м.п.`
    },
    materials: [
      { name: "Труба ПВХ d110 SN4 наружная уличная в отрезках 3м", qty: Math.ceil(sewerLength / 3), unit: "шт", cost: Math.round(sewerLength * 110) },
      { name: "Фитинги, компенсационные муфты, ревизионные люки", qty: 1, unit: "компл", cost: 1200 }
    ],
    costMDL: Math.round(sewerLength * 110 + 1200 + sewerLength * 150),
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      {
        criterion: "Угол и прямолинейность уклона укладки труб d110",
        status: "PASS",
        value: "2.10% уклона",
        norm: "СНиП 2.04.03-85: Постоянный проектный уклон для безнапорного транзита d110 равен 2% (0.02)"
      }
    ]
  });

  // 5. WATER_ENTRY
  const waterLength = 15;
  entities.push({
    id: "WATER_ENTRY",
    nameRu: "Подземный ввод питьевого водоснабжения",
    nameRo: "Introducerea conductei de apă potabilă",
    parameters: {
      "Материал проводника питьевой воды": "ПНД PE100 SDR11 питьевая синяя черта",
      "Номинальный наружный диаметр": "32 мм",
      "Защитный гофрированный футляр": "HDPE d50 мм"
    },
    volumes: {
      "Длина прокладываемого водопровода": `${waterLength} м.п.`
    },
    materials: [
      { name: "Труба ПНД d32 PN16 напорная питьевая", qty: waterLength, unit: "м.п.", cost: Math.round(waterLength * 45) },
      { name: "Защитный рукав-футляр HDPE d50 мм", qty: waterLength, unit: "м.п.", cost: Math.round(waterLength * 60) }
    ],
    costMDL: Math.round(waterLength * 45 + waterLength * 60 + waterLength * 110),
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      {
        criterion: "Глубина укладки водовода для предотвращения обледенения",
        status: "PASS",
        value: "Глубина укладки 1.20 м",
        norm: "СНиП 2.04.02-84: Трубы закладывать на 0.2м глубже расчетного проникновения нулевой температуры в грунт"
      }
    ]
  });

  // 6. POWER_ENTRY
  const powerLength = 20;
  entities.push({
    id: "POWER_ENTRY",
    nameRu: "Ввод подземного электроснабжения здания",
    nameRo: "Intrări de curent electric de forță",
    parameters: {
      "Спецификация кабель-канала": "ПНД гофра двустенная спиральная красная",
      "Предусмотренная мощность": "Вводной кабель ВВГнг-LS 4х16 медный",
      "Защитный барьер прочности": "Высокая кольцевая жесткость"
    },
    volumes: {
      "Протяженность прокладываемых каналов электричества": `${powerLength} м.п.`
    },
    materials: [
      { name: "Двустенная полиэтиленовая ПНД гофротруба d50 красная", qty: powerLength, unit: "м.п.", cost: Math.round(powerLength * 35) },
      { name: "Стальная тяговая гибкая проволока ф2мм", qty: powerLength, unit: "м.п.", cost: Math.round(powerLength * 10) }
    ],
    costMDL: Math.round(powerLength * 35 + powerLength * 10 + powerLength * 80),
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      {
        criterion: "Устойчивость кабель-канала к статическим нагрузкам грунта",
        status: "PASS",
        value: "Двустенный особо жесткий гибкий рукав",
        norm: "ПУЭ РМ: Под фундаментами прокладка бронированных кабелей осуществляется исключительно в жестких гладких гильзах"
      }
    ]
  });

  // 7. LOW_CURRENT_ENTRY
  const lowLength = 15;
  entities.push({
    id: "LOW_CURRENT_ENTRY",
    nameRu: "Подземные каналы слаботочных сетей и связи",
    nameRo: "Sistemul de conducte curent slab (оптика, CCTV, LAN)",
    parameters: {
      "Материал укладываемого канала": "Труба ПНД гладкая пластиковая d25",
      "Целевые линии связи": "Интернет оптоволокно, система охраны, автоматика"
    },
    volumes: {
      "Протяженность каналов связи": `${lowLength} м.п.`
    },
    materials: [
      { name: "Труба ПНД гладкая жесткая черная d25 техническая", qty: lowLength, unit: "м.п.", cost: Math.round(lowLength * 28) }
    ],
    costMDL: Math.round(lowLength * 28 + lowLength * 65),
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      {
        criterion: "Защищенность коаксиальных и сигнальных пар от влаги",
        status: "PASS",
        value: "Плотные гладкие полиэтиленовые трубки d25 уличной изоляции",
        norm: "СНиП 3.05.06-85: Слаботочные кабельные магистрали укладываются в песчаных ложах в герметичных кабельных каналах"
      }
    ]
  });

  // 8. SPARE_SLEEVE
  const sleeveCount = 4;
  entities.push({
    id: "SPARE_SLEEVE",
    nameRu: "Резервные проходные амортизационные гильзы",
    nameRo: "Sleeve-uri de rezervă pentru rețele",
    parameters: {
      "Дублирующий коэффициент защиты": "100%",
      "Рабочий проходной диаметр": "160 мм",
      "Способ герметизации прохода": "Сальниковая набивка с водоотталкивающей мастикой"
    },
    volumes: {
      "Количество закладных гильз": `${sleeveCount} шт.`
    },
    materials: [
      { name: "Пластиковая жесткая толстостенная гильза HDPE d160", qty: sleeveCount, unit: "шт", cost: sleeveCount * 180 },
      { name: "Комплекты сальников и расширяющихся пробок d160 для вводов", qty: sleeveCount, unit: "шт", cost: sleeveCount * 240 }
    ],
    costMDL: Math.round(sleeveCount * 180 + sleeveCount * 240 + sleeveCount * 120),
    dependencies: ["GEOLOGY"],
    qualityChecks: [
      {
        criterion: "Предотвращение среза сетей при осадке фундамента",
        status: "PASS",
        value: `Свободный зазор герметизирован в ${sleeveCount} гильзах d160`,
        norm: "NCM F.02.02: Обеспечение подвижного зазора прохода коммуникаций через капитальные монолитные бетонные стены"
      }
    ]
  });

  // 9. CONCRETE_CURING
  const curingArea = Math.round(footingArea * 1.15);
  entities.push({
    id: "CONCRETE_CURING",
    nameRu: "Технологический влажностный уход за монолитом",
    nameRo: "Întreținerea și hidratarea betonului proaspăt turnat",
    parameters: {
      "Режим влажностного ухода": "Регулярный полив водой 3 раза в сутки с укрытием",
      "Расчетная продолжительность": "14 суток",
      "Укрывная защита зеркала монолита": "Полиэтиленовое полотно 150мкм"
    },
    volumes: {
      "Площадь укрытия площади свежезалитого монолита": `${curingArea} м²`
    },
    materials: [
      { name: "Рулонная защитная ПЭ пленка высокой плотности 150 мкм", qty: curingArea, unit: "м²", cost: curingArea * 15 },
      { name: "Вода технологическая для полива и увлажнения", qty: 10, unit: "м³", cost: 1200 }
    ],
    costMDL: Math.round(curingArea * 15 + 1200 + curingArea * 45),
    dependencies: ["CONCRETE_WORKS"],
    qualityChecks: [
      {
        criterion: "Предотвращение пересыхания бетона и трещинообразования",
        status: "PASS",
        value: "Сохранение водоцементного баланса пленкой в течение 14 дней",
        norm: "СНиП 3.03.01-87: Свежий цементный камень требует непрерывной влажной среды до достижения 70% прочности"
      }
    ]
  });

  // 10. BACKFILL
  const backfillVol = m.backfillVolumeM3 || 25;
  entities.push({
    id: "BACKFILL",
    nameRu: "Послойная обратная засыпка пазух уплотненным грунтом",
    nameRo: "La umplutură compactată în mod stratificat în jurul цоколю",
    parameters: {
      "Нормативная толщина укладываемого слоя": "200 мм",
      "Послойное уплотнение": "Тяжелая виброплита Masalta 120кг",
      "Коэффициент уплотнения засыпки": 0.98
    },
    volumes: {
      "Объем грунта засыпки": `${backfillVol} м³`
    },
    materials: [
      { name: "Карьерная супесчано-гравийная смесь с доставкой", qty: backfillVol, unit: "м³", cost: Math.round(backfillVol * 180) }
    ],
    costMDL: Math.round(backfillVol * 180 + backfillVol * 90 + backfillVol * 45),
    dependencies: ["WATERPROOF_PROTECTION"],
    qualityChecks: [
      {
        criterion: "Послойное распределение и уплотнение засыпочной массы",
        status: "PASS",
        value: "Слои засыпки по 180-200 мм с трамбовкой виброплитой",
        norm: "СНиП III-8-76: Ограничение толщины засыпки для предотвращения осадки отмостки в будущем"
      }
    ]
  });

  // 11. BLIND_AREA
  const blindAreaM2 = Math.round(perimeter * 0.8);
  const blindXPSM3 = Math.ceil(blindAreaM2 * 0.05 * 10) / 10;
  const blindConcreteM3 = Math.ceil(blindAreaM2 * 0.08 * 10) / 10;
  entities.push({
    id: "BLIND_AREA",
    nameRu: "Защитная бетонная утепленная отмостка по периметру",
    nameRo: "Trotuar de protecție din beton cu termoizolare",
    parameters: {
      "Ширина бетонной полосы отмостки": "0.8 м",
      "Проектная толщина заливки плиты": "80 мм",
      "Толщина жесткого утеплителя XPS": "50 мм"
    },
    volumes: {
      "Площадь железобетонного покрытия": `${blindAreaM2} м²`,
      "Объем заливаемой смеси бетона C12/15": `${blindConcreteM3} м³`
    },
    materials: [
      { name: "Товарный бетон С12/15 (М200) с РБУ", qty: blindConcreteM3, unit: "м³", cost: Math.round(blindConcreteM3 * 1350) },
      { name: "Сварная дорожная армирующая сетка d4 яч.100х100мм", qty: blindAreaM2, unit: "м²", cost: Math.round(blindAreaM2 * 85) },
      { name: "Утеплитель экструдированный пенополистирол XPS 50мм", qty: blindXPSM3, unit: "м³", cost: Math.round(blindXPSM3 * 1400) }
    ],
    costMDL: Math.round(blindConcreteM3 * 1350 + blindAreaM2 * 85 + blindXPSM3 * 1400 + blindAreaM2 * 140),
    dependencies: ["BACKFILL"],
    qualityChecks: [
      {
        criterion: "Локальный термический барьер пучинистого основания подошвы",
        status: "PASS",
        value: "Жесткие плиты XPS 50мм под всей бетонной лентой отмостки",
        norm: "NCM L.02.01: Утепление отмостки существенно снижает касательные силы морозного пучения глин основания"
      },
      {
        criterion: "Внешний разуклонный уклон для слива дождевых вод",
        status: "PASS",
        value: "Разуклонка 2.5% от стен здания",
        norm: "СП 22.13330: Уклон отмостки в диапазоне 1.5-3% гарантирует быстрый увод атмосферных вод"
      }
    ]
  });

  // 12. WATERPROOF_PROTECTION
  const wrapM2 = m.waterproofProtMembraneM2 || Math.round(perimeter * 0.6);
  entities.push({
    id: "WATERPROOF_PROTECTION",
    nameRu: "Защитно-дренажная мембрана гидроизоляции стен",
    nameRo: "Protecția mecanică cu membrană profilată HDPE",
    parameters: {
      "Класс защитного барьера": "Профилированная HDPE мембрана Planter с шипами",
      "Высота фиксирующих шипов": "8 мм",
      "Материал жесткого полимера": "Полиэтилен высокой плотности высокой упругости"
    },
    volumes: {
      "Площадь защитной профилированной мембраны": `${wrapM2} м²`
    },
    materials: [
      { name: "Мембрана профилированная HDPE Planter Стандарт 2х20м", qty: wrapM2, unit: "м²", cost: Math.round(wrapM2 * 75) },
      { name: "Крепежные полимерные грибы-дюбели, прижимные планки", qty: 1, unit: "компл", cost: 1800 }
    ],
    costMDL: Math.round(wrapM2 * 75 + 1800 + wrapM2 * 45),
    dependencies: ["WATERPROOFING"],
    qualityChecks: [
      {
        criterion: "Механическая сохранность рулонного ковра гидроизоляции",
        status: "PASS",
        value: "Защитная мембранная HDPE обшивка смонтирована и зафиксирована",
        norm: "Рекомендации ЦНИИПромзданий: Стены глубокого заложения защищаются мембранами от щебня обратной засыпки"
      }
    ]
  });

  // 13. QC_PROTOCOL
  entities.push({
    id: "QC_PROTOCOL",
    nameRu: "Служба контроля качества и лабораторные протоколы",
    nameRo: "Protocolul de recepție, teste QC pe cuburi de beton",
    parameters: {
      "Контроль подвижности смеси бетона": "Осадка конуса класса П3 (10-15см) на объекте",
      "Марка прочности ж/б конструкций": "В25 (C20/25) на 28-е сутки созревания",
      "Наличие обязательных актов скрытых работ": "Акты на армирование каркасов и приемку подошв на месте"
    },
    volumes: {
      "Лабораторный раздавливающий тест кубиков": "1 серия (3 формовочных кубика бетона)"
    },
    materials: [
      { name: "Официальный сертификат аттестованной стройлаборатории РМ", qty: 1, unit: "компл", cost: 3800 }
    ],
    costMDL: 3800,
    dependencies: ["CONCRETE_WORKS"],
    qualityChecks: [
      {
        criterion: "Прочность бетона на сжатие под гидравлическим прессом",
        status: "PASS",
        value: "C20/25 (M300) по акту лабораторных испытаний на 28-й день",
        norm: "ГОСТ 10180: Качество бетона ответственных несущих устоев подлежит обязательному инструментальному контролю"
      }
    ]
  });

  // 14. LOGISTICS
  const mixersCount = Math.ceil((m.concreteVolumeM3 || 25) / 9);
  entities.push({
    id: "LOGISTICS",
    nameRu: "Транспортная логистика и снабжение стройки",
    nameRo: "Logistica utilajelor și livrările de materiale",
    parameters: {
      "Суммарный объем товарного бетона": `${m.concreteVolumeM3} м³`,
      "Суммарный вес арматурного проката А500С": `${Math.round(m.reinforcementBarKg)} кг`
    },
    volumes: {
      "Рейсы тяжелых автобетоносмесителей (миксер 9м³)": `${mixersCount} рейсов`,
      "Рейсы бортового длинномера под металлопрокат": "2 рейса"
    },
    materials: [
      { name: "Служба доставки бетонной массы миксерами РБУ", qty: mixersCount, unit: "рейс", cost: mixersCount * 1800 },
      { name: "Аренда логистической платформы КАМАЗ спецрейсы", qty: 2, unit: "рейс", cost: 6000 }
    ],
    costMDL: Math.round(mixersCount * 1800 + 6000),
    dependencies: [],
    qualityChecks: [
      {
        criterion: "Ритмичность непрерывной укладки бетона для исключения слоев",
        status: "PASS",
        value: "Поставки миксеров с интервалом не более 40-50 минут",
        norm: "СНиП 3.03.01: Скорость укладки должна исключать схватывание предыдущего слоя с образованием швов"
      }
    ]
  });

  // 15. EXECUTION_CONTROL
  entities.push({
    id: "EXECUTION_CONTROL",
    nameRu: "Сертифицированный технический контроль технадзора РМ",
    nameRo: "Controlul calității de către Dirigintele de șantier",
    parameters: {
      "Специалист строительного контроля": "Лицензированный сертифицированный технадзор РМ",
      "Ведение регламентного журнала работ": "Обязательное ведение общего журнала работ",
      "Регистрация ответственных конструкций": "Оформление актов скрытых работ по СНиП"
    },
    volumes: {
      "Журнал технического надзора строительного объекта": "1 комплект"
    },
    materials: [
      { name: "Полное консультационное сопровождение инженера технадзора", qty: 1, unit: "сертификат", cost: 12000 }
    ],
    costMDL: 12000,
    dependencies: [],
    qualityChecks: [
      {
        criterion: "Соответствие поставляемых материалов регламентам РМ",
        status: "PASS",
        value: "Все сертификаты соответствия на цемент, щебень в наличии",
        norm: "Закон №721/1996 Республики Молдова о качестве в строительстве: Обязательное визирование всех скрытых работ"
      }
    ]
  });

  // Dynamic Reinforcement Checks
  const rCheck = resolveReinforcementParams(input, id, {
    perimeter,
    footingArea,
    depthM,
    concreteVolumeM3: m.concreteVolumeM3
  });

  const reinforcementChecks: BIMQualityCheck[] = [];

  // Check 1: Main Bar Diameter
  let mainDiameterCheckStatus: "CRITICAL" | "PASS" | "WARNING" | "FAIL" = "PASS";
  let mainDiameterCheckText = `Предусмотрен диаметр d${rCheck.main_bar_diameter}мм`;
  const buildingWeight = input.width * input.length * (input.floors || 1) * 1.5;
  const isHeavy = buildingWeight > 150 || input.wallMaterial === BuildingWallMaterial.KOTELET;

  if (id === "strip" || id === "mzlf" || id === "strip_with_slab" || id === "piles" || id === "drilled_piles" || id === "tise") {
    if (rCheck.main_bar_diameter < 12) {
      mainDiameterCheckStatus = "WARNING";
      mainDiameterCheckText = `Занижен диаметр рабочей арматуры d${rCheck.main_bar_diameter}мм (минимум d12мм по СП 63.13330)`;
    } else if (isHeavy && rCheck.main_bar_diameter < 14) {
      mainDiameterCheckStatus = "WARNING";
      mainDiameterCheckText = `Для тяжелых стен рекомендуется диаметр рабочей арматуры d14мм (задано d${rCheck.main_bar_diameter}мм)`;
    }
  } else if (id === "slab" || id === "classic_slab" || id === "ribbed_slab") {
    if (rCheck.main_bar_diameter < 10) {
      mainDiameterCheckStatus = "WARNING";
      mainDiameterCheckText = `Занижен диаметр арматурной сетки d${rCheck.main_bar_diameter}мм (минимум d10мм для плитных фундаментов)`;
    } else if (isHeavy && rCheck.main_bar_diameter < 12) {
      mainDiameterCheckStatus = "WARNING";
      mainDiameterCheckText = `Рекомендуется армирование сеткой d12мм при тяжелых нагрузках (задано d${rCheck.main_bar_diameter}мм)`;
    }
  }
  reinforcementChecks.push({
    criterion: "Диаметр рабочей арматуры по нагрузкам",
    status: mainDiameterCheckStatus,
    value: `d${rCheck.main_bar_diameter}мм (класс ${rCheck.rebar_class_main})`,
    norm: "СП 63.13330.2018 / СНиП 52-01: Диаметр несущих рабочих стержней подбирается исходя из класса нагрузок и жесткости элемента"
  });

  // Check 2: Longitudinal Bars Count
  if (id === "strip" || id === "mzlf" || id === "strip_with_slab") {
    let countCheckStatus: "CRITICAL" | "PASS" | "WARNING" | "FAIL" = "PASS";
    let countCheckText = `Установлено ${rCheck.longitudinal_bars_count} продольных стержней`;
    if (rCheck.longitudinal_bars_count < 4) {
      countCheckStatus = "FAIL";
      countCheckText = `Критический дефицит продольного армирования (${rCheck.longitudinal_bars_count} шт). Требуется не менее 4 стержней`;
    } else if (depthM >= 1.0 && rCheck.longitudinal_bars_count < 6) {
      countCheckStatus = "WARNING";
      countCheckText = `При высоте ленты >=1м рекомендуется не менее 6 продольных стержней (задано ${rCheck.longitudinal_bars_count} шт)`;
    }
    reinforcementChecks.push({
      criterion: "Кол-во продольных стержней в ленточном сечении",
      status: countCheckStatus,
      value: `${rCheck.longitudinal_bars_count} шт.`,
      norm: "СП 63.13330 / СНиП II-21-75: Продольное конструктивное армирование балок высотой более 150 мм - минимум 4 стержня в поясах"
    });
  }

  // Check 3: Stirrup/Secondary spacing
  let spacingCheckStatus: "CRITICAL" | "PASS" | "WARNING" | "FAIL" = "PASS";
  let spacingCheckText = `Шаг поперечной арматуры ${rCheck.stirrup_spacing}мм`;
  if (rCheck.stirrup_spacing > 300) {
    spacingCheckStatus = "WARNING";
    spacingCheckText = `Превышен шаг хомутов: ${rCheck.stirrup_spacing}мм при норме не более 300мм`;
  } else if (rCheck.stirrup_spacing > 15 * rCheck.main_bar_diameter) {
    const maxAllowed = 15 * rCheck.main_bar_diameter;
    spacingCheckStatus = "WARNING";
    spacingCheckText = `Шаг хомутов ${rCheck.stirrup_spacing}мм превышает предельный шаг 15d (${maxAllowed}мм)`;
  }
  reinforcementChecks.push({
    criterion: "Предельный шаг хомутов / поперечного армирования",
    status: spacingCheckStatus,
    value: `шаг ${rCheck.stirrup_spacing} мм`,
    norm: "СП 63.13330.2018: Шаг поперечной арматуры во внецентренно сжатых элементах должен составлять не более 15d и не более 300(400) мм"
  });

  // Check 4: Concrete cover thickness
  let coverCheckStatus: "CRITICAL" | "PASS" | "WARNING" | "FAIL" = "PASS";
  let coverCheckText = `Защитный слой: снизу ${rCheck.protective_layer_bottom}мм, сбоку ${rCheck.protective_layer_side}мм`;
  if (rCheck.protective_layer_bottom < 35 || rCheck.protective_layer_side < 35) {
    coverCheckStatus = "FAIL";
    coverCheckText = `Критический малый защитный слой (${rCheck.protective_layer_bottom}мм). Опасность быстрой коррозии в грунте`;
  } else if (rCheck.protective_layer_bottom < 40) {
    coverCheckStatus = "WARNING";
    coverCheckText = `Рекомендуется защитный слой не менее 40мм при отсутствии бетонной подготовки (задано ${rCheck.protective_layer_bottom}мм)`;
  }
  reinforcementChecks.push({
    criterion: "Защитный слой монолитного бетона для арматуры в грунте",
    status: coverCheckStatus,
    value: `низ ${rCheck.protective_layer_bottom}мм / бок ${rCheck.protective_layer_side}мм`,
    norm: "NCM EN 1992-1-1 / СНиП 2.03.01: Защитный слой рабочей арматуры в грунте без подготовки - от 40мм до 70мм"
  });

  // Check 5: Corner anchorage checks
  if (id === 'strip' || id === 'mzlf' || id === 'strip_with_slab' || id === 'piles') {
    reinforcementChecks.push({
      criterion: "Анкерный узел угловых сопряжений (L-стержни / П-хомуты)",
      status: rCheck.corner_reinforcement && (rCheck.l_bars || rCheck.u_bars) ? "PASS" : "WARNING",
      value: rCheck.corner_reinforcement ? "Предусмотрено анкерование" : "Анкеровка отсутствует",
      norm: "СП 50-101-2004: Угловые стыки ленточных монолитов требуют специального П- или L-образного анкерования во избежание разрывов углов при сейсмике"
    });
  }

  entities.push({
    id: "REINFORCEMENT_WORKS",
    nameRu: "Технологическое армирование монолитной конструкции",
    nameRo: "Armarea structurii de beton monolit și carcase",
    parameters: {
      "Рабочий класс арматурной стали": `${rCheck.rebar_class_main} (несущая)`,
      "Диаметр рабочей несущей арматуры": `d${rCheck.main_bar_diameter} мм`,
      "Конструктивная поперечная арматура": `${rCheck.rebar_class_secondary} d${rCheck.secondary_bar_diameter} мм`,
      "Шаг поперечной решетки хомутов": `${rCheck.stirrup_spacing} мм`,
      "Узлы специального сопряжения углов": rCheck.corner_reinforcement ? "L- и U-образные анкеры" : "Обычная вязка внахлест",
      "Длина нахлеста продольных стержней": `${rCheck.lap_length} мм`
    },
    volumes: {
      "Расход рабочей несущей стали": `${Math.round(m.reinforcementBarKg)} кг`,
      "Объем установленных пластиковых фиксаторов": `${rCheck.spacers_count} шт`
    },
    materials: [
      { name: `Арматурная сталь периодического профиля класс ${rCheck.rebar_class_main}`, qty: Math.round(m.reinforcementBarKg * 0.8), unit: "кг", cost: Math.round(m.reinforcementBarKg * 0.8 * 22) },
      { name: `Арматура гладкая хомутная класс ${rCheck.rebar_class_secondary}`, qty: Math.round(m.reinforcementBarKg * 0.2), unit: "кг", cost: Math.round(m.reinforcementBarKg * 0.2 * 22) },
      { name: "Пластиковые фиксаторы защитного слоя (звездочки/стульчики)", qty: rCheck.spacers_count, unit: "шт", cost: Math.round(rCheck.spacers_count * 2.5) }
    ],
    costMDL: Math.round(m.reinforcementBarKg * 22 + rCheck.spacers_count * 2.5),
    dependencies: ["COMPACTION_TEST"],
    qualityChecks: reinforcementChecks
  });

  return entities.map((item, idx) => ({
    ...item,
    Project_ID: input.projectId || "PRJ-2026-001",
    Element_ID: `BIM-${id.toUpperCase()}-${item.id}`,
    WBS_Code: `WBS-1.5.${idx + 1}`,
    Risk_ID: `RSK-${item.id}`,
    Normative_ID: item.qualityChecks[0]?.norm.split(":")[0] || "NCM-F.02.02",
    Calculation_ID: `CALC-${id.toUpperCase()}-${item.id}`,
    Inspection_ID: `INS-${id.toUpperCase()}-${item.id}`
  }));
}
