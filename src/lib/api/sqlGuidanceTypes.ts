export type SqlGuidanceTechnique = {
  name: string;
  whenToUse: string;
  notes?: string;
};

export type SqlGuidance = {
  summary: string;
  problemBreakdown: string[];
  techniques: SqlGuidanceTechnique[];
  tablesAndColumns: string[];
  pitfalls: string[];
};
