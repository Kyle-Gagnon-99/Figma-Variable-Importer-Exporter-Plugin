import { useEffect, useRef, useState } from "preact/hooks";
import "./app.css";
import "figma-plugin-ds/dist/figma-plugin-ds.css";
import Import from "./Import";
import Export from "./Export";
import {
    ChangeViewOptions,
    MessageType,
    PluginMessageData,
} from "./import-export";

export enum View {
    Home = "home",
    ImportVariables = "importVariables",
    Settings = "settings",
    ExportVariables = "exportVariables",
}

export function App() {
    const [view, setView] = useState(ChangeViewOptions.IMPORT);
    const cornerRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const listener = (event: MessageEvent<PluginMessageData>) => {
            switch (event.data.pluginMessage.type) {
                case MessageType.CHANGE_VIEW_REQUEST:
                    const view = event.data.pluginMessage
                        .data as ChangeViewOptions;
                    setView(view);
            }
        };

        window.addEventListener("message", listener);

        return () => window.removeEventListener("message", listener);
    }, []);

    const resizeWindow = (e: PointerEvent) => {
        const size = {
            w: Math.max(50, Math.floor(e.clientX + 5)),
            h: Math.max(50, Math.floor(e.clientY + 5)),
        };

        parent.postMessage(
            {
                pluginMessage: {
                    type: MessageType.RESIZE_WINDOW,
                    data: size,
                },
            },
            "*",
        );
    };

    const handlePointerDown = (e: PointerEvent) => {
        const corner = cornerRef.current;
        if (corner) {
            corner.onpointermove = resizeWindow;
            corner.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerUp = (e: PointerEvent) => {
        const corner = cornerRef.current;
        if (corner) {
            corner.onpointermove = null;
            corner.releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div className="w-full h-full flex relative">
            {view === ChangeViewOptions.IMPORT && <Import />}
            {view === ChangeViewOptions.EXPORT && <Export />}
            <div className="absolute right-0 bottom-0">
                <svg
                    ref={cornerRef}
                    id="corner"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                        position: "absolute",
                        right: "1px",
                        bottom: "2px",
                        cursor: "nwse-resize",
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    <path d="M16 0V16H0L16 0Z" fill="white" />
                    <path
                        d="M6.22577 16H3L16 3V6.22576L6.22577 16Z"
                        fill="#8C8C8C"
                    />
                    <path
                        d="M11.8602 16H8.63441L16 8.63441V11.8602L11.8602 16Z"
                        fill="#8C8C8C"
                    />
                </svg>
            </div>
        </div>
    );
}
