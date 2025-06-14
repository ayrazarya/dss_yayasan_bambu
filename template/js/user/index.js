import { API_BASE_URL } from '../utils/api_base_url.js'; // Pastikan path ini benar

const { createApp, ref, computed, watch, nextTick, onMounted } = Vue;

createApp({
    setup() {
        // Konfigurasi Axios
        const axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            timeout: 10000, // 10 detik timeout
            headers: {
                'Content-Type': 'application/json',
            }
        });
          const activeTab = ref('summary'); // 'summary' atau 'details'
            const setActiveTab = (tabName) => {
                activeTab.value = tabName;
            };

        // Interceptors untuk request
        axiosInstance.interceptors.request.use(
            (config) => {
                console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Interceptors untuk response
        axiosInstance.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                let errorMessage = 'Terjadi kesalahan pada server';

                if (error.response) {
                    // Server merespons dengan error status
                    errorMessage = `Error: ${error.response.status} ${error.response.statusText}`;
                    if (error.response.data?.detail) {
                        errorMessage = error.response.data.detail;
                    } else if (error.response.data?.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error.request) {
                    // Request dibuat tapi tidak ada response
                    errorMessage = 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.';
                } else {
                    // Error lainnya
                    errorMessage = error.message;
                }

                console.error('Axios Error:', error);
                return Promise.reject(new Error(errorMessage));
            }
        );

        // Menggunakan API_BASE_URL yang diimpor
        const apiBaseUrl = ref(API_BASE_URL);
        const user = ref({
            username: '',
            email: '',
            role: '',
            is_active: '',
            full_name: ''
        });

        const checkAuth = () => {
            const storedUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (!storedUserData) {
                window.location.href = '/yayasan_bambu_dss/template/user/user_login_register.html'; // Sesuaikan dengan path halaman login Anda
                return false;
            }
            return true;
        };

        const mobileMenuOpen = ref(false);
        const dssCriteria = ref([
            { id: 'C1', name: 'Biaya pengembangan awal (Rp)', type: 'cost', icon: 'fas fa-drafting-compass', colorClass: 'text-red-500' },
            { id: 'C2', name: 'Biaya produksi per unit (Rp)', type: 'cost', icon: 'fas fa-coins', colorClass: 'text-red-500' },
            { id: 'C3', name: 'Minat pasar (skor 1-5)', type: 'benefit', icon: 'fas fa-users', colorClass: 'text-green-500' }
        ]);
        const dssResults = ref([]);
        const isDssLoading = ref(false);
        const dssError = ref(null);
        const chartInstance = ref(null);

        const userInitials = computed(() => {
            if (user.value.full_name) {
                const names = user.value.full_name.split(' ');
                if (names.length > 1) return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                return names[0].substring(0, 2).toUpperCase();
            }
            if(user.value.username) return user.value.username.substring(0, 2).toUpperCase();
            return '??';
        });

        const formattedDate = computed(() => {
            return new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        });

        const topRecommendation = computed(() => {
            if (dssResults.value && dssResults.value.length > 0) {
                return dssResults.value[0]; // Diasumsikan sudah diurutkan oleh backend atau saat fetch
            }
            return null;
        });

        const logout = () => {
            localStorage.removeItem('userData');
            sessionStorage.removeItem('userData');
            user.value = { username: '', email: '', role: '', is_active: false, full_name: '' };
            window.location.href = '/template/user/user_login_register.html'; // Arahkan ke halaman login jika ada
        };

        const _fetchData = async (endpoint, options = {}) => {
            isDssLoading.value = true;
            dssError.value = null;

            // Selalu bersihkan hasil dan chart untuk POST atau jika tidak ada opsi clearResultsOnFetch=false
            if (options.method === 'POST' || options.clearResultsOnFetch !== false) {
                if (chartInstance.value) {
                    chartInstance.value.destroy();
                    chartInstance.value = null;
                }
                dssResults.value = [];
            }

            try {
                // await new Promise(resolve => setTimeout(resolve, 1500)); // Simulasi delay

                let response;
                const axiosConfig = {
                    url: endpoint,
                    method: options.method || 'GET',
                    ...options
                };

                // Hapus properti custom yang tidak diperlukan axios
                delete axiosConfig.clearResultsOnFetch;

                response = await axiosInstance(axiosConfig);

                return response.data;
            } catch (error) {
                console.error(`Error dengan ${endpoint}:`, error);
                // Menampilkan apiBaseUrl.value dalam pesan error untuk debugging
                dssError.value = `Operasi gagal: ${error.message}. Periksa jaringan dan server backend di ${apiBaseUrl.value}. Pastikan CORS dikonfigurasi dengan benar.`;
                if (chartInstance.value) {
                    chartInstance.value.destroy();
                    chartInstance.value = null;
                }
                dssResults.value = []; // Bersihkan hasil jika terjadi error
                throw error; // Lempar ulang error agar bisa ditangkap oleh pemanggil jika perlu
            } finally {
                isDssLoading.value = false;
            }
        };

        const renderOrUpdateChart = () => {
                    if (chartInstance.value) {
                        chartInstance.value.destroy();
                        chartInstance.value = null;
                    }
                    if (!dssResults.value || dssResults.value.length === 0) return;

                    const ctx = document.getElementById('vikorRankChart');
                    if (!ctx) {
                        console.warn('Elemen canvas "vikorRankChart" tidak ditemukan.');
                        return;
                    }

                    const sortedResults = [...dssResults.value]
                        .filter(item => item.Q && !isNaN(parseFloat(item.Q)))
                        .sort((a, b) => parseFloat(a.Q) - parseFloat(b.Q));

                    if (sortedResults.length === 0) {
                        console.warn('Tidak ada data valid untuk ditampilkan di grafik setelah filter.');
                        return;
                    }

                    const labels = sortedResults.map(item => item.name.length > 25 ? item.name.substring(0,22)+'...' : item.name);
                    const dataValues = sortedResults.map(item => parseFloat(item.Q));

                    chartInstance.value = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Q-Value',
                                data: dataValues,
                                backgroundColor: sortedResults.map((item, index) => index === 0 ? 'rgba(22, 163, 74, 0.85)' : 'rgba(74, 222, 128, 0.65)'),
                                borderColor: sortedResults.map((item, index) => index === 0 ? 'rgba(17, 128, 59, 1)' : 'rgba(50, 180, 100, 1)'),
                                borderWidth: 1,
                                maxBarThickness: 30,
                                borderRadius: 4,
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: { beginAtZero: true, title: { display: true, text: 'Q-Value (Semakin Rendah Semakin Baik)', font: { weight: '500', size: 13 } } },
                                y: { grid: { display: false }, ticks: { font: { size: 11 } } }
                            },
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: 'rgba(0,0,0,0.75)',
                                    titleFont: { weight: 'bold'},
                                    bodyFont: { size: 13 },
                                    padding: 10,
                                    callbacks: {
                                        label: function(context) { return ` Q-Value: ${context.formattedValue}`; }
                                    }
                                }
                            },
                            animation: { duration: 800, easing: 'easeInOutQuart' }
                        }
                    });
                };

        const startDSSCalculation = async () => {
            console.log('Mulai kalkulasi VIKOR DSS!');
            try {
                const result = await _fetchData('vikor/calculate', {
                    method: 'POST',
                });
                console.log('Hasil Kalkulasi VIKOR:', result);
                dssResults.value = (result.data || []).map(item => ({
                    ...item,
                    Q: !isNaN(parseFloat(item.Q)) ? parseFloat(item.Q).toFixed(6) : 'N/A',
                    S: !isNaN(parseFloat(item.S)) ? parseFloat(item.S).toFixed(6) : 'N/A',
                    R: !isNaN(parseFloat(item.R)) ? parseFloat(item.R).toFixed(6) : 'N/A'
                }));
                if (dssResults.value.length === 0) {
                    dssError.value = result.message || 'Kalkulasi selesai, tapi tidak ada data peringkat yang dikembalikan.';
                }
            } catch (error) {
                /* Error sudah ditangani oleh _fetchData */
            }
        };



        const fetchExistingRankings = async () => {
            console.log('Mengambil peringkat VIKOR yang ada...');
            try {
                const data = await _fetchData('vikor/rankings', {
                    clearResultsOnFetch: dssResults.value.length > 0 ? false: undefined
                });
                console.log('Peringkat yang Diambil:', data);
                dssResults.value = (data || []).map(r => ({
                    name: r.name,
                    product_id: r.product_id,
                    S: (r.S !== undefined && !isNaN(parseFloat(r.S)) ? parseFloat(r.S) : (r.score !== undefined && !isNaN(parseFloat(r.score)) ? parseFloat(r.score) : NaN)).toFixed(6),
                    R: (r.R !== undefined && !isNaN(parseFloat(r.R)) ? parseFloat(r.R) : NaN).toFixed(6),
                    Q: (r.Q !== undefined && !isNaN(parseFloat(r.Q)) ? parseFloat(r.Q) : (r.score !== undefined && !isNaN(parseFloat(r.score)) ? parseFloat(r.score) : NaN)).toFixed(6),
                })).map(item => ({
                    ...item,
                    S: item.S === 'NaN' || item.S === 'NaN.NaN' ? 'N/A' : item.S,
                    R: item.R === 'NaN' || item.R === 'NaN.NaN' ? 'N/A' : item.R,
                    Q: item.Q === 'NaN' || item.Q === 'NaN.NaN' ? 'N/A' : item.Q,
                }));
                if (dssResults.value.length === 0) {
                    dssError.value = 'Tidak ada peringkat tersimpan yang ditemukan di database.';
                }
            } catch (error) {
                /* Error sudah ditangani oleh _fetchData */
            }



        };

        const loadUserData = () => {
            const storedUserData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
            if (storedUserData) {
                try {
                    const parsedData = JSON.parse(storedUserData);
                    user.value = { ...user.value, ...parsedData };
                }
                catch (e) {
                    console.error('Data pengguna rusak di storage:', e);
                    logout();
                }
            } else {
                console.warn('Tidak ada data pengguna. Menggunakan data default/sampel.');
            }
        };

        watch(dssResults, (newVal, oldVal) => {
            if (newVal && newVal.length > 0 && (JSON.stringify(newVal) !== JSON.stringify(oldVal) || !chartInstance.value)) {
                nextTick(() => {
                    renderOrUpdateChart();
                });
            } else if ((!newVal || newVal.length === 0) && chartInstance.value) {
                chartInstance.value.destroy();
                chartInstance.value = null;
            }
        }, { deep: true });

        onMounted(() => {
            if (!checkAuth()) return;
            loadUserData();
            fetchExistingRankings();
            console.log('API Base URL digunakan:', apiBaseUrl.value);
        });

        return {
            user, mobileMenuOpen, dssCriteria, dssResults, isDssLoading, dssError,
            userInitials,
            formattedDate,
            topRecommendation,
            logout,
            startDSSCalculation,
            fetchExistingRankings,
            activeTab,
            setActiveTab
        };
    },

      logout() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('adminData');
                window.location.href = '/template/admin/admin_login_register.html';
            }
        },

}).mount('#app');

// Tailwind config
tailwind.config = {
    theme: {
        extend: {
            fontFamily: { sans: ['Inter', 'sans-serif'], },
            colors: {
                bamboo: { 50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', },
                neutral: { 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a' }
            },
            boxShadow: {
                'md': '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -1px rgba(0,0,0,0.05)',
                'lg': '0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px -2px rgba(0,0,0,0.04)',
                'xl': '0 20px 25px -5px rgba(0,0,0,0.06), 0 10px 10px -5px rgba(0,0,0,0.03)',
                '2xl': '0 25px 50px -12px rgba(0,0,0,0.15)',
            },
            animation: { 'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', },
            keyframes: { pulse: { '0%, 100%': { opacity: 0.7 }, '50%': { opacity: 0.3 }, } }
        }
    }
};