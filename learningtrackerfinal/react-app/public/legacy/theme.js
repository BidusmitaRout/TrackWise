// theme.js
const THEME_STORAGE_KEY = 'trackWiseTheme';

const applyTheme = (theme) => {
    const body = document.body;
    if (theme === 'light') {
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
};

const toggleTheme = () => {
    const currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
};

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
    applyTheme(savedTheme);

    // Attach listener to the new button ID in the navigation
    const toggleBtn = document.getElementById('mode-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
});