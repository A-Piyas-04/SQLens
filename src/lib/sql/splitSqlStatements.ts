function hasExecutableSql(sql: string): boolean {
  let i = 0;

  while (i < sql.length) {
    while (i < sql.length && /\s/.test(sql[i])) {
      i += 1;
    }
    if (i >= sql.length) return false;

    if (sql[i] === "-" && sql[i + 1] === "-") {
      i += 2;
      while (i < sql.length && sql[i] !== "\n") {
        i += 1;
      }
      continue;
    }

    if (sql[i] === "/" && sql[i + 1] === "*") {
      i += 2;
      while (i < sql.length - 1 && !(sql[i] === "*" && sql[i + 1] === "/")) {
        i += 1;
      }
      i += 2;
      continue;
    }

    return true;
  }

  return false;
}

/**
 * Splits a SQL script into individual statements on semicolons outside
 * strings, identifiers, and comments.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const next = sql[i + 1];

    if (char === "-" && next === "-") {
      current += char;
      i += 1;
      while (i < sql.length) {
        current += sql[i];
        if (sql[i] === "\n") {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (char === "/" && next === "*") {
      current += char;
      i += 1;
      current += sql[i];
      i += 1;
      while (i < sql.length - 1 && !(sql[i] === "*" && sql[i + 1] === "/")) {
        current += sql[i];
        i += 1;
      }
      if (i < sql.length - 1) {
        current += sql[i];
        current += sql[i + 1];
        i += 2;
      }
      continue;
    }

    if (char === "'") {
      current += char;
      i += 1;
      while (i < sql.length) {
        current += sql[i];
        if (sql[i] === "'") {
          if (sql[i + 1] === "'") {
            current += sql[i + 1];
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (char === '"') {
      current += char;
      i += 1;
      while (i < sql.length) {
        current += sql[i];
        if (sql[i] === '"') {
          if (sql[i + 1] === '"') {
            current += sql[i + 1];
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (char === "$") {
      const tagMatch = sql.slice(i).match(/^\$([A-Za-z0-9_]*)\$/);
      if (tagMatch) {
        const tag = tagMatch[0];
        const end = sql.indexOf(tag, i + tag.length);
        if (end !== -1) {
          current += sql.slice(i, end + tag.length);
          i = end + tag.length;
          continue;
        }
      }
    }

    if (char === ";") {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = "";
      i += 1;
      continue;
    }

    current += char;
    i += 1;
  }

  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);

  return statements.filter(hasExecutableSql);
}
