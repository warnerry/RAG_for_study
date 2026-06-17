import { Activity, Database } from "lucide-react";

interface HeaderProps {
  apiStatus: "checking" | "ok" | "error";
}

export function Header({ apiStatus }: HeaderProps) {
  const statusLabel =
    apiStatus === "ok" ? "API online" : apiStatus === "error" ? "API недоступен" : "Проверяю API";

  return (
    <header className="topHeader">
      <div className="brand">
        <div className="brandMark">
          <Database size={22} aria-hidden="true" />
        </div>
        <div>
          <p>RAG for Study</p>
          <strong>Study & Contest Copilot</strong>
        </div>
      </div>
      <div className={`apiStatus ${apiStatus}`}>
        <Activity size={16} aria-hidden="true" />
        {statusLabel}
      </div>
    </header>
  );
}
