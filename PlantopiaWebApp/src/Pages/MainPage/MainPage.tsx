// src/Pages/MainPage/MainPage.tsx
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

function MainPage() {
    const navigate = useNavigate();

    const handleButtonClick = (path: string) => {
        navigate(path);
    };

    return (
        <div className="main-page-container">
            <div className="buttons-grid">
                <button onClick={() => handleButtonClick('/plant-diagnosis')} className="btn">
                    Фото-диагностика болезней
                </button>
                <button onClick={() => handleButtonClick('/calculator')} className="btn">
                    Калькулятор удобрений N-P-K
                </button>
                <button onClick={() => handleButtonClick('/agro-weather')} className="btn">
                    Агро-погодные окна
                </button>
                <button onClick={() => handleButtonClick('/chat')} className="btn">
                    Чат-агроном
                </button>
                <button onClick={() => handleButtonClick('/soil-analise')} className="btn">
                    Быстрый анализ почвы
                </button>
                <button onClick={() => handleButtonClick('/ndvi-maps')} className="btn">
                    NDVI-карта здоровья посевов
                </button>
                <button onClick={() => handleButtonClick('/calendar')} className="btn">
                    Персональный календарь работ
                </button>
                <button onClick={() => handleButtonClick('/experts-marketplace')} className="btn">
                    Маркетплейс экспертов
                </button>
            </div>
        </div>
    );
}

export default MainPage;