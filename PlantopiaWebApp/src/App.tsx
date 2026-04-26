import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Header from './Components/Header.tsx';
import { I18nProvider } from './I18nContext';

// Pages
import MainPage from './Pages/MainPage/MainPage.tsx';
import ExpertDashboardPage from './Pages/ExpertDashboard/ExpertDashboardPage.tsx';
import PlantDiagnosis from './Functions/Function 1/PlantDiagnosis';
import ProfilePage from './Pages/ProfilePage/ProfilePage';

import SavedDataPage from "./Pages/SavedDataPage/SavedDataPage.tsx";

import LoginPage from './Pages/LoginPage/LoginPage.tsx';
import RegisterPage from './Pages/RegisterPage/RegisterPage.tsx';
import ForgotPasswordPage from './Pages/ForgotPasswordPage/ForgotPasswordPage.tsx';
import TasksListPage from './Functions/Function 5/TasksListPage';
import CreateTaskPage from './Functions/Function 5/CreateTaskPage';
import NDVIPage from "./Functions/Function 4/NDVIPage";
import FertilizerCalculatorPage from "./Functions/Function 2/FertilizerCalculatorPage";
import WeatherMapPage from "./Functions/Function 3/WeatherMapPage.tsx";
import ExpertsListPage from "./Functions/Function 6/ExpertsListPage.tsx";

// --- КОМПОНЕНТЫ ЗАЩИТЫ ПО РОЛЯМ ---

const FarmerOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const userRole = sessionStorage.getItem('userRole');

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Если пользователь авторизован, но он ЭКСПЕРТ, кидаем его на дашборд эксперта
    if (userRole === 'expert') {
        return <Navigate to="/expert-dashboard" replace />;
    }

    return <>{children}</>;
};

const ExpertOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const userRole = sessionStorage.getItem('userRole');

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Если пользователь авторизован, но он НЕ эксперт, кидаем его на главную
    if (userRole !== 'expert') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated()) {
        // Если уже авторизован, редиректим в зависимости от роли
        const userRole = sessionStorage.getItem('userRole');
        return <Navigate to={userRole === 'expert' ? "/expert-dashboard" : "/"} replace />;
    }
    return <>{children}</>;
};

function AppContent() {
    const { isAuthenticated, refresh } = useAuth();

    const handleLogout = () => {
        const keys = [
            'authToken',
            'sessionId',
            'userId',
            'userEmail',
            'userFirstName',
            'userLastName',
            'userRole',
            'userPhone',
            'userSubscriptionStatus',
            'apiKey',
            'bis_data',
            'ndvi_api_key',
            'language',
            // --- НОВЫЕ КЛЮЧИ ЭКСПЕРТА ---
            'expertSpecialization',
            'expertExperienceYears',
            'expertHourlyRate',
            'expertCountry',
            'expertRegion',
            'expertCity'
            // -----------------------------
        ];

        keys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        refresh();
        window.location.href = '/login';
    };
    return (
        <Router>
            {isAuthenticated() && <Header onLogout={handleLogout} />}
            <Routes>
                {/* Главная страница ТОЛЬКО для ФЕРМЕРОВ */}
                <Route path="/" element={
                    <FarmerOnlyRoute>
                        <MainPage />
                    </FarmerOnlyRoute>
                } />

                {/* Дашборд ТОЛЬКО для ЭКСПЕРТОВ */}
                <Route path="/expert-dashboard" element={
                    <ExpertOnlyRoute>
                        <ExpertDashboardPage />
                    </ExpertOnlyRoute>
                } />

                <Route path="/login" element={
                    <PublicRoute>
                        <LoginPage onLoginSuccess={refresh} />
                    </PublicRoute>
                } />

                <Route path="/register" element={
                    <PublicRoute>
                        <RegisterPage />
                    </PublicRoute>
                } />

                <Route path="/forgot-password" element={
                    <PublicRoute>
                        <ForgotPasswordPage />
                    </PublicRoute>
                } />

                {/* Остальные защищенные маршруты (доступны всем авторизованным, но лучше добавить проверки ролей при необходимости) */}
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedDataPage /></ProtectedRoute>} />
                <Route path="/calculator" element={<ProtectedRoute><FertilizerCalculatorPage /></ProtectedRoute>} />
                <Route path="/plant-diagnosis" element={<ProtectedRoute><PlantDiagnosis /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><TasksListPage /></ProtectedRoute>} />
                <Route path="/agro-weather" element={<ProtectedRoute><WeatherMapPage /></ProtectedRoute>} />
                <Route path="/calendar/create" element={<ProtectedRoute><CreateTaskPage /></ProtectedRoute>} />
                <Route path="/ndvi-maps" element={<ProtectedRoute><NDVIPage /></ProtectedRoute>} />
                <Route path="/experts-marketplace" element={<ProtectedRoute><ExpertsListPage /></ProtectedRoute>} />



                {/* Catch-all: перенаправление в зависимости от роли */}
                <Route path="*" element={
                    <Navigate to={
                        isAuthenticated()
                            ? (sessionStorage.getItem('userRole') === 'expert' ? "/expert-dashboard" : "/")
                            : "/login"
                    } replace />
                } />
            </Routes>
        </Router>
    );
}

// Вспомогательный компонент для общей защиты (если не нужна проверка роли)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
    return (
        <AuthProvider>
            <I18nProvider>
                <AppContent />
            </I18nProvider>
        </AuthProvider>
    );
}

export default App;