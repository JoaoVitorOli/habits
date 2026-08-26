/**
 * Formato do arquivo de backup. Os tipos sao declarados aqui de novo, e nao reaproveitados
 * do schema do banco, de proposito: o arquivo e um contrato com o passado. Se o schema mudar,
 * o leitor de arquivos antigos continua sabendo o que espera.
 */
export const BACKUP_VERSION = 1;

/** Toda linha do arquivo tem id e data: e por essas duas que a importacao decide o que entra. */
export type Versioned = { id: string; updatedAt: string };

export type BackupHabit = {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  scheduleKind: string;
  scheduleDays: number | null;
  scheduleTimes: number | null;
  targetPerDay: number;
  streakGoal: number | null;
  reminderTime: string | null;
  position: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BackupCompletion = {
  id: string;
  habitId: string;
  day: string;
  count: number;
  completedAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type BackupNote = {
  id: string;
  habitId: string;
  day: string;
  text: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Backup = {
  v: number;
  exportedAt: string;
  habits: BackupHabit[];
  completions: BackupCompletion[];
  dayNotes: BackupNote[];
};

export type ParseResult = { ok: true; backup: Backup } | { ok: false; reason: string };

export function buildBackup(
  content: Omit<Backup, 'v' | 'exportedAt'>,
  now: Date,
): Backup {
  return { v: BACKUP_VERSION, exportedAt: now.toISOString(), ...content };
}

export function parseBackup(text: string): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'O arquivo não é um JSON válido.' };
  }

  return checkBackup(parsed);
}

function checkBackup(parsed: unknown): ParseResult {
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, reason: 'Isso não tem o formato de um backup.' };
  }

  const backup = parsed as Partial<Backup>;

  if (backup.v !== BACKUP_VERSION) {
    return { ok: false, reason: `Backup na versão ${String(backup.v)}, e este app lê a versão ${BACKUP_VERSION}.` };
  }

  if (!isRowList(backup.habits) || !isRowList(backup.completions) || !isRowList(backup.dayNotes)) {
    return { ok: false, reason: 'O backup está incompleto ou tem linhas sem id e data.' };
  }

  return { ok: true, backup: backup as Backup };
}

/**
 * Quem entra e a linha que nao existe aqui ou que e mais recente que a minha. Inteira, sem
 * merge por campo: uma linha meio do arquivo e meio daqui nao seria nenhum dos dois estados
 * que existiram de verdade.
 */
export function rowsToApply<T extends Versioned>(local: T[], incoming: T[]): T[] {
  const mine = new Map(local.map((row) => [row.id, row.updatedAt]));

  return incoming.filter((row) => {
    const current = mine.get(row.id);
    return current === undefined || row.updatedAt > current;
  });
}

/**
 * Importar nao e copiar o arquivo por cima: a linha escolhida entra com a data de agora, e
 * passa a ser a versao mais recente que existe aqui. Reimportar o mesmo arquivo nao muda
 * nada — a copia local ja e a mais nova das duas.
 */
export function rowsToImport<T extends Versioned>(local: T[], incoming: T[], at: Date): T[] {
  const stamp = at.toISOString();

  return rowsToApply(local, incoming).map((row) => ({ ...row, updatedAt: stamp }));
}

function isRowList(value: unknown): value is Versioned[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        typeof row === 'object' &&
        row !== null &&
        typeof (row as Versioned).id === 'string' &&
        typeof (row as Versioned).updatedAt === 'string',
    )
  );
}
