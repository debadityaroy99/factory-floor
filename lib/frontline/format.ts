/**
 * Plain-text formatting and sanitization utility for Manufy Frontline Mode.
 *
 * Strips Markdown syntax (bold asterisks, headings, backticks, fences)
 * to ensure chat messages display cleanly in plain text without literal
 * formatting characters, while preserving all operational numbers, units,
 * equipment IDs, timestamps, and SOP references.
 */

/**
 * Converts a string with potential Markdown markup into clean, readable plain text.
 */
export function formatFrontlinePlainText(input: string): string {
  if (!input || typeof input !== "string") return "";

  let text = input;

  // 1. Remove markdown code fences ```...```
  text = text.replace(/```(?:[a-zA-Z0-9_-]+)?\n?([\s\S]*?)```/g, "$1");

  // 2. Remove inline code backticks `code` -> code
  text = text.replace(/`([^`\n]+)`/g, "$1");

  // 3. Remove Markdown headings (# Heading -> Heading)
  text = text.replace(/^[ \t]*#{1,6}[ \t]+([^\n]+)/gm, "$1");

  // 4. Remove bold-italic ***text*** or ___text___ -> text
  text = text.replace(/\*{3}([^*\n]+)\*{3}/g, "$1");
  text = text.replace(/_{3}([^_\n]+)_{3}/g, "$1");

  // 5. Remove bold **text** or __text__ -> text
  text = text.replace(/\*{2}([^*\n]+)\*{2}/g, "$1");
  text = text.replace(/_{2}([^_\n]+)_{2}/g, "$1");

  // 6. Convert asterisk bullet points at line starts (* item) into clean bullet symbols (• item)
  text = text.replace(/^[ \t]*\*[ \t]+/gm, "• ");

  // 7. Remove italic *text* (avoiding mathematical symbols or solitary asterisks)
  text = text.replace(/(^|[^\w*])\*([^*\n\s](?:[^*\n]*[^*\n\s])?)\*([^\w*]|$)/g, "$1$2$3");

  // 8. Remove strikethrough ~~text~~ -> text
  text = text.replace(/~~([^~\n]+)~~/g, "$1");

  // 9. Remove Markdown links [text](url) -> text
  text = text.replace(/\[([^\]\n]+)\]\([^)\n]+\)/g, "$1");

  // 10. Remove horizontal rules (---, ***, ___)
  text = text.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, "");

  // 11. Normalize bullet point spacing and excessive newlines
  text = text.replace(/[ \t]+$/gm, ""); // trim trailing whitespace on lines
  text = text.replace(/\n{3,}/g, "\n\n"); // collapse 3+ newlines to 2

  return text.trim();
}

