import { API_BASE_URL } from '../utils/api_base_url.js';

const { createApp } = Vue;

  createApp({
    data() {
      return {
        admin: null,
        rankingData: [],
        historyData: [],
        evaluationDates: [],
        selectedDate: '',
        showHistory: false,
        isLoading: true,
        isDownloadingPDF: false,
        alertMessage: '',
        alertType: 'success',
        lastUpdated: null,
        // Properti apiBaseUrl dihapus dari data
      };
    },
    methods: {
      async fetchRankings() {
        this.isLoading = true;
        try {
          // DISESUAIKAN: Langsung menggunakan konstanta API_BASE_URL
          const response = await axios.get(`${API_BASE_URL}vikor/rankings`);
          this.rankingData = response.data;
          if (this.rankingData.length > 0) {
            this.lastUpdated = this.rankingData[0]?.evaluated_at;
          }
          this.showAlert('Data ranking terbaru berhasil dimuat.', 'success');
        } catch (error) {
          console.error('Error fetching rankings:', error);
          this.showAlert('Gagal memuat data ranking: ' + (error.response?.data?.detail || error.message), 'error');
          this.rankingData = [];
        } finally {
          this.isLoading = false;
        }
      },
      async fetchEvaluationDates() {
        try {
          // DISESUAIKAN: Langsung menggunakan konstanta API_BASE_URL
          const response = await axios.get(`${API_BASE_URL}vikor/rankings/dates`);
          this.evaluationDates = response.data.sort((a, b) => new Date(b.evaluated_at) - new Date(a.evaluated_at));
        } catch (error) {
          console.error('Error fetching evaluation dates:', error);
        }
      },
      async fetchRankingsByDate(date) {
        this.isLoading = true;
        this.rankingData = [];
        try {
          // DISESUAIKAN: Langsung menggunakan konstanta API_BASE_URL
          const response = await axios.get(`${API_BASE_URL}vikor/rankings/by-date/${date}`);
          this.rankingData = response.data;
          if (response.data.length > 0) {
             this.lastUpdated = response.data[0].evaluated_at;
          }
          this.showAlert(`Data ranking untuk tanggal ${this.formatDateTime(date)} berhasil dimuat.`, 'success');
        } catch (error) {
          console.error('Error fetching rankings by date:', error);
          this.showAlert('Gagal memuat data ranking untuk tanggal yang dipilih.', 'error');
        } finally {
          this.isLoading = false;
        }
      },
      async fetchHistory() {
        try {
          // DISESUAIKAN: Langsung menggunakan konstanta API_BASE_URL
          const response = await axios.get(`${API_BASE_URL}vikor/rankings/history?limit=100`);
          this.historyData = response.data;
        } catch (error) {
          console.error('Error fetching history:', error);
        }
      },
      async refreshData() {
        this.selectedDate = '';
        await this.fetchRankings();
        await this.fetchEvaluationDates();
        if (this.showHistory) {
          await this.fetchHistory();
        }
      },
      onDateChange() {
        if (this.selectedDate) {
          this.fetchRankingsByDate(this.selectedDate);
        } else {
          this.fetchRankings();
        }
      },
      formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      showAlert(message, type = 'success') {
        this.alertMessage = message;
        this.alertType = type;
        setTimeout(() => {
          this.alertMessage = '';
        }, 5000);
      },

      // Method untuk mengunduh PDF
      downloadPDF() {
        if (this.rankingData.length === 0) {
          this.showAlert('Tidak ada data untuk diunduh.', 'error');
          return;
        }
        this.isDownloadingPDF = true;
        const element = document.getElementById('rankingTableContainer');

        const options = {
          margin:       0.5,
          filename:     `Ranking_Produk_${new Date().toISOString().slice(0,10)}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(options).save().then(() => {
          this.isDownloadingPDF = false;
        }).catch(err => {
            this.showAlert('Gagal membuat PDF. Silakan coba lagi.', 'error');
            this.isDownloadingPDF = false;
        });
      },

      logout() {
        localStorage.removeItem('adminData');
        window.location.href = '/yayasan_bambu_dss/template/admin/admin_login_register.html';
      }
    },
    async mounted() {
      const adminData = localStorage.getItem('adminData');
      if (adminData) {
        this.admin = JSON.parse(adminData);
      } else {
        window.location.href = '/yayasan_bambu_dss/template/admin/admin_login_register.html';
        return;
      }
      await this.fetchRankings();
      await this.fetchEvaluationDates();
    },
    watch: {
      showHistory(newVal) {
        if (newVal && this.historyData.length === 0) {
          this.fetchHistory();
        }
      }
    }
  }).mount('#app');