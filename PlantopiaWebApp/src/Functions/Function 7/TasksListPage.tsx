import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TasksListPage.css';
import { type Task } from '../../Interfaces/Task.ts';

const TasksListPage = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const userIdStr = sessionStorage.getItem('userId');
                if (!userIdStr) {
                    setError('Пользователь не авторизован (userId отсутствует в сессии)');
                    setLoading(false);
                    return;
                }

                const userId = parseInt(userIdStr, 10);
                if (isNaN(userId) || userId <= 0) {
                    setError('Некорректный ID пользователя');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`http://localhost:5243/api/Tasks/${userId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        setTasks([]);
                    } else {
                        throw new Error(`HTTP ${response.status}`);
                    }
                } else {
                    const data: Task[] = await response.json();
                    setTasks(data);
                }
            } catch (err) {
                console.error('Ошибка загрузки задач:', err);
                setError(err instanceof Error ? err.message : 'Ошибка загрузки задач');
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [navigate]);

    const formatDate = (value: string | null | undefined): string => {
        if (!value) return '—';

        const cleanStr = value
            .replace(/\s+\d+:\d+:\d+\.?\d*[+\-\d:]*/, '')
            .replace(/T.*$/, '');

        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
            const [y, m, d] = cleanStr.split('-').map(Number);
            return `${d.toString().padStart(2, '0')}.${m.toString().padStart(2, '0')}.${y}`;
        }

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            console.warn('Не удалось распарсить дату:', value);
            return '—';
        }

        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const formatDateTime = (value: string | null | undefined): string => {
        if (!value) return '—';
        const date = new Date(value);
        if (isNaN(date.getTime())) return '—';
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusClass = (completed: boolean) => {
        return completed ? 'status-completed' : 'status-pending';
    };

    const getStatusText = (completed: boolean) => {
        return completed ? 'Выполнено' : 'В процессе';
    };

    const handleAddTask = () => {
        navigate('/calendar/create');
    };

    const handleToggleComplete = async (taskId: number, currentStatus: boolean) => {
        try {
            const response = await fetch(`http://localhost:5243/api/Tasks/${taskId}/toggle-complete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }

            // Обновляем статус в состоянии
            setTasks(prev => prev.map(task =>
                task.id === taskId ? { ...task, completed: !currentStatus } : task
            ));

            alert(`Задача ${!currentStatus ? 'отмечена как выполнена' : 'возвращена в работу'}`);
        } catch (err) {
            console.error('Ошибка при обновлении статуса:', err);
            alert('Не удалось обновить статус задачи');
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Вы уверены, что хотите удалить эту задачу?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5243/api/Tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }

            // Удаляем задачу из списка
            setTasks(prev => prev.filter(task => task.id !== taskId));

            alert('Задача успешно удалена');
        } catch (err) {
            console.error('Ошибка при удалении задачи:', err);
            alert('Не удалось удалить задачу');
        }
    };

    if (loading) {
        return (
            <div className="tasks-list-container">
                <div className="tasks-content">
                    <div className="loading">Загрузка задач...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tasks-list-container">
                <div className="tasks-content">
                    <div className="error">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="tasks-list-container">
            <div className="tasks-content">
                <div className="header-actions">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        Назад
                    </button>
                    <h2 className="section-title">Мои задачи</h2>
                    <button className="add-btn" onClick={handleAddTask}>
                        Добавить задачу
                    </button>
                </div>

                <div className="tasks-table-wrapper">
                    <table className="tasks-table">
                        <thead>
                        <tr>
                            <th>Заголовок</th>
                            <th>Описание</th>
                            <th>Срок</th>
                            <th>Категория</th>
                            <th>Статус</th>
                            <th>Дата создания</th>
                            <th>Действия</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <tr key={task.id}>
                                    <td>{task.title}</td>
                                    <td>{task.description || '—'}</td>
                                    <td>{formatDate(task.dueDate)}</td>
                                    <td>{task.category || '—'}</td>
                                    <td>
                                            <span className={`status-badge ${getStatusClass(task.completed)}`}>
                                                {getStatusText(task.completed)}
                                            </span>
                                    </td>
                                    <td>{formatDateTime(task.createdAt)}</td>
                                    <td>
                                        <div className="task-actions">
                                            <button
                                                className={`action-btn ${task.completed ? 'revert-btn' : 'complete-btn'}`}
                                                onClick={() => handleToggleComplete(task.id, task.completed)}
                                            >
                                                {task.completed ? 'Вернуть' : 'Завершить'}
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                                    У вас пока нет задач. Начните с добавления новой!
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TasksListPage;