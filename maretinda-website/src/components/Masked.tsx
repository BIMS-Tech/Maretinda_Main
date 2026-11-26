/**
 * A heading whose words rise into place one after another, each from behind
 * its own edge (the storefront's headings do the same). Inside a [data-aos]
 * block it waits until the block scrolls into view. Without JavaScript, or for
 * people who ask for less motion, the words are simply there.
 */
export default function Masked({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span aria-label={text} role="text">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} aria-hidden className="mask">
          <span style={{ animationDelay: `${delay + i * 60}ms` }}>
            {word}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}
