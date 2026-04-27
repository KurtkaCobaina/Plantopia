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

// Auth Pages
import LoginPage from './Pages/LoginPage/LoginPage.tsx';
import RegisterPage from './Pages/RegisterPages/RegisterPage.tsx';
import ExpertRegistPage from './Pages/RegisterPages/ExpertRegistPage.tsx';
import ForgotPasswordPage from './Pages/ForgotPasswordPages/ForgotPasswordPage.tsx';
// ИМПОРТ НОВОЙ СТРАНИЦЫ ВОССТАНОВЛЕНИЯ ПАРОЛЯ ЭКСПЕРТА
import ExpertForgotPasswordPage from './Pages/ForgotPasswordPages/ExpertForgotPasswordPage.tsx';

// Functions / Features
import TasksListPage from './Functions/Function 5/TasksListPage';
import CreateTaskPage from './Functions/Function 5/CreateTaskPage';
import NDVIPage from "./Functions/Function 4/NDVIPage";
import FertilizerCalculatorPage from "./Functions/Function 2/FertilizerCalculatorPage";
import WeatherMapPage from "./Functions/Function 3/WeatherMapPage.tsx";
import ExpertsListPage from "./Functions/Function 6/ExpertsListPage.tsx";

// --- КОМПОНЕНТЫ ЗАЩИТЫ ПО РОЛЯМ ---
// ... (код FarmerOnlyRoute, ExpertOnlyRoute, PublicRoute, ProtectedRoute остается без изменений) ...

const FarmerOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const userRole = sessionStorage.getItem('userRole');
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (userRole === 'expert') return <Navigate to="/expert-dashboard" replace />;
    return <>{children}</>;
};

const ExpertOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    const userRole = sessionStorage.getItem('userRole');
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (userRole !== 'expert') return <Navigate to="/" replace />;
    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated()) {
        const userRole = sessionStorage.getItem('userRole');
        return <Navigate to={userRole === 'expert' ? "/expert-dashboard" : "/"} replace />;
    }
    return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

function AppContent() {
    const { isAuthenticated, refresh } = useAuth();

    const handleLogout = () => {
        const keys = [
            'authToken', 'sessionId', 'userId', 'userEmail', 'userFirstName', 'userLastName', 'userRole',
            'userPhone', 'userSubscriptionStatus', 'apiKey', 'bis_data', 'ndvi_api_key', 'language',
            'expertSpecialization', 'expertExperienceYears', 'expertHourlyRate', 'expertCountry', 'expertRegion', 'expertCity'
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
                <Route path="/" element={<FarmerOnlyRoute><MainPage /></FarmerOnlyRoute>} />
                <Route path="/expert-dashboard" element={<ExpertOnlyRoute><ExpertDashboardPage /></ExpertOnlyRoute>} />

                <Route path="/login" element={<PublicRoute><LoginPage onLoginSuccess={refresh} /></PublicRoute>} />

                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                <Route path="/register-expert" element={<PublicRoute><ExpertRegistPage /></PublicRoute>} />

                <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />

                {/* НОВЫЙ МАРШРУТ ДЛЯ ВОССТАНОВЛЕНИЯ ПАРОЛЯ ЭКСПЕРТА */}
                <Route path="/forgot-password-expert" element={<PublicRoute><ExpertForgotPasswordPage /></PublicRoute>} />

                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/saved" element={<ProtectedRoute><SavedDataPage /></ProtectedRoute>} />
                <Route path="/calculator" element={<ProtectedRoute><FertilizerCalculatorPage /></ProtectedRoute>} />
                <Route path="/plant-diagnosis" element={<ProtectedRoute><PlantDiagnosis /></ProtectedRoute>} />
                <Route path="/calendar" element={<ProtectedRoute><TasksListPage /></ProtectedRoute>} />
                <Route path="/agro-weather" element={<ProtectedRoute><WeatherMapPage /></ProtectedRoute>} />
                <Route path="/calendar/create" element={<ProtectedRoute><CreateTaskPage /></ProtectedRoute>} />
                <Route path="/ndvi-maps" element={<ProtectedRoute><NDVIPage /></ProtectedRoute>} />
                <Route path="/experts-marketplace" element={<ProtectedRoute><ExpertsListPage /></ProtectedRoute>} />

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