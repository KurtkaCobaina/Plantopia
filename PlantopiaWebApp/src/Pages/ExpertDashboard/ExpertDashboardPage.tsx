import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpertDashboardPage.css';

// --- ИМПОРТЫ ИЗ INTERFACES ---
import type { Consultation } from '../../Interfaces/Consultation';
import type { Crop } from '../../Interfaces/Crop';
import type { SoilType } from '../../Interfaces/SoilType';

// --- ИМПОРТ УТИЛИТ ---
import { filterAndSortCrops, filterAndSortSoils, type FilterParams } from '../../utils/dataHelpers';

type TabType = 'consultations' | 'crops' | 'soils';

const ExpertDashboardPage = () => {
    const navigate = useNavigate();

    // --- Состояния ---
    const [activeTab, setActiveTab] = useState<TabType>('consultations');

    // Данные эксперта из сессии
    const [userRole, setUserRole] = useState<string>('');
    const [specialization, setSpecialization] = useState<string>('');

    // Консультации
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loadingConsultations, setLoadingConsultations] = useState(true);
    const [statusFilter] = useState<string>('all');

    // Культуры
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(false);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [editingCrop, setEditingCrop] = useState<Crop | null>(null);

    // Состояния для поиска и сортировки культур
    const [cropSearch, setCropSearch] = useState('');
    const [cropSort, setCropSort] = useState<'name_asc' | 'name_desc' | 'default'>('default');

    // Почвы
    const [soils, setSoils] = useState<SoilType[]>([]);
    const [loadingSoils, setLoadingSoils] = useState(false);
    const [isSoilModalOpen, setIsSoilModalOpen] = useState(false);
    const [editingSoil, setEditingSoil] = useState<SoilType | null>(null);

    // Состояния для поиска и сортировки почв
    const [soilSearch, setSoilSearch] = useState('');
    const [soilSort, setSoilSort] = useState<'name_asc' | 'name_desc' | 'default'>('default');

    const [error, setError] = useState<string | null>(null);

    // Получаем ID эксперта из sessionStorage
    const expertId = useMemo(() => {
        const idStr = sessionStorage.getItem('userId');
        return idStr ? parseInt(idStr, 10) : null;
    }, []);

    // --- Эффекты загрузки данных ---

    useEffect(() => {
        const role = sessionStorage.getItem('userRole') || '';
        const spec = sessionStorage.getItem('expertSpecialization') || '';
        setUserRole(role);
        setSpecialization(spec);
    }, []);

    useEffect(() => {
        if (!expertId) return;
        const fetchConsultations = async () => {
            try {
                setLoadingConsultations(true);
                const response = await fetch(`/api/consultations/expert/${expertId}`);
                if (!response.ok) throw new Error('Ошибка загрузки консультаций');
                setConsultations(await response.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка');
            } finally {
                setLoadingConsultations(false);
            }
        };
        fetchConsultations();
    }, [expertId]);

    useEffect(() => {
        if (activeTab === 'crops' && isSemovod()) {
            fetchCrops();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'soils' && isSoilScientist()) {
            fetchSoils();
        }
    }, [activeTab]);

    const isSemovod = () => specialization.toLowerCase().includes('семеновод');
    const isSoilScientist = () => specialization.toLowerCase().includes('почвовед');

    // --- API Функции ---

    const fetchCrops = async () => {
        setLoadingCrops(true);
        try {
            const res = await fetch('/api/agrodata/crops');
            if (res.ok) setCrops(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingCrops(false); }
    };

    const saveCrop = async (crop: Crop) => {
        try {
            const url = crop.id ? `/api/agrodata/crops/${crop.id}` : '/api/agrodata/crops';
            const method = crop.id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(crop)
            });

            if (res.ok) {
                alert(crop.id ? 'Культура успешно обновлена!' : 'Культура успешно добавлена!');
                setIsCropModalOpen(false);
                setEditingCrop(null);
                fetchCrops();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`Ошибка сохранения: ${errorData.message || res.statusText}`);
            }
        } catch (e) {
            alert('Ошибка сети при сохранении культуры.');
            console.error(e);
        }
    };

    const deleteCrop = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту культуру?')) return;
        try {
            const res = await fetch(`/api/agrodata/crops/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Культура успешно удалена.');
                fetchCrops();
            } else {
                alert('Ошибка при удалении культуры.');
            }
        } catch (e) {
            alert('Ошибка сети при удалении.');
            console.error(e);
        }
    };

    const fetchSoils = async () => {
        setLoadingSoils(true);
        try {
            const res = await fetch('/api/agrodata/soil-types');
            if (res.ok) setSoils(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoadingSoils(false); }
    };

    const saveSoil = async (soil: SoilType) => {
        try {
            const url = soil.id ? `/api/agrodata/soil-types/${soil.id}` : '/api/agrodata/soil-types';
            const method = soil.id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(soil)
            });

            if (res.ok) {
                alert(soil.id ? 'Тип почвы успешно обновлен!' : 'Тип почвы успешно добавлен!');
                setIsSoilModalOpen(false);
                setEditingSoil(null);
                fetchSoils();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`Ошибка сохранения: ${errorData.message || res.statusText}`);
            }
        } catch (e) {
            alert('Ошибка сети при сохранении почвы.');
            console.error(e);
        }
    };

    const deleteSoil = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот тип почвы?')) return;
        try {
            const res = await fetch(`/api/agrodata/soil-types/${id}`, { method: 'DELETE' });
            if (res.ok) {
                alert('Тип почвы успешно удален.');
                fetchSoils();
            } else {
                alert('Ошибка при удалении типа почвы.');
            }
        } catch (e) {
            alert('Ошибка сети при удалении.');
            console.error(e);
        }
    };

    // --- Обработчики статуса консультаций ---
    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/consultations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
            }
        } catch (err) { console.error(err); }
    };

    // --- Фильтрация и статистика ---
    const filteredConsultations = useMemo(() => {
        if (statusFilter === 'all') return consultations;
        return consultations.filter(c => c.status === statusFilter);
    }, [consultations, statusFilter]);

    const stats = useMemo(() => {
        return {
            total: consultations.length,
            pending: consultations.filter(c => c.status === 'pending').length,
            earnings: consultations
                .filter(c => c.status === 'completed' || c.status === 'confirmed')
                .reduce((sum, c) => sum + Number(c.price), 0)
        };
    }, [consultations]);

    // --- ПРИМЕНЕНИЕ ФИЛЬТРАЦИИ И СОРТИРОВКИ ---

    const processedCrops = useMemo(() => {
        return filterAndSortCrops(crops, {
            searchQuery: cropSearch,
            sortBy: cropSort
        });
    }, [crops, cropSearch, cropSort]);

    const processedSoils = useMemo(() => {
        return filterAndSortSoils(soils, {
            searchQuery: soilSearch,
            sortBy: soilSort
        });
    }, [soils, soilSearch, soilSort]);


    // --- Рендер контента вкладок ---

    const renderConsultations = () => (
        <div className="experts-scroll-area">
            {filteredConsultations.length === 0 ? (
                <div className="empty-state"><p>Заявок не найдено.</p></div>
            ) : (
                <div className="consultations-list">
                    {filteredConsultations.map(consult => (
                        <div key={consult.id} className={`consultation-card ${consult.status}`}>
                            <div className="card-header">
                                <span className={`status-badge ${consult.status}`}>
                                    {consult.status === 'pending' && 'Ожидает'}
                                    {consult.status === 'confirmed' && 'Подтверждено'}
                                    {consult.status === 'completed' && 'Завершено'}
                                    {consult.status === 'cancelled' && 'Отменено'}
                                </span>
                                <span className="date">{new Date(consult.scheduledDate).toLocaleString('ru-RU')}</span>
                            </div>
                            <div className="card-body">
                                <div className="info-row"><strong>ID Пользователя:</strong> {consult.userId}</div>
                                <div className="info-row"><strong>Адрес:</strong> {consult.city}, {consult.streetAddress}</div>
                                <div className="info-row"><strong>Длительность:</strong> {consult.hours} ч.</div>
                                <div className="info-row price"><strong>Стоимость:</strong> {consult.price} ₽</div>
                            </div>
                            <div className="card-actions">
                                {consult.status === 'pending' && (
                                    <>
                                        <button className="btn-small btn-confirm" onClick={() => handleStatusChange(consult.id, 'confirmed')}>Подтвердить</button>
                                        <button className="btn-small btn-cancel" onClick={() => handleStatusChange(consult.id, 'cancelled')}>Отклонить</button>
                                    </>
                                )}
                                {consult.status === 'confirmed' && (
                                    <button className="btn-small btn-complete" onClick={() => handleStatusChange(consult.id, 'completed')}>Завершить</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCrops = () => (
        <div className="experts-scroll-area">
            <div className="data-management-container">
                <div className="data-header">
                    <h2>Справочник культур</h2>
                    <button className="add-btn" onClick={() => { setEditingCrop(null); setIsCropModalOpen(true); }}>+ Добавить культуру</button>
                </div>

                {/* Панель поиска и сортировки для культур */}
                <div className="filter-sort-bar" style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={cropSearch}
                        onChange={(e) => setCropSearch(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '200px' }}
                    />
                    <select
                        value={cropSort}
                        onChange={(e) => setCropSort(e.target.value as any)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                        <option value="default">По умолчанию</option>
                        <option value="name_asc">По названию (А-Я)</option>
                        <option value="name_desc">По названию (Я-А)</option>
                    </select>
                </div>

                {loadingCrops ? <p className="loading-text">Загрузка...</p> : (
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Название</th>
                                <th>N (мин-макс)</th>
                                <th>P (мин-макс)</th>
                                <th>K (мин-макс)</th>
                                <th>Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {processedCrops.map(crop => (
                                <tr key={crop.id}>
                                    <td>{crop.name}</td>
                                    <td>{crop.optimalNG1m2Min} - {crop.optimalNG1m2Max}</td>
                                    <td>{crop.optimalPG1m2Min} - {crop.optimalPG1m2Max}</td>
                                    <td>{crop.optimalKG1m2Min} - {crop.optimalKG1m2Max}</td>
                                    <td>
                                        <button className="icon-btn edit" onClick={() => { setEditingCrop(crop); setIsCropModalOpen(true); }}>✎</button>
                                        <button className="icon-btn delete" onClick={() => deleteCrop(crop.id!)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSoils = () => (
        <div className="experts-scroll-area">
            <div className="data-management-container">
                <div className="data-header">
                    <h2>Справочник почв</h2>
                    <button className="add-btn" onClick={() => { setEditingSoil(null); setIsSoilModalOpen(true); }}>+ Добавить почву</button>
                </div>

                {/* Панель поиска и сортировки для почв */}
                <div className="filter-sort-bar" style={{ marginBottom: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Поиск по типу почвы..."
                        value={soilSearch}
                        onChange={(e) => setSoilSearch(e.target.value)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', minWidth: '200px' }}
                    />
                    <select
                        value={soilSort}
                        onChange={(e) => setSoilSort(e.target.value as any)}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                        <option value="default">По умолчанию</option>
                        <option value="name_asc">По названию (А-Я)</option>
                        <option value="name_desc">По названию (Я-А)</option>
                    </select>
                </div>

                {loadingSoils ? <p className="loading-text">Загрузка...</p> : (
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Тип почвы</th>
                                <th>pH</th>
                                <th>Korr. N</th>
                                <th>Korr. P</th>
                                <th>Korr. K</th>
                                <th>Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {processedSoils.map(soil => (
                                <tr key={soil.id}>
                                    <td>{soil.name}</td>
                                    <td>{soil.phLevelMin ?? '-'} - {soil.phLevelMax ?? '-'}</td>
                                    <td>{soil.nCorrectionFactor}</td>
                                    <td>{soil.pCorrectionFactor}</td>
                                    <td>{soil.kCorrectionFactor}</td>
                                    <td>
                                        <button className="icon-btn edit" onClick={() => { setEditingSoil(soil); setIsSoilModalOpen(true); }}>✎</button>
                                        <button className="icon-btn delete" onClick={() => deleteSoil(soil.id!)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    // --- Основной рендер ---

    if (loadingConsultations && activeTab === 'consultations') return <div className="page-loader">Загрузка заявок...</div>;
    if (error) return <div className="page-error">{error}</div>;

    return (
        <div className="experts-container">
            {/* Левая панель */}
            <aside className="sidebar-filters">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/')} className="btn-icon">←</button>
                    <h2>Кабинет Эксперта</h2>
                </div>

                <div className="expert-info-mini">
                    <span className="role-badge">{specialization || userRole}</span>
                </div>

                <nav className="sidebar-nav">
                    <button
                        className={`nav-item ${activeTab === 'consultations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('consultations')}
                    >
                        📋 Мои консультации
                    </button>

                    {isSemovod() && (
                        <button
                            className={`nav-item ${activeTab === 'crops' ? 'active' : ''}`}
                            onClick={() => setActiveTab('crops')}
                        >
                            🌱 Культуры
                        </button>
                    )}

                    {isSoilScientist() && (
                        <button
                            className={`nav-item ${activeTab === 'soils' ? 'active' : ''}`}
                            onClick={() => setActiveTab('soils')}
                        >
                            🪨 Почвы
                        </button>
                    )}
                </nav>

                {/* Статистика только для вкладки консультаций */}
                {activeTab === 'consultations' && (
                    <div className="stats-block">
                        <div className="stat-item"><span className="stat-value">{stats.total}</span><span className="stat-label">Всего</span></div>
                        <div className="stat-item highlight"><span className="stat-value">{stats.pending}</span><span className="stat-label">Ожидают</span></div>
                        <div className="stat-item"><span className="stat-value">{stats.earnings} ₽</span><span className="stat-label">Доход</span></div>
                    </div>
                )}
            </aside>

            {/* Правая панель */}
            <main className="main-content">
                <header className="content-header">
                    <h1>
                        {activeTab === 'consultations' && 'Мои консультации'}
                        {activeTab === 'crops' && 'Управление культурами'}
                        {activeTab === 'soils' && 'Управление почвами'}
                    </h1>
                    <span className="subtitle">
                         {activeTab === 'consultations' && 'Управление заявками от пользователей'}
                        {activeTab === 'crops' && 'Редактирование справочника растений'}
                        {activeTab === 'soils' && 'Редактирование типов почв'}
                    </span>
                </header>

                {activeTab === 'consultations' && renderConsultations()}
                {activeTab === 'crops' && renderCrops()}
                {activeTab === 'soils' && renderSoils()}
            </main>

            {/* МОДАЛЬНОЕ ОКНО ДЛЯ КУЛЬТУР */}
            {isCropModalOpen && (
                <CropModal
                    isOpen={isCropModalOpen}
                    onClose={() => { setIsCropModalOpen(false); setEditingCrop(null); }}
                    onSave={saveCrop}
                    initialData={editingCrop}
                />
            )}

            {/* МОДАЛЬНОЕ ОКНО ДЛЯ ПОЧВ */}
            {isSoilModalOpen && (
                <SoilModal
                    isOpen={isSoilModalOpen}
                    onClose={() => { setIsSoilModalOpen(false); setEditingSoil(null); }}
                    onSave={saveSoil}
                    initialData={editingSoil}
                />
            )}
        </div>
    );
};

// --- Компоненты Модальных Окон (без изменений) ---

const CropModal = ({ isOpen, onClose, onSave, initialData }: any) => {
    const [form, setForm] = useState<Crop>(initialData || {
        name: '', scientificName: '', optimalNG1m2Min: 0, optimalNG1m2Max: 0,
        optimalPG1m2Min: 0, optimalPG1m2Max: 0, optimalKG1m2Min: 0, optimalKG1m2Max: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: name.includes('Min') || name.includes('Max') || name.includes('Yield') || name.includes('Days') ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{initialData ? 'Редактировать культуру' : 'Новая культура'}</h3>
                <form onSubmit={handleSubmit} className="modal-form">
                    <input name="name" placeholder="Название культуры" value={form.name} onChange={handleChange} required />
                    <input name="scientificName" placeholder="Латинское название" value={form.scientificName} onChange={handleChange} />
                    <div className="form-row">
                        <label>N (мин): <input type="number" name="optimalNG1m2Min" value={form.optimalNG1m2Min} onChange={handleChange} /></label>
                        <label>N (макс): <input type="number" name="optimalNG1m2Max" value={form.optimalNG1m2Max} onChange={handleChange} /></label>
                    </div>
                    <div className="form-row">
                        <label>P (мин): <input type="number" name="optimalPG1m2Min" value={form.optimalPG1m2Min} onChange={handleChange} /></label>
                        <label>P (макс): <input type="number" name="optimalPG1m2Max" value={form.optimalPG1m2Max} onChange={handleChange} /></label>
                    </div>
                    <div className="form-row">
                        <label>K (мин): <input type="number" name="optimalKG1m2Min" value={form.optimalKG1m2Min} onChange={handleChange} /></label>
                        <label>K (макс): <input type="number" name="optimalKG1m2Max" value={form.optimalKG1m2Max} onChange={handleChange} /></label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Отмена</button>
                        <button type="submit" className="save-btn">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SoilModal = ({ isOpen, onClose, onSave, initialData }: any) => {
    const [form, setForm] = useState<SoilType>(initialData || {
        name: '', phLevelMin: 0, phLevelMax: 0, nCorrectionFactor: 1, pCorrectionFactor: 1, kCorrectionFactor: 1
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: name === 'name' ? value : parseFloat(value)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{initialData ? 'Редактировать почву' : 'Новый тип почвы'}</h3>
                <form onSubmit={handleSubmit} className="modal-form">
                    <input name="name" placeholder="Название типа почвы" value={form.name} onChange={handleChange} required />
                    <div className="form-row">
                        <label>pH Мин: <input type="number" step="0.1" name="phLevelMin" value={form.phLevelMin} onChange={handleChange} /></label>
                        <label>pH Макс: <input type="number" step="0.1" name="phLevelMax" value={form.phLevelMax} onChange={handleChange} /></label>
                    </div>
                    <div className="form-row">
                        <label>Korr. N: <input type="number" step="0.01" name="nCorrectionFactor" value={form.nCorrectionFactor} onChange={handleChange} /></label>
                        <label>Korr. P: <input type="number" step="0.01" name="pCorrectionFactor" value={form.pCorrectionFactor} onChange={handleChange} /></label>
                        <label>Korr. K: <input type="number" step="0.01" name="kCorrectionFactor" value={form.kCorrectionFactor} onChange={handleChange} /></label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="cancel-btn">Отмена</button>
                        <button type="submit" className="save-btn">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpertDashboardPage;