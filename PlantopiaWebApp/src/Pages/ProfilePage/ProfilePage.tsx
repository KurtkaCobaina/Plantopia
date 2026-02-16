// src/Pages/Auth/ProfilePage.tsx
import { useState, useEffect } from 'react';
import { type User } from '../../Interfaces/User.ts';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import { useI18n } from '../../I18nContext';

const ProfilePage = () => {
    const [user, setUser] = useState<User | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [ndviApiKey, setNdviApiKey] = useState('');
    const [isEditingApiKey, setIsEditingApiKey] = useState(false);
    const [isEditingNdviApiKey, setIsEditingNdviApiKey] = useState(false);
    const navigate = useNavigate();
    const { t } = useI18n();

    useEffect(() => {
        const userId = sessionStorage.getItem('userId');
        const email = sessionStorage.getItem('userEmail') || '';
        const firstName = sessionStorage.getItem('userFirstName') || '';
        const lastName = sessionStorage.getItem('userLastName') || '';
        const phone = sessionStorage.getItem('phone') || sessionStorage.getItem('userPhone') || '';
        const role = sessionStorage.getItem('userRole') || 'user';
        const subscriptionStatusStr = sessionStorage.getItem('userSubscriptionStatus') || 'false';
        const createdAt = sessionStorage.getItem('createdAt') || new Date().toISOString();
        const updatedAt = sessionStorage.getItem('updatedAt') || createdAt;
        const savedNdviApiKey = sessionStorage.getItem('ndvi_api_key') || '';

        const subscriptionStatus = subscriptionStatusStr.toLowerCase() === 'true';

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
            api_key: '',
            password: '',
            ndvi_api_key: savedNdviApiKey
        };

        setUser(userData);

        const savedApiKey =
            sessionStorage.getItem('apiKey') ||
            sessionStorage.getItem('api_key') ||
            '';
        setApiKey(savedApiKey);
        setNdviApiKey(savedNdviApiKey);
    }, []);

    const handleEditClick = () => {
        navigate('/profile/edit');
    };

    const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setApiKey(e.target.value);
    };

    const handleNdviApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNdviApiKey(e.target.value);
    };

    const handleSaveApiKey = async () => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert(t('profile.error.notAuthorized', 'Ошибка: пользователь не авторизован.'));
            return;
        }

        try {
            const response = await fetch('/api/user/update-api-key', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId, 10), apiKey: apiKey })
            });

            if (response.ok) {
                sessionStorage.setItem('apiKey', apiKey);
                setIsEditingApiKey(false);
                alert(t('profile.apiKey.saveSuccess', 'API ключ успешно сохранён!'));
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(t('profile.apiKey.saveErrorPrefix', 'Ошибка при сохранении:') + ' ' + (errorData.message || t('common.unknownError', 'Неизвестная ошибка')));
            }
        } catch (err) {
            console.error('Network error:', err);
            alert(t('common.networkError', 'Ошибка сети. Проверьте подключение к серверу.'));
        }
    };

    const handleSaveNdviApiKey = async () => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert(t('profile.error.notAuthorized', 'Ошибка: пользователь не авторизован.'));
            return;
        }

        try {
            const response = await fetch('/api/user/update-ndvi-api-key', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId, 10), ndviApiKey: ndviApiKey })
            });

            if (response.ok) {
                sessionStorage.setItem('ndvi_api_key', ndviApiKey);
                if (user) {
                    setUser({ ...user, ndvi_api_key: ndviApiKey });
                }
                setIsEditingNdviApiKey(false);
                alert(t('profile.ndviApiKey.saveSuccess', 'NDVI API ключ успешно сохранён!'));
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(t('profile.ndviApiKey.saveErrorPrefix', 'Ошибка при сохранении:') + ' ' + (errorData.message || t('common.unknownError', 'Неизвестная ошибка')));
            }
        } catch (err) {
            console.error('Network error:', err);
            alert(t('common.networkError', 'Ошибка сети. Проверьте подключение к серверу.'));
        }
    };

    const toggleSubscription = async (activate: boolean) => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            alert(t('profile.error.notAuthorized', 'Ошибка: пользователь не авторизован.'));
            return;
        }

        try {
            const response = await fetch(`/api/user/update-subscription-status/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: activate })
            });

            if (response.ok) {
                const result = await response.json();
                if (user) {
                    setUser({
                        ...user,
                        subscription_status: result.subscriptionStatus,
                        updated_at: result.updatedAt,
                    });
                }
                sessionStorage.setItem('userSubscriptionStatus', String(result.subscriptionStatus));
                alert(result.message);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(t('profile.subscription.toggleError', 'Ошибка при изменении подписки:') + ' ' + (errorData.message || t('common.unknownError', 'Неизвестная ошибка')));
            }
        } catch (err) {
            console.error('Ошибка подписки:', err);
            alert(t('common.networkError', 'Ошибка сети. Проверьте подключение.'));
        }
    };

    const handleActivateSubscription = () => toggleSubscription(true);
    const handleDeactivateSubscription = () => toggleSubscription(false);

    const toggleApiKeyEdit = () => setIsEditingApiKey(!isEditingApiKey);
    const toggleNdviApiKeyEdit = () => setIsEditingNdviApiKey(!isEditingNdviApiKey);

    if (!user) {
        return <div className="profile-container">{t('profile.loading', 'Загрузка профиля...')}</div>;
    }

    // Вспомогательные функции для проверки "реального" значения ключа
    const hasApiKey = apiKey && apiKey.trim() !== '';
    const hasNdviApiKey = ndviApiKey && ndviApiKey.trim() !== '';

    return (
        <div className="profile-container">
            <h1>{t('profile.title', 'Профиль пользователя')}</h1>

            <div className="profile-card">
                <div className="field-row">
                    <div className="field-label">Email:</div>
                    <div className="field-value">{user.email || '—'}</div>
                </div>
                <div className="field-row">
                    <div className="field-label">{t('profile.firstName.label', 'Имя:')}</div>
                    <div className="field-value">{user.first_name || '—'}</div>
                </div>
                <div className="field-row">
                    <div className="field-label">{t('profile.lastName.label', 'Фамилия:')}</div>
                    <div className="field-value">{user.last_name || '—'}</div>
                </div>
                <div className="field-row">
                    <div className="field-label">{t('profile.phone.label', 'Телефон:')}</div>
                    <div className="field-value">{user.phone || '—'}</div>
                </div>
                <div className="field-row subscription-row">
                    <div className="field-label">{t('profile.subscription.label', 'Статус подписки:')}</div>
                    <div className={`subscription-status ${user.subscription_status ? 'active' : 'inactive'}`}>
                        {user.subscription_status
                            ? t('profile.subscription.active', 'Активна')
                            : t('profile.subscription.inactive', 'Неактивна')}
                    </div>
                </div>
                <div className="field-row">
                    <div className="field-label">{t('profile.role.label', 'Роль:')}</div>
                    <div className="field-value">{user.user_role || '—'}</div>
                </div>
            </div>

            <button className="edit-btn" onClick={handleEditClick}>
                {t('profile.editButton', 'Редактировать профиль')}
            </button>

            {/* Кнопка управления подпиской — динамический стиль */}
            <button
                className={user.subscription_status
                    ? "subscription-deactivate-btn"
                    : "subscription-activate-btn"}
                onClick={user.subscription_status
                    ? handleDeactivateSubscription
                    : handleActivateSubscription}
            >
                {user.subscription_status
                    ? t('profile.subscription.deactivateButton', 'Отменить подписку')
                    : t('profile.subscription.activateButton', 'Активировать подписку')}
            </button>

            {/* Обычный API ключ */}
            <div className="api-key-section">
                <h2>{t('profile.apiKey.title', 'API Ключ')}</h2>
                <div className="api-key-container">
                    {isEditingApiKey ? (
                        <input
                            type="password"
                            value={apiKey}
                            onChange={handleApiKeyChange}
                            placeholder={t('profile.apiKey.placeholder', 'Введите API ключ')}
                            className="api-input"
                        />
                    ) : (
                        <div className="api-display">
                            {hasApiKey
                                ? '••••••••••••••••••••'
                                : t('profile.apiKey.notSet', 'Ключ не установлен')}
                        </div>
                    )}
                    <div className="api-buttons">
                        {isEditingApiKey ? (
                            <>
                                <button className="save-api-btn" onClick={handleSaveApiKey}>
                                    {t('common.save', 'Сохранить')}
                                </button>
                                <button className="cancel-api-btn" onClick={toggleApiKeyEdit}>
                                    {t('common.cancel', 'Отмена')}
                                </button>
                            </>
                        ) : (
                            <button className="edit-api-btn" onClick={toggleApiKeyEdit}>
                                {hasApiKey ? t('common.change', 'Изменить') : t('common.set', 'Установить')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* NDVI API ключ */}
            <div className="ndvi-api-key-section">
                <h2>{t('profile.ndviApiKey.title', 'NDVI API Ключ')}</h2>
                <div className="api-key-container">
                    {isEditingNdviApiKey ? (
                        <input
                            type="password"
                            value={ndviApiKey}
                            onChange={handleNdviApiKeyChange}
                            placeholder={t('profile.ndviApiKey.placeholder', 'Введите NDVI API ключ')}
                            className="api-input"
                        />
                    ) : (
                        <div className="api-display">
                            {hasNdviApiKey
                                ? '••••••••••••••••••••'
                                : t('profile.ndviApiKey.notSet', 'Ключ не установлен')}
                        </div>
                    )}
                    <div className="api-buttons">
                        {isEditingNdviApiKey ? (
                            <>
                                <button className="save-api-btn" onClick={handleSaveNdviApiKey}>
                                    {t('common.save', 'Сохранить')}
                                </button>
                                <button className="cancel-api-btn" onClick={toggleNdviApiKeyEdit}>
                                    {t('common.cancel', 'Отмена')}
                                </button>
                            </>
                        ) : (
                            <button className="edit-api-btn" onClick={toggleNdviApiKeyEdit}>
                                {hasNdviApiKey ? t('common.change', 'Изменить') : t('common.set', 'Установить')}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;