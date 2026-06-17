import { Lightbulb } from "lucide-react";
import { SourcesList } from "../../components/SourcesList";
import { asText, itemFallback, sourceFiles, sourceIds } from "./studyUtils";

interface MnemonicsViewProps {
  items: Record<string, unknown>[];
}

export function MnemonicsView({ items }: MnemonicsViewProps) {
  if (!items.length) {
    return <div className="emptyPanel">Мнемоники пока не сгенерированы.</div>;
  }

  return (
    <div className="resultStack">
      {items.map((item, index) => {
        const concept = asText(item.concept || item.term, `Понятие ${index + 1}`);
        const association = asText(item.association || item.mnemonic || item.rule, itemFallback(item));
        const memoryPhrase = asText(item.memory_phrase || item.phrase);
        const whyItWorks = asText(item.why_it_works || item.explanation || item.content);
        const example = asText(item.example);

        return (
          <article className="resultCard mnemonicCard" key={`${concept}-${index}`}>
            <div className="cardKicker">
              <Lightbulb size={16} aria-hidden="true" />
              Мнемоника
            </div>
            <h3>{concept}</h3>
            <dl className="mnemonicDetails">
              <div>
                <dt>Ассоциация</dt>
                <dd>{association}</dd>
              </div>
              {memoryPhrase ? (
                <div>
                  <dt>Фраза для запоминания</dt>
                  <dd className="mnemonicLine">{memoryPhrase}</dd>
                </div>
              ) : null}
              {whyItWorks ? (
                <div>
                  <dt>Почему работает</dt>
                  <dd>{whyItWorks}</dd>
                </div>
              ) : null}
              {example ? (
                <div>
                  <dt>Мини-пример</dt>
                  <dd>{example}</dd>
                </div>
              ) : null}
            </dl>
            <SourcesList chunkIds={sourceIds(item)} files={sourceFiles(item)} />
          </article>
        );
      })}
    </div>
  );
}
