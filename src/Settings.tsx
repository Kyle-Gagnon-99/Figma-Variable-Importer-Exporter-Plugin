import { Dispatch, StateUpdater, useEffect, useState } from "preact/hooks";
import { View } from "./app";
import "figma-plugin-ds/dist/figma-plugin-ds.css";
import NavHeader from "./NavHeader";
import {
    ErrorDetails,
    MessageType,
    PluginMessageData,
    UserSettings,
} from "./import-export";
import ErrorCard from "./ErrorCard";
import React from "preact/compat";

interface SettingsProps {
    setCurrentView: Dispatch<StateUpdater<View>>;
}

function Settings({ setCurrentView }: SettingsProps) {
    const [showError, setShowError] = useState<boolean>(false);
    const [error, setError] = useState<ErrorDetails>();
    const [userSettings, setUserSettings] = useState<
        UserSettings | undefined
    >();
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const listener = (event: MessageEvent<PluginMessageData>) => {
            switch (event.data.pluginMessage.type) {
                case MessageType.GET_SETTINGS_RESPONSE:
                    const userSettings = event.data.pluginMessage
                        .data as UserSettings;
                    setUserSettings(userSettings);
                    break;
                case MessageType.GET_SETTINGS_ERROR:
                    const getSettingsError = event.data.pluginMessage
                        .data as ErrorDetails;
                    setError(getSettingsError);
                    break;
                case MessageType.SET_SETTINGS_RESPONSE:
                    const setResponse = event.data.pluginMessage
                        .data as UserSettings;
                    setUserSettings(setResponse);
                    break;
                case MessageType.SET_SETTINGS_ERROR:
                    const setSettingsError = event.data.pluginMessage
                        .data as ErrorDetails;
                    setError(setSettingsError);
                    break;
                default:
                    console.error("Recveived an unexpected response");
                    break;
            }
        };

        // Set the listener
        window.addEventListener("message", listener);

        // Get the user settings
        parent.postMessage(
            {
                pluginMessage: {
                    type: MessageType.GET_SETTINGS,
                },
            },
            "*",
        );

        return () => window.removeEventListener("message", listener);
    }, []);

    const handleFailOnNullAliasChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const target = event.target as HTMLInputElement;
        setUserSettings((prevSettings) =>
            prevSettings
                ? { ...prevSettings, failOnNullAlias: target.checked }
                : undefined,
        );
    };

    const handleSubmit = () => {
        setIsSaving(true);

        // Set the settings
        parent.postMessage(
            {
                pluginMessage: {
                    type: MessageType.SET_SETTINGS,
                    data: userSettings,
                },
            },
            "*",
        );

        setIsSaving(false);
    };

    useEffect(() => {
        console.log(userSettings);
    }, [userSettings]);

    return (
        <>
            <NavHeader setCurrentView={setCurrentView} pageTitle="Settings" />
            <div className="flex flex-col h-full p-4 w-full justify-center">
                {showError && (
                    <ErrorCard
                        errorMessage={error?.message}
                        title={error?.title}
                        setErrorOpen={setShowError}
                    />
                )}
                <form className="flex flex-col justify-center gap-4 m-4 items-center">
                    <div className="flex flex-col items-center justify-start gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="failOnNullAlias"
                                checked={userSettings?.failOnNullAlias || false}
                                onChange={handleFailOnNullAliasChange}
                                className="bg-[color:var(--figma-color-bg)] rounded-lg focus:border-[color:var(--figma-color-border-brand-strong)] focus:outline-none leading-tight py-2 px-4 border-2"
                            />
                            <label
                                htmlFor="failOnNullAlias"
                                className="text-lg font-bold"
                            >
                                Fail On Null Reference
                            </label>
                        </div>
                        <div className="w-full">
                            <span className="text-sm">
                                "Fail On Null Reference" means that the
                                validation will fail if the value of the
                                variable is a reference to another variable and
                                it is not found. If not, you can use the
                                following defaults to set the default value
                                whent the variable is not found.
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            handleSubmit();
                        }}
                        className="bg-[color:var(--figma-color-bg-brand)] text-md hover:bg-[color:var(--figma-color-bg-brand)] text-[color:var(--figma-color-text-onbrand)] px-4 py-2 rounded-lg"
                    >
                        {isSaving ? "Saving..." : "Update Settings"}
                    </button>
                </form>
            </div>
        </>
    );
}

export default Settings;
