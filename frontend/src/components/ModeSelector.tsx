import { BookOpen, Trophy } from "lucide-react";
import { Scenario } from "../api/types";

interface ModeSelectorProps {
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
}

export function ModeSelector({ scenario, onChange }: ModeSelectorProps) {
  return (
    <div className="scenarioGrid" aria-label="Основные сценарии">
      <button
        className={`scenarioCard ${scenario === "study" ? "active" : ""}`}
        type="button"
        onClick={() => onChange("study")}
      >
        <BookOpen size={22} aria-hidden="true" />
        <span>Подготовка к учебе</span>
        <small>Конспекты, лекции, лабораторные, зачет или экзамен.</small>
      </button>
      <button
        className={`scenarioCard ${scenario === "contest" ? "active" : ""}`}
        type="button"
        onClick={() => onChange("contest")}
      >
        <Trophy size={22} aria-hidden="true" />
        <span>Профсоюзный конкурс</span>
        <small>Блиц, 2к1, биатлон, правовое ориентирование.</small>
      </button>
    </div>
  );
}
