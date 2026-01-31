// src/Pages/Auth/RegisterPage.tsx
import './RegisterPage.css';

const RegisterPage = () => {
    return (
        <div className="register-container">
            <div className="register-form-container">
                <h1 className="register-title">Регистрация</h1>

                <form className="register-form">
                    <div className="input-group">

                        <input
                            id="first_name"
                            type="text"
                            className="input-field"
                            placeholder="Введите ваше имя"
                        />
                    </div>

                    <div className="input-group">

                        <input
                            id="last_name"
                            type="text"
                            className="input-field"
                            placeholder="Введите вашу фамилию"
                        />
                    </div>

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
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="Придумайте пароль"
                        />
                    </div>

                   

                    <button
                        type="submit"
                        className="register-btn"
                    >
                        Зарегистрироваться
                    </button>
                </form>

                <div className="register-footer">
                    <p>Уже есть аккаунт? <a href="/login">Войти</a></p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;