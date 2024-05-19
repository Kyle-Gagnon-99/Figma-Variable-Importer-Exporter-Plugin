import { ColorFormat } from "../src/import-export";
import {
    convertFigmaTypeToType,
    convertRgbaToHexa,
    convertRgbaToHsla,
    convertRgbaToRgba,
    convertRgbToHex,
    convertRgbToHsl,
    convertRgbToRgb,
    getCollectionName,
    getVariableName,
} from "./utils";

/**
 * A class used to facilitate the exporting of variables from Figma to a JSON file
 */
export class VarExporter {
    /**
     * The map of the Collection:Variable name to the Figma variable
     */
    private collectedFigmaVars: Map<string, Variable> = new Map();
    /**
     * The map of the Figma variable ID to the Collection:Variable
     */
    private collectedFigmaIdsToVars: Map<string, string> = new Map();
    /**
     * The map of the collection name to the Figma collection
     */
    private collectedFigmaCollections: Map<string, VariableCollection> =
        new Map();
    /**
     * The list of collection names only
     */
    private collectionNamesOnly: Map<string, string> = new Map();

    /**
     * Default constructor
     */
    constructor() {}

    /**
     * Collects the variables from Figma and stores them in the class
     */
    async collectFigmaVars() {
        this.collectedFigmaVars = new Map();
        this.collectedFigmaCollections = new Map();

        let collectedVars = await figma.variables.getLocalVariablesAsync();

        if (collectedVars.length === 0) {
            console.log("No variables found in the current file");
            return;
        } else {
            console.log(`Found ${collectedVars.length} variables`);
        }

        // We need to get the collection name of each variable and put it in the format of Collection:Variable
        for (const variable of collectedVars) {
            const collectionId = variable.variableCollectionId;
            const collection =
                await figma.variables.getVariableCollectionByIdAsync(
                    collectionId,
                );
            const collectionName = collection ? collection.name : "Unknown";
            const varName = `${collectionName}:${variable.name}`;
            this.collectedFigmaVars.set(varName, variable);
            this.collectedFigmaIdsToVars.set(variable.id, varName);

            // Also go through and get information about the collections
            if (collection) {
                this.collectedFigmaCollections.set(collectionName, collection);
                this.collectionNamesOnly.set(collectionId, collectionName);
            }
        }
        console.log(this.collectedFigmaVars);
    }

    /**
     * Gets the list of Figma collections that were collected. Just the names.
     *
     * @returns The list of Figma collections
     */
    getFigmaCollections() {
        return this.collectionNamesOnly;
    }

    /**
     * Exports the collected variables to a JSON file
     *
     * @param collectionToExport The collection to export
     * @param resolveAlias If true, then resolve the alias to the actual value
     * @param colorFormat The format of the color to export
     */
    varsToJson(collectionToExport: string, colorFormat: ColorFormat): string {
        /**
         * Convert the collected variables into the JSON
         *
         * For the collection we need to have the name, description, modes, and variables.
         *
         * When we have a variable such as button/color/background/primary it should
         * {
         *     "button": {
         *          "color": {
         *              "background": {
         *                  "primary": {
         *                      <variable information>
         *                  }
         *              }
         *          }
         *      }
         * }
         *
         * For variables, we need to have the type, description (if any), and the values
         * The values should be in the format of { mode: value }
         * The actual value should be a string, number, boolean, or color. If resolveAlias is true, then
         * we should resolve the alias to the actual value.
         *
         * If the value is a color, then we should convert it to the given color format
         */

        // The list of collections to export. It will only be one collection
        const jsonExport: VarImporterTemplate = {
            collections: [],
        };

        // Get the associated Figma collection
        const figmaCollection =
            this.collectedFigmaCollections.get(collectionToExport);

        if (!figmaCollection) {
            throw new VarImporterError(
                `Could not find collection ${collectionToExport}`,
            );
        }

        const collection: Collection = {
            name: collectionToExport,
            modes: figmaCollection?.modes.map((mode) => mode.name) || [],
            variables: {},
        };

        jsonExport.collections.push(collection);

        // Get the variables associated with the collection. We need to get the variable for the collection only
        const collectionVars = this.collectedFigmaVars.entries();

        for (const [key, variable] of collectionVars) {
            const collectionName = getCollectionName(key);
            const varName = getVariableName(key);

            if (collectionName === collectionToExport) {
                // Get the variable information
                const varInfo = this.getVariableInfo(
                    variable,
                    colorFormat,
                    figmaCollection.modes,
                );
                const varPath = varName.split("/");
                let currentVar = collection.variables;

                // Go through the path of the variable to set the value
                for (let i = 0; i < varPath.length; i++) {
                    if (i === varPath.length - 1) {
                        // We are at the end of the path, so set the variable information
                        currentVar[varPath[i]] = varInfo;
                    } else {
                        // We are not at the end of the path, so check if the key exists
                        // If it does, then set the currentVar to that key. If it does not
                        // then create a new object and set the currentVar to that
                        if (currentVar[varPath[i]]) {
                            currentVar = currentVar[
                                varPath[i]
                            ] as ConfigVariable;
                        } else {
                            currentVar[varPath[i]] = {};
                            currentVar = currentVar[
                                varPath[i]
                            ] as ConfigVariable;
                        }
                    }
                }
            }
        }

        return JSON.stringify(jsonExport, null, 4);
    }

    /**
     * For each Figma variable, go through and convert the variable into the JSON format.
     *
     * @param variable The Figma variable to convert
     * @param resolveAlias Whether or not to resolve the alias to the actual value
     * @param colorFormat The format of colors to export
     * @param modes The list of modes that are to the variable.
     * @returns The JSON representation of the variable
     */
    private getVariableInfo(
        variable: Variable,
        colorFormat: ColorFormat,
        modes: Array<{ modeId: string; name: string }>,
    ): ConfigVariableValue {
        // Create the variable information
        const varInfo: ConfigVariableValue = {
            type: convertFigmaTypeToType(variable.resolvedType),
            values: {},
        };

        // Go through each mode and get the value
        const modeValues = variable.valuesByMode;

        modes.forEach((mode) => {
            const value = modeValues[mode.modeId];
            varInfo.values[mode.name] = this.variableValueToVarType(
                value,
                colorFormat,
            );
        });

        return varInfo;
    }

    /**
     * Converts the Figma variable type to the actual type. If it is a color, then use the given format.
     *
     * @param value The Figma VariableValue
     * @param colorFormat The color format to convert to (if it is a color)
     * @returns
     */
    private variableValueToVarType(
        value: VariableValue,
        colorFormat: ColorFormat,
    ): VarType {
        // Do a switch case based on the type of the value
        switch (typeof value) {
            case "string":
                return value.toString();
            case "number":
                return value as number;
            case "boolean":
                return value as boolean;
            case "object":
                // It's an object so it could be an RGB, RGBA, or VariableAlias
                if ("r" in value && "g" in value && "b" in value) {
                    // It is an RGB value
                    return this.convertRgbToColor(value as RGBA, colorFormat);
                } else {
                    // It is a variable alias, so depending on the setting either find the value associated with the ID
                    // or try to resolve it to the actual value
                    // In order to try to resolve it, we need to take the ID, find the variable, and keep going until we find the actual value
                    // If we can't find the value, then look up the ID in the map of Figma IDs to variables and return that
                    // If we can't find that, then return a default value
                    return this.resolveVariableAlias(value as VariableAlias);
                }
        }
    }

    private convertRgbToColor(rgb: RGBA, colorFormat: ColorFormat): string {
        // Convert the RGB value to the color format. Since there is no alpha provided, if it is HSLA or RGBA, just make HSL/RGB
        switch (colorFormat) {
            case ColorFormat.HEXA:
                return convertRgbaToHexa(rgb.r, rgb.g, rgb.b, rgb.a);
            case ColorFormat.HEX:
                return convertRgbToHex(rgb.r, rgb.g, rgb.b);
            case ColorFormat.HSLA:
                return convertRgbaToHsla(rgb.r, rgb.g, rgb.b, rgb.a);
            case ColorFormat.HSL:
                return convertRgbToHsl(rgb.r, rgb.g, rgb.b);
            case ColorFormat.RGBA:
                return convertRgbaToRgba(rgb.r, rgb.g, rgb.b, rgb.a);
            case ColorFormat.RGB:
                return convertRgbToRgb(rgb.r, rgb.g, rgb.b);
        }
    }

    private resolveVariableAlias(alias: VariableAlias): string {
        // In Figma, the VariableAlias will be the Figma ID to the variable, so look it up in the map and return the Collection:Variable format
        // If we are resolving it, try to keep finding the variable until we either reach the actual value or we can't go any further. If we can't
        // then return a default value
        return this.collectedFigmaIdsToVars.get(alias.id) || "";
    }
}
