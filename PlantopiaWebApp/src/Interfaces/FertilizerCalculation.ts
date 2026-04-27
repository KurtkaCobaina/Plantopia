// src/Interfaces/FertilizerCalculation.ts
export interface FertilizerCalculation {
    id: number;
    userId: number;
    cropId: number | null;
    soilId: number | null;

    // Новые поля, которые возвращает обновленный бэкенд
    cropName?: string;
    soilName?: string;

    targetYieldKgHa: number | null;
    fieldAreaHa: number | null;
    recommendedNKgHa: number | null;
    recommendedPKgHa: number | null;
    recommendedKKgHa: number | null;
    calculatedAt: string;
}