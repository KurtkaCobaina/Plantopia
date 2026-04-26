import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';
import { useI18n } from '../I18nContext';

interface HeaderProps {
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t, language } = useI18n();
    const navigate = useNavigate();

    // Получаем данные пользователя
    const firstName = sessionStorage.getItem('userFirstName') || localStorage.getItem('userFirstName');
    const lastName = sessionStorage.getItem('userLastName') || localStorage.getItem('userLastName');
    const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || '');

    // Получаем роль пользователя
    const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole');
    const isExpert = userRole === 'expert';

    // Закрываем мобильное меню при переходе по ссылке
    const handleLinkClick = () => {
        setIsMenuOpen(false);
    };

    // Обработчик выхода с перенаправлением на логин
    const handleLogoutClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onLogout();
        navigate('/login');
    };

    return (
        <>
            <header className="header">
                {/* Левая часть — приветствие */}
                <div className="header-greeting">
                    {t('header.greeting', language === 'ru' ? 'Привет' : 'Hello')}
                    {fullName
                        ? `, ${fullName}!`
                        : `, ${t('header.defaultUser', language === 'ru' ? 'Пользователь' : 'User')}!`}
                </div>

                {/* Мобильное меню */}
                <button
                    className="menu-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
                >
                    ☰
                </button>

                {/* Навигация */}
                <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
                    <ul className="nav-list">

                        {/* --- КНОПКА ДЛЯ ЭКСПЕРТА: МОЙ КАБИНЕТ --- */}
                        {isExpert && (
                            <li>
                                <Link
                                    to="/expert-dashboard"
                                    className="nav-link "
                                    onClick={handleLinkClick}
                                >
                                    {t('header.expertDashboard', language === 'ru' ? 'Мой кабинет' : 'My Dashboard')}
                                </Link>
                            </li>
                        )}
                        {/* --------------------------------------- */}

                        {/* Ссылка "Главная" видна ТОЛЬКО фермерам */}
                        {!isExpert && (
                            <li>
                                <Link to="/" className="nav-link" onClick={handleLinkClick}>
                                    {t('header.home', language === 'ru' ? 'Главная' : 'Home')}
                                </Link>
                            </li>
                        )}

                        {/* Ссылка "Профиль" видна всем */}
                        <li>
                            <Link to="/profile" className="nav-link" onClick={handleLinkClick}>
                                {t('header.profile', language === 'ru' ? 'Профиль' : 'Profile')}
                            </Link>
                        </li>

                        {/* Ссылка "Сохранения" видна ТОЛЬКО фермерам */}
                        {!isExpert && (
                            <li>
                                <Link to="/saved" className="nav-link" onClick={handleLinkClick}>
                                    {t('header.saved', language === 'ru' ? 'Сохранения' : 'Saved')}
                                </Link>
                            </li>
                        )}

                        {/* Кнопка Выйти видна всем */}
                        <li>
                            <Link
                                to="/login"
                                className="nav-link logout-btn"
                                onClick={handleLogoutClick}
                            >
                                {t('header.logout', language === 'ru' ? 'Выйти' : 'Logout')}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </header>
            <div className="header-offset"></div>
        </>
    );
};

export default Header;