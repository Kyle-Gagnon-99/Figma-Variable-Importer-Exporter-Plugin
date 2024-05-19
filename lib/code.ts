/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * File: code.ts
 * Author: Kyle Gagnon
 * Date Added: 03/23/2024
 * Description: This is the backend code for the variables-plugin. Here we will
 *              take in a JSON file, parse it, and create the variables.
 */
import {
    ChangeViewOptions,
    ErrorDetails,
    ExportVariablesRequest,
    ImportVarsRequest,
    MessageType,
    ResizeRequest,
    UserSettings,
} from "../src/import-export";
import { VarExporter } from "./exportVars";
import { VarImporter } from "./importVars";
import {
    getDefaultSettings,
    getLocalUserSettings,
    setLocalUserSettings,
} from "./userSettings";

const defaultHeight = 580;
const defaultWidth = 780;
const maxHeight = 1200;

// Clear the console
console.clear();

//Restore previous size when reopen the plugin
figma.clientStorage
    .getAsync("import-export-size")
    .then((size) => {
        if (size) figma.ui.resize(size.w, size.h);
    })
    .catch((_) => {});

export let globalUserSettings = getDefaultSettings();

getLocalUserSettings().then((value) => {
    globalUserSettings = value;
});

// This shows the HTML page in "ui.html".
figma.showUI(__html__, {
    height: defaultHeight,
    width: defaultWidth,
    themeColors: true,
});

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
    // Should be a switch case statement but I dug this hole. I'll refactor later
    if (msg.type === MessageType.UPLOAD_FILE) {
        const requestData: ImportVarsRequest = msg.data as ImportVarsRequest;
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
    } else if (msg.type === MessageType.EXPORT_VARIABLES) {
        // Get the specified collection list to collect from if there is one
        const exportVarRequest = msg.data as ExportVariablesRequest;
        const varExporter = new VarExporter(exportVarRequest.collectionModeMap);

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
                exportVarRequest.resolveAlias,
                exportVarRequest.colorFormat,
            );
            figma.ui.postMessage({
                type: MessageType.EXPORT_VARIABLES_RESPONSE,
                data: exportedVars,
            });
        });
    } else if (msg.type === MessageType.GET_COLLECTIONS) {
        const varExporter = new VarExporter(new Map());

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
    } else if (msg.type === MessageType.RESIZE_WINDOW) {
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
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    //figma.closePlugin();
};
