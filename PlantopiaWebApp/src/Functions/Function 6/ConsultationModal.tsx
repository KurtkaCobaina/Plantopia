import React, { useState } from 'react';
import './ConsultationModal.css';

interface ConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    expertId: number;
    expertName: string;
    hourlyRate: number;
    userId: number | null;
}

const ConsultationModal: React.FC<ConsultationModalProps> = ({
                                                                 isOpen,
                                                                 onClose,
                                                                 expertId,
                                                                 expertName,
                                                                 hourlyRate,
                                                                 userId
                                                             }) => {
    const [hours, setHours] = useState<number>(1);
    const [country, setCountry] = useState('');
    const [region, setRegion] = useState('');
    const [city, setCity] = useState('');
    const [streetAddress, setStreetAddress] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const totalPrice = hours * hourlyRate;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!userId) {
            setError('Пользователь не авторизован');
            setIsLoading(false);
            return;
        }

        try {
            // Отправляем данные на API
            // Поле createdAt НЕ отправляется, так как оно устанавливается на сервере (DateTime.UtcNow)
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    expertId: expertId,
                    price: totalPrice,
                    country: country,
                    region: region,
                    city: city,
                    streetAddress: streetAddress,
                    scheduledDate: scheduledDate,
                    hours: hours, // Важно для проверки лимита 5 часов на бэкенде
                    status: 'pending' // Статус "Ждет подтверждения эксперта"
                    // createdAt будет установлен автоматически в БД/Моделе
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Если бэкенд вернул ошибку (например, превышен лимит часов или неверные данные)
                throw new Error(data.message || 'Ошибка при создании заявки');
            }

            alert(`Заявка на консультацию с ${expertName} успешно отправлена!\nСтатус: Ожидает подтверждения.\nСумма: ${totalPrice} ₽`);
            onClose();

            // Сброс формы
            setHours(1);
            setCountry('');
            setRegion('');
            setCity('');
            setStreetAddress('');
            setScheduledDate('');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка сети');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Запись к эксперту</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="expert-summary">
                    <p><strong>Эксперт:</strong> {expertName}</p>
                    <p><strong>Ставка:</strong> {hourlyRate} ₽/час</p>
                </div>

                <form onSubmit={handleSubmit} className="consultation-form">
                    <div className="form-group">
                        <label>Количество часов</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={hours}
                            onChange={(e) => setHours(Number(e.target.value))}
                            required
                        />
                        <span className="price-preview">Итого: {totalPrice} ₽</span>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>Страна</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="Россия"
                                required
                            />
                        </div>
                        <div className="form-group half">
                            <label>Район / Область</label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                placeholder="Московская обл."
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Город</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Москва"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Адрес (улица, дом)</label>
                        <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="ул. Ленина, д. 1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Дата и время консультации</label>
                        <input
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Отправка...' : 'Подтвердить запись'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConsultationModal;