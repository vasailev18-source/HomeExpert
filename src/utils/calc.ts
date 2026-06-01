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
  CostEstimate
} from "../types";

// 1. Moldova Regional Constants (NCM G.01.01 & СНиП II-7-81*)
export const REGION_DATA: Record<MoldovaRegion, RegionDetails> = {
  [MoldovaRegion.CENTER]: {
    name: "Центр (Кишинёв, Орхей, Унгень)",
    cities: "Кишинёв, Оргеев, Унгены, Хынчешты, Криуляны",
    frostDepth: 0.8, // 80 cm
    snowLoad: 0.9,    // 0.90 kPa (90 kg/m2)
    windLoad: 0.36,   // 0.36 kPa
    seismicPoints: 7,
    seismicCoeff: 0.1, // A = 0.1
    beltMandatory: true
  },
  [MoldovaRegion.NORTH]: {
    name: "Север (Бэлць, Бричень, Сорока)",
    cities: "Бельцы, Сороки, Бричаны, Единец, Глодяны, Фалешты",
    frostDepth: 1.0, // 100 cm
    snowLoad: 1.1,    // 1.10 kPa (110 kg/m2)
    windLoad: 0.42,   // 0.42 kPa
    seismicPoints: 6.5,
    seismicCoeff: 0.05, // A = 0.05
    beltMandatory: true
  },
  [MoldovaRegion.SOUTH]: {
    name: "Юг (Кагул, Комрат, Тараклия)",
    cities: "Кагул, Комрат, Чадыр-Лунга, Тараклия, Вулканешты",
    frostDepth: 0.7, // 70 cm
    snowLoad: 0.75,   // 0.75 kPa (75 kg/m2)
    windLoad: 0.32,   // 0.32 kPa
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
  [SoilType.LOAM]: {
    id: SoilType.LOAM,
    name: "Суглинок (Luto-argilos)",
    resistanceKPa: 200, // 2.0 kg/cm2
    description: "Наиболее распространенный грунт в Молдове. Имеет умеренную несущую способность. Склонен к морозному пучению при высоком УГВ.",
    heavingRisk: 0.5,
    collapsibilityRisk: 0.2
  },
  [SoilType.CLAY]: {
    id: SoilType.CLAY,
    name: "Глина пластичная (Argilă)",
    resistanceKPa: 150, // 1.5 kg/cm2
    description: "Тяжелый пучинистый грунт. Хорошо держит воду. Склонен к значительным деформациям при замачивании. Требует утепления отмостки.",
    heavingRisk: 0.9,
    collapsibilityRisk: 0.4
  },
  [SoilType.SAND]: {
    id: SoilType.SAND,
    name: "Песок средней крупности (Nisip mediu)",
    resistanceKPa: 280, // 2.8 kg/cm2
    description: "Прекрасный непучинистый дренирующий грунт. Высокая несущая способность, минимальные осадки. Встречается в долинах рек Днестр и Прут.",
    heavingRisk: 0.1,
    collapsibilityRisk: 0.0
  },
  [SoilType.LOESS]: {
    id: SoilType.LOESS,
    name: "Лёссовый просадочный грунт (Cernoziom lëssoid, I-II тип)",
    resistanceKPa: 110, // 1.1 kg/cm2 - dangerous!
    description: "Специфический лессовый суглинок юга и центра Молдовы. Несущая способность резко падает при замачивании! Происходит резкая просадка основания.",
    heavingRisk: 0.4,
    collapsibilityRisk: 0.9
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
  
  // Дренажный комплекс (защита от грунтовых вод):
  DRAIN_PIPE_MDL_M: 85,       // Дренажная перфорированная труба d110 в геотекстильном фильтре
  GEOTEXTILE_MDL_M2: 32,      // Геотекстиль Typar SF40 плотностью 120-150 г/м²
  CRUSHED_STONE_MDL_M3: 680,  // Щебень гранитный фракции 20-40 мм с карьера Ватич/Оргеев
  INSPECTION_WELL_MDL_PCS: 1350, // Смотровой дренажный ревизионный колодец d315 с крышкой
  
  LABOR_PERCENT: 0.45,        // Оплата строительной бригады (45% от материалов)
  MACHINERY_PERCENT: 0.15,    // Спецтехника (экскаватор JCB, бетононасос, трамбовка) - 15%
  CURRENCY_RATE_USD: 18.0     // 1 USD = 18 MDL (для расчета по требованию)
};

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
  
  // 4. Calculate LIVE / SERVICE LOAD
  // Household service load is 150 kg/m2 (1.5 kPa) as per NCM G.01.01
  const liveLoadPerM2 = 150; // kg/m2
  const liveLoadKg = footingArea * liveLoadPerM2 * (structuralFloors);
  const liveLoadTons = (liveLoadKg * 1.3) / 1000;
  
  // 5. Calculate CLIMATIC LOADS (Snow & Wind)
  const snowLoadKg = footingArea * (reg.snowLoad * 100);
  const snowLoadTons = (snowLoadKg * 1.4) / 1000; // 1.4 design factor
  
  const windArea = Math.max(input.width, input.length) * totalWallHeight;
  const windLoadKg = windArea * (reg.windLoad * 100);
  const windLoadTons = (windLoadKg * 1.4) / 1000;
  
  // 6. SEISMIC HORIZONTAL FORCE (СНиП II-7-81* & NCM F.02.02)
  // Note: Seismic equivalent force is a horizontal shearing force causing lateral loads.
  // It is analyzed separately for moments, shear, and edge stress checking,
  // rather than added to vertical gravity dead weight on the soil.
  const seismicMassTons = deadLoadSubtotalTons + (0.5 * liveLoadTons) + (0.5 * snowLoadTons);
  const beta = 2.7;
  const seismicForceTons = seismicMassTons * reg.seismicCoeff * beta;
  
  // Clean rounding for each components to prevent micro-decimal drifts
  const wallWeightTonsRounded = Math.round(wallWeightTons * 10) / 10;
  const slabWeightTonsRounded = Math.round(slabWeightTons * 10) / 10;
  const roofWeightTonsRounded = Math.round(roofWeightTons * 10) / 10;
  const liveLoadTonsRounded = Math.round(liveLoadTons * 10) / 10;
  const snowLoadTonsRounded = Math.round(snowLoadTons * 10) / 10;
  
  // 7. TOTAL FACTORED DESIGN WEIGHT FOR FOUNDATION (kN / tons)
  // Clean, transparent, exact math of vertical loads.
  const totalFactoredWeightTons = Math.round((wallWeightTonsRounded + slabWeightTonsRounded + roofWeightTonsRounded + liveLoadTonsRounded + snowLoadTonsRounded) * 10) / 10;
  
  // 8. GROUND BEARING CAPACITY Verification
  const soilBearingCapacityKPa = soil.resistanceKPa;
  const totalFactoredForceKN = totalFactoredWeightTons * 9.81;
  const bearingAreaRequiredM2 = Math.round(((totalFactoredForceKN * input.safetyFactor) / soilBearingCapacityKPa) * 100) / 100;
  
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
  const stripConcreteVolumeM3 = L_total * requiredStripWidthM * avgTotalHeight;
  
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
  // При метровой высоте ленты требуется 6 продольных стержней рабочей арматуры
  const numLongBarsStrip = avgTotalHeight >= 1.0 ? 6 : 4;
  const rebarLongitudinalDiameterStrip = (totalFactoredWeightTons > 150 || input.wallMaterial === BuildingWallMaterial.KOTELET) ? 14 : 12;
  const rebarLongWeightPerMeter = rebarLongitudinalDiameterStrip === 14 ? 1.21 : 0.888; // кг на 1 пог.м.
  const rebarLongitudinalKgStrip = L_total * numLongBarsStrip * 1.12 * rebarLongWeightPerMeter; // 12% на нахлесты
  
  // Поперечные хомуты d8мм А240/А500 с шагом 300мм
  const clampsCountStrip = Math.ceil(L_total / 0.3);
  const clampPerimeterStrip = 2 * (requiredStripWidthM - 0.08) + 2 * (avgTotalHeight - 0.08) + 0.25; // периметр хомута
  const rebarTransverseKgStrip = clampsCountStrip * clampPerimeterStrip * 0.395; // 0.395 кг/м для d8
  
  const reinforcementBarKgStrip = Math.round(rebarLongitudinalKgStrip + rebarTransverseKgStrip);
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
    rebarLongitudinalDiameter: rebarLongitudinalDiameterStrip,
    rebarTransverseDiameter: 8,
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
  const stripCost = compileDetailedBudget(stripMaterials, excavationCostStripMDL, rebarBindingCostStripMDL, drainageCostMDL, slopeComplicationCostStripMDL);
  
  let stripIsRecommended = false;
  let stripReliability = 85;
  let stripComplexity = 60;
  const stripPros = ["Капитальный классический вариант", "Надежность подтверждена десятилетиями", "Возможность легкого обустройства подпола или цоколя"];
  const stripCons = [
    `Большой объем земляных работ: ${Math.ceil(excavationVolumeM3Strip)} м³ разработано техникой`,
    `Требуются профессиональные плотницкие работы по опалубке (${formworkBoardsCount} шт. досок)`,
    "Долгий срок созревания бетона в щитах (28 суток по ГОСТ)"
  ];
  const stripRisks: string[] = [];
  
  if (input.soilType === SoilType.LOESS) {
    stripReliability -= 25;
    stripCons.push("Требуется широкая подошва при замачивании лёсса");
    stripRisks.push("Риск неравномерной просадки при аварийной утечке воды");
  }
  if (input.groundwaterDepth < (stripDepthM + 0.3)) {
    stripReliability -= 15;
    stripRisks.push("Опасность затопления траншеи при строительстве, ослабление грунта основания");
  }
  
  // --- OPTION 2: МОНОЛИТНАЯ ПЛИТА (Slab on Grade) ---
  const slabDepthM = 0.30; // Монолитная несущая плита 30 см (стандарт NCM)
  
  // При уклоне на плитный фундамент идет гигантский перерасход бетона на ростверк/цоколь и уплотненный песок для выравнивания
  const plinthHeightDiff = heightDiff / 2;
  const slabPlinthConcreteVolumeM3 = perimeter * 0.30 * plinthHeightDiff;
  const slabConcreteVolume = (footingArea * slabDepthM) + slabPlinthConcreteVolumeM3;
  
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
  
  // Армирование плиты двойной сеткой 200x200мм рабочей арматуры
  const rebarLongDiameterSlab = (totalFactoredWeightTons > 150 || structuralFloors >= 2) ? 12 : 10;
  const rebarLongWeightSlab = rebarLongDiameterSlab === 12 ? 0.888 : 0.617;
  
  // Расчет пог.м рабочей арматуры в двух сетках с шагом 200мм (5 прутьев на метр)
  const singleLayerBars = ((input.width / 0.2) + 1) * input.length + ((input.length / 0.2) + 1) * input.width;
  const rebarLongitudinalKgSlab = 2 * singleLayerBars * 1.15 * rebarLongWeightSlab; // 15% нахлест и торцевые П-образные хомуты
  
  // Фиксаторы шага сеток ("лягушки" из d8 А240, 1 шт на 1 м²)
  const rebarTransverseKgSlab = footingArea * 1.0 * 0.8 * 0.395; // 0.8м арматуры d8 на каждую лягушку
  const reinforcementBarKgSlab = Math.round(rebarLongitudinalKgSlab + rebarTransverseKgSlab);
  const rebarBindingCostSlabMDL = Math.round(reinforcementBarKgSlab * COST_RATES.REBAR_BINDING_LABOR_MDL_KG);
  
  const slabWaterproofM2 = footingArea * 1.15; // гидроизоляция под подошву клином с нахлестом
  const slabInsulationM3 = (footingArea * 0.10) + (perimeter * 0.4 * 0.05); // утеплитель под всей плитой 100мм + торец цоколя
  
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
    rebarLongitudinalDiameter: rebarLongDiameterSlab,
    rebarTransverseDiameter: 8,
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
    
  const slabCost = compileDetailedBudget(slabMaterials, excavationCostSlabMDL, rebarBindingCostSlabMDL, drainageCostMDL, slopeComplicationCostSlabMDL);
  
  let slabIsRecommended = false;
  let slabReliability = 98;
  let slabComplexity = 75;
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
    slabReliability = 99;
  }
  
  // --- OPTION 3: СВАЙНО-РОСТВЕРКОВЫЙ (Pile & Grade Beam) ---
  const pileCount = Math.ceil(perimeter / 1.5) + (structuralFloors > 1 ? 4 : 2);
  
  // На уклоне сваи бурятся на стандартную глубину, но часть ростверка приподнимается над землей (низкое удорожание!)
  const singlePileVolume = Math.PI * 0.15 * 0.15 * 2.2;
  const pilesConcreteVolume = pileCount * singlePileVolume * (1 + slopeFrac * 0.2);
  
  const beamHeightM = 0.45;
  const beamWidthM = 0.40;
  const beamVolume = perimeter * beamWidthM * beamHeightM * (1 + slopeFrac * 0.4);
  const pileStripConcreteVolume = pilesConcreteVolume + beamVolume;
  
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
  
  // Армирование свай: 4 стержня вертикальной d12 А500С в каждую сваю с выпуском по 30см в ростверк
  const rebarLongVerticalPileKg = pileCount * 4 * (2.2 + 0.3) * 1.1 * 0.888;
  const rebarTransverseSpiralPileKg = pileCount * 4.5;
  
  // Армирование ростверка: 4 горизонтальных стержня d12 А500С
  const rebarLongHorizontalBeamKg = perimeter * 4 * 1.12 * 0.888;
  const clampsCountBeam = Math.ceil(perimeter / 0.3);
  const clampPerimeterBeam = 2 * (beamWidthM - 0.08) + 2 * (beamHeightM - 0.08) + 0.20;
  const rebarTransverseBeamKg = clampsCountBeam * clampPerimeterBeam * 0.395;
  
  const rebarLongitudinalKgPile = rebarLongVerticalPileKg + rebarLongHorizontalBeamKg;
  const rebarTransverseKgPile = rebarTransverseSpiralPileKg + rebarTransverseBeamKg;
  const reinforcementBarKgPile = Math.round(rebarLongitudinalKgPile + rebarTransverseKgPile);
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
    roughFloorWaterproofingM2: Math.ceil(rFloorWaterproofingM2Pile)
  };
  
  // Миноритари за уклон на сваях
  const slopeComplicationCostPileMDL = input.landSlope > 0
    ? Math.round(perimeter * (input.landSlope / 100) * 400)
    : 0;
    
  const pileCost = compileDetailedBudget(pileMaterials, excavationCostPileMDL, rebarBindingCostPileMDL, drainageCostMDL, slopeComplicationCostPileMDL);
  
  let pileIsRecommended = false;
  let pileReliability = 80;
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
    pileReliability = 90;
  }
  if (input.soilType === SoilType.LOESS) {
    pileReliability -= 20;
    pileRisks.push("Просадка грунта может оголить сваи, вызвав потерю сцепления по бокам");
  }
  
  // Set default recommendation
  if (!stripIsRecommended && !slabIsRecommended && !pileIsRecommended) {
    if (wallWeightTons > 120 || input.hasBasement) {
      stripIsRecommended = true;
    } else {
      slabIsRecommended = true;
    }
  }
  
  options.push({
    id: "strip",
    type: "Ленточный монолитный (глубокого заложения)",
    nameRu: "Ленточный монолитный глубокого заложения",
    isRecommended: stripIsRecommended,
    costMDL: stripCost.totalCostMDL,
    reliabilityScore: stripReliability,
    complexityScore: stripComplexity,
    pros: stripPros,
    cons: stripCons,
    risks: stripRisks,
    materials: stripMaterials,
    costEstimate: stripCost,
    widthM: requiredStripWidthM,
    depthM: Math.round(stripDepthM * 100) / 100
  });
  
  options.push({
    id: "slab",
    type: "Утепленная шведская плита (УШП)",
    nameRu: "Мелкозаглубленная утепленная шведская плита (УШП) по специальному теплотехническому расчету",
    isRecommended: slabIsRecommended,
    costMDL: slabCost.totalCostMDL,
    reliabilityScore: slabReliability,
    complexityScore: slabComplexity,
    pros: slabPros,
    cons: slabCons,
    risks: slabRisks,
    materials: slabMaterials,
    costEstimate: slabCost,
    widthM: Math.max(input.width, input.length),
    depthM: slabDepthM
  });
  
  options.push({
    id: "piles",
    type: "Свайно-ростверковый фундамент",
    nameRu: "Буронабивной свайно-ростверковый",
    isRecommended: pileIsRecommended,
    costMDL: pileCost.totalCostMDL,
    reliabilityScore: pileReliability,
    complexityScore: pileComplexity,
    pros: pilePros,
    cons: pileCons,
    risks: pileRisks,
    materials: pileMaterials,
    costEstimate: pileCost,
    widthM: 0.4,
    depthM: 2.2
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
  
  return {
    input,
    wallWeightTons: Math.round(wallWeightTons * 10) / 10,
    slabWeightTons: Math.round(slabWeightTons * 10) / 10,
    roofWeightTons: Math.round(roofWeightTons * 10) / 10,
    deadLoadSubtotalTons: Math.round(deadLoadSubtotalTons * 10) / 10,
    liveLoadTons: Math.round(liveLoadTons * 10) / 10,
    snowLoadTons: Math.round(snowLoadTons * 10) / 10,
    windLoadTons: Math.round(windLoadTons * 10) / 10,
    seismicForceTons: Math.round(seismicForceTons * 10) / 10,
    totalFactoredWeightTons,
    bearingAreaRequiredM2: Math.round(bearingAreaRequiredM2 * 10) / 10,
    soilBearingCapacityKPa,
    options,
    frostHeavingPercent,
    collapsibilityPercent,
    floodingPercent
  };
}

/**
 * Advanced detailed budget compiling to nearest hundred.
 */
function compileDetailedBudget(
  m: MaterialRequirement, 
  excavationCostMDL: number, 
  rebarBindingCostMDL: number, 
  drainageCostMDL: number,
  slopeComplicationCostMDL: number
): CostEstimate {
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
  
  const subtotalWithSlopeDrain = materialsSubtotalMDL + constructionLaborCostMDL + machineryLogisticsCostMDL + drainageCostMDL + slopeComplicationCostMDL + roughFloorCostMDL;
  const engineeringReserveMDL = Math.round(subtotalWithSlopeDrain * 0.12);
  
  const totalCostMDL = subtotalWithSlopeDrain + engineeringReserveMDL;
  
  return {
    concreteCostMDL: roundToHundred(concreteCostMDL),
    steelCostMDL: roundToHundred(steelCostMDL),
    sandCushionCostMDL: roundToHundred(sandCushionCostMDL),
    waterproofInsulationCostMDL: roundToHundred(waterproofInsulationCostMDL),
    formworkCostMDL: roundToHundred(formworkCostMDL),
    
    excavationCostMDL: roundToHundred(excavationCostMDL),
    rebarBindingCostMDL: roundToHundred(rebarBindingCostMDL),
    drainageCostMDL: roundToHundred(drainageCostMDL),
    slopeComplicationCostMDL: roundToHundred(slopeComplicationCostMDL),
    roughFloorCostMDL: roundToHundred(roughFloorCostMDL),
    
    materialsSubtotalMDL: roundToHundred(materialsSubtotalMDL),
    constructionLaborCostMDL: roundToHundred(constructionLaborCostMDL),
    machineryLogisticsCostMDL: roundToHundred(machineryLogisticsCostMDL),
    engineeringReserveMDL: roundToHundred(engineeringReserveMDL),
    totalCostMDL: roundToHundred(totalCostMDL)
  };
}

function roundToHundred(v: number): number {
  return Math.round(v / 100) * 100;
}
