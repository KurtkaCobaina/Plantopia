

export interface PlantIdResult {
    success: boolean;
    data?: {
        classification?: {
            name: string;
            probability: number;
            plant_details?: {
                common_names?: string[];
                edible_parts?: string[];
                toxicity?: string;
            };
        };
        healthAssessment?: {
            isHealthy: boolean;
            diseases?: Array<{
                name: string;
                probability: number;
                description: string;
            }>;
        };
        probability: number;
        modelVersion: string;
        status: string;
    };
    error?: string;
}

export interface DiagnosisRequest {
    image: File;
}

export type ParseApiResponseFunction = (apiResponse: any) => PlantIdResult['data'];
export type { ParseApiResponseFunction as ParseApiResponse };