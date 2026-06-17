import { ArrowDownToLine, FileText, MessageSquareText, Sparkles } from "lucide-react";
import { Scenario } from "../api/types";
import { ModeSelector } from "./ModeSelector";

interface HeroProps {
  scenario: Scenario;
  onScenarioChange: (scenario: Scenario) => void;
}

export function Hero({ scenario, onScenarioChange }: HeroProps) {
  return (
    <section className="heroSection">
      <div className="heroCopy">
        <img className="heroLogo" src="zachetka-logo.png" alt="" />
        <p className="eyebrow">Зачётка</p>
        <h1>От конспекта до конкурса</h1>
        <p className="heroLead">
          Загрузите учебные материалы, положения, презентации, таблицы или изображения. Зачётка сама разберет
          материалы и соберет пересказ, карточки, мнемоники, вопросы и конкурсные тренировки.
        </p>
        <div className="heroPipeline" aria-label="Этапы работы">
          <span>
            <ArrowDownToLine size={16} /> Загрузка
          </span>
          <span>
            <FileText size={16} /> Фрагменты
          </span>
          <span>
            <Sparkles size={16} /> Тренировки
          </span>
          <span>
            <MessageSquareText size={16} /> Чат
          </span>
        </div>
      </div>
      <ModeSelector scenario={scenario} onChange={onScenarioChange} />
    </section>
  );
}
