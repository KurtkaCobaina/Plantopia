import  { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpertsListPage.css';
import { type Expert } from '../../Interfaces/Expert';
// Предположим, что у вас есть интерфейс Consultation, если нет - создайте простой тип
interface Consultation {
    id: number;
    expertId: number;
    userId: number;
    price: number;
    country: string;
    region: string;
    city: string;
    streetAddress: string;
    scheduledDate: string;
    status: string;
    createdAt: string;
    hours: number;
    // Можно добавить имя эксперта, если бэкенд возвращает join, иначе придется делать отдельный запрос или хранить локально
    // Для простоты здесь мы будем отображать ID эксперта или догрузим данные, если нужно
}

import ConsultationModal from './ConsultationModal';

const ExpertsListPage = () => {
    const navigate = useNavigate();

    // --- Состояния для Экспертов ---
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loadingExperts, setLoadingExperts] = useState(true);

    // Фильтры экспертов
    const [filterCountry, setFilterCountry] = useState('');
    const [filterRegion, setFilterRegion] = useState('');
    const [filterCity, setFilterCity] = useState('');

    // --- Состояния для Консультаций ---
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loadingConsultations, setLoadingConsultations] = useState(false);

    // --- Общие состояния ---
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'experts' | 'consultations'>('experts'); // Переключатель режима

    // Модальное окно
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);

    // ID пользователя
    const userId = useMemo(() => {
        const idStr = sessionStorage.getItem('userId');
        return idStr ? parseInt(idStr, 10) : null;
    }, []);

    // Загрузка экспертов (только если режим experts)
    useEffect(() => {
        if (viewMode === 'experts') {
            const fetchExperts = async () => {
                try {
                    setLoadingExperts(true);
                    const response = await fetch('/api/experts', {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (!response.ok) throw new Error('Ошибка сети при загрузке экспертов');
                    const data: Expert[] = await response.json();
                    setExperts(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Ошибка загрузки');
                } finally {
                    setLoadingExperts(false);
                }
            };
            fetchExperts();
        }
    }, [viewMode]);

    // Загрузка консультаций (только если режим consultations)
    useEffect(() => {
        if (viewMode === 'consultations' && userId) {
            const fetchConsultations = async () => {
                try {
                    setLoadingConsultations(true);
                    const response = await fetch(`/api/consultations/user/${userId}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                    });
                    if (!response.ok) throw new Error('Ошибка сети при загрузке консультаций');
                    const data: Consultation[] = await response.json();
                    setConsultations(data);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Ошибка загрузки');
                } finally {
                    setLoadingConsultations(false);
                }
            };
            fetchConsultations();
        }
    }, [viewMode, userId]);

    // Фильтрация экспертов
    const filteredExperts = useMemo(() => {
        return experts.filter(expert => {
            const matchCountry = filterCountry
                ? expert.country?.toLowerCase().includes(filterCountry.toLowerCase())
                : true;
            const matchRegion = filterRegion
                ? expert.region?.toLowerCase().includes(filterRegion.toLowerCase())
                : true;
            const matchCity = filterCity
                ? expert.city?.toLowerCase().includes(filterCity.toLowerCase())
                : true;
            return matchCountry && matchRegion && matchCity;
        });
    }, [experts, filterCountry, filterRegion, filterCity]);

    // Обработчик открытия модалки
    const handleBookConsultation = (expert: Expert) => {
        if (!userId) {
            alert('Пожалуйста, войдите в систему.');
            navigate('/login');
            return;
        }
        setSelectedExpert(expert);
        setIsModalOpen(true);
    };

    // Обработчик смены режима
    const handleModeChange = (mode: 'experts' | 'consultations') => {
        setViewMode(mode);
        setError(null);
        // Сброс фильтров при переключении на экспертов
        if (mode === 'experts') {
            setFilterCountry('');
            setFilterRegion('');
            setFilterCity('');
        }
    };

    if (error) return <div className="page-error">{error}</div>;

    return (
        <div className="experts-container">
            {/* Левая панель: Поиск и навигация */}
            <aside className="sidebar-filters">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/')} className="btn-icon">←</button>
                    <h2>Маркетплейс</h2>
                </div>

                {/* Кнопки переключения режима */}
                <div className="mode-switcher">
                    <button
                        className={`mode-btn ${viewMode === 'experts' ? 'active' : ''}`}
                        onClick={() => handleModeChange('experts')}
                    >
                        Найти эксперта
                    </button>
                    <button
                        className={`mode-btn ${viewMode === 'consultations' ? 'active' : ''}`}
                        onClick={() => handleModeChange('consultations')}
                    >
                        Мои записи
                    </button>
                </div>

                {/* Фильтры показываются только в режиме экспертов */}
                {viewMode === 'experts' && (
                    <>
                        <div className="filters-group">
                            <div className="input-wrapper">
                                <label>Страна</label>
                                <input
                                    type="text"
                                    placeholder="Например: Россия"
                                    value={filterCountry}
                                    onChange={(e) => setFilterCountry(e.target.value)}
                                />
                            </div>

                            <div className="input-wrapper">
                                <label>Область / Регион</label>
                                <input
                                    type="text"
                                    placeholder="Например: Московская обл."
                                    value={filterRegion}
                                    onChange={(e) => setFilterRegion(e.target.value)}
                                />
                            </div>

                            <div className="input-wrapper">
                                <label>Город</label>
                                <input
                                    type="text"
                                    placeholder="Например: Москва"
                                    value={filterCity}
                                    onChange={(e) => setFilterCity(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="filter-stats">
                            Найдено экспертов: {filteredExperts.length}
                        </div>
                    </>
                )}
            </aside>

            {/* Правая панель: Контент */}
            <main className="main-content">
                <header className="content-header">
                    <h1>
                        {viewMode === 'experts' ? 'Доступные эксперты' : 'История консультаций'}
                    </h1>
                    <span className="subtitle">
                        {viewMode === 'experts'
                            ? 'Выберите специалиста для консультации'
                            : 'Ваши активные и прошедшие записи'}
                    </span>
                </header>

                <div className="experts-scroll-area">
                    {/* РЕЖИМ ЭКСПЕРТОВ */}
                    {viewMode === 'experts' && (
                        loadingExperts ? (
                            <div className="page-loader">Загрузка экспертов...</div>
                        ) : filteredExperts.length === 0 ? (
                            <div className="empty-state">
                                <p>Эксперты по заданным критериям не найдены.</p>
                                <button className="btn-secondary" onClick={() => {
                                    setFilterCountry('');
                                    setFilterRegion('');
                                    setFilterCity('');
                                }}>Сбросить фильтры</button>
                            </div>
                        ) : (
                            <div className="experts-grid">
                                {filteredExperts.map(expert => (
                                    <div key={expert.id} className="expert-card">
                                        <div className="expert-info">
                                            <h3>{expert.lastName} {expert.firstName}</h3>
                                            <p className="specialization">{expert.specialization}</p>

                                            <div className="expert-details">
                                                <div className="detail-item">
                                                    <span className="label">Стаж:</span>
                                                    <span className="value">{expert.experienceYears} лет</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Ставка:</span>
                                                    <span className="value rate">{expert.hourlyRate} ₽/час</span>
                                                </div>
                                            </div>

                                            <div className="expert-location">
                                                <small>
                                                    {[expert.country, expert.region, expert.city]
                                                        .filter(Boolean)
                                                        .join(', ') || 'Локация не указана'}
                                                </small>
                                            </div>
                                        </div>

                                        <div className="expert-actions">
                                            <button
                                                className="btn-primary"
                                                onClick={() => handleBookConsultation(expert)}
                                                disabled={!expert.isAvailable}
                                            >
                                                {expert.isAvailable ? 'Записаться' : 'Недоступен'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {/* РЕЖИМ КОНСУЛЬТАЦИЙ */}
                    {viewMode === 'consultations' && (
                        loadingConsultations ? (
                            <div className="page-loader">Загрузка записей...</div>
                        ) : consultations.length === 0 ? (
                            <div className="empty-state">
                                <p>У вас пока нет записей на консультацию.</p>
                                <button className="btn-secondary" onClick={() => handleModeChange('experts')}>
                                    Найти эксперта
                                </button>
                            </div>
                        ) : (
                            <div className="consultations-list">
                                {consultations.map(consult => (
                                    <div key={consult.id} className="consultation-card">
                                        <div className="consultation-header">
                                            <span className={`status-badge ${consult.status}`}>
                                                {consult.status === 'pending' ? 'Ожидает подтверждения' :
                                                    consult.status === 'confirmed' ? 'Подтверждено' :
                                                        consult.status === 'completed' ? 'Завершено' : consult.status}
                                            </span>
                                            <span className="date">
                                                {new Date(consult.scheduledDate).toLocaleString('ru-RU', {
                                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>

                                        <div className="consultation-body">
                                            <p><strong>Эксперт ID:</strong> {consult.expertId}</p>
                                            <p><strong>Адрес:</strong> {consult.city}, {consult.streetAddress}</p>
                                            <p><strong>Часов:</strong> {consult.hours}</p>
                                            <p><strong>Стоимость:</strong> {consult.price} ₽</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </main>

            {/* Модальное окно записи */}
            {selectedExpert && (
                <ConsultationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    expertId={selectedExpert.id}
                    expertName={`${selectedExpert.lastName} ${selectedExpert.firstName}`}
                    hourlyRate={selectedExpert.hourlyRate}
                    userId={userId}
                />
            )}
        </div>
    );
};

export default ExpertsListPage;