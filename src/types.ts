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
  SAND = "SAND",               // Песок средний (Nisip mediu)
  SILTY_SAND = "SILTY_SAND",   // Песок пылеватый (Nisip fin/lutos)
  SANDY_LOAM = "SANDY_LOAM",   // Супесь (Nisip lutos)
  LOAM = "LOAM",               // Суглинок (Luto-argilos)
  CLAY = "CLAY",               // Глина (Argilă)
  LOESS = "LOESS",             // Лёсс / Просадочный суглинок (Cernoziom lëssoid)
  FILLED = "FILLED",           // Насыпной грунт (Pământ de umplutură)
  ROCK = "ROCK",               // Скальный грунт (Rocă stâncoasă)
}

export interface SoilDetails {
  id: SoilType;
  name: string;
  resistanceKPa: number; // R average in kPa
  Rmin: number;          // Minimum bearing capacity (kPa)
  Ravg: number;          // Average bearing capacity (kPa)
  Rmax: number;          // Maximum bearing capacity (kPa)
  Emin: number;          // Minimum soil deformation modulus in MPa
  Eavg: number;          // Average soil deformation modulus in MPa
  Emax: number;          // Maximum soil deformation modulus in MPa
  density: number;       // Soil bulk density in kg/m3
  poissonRatio: number;  // Poisson ratio
  settlementCoeff: number; // Dimensionless settlement coefficient omega
  frostHeaveSensitivity: string;  // "Низкая" | "Умеренная" | "Высокая"
  groundwaterSensitivity: string; // "Низкая" | "Умеренная" | "Высокая"
  description: string;
  heavingRisk: number; // value from 0 to 1
  collapsibilityRisk: number; // value from 0 to 1
}

// Structural properties needed for calculation
export interface CalculatorInput {
  projectId?: string;
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
  hasGeologyReport?: boolean; // If false/undefined, final foundation recommendation is blocked
  
  // Basement choice
  hasBasement: boolean;

  // Budget parameters
  includeVAT?: boolean;
  includeSubDesign?: boolean;
  includeSupervision?: boolean;
  projectReservePercent?: number;
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
  drainageWells400Count?: number; // d400 sediment inspection wells
  drainageCollectorWell?: number; // Main collections well pcs (KS-10 concrete rings)
  drainageSubmersiblePump?: number; // Drainage pump pcs
  
  // Engineering Networks
  engineeringNetWaterIntakeLengthM?: number; // Water intake HDPE length in m
  engineeringNetSewerageOutletsPcs?: number; // Sewerage discharge outlets
  engineeringNetPowerDuctLengthM?: number; // Corrugated electrical duct length
  engineeringNetWeakDuctLengthM?: number; // Weak-current PVC conduit length
  engineeringNetSpareDuctLengthM?: number; // Spare HDPE conduit length
  
  // Grounding safety loop
  groundingSteelStripM?: number; // Steel strip length in m
  groundingEarthRodsPcs?: number; // Earth vertical electrodes count
  groundingClampsPcs?: number; // Connection clamps

  // Backfill Compaction
  backfillVolumeM3?: number; // retaining wall pockets volume
  backfillCompactionCoeff?: number; // compaction coefficient
  backfillCompactionRuns?: number; // vibrating plate passes equivalent
  
  // Waterproof protection
  waterproofProtMembraneM2?: number; // Dimpled insulation protection membrane m2

  // Rough floor on ground (черновой пол по грунту) parameters
  roughFloorConcreteM3?: number;
  roughFloorRebarKg?: number;
  roughFloorSandM3?: number;
  roughFloorWaterproofingM2?: number;
  roughFloorAreaM2?: number;

  // Pile specific details
  pileCount?: number;
  pileDrillingM?: number;
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
  pileDrillingCostMDL?: number; // Explicit drilling cost for piles in MDL
  
  // Advanced engineering costs (Moldovan Market rates)
  engineeringNetworksCostMDL?: number; // d110 sewer conduits, PE water pipelines, conduits
  groundingSystemCostMDL?: number; // hot-dip galvanized strip safety contour
  backfillCompactionCostMDL?: number; // backfilling excavation pockets with layered compaction
  waterproofProtectionCostMDL?: number; // dimpled HDPE protective membrane sheet + profiles
  
  materialsSubtotalMDL: number;
  constructionLaborCostMDL: number;
  machineryLogisticsCostMDL: number;
  engineeringReserveMDL: number;

  // Professional bidding and design costs (NCM/Moldova market)
  vatMDL?: number;
  designCostMDL?: number;
  geologyCostMDL?: number;
  supervisionCostMDL?: number;
  expertiseCostMDL?: number;
  
  totalCostMDL: number;
}

export interface BIMEntityMaterial {
  name: string;
  qty: number;
  unit: string;
  cost: number;
}

export interface BIMQualityCheck {
  criterion: string;
  status: "PASS" | "WARNING" | "FAIL" | "CRITICAL";
  value: string;
  norm: string;
}

export interface BIMEntity {
  id: string; // e.g., GEOLOGY, COMPACTION_TEST, etc.
  nameRu: string;
  nameRo: string;
  parameters: Record<string, string | number>;
  volumes: Record<string, string | number>;
  materials: BIMEntityMaterial[];
  costMDL: number;
  dependencies: string[];
  qualityChecks: BIMQualityCheck[];

  // BIM & ERP Metadata (Stage 10)
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Risk_ID?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;
}

export interface GeologyLayer {
  name: string;
  thickness: number; // meters
  description: string;
}

export interface GeologyDetails {
  // BIM & ERP Metadata (Stage 10)
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Risk_ID?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;

  soil_type?: SoilType; // legacy support
  design_soil_resistance?: number; // legacy support
  groundwater_level?: number; // legacy support
  freezing_depth?: number; // legacy support
  deformation_modulus?: number; // legacy support

  Soil_Type: SoilType;
  Design_Resistance: number; // kPa
  Groundwater_Level: number; // meters
  Deformation_Modulus: number; // MPa
  Porosity: number;
  Frost_Heave_Index: number;
  Weak_Layer_Depth: number;
  Soil_Heterogeneity: number;
  Borehole_Count: number;
  Borehole_Depth: number;
  Safety_Factor: number;

  soil_layers: GeologyLayer[];

  // Expert Geotechnical Decision Output (Stage 3)
  suitabilitySlab: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  suitabilityStrip: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  suitabilityPiles: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  suitabilityUSH: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";

  scoreSlab: number;
  scoreStrip: number;
  scorePiles: number;
  scoreUSH: number;

  reasonSlab: string;
  reasonStrip: string;
  reasonPiles: string;
  reasonUSH: string;

  ratingOptions: { id: string; name: string; score: number; rank: number }[];
  soil_heterogeneity_factor?: number;
  number_of_boreholes?: number;
  borehole_depth?: number;
  safety_factor?: number;
  suitability_matrix: {
    id: string;
    type: string;
    suitability: string;
    settlementRiskCoeff: number;
  }[];
  recommendation_ranking: {
    id: string;
    rank: number;
    relativeEfficiencyScore: number;
    suitabilityNote: string;
  }[];
}

export interface UtilitySubsystemWork {
  name: string;
  qty: number;
  unit: string;
  cost: number;
}

export interface UtilitySubsystem {
  // BIM & ERP Metadata (Stage 10)
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Risk_ID?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;

  id: "SEWER" | "WATER" | "POWER" | "LOW_CURRENT" | "SPARE_SLEEVES";
  nameRu: string;
  nameRo: string;
  materials: BIMEntityMaterial[];
  works: UtilitySubsystemWork[];
  volumes: Record<string, string | number>;
  materialCostMDL: number;
  workCostMDL: number;
  costMDL: number;
  dependencies: string[];
  qualityChecks: BIMQualityCheck[];
  risks: string[];
}

export interface UtilitiesModel {
  sewer: UtilitySubsystem;
  water: UtilitySubsystem;
  power: UtilitySubsystem;
  lowCurrent: UtilitySubsystem;
  spareSleeves: UtilitySubsystem;
  totalCostMDL: number;
}

export interface ConcreteCuringModel {
  // BIM & ERP Metadata (Stage 10)
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Risk_ID?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;

  hasCuringSection: boolean;
  peFilmAreaM2: number;
  peFilmCostMDL: number;
  moisturizingDays: number;
  moisturizingVolumeM3: number;
  moisturizingCostMDL: number;
  winterProtectionRequired: boolean;
  winterCostMDL: number;
  antifreezeAdditiveQtyKg: number;
  antifreezeAdditiveCostMDL: number;
  holdingDays: number;
  totalCostMDL: number;
  materials: BIMEntityMaterial[];
  works: UtilitySubsystemWork[];
  qualityChecks: BIMQualityCheck[];
  risks: string[];

  // Dynamic values accessed by UI
  airTemperatureC?: number;
  methodDescription?: string;
  materialsNeeded?: BIMEntityMaterial[];
  qcRequirements?: BIMQualityCheck[];
}

export interface BackfillModel {
  // BIM & ERP Metadata (Stage 10)
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Risk_ID?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;

  excavationVolumeM3: number;
  constructionVolumeM3: number;
  backfillVolumeM3: number;
  materialName: string;
  materialQtyM3: number;
  materialCostMDL: number;
  compactionRuns: number;
  compactionCoeff: number;
  workCostMDL: number;
  totalCostMDL: number;
  materials: BIMEntityMaterial[];
  works: UtilitySubsystemWork[];
  qualityChecks: BIMQualityCheck[];

  // Dynamic values accessed by UI
  excavationM3?: number;
  concreteDisplacementM3?: number;
  netBackfillVolumeM3?: number;
  soilSwellFactor?: number;
  densityRequiredT_M3?: number;
  materialsNeeded?: BIMEntityMaterial[];
  optimalMoisturePercent?: number;
  compactionPasses?: number;
}

export interface BlindAreaModel {
  // BIM & ERP Metadata (Stage 10)
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Risk_ID?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;

  areaM2: number;
  widthM: number;
  thicknessMM: number;
  concreteVolumeM3: number;
  concreteCostMDL: number;
  rebarWeightKg: number;
  rebarCostMDL: number;
  xpsVolumeM3: number;
  xpsCostMDL: number;
  preparationSandM3: number;
  preparationSandCostMDL: number;
  workCostMDL: number;
  totalCostMDL: number;
  materials: BIMEntityMaterial[];
  works: UtilitySubsystemWork[];
  qualityChecks: BIMQualityCheck[];

  // Dynamic values accessed by UI
  perimeterM?: number;
  blindAreaWidthM?: number;
  excavationVolumeM3?: number;
  insulationXpsM3?: number;
  gravelBaseM3?: number;
  concreteC20_25M3?: number;
  reinforcingMeshKg?: number;
  materialsNeeded?: BIMEntityMaterial[];
}

export interface RiskItem {
  Risk_ID: string;
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;

  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  probability: number;
  impact: number;
  status: "ACTIVE" | "MITIGATED";
  mitigation: string;
  mitigation_cost_mdl?: number;
}

export interface OptionExplanation {
  optionId: string;
  optionName: string;
  isRecommended: boolean;
  reasons: string[];
  verdict: string;
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
  bimEntities: BIMEntity[];
  
  costScore?: number;
  riskScore?: number;
  energyScore?: number;
  geologyScore?: number;
  totalScore?: number;

  // BIM & ERP Metadata (Stage 10)
  Project_ID?: string;
  Element_ID?: string;
  WBS_Code?: string;
  Risk_ID?: string;
  Normative_ID?: string;
  Calculation_ID?: string;
  Inspection_ID?: string;
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
  seismicPGA: number;            // Peak ground acceleration (g)
  seismicImportanceFactor: number; // Gamma_I NCM/Eurocode
  seismicGroundTypeFactor: number; // S parameter
  seismicBehaviorFactor: number;   // q parameter
  seismicAmplification: number;    // Beta spectral amplification
  
  // Final composite Design Weight (including future loads if toggle is active)
  totalFactoredWeightTons: number;

  // Eurocode & NCM-specific load combinations
  scenarioASnowDominantTons: number; // Scenario A: Snow Dominant
  scenarioBLiveDominantTons: number; // Scenario B: Live Load Dominant
  seismicMassCombinationTons: number; // Accidental/Seismic Mass Combination
  
  // Required bearing area
  bearingAreaRequiredM2: number;
  
  // Ground resistance R
  soilBearingCapacityKPa: number;
  
  // Settlement Analysis Metrics (Stage 5)
  settlementTotalMM: number;       // S total (mm)
  settlementDiffMM: number;        // Delta S differential (mm)
  settlementUnequal: number;       // i (dimensionless fraction, mm/mm)
  settlementRiskCoeff: number;     // Kr risk factor (S / S_limit)
  settlementLimitMM: number;       // S_limit (mm)
  requiresGeotechnicalSurvey: boolean;
  
  // Foundation options comparisons
  options: FoundationOption[];
  
  // Geotechnical risks
  frostHeavingPercent: number;
  collapsibilityPercent: number;
  floodingPercent: number;

  // Comprehensive additions (Stage 3, 4, 5, 6, 7, 9)
  geology: GeologyDetails;
  utilities: UtilitiesModel;
  concreteCuring: ConcreteCuringModel;
  backfill: BackfillModel;
  blindArea: BlindAreaModel;
  risksList: RiskItem[];
  explanations: OptionExplanation[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}
