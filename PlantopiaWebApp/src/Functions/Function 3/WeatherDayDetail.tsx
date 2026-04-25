import React from 'react';
import { useI18n } from '../../I18nContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface WeatherDayDetailProps {
    hours: HourlyDataPoint[];
}

// Helper to format time
const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatValue = (val: number | undefined, suffix: string = '', decimals: number = 1) => {
    if (val === undefined || val === null) return '—';
    return `${val.toFixed(decimals)}${suffix}`;
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <p className="tooltip-time">{label}</p>
                <p className="tooltip-value" style={{ color: payload[0].color }}>
                    {payload[0].name}: {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

// Component for individual data card in the list
const DataCard: React.FC<{ time: string; value: string }> = ({ time, value }) => (
    <div className="data-card">
        <div className="data-card-time">{time}</div>
        <div className="data-card-value">{value}</div>
    </div>
);

interface MetricSectionProps {
    title: string;
    hours: HourlyDataPoint[];
    dataKey: string;
    unit: string;
    color?: string;
    getValue: (h: HourlyDataPoint) => string;
}

const MetricSection: React.FC<MetricSectionProps> = ({ title, hours, dataKey, unit, color = "#8884d8", getValue }) => {
    const chartData = hours.map(h => ({
        ...h,
        timeStr: formatTime(h.time)
    }));

    return (
        <div className="metric-section">
            <h4 className="metric-title">{title}</h4>

            {/* Chart View */}
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis
                            dataKey="timeStr"
                            tick={{ fontSize: 11 }}
                            interval="preserveStartEnd"
                            minTickGap={30}
                        />
                        <YAxis
                            tick={{ fontSize: 11 }}
                            width={35}
                            hide={unit === ''} // Hide axis label if empty unit for moisture etc if desired, or keep
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            dot={{ r: 2 }}
                            activeDot={{ r: 5 }}
                            name={title}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* List View (Horizontal Scroll) */}
            <div className="data-list-scroll">
                {hours.map((hour, idx) => (
                    <DataCard
                        key={idx}
                        time={formatTime(hour.time)}
                        value={getValue(hour)}
                    />
                ))}
            </div>
        </div>
    );
};

const WeatherDayDetail: React.FC<WeatherDayDetailProps> = ({ hours }) => {
    const { t } = useI18n();

    if (!hours || hours.length === 0) return null;

    return (
        <div className="weather-day-detail">
            <div className="detail-header">
                <h3>{t('weather.hourlyForecast', 'Почасовой прогноз')}</h3>
                <span className="detail-subtitle">
                    {hours[0].time.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
            </div>

            <div className="metrics-charts-container">
                {/* Air Temperature */}
                <MetricSection
                    title={t('weather.temp', 'Температура воздуха')}
                    hours={hours}
                    dataKey="temperature_2m"
                    unit="°C"
                    color="#ef4444"
                    getValue={(h) => formatValue(h.temperature_2m, '°C')}
                />

                {/* Humidity */}
                <MetricSection
                    title={t('weather.humidity', 'Влажность воздуха')}
                    hours={hours}
                    dataKey="relative_humidity_2m"
                    unit="%"
                    color="#3b82f6"
                    getValue={(h) => formatValue(h.relative_humidity_2m, '%')}
                />

                {/* Precipitation Probability */}
                <MetricSection
                    title={t('weather.precipProb', 'Вероятность осадков')}
                    hours={hours}
                    dataKey="precipitation_probability"
                    unit="%"
                    color="#10b981"
                    getValue={(h) => formatValue(h.precipitation_probability, '%')}
                />

                {/* Wind Speed */}
                <MetricSection
                    title={t('weather.wind', 'Скорость ветра')}
                    hours={hours}
                    dataKey="wind_speed_10m"
                    unit=" м/с"
                    color="#f59e0b"
                    getValue={(h) => formatValue(h.wind_speed_10m, ' м/с')}
                />

                {/* Soil Temperature (0cm) */}
                <MetricSection
                    title={t('weather.sec.soilTemp', 'Температура почвы (0 см)')}
                    hours={hours}
                    dataKey="soil_temperature_0cm"
                    unit="°C"
                    color="#8b5cf6"
                    getValue={(h) => formatValue(h.soil_temperature_0cm, '°C')}
                />

                {/* Soil Moisture (0-1cm) */}
                <MetricSection
                    title={t('weather.sec.soilMoist', 'Влажность почвы (0-1 см)')}
                    hours={hours}
                    dataKey="soil_moisture_0_to_1cm"
                    unit=""
                    color="#ec4899"
                    getValue={(h) => formatValue(h.soil_moisture_0_to_1cm, '', 3)}
                />

                {/* Evapotranspiration */}
                <MetricSection
                    title={t('weather.sec.evo', 'Эвапотранспирация')}
                    hours={hours}
                    dataKey="evapotranspiration"
                    unit=" мм"
                    color="#6366f1"
                    getValue={(h) => formatValue(h.evapotranspiration, ' мм')}
                />
            </div>
        </div>
    );
};

export default WeatherDayDetail;