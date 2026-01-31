import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FertilizerCalculationsPage.css';
import { type FertilizerCalculation } from '../../Interfaces/FertilizerCalculation.ts';


function FertilizerCalculationsPage() {
    const [calculations, setCalculations] = useState<FertilizerCalculation[]>([]);
    const navigate = useNavigate();

    // Заглушка: имитация загрузки данных (замените на реальный API-запрос)
    useEffect(() => {
        const mockData: FertilizerCalculation[] = [
            {
                id: 1,
                user_id: 1,
                crop_type: "Пшеница",
                soil_type: "Чернозём",
                target_yield_ton_ha: 6.5,
                field_area_ha: 12.3,
                recommended_n_kg_ha: 120.0,
                recommended_p_kg_ha: 60.0,
                recommended_k_kg_ha: 80.0,
                calculated_at: "2024-04-10T14:30:00Z"
            },
            {
                id: 2,
                user_id: 1,
                crop_type: "Кукуруза",
                soil_type: "Суглинок",
                target_yield_ton_ha: 10.0,
                field_area_ha: 5.7,
                recommended_n_kg_ha: 180.0,
                recommended_p_kg_ha: 90.0,
                recommended_k_kg_ha: 100.0,
                calculated_at: "2024-04-08T09:15:00Z"
            }
        ];
        setCalculations(mockData);
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
        <div className="fertilizer-calculations-container">
            <div className="header-actions">
                <h1 className="page-title2">Расчёты удобрений</h1>
                <button className="back-btn" onClick={handleBack}>Назад</button>
            </div>

            <div className="table-wrapper">
                <table className="calculations-table">
                    <thead>
                    <tr>
                        <th>Культура</th>
                        <th>Тип почвы</th>
                        <th>Целевая урожайность (т/га)</th>
                        <th>Площадь (га)</th>
                        <th>N (кг/га)</th>
                        <th>P (кг/га)</th>
                        <th>K (кг/га)</th>
                        <th>Дата расчёта</th>
                    </tr>
                    </thead>
                    <tbody>
                    {calculations.map((calc) => (
                        <tr key={calc.id}>
                            <td>{calc.crop_type || '—'}</td>
                            <td>{calc.soil_type || '—'}</td>
                            <td>{calc.target_yield_ton_ha?.toFixed(2) ?? '—'}</td>
                            <td>{calc.field_area_ha?.toFixed(2) ?? '—'}</td>
                            <td>{calc.recommended_n_kg_ha?.toFixed(1) ?? '—'}</td>
                            <td>{calc.recommended_p_kg_ha?.toFixed(1) ?? '—'}</td>
                            <td>{calc.recommended_k_kg_ha?.toFixed(1) ?? '—'}</td>
                            <td>{formatDate(calc.calculated_at)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default FertilizerCalculationsPage;