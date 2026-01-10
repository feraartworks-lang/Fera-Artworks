/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)"
            },
            colors: {
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))"
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))"
                },
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))"
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))"
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))"
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))"
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))"
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                chart: {
                    1: "hsl(var(--chart-1))",
                    2: "hsl(var(--chart-2))",
                    3: "hsl(var(--chart-3))",
                    4: "hsl(var(--chart-4))",
                    5: "hsl(var(--chart-5))"
                },
                // Custom colors from design guidelines
                cyan: {
                    DEFAULT: "#00F0FF",
                    dark: "#00C2CC"
                },
                gold: {
                    DEFAULT: "#D4AF37",
                    light: "#FEE180"
                },
                neon: {
                    purple: "#BD00FF",
                    green: "#00FF94",
                    red: "#FF2E2E"
                }
            },
            fontFamily: {
                sans: ["Manrope", "sans-serif"],
                serif: ["Playfair Display", "serif"],
                mono: ["JetBrains Mono", "monospace"]
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" }
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" }
                },
                "fade-in-up": {
                    from: {
                        opacity: "0",
                        transform: "translateY(20px)"
                    },
                    to: {
                        opacity: "1",
                        transform: "translateY(0)"
                    }
                },
                "glow-pulse": {
                    "0%, 100%": {
                        boxShadow: "0 0 20px rgba(0, 240, 255, 0.3)"
                    },
                    "50%": {
                        boxShadow: "0 0 40px rgba(0, 240, 255, 0.5)"
                    }
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "fade-in-up": "fade-in-up 0.7s ease-out forwards",
                "glow-pulse": "glow-pulse 2s ease-in-out infinite"
            },
            backgroundImage: {
                "hero-glow": "radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.15) 0%, rgba(0, 0, 0, 0) 70%)",
                "glass-surface": "linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)",
                "golden-sheen": "linear-gradient(45deg, #D4AF37 0%, #FEE180 50%, #D4AF37 100%)"
            }
        }
    },
    plugins: [require("tailwindcss-animate")]
};
