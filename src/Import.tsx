import { useEffect, useState } from "preact/hooks";
import {
    ImportVarsRequest,
    MessageType,
    PluginMessageData,
    ValidationError,
} from "./import-export";
import ErrorContainer from "./ValidationErrorContainer";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";

function Import() {
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
        [],
    );
    const [useExistingCollections, setUseExistingCollections] = useState(true);

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

    const [fileContent, setFileContent] = useState<string | null>(null);

    const handleOnFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        const fileInput = event.target as HTMLInputElement;
        const fileLists = (event.target as HTMLInputElement)?.files;
        if (fileLists && fileLists.length > 0) {
            const file = fileLists[0];
            const fileReader = new FileReader();
            fileReader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target) {
                    const content = e.target.result as string;
                    setFileContent(content);
                }
            };
            fileReader.readAsText(file);
        }

        fileInput.value = "";
    };

    const handleFileUpload = () => {
        parent.postMessage(
            {
                pluginMessage: {
                    type: MessageType.UPLOAD_FILE,
                    data: {
                        json: fileContent,
                        useExistingCollections: useExistingCollections,
                    } as ImportVarsRequest,
                },
            },
            "*",
        );
    };

    return (
        <div className="w-full h-full flex">
            <div className="flex flex-col items-start justify-center justify-items-center content-center w-1/3 border-r p-4 h-full">
                <div className="text-lg font-semibold mb-4 w-full items-center">
                    Import Variables
                </div>
                <div className="flex flex-col space-y-4 grow justify-between w-full">
                    <div className="flex flex-col space-y-4 grow">
                        <div className="flex items-center mt-2">
                            <input
                                id="useExistingCollections"
                                type="checkbox"
                                className="accent-blue-500 h-4 w-4"
                                checked={useExistingCollections}
                                onChange={() =>
                                    setUseExistingCollections(
                                        !useExistingCollections,
                                    )
                                }
                            />
                            <label
                                htmlFor="useExistingCollections"
                                className="ml-2 text-sm"
                            >
                                Use Existing Collections
                            </label>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-items-stretch">
                        <input
                            id="fileInput"
                            type="file"
                            accept=".json"
                            className="hidden" // Add a margin for spacing
                            onChange={handleOnFileChange}
                            title=""
                        />
                        <label
                            htmlFor="fileInput"
                            className="block cursor-pointer py-2 px-4 rounded-full text-center bg-blue-500 text-white"
                        >
                            Choose File
                        </label>
                        <button
                            onClick={handleFileUpload}
                            className="py-2 px-4 rounded-full bg-blue-500 text-white text-lg mt-auto"
                        >
                            Import
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto overflow-x-auto">
                {validationErrors.length > 0 && (
                    <ErrorContainer
                        errors={validationErrors}
                        onCloseAll={() => setValidationErrors([])}
                    />
                )}
                <pre className="overflow-y-auto h-full bg-gray-100 overflow-x-auto">
                    {fileContent ? (
                        <SyntaxHighlighter language="json" style={vs2015}>
                            {fileContent}
                        </SyntaxHighlighter>
                    ) : (
                        <></>
                    )}
                </pre>
            </div>
        </div>
    );
}

export default Import;
