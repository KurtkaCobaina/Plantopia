// src/Pages/FertilizerCalculator/FertilizerCalculatorPage.tsx
import { useState, useEffect } from 'react';
import './FertilizerCalculatorPage.css';
import { type Crop } from '../../Interfaces/Crop.ts';
import { type SoilType } from '../../Interfaces/SoilType.ts';

const FertilizerCalculatorPage = () => {
    const [crops, setCrops] = useState<Crop[]>([]);
    const [soilTypes, setSoilTypes] = useState<SoilType[]>([]);
    const [selectedCropId, setSelectedCropId] = useState<number | ''>('');
    const [selectedSoilTypeId, setSelectedSoilTypeId] = useState<number | ''>('');
    const [plotArea, setPlotArea] = useState<number | ''>(''); // площадь в м²
    const [targetYieldKgHa, setTargetYieldKgHa] = useState<number | ''>(''); // целевая урожайность в кг/га
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [calculationResult, setCalculationResult] = useState<{
        nMin: number;
        nMax: number;
        pMin: number;
        pMax: number;
        kMin: number;
        kMax: number;
        area: number;
    } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [cropsResponse, soilsResponse] = await Promise.all([
                    fetch('/api/agrodata/crops'),
                    fetch('/api/agrodata/soil-types')
                ]);

                if (!cropsResponse.ok || !soilsResponse.ok) {
                    throw new Error('Ошибка загрузки данных');
                }

                const cropsData: Crop[] = await cropsResponse.json();
                const soilsData: SoilType[] = await soilsResponse.json();

                setCrops(cropsData);
                setSoilTypes(soilsData);
            } catch (err) {
                console.error('Ошибка загрузки данных:', err);
                setError('Не удалось загрузить данные о культурах и почвах');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCalculate = () => {
        if (!selectedCropId || !selectedSoilTypeId || !plotArea) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        const crop = crops.find(c => c.id === selectedCropId);
        const soil = soilTypes.find(s => s.id === selectedSoilTypeId);

        if (!crop || !soil) {
            alert('Выбранная культура или тип почвы не найдены');
            return;
        }

        // Расчёт удобрений на 1 м² (в граммах)
        const areaM2 = Number(plotArea);

        // Нормы на 1 м² = нормы на 10 м² / 10
        const nPerM2Min = (crop.optimalNG1m2Min / 10) * soil.nCorrectionFactor;
        const nPerM2Max = (crop.optimalNG1m2Max / 10) * soil.nCorrectionFactor;
        const pPerM2Min = (crop.optimalPG1m2Min / 10) * soil.pCorrectionFactor;
        const pPerM2Max = (crop.optimalPG1m2Max / 10) * soil.pCorrectionFactor;
        const kPerM2Min = (crop.optimalKG1m2Min / 10) * soil.kCorrectionFactor;
        const kPerM2Max = (crop.optimalKG1m2Max / 10) * soil.kCorrectionFactor;

        // Итого на всё поле (в граммах)
        const totalNMin = nPerM2Min * areaM2;
        const totalNMax = nPerM2Max * areaM2;
        const totalPMin = pPerM2Min * areaM2;
        const totalPMax = pPerM2Max * areaM2;
        const totalKMin = kPerM2Min * areaM2;
        const totalKMax = kPerM2Max * areaM2;

        setCalculationResult({
            nMin: totalNMin,
            nMax: totalNMax,
            pMin: totalPMin,
            pMax: totalPMax,
            kMin: totalKMin,
            kMax: totalKMax,
            area: areaM2
        });
    };

    const handleSave = async () => {
        if (!calculationResult || !selectedCropId || !selectedSoilTypeId) {
            alert('Сначала выполните расчёт');
            return;
        }

        const crop = crops.find(c => c.id === selectedCropId);
        const soil = soilTypes.find(s => s.id === selectedSoilTypeId);
        if (!crop || !soil) {
            alert('Ошибка: культура или почва не найдены');
            return;
        }

        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert('Пользователь не авторизован');
            return;
        }

        // Конвертация в кг/га для сохранения в существующую БД
        // (численно равно исходным нормам на 10 м²)
        const recommendedNKgHa = ((crop.optimalNG1m2Min + crop.optimalNG1m2Max) / 2) * soil.nCorrectionFactor;
        const recommendedPKgHa = ((crop.optimalPG1m2Min + crop.optimalPG1m2Max) / 2) * soil.pCorrectionFactor;
        const recommendedKKgHa = ((crop.optimalKG1m2Min + crop.optimalKG1m2Max) / 2) * soil.kCorrectionFactor;

        try {
            const response = await fetch('/api/fertilizer-calculation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': userId
                },
                body: JSON.stringify({
                    CropId: selectedCropId,
                    SoilId: selectedSoilTypeId,
                    TargetYieldKgHa: targetYieldKgHa ? Number(targetYieldKgHa) : null,
                    FieldAreaHa: Number(calculationResult.area) / 10000,
                    RecommendedNKgHa: recommendedNKgHa,
                    RecommendedPKgHa: recommendedPKgHa,
                    RecommendedKKgHa: recommendedKKgHa
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка сохранения: ${response.status}`);
            }

            alert('Расчёт успешно сохранён!');
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            alert('Не удалось сохранить расчёт');
        }
    };

    if (loading) {
        return (
            <div className="calculator-container">
                <div className="calculator-form-container">
                    <h1 className="form-title">Калькулятор удобрений N-P-K</h1>
                    <p className="loading-message">Загрузка данных...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="calculator-container">
                <div className="calculator-form-container">
                    <h1 className="form-title">Калькулятор удобрений N-P-K</h1>
                    <div className="error-message">
                        <p>{error}</p>
                        <button
                            className="retry-btn"
                            onClick={() => window.location.reload()}
                        >
                            Повторить попытку
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="calculator-container">
            <div className="calculator-form-container">
                <h1 className="form-title">Калькулятор удобрений N-P-K</h1>

                <form className="calculator-form">
                    <div className="form-group">
                        <label htmlFor="crop_type">Тип культуры:</label>
                        <select
                            id="crop_type"
                            value={selectedCropId}
                            onChange={(e) => setSelectedCropId(Number(e.target.value) || '')}
                            className="form-select"
                        >
                            <option value="">Выберите культуру</option>
                            {crops.map((crop) => (
                                <option key={crop.id} value={crop.id}>
                                    {crop.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="soil_type">Тип почвы:</label>
                        <select
                            id="soil_type"
                            value={selectedSoilTypeId}
                            onChange={(e) => setSelectedSoilTypeId(Number(e.target.value) || '')}
                            className="form-select"
                        >
                            <option value="">Выберите тип почвы</option>
                            {soilTypes.map((soil) => (
                                <option key={soil.id} value={soil.id}>
                                    {soil.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="plot_area">Площадь грядки (м²):</label>
                            <input
                                id="plot_area"
                                type="number"
                                step="0.1"
                                value={plotArea}
                                onChange={(e) => setPlotArea(e.target.value ? parseFloat(e.target.value) : '')}
                                className="form-input"
                                placeholder="0.0"
                                min="0"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="target_yield">Целевая урожайность (кг/га):</label>
                            <input
                                id="target_yield"
                                type="number"
                                step="1"
                                value={targetYieldKgHa}
                                onChange={(e) => setTargetYieldKgHa(e.target.value ? parseFloat(e.target.value) : '')}
                                className="form-input"
                                placeholder="0"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="calculate-btn"
                            onClick={handleCalculate}
                        >
                            Рассчитать
                        </button>
                        <button
                            type="button"
                            className="save-btn"
                            onClick={handleSave}
                            disabled={!calculationResult}
                        >
                            Сохранить
                        </button>
                    </div>
                </form>

                {calculationResult && (
                    <div className="results-section">
                        <h2 className="results-title">Результаты расчёта</h2>
                        <div className="results-grid">
                            <div className="result-item">
                                <span className="result-label">Азот (N):</span>
                                <span className="result-value">
                                    {calculationResult.nMin.toFixed(1)} - {calculationResult.nMax.toFixed(1)} г
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Фосфор (P):</span>
                                <span className="result-value">
                                    {calculationResult.pMin.toFixed(1)} - {calculationResult.pMax.toFixed(1)} г
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Калий (K):</span>
                                <span className="result-value">
                                    {calculationResult.kMin.toFixed(1)} - {calculationResult.kMax.toFixed(1)} г
                                </span>
                            </div>
                            <div className="result-item">
                                <span className="result-label">Площадь:</span>
                                <span className="result-value">
                                    {calculationResult.area.toFixed(1)} м²
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FertilizerCalculatorPage;