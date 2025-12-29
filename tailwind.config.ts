import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
  			nunito: ['Nunito', 'system-ui', 'sans-serif'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			// Адаптивные округления (используют CSS переменные)
  			'adaptive-xs': 'var(--radius-xs)',
  			'adaptive-sm': 'var(--radius-sm)',
  			'adaptive-md': 'var(--radius-md)',
  			'adaptive-lg': 'var(--radius-lg)',
  			'adaptive-xl': 'var(--radius-xl)',
  			'adaptive-2xl': 'var(--radius-2xl)',
  		},
  		// Адаптивные отступы
  		spacing: {
  			'section': 'var(--spacing-section)',
  			'card-p': 'var(--spacing-card)',
  			'container-p': 'var(--spacing-container)',
  			'safe-top': 'var(--safe-area-top)',
  			'safe-bottom': 'var(--safe-area-bottom)',
  			'header': 'var(--height-header)',
  			'bottom-nav': 'var(--height-bottom-nav)',
  		},
  		// Адаптивные высоты
  		height: {
  			'header': 'var(--height-header)',
  			'bottom-nav': 'var(--height-bottom-nav)',
  			'button': 'var(--height-button)',
  			'input': 'var(--height-input)',
  		},
  		minHeight: {
  			'button': 'var(--height-button)',
  			'input': 'var(--height-input)',
  		},
  		// Адаптивные тени
  		boxShadow: {
  			'card': 'var(--shadow-card)',
  			'card-hover': 'var(--shadow-card-hover)',
  			'sheet': 'var(--shadow-sheet)',
  			'modal': 'var(--shadow-modal)',
  		},
		// Кастомные breakpoints для точной адаптации
		screens: {
			'xs': '375px',    // iPhone SE, маленькие телефоны
			// sm: 640px (по умолчанию)
			// md: 768px (по умолчанию)
			// lg: 1024px (по умолчанию)
			'chat': '1200px',  // Для страницы messages (3 панели)
			// xl: 1280px (по умолчанию)
			'touch': { 'raw': '(hover: none)' },  // Устройства с тач-экраном
			'mouse': { 'raw': '(hover: hover)' }, // Устройства с мышью
		},
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
