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

/**
 * The structure of the validation errors
 */
export interface ValidationError {
    /**
     * The variable OR collection name.
     */
    variableName: string;
    /**
     * The error message.
     */
    message: string;
    /**
     * The error code.
     */
    errorCode: string;
}

/**
 * The different message types that get passed back and forth from the frontend to backend.
 */
export enum MessageType {
    UPLOAD_FILE = "UPLOAD_FILE",
    VALIDATION_ERRORS = "VALIDATION_ERRORS",
    EXPORT_VARIABLES = "EXPORT_VARIABLES",
    EXPORT_VARIABLES_RESPONSE = "EXPORT_VARIABLES_RESPONSE",
    GET_COLLECTIONS = "GET_COLLECTIONS",
    GET_COLLECTIONS_RESPONSE = "GET_COLLECTIONS_RESPONSE",
    RESIZE_WINDOW = "RESIZE_WINDOW",
    CHANGE_VIEW_REQUEST = "CHANGE_VIEW_REQUEST",
}

/**
 * The data structure of the message that is sent from the iframe (plugin) to the parent (Figma)
 */
export interface PluginMessageData {
    pluginMessage: {
        type: MessageType;
        data: any;
    };
    pluginId: string;
}

/**
 * The different types of color formats supported.
 */
export enum ColorFormat {
    HEX = "HEX",
    RGB = "RGB",
    HSL = "HSL",
    HSLA = "HSLA",
    RGBA = "RGBA",
    HEXA = "HEXA",
}

/**
 * The request to export variables.
 */
export interface ExportVariablesRequest {
    /**
     * The collection to export
     */
    collection: string;
    /**
     * The color format to use when exporting colors
     */
    colorFormat: ColorFormat;
}

/**
 * The request to resize the plugin.
 */
export interface ResizeRequest {
    /**
     * The width.
     */
    w: number;
    /**
     * The height.
     */
    h: number;
}

/**
 * The different views that correspond to the plugin command menu.
 */
export enum ChangeViewOptions {
    IMPORT = "import-vars",
    EXPORT = "export-vars",
}

/**
 * The request to import variables.
 */
export interface ImportVarsRequest {
    /**
     * The JSON content.
     */
    json: string;
    /**
     * Whether or not the existing collections should be used or new ones should be created.
     */
    useExistingCollections: boolean;
}
