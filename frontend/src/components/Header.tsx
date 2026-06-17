import { Activity } from "lucide-react";

interface HeaderProps {
  apiStatus: "checking" | "ok" | "error";
}

export function Header({ apiStatus }: HeaderProps) {
  const statusLabel =
    apiStatus === "ok" ? "Сервер готов" : apiStatus === "error" ? "Сервер недоступен" : "Проверяем сервер";

  return (
    <header className="topHeader">
      <div className="brand">
        <img className="brandLogo" src="zachetka-logo.png" alt="" />
        <div>
          <p>Зачётка</p>
          <strong>От конспекта до конкурса</strong>
        </div>
      </div>
      <div className={`apiStatus ${apiStatus}`}>
        <Activity size={16} aria-hidden="true" />
        {statusLabel}
      </div>
    </header>
  );
}
