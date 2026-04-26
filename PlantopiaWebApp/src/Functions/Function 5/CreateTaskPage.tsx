import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTaskPage.css';
import { type Task } from '../../Interfaces/Task.ts';

interface CreateTaskForm {
    title: string;
    description: string;
    dueDate: string;
    category: string;
}

const CreateTaskPage = () => {
    const [formData, setFormData] = useState<CreateTaskForm>({
        title: '',
        description: '',
        dueDate: '',
        category: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setError('Заголовок задачи обязателен');
            return;
        }

        const userIdStr = sessionStorage.getItem('userId');
        if (!userIdStr) {
            setError('Пользователь не авторизован');
            return;
        }

        const userId = parseInt(userIdStr, 10);
        if (isNaN(userId) || userId <= 0) {
            setError('Некорректный ID пользователя');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5243/api/Tasks/create-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    title: formData.title,
                    description: formData.description,
                    dueDate: formData.dueDate,
                    category: formData.category,
                    completed: false,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Ошибка: ${response.status}`);
            }

            const newTask: Task = await response.json();

            console.log('Новая задача создана:', newTask);
            alert('Задача успешно создана!');
            navigate('/calendar');
        } catch (err) {
            console.error('Ошибка создания задачи:', err);
            setError(err instanceof Error ? err.message : 'Не удалось создать задачу');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/calendar');
    };

    return (
        <div className="create-task-container">
            <div className="create-task-content">
                <div className="header-actions">
                    <button className="task-back-button" onClick={handleCancel}>
                        Назад
                    </button>
                    <h2 className="section-title">Создать задачу</h2>
                    <div></div> {/* пустой блок для выравнивания */}
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="task-form">
                    <div className="form-group">
                        <label htmlFor="title">Заголовок *</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Введите заголовок задачи"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Описание</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Введите описание задачи"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="dueDate">Срок выполнения</label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Категория</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value="">Выберите категорию</option>
                            <option value="fertilization">Удобрение</option>
                            <option value="irrigation">Полив</option>
                            <option value="pest_control">Борьба с вредителями</option>
                            <option value="harvesting">Сбор урожая</option>
                            <option value="other">Другое</option>
                        </select>
                    </div>



                    <div className="form-actions">
                        <button type="button" className="task-cancel-button" onClick={handleCancel}>
                            Отмена
                        </button>
                        <button
                            type="submit"
                            className="task-submit-button"
                            disabled={loading}
                        >
                            {loading ? 'Создание...' : 'Создать задачу'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskPage;