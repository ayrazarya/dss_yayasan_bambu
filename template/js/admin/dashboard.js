import { API_BASE_URL } from '../utils/api_base_url.js';
import { FRONTEND_AES_KEY } from '../utils/encrypt.js';


const { createApp } = Vue;

createApp({
    data() {
        return {
            admin: null,
            products: [],
            newProduct: {
                name: '',
                development_cost: null,
                production_cost_per_unit: null,
                status: '',
                survey_form_id: ''

            },
            editingProduct: null,
            editProduct: {
                product_id: null,
                name: '',
                development_cost: null,
                production_cost_per_unit: null,
                status: '',
                survey_form_id: ''
            },
            surveyStatus: {
              message: '',
              valid: null  // true / false / null
            },
            modal: {
              show: false,
              title: "",
              message: ""
            },
            costChart: null,
            statusChart: null,
            chartsInitialized: false
        }
    },
    computed: {
        activeProducts() {
            return this.products.filter(p => p.status === 'Disetujui').length;
        },
        activePercentage() {
            if (this.products.length === 0) return 0;
            return Math.round((this.activeProducts / this.products.length) * 100);
        },
        totalInvestment() {
            return this.products.reduce((sum, p) => sum + (p.development_cost || 0), 0);
        },
        averageUnitCost() {
            if (this.products.length === 0) return '0.00';
            const total = this.products.reduce((sum, p) => sum + (p.production_cost_per_unit || 0), 0);
            return (total / this.products.length).toFixed(2);
        },
        statusDistribution() {
            const distribution = {};
            this.products.forEach(product => {
                const status = product.status || 'No Status';
                distribution[status] = (distribution[status] || 0) + 1;
            });
            return distribution;
        }
    },
    watch: {
        products: {
            handler() {
                // Use setTimeout to ensure DOM is fully updated
                setTimeout(() => {
                    this.updateCharts();
                }, 100);
            },
            deep: true
        }
    },
    mounted() {
        const adminData = localStorage.getItem('adminData');
        if (adminData) {
            this.admin = JSON.parse(adminData);
            this.fetchProducts();
        } else {
            window.location.href = '/template/admin/admin_login_register.html';
        }
    },
    methods: {
        getStatusClass(status) {
            const baseClass = 'text-xs font-medium px-2 py-1 rounded-full ';
            switch (status) {
                case 'Disetujui':
                    return baseClass + 'bg-green-100 text-green-800';
                case 'Ditolak':
                    return baseClass + 'bg-red-100 text-red-800';
                case 'Calon':
                    return baseClass + 'bg-purple-100 text-purple-800';
                default:
                    return baseClass + 'bg-gray-100 text-gray-800';
            }
        },

        decryptToken(encryptedToken) {
    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedToken, FRONTEND_AES_KEY);
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (err) {
        console.error("Gagal mendekripsi token:", err);
        return null;
    }
},


           authHeader() {
           const encrypted = localStorage.getItem("adminToken");
            const token = this.decryptToken(encrypted);

            return {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            };
        },

        // Saat logout
logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminData');
        localStorage.removeItem('adminToken');
        window.location.href = '/template/admin/admin_login_register.html';
    }
},



    // Ambil daftar produk
    async fetchProducts() {
        try {
            const response = await axios.get(`${API_BASE_URL}products/`, {
                headers: this.authHeader()
            });

            this.products = response.data;

            // Initialize charts
            this.$nextTick(() => {
                setTimeout(() => {
                    this.initializeCharts();
                }, 100);
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to fetch products';
            alert(errorMessage);
        }
    },

    // Tambah produk baru
    async addProduct() {
        try {
            const payload = {
                name: this.newProduct.name,
                development_cost: parseFloat(this.newProduct.development_cost),
                production_cost_per_unit: parseFloat(this.newProduct.production_cost_per_unit),
                status: this.newProduct.status || null,
                description: null,
                form_response_id: this.newProduct.survey_form_id || null
            };

            const response = await axios.post(`${API_BASE_URL}products/`, payload, {
                headers: this.authHeader()
            });

            const createdProduct = response.data;
            this.products.push(createdProduct);

            // Reset form
            this.newProduct = {
                name: '',
                development_cost: null,
                production_cost_per_unit: null,
                status: '',
                survey_form_id: ''
            };

            this.showNotification('Product added successfully!', 'success');

        } catch (error) {
            console.error('Error adding product:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to add product';
            alert(errorMessage);
        }
    },

    // Inisialisasi edit
    startEdit(product) {
        this.editingProduct = product.product_id;
        this.editProduct = { ...product };
    },

    // Batal edit
    cancelEdit() {
        this.editingProduct = null;
        this.editProduct = {
            product_id: null,
            name: '',
            development_cost: null,
            production_cost_per_unit: null,
            status: ''
        };
    },

    // Simpan hasil edit
    async saveEdit() {
        try {
            const payload = {
                name: this.editProduct.name,
                development_cost: parseFloat(this.editProduct.development_cost),
                production_cost_per_unit: parseFloat(this.editProduct.production_cost_per_unit),
                status: this.editProduct.status || null,
                description: null
            };

            const response = await axios.put(`${API_BASE_URL}products/${this.editProduct.product_id}`, payload, {
                headers: this.authHeader()
            });

            const updatedProduct = response.data;
            const index = this.products.findIndex(p => p.product_id === updatedProduct.product_id);
            if (index !== -1) this.products[index] = updatedProduct;

            this.cancelEdit();
            this.showNotification('Product updated successfully!', 'success');

        } catch (error) {
            console.error('Error updating product:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to update product';
            alert(errorMessage);
        }
    },

    // Hapus produk
    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await axios.delete(`${API_BASE_URL}products/${productId}`, {
                headers: this.authHeader()
            });

            this.products = this.products.filter(p => p.product_id !== productId);
            this.showNotification('Product deleted successfully!', 'success');

        } catch (error) {
            console.error('Error deleting product:', error);
            const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete product';
            alert(errorMessage);
        }
    },

    // Cek validitas survey form ID
    async checkSurveyId() {
        try {
            const response = await axios.get(
                `${API_BASE_URL}products/api/survey/check-id/${this.newProduct.survey_form_id}`,
                {
                    headers: this.authHeader()
                }
            );

            if (response.data.valid) {
                this.modal = {
                    show: true,
                    title: "ID Valid",
                    message: "Survey form ID yang kamu masukkan valid dan bisa digunakan."
                };
            } else {
                this.modal = {
                    show: true,
                    title: "ID Tidak Valid",
                    message: "ID tidak valid. Pastikan sudah dibagikan ke service account."
                };
            }
        } catch (error) {
            console.error("Terjadi error saat mengecek ID:", error);
            this.modal = {
                show: true,
                title: "Gagal Mengecek ID",
                message: "Terjadi kesalahan saat mengecek ID. Pastikan sudah dibagikan ke service account."
            };
        }
    },


        showNotification(message, type = 'info') {
            // Simple notification - you can enhance this with a proper notification system
            const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
            console.log(`${type.toUpperCase()}: ${message}`);

            // For now, using alert - replace with a proper notification system
            if (type === 'success') {
                // You can implement a toast notification here
                console.log('success' + message);
            }
        },

        initializeCharts() {
            // Only initialize if we have data and elements exist
            if (this.products.length === 0) return;

            const costChartElement = document.getElementById('costChart');
            const statusChartElement = document.getElementById('statusChart');

            if (!costChartElement || !statusChartElement) {
                console.log('Chart elements not found');
                return;
            }

            this.createCostChart();
            this.createStatusChart();
            this.chartsInitialized = true;
        },

        updateCharts() {
            if (!this.chartsInitialized) {
                this.initializeCharts();
                return;
            }

            // Destroy existing charts safely
            if (this.costChart) {
                this.costChart.destroy();
                this.costChart = null;
            }
            if (this.statusChart) {
                this.statusChart.destroy();
                this.statusChart = null;
            }

            // Only recreate if we have data
            if (this.products.length > 0) {
                this.createCostChart();
                this.createStatusChart();
            }
        },

        createCostChart() {
            const ctx = document.getElementById('costChart');
            if (!ctx) {
                console.log('Cost chart canvas not found');
                return;
            }

            // Take up to 8 products for better visualization
            const chartData = this.products.slice(0, 8).map(product => ({
                label: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
                development: product.development_cost || 0,
                production: (product.production_cost_per_unit || 0) * 100 // Multiply by 100 for better visualization
            }));

            this.costChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.map(item => item.label),
                    datasets: [
                        {
                            label: 'Development Cost (Rp)',
                            data: chartData.map(item => item.development),
                            backgroundColor: 'rgba(34, 197, 94, 0.8)',
                            borderColor: 'rgba(22, 163, 74, 1)',
                            borderWidth: 1,
                            borderRadius: 4,
                        },
                        {
                            label: 'Production Cost x100 (Rp)',
                            data: chartData.map(item => item.production),
                            backgroundColor: 'rgba(125, 211, 252, 0.8)',
                            borderColor: 'rgba(14, 165, 233, 1)',
                            borderWidth: 1,
                            borderRadius: 4,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'Rp' + value.toLocaleString();
                                }
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        },

        createStatusChart() {
            const ctx = document.getElementById('statusChart');
            if (!ctx) {
                console.log('Status chart canvas not found');
                return;
            }

            const statusData = this.statusDistribution;
            const labels = Object.keys(statusData);
            const data = Object.values(statusData);

            // If no data, show a placeholder
            if (labels.length === 0) {
                labels.push('No Data');
                data.push(1);
            }

            const colors = [
                '#22c55e', // Green
                '#ef4444', // Red
                '#8b5cf6', // Purple
                '#f59e0b', // Yellow
                '#3b82f6', // Blue
                '#06b6d4', // Cyan
                '#f97316', // Orange
                '#84cc16'  // Lime
            ];

            this.statusChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }
    }
}).mount('#app');