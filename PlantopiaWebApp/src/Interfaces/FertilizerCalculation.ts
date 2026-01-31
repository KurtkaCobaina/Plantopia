export interface FertilizerCalculation {
    id: number;
    user_id: number;
    crop_type: string;
    soil_type: string;
    target_yield_ton_ha: number | null;
    field_area_ha: number | null;
    recommended_n_kg_ha: number | null;
    recommended_p_kg_ha: number | null;
    recommended_k_kg_ha: number | null;
    calculated_at: string; // ISO-строка
}