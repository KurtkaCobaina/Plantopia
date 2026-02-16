// Interfaces/Diagnosis.ts
export interface Diagnosis {
    id: number;
    userId: number;
    imageUrl: string | null;
    plantName: string | null;
    commonNames: string | null;
    confidence: number | null; // ← в .NET это decimal, в JSON — число
    issuesDetected: boolean;
    diseaseDetails: string | null;
    createdAt: string;
}