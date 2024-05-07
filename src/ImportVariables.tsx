import { Dispatch, StateUpdater, useEffect, useState } from "preact/hooks";
import { View } from "./app";
import "figma-plugin-ds/dist/figma-plugin-ds.css";
import NavHeader from "./NavHeader";
import React from "preact/compat";
import ErrorContainer from "./ValidationErrorContainer";
import {
    MessageType,
    PluginMessageData,
    ValidationError,
} from "./import-export";

interface ImportVariablesProps {
    setCurrentView: Dispatch<StateUpdater<View>>;
}

function ImportVariables({ setCurrentView }: ImportVariablesProps) {
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
        [],
    );

    // Listen for parent messages
    useEffect(() => {
        const listener = (event: MessageEvent<PluginMessageData>) => {
            switch (event.data.pluginMessage.type) {
                case MessageType.VALIDATION_ERRORS:
                    const errors = event.data.pluginMessage
                        .data as ValidationError[];
                    console.log(errors);
                    setValidationErrors(errors);
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("message", listener);

        return () => window.removeEventListener("message", listener);
    }, []);

    const [_, setFileContent] = useState<string | null>(null);

    const [fileList, setFileList] = useState<FileList | null>(null);

    const handleOnFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setFileList((event.target as HTMLInputElement)?.files);
    };

    const handleFileUpload = () => {
        if (fileList && fileList.length > 0) {
            const file = fileList[0];
            const fileReader = new FileReader();
            fileReader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target) {
                    const content = e.target.result as string;
                    setFileContent(content);

                    parent.postMessage(
                        {
                            pluginMessage: {
                                type: MessageType.UPLOAD_FILE,
                                data: content,
                            },
                        },
                        "*",
                    );
                }
            };
            fileReader.readAsText(file);
        }
    };

    return (
        <>
            <NavHeader
                setCurrentView={setCurrentView}
                pageTitle="Import Variables"
            />
            <div className="flex flex-col h-full justify-center p-2">
                {validationErrors.length > 0 && (
                    <ErrorContainer
                        errors={validationErrors}
                        onCloseAll={() => setValidationErrors([])}
                    />
                )}
                <div className="flex flex-col justify-center">
                    <div className="flex flex-row items-center justify-center w-full gap-4">
                        <input
                            type="file"
                            accept=".json"
                            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[color:var(--figma-color-bg-brand)] file:text-[color:var(--figma-color-text-onbrand)]" // Add a margin for spacing
                            onChange={handleOnFileChange}
                        />
                        <button
                            className="button button--primary text-lg"
                            onClick={handleFileUpload}
                        >
                            Import
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ImportVariables;
