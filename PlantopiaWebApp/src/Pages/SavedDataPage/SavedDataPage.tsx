import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SavedDataPage.css';
import { type Diagnosis } from '../../Interfaces/Diagnosis.ts';
// Убедитесь, что в вашем интерфейсе FertilizerCalculation добавлены поля cropName и soilName
import { type FertilizerCalculation } from '../../Interfaces/FertilizerCalculation.ts';
import { type NdviMap } from '../../Interfaces/NdviMap.ts';

type TabType = 'diagnoses' | 'calculations' | 'ndvi';
type SortOrder = 'asc' | 'desc'; // Тип для направления сортировки

const SavedDataPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('diagnoses');

    // Состояния данных
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [calculations, setCalculations] = useState<FertilizerCalculation[]>([]);
    const [ndviMaps, setNdviMaps] = useState<NdviMap[]>([]);

    // Состояния загрузки
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Состояния для сортировки (по умолчанию - по убыванию, новые сверху)
    const [diagSortOrder, setDiagSortOrder] = useState<SortOrder>('desc');
    const [calcSortOrder, setCalcSortOrder] = useState<SortOrder>('desc');
    const [ndviSortOrder, setNdviSortOrder] = useState<SortOrder>('desc');

    // --- СОСТОЯНИЯ ДЛЯ ФИЛЬТРАЦИИ ПО ДАТЕ ---
    const [diagDateFilter, setDiagDateFilter] = useState<string>('');
    const [calcDateFilter, setCalcDateFilter] = useState<string>('');
    const [ndviDateFilter, setNdviDateFilter] = useState<string>('');

    const userId = useMemo(() => {
        const idStr = sessionStorage.getItem('userId');
        return idStr ? parseInt(idStr, 10) : null;
    }, []);

    // Загрузка всех данных при монтировании
    useEffect(() => {
        if (!userId) {
            setError('Пользователь не авторизован');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Параллельная загрузка всех трех типов данных
                const [diagRes, calcRes, ndviRes] = await Promise.all([
                    fetch(`/api/saveddata/saveddiagnosis?userId=${userId}`),
                    fetch(`/api/saveddata/savedfertilizer?userId=${userId}`),
                    fetch(`/api/saveddata/savedndvi?userId=${userId}`)
                ]);

                if (!diagRes.ok || !calcRes.ok || !ndviRes.ok) {
                    throw new Error('Ошибка загрузки данных');
                }

                setDiagnoses(await diagRes.json());
                setCalculations(await calcRes.json());
                setNdviMaps(await ndviRes.json());

            } catch (err) {
                console.error(err);
                setError('Не удалось загрузить сохраненные данные');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    // --- Функции удаления ---

    const deleteDiagnosis = async (id: number) => {
        if (!window.confirm('Удалить этот диагноз?')) return;
        try {
            const res = await fetch(`/api/saveddata/diagnosis/${id}`, {
                method: 'DELETE',
                headers: { 'X-User-Id': userId?.toString() || '' }
            });
            if (res.ok) setDiagnoses(prev => prev.filter(d => d.id !== id));
            else alert('Ошибка удаления');
        } catch (e) { alert('Ошибка сети'); }
    };

    const deleteCalculation = async (id: number) => {
        if (!window.confirm('Удалить этот расчет?')) return;
        try {
            const res = await fetch(`/api/saveddata/fertilizer/${id}`, {
                method: 'DELETE',
                headers: { 'X-User-Id': userId?.toString() || '' }
            });
            if (res.ok) setCalculations(prev => prev.filter(c => c.id !== id));
            else alert('Ошибка удаления');
        } catch (e) { alert('Ошибка сети'); }
    };

    const deleteNdviMap = async (id: number) => {
        if (!window.confirm('Удалить эту карту NDVI?')) return;
        try {
            const res = await fetch(`/api/saveddata/ndvi/${id}`, {
                method: 'DELETE',
                headers: { 'X-User-Id': userId?.toString() || '' }
            });
            if (res.ok) setNdviMaps(prev => prev.filter(m => m.id !== id));
            else alert('Ошибка удаления');
        } catch (e) { alert('Ошибка сети'); }
    };

    // --- Логика сортировки и фильтрации с помощью useMemo ---

    // Вспомогательная функция для получения строки даты YYYY-MM-DD из ISO строки
    const getDatePart = (isoString: string): string => {
        if (!isoString) return '';
        return isoString.substring(0, 10);
    };

    // Сортировка и фильтрация диагнозов
    const sortedAndFilteredDiagnoses = useMemo(() => {
        let result = [...diagnoses];
        if (diagDateFilter) {
            result = result.filter(d => getDatePart(d.createdAt) === diagDateFilter);
        }
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return diagSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        return result;
    }, [diagnoses, diagSortOrder, diagDateFilter]);

    // Сортировка и фильтрация расчетов
    const sortedAndFilteredCalculations = useMemo(() => {
        let result = [...calculations];
        if (calcDateFilter) {
            result = result.filter(c => getDatePart(c.calculatedAt) === calcDateFilter);
        }
        result.sort((a, b) => {
            const dateA = new Date(a.calculatedAt).getTime();
            const dateB = new Date(b.calculatedAt).getTime();
            return calcSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        return result;
    }, [calculations, calcSortOrder, calcDateFilter]);

    // Сортировка и фильтрация карт NDVI
    const sortedAndFilteredNdviMaps = useMemo(() => {
        let result = [...ndviMaps];
        if (ndviDateFilter) {
            result = result.filter(m => getDatePart(m.dateTaken) === ndviDateFilter);
        }
        result.sort((a, b) => {
            const dateA = new Date(a.dateTaken).getTime();
            const dateB = new Date(b.dateTaken).getTime();
            return ndviSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        return result;
    }, [ndviMaps, ndviSortOrder, ndviDateFilter]);


    // --- Рендер контента в зависимости от таба ---

    // Компонент для кнопок сортировки и инпута даты
    const FilterControls = ({
                                sortOrder, setSortOrder,
                                dateFilter, setDateFilter
                            }: {
        sortOrder: SortOrder, setSortOrder: (o: SortOrder) => void,
        dateFilter: string, setDateFilter: (d: string) => void
    }) => (
        <div className="filter-sort-bar" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                title="Фильтр по конкретной дате"
            />
            <button
                className={`sort-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                onClick={() => setSortOrder('asc')}
                title="Сначала старые"
            >
                ↑ По дате (старые)
            </button>
            <button
                className={`sort-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                onClick={() => setSortOrder('desc')}
                title="Сначала новые"
            >
                ↓ По дате (новые)
            </button>
            {dateFilter && (
                <button
                    onClick={() => setDateFilter('')}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', background: '#fee2e2', color: '#dc2626', cursor: 'pointer' }}
                    title="Очистить фильтр по дате"
                >
                    ✕ Очистить дату
                </button>
            )}
        </div>
    );

    const renderContent = () => {
        if (loading) return <div className="page-loader">Загрузка данных...</div>;
        if (error) return <div className="page-error">{error}</div>;

        switch (activeTab) {
            case 'diagnoses':
                return (
                    <>
                        <FilterControls
                            sortOrder={diagSortOrder} setSortOrder={setDiagSortOrder}
                            dateFilter={diagDateFilter} setDateFilter={setDiagDateFilter}
                        />
                        <div className="cards-grid">
                            {sortedAndFilteredDiagnoses.length === 0 ? <EmptyState text="Нет сохраненных диагнозов" /> :
                                sortedAndFilteredDiagnoses.map(d => (
                                    <div key={d.id} className="data-card diagnosis-card">
                                        <div className="card-header">
                                            <span className={`status-badge ${d.issuesDetected ? 'has-issues' : 'no-issues'}`}>
                                                {d.issuesDetected ? 'Проблемы' : 'Здорово'}
                                            </span>
                                            <button className="delete-btn-small" onClick={() => deleteDiagnosis(d.id)}>✕</button>
                                        </div>
                                        <div className="card-image-container">
                                            {d.imageUrl ? (
                                                <img src={d.imageUrl} alt="Plant" className="card-img" />
                                            ) : (
                                                <div className="card-img-placeholder">Нет фото</div>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <h3>{d.plantName || 'Неизвестное растение'}</h3>
                                            <p className="meta-info">Уверенность: {(d.confidence * 100).toFixed(1)}%</p>
                                            <p className="meta-info date">{new Date(d.createdAt).toLocaleDateString()}</p>
                                            {d.issuesDetected && d.diseaseDetails && (
                                                <p className="details-text">{d.diseaseDetails}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </>
                );

            case 'calculations':
                return (
                    <>
                        <FilterControls
                            sortOrder={calcSortOrder} setSortOrder={setCalcSortOrder}
                            dateFilter={calcDateFilter} setDateFilter={setCalcDateFilter}
                        />
                        <div className="cards-grid">
                            {sortedAndFilteredCalculations.length === 0 ? <EmptyState text="Нет сохраненных расчетов" /> :
                                sortedAndFilteredCalculations.map(c => (
                                    <div key={c.id} className="data-card calculation-card">
                                        <div className="card-header">
                                            <span className="type-badge">Расчет N-P-K</span>
                                            <button className="delete-btn-small" onClick={() => deleteCalculation(c.id)}>✕</button>
                                        </div>
                                        <div className="card-body">
                                            {/* ИЗМЕНЕНИЕ: Используем cropName и soilName вместо ID */}
                                            <h3>{c.cropName ?? `Культура ID: ${c.cropId ?? '—'}`}</h3>
                                            <p className="meta-info">{c.soilName ?? `Почва ID: ${c.soilId ?? '—'}`}</p>

                                            <div className="npk-stats">
                                                <div className="stat-item"><strong>N:</strong> {c.recommendedNKgHa?.toFixed(1) ?? '—'}</div>
                                                <div className="stat-item"><strong>P:</strong> {c.recommendedPKgHa?.toFixed(1) ?? '—'}</div>
                                                <div className="stat-item"><strong>K:</strong> {c.recommendedKKgHa?.toFixed(1) ?? '—'}</div>
                                            </div>
                                            <p className="meta-info date">{new Date(c.calculatedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </>
                );

            case 'ndvi':
                return (
                    <>
                        <FilterControls
                            sortOrder={ndviSortOrder} setSortOrder={setNdviSortOrder}
                            dateFilter={ndviDateFilter} setDateFilter={setNdviDateFilter}
                        />
                        <div className="cards-grid">
                            {sortedAndFilteredNdviMaps.length === 0 ? <EmptyState text="Нет сохраненных карт NDVI" /> :
                                sortedAndFilteredNdviMaps.map(m => (
                                    <div key={m.id} className="data-card ndvi-card">
                                        <div className="card-header">
                                            <button className="delete-btn-small" onClick={() => deleteNdviMap(m.id)}>✕</button>
                                        </div>
                                        <div className="card-image-container">
                                            {m.mapUrl ? (
                                                <img src={m.mapUrl} alt="NDVI Map" className="card-img" />
                                            ) : (
                                                <div className="card-img-placeholder">Карта недоступна</div>
                                            )}
                                        </div>
                                        <div className="card-body">
                                            <h3>Средний NDVI: {m.avgNdviValue?.toFixed(2) ?? '—'}</h3>
                                            <p className="meta-info">Мин/Макс: {m.minNdviValue?.toFixed(2)}/{m.maxNdviValue?.toFixed(2)}</p>
                                            <p className="meta-info date">{new Date(m.dateTaken).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    const EmptyState = ({ text }: { text: string }) => (
        <div className="empty-state-card">
            <p>{text}</p>
        </div>
    );

    return (
        <div className="saved-data-layout">
            {/* Левая панель: Навигация */}
            <aside className="sidebar-saved">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/')} className="btn-icon">←</button>
                    <h2>Сохраненные данные</h2>
                </div>

                <div className="sidebar-nav">
                    <button
                        className={`nav-tab-btn ${activeTab === 'diagnoses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('diagnoses')}
                    >
                        🌱 Диагнозы растений
                    </button>
                    <button
                        className={`nav-tab-btn ${activeTab === 'calculations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calculations')}
                    >
                        🧮 Расчеты удобрений
                    </button>
                    <button
                        className={`nav-tab-btn ${activeTab === 'ndvi' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ndvi')}
                    >
                        🛰️ Карты NDVI
                    </button>
                </div>
            </aside>

            {/* Правая панель: Контент */}
            <main className="main-saved-content">
                <header className="content-header">
                    <h1>
                        {activeTab === 'diagnoses' && 'История диагностики'}
                        {activeTab === 'calculations' && 'История расчетов'}
                        {activeTab === 'ndvi' && 'Архив карт NDVI'}
                    </h1>
                    <span className="subtitle">
                        {activeTab === 'diagnoses' && 'Результаты анализа фотографий ваших посевов'}
                        {activeTab === 'calculations' && 'Сохраненные нормы внесения удобрений'}
                        {activeTab === 'ndvi' && 'Спутниковые снимки вегетационных индексов'}
                    </span>
                </header>

                <div className="scroll-area">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default SavedDataPage;