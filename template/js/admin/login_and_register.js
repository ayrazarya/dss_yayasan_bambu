// Import konfigurasi API
import { API_BASE_URL } from '../utils/api_base_url.js';

const { createApp } = Vue;

createApp({
    data() {
        return {
            // State untuk toggle antara login dan register
            isLogin: true,

            // State untuk loading indicator
            loading: false,

            // State untuk toggle visibility password
            showPassword: false,
            showRegPassword: false,

            // State untuk pesan error dan success
            errorMessage: '',
            successMessage: '',

            // Form data untuk login
            loginForm: {
                username: '',
                password: ''
            },

            // Form data untuk register
            registerForm: {
                username: '',
                email: '',
                full_name: '',
                password: '',
                is_active: true
            }
        }
    },

    methods: {
        /**
         * Handle proses login admin
         */
        async handleLogin() {
            // Set loading state dan clear messages
            this.loading = true;
            this.clearMessages();

            try {
                // Kirim request login ke API
                const response = await axios.post(
                    `${API_BASE_URL}admin/login`,
                    this.loginForm,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000 // 10 detik timeout
                    }
                );

                // Cek apakah response berhasil dan ada access token
                if (response.data && response.data.access_token) {
                    // Tampilkan pesan sukses
                    this.successMessage = `Selamat datang, ${response.data.admin.username}!`;

                    // Simpan token dan data admin ke localStorage
                    localStorage.setItem('adminToken', response.data.access_token);
                    localStorage.setItem('adminData', JSON.stringify(response.data.admin));

                    // Redirect ke dashboard setelah 2 detik
                    setTimeout(() => {
                        window.location.href = '/template/admin/dashboard.html';
                    }, 2000);
                } else {
                    throw new Error('Invalid response format');
                }

            } catch (error) {
                // Handle berbagai jenis error
                this.handleError(error, 'Login gagal');
            } finally {
                // Reset loading state
                this.loading = false;
            }
        },

        /**
         * Handle proses registrasi admin baru
         */
        async handleRegister() {
            // Set loading state dan clear messages
            this.loading = true;
            this.clearMessages();

            try {
                // Validasi form sebelum submit
                if (!this.validateRegisterForm()) {
                    return;
                }

                // Kirim request register ke API
                const response = await axios.post(
                    `${API_BASE_URL}admin/register`,
                    this.registerForm,
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000 // 10 detik timeout
                    }
                );

                // Cek apakah registrasi berhasil
                if (response.data && response.data.username) {
                    // Tampilkan pesan sukses
                    this.successMessage = `Akun berhasil dibuat untuk ${response.data.username}! Silakan login.`;

                    // Reset form register
                    this.resetRegisterForm();

                    // Switch ke form login setelah 2 detik
                    setTimeout(() => {
                        this.isLogin = true;
                    }, 2000);
                } else {
                    throw new Error('Invalid response format');
                }

            } catch (error) {
                // Handle berbagai jenis error
                this.handleError(error, 'Registrasi gagal');
            } finally {
                // Reset loading state
                this.loading = false;
            }
        },

        /**
         * Validasi form register
         */
        validateRegisterForm() {
            const { username, email, full_name, password } = this.registerForm;

            if (!username.trim()) {
                this.errorMessage = 'Username tidak boleh kosong';
                return false;
            }

            if (!email.trim() || !this.isValidEmail(email)) {
                this.errorMessage = 'Email tidak valid';
                return false;
            }

            if (!full_name.trim()) {
                this.errorMessage = 'Nama lengkap tidak boleh kosong';
                return false;
            }

            if (!password || password.length < 6) {
                this.errorMessage = 'Password minimal 6 karakter';
                return false;
            }

            return true;
        },

        /**
         * Validasi format email
         */
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        },

        /**
         * Handle error dengan berbagai skenario
         */
        handleError(error, defaultMessage) {
            if (error.response) {
                // Server responded with error status
                const status = error.response.status;
                const data = error.response.data;

                if (status === 400) {
                    this.errorMessage = data.detail || 'Data yang dikirim tidak valid';
                } else if (status === 401) {
                    this.errorMessage = 'Username atau password salah';
                } else if (status === 403) {
                    this.errorMessage = 'Akses ditolak';
                } else if (status === 409) {
                    this.errorMessage = 'Username atau email sudah terdaftar';
                } else if (status >= 500) {
                    this.errorMessage = 'Terjadi kesalahan server. Silakan coba lagi nanti.';
                } else {
                    this.errorMessage = data.detail || defaultMessage;
                }
            } else if (error.request) {
                // Request was made but no response received
                this.errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
            } else if (error.code === 'ECONNABORTED') {
                // Request timeout
                this.errorMessage = 'Request timeout. Silakan coba lagi.';
            } else {
                // Something else happened
                this.errorMessage = error.message || defaultMessage;
            }
        },

        /**
         * Reset form register ke state awal
         */
        resetRegisterForm() {
            this.registerForm = {
                username: '',
                email: '',
                full_name: '',
                password: '',
                is_active: true
            };
        },

        /**
         * Clear semua pesan error dan success
         */
        clearMessages() {
            this.errorMessage = '';
            this.successMessage = '';
        },

        /**
         * Toggle visibility password
         */
        togglePasswordVisibility() {
            this.showPassword = !this.showPassword;
        },

        /**
         * Toggle visibility password register
         */
        toggleRegPasswordVisibility() {
            this.showRegPassword = !this.showRegPassword;
        }
    },

    watch: {
        // Clear messages ketika switch antara login dan register
        isLogin() {
            this.clearMessages();
        }
    },

    mounted() {
        // Cek apakah user sudah login sebelumnya
        const token = localStorage.getItem('adminToken');
        if (token) {
            // Bisa redirect langsung ke dashboard atau verify token
            console.log('User already has token');
        }
    }
}).mount('#app');