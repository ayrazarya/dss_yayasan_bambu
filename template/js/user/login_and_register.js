import { API_BASE_URL } from '../utils/api_base_url.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            activeTab: 'login',
            loading: false,
            loadingText: '',
            showLoginPassword: false,
            showRegisterPassword: false,
            showModal: false,
            modalType: 'success',
            modalTitle: '',
            modalMessage: '',

            loginForm: {
                email: '',
                password: '',
                rememberMe: false
            },
            registerForm: {
                username: '',
                email: '',
                full_name: '',
                role: 'decision maker',
                password: '',
                agreeToTerms: false
            },
            errors: {},

            // Axios instance
            axiosInstance: null
        }
    },

    created() {
        this.initializeAxios();
    },

    methods: {
        initializeAxios() {
            // Buat instance Axios
            this.axiosInstance = axios.create({
                baseURL: API_BASE_URL,
                timeout: 15000, // 15 detik timeout
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Request interceptor
            this.axiosInstance.interceptors.request.use(
                (config) => {
                    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);

                    // Tambahkan token jika ada
                    const token = this.getStoredToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }

                    return config;
                },
                (error) => {
                    console.error('Request interceptor error:', error);
                    return Promise.reject(error);
                }
            );

            // Response interceptor
            this.axiosInstance.interceptors.response.use(
                (response) => {
                    return response;
                },
                (error) => {
                    let errorMessage = 'Terjadi kesalahan pada server';

                    if (error.response) {
                        // Server merespons dengan error status
                        const status = error.response.status;
                        const data = error.response.data;

                        switch (status) {
                            case 400:
                                errorMessage = data?.detail || 'Data yang dikirim tidak valid';
                                break;
                            case 401:
                                errorMessage = 'Email atau password salah';
                                // Hapus token yang tidak valid
                                this.clearStoredAuth();
                                break;
                            case 403:
                                errorMessage = 'Akses ditolak';
                                break;
                            case 404:
                                errorMessage = 'Akun tidak ditemukan';
                                break;
                            case 422:
                                errorMessage = data?.detail || 'Data validasi gagal';
                                break;
                            case 500:
                                errorMessage = 'Kesalahan server internal';
                                break;
                            default:
                                errorMessage = data?.detail || data?.message || `Error: ${status}`;
                        }
                    } else if (error.request) {
                        // Request dibuat tapi tidak ada response
                        if (error.code === 'ECONNABORTED') {
                            errorMessage = 'Request timeout. Periksa koneksi internet Anda.';
                        } else {
                            errorMessage = 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.';
                        }
                    } else {
                        // Error lainnya
                        errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui';
                    }

                    console.error('Axios Response Error:', error);

                    // Buat error object dengan pesan yang sudah diformat
                    const formattedError = new Error(errorMessage);
                    formattedError.originalError = error;
                    formattedError.status = error.response?.status;

                    return Promise.reject(formattedError);
                }
            );
        },

        getStoredToken() {
            return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
        },

        getStoredUserData() {
            const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (userData) {
                try {
                    return JSON.parse(userData);
                } catch (error) {
                    console.error('Gagal parse userData:', error);
                    this.clearStoredAuth();
                    return null;
                }
            }
            return null;
        },

        clearStoredAuth() {
            localStorage.removeItem('access_token');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('userData');
        },

        validateLogin() {
            this.errors = {};
            let isValid = true;

            if (!this.loginForm.email) {
                this.errors.loginEmail = 'Email wajib diisi';
                isValid = false;
            } else if (!this.isValidEmail(this.loginForm.email)) {
                this.errors.loginEmail = 'Format email tidak valid';
                isValid = false;
            }

            if (!this.loginForm.password) {
                this.errors.loginPassword = 'Password wajib diisi';
                isValid = false;
            } else if (this.loginForm.password.length < 6) {
                this.errors.loginPassword = 'Password minimal 6 karakter';
                isValid = false;
            }

            return isValid;
        },

        validateRegister() {
            this.errors = {};
            let isValid = true;

            if (!this.registerForm.username) {
                this.errors.username = 'Username wajib diisi';
                isValid = false;
            } else if (this.registerForm.username.length < 3) {
                this.errors.username = 'Username minimal 3 karakter';
                isValid = false;
            }

            if (!this.registerForm.email) {
                this.errors.email = 'Email wajib diisi';
                isValid = false;
            } else if (!this.isValidEmail(this.registerForm.email)) {
                this.errors.email = 'Format email tidak valid';
                isValid = false;
            }

            if (!this.registerForm.password) {
                this.errors.password = 'Password wajib diisi';
                isValid = false;
            } else if (this.registerForm.password.length < 6) {
                this.errors.password = 'Password minimal 6 karakter';
                isValid = false;
            }

            if (!this.registerForm.agreeToTerms) {
                this.errors.agreeToTerms = 'Anda harus menyetujui syarat dan ketentuan';
                isValid = false;
            }

            return isValid;
        },

        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        async handleLogin() {
            if (!this.validateLogin()) return;

            this.loading = true;
            this.loadingText = 'Memverifikasi akun...';

            try {
                const response = await this.axiosInstance.post('users/login', {
                    email: this.loginForm.email,
                    password: this.loginForm.password
                });

                // Simpan access_token dan user info
                const token = response.data.access_token;
                const user = response.data;

                if (this.loginForm.rememberMe) {
                    localStorage.setItem('access_token', token);
                    localStorage.setItem('userData', JSON.stringify(user));
                } else {
                    sessionStorage.setItem('access_token', token);
                    sessionStorage.setItem('userData', JSON.stringify(user));
                }

                this.showSuccessModal('Login Berhasil!',
                    `Selamat datang, ${user.full_name || user.username}! Anda berhasil masuk ke sistem DSS.`);

                // Reset form
                this.loginForm = {
                    email: '',
                    password: '',
                    rememberMe: false
                };

                // Redirect ke halaman utama
                setTimeout(() => {
                    window.location.href = '/yayasan_bambu_dss/template/user/index.html';
                }, 2000);

            } catch (error) {
                console.error('Login error:', error);
                this.showErrorModal('Login Gagal', error.message);
            } finally {
                this.loading = false;
            }
        },

        async handleRegister() {
            if (!this.validateRegister()) return;

            this.loading = true;
            this.loadingText = 'Membuat akun baru...';

            try {
                const response = await this.axiosInstance.post('users/', {
                    username: this.registerForm.username,
                    email: this.registerForm.email,
                    full_name: this.registerForm.full_name || null,
                    role: this.registerForm.role,
                    password: this.registerForm.password,
                    is_active: true
                });

                this.showSuccessModal('Registrasi Berhasil!',
                    `Selamat ${response.data.full_name || response.data.username}! Akun Anda telah berhasil dibuat. Silakan login untuk mengakses sistem DSS.`);

                // Reset form
                this.registerForm = {
                    username: '',
                    email: '',
                    full_name: '',
                    role: 'decision maker',
                    password: '',
                    agreeToTerms: false
                };

                // Switch ke tab login setelah registrasi berhasil
                setTimeout(() => {
                    this.activeTab = 'login';
                }, 2000);

            } catch (error) {
                console.error('Registration error:', error);
                this.showErrorModal('Registrasi Gagal', error.message);
            } finally {
                this.loading = false;
            }
        },

        showSuccessModal(title, message) {
            this.modalType = 'success';
            this.modalTitle = title;
            this.modalMessage = message;
            this.showModal = true;
        },

        showErrorModal(title, message) {
            this.modalType = 'error';
            this.modalTitle = title;
            this.modalMessage = message;
            this.showModal = true;
        },

        closeModal() {
            this.showModal = false;
        },

        logout() {
            this.clearStoredAuth();
            window.location.href = '/yayasan_bambu_dss/template/user/user_login_register.html'; // atau halaman login kamu
        },

        // Method untuk cek status login
        checkAuthStatus() {
            const token = this.getStoredToken();
            const userData = this.getStoredUserData();

            if (token && userData) {
                console.log('User sudah login:', userData);
                return true;
            }
            return false;
        }
    },

    mounted() {
        // Cek status login saat komponen dimount
        this.checkAuthStatus();

        // Event listener untuk Enter key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.loading) {
                if (this.activeTab === 'login') {
                    this.handleLogin();
                } else {
                    this.handleRegister();
                }
            }
        });

        console.log('API Base URL:', API_BASE_URL);
    },

    beforeUnmount() {
        // Cleanup event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
    }
}).mount('#app');