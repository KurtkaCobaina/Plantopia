import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './LoginPage.css';
import { useI18n } from '../../I18nContext';

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    sessionId?: string;
    userId?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
    userRole?: string;
    phone?: string;
    subscriptionStatus?: boolean;
    token?: string;
    apiKey?: string;
    message?: string;
    ndvi_api_key?: string;

    // --- НОВЫЕ ПОЛЯ ДЛЯ ЭКСПЕРТА ---
    specialization?: string;
    experienceYears?: number;
    hourlyRate?: number;
    country?: string;
    region?: string;
    city?: string;
}

interface ErrorResponse {
    message?: string;
    title?: string;
    errors?: Record<string, string[]>;
}

type UserRole = 'farmer' | 'expert';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Состояние для переключения роли
    const [activeRole, setActiveRole] = useState<UserRole>('farmer');

    const navigate = useNavigate();
    const { refresh } = useAuth();
    const { t } = useI18n();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const loginData: LoginRequest = {
                email: email.trim(),
                password
            };

            // Выбираем эндпоинт в зависимости от выбранной роли
            const endpoint = activeRole === 'expert'
                ? 'http://localhost:5243/api/Auth/expert-login'
                : 'http://localhost:5243/api/Auth/login';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            const data: LoginResponse | ErrorResponse = await response.json();

            if (!response.ok) {
                let errorMessage = t('login.error.default', 'Ошибка авторизации');

                if (typeof data === 'object' && data !== null) {
                    if ('message' in data && typeof data.message === 'string') {
                        errorMessage = data.message;
                    } else if ('title' in data && typeof data.title === 'string') {
                        errorMessage = data.title;
                    } else if ('errors' in data && typeof data.errors === 'object') {
                        const errors = Object.values(data.errors).flat();
                        if (errors.length > 0) {
                            errorMessage = errors[0];
                        }
                    }
                }
                throw new Error(errorMessage);
            }

            const loginDataResponse = data as LoginResponse;

            // Сохраняем данные авторизации
            const storage = rememberMe ? localStorage : sessionStorage;

            if (loginDataResponse.sessionId) {
                storage.setItem('sessionId', loginDataResponse.sessionId);
            }

            if (loginDataResponse.userId) {
                storage.setItem('userId', loginDataResponse.userId.toString());
            }
            if (loginDataResponse.email) {
                storage.setItem('userEmail', loginDataResponse.email);
            }
            if (loginDataResponse.firstName) {
                storage.setItem('userFirstName', loginDataResponse.firstName);
            }
            if (loginDataResponse.lastName) {
                storage.setItem('userLastName', loginDataResponse.lastName);
            }
            if (loginDataResponse.phone) {
                storage.setItem('userPhone', loginDataResponse.phone);
            }
            if (loginDataResponse.subscriptionStatus !== undefined) {
                storage.setItem('userSubscriptionStatus', String(loginDataResponse.subscriptionStatus));
            }

            // Определяем финальную роль
            const finalRole = loginDataResponse.userRole || (activeRole === 'expert' ? 'expert' : 'farmer');
            storage.setItem('userRole', finalRole);

            if (loginDataResponse.apiKey) {
                storage.setItem('apiKey', loginDataResponse.apiKey);
            }
            if (loginDataResponse.ndvi_api_key) {
                storage.setItem('ndvi_api_key', loginDataResponse.ndvi_api_key);
            }

            // --- СОХРАНЕНИЕ ДАННЫХ ЭКСПЕРТА ---
            if (finalRole === 'expert') {
                if (loginDataResponse.specialization) {
                    storage.setItem('expertSpecialization', loginDataResponse.specialization);
                }
                if (loginDataResponse.experienceYears !== undefined) {
                    storage.setItem('expertExperienceYears', loginDataResponse.experienceYears.toString());
                }
                if (loginDataResponse.hourlyRate !== undefined) {
                    storage.setItem('expertHourlyRate', loginDataResponse.hourlyRate.toString());
                }
                if (loginDataResponse.country) {
                    storage.setItem('expertCountry', loginDataResponse.country);
                }
                if (loginDataResponse.region) {
                    storage.setItem('expertRegion', loginDataResponse.region);
                }
                if (loginDataResponse.city) {
                    storage.setItem('expertCity', loginDataResponse.city);
                }
            }
            // ----------------------------------

            // Обновляем контекст аутентификации
            refresh();

            // --- ЖЕСТКИЙ РЕДИРЕКТ В ЗАВИСИМОСТИ ОТ РОЛИ ---
            if (finalRole === 'expert') {
                console.log("Редирект эксперта на /expert-dashboard");
                navigate('/expert-dashboard', { replace: true });
            } else {
                console.log("Редирект фермера на /");
                navigate('/', { replace: true });
            }

        } catch (err) {
            console.error('Login error:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : t('login.error.generic', 'Произошла ошибка при входе'),
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form-container">
                {/* Переключатель ролей */}
                <div className="role-switcher">
                    <button
                        className={`role-btn ${activeRole === 'farmer' ? 'active' : ''}`}
                        onClick={() => setActiveRole('farmer')}
                    >
                        Фермер
                    </button>
                    <button
                        className={`role-btn ${activeRole === 'expert' ? 'active' : ''}`}
                        onClick={() => setActiveRole('expert')}
                    >
                        Эксперт
                    </button>
                </div>

                <h1 className="login-title">
                    {activeRole === 'farmer'
                        ? t('login.title.farmer', 'Вход для фермера')
                        : t('login.title.expert', 'Вход для эксперта')}
                </h1>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="input-group">
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder={t('login.email.placeholder', 'Введите ваш email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder={t('login.password.placeholder', 'Введите ваш пароль')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="checkbox-input"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                disabled={loading}
                            />
                            <span className="checkbox-text">
                                {t('login.rememberMe', 'Запомнить меня')}
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className={`login-btn ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading
                            ? t('login.button.loading', 'Вход...')
                            : t('login.button.submit', 'Войти')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {t('login.noAccount', 'Нет аккаунта?')}{' '}
                        <a href="/register">
                            {t('login.registerLink', 'Зарегистрироваться')}
                        </a>
                    </p>
                    <p>
                        <a href="/forgot-password">
                            {t('login.forgotPassword', 'Забыли пароль?')}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;