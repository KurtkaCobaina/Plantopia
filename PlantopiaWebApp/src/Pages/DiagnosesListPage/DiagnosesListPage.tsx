import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DiagnosesListPage.css';
import { type Diagnosis } from '../../Interfaces/Diagnosis.ts';

function DiagnosesListPage() {
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const mockData: Diagnosis[] = [
            {
                id: 1,
                user_id: 1,
                image_url: "",
                plant_name: "Томат",
                common_names: "Помидор, красная ягода",
                confidence: 92.5,
                issues_detected: true,
                disease_details: "Обнаружена фитофтора на нижних листьях. Рекомендуется обработка фунгицидами.",
                created_at: "2023-05-15T10:30:00Z"
            },
            {
                id: 2,
                user_id: 1,
                image_url: "",
                plant_name: "Огурец",
                common_names: "Кукуруза, огурчик",
                confidence: 87.2,
                issues_detected: false,
                disease_details: "",
                created_at: "2023-05-14T14:22:00Z"
            },
            {
                id: 3,
                user_id: 1,
                image_url: "",
                plant_name: "Неизвестное растение",
                common_names: "",
                confidence: 45.0,
                issues_detected: false,
                disease_details: "",
                created_at: "2023-05-13T09:15:00Z"
            }
        ];

        setDiagnoses(mockData);
    }, []);

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

    return (
        <div className="diagnoses-list-container">
            <div className="header-actions">
                <h1 className="page-title1">Сохранённые диагнозы</h1>
                <button className="back-btn" onClick={handleBack}>Назад</button>
            </div>

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
                    </tr>
                    </thead>
                    <tbody>
                    {diagnoses.map((diagnosis) => (
                        <tr key={diagnosis.id}>
                            <td className="image-cell">
                                {diagnosis.image_url ? (
                                    <img
                                        src={diagnosis.image_url}
                                        alt="Загруженное изображение"
                                        className="preview-img"
                                    />
                                ) : (
                                    <div className="placeholder-img">Нет изображения</div>
                                )}
                            </td>
                            <td>
                                <div className="plant-info">
                                    <strong>{diagnosis.plant_name || 'Неизвестное растение'}</strong>
                                    {diagnosis.common_names && (
                                        <div className="common-names">{diagnosis.common_names}</div>
                                    )}
                                </div>
                            </td>
                            <td>{diagnosis.confidence}%</td>
                            <td>
                                    <span className={`status-badge ${diagnosis.issues_detected ? 'has-issues' : 'no-issues'}`}>
                                        {diagnosis.issues_detected ? 'Проблемы' : 'Здоровое'}
                                    </span>
                            </td>
                            <td>{formatDate(diagnosis.created_at)}</td>
                            <td>
                                {diagnosis.issues_detected && diagnosis.disease_details ? (
                                    <div className="disease-details-cell">
                                        {diagnosis.disease_details}
                                    </div>
                                ) : (
                                    <em>—</em>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default DiagnosesListPage;