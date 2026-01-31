// @ts-ignore
export interface Diagnosis {
    id: number;
    user_id: number;
    image_url: string;
    plant_name: string;
    common_names: string;
    confidence: number;
    issues_detected: boolean;
    disease_details: string;
    created_at: string;
}
