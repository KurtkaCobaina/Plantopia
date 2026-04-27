// src/Pages/Auth/RegisterPages.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import { useI18n } from '../../I18nContext';

const RegisterPage = () => {
    const { t } = useI18n();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Получаем значения из формы
        const formData = new FormData(e.currentTarget);
        const firstName = formData.get('first_name') as string;
        const lastName = formData.get('last_name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const password = formData.get('password') as string;

        // Базовая валидация
        if (!firstName || !lastName || !email || !password) {
            setError(t('register.error.required', 'Все поля обязательны.'));
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/registration/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    phone,
                    password,
                }),
            });

            if (response.ok) {
                // Успешная регистрация → переход на страницу входа
                alert(t('register.success', 'Регистрация успешна! Теперь войдите в систему.'));
                navigate('/login');
            } else {
                const result = await response.json();
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
        <div className="register-container">
            <div className="register-form-container">
                <h1 className="register-title">
                    {t('register.title', 'Регистрация')}
                </h1>

                {error && <div className="error-message">{error}</div>}

                <form className="register-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            name="first_name"
                            id="first_name"
                            type="text"
                            className="input-field"
                            placeholder={t('register.firstName.placeholder', 'Введите ваше имя')}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            name="last_name"
                            id="last_name"
                            type="text"
                            className="input-field"
                            placeholder={t('register.lastName.placeholder', 'Введите вашу фамилию')}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            name="email"
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder={t('register.email.placeholder', 'Введите ваш email')}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            name="phone"
                            id="phone"
                            type="tel"
                            className="input-field"
                            placeholder={t('register.phone.placeholder', 'Введите ваш номер телефона')}
                        />
                    </div>

                    <div className="input-group">
                        <input
                            name="password"
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder={t('register.password.placeholder', 'Придумайте пароль')}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="register-btn"
                        disabled={loading}
                    >
                        {loading
                            ? t('register.button.submitting', 'Регистрация...')
                            : t('register.button.submit', 'Зарегистрироваться')}
                    </button>
                </form>

                <div className="register-footer">
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

export default RegisterPage;