import { useState, useEffect } from 'react';
import { type User } from '../../Interfaces/User.ts';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Логируем для отладки (удалите в продакшене)
        console.log('Reading user data from localStorage...');
        const keysToRead = [
            'userId', 'userEmail', 'userFirstName', 'userLastName',
            'userRole', 'apiKey', 'phone', 'subscriptionStatus', 'createdAt'
        ];
        keysToRead.forEach(key => {
            console.log(`${key}:`, sessionStorage.getItem(key));
        });

        // Чтение данных
        const userId = sessionStorage.getItem('userId');
        const email = sessionStorage.getItem('userEmail') || '';
        const firstName = sessionStorage.getItem('userFirstName') || '';
        const lastName = sessionStorage.getItem('userLastName') || '';
        const phone = sessionStorage.getItem('phone') || sessionStorage.getItem('userPhone') || '';
        const role = sessionStorage.getItem('userRole') || 'user';
        const subscriptionStatusStr = sessionStorage.getItem('userSubscriptionStatus') || 'false';
        const createdAt = sessionStorage.getItem('createdAt') || new Date().toISOString();
        const updatedAt = sessionStorage.getItem('updatedAt') || createdAt;

        const subscriptionStatus = subscriptionStatusStr.toLowerCase() === 'true';

        // Формируем пользователя
        const userData: User = {
            id: userId ? parseInt(userId, 10) : 0,
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            subscription_status: subscriptionStatus,
            user_role: role,
            created_at: createdAt,
            updated_at: updatedAt,
            api_key: '', // не используется в UI
            password: ''  // never show
        };

        setUser(userData);

        // API ключ: сначала ищем 'apiKey', потом 'api_key', потом 'apiKey'
        const savedApiKey =
            sessionStorage.getItem('apiKey') ||
            sessionStorage.getItem('api_key') ||
            sessionStorage.getItem('apiKey') || // дубль на всякий случай
            '';
        setApiKey(savedApiKey);

        // Для отладки: покажем в консоли, что записали
        console.log('Parsed user:', userData);
        console.log('API key loaded:', savedApiKey ? '✅' : '❌ (empty)');
    }, []);

    const handleEditClick = () => {
        navigate('/profile/edit');
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
    };

    const handleSaveApiKey = () => {
        sessionStorage.setItem('apiKey', apiKey); // сохраняем в стандартный ключ
        setIsEditing(false);
        alert('API ключ успешно сохранён!');
    };

    const toggleApiKeyEdit = () => {
        setIsEditing(!isEditing);
    };

    if (!user) {
        return <div className="profile-container">Загрузка профиля...</div>;
    }

    return (
        <div className="profile-container">
            <h1>Профиль пользователя</h1>

            <div className="profile-card">
                <div className="field-row">
                    <div className="field-label">Email:</div>
                    <div className="field-value">{user.email || '—'}</div>
                </div>

                <div className="field-row">
                    <div className="field-label">Имя:</div>
                    <div className="field-value">{user.first_name || '—'}</div>
                </div>

                <div className="field-row">
                    <div className="field-label">Фамилия:</div>
                    <div className="field-value">{user.last_name || '—'}</div>
                </div>

                <div className="field-row">
                    <div className="field-label">Телефон:</div>
                    <div className="field-value">{user.phone || '—'}</div>
                </div>

                <div className="field-row subscription-row">
                    <div className="field-label">Статус подписки:</div>
                    <div className={`subscription-status ${user.subscription_status ? 'active' : 'inactive'}`}>
                        {user.subscription_status ? 'Активна' : 'Неактивна'}
                    </div>
                </div>

                <div className="field-row">
                    <div className="field-label">Роль:</div>
                    <div className="field-value">{user.user_role || '—'}</div>
                </div>


            </div>

            <button className="edit-btn" onClick={handleEditClick}>
                Редактировать
            </button>

            {/* API ключ */}
            <div className="api-key-section">
                <h2>API Ключ</h2>
                <div className="api-key-container">
                    {isEditing ? (
                        <input
                            type="password"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            placeholder="Введите API ключ"
                            className="api-input"
                        />
                    ) : (
                        <div className="api-display">
                            {apiKey ? '••••••••••••••••••••' : 'Ключ не установлен'}
                        </div>
                    )}

                    <div className="api-buttons">
                        {isEditing ? (
                            <button className="save-api-btn" onClick={handleSaveApiKey}>
                                Сохранить
                            </button>
                        ) : (
                            <button className="edit-api-btn" onClick={toggleApiKeyEdit}>
                                {apiKey ? 'Изменить' : 'Установить'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;