import { Dispatch, StateUpdater } from "preact/hooks";
import { View } from "./app";

interface HomeProps {
    setCurrentView: Dispatch<StateUpdater<View>>;
}

function Home({ setCurrentView }: HomeProps) {
    return (
        <div className="main-container">
            <div>
                <h1 className="type text-2xl">Welcome to Importer/Exporter!</h1>
            </div>
            <button
                onClick={() => setCurrentView(View.ImportVariables)}
                className="bg-[color:var(--figma-color-bg-brand)] text-md hover:bg-[color:var(--figma-color-bg-brand)] text-[color:var(--figma-color-text-onbrand)] px-4 py-2 rounded-lg"
            >
                Import Variables
            </button>
            <button
                onClick={() => setCurrentView(View.Settings)}
                className="bg-[color:var(--figma-color-bg-brand)] text-md hover:bg-[color:var(--figma-color-bg-brand)] text-[color:var(--figma-color-text-onbrand)] px-4 py-2 rounded-lg"
            >
                Settings
            </button>
        </div>
    );
}

export default Home;
