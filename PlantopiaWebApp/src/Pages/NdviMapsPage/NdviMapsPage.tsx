import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NdviMapsPage.css';

import { type NdviMap } from '../../Interfaces/NdviMap.ts';

function NdviMapsPage() {
    const [maps, setMaps] = useState<NdviMap[]>([]);
    const navigate = useNavigate();

    // Заглушка: имитация загрузки данных
    useEffect(() => {
        const mockData: NdviMap[] = [
            {
                id: 1,
                user_id: 1,
                date_taken: "2024-05-10",
                map_url: "",
                min_ndvi_value: 0.123,
                max_ndvi_value: 0.876,
                avg_ndvi_value: 0.542,
                cloud_filter_applied: true,
                created_at: "2024-05-11T09:30:00Z"
            },
            {
                id: 2,
                user_id: 1,
                date_taken: "2024-04-22",
                map_url: "",
                min_ndvi_value: 0.050,
                max_ndvi_value: 0.720,
                avg_ndvi_value: 0.380,
                cloud_filter_applied: false,
                created_at: "2024-04-23T14:15:00Z"
            }
        ];
        setMaps(mockData);
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleBack = () => {
        navigate('/saved');
    };

    return (
        <div className="ndvi-maps-container">
            <div className="header-actions">
                <h1 className="page-title3">NDVI-карты</h1>
                <button className="back-btn" onClick={handleBack}>Назад</button>
            </div>

            <div className="table-wrapper">
                <table className="ndvi-table">
                    <thead>
                    <tr>
                        <th>Дата съёмки</th>
                        <th>Карта</th>
                        <th>Средний NDVI</th>
                        <th>Мин / Макс</th>
                        <th>Фильтр облаков</th>
                        <th>Создано</th>
                    </tr>
                    </thead>
                    <tbody>
                    {maps.map((map) => (
                        <tr key={map.id}>
                            <td>{formatDate(map.date_taken)}</td>
                            <td className="map-preview-cell">
                                {map.map_url ? (
                                    <a
                                        href={map.map_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="map-link"
                                    >
                                        <img
                                            src={map.map_url}
                                            alt={`NDVI карта от ${map.date_taken}`}
                                            className="map-preview"
                                        />
                                    </a>
                                ) : (
                                    <span className="no-map">Карта недоступна</span>
                                )}
                            </td>
                            <td>
                                {map.avg_ndvi_value !== null
                                    ? map.avg_ndvi_value.toFixed(3)
                                    : '—'}
                            </td>
                            <td>
                                {map.min_ndvi_value !== null && map.max_ndvi_value !== null
                                    ? `${map.min_ndvi_value.toFixed(3)} / ${map.max_ndvi_value.toFixed(3)}`
                                    : '—'}
                            </td>
                            <td>
                                    <span
                                        className={`filter-badge ${
                                            map.cloud_filter_applied ? 'applied' : 'not-applied'
                                        }`}
                                    >
                                        {map.cloud_filter_applied ? 'Применён' : 'Не применён'}
                                    </span>
                            </td>
                            <td>{formatDateTime(map.created_at)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default NdviMapsPage;