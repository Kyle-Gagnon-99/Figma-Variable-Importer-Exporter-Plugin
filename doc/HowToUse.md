# Documentation for Variable Importer/Exporter

## Overview

The Variable Variable Importer/Exporter Plugin enables users to import and export variable collections within Figma. This functionality facilitates the definition and management of design tokens such as colors, spacings, and other attributes, ensuring consistency across different projects and among team members.

## JSON Structure

The JSON file used by the plugin consists of an array of collections. Each collection can include multiple variables defined under different modes and types.

### Collections

-   **name**: The name of the collection (e.g., "Colors", "Spacing Tokens").
-   **modes**: An array defining the modes applicable to the variables (e.g., "Default").
-   **variables**: An object containing the variables. Each variable can have multiple shades or sizes, each defined with its type and value(s).

NOTE: You can only have one mode per collection with a free account. To have multiple modes, you need to have a paid account. I have not gotten a chance to test the feature with a free account yet.

### Variable Types

Variables can be of the following types:

-   **color**: For color values.
-   **number**: For numeric values such as spacing.
-   **boolean**: For true/false values.
-   **string**: For textual values.

### Values

Each variable type can contain values defined for each mode. Values can be direct (e.g., a hex code for colors) or referenced from another variable using the format `CollectionName:VariableName/PropertyName`.

## Example JSON

Here is an example JSON file for a color and spacing collection:

```json
{
    "collections": [
        {
            "name": "Colors",
            "modes": ["Default"],
            "variables": {
                "Barn-Red": {
                    "50": {
                        "type": "color",
                        "values": { "Default": "#ffe6e6" }
                    },
                    "950": {
                        "type": "color",
                        "values": { "Default": "#3c0202" }
                    }
                }
            }
        },
        {
            "name": "Spacing Tokens",
            "modes": ["Default"],
            "variables": {
                "spacing": {
                    "0": { "type": "number", "values": { "Default": 0 } },
                    "768": { "type": "number", "values": { "Default": 768 } }
                },
                "padding": {
                    "sm": {
                        "type": "number",
                        "values": { "Default": "Spacing Tokens:spacing/4" }
                    }
                }
            }
        }
    ]
}
```

## Importing Variables

To import variables into Figma:

1. **Prepare Your JSON File**: Construct your JSON file according to the structure detailed above, including all necessary variable collections.
2. **Use the Plugin**: Open the plugin in Figma and use the import function to select and load your JSON file. The plugin will parse the JSON and create the corresponding variables in Figma.

## Exporting Variables

To export variables from Figma:

1. **Select Collection**: Use the plugin interface to select the collection you wish to export.
2. **Choose Color Format**: Specify the color format for your export (Hex, RGB, HSL, with or without alpha).
3. **Export**: Initiate the export process, and the plugin will generate a JSON file representing the current state of the selected variables in the chosen color format. This file can be used in other projects or shared with team members.

## Tips for Effective Usage

-   **Consistency is Key**: Maintain consistent naming conventions for your collections and variables to simplify management and referencing.
-   **Leverage Referencing**: Use references to link variables, enabling a scalable and easily updatable design system.
-   **Regular Exports**: Regularly export your variable collections to keep backups and ensure that team members are working with the most current design tokens.
