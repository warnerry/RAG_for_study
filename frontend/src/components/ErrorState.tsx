import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="stateBlock stateBlockError">
      <AlertTriangle size={20} aria-hidden="true" />
      <div>
        <strong>Нужна проверка</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
