// NdviMapsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NdviMapsPage.css';
import { type NdviMap } from '../../Interfaces/NdviMap.ts';

function NdviMapsPage() {
    const [maps, setMaps] = useState<NdviMap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadNdviMaps = async () => {
            const userIdStr = sessionStorage.getItem('userId');
            if (!userIdStr) {
                setError('Пользователь не авторизован');
                setLoading(false);
                return;
            }

            const userId = parseInt(userIdStr, 10);
            if (isNaN(userId)) {
                setError('Некорректный ID пользователя');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/saveddata/savedndvi?userId=${userId}`);
                if (!response.ok) {
                    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
                }
                const data: NdviMap[] = await response.json();
                setMaps(data);
            } catch (err) {
                console.error('Ошибка загрузки NDVI-карт:', err);
                setError('Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        };

        loadNdviMaps();
    }, []);

    const deleteNdviMap = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту NDVI-карту?')) {
            return;
        }

        const userIdStr = sessionStorage.getItem('userId');
        if (!userIdStr) {
            alert('Ошибка: пользователь не авторизован');
            return;
        }

        try {
            const response = await fetch(`/api/saveddata/ndvi/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': userIdStr,
                },
            });

            if (response.ok) {
                // Успешно удалено — обновляем список
                setMaps(maps.filter(map => map.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка удаления: ${errorMessage || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            console.error('Ошибка при удалении:', err);
            alert('Не удалось удалить карту. Проверьте соединение.');
        }
    };

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

    if (loading) {
        return <div className="ndvi-maps-container"><p>Загрузка...</p></div>;
    }

    if (error) {
        return (
            <div className="ndvi-maps-container">
                <p className="error-message">Ошибка: {error}</p>
                <button onClick={handleBack}>Назад</button>
            </div>
        );
    }

    return (
        <div className="ndvi-maps-container">
            <div className="header-actions">
                <h1 className="page-title3">NDVI-карты</h1>
                <button className="back-btn" onClick={handleBack}>Назад</button>
            </div>

            {maps.length === 0 ? (
                <p className="no-data">У вас пока нет сохранённых NDVI-карт.</p>
            ) : (
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
                            <th>Действия</th> {/* ← новая колонка */}
                        </tr>
                        </thead>
                        <tbody>
                        {maps.map((map) => (
                            <tr key={map.id}>
                                <td>{formatDate(map.dateTaken)}</td>
                                <td className="map-preview-cell">
                                    {map.mapUrl ? (
                                        <a
                                            href={map.mapUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="map-link"
                                        >
                                            <img
                                                src={map.mapUrl}
                                                alt={`NDVI карта от ${map.dateTaken}`}
                                                className="map-preview"
                                            />
                                        </a>
                                    ) : (
                                        <span className="no-map">Карта недоступна</span>
                                    )}
                                </td>
                                <td>
                                    {map.avgNdviValue != null
                                        ? map.avgNdviValue.toFixed(3)
                                        : '—'}
                                </td>
                                <td>
                                    {map.minNdviValue != null && map.maxNdviValue != null
                                        ? `${map.minNdviValue.toFixed(3)} / ${map.maxNdviValue.toFixed(3)}`
                                        : '—'}
                                </td>
                                <td>
                                        <span
                                            className={`filter-badge ${
                                                map.cloudFilterApplied ? 'applied' : 'not-applied'
                                            }`}
                                        >
                                            {map.cloudFilterApplied ? 'Применён' : 'Не применён'}
                                        </span>
                                </td>
                                <td>{formatDateTime(map.createdAt)}</td>
                                <td>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteNdviMap(map.id)}
                                        aria-label="Удалить NDVI-карту"
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default NdviMapsPage;