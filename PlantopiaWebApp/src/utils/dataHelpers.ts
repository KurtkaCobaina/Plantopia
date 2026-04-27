// src/utils/dataHelpers.ts

import type { Crop } from '../Interfaces/Crop';
import type { SoilType } from '../Interfaces/SoilType';

/**
 * Интерфейс для параметров фильтрации и сортировки
 */
export interface FilterParams {
    searchQuery: string;
    sortBy: 'name_asc' | 'name_desc' | 'default';
}

/**
 * Фильтрует и сортирует список культур
 * @param items - исходный массив культур
 * @param params - параметры поиска и сортировки
 */
export const filterAndSortCrops = (items: Crop[], params: FilterParams): Crop[] => {
    let result = [...items];

    // 1. Поиск (по названию или научному названию)
    if (params.searchQuery.trim()) {
        const query = params.searchQuery.toLowerCase();
        result = result.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.scientificName && item.scientificName.toLowerCase().includes(query))
        );
    }

    // 2. Сортировка
    if (params.sortBy === 'name_asc') {
        result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (params.sortBy === 'name_desc') {
        result.sort((a, b) => b.name.localeCompare(a.name));
    }
    // 'default' оставляет порядок как пришел с сервера (обычно по ID)

    return result;
};

/**
 * Фильтрует и сортирует список типов почв
 * @param items - исходный массив типов почв
 * @param params - параметры поиска и сортировки
 */
export const filterAndSortSoils = (items: SoilType[], params: FilterParams): SoilType[] => {
    let result = [...items];

    // 1. Поиск (по названию почвы)
    if (params.searchQuery.trim()) {
        const query = params.searchQuery.toLowerCase();
        result = result.filter(item =>
            item.name.toLowerCase().includes(query)
        );
    }

    // 2. Сортировка
    if (params.sortBy === 'name_asc') {
        result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (params.sortBy === 'name_desc') {
        result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
};