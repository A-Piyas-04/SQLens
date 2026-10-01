import type { TrackedRow } from "../../../../lib/simulator";

export type JoinOnClause = {
  leftTable: string;
  leftKey: string;
  rightTable: string;
  rightKey: string;
  display: string;
};

export type PanelJoinKeys = {
  leftKey: string | null;
  rightKey: string | null;
  display: string;
  joinIndex: number;
  joinLayer: number;
  joinLayerTotal: number;
  rightTableName: string | null;
};

export type MatchPair = { rightId: string } | { null: true };

export type JoinMatchStep = {
  leftId: string;
  leftIndex: number;
  leftKeyValue: unknown;
  pairs: MatchPair[];
};

/** All ON clauses in SQL order (one per JOIN). */
export function extractJoinOnClauses(sql: string): JoinOnClause[] {
  const aliasMap = new Map<string, string>();
  const fromRe = /\b(?:FROM|JOIN)\s+"?(\w+)"?\s+(?:AS\s+)?"?(\w+)"?/gi;
  let tm: RegExpExecArray | null;
  while ((tm = fromRe.exec(sql)) !== null) {
    aliasMap.set(tm[2].toLowerCase(), tm[1]);
  }
  const resolve = (a: string) => aliasMap.get(a.toLowerCase()) ?? a;

  const onRe =
    /\bON\b\s+(.+?)(?=\s+(?:(?:LEFT|RIGHT|INNER|FULL|CROSS)\s+)?JOIN\b|\s+WHERE\b|\s+GROUP\s+BY\b|\s+ORDER\s+BY\b|\s+LIMIT\b|;?\s*$)/gi;

  const clauses: JoinOnClause[] = [];
  let m: RegExpExecArray | null;
  while ((m = onRe.exec(sql)) !== null) {
    const clean = m[1].trim().replace(/["`]/g, "").replace(/\s+/g, " ");
    const parts = clean.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/i);
    if (!parts) continue;
    clauses.push({
      leftTable: resolve(parts[1]),
      leftKey: parts[2],
      rightTable: resolve(parts[3]),
      rightKey: parts[4],
      display: `${resolve(parts[1])}.${parts[2]} = ${resolve(parts[3])}.${parts[4]}`,
    });
  }
  return clauses;
}

export function countJoinLayers(sql: string): number {
  return extractJoinOnClauses(sql).length;
}

/** Map ON clause columns to left (working set) vs right (new table) panels. */
export function resolvePanelJoinKeys(
  clause: JoinOnClause,
  rightTableName: string | null,
  leftRows: TrackedRow[],
  rightRows: TrackedRow[]
): { leftKey: string | null; rightKey: string | null } {
  const rightNorm = rightTableName?.toLowerCase() ?? "";
  let panelLeftKey: string;
  let panelRightKey: string;

  if (rightNorm && clause.rightTable.toLowerCase() === rightNorm) {
    panelLeftKey = clause.leftKey;
    panelRightKey = clause.rightKey;
  } else if (rightNorm && clause.leftTable.toLowerCase() === rightNorm) {
    panelLeftKey = clause.rightKey;
    panelRightKey = clause.leftKey;
  } else {
    panelLeftKey = clause.leftKey;
    panelRightKey = clause.rightKey;
  }

  return {
    leftKey: resolveRowKeyColumn(leftRows, panelLeftKey, clause.leftTable),
    rightKey: resolveRowKeyColumn(rightRows, panelRightKey, clause.rightTable),
  };
}

export function resolveRowKeyColumn(
  rows: TrackedRow[],
  key: string | null,
  tableHint: string | null
): string | null {
  if (!key || rows.length === 0) return key;

  const cols = Object.keys(rows[0]).filter((k) => k !== "_rowId");
  if (cols.includes(key)) return key;

  if (tableHint) {
    const prefixed = `${tableHint}_${key}`;
    if (cols.includes(prefixed)) return prefixed;
  }

  const suffixMatches = cols.filter((c) => c === key || c.endsWith(`_${key}`));
  if (suffixMatches.length === 1) return suffixMatches[0];

  return key;
}

export function resolvePlaybackJoinKeys(
  sql: string,
  joinIndex: number,
  joinLayerTotal: number,
  rightTableName: string | null,
  leftRows: TrackedRow[],
  rightRows: TrackedRow[]
): PanelJoinKeys {
  const clauses = extractJoinOnClauses(sql);
  const clause = clauses[joinIndex] ?? clauses[clauses.length - 1];
  const keys = clause
    ? resolvePanelJoinKeys(clause, rightTableName, leftRows, rightRows)
    : { leftKey: null, rightKey: null };

  return {
    ...keys,
    display: clause?.display ?? "",
    joinIndex,
    joinLayer: joinIndex + 1,
    joinLayerTotal: joinLayerTotal || Math.max(1, clauses.length),
    rightTableName,
  };
}

function dedupePairs(pairs: MatchPair[]): MatchPair[] {
  const out: MatchPair[] = [];
  for (const pair of pairs) {
    if ("null" in pair) {
      if (!out.some((p) => "null" in p)) out.push(pair);
      continue;
    }
    if (!out.some((p) => "rightId" in p && p.rightId === pair.rightId)) {
      out.push(pair);
    }
  }
  return out;
}

/** Build match steps keyed only on join columns (correct for multi-layer joins). */
export function buildJoinMatchSteps(
  leftRows: TrackedRow[],
  rightRows: TrackedRow[],
  joinedRows: TrackedRow[],
  leftKey: string | null,
  rightKey: string | null,
  isLeftJoin: boolean
): JoinMatchStep[] {
  const stepMap = new Map<string, JoinMatchStep>();

  const ensureStep = (leftRow: TrackedRow, leftIndex: number) => {
    let step = stepMap.get(leftRow._rowId);
    if (!step) {
      step = {
        leftId: leftRow._rowId,
        leftIndex,
        leftKeyValue: leftKey ? leftRow[leftKey] : undefined,
        pairs: [],
      };
      stepMap.set(leftRow._rowId, step);
    }
    return step;
  };

  const keysOnSources =
    !!leftKey &&
    !!rightKey &&
    leftRows.length > 0 &&
    rightRows.length > 0 &&
    leftKey in leftRows[0] &&
    rightKey in rightRows[0];

  // Equi-join pairs come straight from the source rows: joined rows from
  // `SELECT *` can collapse same-named columns (e.g. two `id`s), and a
  // reverse lookup by key value would only ever find the first right match.
  if (keysOnSources) {
    const rightByKey = new Map<string, TrackedRow[]>();
    for (const r of rightRows) {
      const v = r[rightKey];
      if (v === null || v === undefined) continue;
      const list = rightByKey.get(String(v));
      if (list) list.push(r);
      else rightByKey.set(String(v), [r]);
    }
    leftRows.forEach((left, leftIndex) => {
      const v = left[leftKey];
      const matches = v === null || v === undefined ? [] : rightByKey.get(String(v)) ?? [];
      if (matches.length === 0) return;
      const step = ensureStep(left, leftIndex);
      for (const r of matches) step.pairs.push({ rightId: r._rowId });
    });
  } else if (leftKey && rightKey && joinedRows.length > 0) {
    const rightCols =
      rightRows.length > 0
        ? Object.keys(rightRows[0]).filter((k) => k !== "_rowId")
        : [];

    for (const joined of joinedRows) {
      const lv = joined[leftKey];
      const rv = joined[rightKey];
      const isNullRow =
        rightCols.length > 0 && rightCols.every((c) => joined[c] === null);

      if (isNullRow) {
        if (lv === undefined || lv === null) continue;
        const leftRow = leftRows.find((l) => String(l[leftKey]) === String(lv));
        if (!leftRow) continue;
        const step = ensureStep(leftRow, leftRows.indexOf(leftRow));
        if (!step.pairs.some((p) => "null" in p)) step.pairs.push({ null: true });
        continue;
      }

      if (lv === undefined || lv === null || rv === undefined || rv === null) {
        continue;
      }

      const leftRow = leftRows.find((l) => String(l[leftKey]) === String(lv));
      const rightRow = rightRows.find((r) => String(r[rightKey]) === String(rv));
      if (!leftRow || !rightRow) continue;

      const step = ensureStep(leftRow, leftRows.indexOf(leftRow));
      if (!step.pairs.some((p) => "rightId" in p && p.rightId === rightRow._rowId)) {
        step.pairs.push({ rightId: rightRow._rowId });
      }
    }
  }

  return leftRows.map((left, leftIndex) => {
    const existing = stepMap.get(left._rowId);
    if (existing) {
      return { ...existing, leftIndex, pairs: dedupePairs(existing.pairs) };
    }
    if (isLeftJoin) {
      return {
        leftId: left._rowId,
        leftIndex,
        leftKeyValue: leftKey ? left[leftKey] : undefined,
        pairs: [{ null: true }],
      };
    }
    return {
      leftId: left._rowId,
      leftIndex,
      leftKeyValue: leftKey ? left[leftKey] : undefined,
      pairs: [],
    };
  });
}

export type ActiveBridgeLink = {
  leftId: string;
  rightId: string | null;
  isNull: boolean;
  pairIndex: number;
  pairCount: number;
};

export function pairKey(stepIndex: number, pairIndex: number): string {
  return `S${stepIndex}-P${pairIndex}`;
}

export function buildBridgePath(
  width: number,
  yLeft: number,
  yRight: number,
  isNull: boolean
): string {
  if (isNull) {
    const end = Math.min(width * 0.55, 72);
    return `M 0 ${yLeft} L ${end} ${yLeft}`;
  }
  const mx = width * 0.5;
  return `M 0 ${yLeft} C ${mx} ${yLeft}, ${mx} ${yRight}, ${width} ${yRight}`;
}
