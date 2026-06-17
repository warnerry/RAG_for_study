import { ClipboardCopy, Dumbbell, RefreshCw } from "lucide-react";
import { useState } from "react";
import { generateContest } from "../../api/contest";
import { ContestGenerateResponse, ContestMode } from "../../api/types";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { BlitzView } from "./BlitzView";
import { TwoToOneView } from "./TwoToOneView";
import { UnionBiathlonView } from "./UnionBiathlonView";

interface ContestPanelProps {
  collectionId?: string;
  ready: boolean;
}

const modeLabels: Record<ContestMode, string> = {
  blitz: "Блиц",
  two_to_one: "2к1",
  union_biathlon: "Профсоюзный биатлон"
};

export function ContestPanel({ collectionId, ready }: ContestPanelProps) {
  const [mode, setMode] = useState<ContestMode>("blitz");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Partial<Record<ContestMode, ContestGenerateResponse>>>({});

  const result = results[mode];

  async function handleGenerate() {
    if (!ready || !collectionId) {
      setError("Материалы пока не обработаны.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await generateContest(collectionId, mode, mode === "union_biathlon");
      setResults((current) => ({ ...current, [mode]: response }));
    } catch (contestError) {
      setError(contestError instanceof Error ? contestError.message : "Не удалось сгенерировать тренировку.");
    } finally {
      setLoading(false);
    }
  }

  function renderResult() {
    if (!result) {
      return <div className="emptyPanel">Выберите формат тренировки и нажмите «Сгенерировать». Результаты режимов сохраняются отдельно.</div>;
    }

    if (mode === "blitz") return <BlitzView result={result} />;
    if (mode === "two_to_one") return <TwoToOneView result={result} />;
    return <UnionBiathlonView result={result} />;
  }

  return (
    <section className="panel modePanel">
      <div className="panelHeaderLine">
        <div>
          <p className="eyebrow">Конкурсный режим</p>
          <h2>Профсоюзные тренировки</h2>
        </div>
      </div>

      <div className="segmentedControl contest">
        {(Object.keys(modeLabels) as ContestMode[]).map((contestMode) => (
          <button
            key={contestMode}
            className={mode === contestMode ? "active" : ""}
            type="button"
            onClick={() => setMode(contestMode)}
          >
            {modeLabels[contestMode]}
          </button>
        ))}
      </div>

      <div className="panelActions">
        <button className="primaryButton contestButton" type="button" onClick={handleGenerate} disabled={!ready || isLoading}>
          <Dumbbell size={16} aria-hidden="true" />
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
      {isLoading ? <LoadingState title="Генерирую конкурсный режим" detail={`${modeLabels[mode]} по нормативным фрагментам.`} /> : renderResult()}
    </section>
  );
}
