// src/Pages/Auth/ForgotPasswordPage.tsx
import './ForgotPasswordPage.css';
import { useI18n } from '../../I18nContext';

const ForgotPasswordPage = () => {
    const { t } = useI18n();
    return (
        <div className="forgot-password-container">
            <div className="forgot-password-form-container">
                <h1 className="forgot-password-title">
                    {t('forgotPassword.title', 'Сброс пароля')}
                </h1>

                <form className="forgot-password-form">
                    <div className="input-group">

                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder={t('forgotPassword.email.placeholder', 'Введите ваш email')}
                        />
                    </div>

                    <div className="input-group">

                        <input
                            id="phone"
                            type="tel"
                            className="input-field"
                            placeholder={t('forgotPassword.phone.placeholder', 'Введите ваш номер телефона')}
                        />
                    </div>

                    <div className="input-group">

                        <input
                            id="new_password"
                            type="password"
                            className="input-field"
                            placeholder={t('forgotPassword.newPassword.placeholder', 'Придумайте новый пароль')}
                        />
                    </div>

                    <div className="input-group">

                        <input
                            id="confirm_new_password"
                            type="password"
                            className="input-field"
                            placeholder={t('forgotPassword.confirmPassword.placeholder', 'Повторите новый пароль')}
                        />
                    </div>

                    <button
                        type="submit"
                        className="reset-password-btn"
                    >
                        {t('forgotPassword.button.submit', 'Сбросить пароль')}
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

export default ForgotPasswordPage;