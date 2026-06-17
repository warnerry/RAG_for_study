interface LoadingStateProps {
  title?: string;
  detail?: string;
}

export function LoadingState({
  title = "Работаю с документом",
  detail = "Это может занять несколько секунд."
}: LoadingStateProps) {
  return (
    <div className="stateBlock stateBlockLoading">
      <span className="spinner" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}
