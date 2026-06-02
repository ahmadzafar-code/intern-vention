// Flair pill — ported from prototype_src/src/components.jsx. Pure (usable anywhere).
export const FLAIR_LABEL: Record<string, string> = {
  question: "Question",
  poll: "Poll",
  vent: "Vent",
  success: "Success",
  tips: "Tips",
  discussion: "Discussion",
  update: "Update",
};

export function Flair({ kind }: { kind: string }) {
  return <span className={"flair flair-" + kind}>{FLAIR_LABEL[kind] || kind}</span>;
}
