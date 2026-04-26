import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './TasksListPage.css';
import CalendarView from './CalendarView'; // Убедитесь, что путь верный
import { type Task } from '../../Interfaces/Task.ts';

const TasksListPage = () => {
    const navigate = useNavigate();

    // Состояния
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Загрузка данных
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const userIdStr = sessionStorage.getItem('userId');
                if (!userIdStr) throw new Error('Не авторизован');

                const userId = parseInt(userIdStr, 10);
                const response = await fetch(`http://localhost:5243/api/Tasks/${userId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Ошибка сети');
                const data: Task[] = await response.json();
                setTasks(data);

                // По умолчанию выбираем сегодня (локальная дата)
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                setSelectedDate(`${y}-${m}-${d}`);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Ошибка загрузки');
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, []);

    // Фильтрация задач по выбранной дате (ИСПРАВЛЕНИЕ ЧАСОВЫХ ПОЯСОВ)
    const filteredTasks = useMemo(() => {
        if (!selectedDate) return [];

        return tasks.filter(task => {
            if (!task.dueDate) return false;

            // Создаем объект даты из строки БД
            const taskDateObj = new Date(task.dueDate);

            // Извлекаем компоненты даты в ЛОКАЛЬНОМ времени браузера
            // Это компенсирует сдвиг UTC+3 (или другого пояса)
            const year = taskDateObj.getFullYear();
            const month = String(taskDateObj.getMonth() + 1).padStart(2, '0');
            const day = String(taskDateObj.getDate()).padStart(2, '0');

            const localTaskDateStr = `${year}-${month}-${day}`;

            // Сравниваем с выбранной датой (которая тоже в формате YYYY-MM-DD локального времени)
            return localTaskDateStr === selectedDate;
        }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
    }, [tasks, selectedDate]);

    // Действия
    const handleAddTask = () => {
        navigate('/calendar/create', { state: { initialDate: selectedDate } });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить задачу?')) return;
        try {
            await fetch(`http://localhost:5243/api/Tasks/${id}`, { method: 'DELETE' });
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            alert('Ошибка удаления');
        }
    };

    const handleToggle = async (id: number, status: boolean) => {
        try {
            await fetch(`http://localhost:5243/api/Tasks/${id}/toggle-complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !status } : t));
        } catch (e) {
            alert('Ошибка обновления');
        }
    };

    // Форматирование заголовка даты без сдвига часовых поясов
    const getFormattedDateHeader = (dateStr: string | null) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        // Создаем дату с полуднем, чтобы гарантированно попасть в нужный день при любом часовом поясе
        const dateObj = new Date(y, m - 1, d, 12, 0, 0);
        return dateObj.toLocaleDateString('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
    };

    if (loading) return <div className="page-loader">Загрузка...</div>;
    if (error) return <div className="page-error">{error}</div>;

    return (
        <div className="scheduler-container">
            {/* Левая панель: Календарь */}
            <aside className="sidebar-calendar">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/')} className="btn-icon">←</button>
                    <h2>Календарь</h2>
                </div>

                <div className="calendar-wrapper">
                    <CalendarView tasks={tasks} onDateClick={setSelectedDate} />
                </div>

                <button className="btn-primary full-width" onClick={handleAddTask}>
                    + Новая задача
                </button>
            </aside>

            {/* Правая панель: Список задач */}
            <main className="main-content">
                <header className="content-header">
                    <div>
                        {selectedDate ? (
                            <>
                                <h1>{getFormattedDateHeader(selectedDate)}</h1>
                                <span className="subtitle">{filteredTasks.length} задач на этот день</span>
                            </>
                        ) : (
                            <h1>Выберите дату</h1>
                        )}
                    </div>
                </header>

                <div className="tasks-scroll-area">
                    {filteredTasks.length === 0 ? (
                        <div className="empty-state">
                            <p>Нет задач на этот день.</p>
                            <button className="btn-secondary" onClick={handleAddTask}>Создать первую</button>
                        </div>
                    ) : (
                        <div className="tasks-grid">
                            {filteredTasks.map(task => (
                                <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                                    <div className="task-body">
                                        <h3>{task.title}</h3>
                                        <p>{task.description || 'Без описания'}</p>
                                        <div className="task-meta">
                                            <span className="badge">{task.category || 'Общее'}</span>
                                            {/* Отображаем время также через локальные методы */}
                                            <span className="time">
                                                {new Date(task.dueDate!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="task-controls">
                                        <button
                                            onClick={() => handleToggle(task.id, task.completed)}
                                            className={`control-btn ${task.completed ? 'undo' : 'check'}`}
                                            title={task.completed ? "Вернуть" : "Выполнить"}
                                        >
                                            {task.completed ? '↩' : '✓'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="control-btn delete"
                                            title="Удалить"
                                        >
                                            ✕
                                        </button>
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

export default TasksListPage;