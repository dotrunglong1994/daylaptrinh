export default function Stars({ value }: { value: number }) {
  return (
    <span className="star-row" aria-label={`${value} trên 3 sao`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= value ? "on" : ""}>
          ⭐
        </span>
      ))}
    </span>
  );
}
