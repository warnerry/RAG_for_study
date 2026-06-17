import { Lightbulb } from "lucide-react";
import { asText, itemFallback } from "./studyUtils";

interface MnemonicsViewProps {
  items: Record<string, unknown>[];
  warning?: string;
}

export function MnemonicsView({ items, warning }: MnemonicsViewProps) {
  if (!items.length) {
    return <div className="emptyPanel">Мнемоники пока не сгенерированы.</div>;
  }

  return (
    <div className="resultStack">
      {warning ? <div className="emptyPanel">{warning}</div> : null}
      {items.map((item, index) => {
        const concept = asText(item.concept || item.term, `Понятие ${index + 1}`);
        const association = asText(item.association || item.mnemonic || item.rule, itemFallback(item));
        const memoryPhrase = asText(item.memory_phrase || item.phrase);
        const rhyme = asText(item.rhyme);
        const meme = asText(item.meme);
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
              {rhyme ? (
                <div>
                  <dt>Рифма</dt>
                  <dd className="mnemonicLine">{rhyme}</dd>
                </div>
              ) : null}
              {meme ? (
                <div>
                  <dt>Ассоциация-мем</dt>
                  <dd>{meme}</dd>
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
          </article>
        );
      })}
    </div>
  );
}
