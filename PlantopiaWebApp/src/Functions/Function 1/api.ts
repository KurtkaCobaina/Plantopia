
import type { DiagnosisRequest, PlantIdResult, ParseApiResponse } from './PlantDiagnosisInterfaces.ts';


const PLANT_ID_API_KEY = "vRXsdu8HqL8P1D2dCEI7lMHmW820bSpTdURcP3uhqu8xnv0LvT";
const API_BASE_URL = "https://api.plant.id/v3";

export const diagnosePlant = async (request: DiagnosisRequest): Promise<PlantIdResult> => {
    try {

        const imageBase64 = await fileToBase64(request.image);


        const requestBody: Record<string, any> = {
            images: [imageBase64],

            health: 'all',
            similar_images: true,

        };


        const cleanRequestBody = removeUndefinedValues(requestBody);

        const response = await fetch(`${API_BASE_URL}/identification`, {
            method: 'POST',
            headers: {
                'Api-Key': PLANT_ID_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cleanRequestBody),
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorText = await response.text();
                console.error('Raw API Error Response:', errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || errorText || errorMessage;
                } catch (jsonParseError) {
                    errorMessage = errorText || errorMessage;
                }
            } catch (e) {
                console.error('Error reading error response:', e);
            }
            throw new Error(errorMessage);
        }

        const apiResponse: any = await response.json();

        console.log('Plant ID API Response:', apiResponse);

        const parsedData: PlantIdResult['data'] = parseApiResponse(apiResponse);

        return {
            success: true,
            data: parsedData, // Исправлено: 'data' вместо 'parsedData'
        };
    } catch (error) {
        console.error("Diagnosis API call failed:", error);
        return {
            success: false,
            error: (error as Error).message || 'An unknown error occurred during diagnosis.',
        };
    }
};

// Вспомогательная функция для преобразования File в base64 строку
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64String = reader.result.split(',')[1]; // Убираем префикс
                if (base64String) {
                    resolve(base64String);
                } else {
                    reject(new Error('Failed to extract base64 string from Data URL.'));
                }
            } else {
                reject(new Error('FileReader result is not a string.'));
            }
        };
        reader.onerror = error => reject(error);
    });
};

// Функция для удаления undefined значений из объекта (рекурсивно)
function removeUndefinedValues(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues);
    }

    const cleanedObj: any = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (value !== undefined) {
                cleanedObj[key] = removeUndefinedValues(value);
            }
        }
    }
    return cleanedObj;
}



// @ts-ignore
const parseApiResponse: ParseApiResponse = (apiResponse) => {
    const diseaseData = apiResponse.disease; // NEW structure
    const healthAssessmentData = apiResponse.health_assessment; // OLD structure (for fallback)

    // @ts-ignore
    let healthAssessment: PlantIdResult['data']['healthAssessment'] | undefined;

    if (diseaseData) {
        const suggestions = diseaseData.suggestions || [];
        const diseases = suggestions.map((d: any) => ({
            name: d.name,
            probability: d.probability,
            description: d.details?.description?.value || 'No description available',
        }));
        const isHealthy = apiResponse.result?.is_healthy?.binary ?? true;
        healthAssessment = {
            isHealthy,
            diseases: diseases.length > 0 ? diseases : undefined,
        };
    } else if (healthAssessmentData) {
        const diseases = healthAssessmentData.diseases?.map((d: any) => ({
            name: d.name,
            probability: d.probability,
            description: d.description?.value || 'No description available',
        })) || [];
        healthAssessment = {
            isHealthy: healthAssessmentData.is_healthy.binary,
            diseases: diseases.length > 0 ? diseases : undefined,
        };
    } else {
        const isHealthyResult = apiResponse.result?.is_healthy;
        const isHealthy = isHealthyResult?.binary ?? true;
        healthAssessment = {
            isHealthy,
            diseases: undefined,
        };
    }

    // @ts-ignore
    let classification: PlantIdResult['data']['classification'] | undefined;
    if (apiResponse.result?.classification?.suggestions && apiResponse.result.classification.suggestions.length > 0) {
        const topSuggestion = apiResponse.result.classification.suggestions[0];
        classification = {
            name: topSuggestion.name,
            probability: topSuggestion.probability,
            plant_details: {
                common_names: topSuggestion.plant_details?.common_names || [],
                edible_parts: topSuggestion.plant_details?.edible_parts,
                toxicity: topSuggestion.plant_details?.toxicity,
            },
        };
    }

    const overallProbability = Math.max(
        healthAssessment.diseases?.[0]?.probability || 0,
        classification?.probability || 0,
        0.0
    );

    return {
        classification,
        healthAssessment,
        probability: overallProbability,
        modelVersion: apiResponse.model_version,
        status: apiResponse.status,
    };
};