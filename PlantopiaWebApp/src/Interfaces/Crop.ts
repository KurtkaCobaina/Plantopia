export interface Crop {
    id: number;
    name: string;
    scientificName: string;
    optimalNG1m2Min: number;
    optimalNG1m2Max: number;
    optimalPG1m2Min: number;
    optimalPG1m2Max: number;
    optimalKG1m2Min: number;
    optimalKG1m2Max: number;
    typicalYieldKg1m2: number | null;
    growthPeriodDays: number;
}
