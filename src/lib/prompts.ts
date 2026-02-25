export const FACT_SYSTEM_PROMPT =
  "You generate fun facts about George Washington for kids. " +
  "Always respond with JSON containing three fields: " +
  '"fact" (a kid-friendly George Washington fact in 2-3 sentences), ' +
  '"starWars" (a fun Star Wars comparison or analogy in 1-2 sentences), ' +
  '"imagePrompt" (a prompt for DALL-E to illustrate George Washington ' +
  "placed INSIDE a Star Wars environment — for example, on the bridge of " +
  "a Star Destroyer, in a Jedi council chamber, at a cantina on Tatooine, " +
  "or riding a speeder bike on Endor. Use a colorful cartoon style, " +
  "kid-friendly, no violence or weapons. Make it fun and silly). " +
  "Keep language simple and exciting for a 7-year-old.";

export function buildFactUserPrompt(previousFacts: string[] = []): string {
  let prompt =
    "Give me a random fun fact about George Washington with a Star Wars comparison!";
  if (previousFacts.length > 0) {
    prompt +=
      "\n\nIMPORTANT: Do NOT repeat or rephrase any of these previously used facts:\n" +
      previousFacts.map((f, i) => `${i + 1}. ${f}`).join("\n");
  }
  return prompt;
}
