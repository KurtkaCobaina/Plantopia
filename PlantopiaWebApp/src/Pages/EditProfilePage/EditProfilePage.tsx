// EditProfilePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditProfilePage.css';

const EditProfilePage = () => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        // Загружаем из sessionStorage (как в ProfilePage)
        const firstName = sessionStorage.getItem('userFirstName') || '';
        const lastName = sessionStorage.getItem('userLastName') || '';
        const email = sessionStorage.getItem('userEmail') || '';
        const phone = sessionStorage.getItem('phone') || sessionStorage.getItem('userPhone') || '';

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({ first_name: firstName, last_name: lastName, email, phone });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert('Пользователь не авторизован');
            return;
        }

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parseInt(userId, 10),
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone
                })
            });

            if (response.ok) {
                // Обновляем sessionStorage
                sessionStorage.setItem('userFirstName', formData.first_name);
                sessionStorage.setItem('userLastName', formData.last_name);
                sessionStorage.setItem('userEmail', formData.email);
                sessionStorage.setItem('userPhone', formData.phone); 

                alert('Профиль обновлён!');
                navigate('/profile');
            } else {
                const error = await response.json().catch(() => ({}));
                alert('Ошибка: ' + (error.message || 'Не удалось сохранить'));
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка сети');
        }
    };

    const handleCancel = () => navigate('/profile');

    return (
        <div className="edit-profile-container">
            <h1>Редактировать профиль</h1>
            <form onSubmit={handleSubmit} className="edit-form">
                {/* поля формы — как у вас */}
                <div className="input-group1">
                    <label htmlFor="first_name">Имя:</label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="input-field"
                        required
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
                        required
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
                        required
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
                    <button type="submit" className="save-btn">Сохранить</button>
                    <button type="button" className="cancel-btn" onClick={handleCancel}>
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfilePage;