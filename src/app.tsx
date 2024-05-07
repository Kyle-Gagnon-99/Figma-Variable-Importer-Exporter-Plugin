import { useState } from "preact/hooks";
import "./app.css";
import "figma-plugin-ds/dist/figma-plugin-ds.css";
import Home from "./Home";
import Settings from "./Settings";
import ImportVariables from "./ImportVariables";

export enum View {
    Home = "home",
    ImportVariables = "importVariables",
    Settings = "settings",
}

export function App() {
    const [currentView, setCurrentView] = useState<View>(View.Home);

    return (
        <>
            {currentView === View.Home && (
                <Home setCurrentView={setCurrentView} />
            )}
            {currentView === View.Settings && (
                <Settings setCurrentView={setCurrentView} />
            )}
            {currentView === View.ImportVariables && (
                <ImportVariables setCurrentView={setCurrentView} />
            )}
        </>
    );
}
