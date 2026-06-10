/**
 * Types representing locations, parameters, and results for the
 * Moldovan Pre-Project Foundation Calculator & AI Expert.
 */

export enum MoldovaRegion {
  CENTER = "CENTER", // Кишинёв, Орхей
  NORTH = "NORTH", // Бэлць, Бричень
  SOUTH = "SOUTH", // Кагул, Комрат
}

export interface RegionDetails {
  name: string;
  cities: string;
  frostDepth: number; // in meters (e.g. 0.8)
  snowLoad: number; // in kPa / kN/m2 (e.g. 0.9)
  windLoad: number; // in kPa (e.g. 0.36)
  seismicPoints: number; // Richter points (e.g. 7)
  seismicCoeff: number; // Seismic coefficient A (e.g. 0.1)
  beltMandatory: boolean; // Is antiseismic belt required?
}

export enum BuildingWallMaterial {
  GASOBETON = "GASOBETON", // Газобетонные блоки (~400-600 kg/m3)
  KOTELET = "KOTELET", // Молдавский котелец (limestone ~1800-2000 kg/m3)
  BRICK = "BRICK", // Полнотелый/пустотелый кирпич (~1600-1800 kg/m3)
  KERAMZIT = "KERAMZIT", // Керамзитобетонные блоки (~1200 kg/m3)
  FRAME = "FRAME", // Деревянный каркас (~200 kg/m3)
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
  HOLLOW_CORE = "HOLLOW_CORE", // Круглопустотные плиты (ПК - 1500 kg/m3)
  PB_SLAB = "PB_SLAB", // Плиты ПБ (Экструдерные - 1600 kg/m3)
  TIMBER = "TIMBER", // Деревянные балки (250 kg/m3)
  COMBINED = "COMBINED", // Комбинированные (Сборно-монолитные - 1300 kg/m3)
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
  HIP_METAL = "HIP_METAL", // Вальмовая / Металлочерепица (популярно)
  GABLE_SHINGLE = "GABLE_SHINGLE", // Двускатная / Мягкая битумная черепица
  FLAT_PVC = "FLAT_PVC", // Плоская / ПВХ мембрана
  SHED_BOARD = "SHED_BOARD", // Односкатная / Профнастил
  COMPOSITE_TILE = "COMPOSITE_TILE", // Композитная черепица
}

export interface RoofDetails {
  id: RoofType;
  name: string;
  deadLoad: number; // kg/m2 of roof area
  angleDegrees: number; // typical slope
}

export enum SoilType {
  SAND = "SAND", // Песок средний (Nisip mediu)
  SILTY_SAND = "SILTY_SAND", // Песок пылеватый (Nisip fin/lutos)
  SANDY_LOAM = "SANDY_LOAM", // Супесь (Nisip lutos)
  LOAM = "LOAM", // Суглинок (Luto-argilos)
  CLAY = "CLAY", // Глина (Argilă)
  LOESS = "LOESS", // Лёсс / Просадочный суглинок (Cernoziom lëssoid)
  FILLED = "FILLED", // Насыпной грунт (Pământ de umplutură)
  ROCK = "ROCK", // Скальный грунт (Rocă stâncoasă)
}

export interface SoilDetails {
  id: SoilType;
  name: string;
  resistanceKPa: number; // R average in kPa
  Rmin: number; // Minimum bearing capacity (kPa)
  Ravg: number; // Average bearing capacity (kPa)
  Rmax: number; // Maximum bearing capacity (kPa)
  Emin: number; // Minimum soil deformation modulus in MPa
  Eavg: number; // Average soil deformation modulus in MPa
  Emax: number; // Maximum soil deformation modulus in MPa
  density: number; // Soil bulk density in kg/m3
  poissonRatio: number; // Poisson ratio
  settlementCoeff: number; // Dimensionless settlement coefficient omega
  frostHeaveSensitivity: string; // "Низкая" | "Умеренная" | "Высокая"
  groundwaterSensitivity: string; // "Низкая" | "Умеренная" | "Высокая"
  description: string;
  heavingRisk: number; // value from 0 to 1
  collapsibilityRisk: number; // value from 0 to 1
}

// Structural properties needed for calculation
export enum GlazingType {
  STANDARD = "STANDARD", // Стандартное остекление (15% от площади стен)
  PANORAMIC = "PANORAMIC", // Панорамное остекление (35% от площади стен)
}

export enum FacadeType {
  WET = "WET", // "Мокрый фасад" (Утеплитель + Декоративная штукатурка)
  VENTILATED = "VENTILATED", // Вентилируемый фасад (Керамогранит / Фиброцемент / HPL)
  FACE_BRICK = "FACE_BRICK", // Облицовочный кирпич
}

export interface CalculatorInput {
  projectId?: string;
  buildingType?: "HOUSE" | "GARAGE";
  hasPit?: boolean;
  buildQuality?: "ECONOMY" | "STANDARD" | "PREMIUM"; // Уровень отделки и качества
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
  glazingType: GlazingType;
  facadeTech: FacadeType;
  hvacSystem?: string;
  ventSystem?: string;
  waterSystem?: string;
  sewageSystem?: string;
  elecSystem?: string;
  lowVoltSystem?: string;
  finishSystem?: string;
  windowSystem?: string;
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

  // Reinforcement manual overrides
  rebarClassMain?: string;
  rebarClassSecondary?: string;
  mainBarDiameter?: number;
  secondaryBarDiameter?: number;
  longitudinalBarsCount?: number;
  topBeltCount?: number;
  bottomBeltCount?: number;
  stirrupSpacing?: number;
  protectiveLayerBottom?: number;
  protectiveLayerSide?: number;
  protectiveLayerTop?: number;
  lapLength?: number;
  cornerReinforcement?: boolean;
  uBars?: boolean;
  lBars?: boolean;
  starterBars?: boolean;

  // Seismic and automatic reinforcement mode fields (Stage 4 & Stage 10)
  seismicZone?: string; // "6_POINTS" | "7_POINTS" | "8_POINTS"
  seismicClass?: string; // "CLASS_I" | "CLASS_II" | "CLASS_III"
  seismicFactor?: number; // e.g. 1.0, 1.25, 1.5
  reinforcementChoice?: "AUTO" | "RECOMMENDED" | "USER";
}

// Calculated weights, pressures, sizing, specifications, and costs
export interface MaterialRequirement {
  concreteVolumeM3: number;
  fbsBlocksCount?: number;
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

export interface CAPEX {
  constructionCostMDL: number;
  installationCostMDL: number;
  deliveryCostMDL: number;
  machineryCostMDL: number;
  totalMDL: number;
}

export interface OPEX {
  heatingAnnualCostMDL: number;
  coolingAnnualCostMDL: number;
  maintenanceAnnualCostMDL: number;
  repairsAnnualCostMDL: number;
  equipmentReplacementAnnualMDL: number;
  totalAnnualMDL: number;
  cost10YearsMDL: number;
  cost20YearsMDL: number;
  cost30YearsMDL: number;
}

export interface FinancialModel {
  paybackPeriodYears: number;
  energySavingsAnnualMDL: number;
  NPV_MDL: number;
  ROI_Percent: number;
  accumulatedBenefit30YearsMDL: number;
}

export interface NormativeCheck {
  normativeDocument: string; // e.g. "NCM F.02.02-2006"
  clause: string; // e.g. "п. 5.1.2"
  calculationDetails: string;
  isPass: boolean;
}

export interface OptionJustification {
  reasons: string[];
  engineeringComparison: string[];
  economicComparison: string[];
  normativeChecks: NormativeCheck[];
}

export interface RiskAnalysis {
  constructionRisk: number; // 0-10
  financialRisk: number; // 0-10
  operationalRisk: number; // 0-10
  normativeRisk: number; // 0-10
  overallProjectRating: number; // 0-100
}

export interface SeismicData {
  seismicZone: number; // 7, 8, 9
  soilCategory: string; // e.g. "II", "III"
  behaviorFactor: number; // q
  designAcceleration: number; // ag (e.g. 0.2g)
  designLoads: number;
}

export interface ThermalCalculation {
  thermalResistanceR: number; // m2K/W
  uValue: number; // W/m2K
  heatLossW: number;
  annualEnergyKWh: number;
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

  // Proof-based fields
  justification?: OptionJustification;
  capex?: CAPEX;
  opex?: OPEX;
  financialModel?: FinancialModel;
  thermal?: ThermalCalculation;
  riskAnalysis?: RiskAnalysis;

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

  // Reinforcement resolved parameters
  reinforcement?: ResolvedReinforcement;
}

export interface WallCalculationResult {
  columnsCount: number;
  concreteColumnsM3: number;
  seismicBeltLengthM: number;
  concreteBeltM3: number;
  totalConcreteM3: number;
  rebarKg: number;
  wallAreaGrossM2: number;
  wallAreaNetM2: number;
  blocksVolumeM3: number;
  blocksCount: number;
  mortarVolumeM3: number;
  blocksCostMDL: number;
  concreteCostMDL: number;
  rebarCostMDL: number;
  masonryRebarKg: number;
  masonryRebarCostMDL: number;
  ventChannelsCount: number;
  ventBlocksCount: number;
  ventBlocksCostMDL: number;
  materialsCostMDL: number;
  laborCostMDL: number;
  totalCostMDL: number;
  needsColumns: boolean;
  needsBelts: boolean;
  seismicity: number;
  isFrame: boolean;
  wallThicknessM: number;
}

export interface WhiteBoxCalculationResult {
  roofAreaM2: number;
  roofCostMDL: number;
  glazingAreaM2: number;
  windowsCostMDL: number;
  facadeAreaM2: number;
  facadeCostMDL: number;

  // Phase 2 Internal works ("Real White Box")
  hasStairs: boolean;
  stairsCostMDL: number;
  floorsScreedAreaM2: number;
  floorsScreedCostMDL: number;
  internalPlasterAreaM2: number;
  internalPlasterCostMDL: number;
  slabCostMDL: number; // For inter-floor slabs

  totalWhiteBoxCostMDL: number;
}

export interface CalculationResults {
  input: CalculatorInput;
  walls?: WallCalculationResult;
  whiteBox?: WhiteBoxCalculationResult;

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
  seismicPGA: number; // Peak ground acceleration (g)
  seismicImportanceFactor: number; // Gamma_I NCM/Eurocode
  seismicGroundTypeFactor: number; // S parameter
  seismicBehaviorFactor: number; // q parameter
  seismicAmplification: number; // Beta spectral amplification

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
  settlementTotalMM: number; // S total (mm)
  settlementDiffMM: number; // Delta S differential (mm)
  settlementUnequal: number; // i (dimensionless fraction, mm/mm)
  settlementRiskCoeff: number; // Kr risk factor (S / S_limit)
  settlementLimitMM: number; // S_limit (mm)
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

export interface ResolvedReinforcement {
  foundation_type: string;
  rebar_class_main: string;
  rebar_class_secondary: string;
  main_bar_diameter: number;
  secondary_bar_diameter: number;
  longitudinal_bars_count: number;
  top_belt_count: number;
  bottom_belt_count: number;
  stirrup_spacing: number;
  protective_layer_bottom: number;
  protective_layer_side: number;
  protective_layer_top: number;
  lap_length: number;
  corner_reinforcement: boolean;
  u_bars: boolean;
  l_bars: boolean;
  starter_bars: boolean;
  chairs_count: number;
  spacers_count: number;

  // Detailing and physical calculation reporting fields (NCM Eurocode 2 matching)
  layout_scheme_ru?: string;
  layout_scheme_ro?: string;
  waste_percent?: number;
  main_bars_weight_kg?: number;
  secondary_bars_weight_kg?: number;
  additional_elements_weight_kg?: number;
  total_rebar_weight_kg?: number;
  anchorage_length?: number;
  frogs_count?: number;
  frogs_spacing?: number;
  corner_reinforcements_count?: number;
  intersection_reinforcements_count?: number;
  seismic_zone?: string;
  seismic_class?: string;
  seismic_factor?: number;
  audit_checks?: BIMQualityCheck[];

  // Parametric length and weight breakdown tracking (M0LDOVA-10)
  l_bars_count?: number;
  u_bars_count?: number;
  starter_bars_count?: number;
  longitudinal_total_length_m?: number;
  transverse_total_length_m?: number;
  clamps_total_length_m?: number;
  starters_total_length_m?: number;
  anchorages_total_length_m?: number;
  laps_total_length_m?: number;
  longitudinal_total_weight_kg?: number;
  clamps_total_weight_kg?: number;
  reinforcements_total_weight_kg?: number;
  starters_total_weight_kg?: number;
  anchorages_total_weight_kg?: number;
  laps_total_weight_kg?: number;

  sources: {
    foundation_type: "USER" | "AUTO";
    rebar_class_main: "USER" | "AUTO";
    rebar_class_secondary: "USER" | "AUTO";
    main_bar_diameter: "USER" | "AUTO";
    secondary_bar_diameter: "USER" | "AUTO";
    longitudinal_bars_count: "USER" | "AUTO";
    top_belt_count: "USER" | "AUTO";
    bottom_belt_count: "USER" | "AUTO";
    stirrup_spacing: "USER" | "AUTO";
    protective_layer_bottom: "USER" | "AUTO";
    protective_layer_side: "USER" | "AUTO";
    protective_layer_top: "USER" | "AUTO";
    lap_length: "USER" | "AUTO";
    corner_reinforcement: "USER" | "AUTO";
    u_bars: "USER" | "AUTO";
    l_bars: "USER" | "AUTO";
    starter_bars: "USER" | "AUTO";
    chairs_count: "AUTO";
    spacers_count: "AUTO";
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}
