import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    refresh: () => void;
    isAuthenticated: () => boolean; // ← now a function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // @ts-ignore
    const [tick, setTick] = useState(0);

    const isAuthenticated = () => {
        const keys = ['authToken', 'sessionId', 'userId'];
        return keys.some(key =>
            localStorage.getItem(key) !== null ||
            sessionStorage.getItem(key) !== null
        );
    };

    const refresh = () => {
        setTick(prev => prev + 1);
    };

    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            const authKeys = ['authToken', 'sessionId', 'userId', 'userEmail', 'userFirstName', 'userLastName', 'userRole'];
            if (authKeys.includes(e.key || '')) {
                refresh();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // @ts-ignore

    return (
        <AuthContext.Provider value={{ refresh, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};