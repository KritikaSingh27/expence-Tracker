import React, { useEffect, useState } from 'react';

export function ThemeToggle() {
    // Initialize theme from localStorage or system preference
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
            return localStorage.getItem('theme');
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
            root.classList.add(systemTheme);
            return;
        }

        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle btn btn-ghost btn-icon"
            aria-label="Toggle theme"
        >
            <div className="theme-toggle-content">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`icon sun-icon ${theme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`}
                >
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2" />
                    <path d="M12 21v2" />
                    <path d="M4.22 4.22l1.42 1.42" />
                    <path d="M18.36 18.36l1.42 1.42" />
                    <path d="M1 12h2" />
                    <path d="M21 12h2" />
                    <path d="M4.22 19.78l1.42-1.42" />
                    <path d="M18.36 5.64l1.42-1.42" />
                </svg>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`icon moon-icon ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`}
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            </div>
            <style>{`
        .theme-toggle {
          position: relative;
          overflow: hidden;
        }
        .theme-toggle-content {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .icon {
          position: absolute;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* standard ease */
        }
        .rotate-0 { transform: rotate(0deg); }
        .rotate-90 { transform: rotate(90deg); }
        .-rotate-90 { transform: rotate(-90deg); }
        .scale-0 { transform: scale(0); opacity: 0; }
        .scale-100 { transform: scale(1); opacity: 1; }
        
        /* Combine transforms correctly since they overwrite each other in CSS */
        .icon.rotate-90.scale-0 { transform: rotate(90deg) scale(0); }
        .icon.rotate-0.scale-100 { transform: rotate(0deg) scale(1); }
        .icon.-rotate-90.scale-0 { transform: rotate(-90deg) scale(0); }
      `}</style>
        </button>
    );
}
