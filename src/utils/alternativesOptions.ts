import { CalculatorInput, BuildingWallMaterial, SlabMaterial, RoofType, FacadeType, CAPEX, OPEX, FinancialModel, ThermalCalculation, RiskAnalysis, OptionJustification } from "../types";
import { WALL_MATERIAL_DATA, SLAB_DATA, ROOF_DATA } from "./calc";
import { enrichAlternativesWithProofs } from "./engineeringProofs";

export interface AlternativeOption<T> {
  id: T;
  name: string;
  costMDL: number;
  speedRating: number; // 1-10
  durabilityRating: number; // 1-10
  energyRating: number; // 1-10
  complexityRating: number; // 1-10 (higher means easier)
  maintenanceRating: number; // 1-10 (higher means cheaper/easier to maintain)
  pros: string[];
  cons: string[];

  // Proof-based fields
  justification?: OptionJustification;
  capex?: CAPEX;
  opex?: OPEX;
  financialModel?: FinancialModel;
  thermal?: ThermalCalculation;
  riskAnalysis?: RiskAnalysis;
}

export function getWallAlternatives(input: CalculatorInput, areaM2: number): AlternativeOption<BuildingWallMaterial>[] {
  const options: AlternativeOption<BuildingWallMaterial>[] = [
    {
      id: BuildingWallMaterial.GASOBETON,
      name: WALL_MATERIAL_DATA[BuildingWallMaterial.GASOBETON].name,
      costMDL: areaM2 * 800, // exact cost calculation from calc.ts should ideally be used, or we just approximate relatively
      speedRating: 8,
      durabilityRating: 7,
      energyRating: 9,
      complexityRating: 8,
      maintenanceRating: 7,
      pros: ["Хорошая теплоизоляция", "Быстрая кладка", "Легкий материал"],
      cons: ["Требует качественной защиты от влаги", "Хрупкость"],
    },
    {
      id: BuildingWallMaterial.KOTELET,
      name: WALL_MATERIAL_DATA[BuildingWallMaterial.KOTELET].name,
      costMDL: areaM2 * 950,
      speedRating: 5,
      durabilityRating: 9,
      energyRating: 5,
      complexityRating: 6,
      maintenanceRating: 9,
      pros: ["Экологичность", "Высокая прочность", "Традиционный для региона"],
      cons: ["Тяжелый материал", "Низкая энергоэффективность", "Медленная кладка"],
    },
    {
      id: BuildingWallMaterial.BRICK,
      name: WALL_MATERIAL_DATA[BuildingWallMaterial.BRICK].name,
      costMDL: areaM2 * 1100,
      speedRating: 4,
      durabilityRating: 10,
      energyRating: 6,
      complexityRating: 5,
      maintenanceRating: 10,
      pros: ["Высокая долговечность", "Максимальная прочность", "Хорошая звукоизоляция"],
      cons: ["Более высокая стоимость", "Медленное строительство"],
    },
    {
      id: BuildingWallMaterial.KERAMZIT,
      name: WALL_MATERIAL_DATA[BuildingWallMaterial.KERAMZIT].name,
      costMDL: areaM2 * 850,
      speedRating: 7,
      durabilityRating: 8,
      energyRating: 7,
      complexityRating: 7,
      maintenanceRating: 8,
      pros: ["Хороший баланс цены/качества", "Прочный", "Менее влагоемкий чем газобетон"],
      cons: ["Требует дополнительного утепления"],
    },
    {
      id: BuildingWallMaterial.FRAME,
      name: WALL_MATERIAL_DATA[BuildingWallMaterial.FRAME].name,
      costMDL: areaM2 * 600,
      speedRating: 10,
      durabilityRating: 5,
      energyRating: 8,
      complexityRating: 9,
      maintenanceRating: 5,
      pros: ["Максимальная скорость постройки", "Отличная первоначальная цена", "Легкость конструкции"],
      cons: ["Низкая долговечность", "Звукоизоляция хуже монолитных", "Риск гниения"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getSlabAlternatives(input: CalculatorInput, areaM2: number): AlternativeOption<SlabMaterial>[] {
  const options: any[] = [
    {
      id: SlabMaterial.MONOLITH,
      name: SLAB_DATA[SlabMaterial.MONOLITH].name,
      costMDL: areaM2 * 1400,
      speedRating: 4,
      durabilityRating: 10,
      energyRating: 6,
      complexityRating: 3,
      maintenanceRating: 10,
      pros: ["Свободная планировка", "Высокая жесткость каркаса", "Вся арматура связана в одной плите"],
      cons: ["Нужна дорогая опалубка", "Долго сохнет", "Высокая стоимость работ"],
    },
    {
      id: SlabMaterial.HOLLOW_CORE,
      name: SLAB_DATA[SlabMaterial.HOLLOW_CORE].name,
      costMDL: areaM2 * 900,
      speedRating: 9,
      durabilityRating: 9,
      energyRating: 6,
      complexityRating: 7,
      maintenanceRating: 9,
      pros: ["Быстрый монтаж", "Хорошая звукоизоляция", "Дешевле монолита"],
      cons: ["Нужен кран для монтажа", "Ограничения кратно размерам плит", "Заделка рустов"],
    },
    {
      id: SlabMaterial.PB_SLAB,
      name: SLAB_DATA[SlabMaterial.PB_SLAB].name,
      costMDL: areaM2 * 1050,
      speedRating: 10,
      durabilityRating: 9,
      energyRating: 6,
      complexityRating: 7,
      maintenanceRating: 9,
      pros: ["Точная геометрия (экструдер)", "Любая длина резки", "Ровная поверхность"],
      cons: ["Требует спец. транспорта", "Сложность опирания на неровные стены"],
    },
    {
      id: SlabMaterial.TIMBER,
      name: SLAB_DATA[SlabMaterial.TIMBER].name,
      costMDL: areaM2 * 600,
      speedRating: 8,
      durabilityRating: 5,
      energyRating: 8,
      complexityRating: 8,
      maintenanceRating: 6,
      pros: ["Самое легкое перекрытие", "Не требует спецтехники", "Легко монтировать коммуникации"],
      cons: ["Срок службы ниже бетона", "Риск прогиба", "Зыбкость (эффект батута)"],
    },
    {
      id: SlabMaterial.COMBINED,
      name: SLAB_DATA[SlabMaterial.COMBINED].name,
      costMDL: areaM2 * 1300,
      speedRating: 5,
      durabilityRating: 8,
      energyRating: 9,
      complexityRating: 4,
      maintenanceRating: 9,
      pros: ["Не нужен кран", "Высокая тепло- и звукоизоляция (пеноблок)", "Высокая жесткость"],
      cons: ["Трудоемкая ручная раскладка балок и блоков", "Многослойная заливка бетона"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getRoofAlternatives(input: CalculatorInput, baseArea: number): AlternativeOption<RoofType>[] {
  const roofArea = baseArea * 1.3;
  const options: any[] = [
    {
      id: RoofType.GABLE_METAL,
      name: ROOF_DATA[RoofType.GABLE_METAL].name,
      costMDL: roofArea * 1300,
      speedRating: 8,
      durabilityRating: 7,
      energyRating: 6,
      complexityRating: 7,
      maintenanceRating: 7,
      pros: ["Доступная цена", "Простой монтаж водостока", "Подходит для мансарды"],
      cons: ["Штамповочные обрезки", "Шум во время дождя"],
    },
    {
      id: RoofType.SHED_BOARD,
      name: ROOF_DATA[RoofType.SHED_BOARD].name,
      costMDL: roofArea * 1100,
      speedRating: 10,
      durabilityRating: 5,
      energyRating: 6,
      complexityRating: 9,
      maintenanceRating: 8,
      pros: ["Самый дешевый вариант", "Минимум отходов", "Не требует сложной стропильной системы"],
      cons: ["Низкая эстетика", "Шумная"],
    },
    {
      id: RoofType.GABLE_SHINGLE,
      name: ROOF_DATA[RoofType.GABLE_SHINGLE].name,
      costMDL: roofArea * 1700,
      speedRating: 6,
      durabilityRating: 8,
      energyRating: 8,
      complexityRating: 5,
      maintenanceRating: 8,
      pros: ["Нет шума дождя", "Разнообразие расцветок", "Нет отходов"],
      cons: ["Требует сплошной обрешетки (ОСП)"],
    },
    {
      id: RoofType.COMPOSITE_TILE,
      name: ROOF_DATA[RoofType.COMPOSITE_TILE].name,
      costMDL: roofArea * 2500,
      speedRating: 6,
      durabilityRating: 9,
      energyRating: 8,
      complexityRating: 5,
      maintenanceRating: 9,
      pros: ["Вид керамики, но легкий вес", "Многослойная защита", "Не шумит при дожде"],
      cons: ["Высокая цена", "Шероховатая поверхность задерживает мусор"],
    },
    {
      id: RoofType.HIP_CERAMIC,
      name: ROOF_DATA[RoofType.HIP_CERAMIC].name,
      costMDL: roofArea * 2500,
      speedRating: 4,
      durabilityRating: 10,
      energyRating: 7,
      complexityRating: 3,
      maintenanceRating: 9,
      pros: ["Высокая эстетика", "Максимальная долговечность", "Полная тишина"],
      cons: ["Тяжелая, требует усиленной стропилки", "Высокая цена"],
    },
    {
      id: RoofType.HIP_METAL,
      name: ROOF_DATA[RoofType.HIP_METAL].name,
      costMDL: roofArea * 1500,
      speedRating: 6,
      durabilityRating: 7,
      energyRating: 6,
      complexityRating: 5,
      maintenanceRating: 7,
      pros: ["Устойчивость к ветрам", "Хороший внешний вид", "Надежность"],
      cons: ["Большой отход материала", "Шумная"],
    },
    {
      id: RoofType.FLAT_PVC,
      name: ROOF_DATA[RoofType.FLAT_PVC].name,
      costMDL: roofArea * 1900,
      speedRating: 7,
      durabilityRating: 9,
      energyRating: 9,
      complexityRating: 4,
      maintenanceRating: 6,
      pros: ["Современный вид", "Можно сделать эксплуатируемой", "Надежная гидроизоляция ПВХ"],
      cons: ["Требует квалифицированного монтажа стоков", "Риск протечек при плохом монтаже"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getFacadeAlternatives(input: CalculatorInput, wallArea: number): AlternativeOption<FacadeType>[] {
  const options: any[] = [
    {
      id: FacadeType.WET,
      name: "Мокрый фасад (Штукатурка)",
      costMDL: wallArea * 800,
      speedRating: 6,
      durabilityRating: 6,
      energyRating: 9,
      complexityRating: 7,
      maintenanceRating: 5,
      pros: ["Экономичность", "Сплошная изоляция без мостиков", "Классический вид"],
      cons: ["Риск трещин", "Нуждается в перекраске раз в 7-10 лет"],
    },
    {
      id: FacadeType.VENTILATED,
      name: "Вентилируемый (Керамогранит/HPL)",
      costMDL: wallArea * 2000,
      speedRating: 5,
      durabilityRating: 9,
      energyRating: 8,
      complexityRating: 4,
      maintenanceRating: 9,
      pros: ["Премиальный вид", "Высокая долговечность", "Точка росы в вентзазоре"],
      cons: ["Высокая стоимость подсистемы", "Сложный монтаж"],
    },
    {
      id: FacadeType.FACE_BRICK,
      name: "Облицовочный кирпич",
      costMDL: wallArea * 1500,
      speedRating: 3,
      durabilityRating: 10,
      energyRating: 7,
      complexityRating: 5,
      maintenanceRating: 10,
      pros: ["Статусный внешний вид", "Вечный фасад без ухода", "Хорошая защита ветров"],
      cons: ["Высокий вес (нужно уширение фунд.)", "Медленный процесс"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getHvacAlternatives(input: CalculatorInput, houseArea: number): AlternativeOption<string>[] {
  const options: any[] = [
    {
      id: "HVAC_HEAT_PUMP",
      name: "Тепловой насос (Воздух-Вода) + Теплый пол",
      costMDL: houseArea * 1800,
      speedRating: 6,
      durabilityRating: 8,
      energyRating: 10,
      complexityRating: 4,
      maintenanceRating: 8,
      pros: ["Высшая энергоэффективность", "Нет нужды в газе", "Охлаждение летом", "Высокий комфорт (теплый пол)"],
      cons: ["Высокая стартовая цена", "Зависимость от электричества"],
    },
    {
      id: "HVAC_GAS_BOILER",
      name: "Газовый котел + Радиаторы + Теплый пол",
      costMDL: houseArea * 1100,
      speedRating: 7,
      durabilityRating: 7,
      energyRating: 7,
      complexityRating: 6,
      maintenanceRating: 6,
      pros: ["Традиционная надежность", "Быстрый нагрев помещения", "Дешевле в монтаже"],
      cons: ["Риск роста цен на газ", "Требуется проект газификации"],
    },
    {
      id: "HVAC_ELECTRIC",
      name: "Электрокотел + Радиаторы",
      costMDL: houseArea * 700,
      speedRating: 10,
      durabilityRating: 8,
      energyRating: 4,
      complexityRating: 9,
      maintenanceRating: 9,
      pros: ["Самый дешевый и быстрый монтаж", "Не нужна котельная"],
      cons: ["Огромные счета за отопление", "Требует ввода больших мощностей (от 15 кВт)"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getElecAlternatives(input: CalculatorInput, houseArea: number): AlternativeOption<string>[] {
  const options: any[] = [
    {
      id: "ELEC_SMART",
      name: "Умный Дом (KNX / ПЛК)",
      costMDL: houseArea * 1500,
      speedRating: 4,
      durabilityRating: 9,
      energyRating: 9,
      complexityRating: 3,
      maintenanceRating: 8,
      pros: ["Сценарии освещения", "Экономия энергии", "Удаленное управление", "Статусность"],
      cons: ["Очень дорого счет", "Сложное программирование", "Толстые пучки кабелей"],
    },
    {
      id: "ELEC_PREMIUM",
      name: "Классика Премиум (Легранд)",
      costMDL: houseArea * 800,
      speedRating: 7,
      durabilityRating: 10,
      energyRating: 6,
      complexityRating: 7,
      maintenanceRating: 10,
      pros: ["Максимальная надежность", "Понятно любому электрику"],
      cons: ["Нет удаленного доступа"],
    },
    {
      id: "ELEC_ECO",
      name: "Эконом + Распред. коробки",
      costMDL: houseArea * 450,
      speedRating: 9,
      durabilityRating: 6,
      energyRating: 5,
      complexityRating: 8,
      maintenanceRating: 7,
      pros: ["Минимальная цена", "Малый расход кабеля", "Быстрый монтаж"],
      cons: ["Сложно диагностировать обрывы", "Устаревший подход (шлейфы)", "Нет гибкости"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getWindowsAlternatives(input: CalculatorInput, areaM2: number): AlternativeOption<string>[] {
  const windowArea = areaM2 * 0.15; // Да, ~15% от площади пола - стандартный норматив
  const options: any[] = [
    {
      id: "WINDOWS_PVC",
      name: "Окна ПВХ (Двухкамерный) + Металлические двери",
      costMDL: windowArea * 2500 + 10000,
      speedRating: 8,
      durabilityRating: 7,
      energyRating: 8,
      complexityRating: 8,
      maintenanceRating: 7,
      pros: ["Доступная цена", "Хорошая теплоизоляция", "Не требуют покраски"],
      cons: ["Пластик может деформироваться", "Меньше площадь остекления"],
    },
    {
      id: "WINDOWS_ALUMINUM",
      name: "Теплый алюминий + Дизайнерские двери",
      costMDL: windowArea * 6000 + 25000,
      speedRating: 7,
      durabilityRating: 10,
      energyRating: 7,
      complexityRating: 6,
      maintenanceRating: 9,
      pros: ["Высокая прочность", "Тонкие рамы", "Большие площади остекления", "Срок службы 50+ лет"],
      cons: ["Высокая стоимость", "Требуют аккуратного монтажа"],
    },
    {
      id: "WINDOWS_WOOD",
      name: "Деревянные окна (Евробрус) + Массив",
      costMDL: windowArea * 5000 + 20000,
      speedRating: 6,
      durabilityRating: 8,
      energyRating: 9,
      complexityRating: 6,
      maintenanceRating: 5,
      pros: ["Экологичность", "Премиальный вид", "Дышащий материал"],
      cons: ["Требует обновления покрытия", "Высокая цена"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getVentAlternatives(input: CalculatorInput, houseArea: number): AlternativeOption<string>[] {
  const options: any[] = [
    {
      id: "VENT_NATURAL",
      name: "Естественная вентиляция (Вентканалы)",
      costMDL: houseArea * 200,
      speedRating: 9,
      durabilityRating: 10,
      energyRating: 3,
      complexityRating: 9,
      maintenanceRating: 10,
      pros: ["Дешево реализовать", "Нет расходов на электричество", "Нет шума вентиляторов"],
      cons: ["Зависит от погоды", "Огромные потери тепла", "Проблемы летом"],
    },
    {
      id: "VENT_FORCED",
      name: "Принудительная вытяжка + Приточные клапаны",
      costMDL: houseArea * 450,
      speedRating: 8,
      durabilityRating: 8,
      energyRating: 5,
      complexityRating: 7,
      maintenanceRating: 8,
      pros: ["Гарантированный воздухообмен", "Недорого в монтаже"],
      cons: ["Холодные сквозняки зимой", "Шум вытяжных вентиляторов"],
    },
    {
      id: "VENT_RECUPERATOR",
      name: "Приточно-вытяжная ПВУ с рекуперацией",
      costMDL: houseArea * 1200,
      speedRating: 5,
      durabilityRating: 8,
      energyRating: 10,
      complexityRating: 4,
      maintenanceRating: 6,
      pros: ["Экономия отопления", "Всегда свежий фильтрованный воздух", "Контроль CO2"],
      cons: ["Дорогая система труб", "Требуется занижение потолков", "Обслуживание фильтров"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getWaterAlternatives(input: CalculatorInput, houseArea: number): AlternativeOption<string>[] {
  const options: any[] = [
    {
      id: "WATER_TEE",
      name: "Тройниковая разводка ППР",
      costMDL: houseArea * 300,
      speedRating: 9,
      durabilityRating: 7,
      energyRating: 6,
      complexityRating: 8,
      maintenanceRating: 6,
      pros: ["Низкая цена", "Простой монтаж"],
      cons: ["Перепады давления", "Скрытые соединения в стяжке"],
    },
    {
      id: "WATER_MANIFOLD",
      name: "Коллекторная разводка PEX (Сшитый полиэтилен)",
      costMDL: houseArea * 700,
      speedRating: 7,
      durabilityRating: 10,
      energyRating: 8,
      complexityRating: 6,
      maintenanceRating: 10,
      pros: ["Равномерное давление", "Никаких стыков в полу", "Надежность труб 50 лет"],
      cons: ["Повышенный расход трубы", "Нужен объемный коллекторный шкаф"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getSewageAlternatives(input: CalculatorInput, houseArea: number): AlternativeOption<string>[] {
  const options: any[] = [
    {
      id: "SEWAGE_STANDARD",
      name: "Стандартная канализация (ПВХ трубы)",
      costMDL: houseArea * 250,
      speedRating: 9,
      durabilityRating: 8,
      energyRating: 5,
      complexityRating: 9,
      maintenanceRating: 8,
      pros: ["Дешево и сердито", "Быстрый монтаж"],
      cons: ["Высокая шумность от падающей воды", "Не эстетично без коробов"],
    },
    {
      id: "SEWAGE_SILENT",
      name: "Бесшумная канализация (Ostendorf / Rehau)",
      costMDL: houseArea * 450,
      speedRating: 8,
      durabilityRating: 10,
      energyRating: 5,
      complexityRating: 8,
      maintenanceRating: 9,
      pros: ["Отсутствие шума смыва в помещениях", "Долговечность и толстая стенка"],
      cons: ["Дороже стандартной", "Тяжелее трубы"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getLowVoltAlternatives(input: CalculatorInput, houseArea: number): AlternativeOption<string>[] {
  const options: any[] = [
    {
      id: "LOWVOLT_BASIC",
      name: "Базовый пакет (Только интернет по кабелю)",
      costMDL: houseArea * 150,
      speedRating: 9,
      durabilityRating: 9,
      energyRating: 5,
      complexityRating: 9,
      maintenanceRating: 9,
      pros: ["Недорого", "Быстро", "Минимум кабелей"],
      cons: ["Слабый Wi-Fi сигнал в дальних комнатах"],
    },
    {
      id: "LOWVOLT_ADVANCED",
      name: "Расширенный: Wi-Fi Roaming, Видеонаблюдение, Домофон",
      costMDL: houseArea * 400,
      speedRating: 6,
      durabilityRating: 8,
      energyRating: 6,
      complexityRating: 5,
      maintenanceRating: 7,
      pros: ["Покрытие бесшовным Wi-Fi", "Безопасность", "Удаленный контроль камер"],
      cons: ["Нужна серверная стойка", "Затраты на оборудование"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

export function getFinishAlternatives(input: CalculatorInput, houseArea: number): AlternativeOption<string>[] {
  const options: any[] = [
    {
      id: "FINISH_ECONOMY",
      name: "Эконом-отделка (Ламинат, Покраска/Обои)",
      costMDL: houseArea * 2500,
      speedRating: 7,
      durabilityRating: 6,
      energyRating: 5,
      complexityRating: 8,
      maintenanceRating: 6,
      pros: ["Минимальный бюджет", "Выбор для сдачи в аренду", "Быстрый ремонт"],
      cons: ["Недолговечные покрытия", "Простой внешний вид"],
    },
    {
      id: "FINISH_STANDARD",
      name: "Стандарт (Хороший ламинат/плитка, Качественная покраска)",
      costMDL: houseArea * 4500,
      speedRating: 6,
      durabilityRating: 8,
      energyRating: 7,
      complexityRating: 6,
      maintenanceRating: 8,
      pros: ["Оптимальное соотношение цена/качество", "Хорошая износостойкость"],
      cons: ["Материалы масс-маркет"],
    },
    {
      id: "FINISH_COMFORT",
      name: "Комфорт (Кварцвинил/Паркетная доска, Декор. штукатурка)",
      costMDL: houseArea * 6500,
      speedRating: 4,
      durabilityRating: 8,
      energyRating: 8,
      complexityRating: 5,
      maintenanceRating: 7,
      pros: ["Высокий уровень комфорта", "Улучшенные материалы"],
      cons: ["Высокая цена материалов и работ"],
    },
    {
      id: "FINISH_PREMIUM",
      name: "Премиум (Паркет, Крупноформатный керамогранит, Дизайн)",
      costMDL: houseArea * 12000,
      speedRating: 3,
      durabilityRating: 9,
      energyRating: 9,
      complexityRating: 3,
      maintenanceRating: 7,
      pros: ["Эксклюзивный дизайн", "Натуральные материалы", "Максимальный комфорт"],
      cons: ["Долго", "Очень дорого", "Требует топовых специалистов и технадзор"],
    }
  ];
  return enrichAlternativesWithProofs(options, input);
}

