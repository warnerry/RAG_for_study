import { useEffect, useState } from "react";
import { BookOpen, LayoutDashboard, MessageCircle, Trophy } from "lucide-react";
import { requestJson } from "./api/client";
import { DocumentState, Scenario, WorkspaceTab } from "./api/types";
import { ChatPanel } from "./components/ChatPanel";
import { DocumentDashboard } from "./components/DocumentDashboard";
import { Hero } from "./components/Hero";
import { Layout } from "./components/Layout";
import { UploadDropzone } from "./components/UploadDropzone";
import { ContestPanel } from "./features/contest/ContestPanel";
import { StudyPanel } from "./features/study/StudyPanel";

const tabs: Array<{ id: WorkspaceTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Обзор", icon: LayoutDashboard },
  { id: "study", label: "Учеба", icon: BookOpen },
  { id: "contest", label: "Конкурс", icon: Trophy },
  { id: "chat", label: "Чат", icon: MessageCircle }
];

export default function App() {
  const [scenario, setScenario] = useState<Scenario>("study");
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("dashboard");
  const [documentState, setDocumentState] = useState<DocumentState>({});
  const [apiStatus, setApiStatus] = useState<"checking" | "ok" | "error">("checking");

  const ready = Boolean(documentState.collection?.collection_id || (documentState.uploaded?.document_id && documentState.processed));
  const collectionId =
    documentState.collection?.collection_id || documentState.processed?.collection_id || documentState.uploaded?.collection_id || undefined;

  useEffect(() => {
    requestJson<{ status: string }>("/health")
      .then(() => setApiStatus("ok"))
      .catch(() => setApiStatus("error"));
  }, []);

  useEffect(() => {
    if (scenario === "study") setActiveTab("study");
    if (scenario === "contest") setActiveTab("contest");
  }, [scenario]);

  function renderWorkspace() {
    if (activeTab === "study") return <StudyPanel collectionId={collectionId} ready={ready} />;
    if (activeTab === "contest") return <ContestPanel collectionId={collectionId} ready={ready} />;
    if (activeTab === "chat") return <ChatPanel collectionId={collectionId} ready={ready} />;
    return <DocumentDashboard documentState={documentState} onOpenTab={setActiveTab} />;
  }

  return (
    <Layout apiStatus={apiStatus}>
      <Hero scenario={scenario} onScenarioChange={setScenario} />

      <main className="workspaceGrid">
        <div className="leftColumn">
          <UploadDropzone documentState={documentState} onChange={setDocumentState} />
        </div>

        <section className="mainColumn">
          <nav className="tabBar" aria-label="Рабочие разделы">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          {renderWorkspace()}
        </section>
      </main>
    </Layout>
  );
}
