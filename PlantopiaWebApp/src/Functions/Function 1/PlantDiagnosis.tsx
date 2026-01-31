// src/components/PlantDiagnosis.tsx
import React, { useState, useRef, type ChangeEvent } from 'react';
import { diagnosePlant } from './api.ts';
import type { PlantIdResult } from './PlantDiagnosisInterfaces.ts';
import './PlantDiagnosis.css';

const PlantDiagnosis: React.FC = () => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [diagnosis, setDiagnosis] = useState<PlantIdResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
        if (!selectedImage || !fileInputRef.current?.files?.[0]) {
            setErrorMessage("Please select an image first.");
            return;
        }

        setDiagnosis(null);
        setErrorMessage(null);
        setIsProcessing(true);

        try {
            const request = {
                image: fileInputRef.current.files![0],
            };

            const result = await diagnosePlant(request);
            setDiagnosis(result);
            if (!result.success) {
                setErrorMessage(result.error || "Diagnosis was unsuccessful.");
            }
        } catch (err) {
            console.error("Unexpected error during diagnosis:", err);
            setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Вспомогательные переменные для безопасного доступа к данным
    const classification = diagnosis?.data?.classification;
    const prob = classification?.probability;
    const isConfident = prob != null && prob >= 0.7;
    const healthAssessment = diagnosis?.data?.healthAssessment;

    return (
        <div className="plant-diagnosis-container">
            <h1 className="text-h">Plant Analyzer</h1>

            <div className="central-content">
                <div className="image-container">
                    {selectedImage ? (
                        <img
                            src={selectedImage}
                            alt="Preview for analysis"
                            className="image-preview"
                        />
                    ) : (
                        <div className="image-placeholder">
                            <span className="text-span">Take a photo of a plant leaf</span>
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
                        Choose File
                    </label>

                    <button
                        onClick={analyzeImage}
                        disabled={!selectedImage || isProcessing}
                        className="analyze-btn"
                    >
                        {isProcessing ? "Analyzing..." : "Analyze Plant"}
                    </button>
                </div>
            </div>

            {isProcessing && (
                <div className="diagnosis-result loading-placeholder">
                    <div className="loading-content">
                        <p>Analyzing plant...</p>
                        <p>This may take a few seconds</p>
                    </div>
                </div>
            )}

            {!isProcessing && diagnosis && diagnosis.success && diagnosis.data && (
                <div className="diagnosis-result">
                    <h2>Diagnosis Result</h2>

                    {classification ? (
                        isConfident ? (
                            <>
                                <h3>Plant Identified:</h3>
                                <p>{classification.name}</p>
                                {classification.plant_details?.common_names?.length ? (
                                    <p>
                                        Common names: {classification.plant_details.common_names.join(", ")}
                                    </p>
                                ) : null}
                                <p>Confidence: {Math.round(prob * 100)}%</p>
                            </>
                        ) : (
                            <>
                                <h3>Not a Recognizable Plant</h3>
                                <p>
                                    The uploaded image does not appear to contain a known plant species.
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
                            <h3>Health Status:</h3>
                            <p>
                                {healthAssessment.isHealthy
                                    ? "Plant appears healthy"
                                    : "Issues detected"}
                            </p>
                            {!healthAssessment.isHealthy &&
                            healthAssessment.diseases?.length ? (
                                <div>
                                    <h4>Detected Issues:</h4>
                                    <ul>
                                        {healthAssessment.diseases.map((disease, idx) => (
                                            <li key={idx}>
                                                <span>{disease.name}</span> (
                                                {Math.round(disease.probability * 100)}%) -{" "}
                                                {disease.description ||
                                                    "No description available."}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className="save-button-container">
                        <button className="save-result-btn">Save Result</button>
                    </div>
                </div>
            )}

            {!isProcessing && errorMessage && (
                <div className="error-message">
                    <p>Error: {errorMessage}</p>
                </div>
            )}
        </div>
    );
};

export default PlantDiagnosis;