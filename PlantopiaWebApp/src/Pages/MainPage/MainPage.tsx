// src/Pages/MainPage/MainPage.tsx
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import { useI18n } from '../../I18nContext';

function MainPage() {
    const navigate = useNavigate();
    const { t } = useI18n();

    const handleButtonClick = (path: string) => {
        navigate(path);
    };

    return (
        <div className="main-page-container">
            <div className="buttons-grid">
                <button onClick={() => handleButtonClick('/plant-diagnosis')} className="btn">
                    {t('main.buttons.plantDiagnosis', 'Фото-диагностика болезней')}
                </button>
                <button onClick={() => handleButtonClick('/calculator')} className="btn">
                    {t('main.buttons.calculator', 'Калькулятор удобрений N-P-K')}
                </button>
                <button onClick={() => handleButtonClick('/agro-weather')} className="btn">
                    {t('main.buttons.agroWeather', 'Агро-погодные окна')}
                </button>


                <button onClick={() => handleButtonClick('/ndvi-maps')} className="btn">
                    {t('main.buttons.ndviMaps', 'NDVI-карта здоровья посевов')}
                </button>
                <button onClick={() => handleButtonClick('/calendar')} className="btn">
                    {t('main.buttons.calendar', 'Персональный календарь работ')}
                </button>
                <button onClick={() => handleButtonClick('/experts-marketplace')} className="btn">
                    {t('main.buttons.expertsMarketplace', 'Маркетплейс экспертов')}
                </button>
            </div>
        </div>
    );
}

export default MainPage;