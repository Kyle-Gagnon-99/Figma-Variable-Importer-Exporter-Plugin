import { useEffect, useState } from "preact/hooks";
import {
    ColorFormat,
    ExportVariablesRequest,
    MessageType,
    PluginMessageData,
} from "./import-export";
import React from "preact/compat";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";

function Export() {
    const [colorFormat, setColorFormat] = useState(ColorFormat.HEX);
    const [collectionList, setCollectionList] = useState<string[]>([]);
    const [selectedCollection, setSelectedCollection] = useState("");
    const [isLoadingCollections, setIsLoadingCollections] = useState(true);
    const [fileContent, setFileContent] = useState("");

    useEffect(() => {
        const listener = (event: MessageEvent<PluginMessageData>) => {
            switch (event.data.pluginMessage.type) {
                case MessageType.GET_COLLECTIONS_RESPONSE:
                    const collections = event.data.pluginMessage.data
                        .collectionNames as string[];
                    console.log(collections);
                    setCollectionList(collections);
                    setIsLoadingCollections(false);
                    setSelectedCollection(
                        collections[0]
                            ? collections[0]
                            : "No Collections Found",
                    );
                    break;
                case MessageType.EXPORT_VARIABLES_RESPONSE:
                    const resultingJson = event.data.pluginMessage
                        .data as string;
                    setFileContent(resultingJson);
                    break;
                default: {
                    break;
                }
            }
        };

        // Add a listener to listen for Figma UI messages
        window.addEventListener("message", listener);

        // Get the list of collections to use to select which collection to export
        parent.postMessage(
            {
                pluginMessage: {
                    type: MessageType.GET_COLLECTIONS,
                    data: "",
                },
            },
            "*",
        );

        // Finally remove the listener when the component is destroyed
        return () => window.removeEventListener("message", listener);
    }, []);

    const handleColorFormatChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        event.preventDefault();
        const value = event.target as HTMLSelectElement;
        setColorFormat(value.value as ColorFormat);
    };

    const handleSelectionChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        if (event.target) {
            const target = event.target as HTMLSelectElement;
            const value = target.value;

            setSelectedCollection(value);
        }
    };

    const handleExport = () => {
        parent.postMessage(
            {
                pluginMessage: {
                    type: MessageType.EXPORT_VARIABLES,
                    data: {
                        collection: selectedCollection,
                        collectionModeMap: new Map(),
                        resolveAlias: false,
                        colorFormat: colorFormat,
                    } as ExportVariablesRequest,
                },
            },
            "*",
        );
    };

    const downloadJsonFile = (jsonData: string, fileName: string) => {
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="w-full h-full flex">
            <div className="flex flex-col items-center justify-center justify-items-center w-1/3 border-r p-4 h-full">
                <div className="text-lg font-semibold mb-4 w-full items-center">
                    Export Variables
                </div>
                <div className="flex flex-col grow justify-between w-full">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col">
                            <label
                                htmlFor="collectionList"
                                className="font-medium text-gray-700"
                            >
                                Collection List
                            </label>
                            <select
                                id="collectionList"
                                value={selectedCollection}
                                onChange={handleSelectionChange}
                                className="form-select block w-full mt-1 border-2 border-blue-400 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 outline-1 outline-gray-500"
                            >
                                {isLoadingCollections ? (
                                    <option disabled>
                                        Loading Collections
                                    </option>
                                ) : (
                                    <>
                                        {collectionList.length === 0 ? (
                                            <option disabled>
                                                No Collections Found
                                            </option>
                                        ) : (
                                            <>
                                                {collectionList.map(
                                                    (collection) => (
                                                        <option
                                                            value={collection}
                                                        >
                                                            {collection}
                                                        </option>
                                                    ),
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label
                                htmlFor="colorFormat"
                                className="font-medium text-gray-700"
                            >
                                Color Format
                            </label>
                            <select
                                id="colorFormat"
                                value={colorFormat}
                                onChange={handleColorFormatChange}
                                className="form-select block w-full mt-1 border-2 border-blue-400 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 outline-1 outline-gray-500"
                            >
                                {Object.keys(ColorFormat).map((key) => (
                                    <option value={key}>{key}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 items-center justify-items-start">
                        <button
                            className="py-2 px-4 rounded-full bg-blue-500 text-white"
                            onClick={handleExport}
                        >
                            Export Variables
                        </button>
                        <button
                            className="py-2 px-4 rounded-full bg-blue-500 text-white"
                            onClick={() =>
                                downloadJsonFile(
                                    fileContent,
                                    `${selectedCollection}.json`,
                                )
                            }
                        >
                            Save JSON
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto overflow-x-auto items-center">
                <pre className="overflow-y-auto bg-gray-100 overflow-x-auto grow">
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

export default Export;
