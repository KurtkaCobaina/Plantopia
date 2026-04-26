import  { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpertDashboardPage.css';

// Интерфейс консультации (должен совпадать с тем, что возвращает бэкенд)
interface Consultation {
    id: number;
    userId: number;
    expertId: number;
    price: number;
    country: string;
    region: string;
    city: string;
    streetAddress: string;
    scheduledDate: string;
    status: string; // pending, confirmed, completed, cancelled
    createdAt: string;
    hours: number;
}

const ExpertDashboardPage = () => {
    const navigate = useNavigate();

    // Состояния
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Фильтр по статусу
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Получаем ID эксперта из sessionStorage (предполагаем, что при логине эксперта мы сохраняем его ID как userId или expertId)
    // Если у вас есть отдельное поле expertId в сессии, используйте его.
    // В текущей реализации AuthController мы возвращаем UserId, который для эксперта является его ID в таблице Experts.
    const expertId = useMemo(() => {
        const idStr = sessionStorage.getItem('userId');
        return idStr ? parseInt(idStr, 10) : null;
    }, []);

    // Загрузка консультаций эксперта
    useEffect(() => {
        if (!expertId) {
            setError('Эксперт не авторизован');
            setLoading(false);
            return;
        }

        const fetchConsultations = async () => {
            try {
                setLoading(true);
                // Используем эндпоинт, который мы создали ранее: GET /api/consultations/expert/{expertId}
                const response = await fetch(`/api/consultations/expert/${expertId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Ошибка сети при загрузке консультаций');

                const data: Consultation[] = await response.json();
                setConsultations(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка загрузки');
            } finally {
                setLoading(false);
            }
        };
        fetchConsultations();
    }, [expertId]);

    // Фильтрация на клиенте
    const filteredConsultations = useMemo(() => {
        if (statusFilter === 'all') return consultations;
        return consultations.filter(c => c.status === statusFilter);
    }, [consultations, statusFilter]);

    // Статистика
    const stats = useMemo(() => {
        return {
            total: consultations.length,
            pending: consultations.filter(c => c.status === 'pending').length,
            confirmed: consultations.filter(c => c.status === 'confirmed').length,
            earnings: consultations
                .filter(c => c.status === 'completed' || c.status === 'confirmed')
                .reduce((sum, c) => sum + Number(c.price), 0)
        };
    }, [consultations]);

    // Обработчик изменения статуса (заглушка, так как бэкенд метод PATCH еще не создан, но структура готова)
    const handleStatusChange = async (id: number, newStatus: string) => {
        try {
            const response = await fetch(`/api/consultations/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Ошибка обновления статуса');

            // Обновляем локальное состояние
            setConsultations(prev => prev.map(c =>
                c.id === id ? { ...c, status: newStatus } : c
            ));

            alert(`Статус заявки #${id} изменен на "${newStatus}"`);
        } catch (err) {
            alert('Не удалось изменить статус. Возможно, эндпоинт еще не реализован на бэкенде.');
            console.error(err);
        }
    };

    if (loading) return <div className="page-loader">Загрузка заявок...</div>;
    if (error) return <div className="page-error">{error}</div>;

    return (
        <div className="experts-container"> {/* Используем тот же класс контейнера для единообразия */}

            {/* Левая панель: Статистика и Фильтры */}
            <aside className="sidebar-filters">
                <div className="sidebar-header">

                    <h2>Кабинет Эксперта</h2>
                </div>

                <div className="stats-block">
                    <div className="stat-item">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Всего заявок</span>
                    </div>
                    <div className="stat-item highlight">
                        <span className="stat-value">{stats.pending}</span>
                        <span className="stat-label">Ожидают</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.earnings} ₽</span>
                        <span className="stat-label">Потенциальный доход</span>
                    </div>
                </div>

                <div className="filters-group">
                    <label className="filter-label">Фильтр по статусу</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="status-select"
                    >
                        <option value="all">Все заявки</option>
                        <option value="pending">Ожидают подтверждения</option>
                        <option value="confirmed">Подтвержденные</option>
                        <option value="completed">Завершенные</option>
                        <option value="cancelled">Отмененные</option>
                    </select>
                </div>
            </aside>

            {/* Правая панель: Список консультаций */}
            <main className="main-content">
                <header className="content-header">
                    <h1>Мои консультации</h1>
                    <span className="subtitle">Управление заявками от пользователей</span>
                </header>

                <div className="experts-scroll-area">
                    {filteredConsultations.length === 0 ? (
                        <div className="empty-state">
                            <p>Заявок не найдено.</p>
                        </div>
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
                                        <span className="date">
                                            {new Date(consult.scheduledDate).toLocaleString('ru-RU', {
                                                day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <div className="card-body">
                                        <div className="info-row">
                                            <strong>ID Пользователя:</strong> {consult.userId}
                                        </div>
                                        <div className="info-row">
                                            <strong>Адрес:</strong> {consult.city}, {consult.streetAddress}
                                        </div>
                                        <div className="info-row">
                                            <strong>Длительность:</strong> {consult.hours} ч.
                                        </div>
                                        <div className="info-row price">
                                            <strong>Стоимость:</strong> {consult.price} ₽
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        {consult.status === 'pending' && (
                                            <>
                                                <button
                                                    className="btn-small btn-confirm"
                                                    onClick={() => handleStatusChange(consult.id, 'confirmed')}
                                                >
                                                    Подтвердить
                                                </button>
                                                <button
                                                    className="btn-small btn-cancel"
                                                    onClick={() => handleStatusChange(consult.id, 'cancelled')}
                                                >
                                                    Отклонить
                                                </button>
                                            </>
                                        )}
                                        {consult.status === 'confirmed' && (
                                            <button
                                                className="btn-small btn-complete"
                                                onClick={() => handleStatusChange(consult.id, 'completed')}
                                            >
                                                Завершить
                                            </button>
                                        )}
                                        {(consult.status === 'completed' || consult.status === 'cancelled') && (
                                            <span className="action-disabled">Действия недоступны</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ExpertDashboardPage;