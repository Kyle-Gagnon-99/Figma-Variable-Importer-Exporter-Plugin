/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * File: code.ts
 * Author: Kyle Gagnon
 * Date Added: 03/23/2024
 * Description: This is the backend code for the variables-plugin. Here we will
 *              take in a JSON file, parse it, and create the variables.
 */
import {
    ErrorDetails,
    MessageType,
    UserSettings,
    ValidationError,
    ValidationErrorCodes,
} from "../src/import-export";

/**
 * Typing
 */

/**
 * The theme mode is a string
 */
type Mode = string;

/**
 * The value of a variable can be a string, boolean, or number
 */
type VarType = string | boolean | number;

/**
 * The value of a variable is the object where the key is a mode of the collection
 * and the value is a VarType.
 */
type VarValue = { [mode: Mode]: VarType };

/**
 * The type that describes the map of full variable names and their value
 */
type VarMap = Map<string, ConfigVariableValue>;

/**
 * The map of the collection names to the available modes to that collection
 */
type ModeMap = Map<string, Mode[]>;

/**
 * The map of the collection to the list of variables in that collection
 */
type VarByCollectionMap = Map<string, string[]>;

/**
 * The available variable types
 */
type FigmaVarTypes = "color" | "number" | "boolean" | "string";

/**
 * A ConfigVariableValue is the actual information about the variable
 */
interface ConfigVariableValue {
    type: FigmaVarTypes;
    description?: string;
    values: VarValue;
}

/**
 * A ConfigVariable may be another nested ConfigVariable or an actual variable
 */
interface ConfigVariable {
    [key: string]: ConfigVariable | ConfigVariableValue;
}

/**
 * A collection holds a group of variables along with any descriptive information
 */
interface Collection {
    name: string;
    description?: string;
    modes: Mode[];
    variables: ConfigVariable;
}

/**
 * A VarImporterTemplate is a list of Collection
 */
interface VarImporterTemplate {
    collections: Collection[];
}

/**
 * The error class for the plugin
 */
class VarImporterError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "VarImporter";
    }
}

const SETTINGS_KEY = "import-export-settings";

/**
 * The overall configuration file information from the JSON
 */
class VarImporter {
    private collections: Collection[];
    private collectionNames: string[] = [];
    private varMap: VarMap = new Map();
    private modeMap: ModeMap = new Map();
    private varByCollection: VarByCollectionMap = new Map();
    private validationErrors: ValidationError[] = [];
    private collectedFigmaVars: Map<string, Variable> = new Map();
    private existingCollections: Map<string, VariableCollection> = new Map();

    /**
     * The constructor. It parses and validates the JSON into the class.
     *
     * @param collections The list of collections from the JSON config
     */
    constructor(collections: Collection[]) {
        // Import existing Figma collections and variables
        this.collections = collections;
        this.importFigmaVariables().then(() => {
            collections.forEach((collection) => {
                this.collectionNames.push(collection.name);
                this.modeMap.set(collection.name, collection.modes);
            });
            this.varMap = this.collectVariables();
            this.setVarsByCollectionMap();

            // Validate the config
            this.validateConfig();

            // Import the variables
            this.importVariables();

            // Close the plugin after if there are no validaiton errors
            if (!this.hasValidationErrors()) {
                figma.closePlugin();
                figma.notify("Imported variables!");
            }
        });
    }

    private async importFigmaVariables() {
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
            console.log(variable);

            // We also need to go through and get each collection and their ID
            // So that we can allow for users to extend existing collections
            // with new variables
            if (collection) {
                console.log(
                    `Found collection ${collection.name}. Adding to existingCollections`,
                );
                this.existingCollections.set(collectionName, collection);
            }
        }
        console.log(this.collectedFigmaVars);

        this.existingCollections.forEach((_, key) => {
            console.log(`Existing Collection: ${key}`);
        });
    }

    /**
     * Takes in the overall config and gets the map of all variables with their values.
     *
     * @returns The map of CommonCollectionName:Variable to the values
     */
    private collectVariables(): VarMap {
        const variableMap = new Map<string, ConfigVariableValue>();

        this.collections.forEach((collection) => {
            this.traverseVariables(
                collection.name,
                collection.variables,
                "",
                variableMap,
            );
        });

        console.log(variableMap);
        return variableMap;
    }

    /**
     * Traverses the configuration to get all nested variables
     *
     * @param collectionName The name of the current collection
     * @param variable The ConfigVariable type (could be an actual variable or have a nested value)
     * @param path The current path the variable is on (the path is defined as each key from top to bottom separated by a /)
     * @param variablesMap The current map of the variables to add to
     */
    private traverseVariables(
        collectionName: string,
        variable: ConfigVariable,
        path: string,
        variablesMap: VarMap,
    ) {
        Object.keys(variable).forEach((key) => {
            const currentPath = path ? `${path}/${key}` : key;
            const value = variable[key];

            if ("type" in value) {
                const mapKey = `${collectionName}:${currentPath}`;
                variablesMap.set(mapKey, value as ConfigVariableValue);
            } else {
                this.traverseVariables(
                    collectionName,
                    value as ConfigVariable,
                    currentPath,
                    variablesMap,
                );
            }
        });
    }

    /**
     * Sets up the map of collection name to the list of variables in the collection
     */
    private setVarsByCollectionMap() {
        if (this.varMap) {
            this.varMap.forEach((_, key) => {
                const fromCollection = getCollectionName(key);

                // Check if fromCollection successfully got the collection name from the key
                if (!fromCollection) {
                    this.validationErrors.push({
                        variableName: key,
                        message: `Unable to get a collection reference from ${key}`,
                        errorCode: ValidationErrorCodes.MISSING_COLLECTION_NAME,
                    });
                    return;
                }

                // Get the potential key if there is one
                let varList = this.varByCollection.get(fromCollection);
                if (varList) {
                    // The key exists, so does the list
                    varList.push(key);
                } else {
                    // The key does not exist, so create a new list, push the value, and create the key with the value of the list
                    varList = [];
                    varList.push(key);
                    this.varByCollection.set(fromCollection, varList);
                }
            });
        } else {
            // Severe error. Need to exit the plugin now
            throw new VarImporterError("varMap is empty! (Error Code 0x01)");
        }
    }

    /**
     * Validates the variables and class to make sure it is in the expected format.
     */
    private validateConfig() {
        this.collections.forEach((collection) =>
            this.validateCollection(collection),
        );
    }

    private validateCollection(collection: Collection) {
        // Check to make sure the name of the collection is actually a string
        if (typeof collection.name !== "string") {
            this.validationErrors.push({
                variableName: "",
                message: "Collection name must be a string",
                errorCode: ValidationErrorCodes.COLLECTION_NAME_STRING,
            });
        }

        // Check to make sure the modes key is actually an array
        if (!Array.isArray(collection.modes)) {
            this.validationErrors.push({
                variableName: "",
                message: `Collection (${collection.name}) must have an array of strings for the modes`,
                errorCode: ValidationErrorCodes.COLLECTION_MODES_ARRAY,
            });
        }

        // Check if there is a description and then check to make sure it is a string if there is one
        if (
            collection.description &&
            typeof collection.description !== "string"
        ) {
            this.validationErrors.push({
                variableName: "",
                message: `The description for ${collection.name} must be a string`,
                errorCode: ValidationErrorCodes.COLLECTION_DESCRIPTION_STRING,
            });
        }

        // Validate the variables
        const getVariableList = this.varByCollection.get(collection.name);

        if (getVariableList) {
            getVariableList.forEach((variable) => {
                const varValue = this.varMap.get(variable);
                if (varValue) {
                    this.validateVariable(variable, varValue);
                }
            });
        }
    }

    private validateVariable(
        variableName: string,
        variable: ConfigVariableValue,
    ) {
        // 1. Check for modes matching collection's mode
        console.log(`Validating ${variableName}`);
        const collectionFromVar = getCollectionName(variableName);

        if (!collectionFromVar) {
            this.validationErrors.push({
                variableName: variableName,
                message: `Unable to get a collection reference from ${variableName}`,
                errorCode: ValidationErrorCodes.MISSING_COLLECTION_NAME,
            });
            return;
        }

        const collectionModes = this.modeMap.get(collectionFromVar);

        if (!collectionModes) {
            this.validationErrors.push({
                variableName: variableName,
                message: `Unable to find ${variableName} in ${collectionFromVar}`,
                errorCode: ValidationErrorCodes.INVALID_COLLECTION_FOR_VARIABLE,
            });
            return;
        }

        if (
            !Object.keys(variable.values).every((mode) =>
                collectionModes.includes(mode),
            )
        ) {
            this.validationErrors.push({
                variableName: variableName,
                message: `There are missing or invalid modes`,
                errorCode: ValidationErrorCodes.INVALID_MISSING_MODES,
            });
        }

        // 2. Type validation
        if (
            !["color", "number", "boolean", "string", "alias"].includes(
                variable.type,
            )
        ) {
            this.validationErrors.push({
                variableName: variableName,
                message: `Invalid variable type ${variable.type}`,
                errorCode: ValidationErrorCodes.INVALID_VALUE_TYPE,
            });
        }

        // 3. Check the actual values
        const valueType = variable.type;
        Object.entries(variable.values).forEach(([mode, value]) => {
            const variableValueType = typeof value;
            if (!["string", "number", "boolean"].includes(variableValueType)) {
                throw new VarImporterError(
                    `Incorrect value type ${variableValueType}`,
                );
            }

            // If a boolean or number is given, then check to make sure that it is not a reference and that they are what they are
            if (variableValueType === "boolean") {
                if (valueType !== "boolean") {
                    this.validationErrors.push({
                        variableName: variableName,
                        message: `Expected the variable to be a boolean but got ${valueType}`,
                        errorCode: ValidationErrorCodes.INVALID_VALUE_TYPE,
                    });
                }
            }

            if (variableValueType === "number") {
                if (valueType !== "number") {
                    this.validationErrors.push({
                        variableName: variableName,
                        message: `Expected the variable to be a number but got ${valueType}`,
                        errorCode: ValidationErrorCodes.INVALID_VALUE_TYPE,
                    });
                }
            }

            // If it is a string and the type is not a string or color (a number or boolean) then make sure it is not an alias and then convert
            if (
                variableValueType === "string" &&
                valueType !== "string" &&
                valueType !== "color"
            ) {
                // This is a string that is not a string or color type, so it could be an alias. Check if it is a reference
                // if it is not, we then need to try to convert it to the correct type
                if (!matchesFormat(value as string)) {
                    if (valueType === "number") {
                        const numberValue = parseFloat(value as string);
                        if (isNaN(numberValue)) {
                            this.validationErrors.push({
                                variableName: variableName,
                                message: `${value} is not a number`,
                                errorCode:
                                    ValidationErrorCodes.INVALID_NUMBER_VALUE,
                            });
                        }
                    } else if (valueType === "boolean") {
                        if (value !== "true" && value !== "false") {
                            this.validationErrors.push({
                                variableName: variableName,
                                message: `${value} is not a boolean`,
                                errorCode:
                                    ValidationErrorCodes.INVALID_BOOLEAN_VALUE,
                            });
                        }
                    }
                }
            }

            // 4. Now check the color format
            if (valueType === "color") {
                // The color matches, so figure which color format it is and validate the values in it
                if (!matchesFormat(value as string)) {
                    this.validateColor(value as string, variableName);
                }
            }

            // Now we need to check the references
            // If the setting is set to fail on null alias, then we need to check if the reference is valid
            // If it is not, then we need to add an error
            // Otherwise we should set a fallback value
            if (matchesFormat(value as string)) {
                if (
                    !this.varMap.has(value as string) &&
                    !this.collectedFigmaVars.has(value as string)
                ) {
                    if (globalUserSettings.failOnNullAlias) {
                        this.validationErrors.push({
                            variableName: variableName,
                            message: `Reference ${value} not found`,
                            errorCode:
                                ValidationErrorCodes.MISSING_VARIABLE_ALIAS,
                        });
                    } else {
                        // Set the fallback value
                        if (valueType === "number") {
                            variable.values = {
                                ...variable.values,
                                [mode]: globalUserSettings.numberFallback,
                            };
                        } else if (valueType === "boolean") {
                            variable.values = {
                                ...variable.values,
                                [mode]: globalUserSettings.booleanFallback,
                            };
                        } else if (valueType === "string") {
                            variable.values = {
                                ...variable.values,
                                [mode]: globalUserSettings.stringFallback,
                            };
                        } else if (valueType === "color") {
                            variable.values = {
                                ...variable.values,
                                [mode]: globalUserSettings.colorFallback,
                            };
                        }
                    }
                }
            }
        });
    }

    private validateColor(color: string, variableName: string) {
        if (isHexColor(color)) {
            // Validate Hex value
            // If it is a hex value, then it will always be in the correct range
            return;
        } else if (isRgbColor(color)) {
            // Validate RGB value
            if (!isValidRgb(color)) {
                this.validationErrors.push({
                    variableName: variableName,
                    message: `${color} is an invalid RGB value`,
                    errorCode: ValidationErrorCodes.INVALID_RGB_VALUE,
                });
            }
        } else if (isHslColor(color)) {
            if (!isValidHsl(color)) {
                this.validationErrors.push({
                    variableName: variableName,
                    message: `${color} is an invalid HSL value`,
                    errorCode: ValidationErrorCodes.INVALID_HSL_VALUE,
                });
            }
        } else {
            this.validationErrors.push({
                variableName: variableName,
                message: `Unkown color format`,
                errorCode: ValidationErrorCodes.INVALID_COLOR_FORMAT,
            });
        }
    }

    /**
     * Gets the list of Collection objects
     *
     * @returns Returns the associated collection
     */
    getCollections(): Collection[] {
        return this.collections;
    }

    /**
     * Gets the map of variable names to values
     *
     * @returns The variable map
     */
    getVarMap(): VarMap {
        return this.varMap;
    }

    /**
     * Gets the map of collection names to the available modes
     *
     * @returns The mode map
     */
    getModeMap(): ModeMap {
        return this.modeMap;
    }

    /**
     * Gets a value from the varMap. The varMap is a map of Collection:Variable names to the actual values.
     * If the key does not exist, an error is thrown.
     *
     * @param key The key to get from the varMap
     * @throws Throws an error if attempting to get a key that does not exist
     * @returns The resulting value from the key
     */
    getValueFromMap(key: string): ConfigVariableValue {
        const returnValue = this.varMap.get(key);
        if (returnValue) {
            return returnValue;
        } else {
            throw new VarImporterError(
                `Key (${key}) not found in map (Error Code 0x00)`,
            );
        }
    }

    /**
     * Checks if there are validation errors
     *
     * @returns A boolean that says if there are validation errors or not
     */
    hasValidationErrors(): boolean {
        return this.validationErrors.length > 0;
    }

    /**
     * Gets the list of validation errors
     *
     * @returns The list of errors
     */
    getValidationErrors(): ValidationError[] {
        return this.validationErrors;
    }

    /**
     * Actually imports the variables after validation
     *
     */
    private importVariables() {
        // Exit early if there are any validation errors
        if (this.hasValidationErrors()) {
            return;
        }

        // The map of variables that have absolute values (no references) to their name
        const finalVariables: Map<string, Variable> = new Map();
        // The map of variables that need to have their alias resolved (which should be found in the finalVariables map)
        const varsNeedReferences: Map<string, Variable> = new Map();

        // First create the collections and add the modes
        const figmaCollections: Map<string, VariableCollection> = new Map();
        // Log each key of existing collections since the VM gets rid of the memory after the plugin is done executing
        this.existingCollections.forEach((_, key) => {
            console.log(`Existing Collection: ${key}`);
        });
        this.collections.forEach((collection) => {
            // Here we should either create a new collection or add an existing one to the map
            // If the global setting of extending collections is one, then that means we need
            // to check if the collection exists. If it does, then we add that collection to the
            // collection map, otherwise we create a new one. If the setting is false, then we
            // always create a new collection.
            let createCollection = true;

            console.log(`Checking if ${collection.name} exists already`);
            const existingCollection = this.existingCollections.get(
                collection.name,
            );
            if (existingCollection) {
                // Check if there is a new mode in the config that is not in the existing collection
                // If there is, we need to create that new mode. All existing variables will have
                // their new mode value set to some Figma default value
                const newModes = collection.modes.filter(
                    (mode) =>
                        !existingCollection.modes.some(
                            (existingMode) => existingMode.name === mode,
                        ),
                );

                // Add the new modes
                if (newModes.length > 0) {
                    newModes.forEach((mode) => {
                        existingCollection.addMode(mode);
                    });
                }

                figmaCollections.set(collection.name, existingCollection);
                createCollection = false;
            } else {
                console.log(
                    `Could not find existing collection ${collection.name}`,
                );
            }

            if (createCollection) {
                console.log(
                    `Need to create a new collection ${collection.name}`,
                );
                const createdCollection =
                    figma.variables.createVariableCollection(collection.name);
                collection.modes.forEach((mode) => {
                    createdCollection.addMode(mode);
                });

                // Remove the default created mode called Mode 1
                createdCollection.modes.forEach((mode) => {
                    if (mode.name === "Mode 1") {
                        createdCollection.removeMode(mode.modeId);
                    }
                });

                figmaCollections.set(collection.name, createdCollection);
            }
        });

        console.log(figmaCollections);

        // Next, create a variable in the collections. To do this
        // grab the map of collections to the list of variables of that
        // collection. Create all primitive (non-alias) variables first.
        this.collections.forEach((collection) => {
            const varList = this.varByCollection.get(collection.name);
            // If we ever reach here, there is something seriously wrong. We can't recover.
            if (!varList) {
                console.error(
                    "Import/Export - Severe Error: Did not find the collection name in the varByCollection map",
                );
                return;
            }
            console.log(varList);

            // Get the VariableCollection that is associated with this collection name
            const varCollection = figmaCollections.get(collection.name);
            if (!varCollection) {
                // If we ever reach here, there is something seriously wrong. We can't recover.
                console.error(
                    `Import/Export - Severe Error: Could not find VariableCollection of ${collection.name}`,
                );
                return;
            }

            // Get the variable name
            varList.forEach((fullVar) => {
                const varName = getVariableName(fullVar);
                console.log(`Working on ${varName} from ${collection.name}`);

                // Get the ConfigValue from the var name
                const varValue = this.varMap.get(fullVar);

                if (!varValue) {
                    // If we ever reach here, there is something seriously wrong. We can't recover.
                    console.error(
                        `Import/Export - Severe Error: Did not find the ${fullVar} in the varMap!`,
                    );
                    return;
                }

                console.log(varValue);

                // We need to create the variable
                // Get the figma variable if it already exists. If it does then we are just updating
                // Otherwise we are creating a new variable
                let createdVariable: Variable | undefined;
                if (this.collectedFigmaVars.has(fullVar)) {
                    createdVariable = this.collectedFigmaVars.get(fullVar);
                } else {
                    createdVariable = figma.variables.createVariable(
                        varName,
                        varCollection,
                        convertTypeToFigmaType(varValue.type),
                    );
                }

                // Make sure the variable was created
                if (!createdVariable) {
                    console.error(
                        `Import/Export - Severe Error: Could not create variable ${varName}`,
                    );
                    return;
                }

                // Set the value if it is a primitive (not a reference)
                // If it is a reference, we need to keep track that we need
                // to create variable aliases of it. After we create and
                // give values to all primitives, then we can go back and
                // assign aliases, as it will have either already been created
                // or we are using a fallback anyways (since this should have been caugth in validation)

                // We need to set the value of each mode
                varCollection.modes.forEach((mode) => {
                    const modeValue = varValue.values[mode.name];

                    // Add this to the list of variables that need to be resolved
                    if (matchesFormat(modeValue as string)) {
                        console.log(
                            `${fullVar} is a reference. Skipping for now.`,
                        );
                        varsNeedReferences.set(fullVar, createdVariable);
                        return;
                    }

                    // Sets the variable value
                    this.setVariableValue(
                        varValue.type,
                        createdVariable,
                        modeValue,
                        mode.modeId,
                    );

                    // Add this newly created variable to a list of final variables
                    finalVariables.set(fullVar, createdVariable);
                });
            });
        });

        console.log(varsNeedReferences);

        while (varsNeedReferences.size > 0) {
            // Now go through the map of unresolved references and get the variable and assign it. It is still possible
            // that one of value of the modes is not a reference, but it should have already resolved, so we can ignore it
            varsNeedReferences.forEach((variable, varName) => {
                // Go through each mode of the variable
                const varOnly = getVariableName(varName);
                const collectionName = getCollectionName(varName);

                let varResolved = true;

                if (!varOnly || !collectionName) {
                    console.error(
                        `Error in trying to get the variable name or collection from ${varName}`,
                    );
                    return;
                }

                const modes = this.getModeMap().get(collectionName);
                console.log(`Working on ${varName} to resolve`);

                // Get the ConfigValue from the var name
                const varValue = this.varMap.get(varName);

                if (!varValue) {
                    // If we ever reach here, there is something seriously wrong. We can't recover.
                    console.error(
                        `Import/Export - Severe Error: Did not find the ${varName} in the varMap!`,
                    );
                    return;
                }

                // Now go through the modes to be able to set it. We can skip ones that are not a reference
                modes?.forEach((mode) => {
                    const modeVal = varValue.values[mode];
                    if (!modeVal || !matchesFormat(modeVal as string)) {
                        console.log(
                            `Already have a value for ${varName} for mode ${mode}`,
                        );
                        // Exit now since we don't need to resolve it
                        return;
                    }

                    // Retreive the varName from the already resolved variables
                    let referencedVar = finalVariables.get(modeVal as string);

                    if (!referencedVar) {
                        // Check if it is a reference to an already existing Figma variable
                        referencedVar = this.collectedFigmaVars.get(
                            modeVal as string,
                        );
                    }

                    // Now create an alias on the referenced variable
                    const varAlias = referencedVar
                        ? figma.variables.createVariableAlias(referencedVar)
                        : undefined;
                    if (!varAlias) {
                        varResolved = false;
                        console.error(
                            `The variable ${modeVal} could not be found in the already created variables.`,
                        );
                        return;
                    }

                    // Now we can assign the value of the mode we are working on
                    // We need the figma mode ID for this
                    const figmaCollection =
                        figmaCollections.get(collectionName);
                    if (figmaCollection) {
                        figmaCollection.modes.forEach((modeCollection) => {
                            if (modeCollection.name === mode) {
                                variable.setValueForMode(
                                    modeCollection.modeId,
                                    varAlias,
                                );
                            }
                        });
                    }
                });

                if (varResolved) {
                    finalVariables.set(varName, variable);
                    varsNeedReferences.delete(varName);
                }

                // Since we can have nested references (a variable can reference another variable who can reference another variable)
                // We need to add the resolved issues and run through the resolution again.
            });
        }
    }

    private setVariableValue(
        type: FigmaVarTypes,
        createdVariable: Variable,
        value: VarType,
        modeId: string,
    ) {
        switch (type) {
            case "string":
            case "number":
            case "boolean":
                createdVariable.setValueForMode(modeId, value);
                break;
            case "color":
                // Need to convert the color to RGB
                const convertedColor = figma.util.rgb(value as string);
                console.log(
                    `Setting values to ${convertedColor.r}, ${convertedColor.g}, ${convertedColor.b} (from ${value})`,
                );
                createdVariable.setValueForMode(modeId, {
                    r: convertedColor.r,
                    g: convertedColor.g,
                    b: convertedColor.b,
                });
                break;
        }
    }
}

// @ts-ignore
class VarExporter {
    private collectedFigmaVars: Map<string, Variable> = new Map();
    private collectedFigmaCollections: Map<string, VariableCollection> =
        new Map();

    constructor() {
        this.collectFigmaVars();
    }

    private async collectFigmaVars() {
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

            // Also go through and get information about the collections
            if (collection) {
                this.collectedFigmaCollections.set(collectionName, collection);
            }
        }
        console.log(this.collectedFigmaVars);
    }
}

/**
 * Gets the collection name from a variable in a Collection:Variable format
 *
 * @param input The string to get the collection name from
 * @returns The collection name
 */
function getCollectionName(input: string): string | null {
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
function getVariableName(input: string): string {
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
function matchesFormat(input: string): boolean {
    const pattern = /^[^\s:]+(?:\s+[^\s:]+)*:[^\s:]+(?:\s+[^\s:]+)*$/;
    return pattern.test(input);
}

/**
 * Checks if the given color is in the format of #([a-fA-F0-9]{2}){3} a.k.a #00AA00
 *
 * @param color The color to check
 * @returns True if is a hex color or false otherwise
 */
function isHexColor(color: string): boolean {
    return /^#(?:[0-9a-f]{3}){1,2}$/i.test(color);
}

/**
 * Checks if the given color is in the format of rgb(0, 0, 0)
 *
 * @param color The color to check
 * @returns True if is a rgb color or false otherwise
 */
function isRgbColor(color: string): boolean {
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
function isHslColor(color: string): boolean {
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
function isValidRgb(color: string): boolean {
    const [_, r, g, b] =
        color.match(
            /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i,
        ) || [];
    console.log(`Validating ${color} with ${r}, ${g}, ${b}`);
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
function isValidHsl(color: string): boolean {
    let [_, h, s, l] =
        color.match(
            /hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?s*,\s*(\d{1,3})%?s*\)/i,
        ) || [];

    [h, s, l] = [h, s.replace("%", ""), l.replace("%", "")];
    console.log(`Validating ${color} with ${h}, ${s}, ${l}`);
    return (
        parseInt(h) >= 0 &&
        parseInt(h) <= 360 &&
        parseInt(s) >= 0 &&
        parseInt(s) <= 100 &&
        parseInt(l) >= 0 &&
        parseInt(l) <= 100
    );
}

function convertTypeToFigmaType(type: FigmaVarTypes): VariableResolvedDataType {
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
 * Gets the user settings for this plugin that is stored locally. If
 * it does not exist (maybe a clear of local storage, new computer, or first time user)
 * then it returns the default settings.
 *
 * @returns A promise of the UserSettings stored locally
 */
async function getLocalUserSettings() {
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
async function setLocalUserSettings(settings: UserSettings) {
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
function getDefaultSettings(): UserSettings {
    return {
        failOnNullAlias: true,
        booleanFallback: false,
        numberFallback: 0,
        colorFallback: "#000000",
        stringFallback: "",
        extendCollections: true,
    };
}

// Clear the console
console.clear();

let globalUserSettings = getDefaultSettings();

getLocalUserSettings().then((value) => {
    globalUserSettings = value;
});

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
    height: 500,
    width: 400,
    themeColors: true,
});

figma.ui.onmessage = (msg: { type: string; data: any }) => {
    if (msg.type === MessageType.UPLOAD_FILE) {
        const jsonData: VarImporterTemplate = JSON.parse(
            msg.data,
        ) as VarImporterTemplate;

        // Disable no unused vars just because we don't really use it
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const themeSystem: VarImporter = new VarImporter(jsonData.collections);

        if (themeSystem.hasValidationErrors()) {
            const errors = themeSystem.getValidationErrors();
            themeSystem.getValidationErrors();
            figma.ui.postMessage({ type: "VALIDATION_ERRORS", data: errors });
        }
    } else if (msg.type === MessageType.GET_SETTINGS) {
        getLocalUserSettings()
            .then((settings) => {
                figma.ui.postMessage({
                    type: MessageType.GET_SETTINGS_RESPONSE,
                    data: settings,
                });
            })
            .catch(() => {
                figma.ui.postMessage({
                    type: MessageType.GET_SETTINGS_ERROR,
                    data: {
                        title: "Getting User Settings",
                        message: "Failed to get user settings",
                    } as ErrorDetails,
                });
            });
    } else if (msg.type === MessageType.SET_SETTINGS) {
        const userSettings = msg.data as UserSettings;
        setLocalUserSettings(userSettings)
            .then(() => {
                figma.ui.postMessage({
                    type: MessageType.SET_SETTINGS_RESPONSE,
                    data: userSettings,
                });
            })
            .catch(() => {
                figma.ui.postMessage({
                    type: MessageType.SET_SETTINGS_ERROR,
                    data: {
                        title: "Setting User Settings",
                        message: "Failed to set user settings",
                    } as ErrorDetails,
                });
            });
        globalUserSettings = userSettings;
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    //figma.closePlugin();
};
