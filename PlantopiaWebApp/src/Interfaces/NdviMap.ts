// Interfaces/NdviMap.ts
export interface NdviMap {
    id: number;
    userId: number;           // ← camelCase
    dateTaken: string;        // "2026-02-05T00:00:00"
    mapUrl: string;           // может быть пустой строкой ""
    minNdviValue: number | null;
    maxNdviValue: number | null;
    avgNdviValue: number | null;
    cloudFilterApplied: boolean;
    createdAt: string;        // ISO-строка
}