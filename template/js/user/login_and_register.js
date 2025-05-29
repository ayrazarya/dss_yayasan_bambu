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
              errors: {}
          }
      },
      methods: {
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
                  const response = await axios.post(`${API_BASE_URL}users/login`, { // Changed here
                      email: this.loginForm.email,
                      password: this.loginForm.password
                  });

                  // Simpan data user ke localStorage jika remember me dicentang
                  if (this.loginForm.rememberMe) {
                      localStorage.setItem('userData', JSON.stringify(response.data));
                  } else {
                      sessionStorage.setItem('userData', JSON.stringify(response.data));
                  }

                  this.showSuccessModal('Login Berhasil!',
                      `Selamat datang, ${response.data.full_name || response.data.username}! Anda berhasil masuk ke sistem DSS.`);

                  // Reset form
                  this.loginForm = {
                      email: '',
                      password: '',
                      rememberMe: false
                  };

                  // Redirect ke dashboard setelah 2 detik
                  setTimeout(() => {
                      // window.location.href = '/dashboard';
                      window.location.href = '/yayasan_bambu_dss/template/user/index.html'; // Ganti dengan URL dashboard('Redirect to dashboard');
                  }, 2000);

              } catch (error) {
                  console.error('Login error:', error);

                  let errorMessage = 'Terjadi kesalahan saat login';
                  if (error.response?.status === 401) {
                      errorMessage = 'Email atau password salah';
                  } else if (error.response?.status === 404) {
                      errorMessage = 'Akun tidak ditemukan';
                  } else if (error.response?.data?.detail) {
                      errorMessage = error.response.data.detail;
                  }

                  this.showErrorModal('Login Gagal', errorMessage);
              } finally {
                  this.loading = false;
              }
          },

          async handleRegister() {
              if (!this.validateRegister()) return;

              this.loading = true;
              this.loadingText = 'Membuat akun baru...';

              try {
                  const response = await axios.post(`${API_BASE_URL}users/`, { // Changed here
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

                  // Pindah ke tab login setelah 2 detik
                  setTimeout(() => {
                      this.activeTab = 'login';
                  }, 2000);

              } catch (error) {
                  console.error('Registration error:', error);

                  let errorMessage = 'Terjadi kesalahan saat membuat akun';
                  if (error.response?.status === 400) {
                      errorMessage = 'Data yang dimasukkan tidak valid atau email sudah terdaftar';
                  } else if (error.response?.data?.detail) {
                      errorMessage = error.response.data.detail;
                  }

                  this.showErrorModal('Registrasi Gagal', errorMessage);
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
      },


      mounted() {
          // Check if user is already logged in
          const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
          if (userData) {
              try {
                  const user = JSON.parse(userData);
                  console.log('User already logged in:', user);
              } catch (error) {
                  console.error('Error parsing stored user data:', error);
                  localStorage.removeItem('userData');
                  sessionStorage.removeItem('userData');
              }
          }

          // Add keyboard event listeners for better UX
          document.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' && !this.loading) {
                  if (this.activeTab === 'login') {
                      this.handleLogin();
                  } else {
                      this.handleRegister();
                  }
              }
          });
      }
  }).mount('#app');