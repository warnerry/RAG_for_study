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
        <p className="eyebrow">Подготовка по материалам</p>
        <h1>Подготовка по документам с ответами, вопросами и источниками</h1>
        <p className="heroLead">
          Загрузите учебные материалы, положения, презентации, таблицы или изображения, соберите тренировку и
          проверь ответы в чате, который опирается на фрагменты документа.
        </p>
        <div className="heroPipeline" aria-label="Пайплайн">
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
