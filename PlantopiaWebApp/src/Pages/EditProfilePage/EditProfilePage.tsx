import { useState, useEffect } from 'react';
import { type User } from '../../Interfaces/User.ts';
import './EditProfilePage.css'
import { useNavigate } from "react-router-dom";

const EditProfilePage = () => {
    // @ts-ignore
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        // Загрузка профиля пользователя
        const fetchUserProfile = async () => {
            const response = await fetch('/api/user/profile');
            const userData: User = await response.json();
            setUser(userData);
            setFormData({
                first_name: userData.first_name || '',
                last_name: userData.last_name || '',
                email: userData.email || '',
                phone: userData.phone || ''
            });
        };
        fetchUserProfile();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const navigate = useNavigate();
    const handleProfileClick = () => {
        navigate('/profile');
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Логика сохранения будет добавлена позже
    };

    return (
        <div className="edit-profile-container">
            <h1>Редактировать профиль</h1>

            <form onSubmit={handleSubmit} className="edit-form">
                <div className="input-group1">
                    <label htmlFor="first_name">Имя:</label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="input-field"
                    />
                </div>

                <div className="input-group1">
                    <label htmlFor="last_name">Фамилия:</label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="input-field"
                    />
                </div>

                <div className="input-group1">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input-field"
                    />
                </div>

                <div className="input-group1">
                    <label htmlFor="phone">Телефон:</label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input-field"
                    />
                </div>

                <div className="button-group">
                    <button type="submit" className="save-btn">
                        Сохранить
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleProfileClick}>
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfilePage;