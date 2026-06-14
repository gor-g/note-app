// True if every character of `query` appears in `text` in order, ignoring case.
// An empty query matches everything.
export function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Walk the text once, advancing through the query only when its current
  // character matches. Reaching the end of the query means all of it was found.
  let queryIndex = 0;
  for (
    let textIndex = 0;
    textIndex < textLower.length && queryIndex < queryLower.length;
    textIndex++
  ) {
    if (textLower[textIndex] === queryLower[queryIndex]) queryIndex++;
  }
  return queryIndex === queryLower.length;
}
