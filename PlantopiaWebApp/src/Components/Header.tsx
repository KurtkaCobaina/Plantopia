// src/Components/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';
import { useI18n } from '../I18nContext';

interface HeaderProps {
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { t, language } = useI18n();


    const firstName = sessionStorage.getItem('userFirstName') || localStorage.getItem('userFirstName');
    const lastName = sessionStorage.getItem('userLastName') || localStorage.getItem('userLastName');
    const fullName = firstName && lastName ? `${firstName} ${lastName}` :
        firstName || lastName || '';





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
                        <li>
                            <Link to="/" className="nav-link">
                                {t('header.home', language === 'ru' ? 'Главная' : 'Home')}
                            </Link>
                        </li>
                        <li>
                            <Link to="/profile" className="nav-link">
                                {t('header.profile', language === 'ru' ? 'Профиль' : 'Profile')}
                            </Link>
                        </li>
                        <li>
                            <Link to="/saved" className="nav-link">
                                {t('header.saved', language === 'ru' ? 'Сохранения' : 'Saved')}
                            </Link>
                        </li>

                        <li>
                            <Link
                                to="/"
                                className="nav-link logout-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLogout(); // This now calls the logout function passed from AppContent
                                }}
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