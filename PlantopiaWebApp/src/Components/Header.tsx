// src/Components/Header.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const firstName = sessionStorage.getItem('userFirstName') || localStorage.getItem('userFirstName');
    const lastName = sessionStorage.getItem('userLastName') || localStorage.getItem('userLastName');
    const fullName = firstName && lastName ? `${firstName} ${lastName}` :
        firstName || lastName || 'Пользователь';

    useEffect(() => {
        setIsMenuOpen(false);
    }, [location.pathname]);

    return (
        <>
            <header className="header">
                {/* Левая часть — приветствие */}
                <div className="header-greeting">
                    Привет, {fullName}!
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
                            <Link to="/" className="nav-link">Главная</Link>
                        </li>
                        <li><Link to="/profile" className="nav-link">Профиль</Link></li>
                        <li><Link to="/saved" className="nav-link">Сохранения</Link></li>
                        <li>
                            <Link
                                to="/"
                                className="nav-link logout-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onLogout(); // This now calls the logout function passed from AppContent
                                }}
                            >
                                Выйти
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