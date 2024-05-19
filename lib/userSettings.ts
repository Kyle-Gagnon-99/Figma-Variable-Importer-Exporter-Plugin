import { UserSettings } from "../src/import-export";

const SETTINGS_KEY = "import-export-settings";

/**
 * Gets the user settings for this plugin that is stored locally. If
 * it does not exist (maybe a clear of local storage, new computer, or first time user)
 * then it returns the default settings.
 *
 * @returns A promise of the UserSettings stored locally
 */
export async function getLocalUserSettings() {
    const rawSettings = await figma.clientStorage.getAsync(SETTINGS_KEY);

    // Handle no existing settings
    if (rawSettings === undefined) {
        return getDefaultSettings();
    }

    try {
        return JSON.parse(rawSettings as string) as UserSettings;
    } catch (error) {
        console.error("Import/Export: Error parsing user settings.");
        return getDefaultSettings();
    }
}

/**
 * Saves the given user settings using Figma's local storage.
 *
 * @param settings The user settings to save
 */
export async function setLocalUserSettings(settings: UserSettings) {
    try {
        const settingsString = JSON.stringify(settings);
        await figma.clientStorage.setAsync(SETTINGS_KEY, settingsString);
    } catch (error) {
        console.log("Import/Export: Error saving settings - ", error);
    }
}

/**
 * Returns the default values of the user settings.
 *
 * @returns The default user settings
 */
export function getDefaultSettings(): UserSettings {
    return {
        failOnNullAlias: true,
        booleanFallback: false,
        numberFallback: 0,
        colorFallback: "#000000",
        stringFallback: "",
        extendCollections: true,
    };
}
