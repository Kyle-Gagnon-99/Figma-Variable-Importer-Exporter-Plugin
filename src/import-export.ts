/**
 * Error codes that relate to the validation of an incoming variables file (JSON)
 */
export enum ValidationErrorCodes {
    // Pretty bad. Not going well here
    UNKOWN_ERROR = "UNKOWN_ERROR",

    COLLECTION_NAME_STRING = "COLLECTION_NAME_STRING",
    COLLECTION_MODES_ARRAY = "COLLECTION_MODES_ARRAY",
    COLLECTION_DESCRIPTION_STRING = "COLLECTION_DESCRIPTION_STRING",

    COLLECTION_NOT_FOUND = "COLLECTION_NOT_FOUND",

    INVALID_COLLECTION_NAME = "INVALID_COLLECTION_NAME",
    INVALID_MISSING_MODES = "INVALID_MISSING_MODES",
    INVALID_VARIABLE_TYPE = "INVALID_VARIABLE_TYPE",
    INVALID_VALUE_TYPE = "INVALID_VALUE_TYPE",
    INVALID_COLOR_FORMAT = "INVALID_COLOR_FORMAT",
    INVALID_COLLECTION_FOR_VARIABLE = "INVALID_COLLECTION_FOR_VARIABLE",
    INVALID_HEX_VALUE = "INVALID_HEX_VALUE",
    INVALID_RGB_VALUE = "INVALID_RGB_VALUE",
    INVALID_RGBA_VALUE = "INVALID_RGBA_VALUE",
    INVALID_HSL_VALUE = "INVALID_HSL_VALUE",
    INVALID_HSLA_VALUE = "INVALID_HSLA_VALUE",
    INVALID_NUMBER_VALUE = "INVALID_NUMBER_VALUE",
    INVALID_BOOLEAN_VALUE = "INVALID_BOOLEAN_VALUE",

    TYPE_MISMATCH = "TYPE_MISMATCH",

    MISSING_COLLECTION_NAME = "MISSING_COLECTION_NAME",
    MISSING_VARIABLE_TYPE = "MISSING_VARIABLE_TYPE",
    MISSING_VARIABLE_VALUES = "MISSING_VARIABLE_VALUES",
    MISSING_VARIABLE_NAME = "MISSING_VARIABLE_NAME",
    MISSING_VARIABLE_ALIAS = "MISSING_VARIABLE_ALIAS",

    UNABLE_TO_ADD_MODE = "UNABLE_TO_ADD_MODE",
}

export interface ValidationError {
    variableName: string;
    message: string;
    errorCode: string;
}

export enum MessageType {
    UPLOAD_FILE = "UPLOAD_FILE",
    VALIDATION_ERRORS = "VALIDATION_ERRORS",
    GET_SETTINGS = "GET_SETTINGS",
    GET_SETTINGS_RESPONSE = "GET_SETTINGS_RESPONSE",
    GET_SETTINGS_ERROR = "GET_SETTINGS_ERROR",
    SET_SETTINGS = "SET_SETTINGS",
    SET_SETTINGS_RESPONSE = "SET_SETTINGS_RESPONSE",
    SET_SETTINGS_ERROR = "SET_SETTINGS_ERROR",
    EXPORT_VARIABLES = "EXPORT_VARIABLES",
    EXPORT_VARIABLES_RESPONSE = "EXPORT_VARIABLES_RESPONSE",
    GET_COLLECTIONS = "GET_COLLECTIONS",
    GET_COLLECTIONS_RESPONSE = "GET_COLLECTIONS_RESPONSE",
    RESIZE_WINDOW = "RESIZE_WINDOW",
    CHANGE_VIEW_REQUEST = "CHANGE_VIEW_REQUEST",
}

/**
 * The list of settings to use when importing / exporting
 *
 * - failOnNullAlias: boolean - Used to determine if the validation should fail if it could not find the referenced value
 * - numberFallback: number - Used as the default number if the referenced value was not found
 * - colorFallback: string - Used as the default color if the referenced value was not found
 * - booleanFallback: boolean - Used as the default boolean if the referenced value was not found
 * - stringFallback: string - Used as the default string if the referenced value was not found
 */
export interface UserSettings {
    failOnNullAlias: boolean;
    numberFallback: number;
    colorFallback: string;
    booleanFallback: boolean;
    stringFallback: string;
    extendCollections: boolean;
}

export interface ErrorDetails {
    title: string;
    message: string;
}

export interface PluginMessageData {
    pluginMessage: {
        type: MessageType;
        data: any;
    };
    pluginId: string;
}

export enum ColorFormat {
    HEX = "HEX",
    RGB = "RGB",
    HSL = "HSL",
    HSLA = "HSLA",
    RGBA = "RGBA",
    HEXA = "HEXA",
}

export interface ExportVariablesRequest {
    /**
     * The collection to export
     */
    collection: string;
    /**
     * Whether or not we should resolve aliases to their values
     */
    resolveAlias: boolean;
    /**
     * The color format to use when exporting colors
     */
    colorFormat: ColorFormat;
    /**
     * The map of collection names to the user selected default mode
     */
    collectionModeMap: Map<string, string>;
}

export interface ResizeRequest {
    w: number;
    h: number;
}

export enum ChangeViewOptions {
    IMPORT = "import-vars",
    EXPORT = "export-vars",
}

export interface ChangeViewListener {
    detail: {
        view: ChangeViewOptions;
    };
}

export interface ImportVarsRequest {
    json: string;
    useExistingCollections: boolean;
}
