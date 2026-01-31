// src/Pages/Auth/ForgotPasswordPage.tsx
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
    return (
        <div className="forgot-password-container">
            <div className="forgot-password-form-container">
                <h1 className="forgot-password-title">Сброс пароля</h1>

                <form className="forgot-password-form">
                    <div className="input-group">

                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder="Введите ваш email"
                        />
                    </div>

                    <div className="input-group">

                        <input
                            id="phone"
                            type="tel"
                            className="input-field"
                            placeholder="Введите ваш номер телефона"
                        />
                    </div>

                    <div className="input-group">

                        <input
                            id="new_password"
                            type="password"
                            className="input-field"
                            placeholder="Придумайте новый пароль"
                        />
                    </div>

                    <div className="input-group">

                        <input
                            id="confirm_new_password"
                            type="password"
                            className="input-field"
                            placeholder="Повторите новый пароль"
                        />
                    </div>

                    <button
                        type="submit"
                        className="reset-password-btn"
                    >
                        Сбросить пароль
                    </button>
                </form>

                <div className="forgot-password-footer">
                    <p><a href="/login">Вернуться к входу</a></p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;