import { ReactNode } from "react";
import { Header } from "./Header";

interface LayoutProps {
  apiStatus: "checking" | "ok" | "error";
  children: ReactNode;
}

export function Layout({ apiStatus, children }: LayoutProps) {
  return (
    <div className="appShell">
      <Header apiStatus={apiStatus} />
      {children}
    </div>
  );
}
