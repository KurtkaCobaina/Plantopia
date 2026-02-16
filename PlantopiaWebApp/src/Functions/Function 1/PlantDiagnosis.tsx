import React, { useState, useRef, type ChangeEvent } from 'react';
import { diagnosePlant } from './api.ts';
import type { PlantIdResult } from './PlantDiagnosisInterfaces.ts';
import './PlantDiagnosis.css';
import { useI18n } from '../../I18nContext';

const PlantDiagnosis: React.FC = () => {
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

    // === Загрузка изображения ===
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

    // === Сохранение диагноза ===
    const saveDiagnosis = async () => {
        if (!diagnosis?.success || !diagnosis.data || !originalFile.current) {
            alert(t('plantDiagnosis.noDiagnosisToSave'));
            return;
        }

        try {
            setIsSaving(true);

            // 1. Получаем userId из sessionStorage
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

            // 2. Загружаем изображение
            const imageUrl = await uploadImageAndGetUrl(originalFile.current);

            // 3. Преобразуем данные в формат, ожидаемый бэкендом
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

            // Обработка здоровья
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
                // Если healthAssessment отсутствует — считаем здоровым
                backendResult.is_healthy = { binary: true };
            }

            // 4. Отправляем данные на сервер
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

    // Вспомогательные переменные для отображения
    const classification = diagnosis?.data?.classification;
    const prob = classification?.probability;
    const isConfident = prob != null && prob >= 0.7;
    const healthAssessment = diagnosis?.data?.healthAssessment;

    return (
        <div className="plant-diagnosis-container">
            <h1 className="text-h">
                {t('plantDiagnosis.title')}
            </h1>

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
                                {t('plantDiagnosis.placeholder')}
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
                        {t('plantDiagnosis.chooseFile')}
                    </label>

                    <button
                        onClick={analyzeImage}
                        disabled={!originalFile.current || isProcessing || isSaving}
                        className="analyze-btn"
                    >
                        {isProcessing
                            ? t('plantDiagnosis.analyzing')
                            : t('plantDiagnosis.analyzePlant')}
                    </button>
                </div>
            </div>

            {isProcessing && (
                <div className="diagnosis-result loading-placeholder">
                    <div className="loading-content">
                        <p>{t('plantDiagnosis.analyzingText')}</p>
                        <p>{t('plantDiagnosis.analyzingHint')}</p>
                    </div>
                </div>
            )}

            {!isProcessing && diagnosis && diagnosis.success && diagnosis.data && (
                <div className="diagnosis-result">
                    <h2>{t('plantDiagnosis.resultTitle')}</h2>

                    {classification ? (
                        isConfident ? (
                            <>
                                <h3>{t('plantDiagnosis.plantIdentified')}</h3>
                                <p>{classification.name}</p>
                                {classification.plant_details?.common_names?.length ? (
                                    <p>
                                        {t('plantDiagnosis.commonNames')}{' '}
                                        {classification.plant_details.common_names.join(", ")}
                                    </p>
                                ) : null}
                                <p>
                                    {t('plantDiagnosis.confidence')}{' '}
                                    {Math.round(prob * 100)}%
                                </p>
                            </>
                        ) : (
                            <>
                                <h3>{t('plantDiagnosis.notRecognizedTitle')}</h3>
                                <p>
                                    {t('plantDiagnosis.notRecognizedText')}
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
                            <h3>{t('plantDiagnosis.healthStatusTitle')}</h3>
                            <p>
                                {healthAssessment.isHealthy
                                    ? t('plantDiagnosis.healthyText')
                                    : t('plantDiagnosis.issuesText')}
                            </p>
                            {!healthAssessment.isHealthy &&
                            healthAssessment.diseases?.length ? (
                                <div>
                                    <h4>{t('plantDiagnosis.detectedIssuesTitle')}</h4>
                                    <ul>
                                        {healthAssessment.diseases.map((disease, idx) => (
                                            <li key={idx}>
                                                <span>{disease.name}</span> (
                                                {Math.round(disease.probability * 100)}%) -{" "}
                                                {disease.description ||
                                                    t('plantDiagnosis.noDescription')}
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
                                ? t('plantDiagnosis.saveButtonSaving')
                                : t('plantDiagnosis.saveButton')}
                        </button>
                    </div>
                </div>
            )}

            {!isProcessing && errorMessage && (
                <div className="error-message">
                    <p>
                        {t('plantDiagnosis.errorPrefix')} {errorMessage}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PlantDiagnosis;
