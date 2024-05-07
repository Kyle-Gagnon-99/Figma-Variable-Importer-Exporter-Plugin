import { Dispatch, StateUpdater } from "preact/hooks";

interface ErrorCardProps {
    title: string | undefined;
    setErrorOpen: Dispatch<StateUpdater<boolean>>;
    errorMessage: string | undefined;
}

function ErrorCard({ title, setErrorOpen, errorMessage }: ErrorCardProps) {
    return (
        <div className="bg-red-100 text-red-700 rounded shadow flex flex-col p-4 justify-start m-6 gap-3">
            <div className="flex flex-row justify-between mb-3">
                <div>
                    <h3>
                        <span className="font-bold">Error: </span>
                        <span>{title}</span>
                    </h3>
                </div>
                <div>
                    <button onClick={() => setErrorOpen(false)}>
                        <div className="font-bold text-red-700 hover:text-red-800">
                            X
                        </div>
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-3">{errorMessage}</div>
        </div>
    );
}

export default ErrorCard;
