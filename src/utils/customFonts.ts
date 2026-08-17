export interface StoredFont {
  name: string;
  dataUrl: string;
}

const STORAGE_KEYS = {
  titleFont: 'gym_custom_title_font',
  bodyFont: 'gym_custom_body_font',
  titleFontName: 'gym_custom_title_font_name',
  bodyFontName: 'gym_custom_body_font_name',
};

/**
 * Register and apply a FontFace object into document.fonts
 */
export async function registerFontFace(fontFamily: string, dataUrl: string): Promise<boolean> {
  try {
    const fontFace = new FontFace(fontFamily, `url(${dataUrl})`);
    const loadedFont = await fontFace.load();
    document.fonts.add(loadedFont);
    return true;
  } catch (error) {
    console.error(`Failed to register font ${fontFamily}:`, error);
    return false;
  }
}

/**
 * Save custom font to storage and activate it in document
 */
export async function saveAndApplyCustomFont(
  type: 'title' | 'body',
  file: File
): Promise<{ success: boolean; fontValue?: string; error?: string }> {
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const fontFamilyName = type === 'title' ? 'CustomTitleFont' : 'CustomBodyFont';
    const ok = await registerFontFace(fontFamilyName, dataUrl);
    if (!ok) {
      return { success: false, error: 'Could not parse font file' };
    }

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (type === 'title') {
      localStorage.setItem(STORAGE_KEYS.titleFont, dataUrl);
      localStorage.setItem(STORAGE_KEYS.titleFontName, cleanName);
    } else {
      localStorage.setItem(STORAGE_KEYS.bodyFont, dataUrl);
      localStorage.setItem(STORAGE_KEYS.bodyFontName, cleanName);
    }

    const fontValue = `'${fontFamilyName}', sans-serif`;
    return { success: true, fontValue };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return { success: false, error: message };
  }
}

/**
 * Get stored custom font metadata if any
 */
export function getStoredCustomFontInfo(type: 'title' | 'body'): { exists: boolean; name: string; fontValue: string } {
  try {
    const key = type === 'title' ? STORAGE_KEYS.titleFont : STORAGE_KEYS.bodyFont;
    const nameKey = type === 'title' ? STORAGE_KEYS.titleFontName : STORAGE_KEYS.bodyFontName;
    const data = localStorage.getItem(key);
    const name = localStorage.getItem(nameKey) || (type === 'title' ? 'Custom Title Font' : 'Custom Body Font');

    const fontFamilyName = type === 'title' ? 'CustomTitleFont' : 'CustomBodyFont';
    return {
      exists: !!data,
      name,
      fontValue: `'${fontFamilyName}', sans-serif`,
    };
  } catch {
    return { exists: false, name: '', fontValue: '' };
  }
}

/**
 * Remove stored custom font
 */
export function deleteCustomFont(type: 'title' | 'body') {
  try {
    if (type === 'title') {
      localStorage.removeItem(STORAGE_KEYS.titleFont);
      localStorage.removeItem(STORAGE_KEYS.titleFontName);
    } else {
      localStorage.removeItem(STORAGE_KEYS.bodyFont);
      localStorage.removeItem(STORAGE_KEYS.bodyFontName);
    }
  } catch (err) {
    console.warn(err);
  }
}

/**
 * Restore all custom fonts on app boot
 */
export async function initializeCustomFonts(): Promise<void> {
  try {
    const titleData = localStorage.getItem(STORAGE_KEYS.titleFont);
    if (titleData) {
      await registerFontFace('CustomTitleFont', titleData);
    }

    const bodyData = localStorage.getItem(STORAGE_KEYS.bodyFont);
    if (bodyData) {
      await registerFontFace('CustomBodyFont', bodyData);
    }
  } catch (err) {
    console.warn('Could not restore custom fonts:', err);
  }
}
