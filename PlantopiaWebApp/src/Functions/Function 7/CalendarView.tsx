import React, { useState, useMemo } from 'react';
import './CalendarView.css';
import { type Task } from '../../Interfaces/Task.ts';

interface CalendarViewProps {
    tasks: Task[];
    onDateClick: (date: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Вычисляем дни с задачами заранее, чтобы не делать это при каждом рендере ячейки
    const daysWithTasks = useMemo(() => {
        const taskDays = new Set<string>();
        tasks.forEach(task => {
            if (task.dueDate) {
                const d = new Date(task.dueDate);
                // Проверяем, относится ли задача к текущему отображаемому месяцу
                if (d.getFullYear() === year && d.getMonth() === month) {
                    const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    taskDays.add(dayStr);
                }
            }
        });
        return taskDays;
    }, [tasks, year, month]);

    const getDaysInMonth = () => new Date(year, month + 1, 0).getDate();

    const getFirstDayOfMonth = () => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const daysInMonth = getDaysInMonth();
    const firstDayIndex = getFirstDayOfMonth();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthNames = [
        "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
        "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];

    const handleDayClick = (day: number) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onDateClick(dateStr);
    };

    const renderCalendarDays = () => {
        const days = [];
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasTask = daysWithTasks.has(dateStr);

            const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isToday ? 'today' : ''} ${hasTask ? 'has-task' : ''}`}
                    onClick={() => handleDayClick(day)}
                >
                    <span className="day-number">{day}</span>
                    {hasTask && <span className="task-dot"></span>}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button onClick={prevMonth} className="nav-btn">&lt;</button>
                <h3>{monthNames[month]} {year}</h3>
                <button onClick={nextMonth} className="nav-btn">&gt;</button>
            </div>
            <div className="calendar-weekdays">
                <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
            </div>
            <div className="calendar-grid">
                {renderCalendarDays()}
            </div>
        </div>
    );
};

export default CalendarView;