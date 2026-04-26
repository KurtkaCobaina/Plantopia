import React, { useState, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom'; // Добавляем навигацию
import { diagnosePlant } from './api.ts';
import type { PlantIdResult } from './PlantDiagnosisInterfaces.ts';
import './PlantDiagnosis.css';
import { useI18n } from '../../I18nContext';

const PlantDiagnosis: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useI18n();

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [diagnosis, setDiagnosis] = useState<PlantIdResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const originalFile = useRef<File | null>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            originalFile.current = file;
            setDiagnosis(null);
            setErrorMessage(null);

            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const analyzeImage = async () => {
        if (!originalFile.current) {
            setErrorMessage(t('plantDiagnosis.selectImageFirst'));
            return;
        }

        setDiagnosis(null);
        setErrorMessage(null);
        setIsProcessing(true);

        try {
            const request = {
                image: originalFile.current,
            };

            const result = await diagnosePlant(request);
            setDiagnosis(result);
            if (!result.success) {
                setErrorMessage(
                    result.error || t('plantDiagnosis.diagnosisFailed'),
                );
            }
        } catch (err) {
            console.error('Unexpected error during diagnosis:', err);
            setErrorMessage(
                err instanceof Error
                    ? err.message
                    : t('plantDiagnosis.unexpectedError'),
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const uploadImageAndGetUrl = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(t('plantDiagnosis.uploadFailed'));
        }

        const data = await response.json();
        return data.url;
    };

    const saveDiagnosis = async () => {
        if (!diagnosis?.success || !diagnosis.data || !originalFile.current) {
            alert(t('plantDiagnosis.noDiagnosisToSave'));
            return;
        }

        try {
            setIsSaving(true);

            const userIdStr = sessionStorage.getItem("userId");
            if (!userIdStr) {
                alert(t('plantDiagnosis.notLoggedIn'));
                return;
            }
            const userId = parseInt(userIdStr, 10);
            if (isNaN(userId)) {
                alert(t('plantDiagnosis.invalidUserId'));
                return;
            }

            const imageUrl = await uploadImageAndGetUrl(originalFile.current);
            const { classification, healthAssessment } = diagnosis.data;

            if (!classification) {
                alert(t('plantDiagnosis.missingClassification'));
                return;
            }

            const backendResult: any = {
                classification: {
                    suggestions: [
                        {
                            name: classification.name,
                            probability: classification.probability,
                            ...(classification.plant_details?.common_names
                                ? { details: { common_names: classification.plant_details.common_names } }
                                : {}),
                        },
                    ],
                },
            };

            if (healthAssessment) {
                backendResult.is_healthy = { binary: healthAssessment.isHealthy };

                if (!healthAssessment.isHealthy && healthAssessment.diseases?.length) {
                    backendResult.disease = {
                        suggestions: healthAssessment.diseases.map((d) => ({
                            name: d.name,
                            probability: d.probability,
                        })),
                    };
                }
            } else {
                backendResult.is_healthy = { binary: true };
            }

            const saveResponse = await fetch('/api/diagnoses/save-diagnosis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    imageUrl,
                    result: backendResult,
                }),
            });

            if (saveResponse.ok) {
                alert(t('plantDiagnosis.saveSuccess'));
            } else {
                const errorData = await saveResponse.json().catch(() => ({}));
                alert(
                    `${t('plantDiagnosis.saveFailedPrefix')} ${
                        errorData.message || t('common.unknownError')
                    }`,
                );
            }
        } catch (err) {
            console.error('Save error:', err);
            alert(t('plantDiagnosis.saveErrorGeneric'));
        } finally {
            setIsSaving(false);
        }
    };

    const classification = diagnosis?.data?.classification;
    const prob = classification?.probability;
    const isConfident = prob != null && prob >= 0.7;
    const healthAssessment = diagnosis?.data?.healthAssessment;

    return (
        <div className="plant-diagnosis-layout">

            {/* ЛЕВАЯ ПАНЕЛЬ (САЙДБАР) */}
            <aside className="sidebar-diagnosis">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/')} className="btn-icon">←</button>
                    <h2>{t('plantDiagnosis.sidebarTitle', 'Диагностика')}</h2>
                </div>

                <div className="sidebar-nav">
                    <button
                        onClick={() => navigate('/saved')}
                        className="nav-btn"
                    >
                        📂 {t('plantDiagnosis.savedDiagnoses', 'Сохраненные диагнозы')}
                    </button>
                </div>

                <div className="sidebar-info">
                    <p>{t('plantDiagnosis.hint', 'Загрузите фото растения для анализа болезней и вредителей.')}</p>
                </div>
            </aside>

            {/* ОСНОВНОЙ КОНТЕНТ */}
            <main className="main-diagnosis-content">

                <div className="central-content">
                    <div className="image-container">
                        {selectedImage ? (
                            <img
                                src={selectedImage}
                                alt={t('plantDiagnosis.title')}
                                className="image-preview"
                            />
                        ) : (
                            <div className="image-placeholder">
                                <span className="text-span">
                                    {t('plantDiagnosis.placeholder', 'Выберите изображение')}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="action-buttons">
                        <label className="file-input-label">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                ref={fileInputRef}
                            />
                            {t('plantDiagnosis.chooseFile', 'Выбрать файл')}
                        </label>

                        <button
                            onClick={analyzeImage}
                            disabled={!originalFile.current || isProcessing || isSaving}
                            className="analyze-btn"
                        >
                            {isProcessing
                                ? t('plantDiagnosis.analyzing', 'Анализ...')
                                : t('plantDiagnosis.analyzePlant', 'Анализировать')}
                        </button>
                    </div>
                </div>

                {isProcessing && (
                    <div className="diagnosis-result loading-placeholder">
                        <div className="loading-content">
                            <p>{t('plantDiagnosis.analyzingText', 'Идет анализ изображения...')}</p>
                            <p>{t('plantDiagnosis.analyzingHint', 'Пожалуйста, подождите')}</p>
                        </div>
                    </div>
                )}

                {!isProcessing && diagnosis && diagnosis.success && diagnosis.data && (
                    <div className="diagnosis-result">
                        <h2>{t('plantDiagnosis.resultTitle', 'Результат')}</h2>

                        {classification ? (
                            isConfident ? (
                                <>
                                    <h3>{t('plantDiagnosis.plantIdentified', 'Растение определено')}</h3>
                                    <p>{classification.name}</p>
                                    {classification.plant_details?.common_names?.length ? (
                                        <p>
                                            {t('plantDiagnosis.commonNames', 'Названия')}:{' '}
                                            {classification.plant_details.common_names.join(", ")}
                                        </p>
                                    ) : null}
                                    <p>
                                        {t('plantDiagnosis.confidence', 'Уверенность')}:{' '}
                                        {Math.round(prob * 100)}%
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3>{t('plantDiagnosis.notRecognizedTitle', 'Не распознано')}</h3>
                                    <p>
                                        {t('plantDiagnosis.notRecognizedText', 'Не удалось точно определить растение. Попробуйте другое фото.')}
                                    </p>
                                </>
                            )
                        ) : null}

                        {isConfident && healthAssessment && (
                            <div
                                className={`health-status ${
                                    healthAssessment.isHealthy ? 'healthy' : 'unhealthy'
                                }`}
                            >
                                <h3>{t('plantDiagnosis.healthStatusTitle', 'Состояние здоровья')}</h3>
                                <p>
                                    {healthAssessment.isHealthy
                                        ? t('plantDiagnosis.healthyText', 'Растение здорово')
                                        : t('plantDiagnosis.issuesText', 'Обнаружены проблемы')}
                                </p>
                                {!healthAssessment.isHealthy &&
                                healthAssessment.diseases?.length ? (
                                    <div>
                                        <h4>{t('plantDiagnosis.detectedIssuesTitle', 'Выявленные болезни')}</h4>
                                        <ul>
                                            {healthAssessment.diseases.map((disease, idx) => (
                                                <li key={idx}>
                                                    <span>{disease.name}</span> (
                                                    {Math.round(disease.probability * 100)}%) -{" "}
                                                    {disease.description ||
                                                        t('plantDiagnosis.noDescription', 'Нет описания')}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        <div className="save-button-container">
                            <button
                                className="save-result-btn"
                                onClick={saveDiagnosis}
                                disabled={isProcessing || isSaving}
                            >
                                {isSaving
                                    ? t('plantDiagnosis.saveButtonSaving', 'Сохранение...')
                                    : t('plantDiagnosis.saveButton', 'Сохранить результат')}
                            </button>
                        </div>
                    </div>
                )}

                {!isProcessing && errorMessage && (
                    <div className="error-message">
                        <p>
                            {t('plantDiagnosis.errorPrefix', 'Ошибка')} {errorMessage}
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PlantDiagnosis;