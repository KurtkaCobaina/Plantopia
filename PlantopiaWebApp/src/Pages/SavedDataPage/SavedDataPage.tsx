// src/Pages/SavedDataPage/SavedDataPage.tsx
import { useNavigate } from 'react-router-dom';
import './SavedDataPage.css';

function SavedDataPage() {
    const navigate = useNavigate();

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    return (
        <div className="saved-data-container">
            <h1 className="page-title">Сохранённые данные</h1>
            <div className="buttons1-grid">
                <button
                    className="nav-btn"
                    onClick={() => handleNavigation('/saved/plant-diagnosis')}
                >
                    Результаты диагностики растений
                </button>
                <button
                    className="nav-btn"
                    onClick={() => handleNavigation('/saved/calculations')}
                >
                    Сохранённые расчёты
                </button>
                <button
                    className="nav-btn"
                    onClick={() => handleNavigation('/saved/ndvi-maps')}
                >
                    NDVI-карты
                </button>
            </div>
        </div>
    );
}

export default SavedDataPage;