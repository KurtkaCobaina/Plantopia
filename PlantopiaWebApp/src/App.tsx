import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './AuthContext';
import Header from './Components/Header.tsx';
import { I18nProvider } from './I18nContext';
import MainPage from './Pages/MainPage/MainPage.tsx';
import PlantDiagnosis from './Functions/Function 1/PlantDiagnosis';
import ProfilePage from './Pages/ProfilePage/ProfilePage';
import EditProfilePage from "./Pages/EditProfilePage/EditProfilePage.tsx";
import SavedDataPage from "./Pages/SavedDataPage/SavedDataPage.tsx";
import DiagnosesListPage from './Pages/DiagnosesListPage/DiagnosesListPage.tsx';
import FertilizerCalculationsPage from './Pages/FertilizerCalculationsPage/FertilizerCalculationsPage.tsx';
import NdviMapsPage from './Pages/NdviMapsPage/NdviMapsPage.tsx';
import LoginPage from './Pages/LoginPage/LoginPage.tsx';
import RegisterPage from './Pages/RegisterPage/RegisterPage.tsx';
import ForgotPasswordPage from './Pages/ForgotPasswordPage/ForgotPasswordPage.tsx';
import TasksListPage from './Functions/Function 7/TasksListPage';
import CreateTaskPage from './Functions/Function 7/CreateTaskPage';
import NDVIPage from "./Functions/Function 6/NDVIPage";
import FertilizerCalculatorPage from "./Functions/Function 2/FertilizerCalculatorPage";
import WeatherMapPage from "./Functions/Function 3/WeatherMapPage.tsx";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

function AppContent() {
    const { isAuthenticated, refresh } = useAuth();

    const handleLogout = () => {
        const keys = [
            'authToken', 'sessionId', 'userId', 'userEmail', 'userFirstName', 'userLastName', 'userRole' ,'userPhone', 'userSubscriptionStatus', 'apiKey', 'bis_data' , 'ndvi_api_key', 'language'
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
                <Route path="/" element={
                    <ProtectedRoute>
                        <MainPage />
                    </ProtectedRoute>
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

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />

                <Route path="/saved" element={
                    <ProtectedRoute>
                        <SavedDataPage />
                    </ProtectedRoute>
                } />

                <Route path="/calculator" element={
                    <ProtectedRoute>
                        <FertilizerCalculatorPage />
                    </ProtectedRoute>
                } />
                <Route path="/plant-diagnosis" element={
                    <ProtectedRoute>
                        <PlantDiagnosis />
                    </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                    <ProtectedRoute>
                        <TasksListPage />
                    </ProtectedRoute>
                } />
                <Route path="/agro-weather" element={
                    <ProtectedRoute>
                        <WeatherMapPage />
                    </ProtectedRoute>
                } />
                <Route path="/calendar/create" element={
                    <ProtectedRoute>
                        <CreateTaskPage />
                    </ProtectedRoute>
                } />
                <Route path="/ndvi-maps" element={
                    <ProtectedRoute>
                        <NDVIPage />
                    </ProtectedRoute>
                } />
                <Route path="/profile/edit" element={
                    <ProtectedRoute>
                        <EditProfilePage />
                    </ProtectedRoute>
                } />

                <Route path="/saved/plant-diagnosis" element={
                    <ProtectedRoute>
                        <DiagnosesListPage />
                    </ProtectedRoute>
                } />

                <Route path="/saved/calculations" element={
                    <ProtectedRoute>
                        <FertilizerCalculationsPage />
                    </ProtectedRoute>
                } />

                <Route path="/saved/ndvi-maps" element={
                    <ProtectedRoute>
                        <NdviMapsPage />
                    </ProtectedRoute>
                } />

                <Route path="*" element={
                    <Navigate to={isAuthenticated() ? "/" : "/login"} replace />
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