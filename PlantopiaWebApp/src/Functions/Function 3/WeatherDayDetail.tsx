// src/components/WeatherDayDetail.tsx
import React from 'react';
import { useI18n } from '../../I18nContext';

interface DayDataProps {
    date: Date;
    data: {
        temp?: number;
        precipProb?: number;
        precip?: number;
        rain?: number;
        snow?: number;
        soilTemp0?: number;
        soilTemp6?: number;
        soilTemp18?: number;
        soilTemp54?: number;
        humidity?: number;
        windSpeed?: number;
        windDir?: number;
        soilMoisture0?: number;
        soilMoisture1?: number;
        soilMoisture3?: number;
        soilMoisture9?: number;
        soilMoisture27?: number;
        et0?: number;
        vpd?: number;
        evapotranspiration?: number;
    };
}

// Вспомогательные компоненты вынесены наружу (исправление ошибки ESLint)
const CardSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="detail-section">
        <h4 className="detail-title">{title}</h4>
        <div className="detail-grid">
            {children}
        </div>
    </div>
);

const DataItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="data-item">
        <span className="data-label">{label}</span>
        <span className="data-value">{value}</span>
    </div>
);

const WeatherDayDetail: React.FC<DayDataProps> = ({ date, data }) => {
    const { t } = useI18n();

    const formatValue = (val: number | undefined, suffix: string = '', decimals: number = 1) => {
        if (val === undefined || val === null) return '—';
        return `${val.toFixed(decimals)}${suffix}`;
    };

    return (
        <div className="weather-day-detail">
            <div className="detail-header">
                <h3>{date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <span className="detail-subtitle">{t('weather.detailSubtitle', 'Данные на 12:00')}</span>
            </div>

            <CardSection title={t('weather.sec.basic', 'Основные показатели')}>
                <DataItem label={t('weather.temp', 'Температура')} value={formatValue(data.temp, '°C')} />
                <DataItem label={t('weather.humidity', 'Влажность')} value={formatValue(data.humidity, '%')} />
                <DataItem label={t('weather.precipProb', 'Вероятность осадков')} value={formatValue(data.precipProb, '%')} />
                <DataItem label={t('weather.precip', 'Осадки')} value={formatValue(data.precip, ' мм')} />
                <DataItem label={t('weather.rain', 'Дождь')} value={formatValue(data.rain, ' мм')} />
                <DataItem label={t('weather.snow', 'Снег')} value={formatValue(data.snow, ' см')} />
                <DataItem label={t('weather.wind', 'Ветер')} value={`${formatValue(data.windSpeed, ' м/с')} ${data.windDir ? `(${Math.round(data.windDir)}°)` : ''}`} />
            </CardSection>

            <CardSection title={t('weather.sec.soilTemp', 'Температура почвы')}>
                <DataItem label="0 см" value={formatValue(data.soilTemp0, '°C')} />
                <DataItem label="6 см" value={formatValue(data.soilTemp6, '°C')} />
                <DataItem label="18 см" value={formatValue(data.soilTemp18, '°C')} />
                <DataItem label="54 см" value={formatValue(data.soilTemp54, '°C')} />
            </CardSection>

            <CardSection title={t('weather.sec.soilMoist', 'Влажность почвы')}>
                <DataItem label="0-1 см" value={formatValue(data.soilMoisture0, ' м³/м³', 3)} />
                <DataItem label="1-3 см" value={formatValue(data.soilMoisture1, ' м³/м³', 3)} />
                <DataItem label="3-9 см" value={formatValue(data.soilMoisture3, ' м³/м³', 3)} />
                <DataItem label="9-27 см" value={formatValue(data.soilMoisture9, ' м³/м³', 3)} />
                <DataItem label="27-81 см" value={formatValue(data.soilMoisture27, ' м³/м³', 3)} />
            </CardSection>

            <CardSection title={t('weather.sec.evo', 'Испарение и энергия')}>
                <DataItem label="ET0 (FAO)" value={formatValue(data.et0, ' мм')} />
                <DataItem label="Дефицит давления пара" value={formatValue(data.vpd, ' кПа')} />
                <DataItem label="Эвапотранспирация" value={formatValue(data.evapotranspiration, ' мм')} />
            </CardSection>
        </div>
    );
};

export default WeatherDayDetail;