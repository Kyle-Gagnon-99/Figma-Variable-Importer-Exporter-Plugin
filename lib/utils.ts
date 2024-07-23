import chroma from "chroma-js";

/**
 * Gets the collection name from a variable in a Collection:Variable format
 *
 * @param input The string to get the collection name from
 * @returns The collection name
 */
export function getCollectionName(input: string): string | null {
    const match = input.match(/^(.+?):/);
    return match ? match[1] : null;
}

/**
 * Gets the variable name from a variable in a Collection:Variable format.
 * Assumes the format is well-formed, otherwise behavior is undefined.
 *
 * @param input The string to get the variable name from
 * @returns The variable name
 */
export function getVariableName(input: string): string {
    const parts = input.split(":");
    return parts.slice(1).join("/"); // Rebuild the variable portion with '/'
}

/**
 * It will check if the given input follows the Collection:Variable format.
 * Useful to double check if it is an alias.
 *
 * @param input The variable to check if it is a reference variable
 * @returns True if it is a reference variable or false otherwise
 */
export function matchesFormat(input: string): boolean {
    const pattern = /^[^\s:]+(?:\s+[^\s:]+)*:[^\s:]+(?:\s+[^\s:]+)*$/;
    return pattern.test(input);
}

/**
 * Checks if the given color is in the format of #([a-fA-F0-9]{2}){3} a.k.a #00AA00
 *
 * @param color The color to check
 * @returns True if is a hex color or false otherwise
 */
export function isHexColor(color: string): boolean {
    return /^#(?:[0-9a-f]{3}){1,2}$/i.test(color);
}

/**
 * Checks if the given color is in the format of rgb(0, 0, 0)
 *
 * @param color The color to check
 * @returns True if is a rgb color or false otherwise
 */
export function isRgbColor(color: string): boolean {
    return /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gim.test(
        color,
    );
}

/**
 * Checks if the given color is in the format of hsl(0, 0%, 0%)
 *
 * @param color The color to check
 * @returns True if is a hsl color or false otherwise
 */
export function isHslColor(color: string): boolean {
    return /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?s*,\s*(\d{1,3})%?s*\)/gim.test(
        color,
    );
}

/**
 * Validates the RGB color
 *
 * @param color The color to validate
 * @returns True if the color is valid or false otherwise
 */
export function isValidRgb(color: string): boolean {
    const [_, r, g, b] =
        color.match(
            /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i,
        ) || [];
    return (
        parseInt(r) >= 0 &&
        parseInt(r) <= 255 &&
        parseInt(g) >= 0 &&
        parseInt(g) <= 255 &&
        parseInt(b) >= 0 &&
        parseInt(b) <= 255
    );
}

/**
 * Validates the HSL color
 *
 * @param color The color to validate
 * @returns True if the color is valid or false otherwise
 */
export function isValidHsl(color: string): boolean {
    let [_, h, s, l] =
        color.match(
            /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?s*,\s*(\d{1,3})%?s*\)/i,
        ) || [];

    [h, s, l] = [h, s.replace("%", ""), l.replace("%", "")];
    return (
        parseInt(h) >= 0 &&
        parseInt(h) <= 360 &&
        parseInt(s) >= 0 &&
        parseInt(s) <= 100 &&
        parseInt(l) >= 0 &&
        parseInt(l) <= 100
    );
}

/**
 * Converts the typescript/json type to the Figma variable type
 *
 * @param type The Figma variable type
 * @returns The resolved data type
 */
export function convertTypeToFigmaType(
    type: FigmaVarTypes,
): VariableResolvedDataType {
    switch (type) {
        case "boolean":
            return "BOOLEAN";
        case "string":
            return "STRING";
        case "color":
            return "COLOR";
        case "number":
            return "FLOAT";
    }
}

/**
 * Converts the Figma variable type to the typescript/json type
 *
 * @param type The resolved data type
 * @returns The Figma variable type
 */
export function convertFigmaTypeToType(
    type: VariableResolvedDataType,
): FigmaVarTypes {
    switch (type) {
        case "BOOLEAN":
            return "boolean";
        case "STRING":
            return "string";
        case "COLOR":
            return "color";
        case "FLOAT":
            return "number";
    }
}

/**
 * Figma uses 0 - 1 to represent the colors. So convert them to normal 0 - 255 RGB range
 * and convert to hex
 *
 * @param r - The red color value (between 0 and 1).
 * @param g - The green color value (between 0 and 1).
 * @param b - The blue color value (between 0 and 1).
 * @returns The hex string
 */
export function convertRgbToHex(r: number, g: number, b: number): string {
    // Scale the RGB values to 0 - 255
    const [r_scale, g_scale, b_scale] = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
    ];

    // Use chroma to convert to hex
    return chroma(r_scale, g_scale, b_scale).hex();
}

/**
 * Converts the RGB color values to a HSL color string.
 *
 * @param r - The red color value (between 0 and 1).
 * @param g - The green color value (between 0 and 1).
 * @param b - The blue color value (between 0 and 1).
 * @returns The HSL color string.
 */
export function convertRgbToHsl(r: number, g: number, b: number): string {
    // Scale the RGB values to 0 - 255
    const [r_scale, g_scale, b_scale] = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
    ];

    // Use chroma to convert to HSL
    let [h, s, l] = chroma(r_scale, g_scale, b_scale).hsl();

    if (isNaN(h)) {
        h = 0;
    }

    // Convert the HSL into a hsl(hue, saturation%, lightness%) string. Saturation and lightness are between 0 - 1 so *100
    // TODO - In the possible future, have the ability to select the HSL format as well (like HSL() or hsl() or just the values, or with percents)
    // When doing that, make sure to update validation to support multiple different ways of accepting HSL, HSLA, HEX, RGB, RGB and more
    // I think chroma may be able to do this for us!
    return String(
        `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
    );
}

/**
 * While seeming redudant, this function is to convert Figma's representation of RGB (0 - 1) to 0 - 255.
 *
 * @param r - The red color value (between 0 and 1).
 * @param g - The green color value (between 0 and 1).
 * @param b - The blue color value (between 0 and 1).
 * @returns The RGB value where the values of RGB are between 0 - 255
 */
export function convertRgbToRgb(r: number, g: number, b: number): string {
    // Scale the RGB values to 0 - 25
    const [r_scale, g_scale, b_scale] = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
    ];

    console.log(`${r}, ${g}, ${b}`);

    // Convert it to the RGB string
    // TODO - Same as above. Make it possible to return different formats as well. Again we have to tune validation for that but chroma should help with that
    return String(`rgb(${r_scale}, ${g_scale}, ${b_scale})`);
}

/**
 * Converts an RGBA value to HEXA string.
 *
 * @param r - The red color value (between 0 and 1).
 * @param g - The green color value (between 0 and 1).
 * @param b - The blue color value (between 0 and 1).
 * @param a - The "alpha" or "opacity" value (between 0 and 1).
 * @returns The hex string
 */
export function convertRgbaToHexa(
    r: number,
    g: number,
    b: number,
    a: number,
): string {
    const [r_scale, g_scale, b_scale, a_scale] = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        a,
    ];

    // Return the hex of the RGB value, losing the alpha value
    return chroma(r_scale, g_scale, b_scale).alpha(a_scale).hex();
}

/**
 * Converts the given RGBA value into an HSLA string.
 *
 * @param r - The red color value (between 0 and 1).
 * @param g - The green color value (between 0 and 1).
 * @param b - The blue color value (between 0 and 1).
 * @param a - The "alpha" or "opacity" value (between 0 and 1).
 * @returns The HSLA string representation
 */
export function convertRgbaToHsla(
    r: number,
    g: number,
    b: number,
    a: number,
): string {
    const [r_scale, g_scale, b_scale, a_scale] = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        a,
    ];

    // Use chroma to convert to HSLA
    let [h, s, l] = chroma(r_scale, g_scale, b_scale).hsl();

    if (isNaN(h)) {
        h = 0;
    }

    // Return in HSLA format
    return String(
        `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a_scale.toFixed(2)})`,
    );
}

/**
 * Converts the given RGBA value into an RGBA string
 *
 * @param r - The red color value (between 0 and 1).
 * @param g - The green color value (between 0 and 1).
 * @param b - The blue color value (between 0 and 1).
 * @param a - The "alpha" or "opacity" value (between 0 and 1).
 * @returns The RGBA string representation
 */
export function convertRgbaToRgba(
    r: number,
    g: number,
    b: number,
    a: number,
): string {
    const [r_scale, g_scale, b_scale, a_scale] = [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        a,
    ];

    // Return the string in the formatted RGBA
    return String(
        `rgba(${r_scale}, ${g_scale}, ${b_scale}, ${a_scale.toFixed(2)})`,
    );
}
