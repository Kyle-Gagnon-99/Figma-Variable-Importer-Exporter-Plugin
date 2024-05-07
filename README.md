# Variable Importer / Exporter

Variable Importer / Exporter is a FREE open source Figma plugin that allows you to import and export variables from/to Figma. Using a JSON file, you can import variables to Figma and export them back to JSON. It supports all variable types (as of 05/06/2024). You can use it to import/export variables with your existing variables and collections!

The plugin is not yet available for the Figma community, but you are able to clone and build this plugin yourself.

## Note

Please note that this plugin does support multiple modes for each collection. Multiple modes is a paid feature in Figma. I have not tested this plugin when using a Figma account that does not have multiple modes. I will add error handling for this in the future.

## Installation

1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Open Figma
5. Go to `Plugins` -> `Development` -> `New Plugin...`
6. Click on `Click to choose a manifest.json file`
7. Select the `manifest.json` file in the root of this repository
8. Click on `Create new plugin`
9. You should now see the plugin in the plugins menu

## Future

The plugin is still in development. This will be added to the Figma community when at least the export functionality is working. Currently only the import functionality is working.

## How to use

How to use the plugin will be written here when the plugin is ready for use.

## JSON structure

The JSON structure for importing and exporting variables is as follows:

```json
{
    "collections": [
        {
            "name": "Collection 1",
            "description": "This is collection 1",
            "modes": ["Value1"],
            "variables": {
                "root-variable": {
                    "child": {
                        "type": "color|number|string|boolean|alias",
                        "values": {
                            "Value 1": "#000000"
                        }
                    }
                }
            }
        }
    ]
}
```

So a couple of things to note with this structure. It supports variables being nested. This means when you do something like button-color, it will be represented as button/color in Figma. This allows for dynamic design systems with organized design tokens. The `modes` array is not optional. You must define your default mode at least (whether you use multiple modes or not). Each value of a variable can be a color, number, string, boolean or an alias. An alias is a reference to another variable. To reference another variable you must use the following syntax: `CollectionName:VariableName`. CollectionName is the name of the collection that the variable resides in (even if it is in the same collection). The VariableName is in the format of the nested variable in slashes. For example if you have the following

```json
{
    "button": {
        "color": {
            "type": "color",
            "values": {
                "Value 1": "#000000"
            }
        }
    }
}
```

And you want to reference the color of the button in another variable, you would use `button/color` as the value of the alias. If the collection was named Colors it would be `Colors:button/color`.
