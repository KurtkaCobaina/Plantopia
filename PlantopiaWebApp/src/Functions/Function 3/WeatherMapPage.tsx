import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";
import './WeatherMapPage.css';
import { useI18n } from '../../I18nContext';
import { getWeatherData } from './OpenMetioApi.ts';
import WeatherDayDetail from './WeatherDayDetail';

// Interface for a single hour's data
interface HourlyDataPoint {
    time: Date;
    temperature_2m: number;
    precipitation_probability: number;
    precipitation: number;
    rain: number;
    snowfall: number;
    soil_temperature_0cm: number;
    soil_temperature_6cm: number;
    soil_temperature_18cm: number;
    soil_temperature_54cm: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    soil_moisture_0_to_1cm: number;
    soil_moisture_1_to_3cm: number;
    soil_moisture_3_to_9cm: number;
    soil_moisture_9_to_27cm: number;
    soil_moisture_27_to_81cm: number;
    et0_fao_evapotranspiration: number;
    vapour_pressure_deficit: number;
    evapotranspiration: number;
}

// Interface for a day containing multiple hours
interface DayGroup {
    dateKey: string; // YYYY-MM-DD for grouping
    displayDate: string;
    hours: HourlyDataPoint[];
}

const WeatherMapPage = () => {
    const { t } = useI18n();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);

    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    // Store all raw hourly data points
    const [allHours, setAllHours] = useState<HourlyDataPoint[]>([]);

    // Store grouped days for the sidebar list
    const [daysList, setDaysList] = useState<DayGroup[]>([]);

    // Selected date key (YYYY-MM-DD) to show details for
    const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

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
            setAllHours([]);
            setDaysList([]);
            setSelectedDateKey(null);
            setError(null);
        };

        map.on('click', handleClick);

        return () => { if (mapRef.current) mapRef.current.remove(); };
    }, []);



    const fetchWeather = async () => {
        if (!selectedLocation) return;
        setLoadingWeather(true);
        setError(null);
        setAllHours([]);
        setDaysList([]);
        setSelectedDateKey(null);

        try {
            const data = await getWeatherData(selectedLocation.lat, selectedLocation.lng);
            if (!data || !data.hourly) throw new Error("Нет данных");

            const h = data.hourly;
            const times = h.time || [];

            // Convert raw arrays into an array of objects (one per hour)

            // @ts-ignore
            const parsedHours: HourlyDataPoint[] = times.map((timeStr: string, idx: number) => {
                return {
                    time: new Date(timeStr),
                    temperature_2m: h.temperature_2m?.[idx] ?? 0,
                    precipitation_probability: h.precipitation_probability?.[idx] ?? 0,
                    precipitation: h.precipitation?.[idx] ?? 0,
                    rain: h.rain?.[idx] ?? 0,
                    snowfall: h.snowfall?.[idx] ?? 0,
                    soil_temperature_0cm: h.soil_temperature_0cm?.[idx] ?? 0,
                    soil_temperature_6cm: h.soil_temperature_6cm?.[idx] ?? 0,
                    soil_temperature_18cm: h.soil_temperature_18cm?.[idx] ?? 0,
                    soil_temperature_54cm: h.soil_temperature_54cm?.[idx] ?? 0,
                    relative_humidity_2m: h.relative_humidity_2m?.[idx] ?? 0,
                    wind_speed_10m: h.wind_speed_10m?.[idx] ?? 0,
                    wind_direction_10m: h.wind_direction_10m?.[idx] ?? 0,
                    soil_moisture_0_to_1cm: h.soil_moisture_0_to_1cm?.[idx] ?? 0,
                    soil_moisture_1_to_3cm: h.soil_moisture_1_to_3cm?.[idx] ?? 0,
                    soil_moisture_3_to_9cm: h.soil_moisture_3_to_9cm?.[idx] ?? 0,
                    soil_moisture_9_to_27cm: h.soil_moisture_9_to_27cm?.[idx] ?? 0,
                    soil_moisture_27_to_81cm: h.soil_moisture_27_to_81cm?.[idx] ?? 0,
                    et0_fao_evapotranspiration: h.et0_fao_evapotranspiration?.[idx] ?? 0,
                    vapour_pressure_deficit: h.vapour_pressure_deficit?.[idx] ?? 0,
                    evapotranspiration: h.evapotranspiration?.[idx] ?? 0,
                };
            });

            setAllHours(parsedHours);

            // Group hours by day
            const daysMap = new Map<string, DayGroup>();

            parsedHours.forEach(hour => {
                const dateKey = hour.time.toISOString().split('T')[0]; // YYYY-MM-DD
                if (!daysMap.has(dateKey)) {
                    daysMap.set(dateKey, {
                        dateKey,
                        displayDate: hour.time.toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' }),
                        hours: []
                    });
                }
                daysMap.get(dateKey)?.hours.push(hour);
            });

            const uniqueDays = Array.from(daysMap.values());
            setDaysList(uniqueDays);

            // Automatically select the first day
            if (uniqueDays.length > 0) {
                setSelectedDateKey(uniqueDays[0].dateKey);
            }

        } catch (err) {
            console.error(err);
            setError(t('weather.error.fetch', 'Ошибка загрузки данных'));
        } finally {
            setLoadingWeather(false);
        }
    };

    // Get the list of hours for the currently selected day
    const currentDayHours = selectedDateKey
        ? daysList.find(d => d.dateKey === selectedDateKey)?.hours || []
        : [];

    return (
        <div className="weather-map-page">
            <div className="weather-header">
                <h2>{t('weather.title', 'Прогноз погоды')}</h2>
                <p className="instruction">{t('weather.instruction', 'Выберите точку на карте.')}</p>
            </div>

            <div className="weather-content">
                {/* Left Column: Map and Day List */}
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

                    {/* List of Days */}
                    {daysList.length > 0 && (
                        <div className="days-list-container">
                            <h3>{t('weather.availableDays', 'Доступные дни')}</h3>
                            <div className="days-list">
                                {daysList.map((day) => (
                                    <button
                                        key={day.dateKey}
                                        className={`day-item ${selectedDateKey === day.dateKey ? 'active' : ''}`}
                                        onClick={() => setSelectedDateKey(day.dateKey)}
                                    >
                                        {day.displayDate}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Hourly Details for Selected Day */}
                <div className="details-column">
                    {error && <div className="error-msg">{error}</div>}

                    {loadingWeather && (
                        <div className="loading-state">{t('common.loading', 'Обработка данных...')}</div>
                    )}

                    {!loadingWeather && currentDayHours.length > 0 && (
                        <WeatherDayDetail hours={currentDayHours} />
                    )}

                    {!loadingWeather && allHours.length > 0 && currentDayHours.length === 0 && (
                        <div className="no-data-message">{t('weather.selectDay', 'Выберите день из списка слева')}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WeatherMapPage;