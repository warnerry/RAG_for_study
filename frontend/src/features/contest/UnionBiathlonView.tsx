import { Flag, Map } from "lucide-react";
import { ContestGenerateResponse } from "../../api/types";
import { asText } from "./contestUtils";

interface UnionBiathlonViewProps {
  result: ContestGenerateResponse;
}

export function UnionBiathlonView({ result }: UnionBiathlonViewProps) {
  const stations =
    result.stations?.length
      ? result.stations
      : [
          {
            name: "Станция 1",
            questions: result.questions || []
          }
        ];

  return (
    <div className="trainingView">
      <div className="biathlonRoute">
        {stations.map((station, index) => (
          <div className="stationMarker" key={`${asText(station.name)}-${index}`}>
            <Flag size={16} aria-hidden="true" />
            <span>{index + 1}</span>
          </div>
        ))}
      </div>

      <div className="stationGrid">
        {stations.map((station, stationIndex) => {
          const stationName = asText(station.name, `Станция ${stationIndex + 1}`);
          const questions = Array.isArray(station.questions) ? (station.questions as Record<string, unknown>[]) : [];

          return (
            <article className="stationCard" key={`${stationName}-${stationIndex}`}>
              <div className="cardKicker">
                <Map size={16} aria-hidden="true" />
                Станция {stationIndex + 1}
              </div>
              <h3>{stationName}</h3>
              <div className="stationQuestions">
                {questions.map((item, questionIndex) => {
                  const question = asText(item.question || item.statement, `Вопрос ${questionIndex + 1}`);
                  const answer = asText(item.answer || item.explanation, "Ответ не распознан.");

                  return (
                    <details key={`${question}-${questionIndex}`}>
                      <summary>{question}</summary>
                      <p>{answer}</p>
                    </details>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
