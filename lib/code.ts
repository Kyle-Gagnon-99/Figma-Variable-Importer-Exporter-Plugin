/**
 * File: code.ts
 * Author: Kyle Gagnon
 * Date Added: 03/23/2024
 * Date Updated: 05/18/2024
 * Description: This is the backend code for the variables-plugin. Here we will
 *              take in a JSON file, parse it, and create the variables.
 */
import {
    ChangeViewOptions,
    ExportVariablesRequest,
    ImportVarsRequest,
    MessageType,
    ResizeRequest,
} from "../src/import-export";
import { VarExporter } from "./exportVars";
import { VarImporter } from "./importVars";

const defaultHeight = 580;
const defaultWidth = 780;
const maxHeight = 1200;

// Clear the console
// Only use in development.
//console.clear();

// Restore previous size when reopen the plugin
figma.clientStorage
    .getAsync("import-export-size")
    .then((size) => {
        if (size) figma.ui.resize(size.w, size.h);
    })
    .catch((_) => {});

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
    height: defaultHeight,
    width: defaultWidth,
    themeColors: true,
});

// Here, we should get the command we selected and select the view based upon that command
if (figma.command === ChangeViewOptions.IMPORT) {
    figma.ui.postMessage({
        type: MessageType.CHANGE_VIEW_REQUEST,
        data: ChangeViewOptions.IMPORT,
    });
} else if (figma.command === ChangeViewOptions.EXPORT) {
    figma.ui.postMessage({
        type: MessageType.CHANGE_VIEW_REQUEST,
        data: ChangeViewOptions.EXPORT,
    });
}

figma.ui.onmessage = (msg: { type: string; data: any }) => {
    switch (msg.type) {
        case MessageType.UPLOAD_FILE: {
            const requestData: ImportVarsRequest =
                msg.data as ImportVarsRequest;
            const jsonData: VarImporterTemplate = JSON.parse(
                requestData.json,
            ) as VarImporterTemplate;

            const themeSystem: VarImporter = new VarImporter(
                jsonData.collections ? jsonData.collections : [],
                requestData.useExistingCollections,
            );

            // Import the variables. If there are validation errors, it will exit out early.
            themeSystem.importVariables();

            if (themeSystem.hasValidationErrors()) {
                const errors = themeSystem.getValidationErrors();
                figma.ui.postMessage({
                    type: MessageType.VALIDATION_ERRORS,
                    data: errors,
                });
            }

            break;
        }

        case MessageType.EXPORT_VARIABLES: {
            // Get the specified collection list to collect from if there is one
            const exportVarRequest = msg.data as ExportVariablesRequest;
            const varExporter = new VarExporter();

            // Collect the Figma vars into a map
            varExporter.collectFigmaVars().then(() => {
                // This means there is no collection selected, so do nothing
                if (exportVarRequest.collection === "") {
                    console.log("No collection selected.");
                } else {
                    console.log(`Export ${exportVarRequest.collection}`);
                }

                const exportedVars = varExporter.varsToJson(
                    exportVarRequest.collection,
                    exportVarRequest.colorFormat,
                );
                figma.ui.postMessage({
                    type: MessageType.EXPORT_VARIABLES_RESPONSE,
                    data: exportedVars,
                });
            });

            break;
        }

        case MessageType.GET_COLLECTIONS: {
            const varExporter = new VarExporter();

            // First ensure the collections is populated
            varExporter.collectFigmaVars().then(() => {
                // Get the list of collections
                const collectionNames = varExporter.getFigmaCollections();

                // Finally return the collections into a response
                figma.ui.postMessage({
                    type: MessageType.GET_COLLECTIONS_RESPONSE,
                    data: {
                        collectionNames: Array.from(collectionNames.values()),
                    },
                });
            });

            break;
        }

        case MessageType.RESIZE_WINDOW: {
            const size = msg.data as ResizeRequest;
            if (size.h > maxHeight) {
                size.h = maxHeight;
            } else if (size.h < defaultHeight) {
                size.h = defaultHeight;
            }

            if (size.w < defaultWidth) {
                size.w = defaultWidth;
            }

            figma.ui.resize(size.w, size.h);
            figma.clientStorage
                .setAsync("import-export-size", size)
                .catch((err) => {
                    console.log(err);
                });

            break;
        }
    }
};
