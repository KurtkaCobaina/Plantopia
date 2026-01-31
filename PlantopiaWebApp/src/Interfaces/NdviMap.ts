export interface NdviMap {
    id: number;
    user_id: number;
    date_taken: string; // DATE в формате "YYYY-MM-DD"
    map_url: string;
    min_ndvi_value: number | null;
    max_ndvi_value: number | null;
    avg_ndvi_value: number | null;
    cloud_filter_applied: boolean;
    created_at: string; // ISO-строка
}