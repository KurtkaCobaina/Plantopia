// src/Pages/NDVIPage.tsx
import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
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

const NDVIPage = () => {
    const [polygons, setPolygons] = useState<AgroPolygon[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPoints, setSelectedPoints] = useState<{ lat: number; lng: number }[]>([]);
    const [pointPolygonName, setPointPolygonName] = useState('');
    const [ndviStartDate, setNdviStartDate] = useState<string>('');
    const [ndviEndDate, setNdviEndDate] = useState<string>('');
    const [ndviData, setNdviData] = useState<NdviData | null>(null);
    const [cloudFilterEnabled, setCloudFilterEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const CLOUD_THRESHOLD = 30;
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const { t, language } = useI18n();

    // Получить API ключ
    const getApiKey = () => sessionStorage.getItem('ndvi_api_key') || '';

    // Упорядочить точки по часовой стрелке
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

    // Проверка API ключа
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
            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey.trim()}`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const isValid = response.ok;
            setApiKeyValid(isValid);
            setLoading(false);
            return isValid;
        } catch {
            setApiKeyValid(false);
            setLoading(false);
            return false;
        }
    };

    // Загрузка существующих полей
    const loadUserPolygons = async () => {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error('API ключ не найден');
            setLoading(false);
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey.trim()}`, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.status === 401 || response.status === 403) {
                setApiKeyValid(false);
                setLoading(false);
                return;
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            const safeData = data.map((polygon: any) => ({
                ...polygon,
                area: polygon.area ?? polygon.area_ha ?? 0,
                created_at: polygon.created_at || Date.now(),
            }));

            setPolygons(safeData);
        } catch (err) {
            console.error('Ошибка загрузки полигонов:', err);
        } finally {
            setLoading(false);
        }
    };

    // Создание полигона из точек на карте
    const createPolygonFromPoints = async () => {
        if (selectedPoints.length < 3) {
            alert(t('ndvi.createPolygon.tooFewPoints', 'Для полигона нужно минимум 3 точки'));
            return;
        }

        const name = pointPolygonName.trim();
        if (!name) {
            alert(t('ndvi.createPolygon.noName', 'Укажите название поля'));
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            alert(t('ndvi.apiKey.notSet', 'API ключ не задан. Укажите его в профиле.'));
            return;
        }

        try {
            const orderedPoints = orderPointsClockwise(selectedPoints);
            const coords = orderedPoints.map(p => [p.lng, p.lat]);

            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                coords.push([...first]);
            }

            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    geo_json: {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [coords],
                        },
                        properties: {},
                    },
                }),
            });

            if (!response.ok) {
                let errorMessage = t('ndvi.createPolygon.errorDefault', 'Не удалось создать полигон.');
                try {
                    const errorJson = await response.json();
                    if (errorJson.message) errorMessage = errorJson.message;
                } catch {
                    const text = await response.text();
                    errorMessage = text || `HTTP ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            const newPolygon = await response.json();

            setPolygons(prev => [
                {
                    ...newPolygon,
                    area: newPolygon.area ?? newPolygon.area_ha ?? 0,
                    created_at: newPolygon.created_at || Date.now(),
                },
                ...prev,
            ]);

            setSelectedPoints([]);
            setPointPolygonName('');
            markersRef.current.forEach(m => m.remove());
            markersRef.current = [];

            alert(t('ndvi.createPolygon.success', '✅ Полигон успешно создан!'));
        } catch (err) {
            console.error('Ошибка при создании полигона:', err);
            alert(
                `❌ ${t('ndvi.common.error', 'Ошибка')}:\n${
                    err instanceof Error ? err.message : t('common.unknownError', 'Неизвестная ошибка')
                }`
            );
        }
    };

    // Удаление полигона
    const deletePolygon = async (id: string) => {
        if (!window.confirm(t('ndvi.deletePolygon.confirm', 'Вы уверены, что хотите удалить это поле?'))) return;

        const apiKey = getApiKey();
        if (!apiKey) {
            alert(t('ndvi.apiKey.notSetShort', 'API ключ не задан.'));
            return;
        }

        try {
            const response = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons/${id}?appid=${apiKey}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            setPolygons(prev => prev.filter(p => p.id !== id));
            if (selectedFieldId === id) {
                setSelectedFieldId(null);
            }

            alert('✅ Полигон успешно удалён.');
        } catch (err) {
            console.error('Ошибка при удалении полигона:', err);
            alert(
                `❌ ${t('ndvi.deletePolygon.errorPrefix', 'Не удалось удалить полигон:')}\n${
                    err instanceof Error ? err.message : t('common.unknownError', 'неизвестная ошибка')
                }`
            );
        }
    };

    // Получение истории NDVI
    const fetchNDVI = async () => {
        if (!selectedFieldId) {
            alert(t('ndvi.fetch.noField', 'Сначала выберите поле'));
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            alert(t('ndvi.apiKey.notSetShort', 'API ключ не задан'));
            return;
        }

        const nowSec = Math.floor(Date.now() / 1000);
        let startSec: number;
        let endSec: number;

        try {
            if (ndviStartDate) {
                const start = new Date(ndviStartDate + 'T00:00:00Z');
                startSec = Math.floor(start.getTime() / 1000);
            } else {
                startSec = nowSec - 30 * 24 * 3600;
            }

            if (ndviEndDate) {
                const end = new Date(ndviEndDate + 'T23:59:59Z');
                endSec = Math.floor(end.getTime() / 1000);
            } else {
                endSec = nowSec;
            }

            if (startSec > nowSec) startSec = nowSec;
            if (endSec > nowSec) endSec = nowSec;

            if (startSec >= endSec) {
                alert(t('ndvi.fetch.invalidDateRange', 'Дата начала должна быть раньше даты окончания'));
                return;
            }
        } catch (e) {
            alert(t('ndvi.fetch.invalidDateFormat', 'Неверный формат даты'));
            return;
        }

        try {
            let url = `https://api.agromonitoring.com/agro/1.0/ndvi/history?start=${startSec}&end=${endSec}&polyid=${selectedFieldId}&appid=${apiKey}`;
            if (cloudFilterEnabled) {
                url += `&clouds_max=${CLOUD_THRESHOLD}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                setNdviData(null);
                alert(t('ndvi.fetch.noDataInPeriod', 'Нет данных NDVI за выбранный период'));
                return;
            }

            const validRecords = data.filter((item: any) =>
                typeof item.dt === 'number' &&
                item.data &&
                typeof item.data.mean === 'number'
            );

            if (validRecords.length === 0) {
                setNdviData(null);
                alert(t('ndvi.fetch.noValidValues', 'Нет корректных NDVI-значений'));
                return;
            }

            const latest = validRecords[validRecords.length - 1];

            setNdviData({
                mean: latest.data.mean,
                median: latest.data.median ?? 0,
                min: latest.data.min ?? 0,
                max: latest.data.max ?? 0,
                date: new Date(latest.dt * 1000),
                type: latest.type || '—',
                dc: latest.dc ?? 100,
                cl: latest.cl ?? 100,
            });

            // Очищаем предыдущие сообщения о сохранении
            setSaveSuccess(null);
            setSaveError(null);

        } catch (err) {
            console.error('Ошибка получения NDVI:', err);
            setNdviData(null);
            alert(
                `❌ ${t('ndvi.fetch.errorPrefix', 'Ошибка NDVI')}:\n${
                    err instanceof Error ? err.message : t('common.unknownError', 'неизвестная ошибка')
                }`
            );
        }
    };

    // Сохранение NDVI в базу (упрощенная версия без JWT)
    const saveNdviToDb = async () => {
        if (!ndviData) {
            alert(t('ndvi.save.noData', 'Нет данных для сохранения'));
            return;
        }

        // Получаем ID пользователя из sessionStorage
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert(t('ndvi.save.unauthorized', 'ID пользователя не найден. Войдите в систему.'));
            return;
        }

        // Парсим ID пользователя
        const parsedUserId = parseInt(userId, 10);
        if (isNaN(parsedUserId) || parsedUserId <= 0) {
            alert('Некорректный ID пользователя');
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(null);

        try {
            // Простой POST запрос без авторизации
            const response = await fetch('/api/ndvimap/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: parsedUserId,
                    dateTaken: ndviData.date.toISOString(),
                    mapUrl: null,
                    minNdviValue: ndviData.min,
                    maxNdviValue: ndviData.max,
                    avgNdviValue: ndviData.mean,
                    cloudFilterApplied: cloudFilterEnabled,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setSaveSuccess(result.message || '✅ NDVI-данные сохранены в профиль');
                // Очищаем сообщение через 3 секунды
                setTimeout(() => setSaveSuccess(null), 3000);
            } else {
                setSaveError(result.error || 'Ошибка при сохранении');
            }
        } catch (err) {
            console.error('Ошибка сохранения NDVI:', err);
            setSaveError(t('ndvi.save.networkError', 'Не удалось сохранить данные. Проверьте подключение.'));
        } finally {
            setIsSaving(false);
        }
    };

    // Инициализация при монтировании
    useEffect(() => {
        const init = async () => {
            const valid = await checkApiKey();
            if (valid) await loadUserPolygons();
        };
        init();
    }, []);

    // Инициализация карты
    useEffect(() => {
        if (!mapContainerRef.current) return;

        let center: [number, number] = [37.618423, 55.751244];
        if (polygons.length > 0) {
            const coords = polygons[0].geo_json?.geometry?.coordinates;
            if (coords?.[0]?.[0]?.length >= 2) {
                const [lng, lat] = coords[0][0];
                center = [lng, lat];
            }
        }

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
            center: center,
            zoom: 10,
        });

        mapRef.current = map;

        const handleClick = (e: maplibregl.MapMouseEvent) => {
            const { lat, lng } = e.lngLat;
            const marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
            setSelectedPoints(prev => [...prev, { lat, lng }]);
            markersRef.current.push(marker);
        };

        map.on('click', handleClick);

        return () => {
            if (mapRef.current) mapRef.current.remove();
        };
    }, [polygons]);

    // Удаление одной точки
    const handleRemovePoint = (index: number) => {
        markersRef.current[index]?.remove();
        setSelectedPoints(prev => prev.filter((_, i) => i !== index));
        markersRef.current = markersRef.current.filter((_, i) => i !== index);
    };

    // Выбор одного поля
    const toggleFieldSelection = (id: string) => {
        setSelectedFieldId(prev => prev === id ? null : id);
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="ndvi-page">
            <div className="map-header">
                <h2>{t('ndvi.header.myFields', 'Мои поля')}</h2>
                {apiKeyValid === false && (
                    <div className="api-key-warning">
                        ⚠️ {t('ndvi.header.invalidApiKey', 'Недействительный API ключ')}
                    </div>
                )}
            </div>

            <div className="ndvi-content">
                <div className="map-container" ref={mapContainerRef} />

                <div className="polygons-sidebar">
                    <h3>{t('ndvi.sidebar.myFields', 'Мои поля')} ({polygons.length})</h3>
                    {loading ? (
                        <div className="loading">{t('common.loading', 'Загрузка...')}</div>
                    ) : (
                        <div className="polygons-list">
                            {polygons.length === 0 ? (
                                <div className="no-polygons">
                                    {apiKeyValid === false
                                        ? t('ndvi.sidebar.invalidApiKeyDetailed', '❌ Недействительный API ключ. Проверьте ключ в профиле.')
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
                                        <div className="field-area">
                                            {(polygon.area ?? 0).toFixed(2)} {t('ndvi.field.areaUnit', 'га')}
                                        </div>
                                        <div className="field-date">
                                            {typeof polygon.created_at === 'number'
                                                ? new Date(polygon.created_at * 1000).toLocaleDateString(language)
                                                : typeof polygon.created_at === 'string'
                                                    ? new Date(polygon.created_at).toLocaleDateString(language)
                                                    : t('ndvi.field.noDate', 'Нет даты')}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Выбранное поле + NDVI */}
            {selectedFieldId && (
                <div className="selected-field-ids">
                    <h3>{t('ndvi.selectedField.title', 'Выбранное поле:')}</h3>
                    <div className="ids-list">
                        <span className="field-id-tag">{selectedFieldId}</span>
                        <input
                            type="date"
                            className="date-input"
                            value={ndviStartDate}
                            onChange={(e) => setNdviStartDate(e.target.value)}
                            max={today}
                        />
                        <input
                            type="date"
                            className="date-input"
                            value={ndviEndDate}
                            onChange={(e) => setNdviEndDate(e.target.value)}
                            max={today}
                        />
                        <button onClick={fetchNDVI} className="ndvi-primary-button">
                            {t('ndvi.selectedField.fetchButton', 'Получить NDVI')}
                        </button>

                        <label className="cloud-filter-toggle">
                            <input
                                type="checkbox"
                                checked={cloudFilterEnabled}
                                onChange={(e) => setCloudFilterEnabled(e.target.checked)}
                            />
                            {t('ndvi.selectedField.cloudLabel', 'Облачность')} ≤ {CLOUD_THRESHOLD}%
                        </label>
                    </div>

                    {/* Отображение NDVI */}
                    {ndviData && (
                        <div className="ndvi-result">
                            <h4>📊 {t('ndvi.result.title', 'Статистика NDVI')}</h4>
                            <p><strong>{t('ndvi.result.date', 'Дата:')}</strong> {ndviData.date.toLocaleDateString(language)}</p>
                            <p><strong>{t('ndvi.result.satellite', 'Спутник:')}</strong> {ndviData.type === 's2' ? 'Sentinel-2' : ndviData.type === 'l8' ? 'Landsat 8' : ndviData.type}</p>
                            <p><strong>{t('ndvi.result.dc', 'Покрытие (dc):')}</strong> {ndviData.dc}%</p>
                            <p><strong>{t('ndvi.result.cl', 'Облачность (cl):')}</strong> {ndviData.cl}%</p>
                            <p><strong>{t('ndvi.result.cloudFilter', 'Фильтр облаков:')}</strong> {cloudFilterEnabled ? t('ndvi.result.cloudFilterOn', `включён (≤${CLOUD_THRESHOLD}%)`) : t('ndvi.result.cloudFilterOff', 'выключен')}</p>
                            <p><strong>{t('ndvi.result.mean', 'NDVI (mean):')}</strong> <span className="ndvi-mean-value">{ndviData.mean.toFixed(4)}</span></p>
                            <p><strong>{t('ndvi.result.median', 'Медиана:')}</strong> {ndviData.median.toFixed(4)}</p>
                            <p><strong>{t('ndvi.result.range', 'Диапазон:')}</strong> {ndviData.min.toFixed(4)} — {ndviData.max.toFixed(4)}</p>

                            {/* Индикация сохранения */}
                            {saveSuccess && <div className="success-message">{saveSuccess}</div>}
                            {saveError && <div className="error-message">{saveError}</div>}

                            {/* Кнопка сохранения */}
                            <button
                                onClick={saveNdviToDb}
                                className="ndvi-secondary-button"
                                disabled={isSaving}
                                style={{ marginTop: '16px' }}
                            >
                                {isSaving ? 'Сохранение...' : t('ndvi.save.button', 'Сохранить в профиль')}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Точки на карте + создание полигона */}
            {selectedPoints.length > 0 && (
                <div className="selected-points-section">
                    <h3>{t('ndvi.points.title', 'Точки на карте')} ({selectedPoints.length})</h3>
                    <div className="points-input-container">
                        <input
                            type="text"
                            placeholder={t('ndvi.points.namePlaceholder', 'Название поля')}
                            value={pointPolygonName}
                            onChange={(e) => setPointPolygonName(e.target.value)}
                        />
                        <button onClick={createPolygonFromPoints} className="ndvi-primary-button create-polygon-btn">
                            {t('ndvi.points.createButton', 'Создать полигон из точек')}
                        </button>
                        <div className="points-warning">
                            ⚠️ {t('ndvi.points.hint', 'Кликайте по углам поля в любом порядке — система сама построит корректный контур.')}
                        </div>
                    </div>
                    <ul className="points-list">
                        {selectedPoints.map((point, idx) => (
                            <li key={idx} className="point-item">
                                <span>{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</span>
                                <button className="remove-point-btn" onClick={() => handleRemovePoint(idx)}>
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default NDVIPage;