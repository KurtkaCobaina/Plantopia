// FertilizerCalculationsPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FertilizerCalculationsPage.css';
import { type FertilizerCalculation } from '../../Interfaces/FertilizerCalculation.ts';

function FertilizerCalculationsPage() {
    const [calculations, setCalculations] = useState<FertilizerCalculation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadCalculations = async () => {
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
                const response = await fetch(`/api/saveddata/savedfertilizer?userId=${userId}`);
                if (!response.ok) {
                    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
                }
                const data = await response.json() as FertilizerCalculation[];
                setCalculations(data);
            } catch (err) {
                console.error('Ошибка загрузки расчётов:', err);
                setError('Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        };

        loadCalculations();
    }, []);

    const deleteCalculation = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот расчёт удобрений?')) {
            return;
        }

        const userIdStr = sessionStorage.getItem('userId');
        if (!userIdStr) {
            alert('Ошибка: пользователь не авторизован');
            return;
        }

        try {
            const response = await fetch(`/api/saveddata/fertilizer/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': userIdStr,
                },
            });

            if (response.ok) {
                setCalculations(calculations.filter(calc => calc.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка удаления: ${errorMessage || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            console.error('Ошибка при удалении:', err);
            alert('Не удалось удалить расчёт. Проверьте соединение.');
        }
    };

    const formatDate = (dateString: string) => {
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
        return <div className="fertilizer-calculations-container"><p>Загрузка...</p></div>;
    }

    if (error) {
        return (
            <div className="fertilizer-calculations-container">
                <p className="error-message">Ошибка: {error}</p>
                <button onClick={handleBack}>Назад</button>
            </div>
        );
    }

    return (
        <div className="fertilizer-calculations-container">
            <div className="header-actions">
                <h1 className="page-title2">Расчёты удобрений</h1>
                <button className="back-btn" onClick={handleBack}>Назад</button>
            </div>

            {calculations.length === 0 ? (
                <p className="no-data">У вас пока нет сохранённых расчётов удобрений.</p>
            ) : (
                <div className="table-wrapper">
                    <table className="calculations-table">
                        <thead>
                        <tr>
                            <th>Культура (ID)</th>
                            <th>Почва (ID)</th>
                            <th>Целевая урожайность (кг/га)</th>
                            <th>Площадь (га)</th>
                            <th>N (кг/га)</th>
                            <th>P (кг/га)</th>
                            <th>K (кг/га)</th>
                            <th>Дата расчёта</th>
                            <th>Действия</th> {/* ← новая колонка */}
                        </tr>
                        </thead>
                        <tbody>
                        {calculations.map((calc) => (
                            <tr key={calc.id}>
                                <td>{calc.cropId ?? '—'}</td>
                                <td>{calc.soilId ?? '—'}</td>
                                <td>{calc.targetYieldKgHa != null ? calc.targetYieldKgHa.toFixed(1) : '—'}</td>
                                <td>{calc.fieldAreaHa != null ? calc.fieldAreaHa.toFixed(2) : '—'}</td>
                                <td>{calc.recommendedNKgHa != null ? calc.recommendedNKgHa.toFixed(1) : '—'}</td>
                                <td>{calc.recommendedPKgHa != null ? calc.recommendedPKgHa.toFixed(1) : '—'}</td>
                                <td>{calc.recommendedKKgHa != null ? calc.recommendedKKgHa.toFixed(1) : '—'}</td>
                                <td>{formatDate(calc.calculatedAt)}</td>
                                <td>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteCalculation(calc.id)}
                                        aria-label="Удалить расчёт удобрений"
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

export default FertilizerCalculationsPage;