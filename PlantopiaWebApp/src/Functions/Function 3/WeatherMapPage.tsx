// src/Pages/WeatherMapPage.tsx
import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";
import './WeatherMapPage.css';
import { useI18n } from '../../I18nContext';
import { getWeatherData } from './OpenMetioApi.ts';
import WeatherDayDetail from './/WeatherDayDetail';

// Расширяем интерфейс для хранения всех данных
interface FullHourlyData {
    time: Date[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    rain: number[];
    snowfall: number[];
    soil_temperature_0cm: number[];
    soil_temperature_6cm: number[];
    soil_temperature_18cm: number[];
    soil_temperature_54cm: number[];
    relative_humidity_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    soil_moisture_0_to_1cm: number[];
    soil_moisture_1_to_3cm: number[];
    soil_moisture_3_to_9cm: number[];
    soil_moisture_9_to_27cm: number[];
    soil_moisture_27_to_81cm: number[];
    et0_fao_evapotranspiration: number[];
    vapour_pressure_deficit: number[];
    evapotranspiration: number[];
}

interface DaySummary {
    date: Date;
    index: number; // Индекс в массиве данных (берем полдень или первое значение дня)
    displayDate: string;
}

const WeatherMapPage = () => {
    const { t } = useI18n();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);

    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);
    const [fullData, setFullData] = useState<FullHourlyData | null>(null);
    const [daysList, setDaysList] = useState<DaySummary[]>([]);
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors',
                    },
                },
                layers: [
                    {
                        id: 'osm-tiles',
                        type: 'raster',
                        source: 'osm',
                        minzoom: 0,
                        maxzoom: 20,
                    },
                ],
            },
            center: [49.07, 55.47],
            zoom: 10,
        });

        mapRef.current = map;

        const handleClick = (e: maplibregl.MapMouseEvent) => {
            const { lat, lng } = e.lngLat;
            if (markerRef.current) markerRef.current.remove();

            const marker = new maplibregl.Marker({ color: '#ef4444' })
                .setLngLat([lng, lat])
                .addTo(map);

            markerRef.current = marker;
            setSelectedLocation({ lat, lng });
            setFullData(null);
            setDaysList([]);
            setSelectedDayIndex(null);
            setError(null);
        };

        map.on('click', handleClick);

        return () => { if (mapRef.current) mapRef.current.remove(); };
    }, []);

    const convertToNumberArray = (input: any): number[] | null => {
        if (!input) return null;
        return Array.from(input, (item) => Number(item));
    };

    const fetchWeather = async () => {
        if (!selectedLocation) return;
        setLoadingWeather(true);
        setError(null);
        setFullData(null);
        setDaysList([]);
        setSelectedDayIndex(null);

        try {
            const data = await getWeatherData(selectedLocation.lat, selectedLocation.lng);
            if (!data || !data.hourly) throw new Error("Нет данных");

            const h = data.hourly;
            const full: FullHourlyData = {
                time: h.time || [],
                temperature_2m: convertToNumberArray(h.temperature_2m) || [],
                precipitation_probability: convertToNumberArray(h.precipitation_probability) || [],
                precipitation: convertToNumberArray(h.precipitation) || [],
                rain: convertToNumberArray(h.rain) || [],
                snowfall: convertToNumberArray(h.snowfall) || [],
                soil_temperature_0cm: convertToNumberArray(h.soil_temperature_0cm) || [],
                soil_temperature_6cm: convertToNumberArray(h.soil_temperature_6cm) || [],
                soil_temperature_18cm: convertToNumberArray(h.soil_temperature_18cm) || [],
                soil_temperature_54cm: convertToNumberArray(h.soil_temperature_54cm) || [],
                relative_humidity_2m: convertToNumberArray(h.relative_humidity_2m) || [],
                wind_speed_10m: convertToNumberArray(h.wind_speed_10m) || [],
                wind_direction_10m: convertToNumberArray(h.wind_direction_10m) || [],
                soil_moisture_0_to_1cm: convertToNumberArray(h.soil_moisture_0_to_1cm) || [],
                soil_moisture_1_to_3cm: convertToNumberArray(h.soil_moisture_1_to_3cm) || [],
                soil_moisture_3_to_9cm: convertToNumberArray(h.soil_moisture_3_to_9cm) || [],
                soil_moisture_9_to_27cm: convertToNumberArray(h.soil_moisture_9_to_27cm) || [],
                soil_moisture_27_to_81cm: convertToNumberArray(h.soil_moisture_27_to_81cm) || [],
                et0_fao_evapotranspiration: convertToNumberArray(h.et0_fao_evapotranspiration) || [],
                vapour_pressure_deficit: convertToNumberArray(h.vapour_pressure_deficit) || [],
                evapotranspiration: convertToNumberArray(h.evapotranspiration) || [],
            };

            setFullData(full);

            // Генерация списка дней (берем индекс первого измерения каждого дня)
            const uniqueDays: DaySummary[] = [];
            const seenDates = new Set<string>();

            full.time.forEach((date, idx) => {
                const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                if (!seenDates.has(dateKey)) {
                    seenDates.add(dateKey);
                    uniqueDays.push({
                        date: date,
                        index: idx,
                        displayDate: date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                    });
                }
            });

            setDaysList(uniqueDays);
            // Автоматически выбираем первый день
            if (uniqueDays.length > 0) {
                setSelectedDayIndex(uniqueDays[0].index);
            }

        } catch (err) {
            console.error(err);
            setError(t('weather.error.fetch', 'Ошибка загрузки данных'));
        } finally {
            setLoadingWeather(false);
        }
    };

    // Получение данных для выбранного дня
    const getCurrentDayData = () => {
        if (!fullData || selectedDayIndex === null) return null;
        const i = selectedDayIndex;
        return {
            date: fullData.time[i],
            data: {
                temp: fullData.temperature_2m[i],
                precipProb: fullData.precipitation_probability[i],
                precip: fullData.precipitation[i],
                rain: fullData.rain[i],
                snow: fullData.snowfall[i],
                soilTemp0: fullData.soil_temperature_0cm[i],
                soilTemp6: fullData.soil_temperature_6cm[i],
                soilTemp18: fullData.soil_temperature_18cm[i],
                soilTemp54: fullData.soil_temperature_54cm[i],
                humidity: fullData.relative_humidity_2m[i],
                windSpeed: fullData.wind_speed_10m[i],
                windDir: fullData.wind_direction_10m[i],
                soilMoisture0: fullData.soil_moisture_0_to_1cm[i],
                soilMoisture1: fullData.soil_moisture_1_to_3cm[i],
                soilMoisture3: fullData.soil_moisture_3_to_9cm[i],
                soilMoisture9: fullData.soil_moisture_9_to_27cm[i],
                soilMoisture27: fullData.soil_moisture_27_to_81cm[i],
                et0: fullData.et0_fao_evapotranspiration[i],
                vpd: fullData.vapour_pressure_deficit[i],
                evapotranspiration: fullData.evapotranspiration[i],
            }
        };
    };

    const currentDayDetails = getCurrentDayData();

    return (
        <div className="weather-map-page">
            <div className="weather-header">
                <h2>{t('weather.title', 'Прогноз погоды')}</h2>
                <p className="instruction">{t('weather.instruction', 'Выберите точку на карте.')}</p>
            </div>

            <div className="weather-content">
                {/* Левая часть: Карта и Список дней */}
                <div className="map-column">
                    <div className="map-wrapper">
                        <div ref={mapContainerRef} className="weather-map-container" />
                        {selectedLocation && (
                            <div className="coords-display">
                                <span>📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</span>
                                <button onClick={fetchWeather} disabled={loadingWeather} className="fetch-weather-btn">
                                    {loadingWeather ? t('common.loading', 'Загрузка...') : t('weather.fetchButton', 'Загрузить прогноз')}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Список дней появляется после загрузки */}
                    {daysList.length > 0 && (
                        <div className="days-list-container">
                            <h3>{t('weather.availableDays', 'Доступные дни')}</h3>
                            <div className="days-list">
                                {daysList.map((day) => (
                                    <button
                                        key={day.index}
                                        className={`day-item ${selectedDayIndex === day.index ? 'active' : ''}`}
                                        onClick={() => setSelectedDayIndex(day.index)}
                                    >
                                        {day.displayDate}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Правая часть: Детали выбранного дня */}
                <div className="details-column">
                    {error && <div className="error-msg">{error}</div>}

                    {loadingWeather && (
                        <div className="loading-state">{t('common.loading', 'Обработка данных...')}</div>
                    )}

                    {!loadingWeather && currentDayDetails && (
                        <WeatherDayDetail
                            date={currentDayDetails.date}
                            data={currentDayDetails.data}
                        />
                    )}

                    {!loadingWeather && fullData && !currentDayDetails && (
                        <div className="no-data-message">Выберите день из списка слева</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeatherMapPage;