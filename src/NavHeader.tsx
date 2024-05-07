import { Dispatch, StateUpdater } from "preact/hooks";
import { View } from "./app";
import "figma-plugin-ds/dist/figma-plugin-ds.css";

interface NavHeaderProps {
    setCurrentView: Dispatch<StateUpdater<View>>;
    pageTitle: string;
}

// @ts-ignore
function NavHeader({ setCurrentView, pageTitle }: NavHeaderProps) {
    return (
        <header className="flex flex-row justify-center m-1 content-center relative">
            {/* Making the parent relative to stick the button absolute to it's parent. Allows the header to be direct center */}
            <button
                onClick={() => setCurrentView(View.Home)}
                className="bg-[color:var(--figma-color-bg-brand)] text-sm hover:bg-[color:var(--figma-color-bg-brand)] text-[color:var(--figma-color-text-onbrand)] px-4 py-2 rounded-xl absolute left-0 top-0"
            >
                Back
            </button>
            <h1 className="type type--xlarge type--bold mr-2 text-xl">
                {pageTitle}
            </h1>
            <div>{/* Empty div */}</div>
        </header>
    );
}

export default NavHeader;
