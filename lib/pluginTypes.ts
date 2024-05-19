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
