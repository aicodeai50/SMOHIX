export type RunbookStep = {
  id: string;
  title: string;
  check: string;
};

export type RunbookSummary = {
  slug: string;
  title: string;
  version: string;
  summary: string;
  steps: number;
};

export type RunbookDetail = RunbookSummary & {
  body: string;
  checklist: RunbookStep[];
};
