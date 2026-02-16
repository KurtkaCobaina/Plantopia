// DiagnosesListPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DiagnosesListPage.css';
import { type Diagnosis } from '../../Interfaces/Diagnosis.ts';

function DiagnosesListPage() {
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadDiagnoses = async () => {
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
                const response = await fetch(`/api/saveddata/saveddiagnosis?userId=${userId}`);
                if (!response.ok) {
                    throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
                }
                const data = await response.json() as Diagnosis[];
                setDiagnoses(data);
            } catch (err) {
                console.error('Ошибка загрузки диагнозов:', err);
                setError('Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        };

        loadDiagnoses();
    }, []);

    const deleteDiagnosis = async (id: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот диагноз?')) {
            return;
        }

        const userIdStr = sessionStorage.getItem('userId');
        if (!userIdStr) {
            alert('Ошибка: пользователь не авторизован');
            return;
        }

        try {
            const response = await fetch(`/api/saveddata/diagnosis/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Id': userIdStr,
                },
            });

            if (response.ok) {
                setDiagnoses(diagnoses.filter(d => d.id !== id));
            } else {
                const errorMessage = await response.text();
                alert(`Ошибка удаления: ${errorMessage || 'Неизвестная ошибка'}`);
            }
        } catch (err) {
            console.error('Ошибка при удалении:', err);
            alert('Не удалось удалить диагноз. Проверьте соединение.');
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
        return <div className="diagnoses-list-container"><p>Загрузка...</p></div>;
    }

    if (error) {
        return (
            <div className="diagnoses-list-container">
                <p className="error-message">Ошибка: {error}</p>
                <button onClick={handleBack}>Назад</button>
            </div>
        );
    }

    return (
        <div className="diagnoses-list-container">
            <div className="header-actions">
                <h1 className="page-title1">Сохранённые диагнозы</h1>
                <button className="back-btn" onClick={handleBack}>Назад</button>
            </div>

            {diagnoses.length === 0 ? (
                <p className="no-data">У вас пока нет сохранённых диагнозов.</p>
            ) : (
                <div className="table-wrapper">
                    <table className="diagnoses-table">
                        <thead>
                        <tr>
                            <th>Изображение</th>
                            <th>Растение</th>
                            <th>Уверенность</th>
                            <th>Статус</th>
                            <th>Дата</th>
                            <th>Детали</th>
                            <th>Действия</th> {/* ← новая колонка */}
                        </tr>
                        </thead>
                        <tbody>
                        {diagnoses.map((diagnosis) => (
                            <tr key={diagnosis.id}>
                                <td className="image-cell">
                                    {diagnosis.imageUrl ? (
                                        <img
                                            src={diagnosis.imageUrl}
                                            alt="Загруженное изображение"
                                            className="preview-img"
                                        />
                                    ) : (
                                        <div className="placeholder-img">Нет изображения</div>
                                    )}
                                </td>
                                <td>
                                    <div className="plant-info">
                                        <strong>{diagnosis.plantName || 'Неизвестное растение'}</strong>
                                        {diagnosis.commonNames && (
                                            <div className="common-names">{diagnosis.commonNames}</div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    {diagnosis.confidence != null
                                        ? `${(diagnosis.confidence * 100).toFixed(1)}%`
                                        : '—'}
                                </td>
                                <td>
                                        <span className={`status-badge ${diagnosis.issuesDetected ? 'has-issues' : 'no-issues'}`}>
                                            {diagnosis.issuesDetected ? 'Проблемы' : 'Здоровое'}
                                        </span>
                                </td>
                                <td>{formatDate(diagnosis.createdAt)}</td>
                                <td>
                                    {diagnosis.issuesDetected && diagnosis.diseaseDetails ? (
                                        <div className="disease-details-cell">
                                            {diagnosis.diseaseDetails}
                                        </div>
                                    ) : (
                                        <em>—</em>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="delete-btn"
                                        onClick={() => deleteDiagnosis(diagnosis.id)}
                                        aria-label="Удалить диагноз"
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

export default DiagnosesListPage;