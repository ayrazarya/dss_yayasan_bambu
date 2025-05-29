   import { API_BASE_URL } from '../utils/api_base_url.js';

     tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                    colors: {
                        bamboo: {
                            50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0',
                            300: '#86efac', 400: '#4ade80', 500: '#22c55e',
                            600: '#16a34a', 700: '#15803d', 800: '#166534',
                            900: '#14532d',
                        },
                        earth: {
                            50: '#faf8f5', 100: '#f4ede0', 200: '#e8d5b7',
                            300: '#d9ba85', 400: '#ca9c54', 500: '#a16c24',
                            600: '#7c5320', 700: '#5d3e18', 800: '#4B3211',
                            900: '#3e2910',
                        }
                    },
                    boxShadow: {
                        'xl': '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        '2xl': '0 25px 50px -12px rgba(0,0,0,0.1)',
                    }
                }
            }
        }

        const { createApp } = Vue;

        createApp({
            data() {
                return {
                    user: {
                        username: '',
                        email: '',
                        role: '',
                        is_active: '',
                        full_name: ''
                    },
                    mobileMenuOpen: false,
                    dssCriteria: [ // Based on your image
                        { id: 'C1', name: 'Biaya pengembangan awal (dalam rupiah)', type: 'cost' },
                        { id: 'C2', name: 'Biaya produksi per unit (dalam rupiah)', type: 'cost' },
                        { id: 'C3', name: 'Periode balik modal (dalam bulan)', type: 'cost' },
                        { id: 'C4', name: 'Minat pasar (dalam skor 1-5)', type: 'benefit' }
                    ],
                    dssResults: [],
                    isDssLoading: false,
                    dssError: null,
                }
            },
            computed: {
                userInitials() {
                    if (this.user.full_name) {
                        const names = this.user.full_name.split(' ');
                        if (names.length > 1) {
                            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                        }
                        return names[0].substring(0, 2).toUpperCase();
                    }
                    return this.user.username.substring(0, 2).toUpperCase();
                },
                formattedDate() {
                    return new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
            },
            methods: {
                logout() {
                    console.log('Logout action triggered');
                    alert('User logged out (simulation)');
                },
                async startDSSCalculation() {
                    this.isDssLoading = true;
                    this.dssError = null;
                    this.dssResults = []; // Clear previous results or show placeholder loading
                    console.log('Start VIKOR DSS calculation triggered!');

                    try {
                        // IMPORTANT: Adjust the URL if your FastAPI is on a different port or has a prefix (e.g., /api/vikor/calculate)
                        const response = await fetch('vikor/calculate', { // Corresponds to @router.post("/calculate")
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                // Add any other headers like Authorization if needed
                            },
                            // body: JSON.stringify({}), // Add body if your endpoint expects it
                        });

                        if (!response.ok) {
                            const errorData = await response.json().catch(() => ({ detail: 'Failed to calculate VIKOR rankings. Server returned an error.' }));
                            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                        }

                        const result = await response.json();
                        console.log('VIKOR Calculation Result:', result);
                        this.dssResults = result.data || []; // Assuming backend returns { message: "...", data: [...] }
                         if (this.dssResults.length === 0) {
                            alert('VIKOR calculation complete, but no ranking data was returned.');
                        }
                    } catch (error) {
                        console.error('Error calculating VIKOR rankings:', error);
                        this.dssError = `Failed to calculate rankings: ${error.message}. Check console for details. (This is a simulation, ensure backend is running and configured correctly.)`;
                        // alert(`Error: ${this.dssError}`); // For more prominent error display
                    } finally {
                        this.isDssLoading = false;
                    }
                },
                async fetchExistingRankings() {
                    this.isDssLoading = true;
                    this.dssError = null;
                    this.dssResults = [];
                    console.log('Fetching existing VIKOR rankings...');

                    try {
                        // IMPORTANT: Adjust URL if needed
                        const response = await fetch('vikor/rankings'); // Corresponds to @router.get("/rankings")
                        if (!response.ok) {
                             const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch rankings. Server returned an error.' }));
                            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                        }
                        const data = await response.json();
                        console.log('Fetched Rankings:', data);
                        // The backend for GET /rankings already returns a list of ProductRankingSchema
                        // We need to sort them by rank if not already sorted, though the query does order_by(ProductRanking.rank)
                        this.dssResults = data.map(r => ({
                            name: r.name,
                            product_id: r.product_id,
                            S: r.score, // Assuming score is Q for simplicity, or adjust if S/R are stored
                            R: 'N/A',   // If R is not directly stored/returned for existing rankings
                            Q: r.score, // Q is the final score
                            // rank: r.rank // rank is implicit by order
                        }));
                        if (this.dssResults.length === 0) {
                             alert('No existing rankings found.');
                        }

                    } catch (error) {
                        console.error('Error fetching existing rankings:', error);
                        this.dssError = `Failed to load existing rankings: ${error.message}. (Simulation - ensure backend is accessible).`;
                        // alert(`Error: ${this.dssError}`);
                    } finally {
                        this.isDssLoading = false;
                    }
                },
                loadUserData() {
                    const userData = localStorage.getItem('userData') || sessionStorage.getItem('userData');
                    if (userData) {
                        try {
                            this.user = JSON.parse(userData);
                        } catch (e) {
                            console.error('User data corrupt:', e);
                            // Potentially redirect to login or use default
                            // this.logout(); // Or handle differently
                        }
                    } else {
                        console.warn('No user data found in local/session storage. Using sample data.');
                    }
                }
            },
            mounted() {
                this.loadUserData();
                // Optionally, fetch existing rankings on page load:
                 this.fetchExistingRankings();
            }
        }).mount('#app');