import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpertRegistPage.css';
import { useI18n } from '../../I18nContext';

const ExpertRegistPage = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        const firstName = formData.get('first_name') as string;
        const lastName = formData.get('last_name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;
        const specialization = formData.get('specialization') as string;

        // Парсим стаж как число, если поле пустое или невалидное — ставим 0
        const experienceYearsRaw = formData.get('experience_years') as string;
        const experienceYears = experienceYearsRaw ? parseInt(experienceYearsRaw, 10) : 0;

        // Локация
        const country = formData.get('country') as string;
        const region = formData.get('region') as string;
        const city = formData.get('city') as string;

        // Базовая валидация на фронтенде
        if (!firstName || !lastName || !email || !password || !specialization) {
            setError(t('register.error.required', 'Все обязательные поля должны быть заполнены.'));
            setLoading(false);
            return;
        }

        const payload = {
            firstName,
            lastName,
            email,
            phone,
            password,
            specialization,
            experienceYears,
            country,
            region,
            city
        };

        try {
            // Эндпоинт для регистрации эксперта (должен совпадать с Route в Controller)
            const response = await fetch('/api/registration/register-expert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok) {
                alert(t('register.success.expert', 'Регистрация эксперта успешна! Теперь войдите в систему.'));
                navigate('/login');
            } else {
                // Обработка ошибок от сервера (например, уникальный Email)
                // Бэкенд возвращает { message: "..." }
                setError(result.message || t('register.error.unknown', 'Ошибка регистрации.'));
            }
        } catch (err) {
            console.error('Ошибка сети:', err);
            setError(t('register.error.network', 'Не удалось подключиться к серверу.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="expert-regist-container">
            <div className="expert-regist-form-container">
                <h1 className="regist-title">
                    {t('register.title.expert', 'Регистрация эксперта')}
                </h1>

                {error && <div className="error-message">{error}</div>}

                <form className="regist-form" onSubmit={handleSubmit}>
                    {/* Личные данные */}
                    <div className="form-section">
                        <h3>{t('register.section.personal', 'Личные данные')}</h3>
                        <div className="input-group">
                            <input
                                name="first_name"
                                type="text"
                                className="input-field"
                                placeholder={t('register.firstName.placeholder', 'Имя')}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                name="last_name"
                                type="text"
                                className="input-field"
                                placeholder={t('register.lastName.placeholder', 'Фамилия')}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                name="email"
                                type="email"
                                className="input-field"
                                placeholder={t('register.email.placeholder', 'Email (Логин)')}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                name="phone"
                                type="tel"
                                className="input-field"
                                placeholder={t('register.phone.placeholder', 'Телефон')}
                            />
                        </div>
                    </div>

                    {/* Профессиональные данные */}
                    <div className="form-section">
                        <h3>{t('register.section.professional', 'Профессиональные данные')}</h3>
                        <div className="input-group">
                            <input
                                name="specialization"
                                type="text"
                                className="input-field"
                                placeholder={t('register.specialization.placeholder', 'Специализация (например: Агрономия)')}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                name="experience_years"
                                type="number"
                                min="0"
                                step="1"
                                className="input-field"
                                placeholder={t('register.experience.placeholder', 'Стаж работы (лет)')}
                                required
                            />
                        </div>
                    </div>

                    {/* Локация */}
                    <div className="form-section">
                        <h3>{t('register.section.location', 'Местоположение')}</h3>
                        <div className="input-group">
                            <input
                                name="country"
                                type="text"
                                className="input-field"
                                placeholder="Страна"
                            />
                        </div>
                        <div className="input-group">
                            <input
                                name="region"
                                type="text"
                                className="input-field"
                                placeholder="Регион / Область"
                            />
                        </div>
                        <div className="input-group">
                            <input
                                name="city"
                                type="text"
                                className="input-field"
                                placeholder="Город"
                            />
                        </div>
                    </div>

                    {/* Безопасность */}
                    <div className="form-section">
                        <h3>{t('register.section.security', 'Безопасность')}</h3>
                        <div className="input-group">
                            <input
                                name="password"
                                type="password"
                                className="input-field"
                                placeholder={t('register.password.placeholder', 'Пароль')}
                                minLength={6}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="regist-btn"
                        disabled={loading}
                    >
                        {loading
                            ? t('register.button.submitting', 'Регистрация...')
                            : t('register.button.submit', 'Зарегистрироваться')}
                    </button>
                </form>

                <div className="regist-footer">
                    <p>
                        {t('register.alreadyHaveAccount', 'Уже есть аккаунт?')}{' '}
                        <a href="/login">
                            {t('register.loginLink', 'Войти')}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpertRegistPage;