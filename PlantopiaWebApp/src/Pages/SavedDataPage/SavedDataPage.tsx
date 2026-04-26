import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './SavedDataPage.css';
import { type Diagnosis } from '../../Interfaces/Diagnosis.ts';
import { type FertilizerCalculation } from '../../Interfaces/FertilizerCalculation.ts';
import { type NdviMap } from '../../Interfaces/NdviMap.ts';

type TabType = 'diagnoses' | 'calculations' | 'ndvi';

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

    // --- Рендер контента в зависимости от таба ---

    const renderContent = () => {
        if (loading) return <div className="page-loader">Загрузка данных...</div>;
        if (error) return <div className="page-error">{error}</div>;

        switch (activeTab) {
            case 'diagnoses':
                return (
                    <div className="cards-grid">
                        {diagnoses.length === 0 ? <EmptyState text="Нет сохраненных диагнозов" /> :
                            diagnoses.map(d => (
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
                );

            case 'calculations':
                return (
                    <div className="cards-grid">
                        {calculations.length === 0 ? <EmptyState text="Нет сохраненных расчетов" /> :
                            calculations.map(c => (
                                <div key={c.id} className="data-card calculation-card">
                                    <div className="card-header">
                                        <span className="type-badge">Расчет N-P-K</span>
                                        <button className="delete-btn-small" onClick={() => deleteCalculation(c.id)}>✕</button>
                                    </div>
                                    <div className="card-body">
                                        <h3>Культура ID: {c.cropId ?? '—'}</h3>
                                        <p className="meta-info">Почва ID: {c.soilId ?? '—'}</p>
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
                );

            case 'ndvi':
                return (
                    <div className="cards-grid">
                        {ndviMaps.length === 0 ? <EmptyState text="Нет сохраненных карт NDVI" /> :
                            ndviMaps.map(m => (
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