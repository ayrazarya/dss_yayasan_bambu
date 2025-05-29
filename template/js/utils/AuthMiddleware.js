// auth-middleware.js
import { TokenManager, ApiService } from './login_and_register.js';

class AuthMiddleware {
    static async checkAuth() {
        const token = TokenManager.getToken();

        if (!token) {
            this.redirectToLogin();
            return false;
        }

        try {
            // Verify token with server
            const response = await ApiService.getProfile();

            if (response.data) {
                // Update admin data
                window.adminData = response.data;
                return true;
            } else {
                this.redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Auth verification failed:', error);
            TokenManager.removeToken();
            this.redirectToLogin();
            return false;
        }
    }

    static redirectToLogin() {
        const currentPath = window.location.pathname;
        if (!currentPath.includes('login.html')) {
            window.location.href = '/yayasan_bambu_dss/template/admin/login.html';
        }
    }

    static async requireAuth() {
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            throw new Error('Authentication required');
        }
        return true;
    }

    static getAuthHeaders() {
        const token = TokenManager.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    static logout() {
        TokenManager.removeToken();
        delete window.adminData;
        this.redirectToLogin();
    }
}

// Auto-check authentication on page load for protected pages
document.addEventListener('DOMContentLoaded', () => {
    const protectedPaths = ['/dashboard', '/admin'];
    const currentPath = window.location.pathname;

    const isProtectedPage = protectedPaths.some(path =>
        currentPath.includes(path) && !currentPath.includes('login')
    );

    if (isProtectedPage) {
        AuthMiddleware.checkAuth();
    }
});

export default AuthMiddleware;