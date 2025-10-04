type InstagramVariant = {
  hook: string;
  body: string;
  cta_lines: string[];
  hashtags: string[];
};

export function buildInstagramCaption(v: InstagramVariant) {
  return [
    v.hook?.trim(),
    v.body?.trim(),
    (v.cta_lines || []).join("\n"),
    (v.hashtags || []).join(" "),
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}