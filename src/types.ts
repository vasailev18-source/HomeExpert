/**
 * Types representing locations, parameters, and results for the
 * Moldovan Pre-Project Foundation Calculator & AI Expert.
 */

export enum MoldovaRegion {
  CENTER = "CENTER", // Кишинёв, Орхей
  NORTH = "NORTH",   // Бэлць, Бричень
  SOUTH = "SOUTH",   // Кагул, Комрат
}

export interface RegionDetails {
  name: string;
  cities: string;
  frostDepth: number; // in meters (e.g. 0.8)
  snowLoad: number;   // in kPa / kN/m2 (e.g. 0.9)
  windLoad: number;   // in kPa (e.g. 0.36)
  seismicPoints: number; // Richter points (e.g. 7)
  seismicCoeff: number; // Seismic coefficient A (e.g. 0.1)
  beltMandatory: boolean; // Is antiseismic belt required?
}

export enum BuildingWallMaterial {
  GASOBETON = "GASOBETON", // Газобетонные блоки (~400-600 kg/m3)
  KOTELET = "KOTELET",     // Молдавский котелец (limestone ~1800-2000 kg/m3)
  BRICK = "BRICK",         // Полнотелый/пустотелый кирпич (~1600-1800 kg/m3)
  KERAMZIT = "KERAMZIT",   // Керамзитобетонные блоки (~1200 kg/m3)
  FRAME = "FRAME",         // Деревянный каркас (~200 kg/m3)
}

export interface WallMaterialDetails {
  id: BuildingWallMaterial;
  name: string;
  density: number; // kg/m3
  typicalThickness: number; // meters (e.g. 0.4)
  description: string;
}

export enum SlabMaterial {
  MONOLITH = "MONOLITH", // Монолитный ж/б (2500 kg/m3)
  HOLLOW_CORE = "HOLLOW_CORE", // Круглопустотные плиты (1500 kg/m3)
  TIMBER = "TIMBER", // Деревянные балки (250 kg/m3)
}

export interface SlabDetails {
  id: SlabMaterial;
  name: string;
  density: number; // kg/m2 of slab (including design load) or kg/m3 (specific)
  weightPerM2: number; // total load per m2 in kg
}

export enum RoofType {
  GABLE_METAL = "GABLE_METAL", // Двускатная / Металлочерепица
  HIP_CERAMIC = "HIP_CERAMIC", // Вальмовая / Керамическая черепица
  FLAT_PVC = "FLAT_PVC",     // Плоская / ПВХ мембрана
  SHED_BOARD = "SHED_BOARD",   // Односкатная / Профнастил
}

export interface RoofDetails {
  id: RoofType;
  name: string;
  deadLoad: number; // kg/m2 of roof area
  angleDegrees: number; // typical slope
}

export enum SoilType {
  LOAM = "LOAM", // Суглинок (default)
  CLAY = "CLAY", // Глина
  SAND = "SAND", // Песок средний
  LOESS = "LOESS", // Лёсс / Просадочный суглинок (collapsible)
}

export interface SoilDetails {
  id: SoilType;
  name: string;
  resistanceKPa: number; // R in kPa (kN/m2)
  description: string;
  heavingRisk: number; // value from 0 to 1
  collapsibilityRisk: number; // value from 0 to 1
}

// Structural properties needed for calculation
export interface CalculatorInput {
  region: MoldovaRegion;
  customSoilType?: SoilType;
  customSoilResistance?: number; // User custom inputs if any
  
  // House geometry
  width: number; // meters
  length: number; // meters
  floors: number; // 1, 1.5 (мансарда counts as 1.5), 2, 3, 3.5 (3 floors + mansard)
  floorHeight: number; // meters (default 3.0)
  totalArea: number; // precalculated width * length * floors
  
  // Building structural components
  wallMaterial: BuildingWallMaterial;
  slabMaterial: SlabMaterial;
  roofType: RoofType;
  futureFlooringExtension: boolean; // Will double the floors calculation load for the foundation
  
  // Geotechnical
  soilType: SoilType;
  groundwaterDepth: number; // meters, e.g. 1.5
  safetyFactor: number; // e.g. 1.8
  landSlope: number; // land slope in percent (e.g. 0 to 15%)
  
  // Basement choice
  hasBasement: boolean;
}

// Calculated weights, pressures, sizing, specifications, and costs
export interface MaterialRequirement {
  concreteVolumeM3: number;
  reinforcementBarKg: number;
  sandGravelM3: number;
  waterproofingM2: number;
  insulationM3: number;

  // Ultra-detailed breakdown fields
  formworkM2?: number; // Formwork surface area in m2
  formworkBoardsCount?: number; // Standard 25x150x6000mm boards count
  excavationVolumeM3?: number; // Soil excavation volume in m3
  sandGravelWeightTons?: number; // Cushion weight in tons
  rebarLongitudinalKg?: number; // Weight of longitudinal rebar
  rebarTransverseKg?: number; // Weight of transverse rebar (clamps)
  rebarLongitudinalDiameter?: number; // mm (e.g. 12 or 14)
  rebarTransverseDiameter?: number; // mm (e.g. 8)
  hasDrainage?: boolean;
  drainagePipeM?: number;
  drainageGeotextileM2?: number;
  drainageStoneM3?: number;
  drainageWellsCount?: number;

  // Rough floor on ground (черновой пол по грунту) parameters
  roughFloorConcreteM3?: number;
  roughFloorRebarKg?: number;
  roughFloorSandM3?: number;
  roughFloorWaterproofingM2?: number;
  roughFloorAreaM2?: number;
}

export interface CostEstimate {
  concreteCostMDL: number;
  steelCostMDL: number;
  sandCushionCostMDL: number;
  waterproofInsulationCostMDL: number;
  formworkCostMDL: number;
  
  // Ultra-detailed breakdown costs
  excavationCostMDL?: number; // Heavy crawler excavator & manual touchups
  rebarBindingCostMDL?: number; // Wire binding, mesh layout labor
  drainageCostMDL?: number; // Perimeter drainage pipe, wells, geo, backfill
  slopeComplicationCostMDL?: number; // Slope work, stepping, retaining structures
  roughFloorCostMDL?: number; // Integrated rough concrete floor cost breakdown
  
  materialsSubtotalMDL: number;
  constructionLaborCostMDL: number;
  machineryLogisticsCostMDL: number;
  engineeringReserveMDL: number;
  
  totalCostMDL: number;
}

export interface FoundationOption {
  id: string; // recommended, economic, maximum
  type: string; // e.g. Ленточный монолитный
  nameRu: string;
  isRecommended: boolean;
  costMDL: number;
  reliabilityScore: number; // 0 - 100
  complexityScore: number; // 0 - 100
  pros: string[];
  cons: string[];
  risks: string[];
  materials: MaterialRequirement;
  costEstimate: CostEstimate;
  widthM: number;
  depthM: number;
}

export interface CalculationResults {
  input: CalculatorInput;
  
  // Dead loads computed
  wallWeightTons: number;
  slabWeightTons: number;
  roofWeightTons: number;
  deadLoadSubtotalTons: number;
  
  // Live loads (operational)
  liveLoadTons: number;
  
  // Climatic loads
  snowLoadTons: number;
  windLoadTons: number;
  
  // Seismic equivalent shearing force
  seismicForceTons: number;
  
  // Final composite Design Weight (including future loads if toggle is active)
  totalFactoredWeightTons: number;
  
  // Required bearing area
  bearingAreaRequiredM2: number;
  
  // Ground resistance R
  soilBearingCapacityKPa: number;
  
  // Foundation options comparisons
  options: FoundationOption[];
  
  // Geotechnical risks
  frostHeavingPercent: number;
  collapsibilityPercent: number;
  floodingPercent: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}
