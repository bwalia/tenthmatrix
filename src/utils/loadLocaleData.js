import { promises as fs } from 'fs';

/**
 * Load locale-specific data file
 * @param {string} filename - The name of the data file (e.g., 'contact-us.json')
 * @param {string} locale - The locale code (e.g., 'en', 'fr', 'nl', 'hi', 'th')
 * @returns {Promise<Object>} - Parsed JSON data
 */
export async function loadLocaleData(filename, locale = 'en') {
    try {
        const filePath = process.cwd() + `/src/app/data/${locale}/${filename}`;
        const dataFile = await fs.readFile(filePath, 'utf8');
        return JSON.parse(dataFile);
    } catch (error) {
        // Fallback to English if translation not available
        if (process.env.I18N_DEBUG) console.warn(`Translation not found for ${locale}/${filename}, falling back to English`);
        const fallbackPath = process.cwd() + `/src/app/data/en/${filename}`;
        const dataFile = await fs.readFile(fallbackPath, 'utf8');
        return JSON.parse(dataFile);
    }
}

/**
 * Load client-side locale data from public folder
 * @param {string} filename - The name of the data file (e.g., 'stories.json')
 * @param {string} locale - The locale code (e.g., 'en', 'fr', 'nl', 'hi', 'th')
 * @returns {Promise<Object>} - Parsed JSON data
 */
export async function loadPublicLocaleData(filename, locale = 'en') {
    try {
        const response = await fetch(`/data/${locale}/${filename}`);
        if (!response.ok) throw new Error('Translation not found');
        return await response.json();
    } catch (error) {
        // Fallback to English
        console.warn(`Translation not found for ${locale}/${filename}, falling back to English`);
        const response = await fetch(`/data/en/${filename}`);
        return await response.json();
    }
}

