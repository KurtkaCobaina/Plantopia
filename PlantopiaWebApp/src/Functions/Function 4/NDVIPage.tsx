import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import "maplibre-gl/dist/maplibre-gl.css";
import './NDVIPage.css';
import { useI18n } from '../../I18nContext';

interface AgroPolygon {
    id: string;
    name: string;
    geo_json: {
        type: 'Feature';
        geometry: {
            type: 'Polygon';
            coordinates: number[][][];
        };
        properties: Record<string, any>;
    };
    area?: number;
    created_at?: number | string;
}

interface NdviData {
    mean: number;
    median: number;
    min: number;
    max: number;
    date: Date;
    type: string;
    dc: number;
    cl: number;
}

const getNdviColor = (value: number): string => {
    if (value < 0.2) return '#e74c3c';
    if (value < 0.4) return '#f39c12';
    if (value < 0.6) return '#f1c40f';
    return '#2ecc71';
};

const NDVIPage = () => {
    const navigate = useNavigate();

    const [polygons, setPolygons] = useState<AgroPolygon[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPoints, setSelectedPoints] = useState<{ lat: number; lng: number }[]>([]);
    const [pointPolygonName, setPointPolygonName] = useState('');
    const [ndviStartDate, setNdviStartDate] = useState<string>('');
    const [ndviEndDate] = useState<string>('');
    const [ndviData, setNdviData] = useState<NdviData | null>(null);
    const [cloudFilterEnabled, setCloudFilterEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isFetchingNdvi, setIsFetchingNdvi] = useState(false);

    const CLOUD_THRESHOLD = 30;
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const { t, language } = useI18n();

    const getApiKey = () => sessionStorage.getItem('ndvi_api_key') || '';

    // --- ЛОГИКА (БЕЗ ИЗМЕНЕНИЙ) ---

    const orderPointsClockwise = (points: { lat: number; lng: number }[]): { lat: number; lng: number }[] => {
        if (points.length <= 3) return [...points];
        const cx = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
        const cy = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
        return [...points].sort((a, b) => {
            const angleA = Math.atan2(a.lat - cy, a.lng - cx);
            const angleB = Math.atan2(b.lat - cy, b.lng - cx);
            return angleB - angleA;
        });
    };

    const checkApiKey = async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            setApiKeyValid(false);
            setLoading(false);
            return false;
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey.trim()}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            setApiKeyValid(response.ok);
            setLoading(false);
            return response.ok;
        } catch {
            setApiKeyValid(false);
            setLoading(false);
            return false;
        }
    };

    const loadUserPolygons = async () => {
        const apiKey = getApiKey();
        if (!apiKey) { setLoading(false); return; }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey.trim()}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.status === 401 || response.status === 403) { setApiKeyValid(false); setLoading(false); return; }
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const safeData = data.map((polygon: any) => ({
                ...polygon,
                area: polygon.area ?? polygon.area_ha ?? 0,
                created_at: polygon.created_at || Date.now(),
            }));
            setPolygons(safeData);
        } catch (err) { console.error('Ошибка загрузки полигонов:', err); } finally { setLoading(false); }
    };

    const createPolygonFromPoints = async () => {
        if (selectedPoints.length < 3) { console.warn('Минимум 3 точки'); return; }
        const name = pointPolygonName.trim();
        if (!name) { console.warn('Укажите название'); return; }
        const apiKey = getApiKey();
        if (!apiKey) { console.warn('Нет API ключа'); return; }
        try {
            const orderedPoints = orderPointsClockwise(selectedPoints);
            const coords = orderedPoints.map(p => [p.lng, p.lat]);
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) coords.push([...first]);

            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    geo_json: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} },
                }),
            });
            if (!response.ok) throw new Error(await response.text());
            const newPolygon = await response.json();
            setPolygons(prev => [{ ...newPolygon, area: newPolygon.area ?? newPolygon.area_ha ?? 0, created_at: newPolygon.created_at || Date.now() }, ...prev]);
            setSelectedPoints([]);
            setPointPolygonName('');
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];
        } catch (err) { console.error('Ошибка создания:', err); }
    };

    const deletePolygon = async (id: string) => {
        if (!window.confirm(t('ndvi.deletePolygon.confirm', 'Удалить поле?'))) return;
        const apiKey = getApiKey();
        if (!apiKey) return;
        try {
            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons/${id}?appid=${apiKey}`, { method: 'DELETE' });
            if (!response.ok) throw new Error(await response.text());
            setPolygons(prev => prev.filter(p => p.id !== id));
            if (selectedFieldId === id) setSelectedFieldId(null);
        } catch (err) { console.error('Ошибка удаления:', err); }
    };

    const fetchNDVI = async () => {
        if (!selectedFieldId) return;
        const apiKey = getApiKey();
        if (!apiKey) return;
        const nowSec = Math.floor(Date.now() / 1000);
        let startSec = ndviStartDate ? Math.floor(new Date(ndviStartDate + 'T00:00:00Z').getTime() / 1000) : nowSec - 30 * 24 * 3600;
        let endSec = ndviEndDate ? Math.floor(new Date(ndviEndDate + 'T23:59:59Z').getTime() / 1000) : nowSec;
        if (startSec > nowSec) startSec = nowSec;
        if (endSec > nowSec) endSec = nowSec;
        if (startSec >= endSec) return;

        setIsFetchingNdvi(true);
        setNdviData(null);
        try {
            let url = `https://api.agromonitoring.com/agro/1.0/ndvi/history?start=${startSec}&end=${endSec}&polyid=${selectedFieldId}&appid=${apiKey}`;
            if (cloudFilterEnabled) url += `&clouds_max=${CLOUD_THRESHOLD}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(await response.text());
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) { setNdviData(null); return; }
            const validRecords = data.filter((item: any) => typeof item.dt === 'number' && item.data && typeof item.data.mean === 'number');
            if (validRecords.length === 0) { setNdviData(null); return; }
            const latest = validRecords[validRecords.length - 1];
            setNdviData({
                mean: latest.data.mean, median: latest.data.median ?? 0, min: latest.data.min ?? 0, max: latest.data.max ?? 0,
                date: new Date(latest.dt * 1000), type: latest.type || '—', dc: latest.dc ?? 100, cl: latest.cl ?? 100,
            });
            setSaveSuccess(null); setSaveError(null);
        } catch (err) { console.error('Ошибка NDVI:', err); setNdviData(null); } finally { setIsFetchingNdvi(false); }
    };

    const saveNdviToDb = async () => {
        if (!ndviData) return;
        const userId = sessionStorage.getItem('userId');
        if (!userId) return;
        const parsedUserId = parseInt(userId, 10);
        if (isNaN(parsedUserId)) return;
        setIsSaving(true);
        setSaveError(null); setSaveSuccess(null);
        try {
            const response = await fetch('/api/ndvimap/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parsedUserId, dateTaken: ndviData.date.toISOString(), mapUrl: null,
                    minNdviValue: ndviData.min, maxNdviValue: ndviData.max, avgNdviValue: ndviData.mean, cloudFilterApplied: cloudFilterEnabled,
                }),
            });
            const result = await response.json();
            if (response.ok) { setSaveSuccess(result.message || '✅ Сохранено'); setTimeout(() => setSaveSuccess(null), 3000); }
            else { setSaveError(result.error || 'Ошибка сохранения'); }
        } catch (err) { console.error(err); setSaveError(t('ndvi.save.networkError', 'Ошибка сети')); } finally { setIsSaving(false); }
    };

    useEffect(() => {
        const init = async () => { const valid = await checkApiKey(); if (valid) await loadUserPolygons(); };
        init();
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        let center: [number, number] = [37.618423, 55.751244];
        if (polygons.length > 0) {
            const coords = polygons[0].geo_json?.geometry?.coordinates;
            if (coords?.[0]?.[0]?.length >= 2) center = [coords[0][0][0], coords[0][0][1]];
        }
        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: { version: 8, sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OSM' } }, layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 20 }] },
            center: center, zoom: 10,
        });
        mapRef.current = map;
        map.on('click', (e: maplibregl.MapMouseEvent) => {
            const { lat, lng } = e.lngLat;
            const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
            setSelectedPoints(prev => [...prev, { lat, lng }]);
            markersRef.current.push(marker);
        });
        return () => { if (mapRef.current) mapRef.current.remove(); };
    }, [polygons]);

    // ИСПРАВЛЕНИЕ: Функция теперь используется в UI ниже
    const handleRemovePoint = (index: number) => {
        markersRef.current[index]?.remove();
        setSelectedPoints(prev => prev.filter((_, i) => i !== index));
        markersRef.current = markersRef.current.filter((_, i) => i !== index);
    };

    const toggleFieldSelection = (id: string) => setSelectedFieldId(prev => prev === id ? null : id);
    const today = new Date().toISOString().split('T')[0];

    // --- RENDER ---

    return (
        <div className="ndvi-layout">

            {/* ЛЕВАЯ ПАНЕЛЬ (САЙДБАР) */}
            <aside className="sidebar-ndvi">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/')} className="btn-icon">←</button>
                    <h2>{t('ndvi.sidebarTitle', 'NDVI Карты')}</h2>
                </div>

                <div className="sidebar-nav">
                    <button
                        onClick={() => navigate('/saved')}
                        className="nav-btn"
                    >
                        📂 {t('ndvi.savedMaps', 'Сохраненные карты')}
                    </button>
                </div>

                <div className="sidebar-info">
                    <p>{t('ndvi.hint', 'Выберите поле или создайте новое, кликая по углам на карте.')}</p>
                </div>

                {getApiKey() && !apiKeyValid && (
                    <div className="api-key-warning-small">
                        ⚠️ {t('ndvi.header.invalidApiKey', 'Недействительный API ключ')}
                    </div>
                )}
            </aside>

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <main className="main-ndvi-content">

                <div className="ndvi-content-inner">
                    {/* Левая часть контента: Карта и список полей */}
                    <div className="map-column">
                        <div className="map-wrapper">
                            <div ref={mapContainerRef} className="ndvi-map-container" />

                            {/* Блок создания полигона из точек (плавающий) */}
                            {selectedPoints.length > 0 && (
                                <div className="create-polygon-overlay">
                                    <h4>{t('ndvi.points.title', 'Новое поле')} ({selectedPoints.length})</h4>
                                    <input
                                        type="text"
                                        placeholder={t('ndvi.points.namePlaceholder', 'Название поля')}
                                        value={pointPolygonName}
                                        onChange={(e) => setPointPolygonName(e.target.value)}
                                        className="polygon-name-input"
                                    />

                                    {/* Добавлен список точек с возможностью удаления */}
                                    <div className="points-mini-list">
                                        {selectedPoints.map((pt, idx) => (
                                            <div key={idx} className="point-mini-item">
                                                <span>{idx + 1}. {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}</span>
                                                <button
                                                    onClick={() => handleRemovePoint(idx)}
                                                    className="remove-point-mini-btn"
                                                    title="Удалить точку"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="polygon-actions">
                                        <button onClick={createPolygonFromPoints} className="ndvi-primary-button small">
                                            {t('ndvi.points.createButton', 'Создать')}
                                        </button>
                                        <button onClick={() => {
                                            markersRef.current.forEach(m => m.remove());
                                            markersRef.current = [];
                                            setSelectedPoints([]);
                                        }} className="ndvi-secondary-button small">
                                            Отмена
                                        </button>
                                    </div>
                                    <div className="points-hint">
                                        ⚠️ {t('ndvi.points.hint', 'Кликайте по углам поля.')}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Список полей */}
                        <div className="polygons-list-container">
                            <h3>{t('ndvi.sidebar.myFields', 'Мои поля')} ({polygons.length})</h3>
                            {loading ? (
                                <div className="loading">{t('common.loading', 'Загрузка...')}</div>
                            ) : (
                                <div className="polygons-list-scroll">
                                    {polygons.length === 0 ? (
                                        <div className="no-polygons">
                                            {apiKeyValid === false
                                                ? t('ndvi.sidebar.invalidApiKeyDetailed', '❌ Недействительный API ключ.')
                                                : t('ndvi.sidebar.noPolygons', 'Нет созданных полей.')}
                                        </div>
                                    ) : (
                                        polygons.map((polygon) => (
                                            <div
                                                key={polygon.id}
                                                className={`field-card ${selectedFieldId === polygon.id ? 'selected' : ''}`}
                                                onClick={() => toggleFieldSelection(polygon.id)}
                                            >
                                                <div className="field-name">
                                                    {polygon.name || t('ndvi.field.defaultName', 'Поле')}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deletePolygon(polygon.id);
                                                        }}
                                                        className="field-delete-btn"
                                                    >
                                                        {t('common.delete', 'Удалить')}
                                                    </button>
                                                </div>
                                                <div className="field-meta">
                                                    <span>{(polygon.area ?? 0).toFixed(2)} {t('ndvi.field.areaUnit', 'га')}</span>
                                                    <span>
                                                        {typeof polygon.created_at === 'number'
                                                            ? new Date(polygon.created_at * 1000).toLocaleDateString(language)
                                                            : typeof polygon.created_at === 'string'
                                                                ? new Date(polygon.created_at).toLocaleDateString(language)
                                                                : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Правая часть контента: Детали NDVI */}
                    <div className="details-column">
                        {selectedFieldId ? (
                            <>
                                <div className="field-controls">
                                    <h3>{t('ndvi.selectedField.title', 'Анализ поля')}</h3>
                                    <span className="field-id-tag">{selectedFieldId}</span>

                                    <div className="date-picker-row">
                                        <input
                                            type="date"
                                            className="date-input"
                                            value={ndviStartDate}
                                            onChange={(e) => setNdviStartDate(e.target.value)}
                                            max={today}
                                        />
                                        <button onClick={fetchNDVI} className="ndvi-primary-button" disabled={isFetchingNdvi}>
                                            {isFetchingNdvi ? t('common.loading', 'Загрузка...') : t('ndvi.selectedField.fetchButton', 'Получить NDVI')}
                                        </button>
                                    </div>


                                </div>

                                {isFetchingNdvi && (
                                    <div className="ndvi-loading-spinner">
                                        <div className="spinner"></div>
                                        <p>{t('ndvi.result.fetching', 'Получение данных NDVI...')}</p>
                                    </div>
                                )}

                                {!isFetchingNdvi && ndviData && (
                                    <div className="ndvi-card-container">
                                        <div className="ndvi-card-header">
                                            <h4>📊 Анализ NDVI</h4>
                                            <span className="ndvi-date-badge">{ndviData.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                        </div>

                                        <div className="ndvi-main-metric">
                                            <div className="metric-circle" style={{ borderColor: getNdviColor(ndviData.mean) }}>
                                                <span className="metric-value" style={{ color: getNdviColor(ndviData.mean) }}>
                                                    {ndviData.mean.toFixed(2)}
                                                </span>
                                                <span className="metric-label">NDVI</span>
                                            </div>
                                            <div className="metric-info">
                                                <p><strong>Спутник:</strong> {ndviData.type === 's2' ? 'Sentinel-2' : ndviData.type === 'l8' ? 'Landsat 8' : ndviData.type}</p>
                                                <p><strong>Покрытие:</strong> {ndviData.dc}%</p>
                                                <p><strong>Облачность:</strong>
                                                    <span className={ndviData.cl > CLOUD_THRESHOLD ? 'high-cloud' : ''}>
                                                        {ndviData.cl}% {cloudFilterEnabled && `(фильтр)`}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="ndvi-stats-grid">
                                            <div className="stat-item">
                                                <span className="stat-label">Мин</span>
                                                <span className="stat-value">{ndviData.min.toFixed(2)}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Мед</span>
                                                <span className="stat-value">{ndviData.median.toFixed(2)}</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-label">Макс</span>
                                                <span className="stat-value">{ndviData.max.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {saveSuccess && <div className="success-message">{saveSuccess}</div>}
                                        {saveError && <div className="error-message">{saveError}</div>}

                                        <button
                                            onClick={saveNdviToDb}
                                            className="ndvi-save-btn"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? 'Сохранение...' : '💾 Сохранить в профиль'}
                                        </button>
                                    </div>
                                )}

                                {!isFetchingNdvi && !ndviData && (
                                    <div className="no-data-message">
                                        {t('ndvi.result.noData', 'Нажмите "Получить NDVI", чтобы загрузить данные.')}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-selection-message">
                                <p>{t('ndvi.selectFieldPrompt', 'Выберите поле из списка слева или создайте новое, кликнув на карту.')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default NDVIPage;