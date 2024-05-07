import { ValidationError } from "./import-export";

interface ErrorCardProps {
    error: ValidationError;
    onDismiss: () => void;
    onNextError: () => void;
    onPreviousError: () => void;
    currentIndex: number;
    totalErrors: number;
}

// @ts-ignore
function ValidationErrorCard({
    error,
    onDismiss,
    onNextError,
    onPreviousError,
    currentIndex,
    totalErrors,
}: ErrorCardProps) {
    return (
        <div className="bg-red-100 text-red-700 rounded shadow flex flex-col p-4 justify-between m-6 gap-3">
            {/* Title / Dismiss */}
            <div className="flex flex-row justify-between mb-3">
                <div>
                    <h3>
                        <span className="font-bold">Error: </span>
                        <span>{error.errorCode}</span>
                    </h3>
                </div>
                <div>
                    <button onClick={onDismiss}>
                        <div className="font-bold text-red-700 hover:text-red-800">
                            X
                        </div>
                    </button>
                </div>
            </div>
            {/* Main content */}
            <div className="flex flex-col gap-3">
                <div>
                    <p>
                        <span className="font-bold">Variable: </span>
                        <span>{error.variableName}</span>
                    </p>
                </div>
                <div>
                    <span>{error.message}</span>
                </div>
            </div>
            <div className="flex justify-between mt-2">
                <div className="flex gap-3">
                    <button onClick={onPreviousError}>
                        <div className="font-bold text-red-700 hover:text-red-800">
                            &lt;
                        </div>
                    </button>
                    <button onClick={onNextError}>
                        <div className="font-bold text-red-700 hover:text-red-800">
                            &gt;
                        </div>
                    </button>
                </div>
                <div>
                    <span>
                        Error {currentIndex + 1} of {totalErrors}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default ValidationErrorCard;
