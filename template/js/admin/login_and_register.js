 // API Configuration
        import { API_BASE_URL } from '../utils/api_base_url.js';

        const { createApp } = Vue;

        createApp({
            data() {
                return {
                    isLogin: true,
                    loading: false,
                    showPassword: false,
                    showRegPassword: false,
                    errorMessage: '',
                    successMessage: '',
                    loginForm: {
                        username: '',
                        password: ''
                    },
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
                async handleLogin() {
                    this.loading = true;
                    this.errorMessage = '';
                    this.successMessage = '';

                    try {
                        const response = await axios.post(`${API_BASE_URL}admin/login`, this.loginForm, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.data) {
                            this.successMessage = `Welcome back, ${response.data.username}!`;

                            // Store admin data in localStorage
                            localStorage.setItem('adminData', JSON.stringify(response.data));

                            // Redirect to dashboard after 2 seconds
                            setTimeout(() => {
                                window.location.href = '/yayasan_bambu_dss/template/admin/dashboard.html';
                            }, 2000);
                        }
                    } catch (error) {
                        if (error.response) {
                            this.errorMessage = error.response.data.detail || 'Login failed';
                        } else {
                            this.errorMessage = 'Network error. Please check your connection.';
                        }
                    } finally {
                        this.loading = false;
                    }
                },

                async handleRegister() {
                    this.loading = true;
                    this.errorMessage = '';
                    this.successMessage = '';

                    try {
                        const response = await axios.post(`${API_BASE_URL}admin/register`, this.registerForm, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        if (response.data) {
                            this.successMessage = `Account created successfully for ${response.data.username}! You can now login.`;

                            // Clear form
                            this.registerForm = {
                                username: '',
                                email: '',
                                full_name: '',
                                password: '',
                                is_active: true
                            };

                            // Switch to login form after 2 seconds
                            setTimeout(() => {
                                this.isLogin = true;
                            }, 2000);
                        }
                    } catch (error) {
                        if (error.response) {
                            this.errorMessage = error.response.data.detail || 'Registration failed';
                        } else {
                            this.errorMessage = 'Network error. Please check your connection.';
                        }
                    } finally {
                        this.loading = false;
                    }
                },

                clearMessages() {
                    this.errorMessage = '';
                    this.successMessage = '';
                }
            },
            watch: {
                isLogin() {
                    this.clearMessages();
                }
            }
        }).mount('#app');