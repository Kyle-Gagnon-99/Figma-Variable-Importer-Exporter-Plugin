import { useState } from "preact/hooks";
import ValidationErrorCard from "./ValidationErrorCard";
import { ValidationError } from "./import-export";

interface ErrorContainerProps {
    errors: ValidationError[];
    onCloseAll: () => void;
}

function ErrorContainer({ errors, onCloseAll }: ErrorContainerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [errorList, setErrorList] = useState<ValidationError[]>(errors);
    const [listLength, setListLength] = useState(errors.length);

    const handleDismissError = () => {
        const newErrors = [...errorList];
        newErrors.splice(currentIndex, 1);
        setCurrentIndex(Math.min(currentIndex, newErrors.length - 1));

        if (newErrors.length === 0) {
            onCloseAll();
        }

        setErrorList(newErrors);
        setListLength(newErrors.length);
    };

    const handleNextError = () =>
        setCurrentIndex(Math.min(currentIndex + 1, errorList.length - 1));

    const handlePreviousError = () =>
        setCurrentIndex(Math.max(currentIndex - 1, 0));

    return (
        <div>
            {errorList.length > 0 && (
                <ValidationErrorCard
                    error={errorList[currentIndex]}
                    onDismiss={handleDismissError}
                    onNextError={handleNextError}
                    onPreviousError={handlePreviousError}
                    currentIndex={currentIndex}
                    totalErrors={listLength}
                />
            )}
        </div>
    );
}

export default ErrorContainer;
