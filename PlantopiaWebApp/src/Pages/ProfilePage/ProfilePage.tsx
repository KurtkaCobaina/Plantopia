import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import { useI18n } from '../../I18nContext';

type TabType = 'info' | 'edit' | 'keys';

const ProfilePage = () => {
    const navigate = useNavigate();
    const { t } = useI18n();

    // Состояние активной вкладки
    const [activeTab, setActiveTab] = useState<TabType>('info');

    // Данные пользователя для отображения
    const [user, setUser] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        subscriptionStatus: false,
        // Поля эксперта
        specialization: '',
        experienceYears: 0,
        hourlyRate: 0,
        country: '',
        region: '',
        city: ''
    });

    // Данные для редактирования
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        // Поля эксперта для редактирования
        specialization: '',
        experience_years: 0,
        hourly_rate: 0,
        country: '',
        region: '',
        city: ''
    });

    // API Ключи (только для фермеров)
    const [apiKey, setApiKey] = useState('');
    const [ndviApiKey, setNdviApiKey] = useState('');
    const [isEditingApiKey, setIsEditingApiKey] = useState(false);
    const [isEditingNdviApiKey, setIsEditingNdviApiKey] = useState(false);

    const userId = sessionStorage.getItem('userId');

    // Проверяем роль
    const isFarmer = user.role === 'farmer';
    const isExpert = user.role === 'expert';

    // Загрузка данных при монтировании
    useEffect(() => {
        if (!userId) {
            navigate('/login');
            return;
        }

        const firstName = sessionStorage.getItem('userFirstName') || '';
        const lastName = sessionStorage.getItem('userLastName') || '';
        const email = sessionStorage.getItem('userEmail') || '';
        const phone = sessionStorage.getItem('userPhone') || sessionStorage.getItem('phone') || '';
        const role = sessionStorage.getItem('userRole') || 'user';
        const subStatus = sessionStorage.getItem('userSubscriptionStatus') === 'true';

        // Данные эксперта из sessionStorage
        const specialization = sessionStorage.getItem('expertSpecialization') || '';
        const expYearsStr = sessionStorage.getItem('expertExperienceYears') || '0';
        const hourlyRateStr = sessionStorage.getItem('expertHourlyRate') || '0';
        const country = sessionStorage.getItem('expertCountry') || '';
        const region = sessionStorage.getItem('expertRegion') || '';
        const city = sessionStorage.getItem('expertCity') || '';

        const savedApiKey = sessionStorage.getItem('apiKey') || '';
        const savedNdviKey = sessionStorage.getItem('ndvi_api_key') || '';

        setUser({
            firstName,
            lastName,
            email,
            phone,
            role,
            subscriptionStatus: subStatus,
            specialization,
            experienceYears: parseInt(expYearsStr, 10),
            hourlyRate: parseFloat(hourlyRateStr),
            country,
            region,
            city
        });

        setEditForm({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            specialization,
            experience_years: parseInt(expYearsStr, 10),
            hourly_rate: parseFloat(hourlyRateStr),
            country,
            region,
            city
        });

        setApiKey(savedApiKey);
        setNdviApiKey(savedNdviKey);

        // Если пользователь переключился на вкладку ключей, но он не фермер, возвращаем его на инфо
        if (!isFarmer && activeTab === 'keys') {
            setActiveTab('info');
        }

    }, [userId, navigate, activeTab, isFarmer]);

    // --- Обработчики Редактирования Профиля ---
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();

        // Определяем URL и тело запроса в зависимости от роли
        let url = '';
        let bodyData: any = {};

        if (isExpert) {
            // --- ЛОГИКА ДЛЯ ЭКСПЕРТА ---
            url = '/api/experts/profile'; // Новый эндпоинт
            bodyData = {
                userId: parseInt(userId!, 10),
                firstName: editForm.first_name,      // camelCase для C# DTO
                lastName: editForm.last_name,
                email: editForm.email,
                phone: editForm.phone,
                specialization: editForm.specialization,
                experienceYears: editForm.experience_years,
                hourlyRate: editForm.hourly_rate,
                country: editForm.country,
                region: editForm.region,
                city: editForm.city
            };
        } else {
            // --- ЛОГИКА ДЛЯ ФЕРМЕРА ---
            url = '/api/user/profile'; // Старый эндпоинт
            bodyData = {
                userId: parseInt(userId!, 10),
                first_name: editForm.first_name,     // snake_case как было ранее
                last_name: editForm.last_name,
                email: editForm.email,
                phone: editForm.phone
            };
        }

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            if (response.ok) {
                // Обновляем sessionStorage базовых полей
                sessionStorage.setItem('userFirstName', editForm.first_name);
                sessionStorage.setItem('userLastName', editForm.last_name);
                sessionStorage.setItem('userEmail', editForm.email);
                sessionStorage.setItem('userPhone', editForm.phone);

                // Если эксперт, обновляем и его специфичные поля
                if (isExpert) {
                    sessionStorage.setItem('expertSpecialization', editForm.specialization);
                    sessionStorage.setItem('expertExperienceYears', editForm.experience_years.toString());
                    sessionStorage.setItem('expertHourlyRate', editForm.hourly_rate.toString());
                    sessionStorage.setItem('expertCountry', editForm.country);
                    sessionStorage.setItem('expertRegion', editForm.region);
                    sessionStorage.setItem('expertCity', editForm.city);
                }

                // Обновляем состояние UI
                setUser(prev => ({
                    ...prev,
                    firstName: editForm.first_name,
                    lastName: editForm.last_name,
                    email: editForm.email,
                    phone: editForm.phone,
                    ...(isExpert ? {
                        specialization: editForm.specialization,
                        experienceYears: editForm.experience_years,
                        hourlyRate: editForm.hourly_rate,
                        country: editForm.country,
                        region: editForm.region,
                        city: editForm.city
                    } : {})
                }));

                alert(t('profile.saveSuccess', 'Профиль успешно обновлен!'));
                setActiveTab('info');
            } else {
                const errorText = await response.text();
                console.error("Server Error:", errorText);
                alert('Ошибка сохранения: ' + (errorText || response.statusText));
            }
        } catch (err) {
            console.error(err);
            alert('Ошибка сети');
        }
    };

    // --- Обработчики API Ключей (Только для фермеров) ---
    const handleSaveApiKey = async () => {
        try {
            const response = await fetch('/api/user/update-api-key', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId!, 10), apiKey })
            });
            if (response.ok) {
                sessionStorage.setItem('apiKey', apiKey);
                setIsEditingApiKey(false);
                alert('API ключ сохранен');
            } else {
                alert('Ошибка');
            }
        } catch (e) { alert('Ошибка сети'); }
    };

    const handleSaveNdviApiKey = async () => {
        try {
            const response = await fetch('/api/user/update-ndvi-api-key', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(userId!, 10), ndviApiKey })
            });
            if (response.ok) {
                sessionStorage.setItem('ndvi_api_key', ndviApiKey);
                setIsEditingNdviApiKey(false);
                alert('NDVI ключ сохранен');
            } else {
                alert('Ошибка');
            }
        } catch (e) { alert('Ошибка сети'); }
    };

    // --- Обработчик Подписки (Только для фермеров) ---
    const toggleSubscription = async (activate: boolean) => {
        try {
            const response = await fetch(`/api/user/update-subscription-status/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: activate })
            });
            if (response.ok) {
                const result = await response.json();
                sessionStorage.setItem('userSubscriptionStatus', String(result.subscriptionStatus));
                setUser(prev => ({ ...prev, subscriptionStatus: result.subscriptionStatus }));
                alert(result.message);
            }
        } catch (e) { alert('Ошибка'); }
    };

    // --- Рендер контента вкладок ---
    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <div className="tab-content info-tab">
                        <h2>{t('profile.info.title', 'Личные данные')}</h2>
                        <div className="profile-card">
                            {/* Общие поля */}
                            <div className="field-row">
                                <span className="label">{t('profile.firstName.label', 'Имя')}:</span>
                                <span className="value">{user.firstName || '—'}</span>
                            </div>
                            <div className="field-row">
                                <span className="label">{t('profile.lastName.label', 'Фамилия')}:</span>
                                <span className="value">{user.lastName || '—'}</span>
                            </div>
                            <div className="field-row">
                                <span className="label">Email:</span>
                                <span className="value">{user.email || '—'}</span>
                            </div>
                            <div className="field-row">
                                <span className="label">{t('profile.phone.label', 'Телефон')}:</span>
                                <span className="value">{user.phone || '—'}</span>
                            </div>
                            <div className="field-row">
                                <span className="label">{t('profile.role.label', 'Роль')}:</span>
                                <span className="value badge-role">{user.role}</span>
                            </div>

                            {/* Специфичные поля ЭКСПЕРТА */}
                            {isExpert && (
                                <>
                                    <div className="field-row">
                                        <span className="label">Специализация:</span>
                                        <span className="value">{user.specialization || '—'}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="label">Опыт (лет):</span>
                                        <span className="value">{user.experienceYears || '—'}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="label">Ставка (₽/час):</span>
                                        <span className="value">{user.hourlyRate || '—'}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="label">Страна:</span>
                                        <span className="value">{user.country || '—'}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="label">Регион:</span>
                                        <span className="value">{user.region || '—'}</span>
                                    </div>
                                    <div className="field-row">
                                        <span className="label">Город:</span>
                                        <span className="value">{user.city || '—'}</span>
                                    </div>
                                </>
                            )}

                            {/* Подписка (Только для ФЕРМЕРА) */}
                            {isFarmer && (
                                <div className="field-row">
                                    <span className="label">{t('profile.subscription.label', 'Подписка')}:</span>
                                    <span className={`badge-sub ${user.subscriptionStatus ? 'active' : 'inactive'}`}>
                                        {user.subscriptionStatus ? t('profile.subscription.active', 'Активна') : t('profile.subscription.inactive', 'Неактивна')}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Кнопка подписки (Только для ФЕРМЕРА) */}
                        {isFarmer && (
                            <button
                                className={`sub-action-btn ${user.subscriptionStatus ? 'deactivate' : 'activate'}`}
                                onClick={() => toggleSubscription(!user.subscriptionStatus)}
                            >
                                {user.subscriptionStatus
                                    ? t('profile.subscription.deactivateButton', 'Отменить подписку')
                                    : t('profile.subscription.activateButton', 'Активировать подписку')}
                            </button>
                        )}
                    </div>
                );

            case 'edit':
                return (
                    <div className="tab-content edit-tab">
                        <h2>{t('profile.edit.title', 'Редактирование профиля')}</h2>
                        <form onSubmit={handleSaveProfile} className="edit-form">
                            {/* Общие поля */}
                            <div className="input-group">
                                <label>{t('profile.firstName.label', 'Имя')}:</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={editForm.first_name}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>{t('profile.lastName.label', 'Фамилия')}:</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={editForm.last_name}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editForm.email}
                                    onChange={handleEditInputChange}
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>{t('profile.phone.label', 'Телефон')}:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={editForm.phone}
                                    onChange={handleEditInputChange}
                                />
                            </div>

                            {/* Специфичные поля ЭКСПЕРТА для редактирования */}
                            {isExpert && (
                                <>
                                    <div className="input-group">
                                        <label>Специализация:</label>
                                        <input
                                            type="text"
                                            name="specialization"
                                            value={editForm.specialization}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Опыт (лет):</label>
                                        <input
                                            type="number"
                                            name="experience_years"
                                            value={editForm.experience_years}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Ставка (₽/час):</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="hourly_rate"
                                            value={editForm.hourly_rate}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Страна:</label>
                                        <input
                                            type="text"
                                            name="country"
                                            value={editForm.country}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Регион:</label>
                                        <input
                                            type="text"
                                            name="region"
                                            value={editForm.region}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Город:</label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={editForm.city}
                                            onChange={handleEditInputChange}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-actions">
                                <button type="submit" className="save-btn">{t('common.save', 'Сохранить')}</button>
                                <button type="button" className="cancel-btn" onClick={() => setActiveTab('info')}>{t('common.cancel', 'Отмена')}</button>
                            </div>
                        </form>
                    </div>
                );

            case 'keys':
                return (
                    <div className="tab-content keys-tab">
                        <h2>{t('profile.keys.title', 'Управление API ключами')}</h2>

                        {/* Основной API Key */}
                        <div className="key-section">
                            <h3>AgroMonitoring API Key</h3>
                            <div className="key-input-wrapper">
                                {isEditingApiKey ? (
                                    <input
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Введите ключ..."
                                        className="key-input"
                                    />
                                ) : (
                                    <div className="key-display">
                                        {apiKey ? '••••••••••••••••••••' : 'Ключ не установлен'}
                                    </div>
                                )}
                            </div>
                            <div className="key-actions">
                                {isEditingApiKey ? (
                                    <>
                                        <button className="btn-small save" onClick={handleSaveApiKey}>OK</button>
                                        <button className="btn-small cancel" onClick={() => setIsEditingApiKey(false)}>✕</button>
                                    </>
                                ) : (
                                    <button className="btn-small edit" onClick={() => setIsEditingApiKey(true)}>
                                        {apiKey ? 'Изменить' : 'Установить'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* NDVI API Key */}
                        <div className="key-section">
                            <h3>NDVI / PlantID API Key</h3>
                            <div className="key-input-wrapper">
                                {isEditingNdviApiKey ? (
                                    <input
                                        type="password"
                                        value={ndviApiKey}
                                        onChange={(e) => setNdviApiKey(e.target.value)}
                                        placeholder="Введите ключ..."
                                        className="key-input"
                                    />
                                ) : (
                                    <div className="key-display">
                                        {ndviApiKey ? '••••••••••••••••••••' : 'Ключ не установлен'}
                                    </div>
                                )}
                            </div>
                            <div className="key-actions">
                                {isEditingNdviApiKey ? (
                                    <>
                                        <button className="btn-small save" onClick={handleSaveNdviApiKey}>OK</button>
                                        <button className="btn-small cancel" onClick={() => setIsEditingNdviApiKey(false)}>✕</button>
                                    </>
                                ) : (
                                    <button className="btn-small edit" onClick={() => setIsEditingNdviApiKey(true)}>
                                        {ndviApiKey ? 'Изменить' : 'Установить'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="profile-layout">
            {/* Левая панель: Навигация */}
            <aside className="sidebar-profile">
                <div className="sidebar-header">
                    <button onClick={() => navigate('/')} className="btn-icon">←</button>
                    <h2>{t('profile.sidebarTitle', 'Профиль')}</h2>
                </div>

                <div className="sidebar-nav">
                    <button
                        className={`nav-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => setActiveTab('info')}
                    >
                        👤 {t('profile.nav.info', 'Мои данные')}
                    </button>
                    <button
                        className={`nav-tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                        onClick={() => setActiveTab('edit')}
                    >
                        ✏️ {t('profile.nav.edit', 'Редактировать')}
                    </button>

                    {/* Вкладка API Ключи отображается ТОЛЬКО если роль фермер */}
                    {isFarmer && (
                        <button
                            className={`nav-tab-btn ${activeTab === 'keys' ? 'active' : ''}`}
                            onClick={() => setActiveTab('keys')}
                        >
                            🔑 {t('profile.nav.keys', 'API Ключи')}
                        </button>
                    )}
                </div>

                <div className="sidebar-footer">
                    <p className="user-email-preview">{user.email}</p>
                </div>
            </aside>

            {/* Правая панель: Контент */}
            <main className="main-profile-content">
                <header className="content-header">
                    <h1>
                        {activeTab === 'info' && t('profile.header.info', 'Информация о пользователе')}
                        {activeTab === 'edit' && t('profile.header.edit', 'Настройки профиля')}
                        {activeTab === 'keys' && t('profile.header.keys', 'Интеграции и ключи')}
                    </h1>
                </header>

                <div className="scroll-area">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;