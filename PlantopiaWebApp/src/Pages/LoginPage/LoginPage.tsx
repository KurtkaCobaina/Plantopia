import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import './LoginPage.css';

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
}

interface ErrorResponse {
    message?: string;
    title?: string;
    errors?: Record<string, string[]>;
}

interface LoginPageProps {
    onLoginSuccess?: () => void;
}

const LoginPage = ({ onLoginSuccess }: LoginPageProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { refresh } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const loginData: LoginRequest = {
                email: email.trim(),
                password
            };

            const response = await fetch('http://localhost:5243/api/Auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData),
            });

            let data: LoginResponse | ErrorResponse = await response.json();

            if (!response.ok) {
                let errorMessage = 'Ошибка авторизации';

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

            if (loginDataResponse.token) {
                storage.setItem('authToken', loginDataResponse.token);
            } else if (loginDataResponse.sessionId) {
                // Если токена нет, используем sessionId как "токен" для проверки
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
            if (loginDataResponse.userRole) {
                storage.setItem('userRole', loginDataResponse.userRole);
            }
            if (loginDataResponse.apiKey) {
                storage.setItem('apiKey', loginDataResponse.apiKey);
            }

            // Обновляем контекст аутентификации
            refresh();

            // Вызываем колбэк об успешной авторизации
            if (onLoginSuccess) {
                onLoginSuccess();
            }

            // Перенаправляем на главную страницу
            navigate('/');

        } catch (err) {
            console.error('Login error:', err);
            setError(err instanceof Error ? err.message : 'Произошла ошибка при входе');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-form-container">
                <h1 className="login-title">Вход в систему</h1>

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
                            placeholder="Введите ваш email"
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
                            placeholder="Введите ваш пароль"
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
                            <span className="checkbox-text">Запомнить меня</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className={`login-btn ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Нет аккаунта? <a href="/register">Зарегистрироваться</a></p>
                    <p><a href="/forgot-password">Забыли пароль?</a></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;