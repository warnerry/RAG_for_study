import { ClipboardCopy, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { generateStudy } from "../../api/study";
import { StudyGenerateResponse, StudyMode } from "../../api/types";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { ExamQuestionsView } from "./ExamQuestionsView";
import { FlashcardsView } from "./FlashcardsView";
import { MnemonicsView } from "./MnemonicsView";
import { SummaryView } from "./SummaryView";

interface StudyPanelProps {
  collectionId?: string;
  ready: boolean;
}

const modeLabels: Record<StudyMode, string> = {
  summary: "Краткий пересказ",
  exam_questions: "Вопросы к экзамену",
  flashcards: "Карточки",
  mnemonics: "Мнемоники"
};

const countLabels: Partial<Record<StudyMode, string>> = {
  exam_questions: "Количество вопросов",
  flashcards: "Количество карточек",
  mnemonics: "Количество мнемоник"
};

export function StudyPanel({ collectionId, ready }: StudyPanelProps) {
  const [mode, setMode] = useState<StudyMode>("summary");
  const [count, setCount] = useState(10);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Partial<Record<StudyMode, StudyGenerateResponse>>>({});

  const result = results[mode];

  async function handleGenerate() {
    if (!ready || !collectionId) {
      setError("Материалы пока не обработаны.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await generateStudy(collectionId, mode, mode === "mnemonics", mode === "summary" ? undefined : count);
      setResults((current) => ({ ...current, [mode]: response }));
    } catch (studyError) {
      setError(studyError instanceof Error ? studyError.message : "Не удалось сгенерировать учебный материал.");
    } finally {
      setLoading(false);
    }
  }

  function renderResult() {
    if (!result) {
      return <div className="emptyPanel">Выберите режим подготовки и нажмите «Сгенерировать». Результаты сохранятся отдельно для каждого режима.</div>;
    }

    if (mode === "summary") return <SummaryView result={result} />;
    if (mode === "exam_questions") return <ExamQuestionsView items={result.items} warning={result.warning || undefined} />;
    if (mode === "flashcards") return <FlashcardsView items={result.items} requestedCount={result.requested_count || count} warning={result.warning || undefined} />;
    return <MnemonicsView items={result.items} warning={result.warning || undefined} />;
  }

  return (
    <section className="panel modePanel">
      <div className="panelHeaderLine">
        <div>
          <p className="eyebrow">Учебный режим</p>
          <h2>Учебные активности</h2>
        </div>
      </div>

      <div className="segmentedControl">
        {(Object.keys(modeLabels) as StudyMode[]).map((studyMode) => (
          <button
            key={studyMode}
            className={mode === studyMode ? "active" : ""}
            type="button"
            onClick={() => setMode(studyMode)}
          >
            {modeLabels[studyMode]}
          </button>
        ))}
      </div>

      {mode !== "summary" ? (
        <div className="countSelector">
          <span>{countLabels[mode]}</span>
          {[10, 25, 50, 100].map((value) => (
            <button
              key={value}
              className={count === value ? "active" : ""}
              type="button"
              onClick={() => setCount(value)}
            >
              {value}
            </button>
          ))}
        </div>
      ) : null}

      <div className="panelActions">
        <button className="primaryButton" type="button" onClick={handleGenerate} disabled={!ready || isLoading}>
          <Sparkles size={16} aria-hidden="true" />
          {result ? "Сгенерировать заново" : "Сгенерировать"}
        </button>
        <button
          className="secondaryButton"
          type="button"
          disabled={!result}
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(result, null, 2))}
        >
          <ClipboardCopy size={16} aria-hidden="true" />
          Скопировать
        </button>
        {isLoading ? (
          <span className="inlineLoading">
            <RefreshCw size={15} className="spinIcon" aria-hidden="true" />
            Генерация
          </span>
        ) : null}
      </div>

      {error ? <ErrorState message={error} /> : null}
      {isLoading ? <LoadingState title="Генерирую учебный материал" detail={`${modeLabels[mode]} по найденным смысловым фрагментам.`} /> : renderResult()}
    </section>
  );
}
