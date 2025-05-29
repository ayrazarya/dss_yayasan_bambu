  tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        forest: { // Renamed 'bamboo' to 'forest' for a broader nature theme
                            50: '#f0fdf4',  // Lighter green - like new leaves
                            100: '#dcfce7', // Light green
                            200: '#bbf7d0', // Soft green
                            300: '#86efac', // Bright green
                            400: '#4ade80', // Vibrant green
                            500: '#22c55e', // Strong green - primary action
                            600: '#16a34a', // Darker green
                            700: '#15803d', // Deep forest green
                            800: '#166534', // Very dark green
                            900: '#14532d', // Almost black green
                        },
                        sky: {    // New palette for brighter accents
                            light: '#e0f2fe', // Pale blue - like a clear sky
                            medium: '#7dd3fc',// Bright sky blue
                            dark: '#0ea5e9'  // Deeper blue
                        },
                        sand: { // Earthy tones
                            light: '#fef3c7', // Pale sand
                            medium: '#fde68a',// Warm sand
                            dark: '#fbbf24'   // Golden sand
                        },
                        stone: { // Neutral tones
                            light: '#f5f5f4', // Very light gray, like a smooth pebble
                            medium: '#e7e5e4',// Light gray
                            dark: '#a8a29e'   // Medium gray
                        }
                    }
                }
            }
        }