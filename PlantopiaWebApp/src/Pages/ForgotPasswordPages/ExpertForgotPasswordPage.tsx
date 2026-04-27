import './ForgotPasswordPage.css';
import { useI18n } from '../../I18nContext';
import { useState } from 'react';

const ExpertForgotPasswordPage = () => {
    const { t } = useI18n();

    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Убрали состояние message и isError, так как используем alert
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        if (!email || !phone || !newPassword) {
            alert('Заполните все поля');
            return;
        }

        setIsLoading(true);

        try {
            // Используем относительный путь. Vite proxy перенаправит это на localhost:5243
            const response = await fetch('/api/auth/expert-forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    phone: phone,
                    newPassword: newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message || 'Пароль успешно изменен');
                setEmail('');
                setPhone('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(data.message || 'Ошибка при сбросе пароля');
            }
        } catch (error) {
            alert('Ошибка соединения с сервером. Убедитесь, что backend запущен на порту 5243.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-form-container">
                <h1 className="forgot-password-title">
                    {t('forgotPassword.title', 'Сброс пароля')}
                </h1>

                <form className="forgot-password-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder={t('forgotPassword.email.placeholder', 'Введите ваш email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            id="phone"
                            type="tel"
                            className="input-field"
                            placeholder={t('forgotPassword.phone.placeholder', 'Введите ваш номер телефона')}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            id="new_password"
                            type="password"
                            className="input-field"
                            placeholder={t('forgotPassword.newPassword.placeholder', 'Придумайте новый пароль')}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <input
                            id="confirm_new_password"
                            type="password"
                            className="input-field"
                            placeholder={t('forgotPassword.confirmPassword.placeholder', 'Повторите новый пароль')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="reset-password-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Обработка...' : t('forgotPassword.button.submit', 'Сбросить пароль')}
                    </button>
                </form>

                <div className="forgot-password-footer">
                    <p>
                        <a href="/login">
                            {t('forgotPassword.backToLogin', 'Вернуться к входу')}
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpertForgotPasswordPage;