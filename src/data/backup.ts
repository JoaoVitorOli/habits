import { inArray } from 'drizzle-orm';
import { Directory, File } from 'expo-file-system';

import { db } from '@/data/db';
import { rescheduleReminders } from '@/data/notifications';
import { completions, dayNotes, habits } from '@/data/schema';
import { readCursor } from '@/data/sync';
import { buildBackup, parseBackup, rowsToImport, type Backup } from '@/domain/backup';
import { refreshWidgets } from '@/widget/refresh';

export type ImportSummary = {
  habits: number;
  completions: number;
  dayNotes: number;
};

/** O backup leva tudo, inclusive linhas apagadas: senao a exclusao nao viajaria junto. */
async function readEverything(): Promise<Omit<Backup, 'v' | 'exportedAt'>> {
  const [habitRows, completionRows, noteRows] = await Promise.all([
    db.select().from(habits),
    db.select().from(completions),
    db.select().from(dayNotes),
  ]);

  return { habits: habitRows, completions: completionRows, dayNotes: noteRows };
}

export async function exportBackup(now: Date): Promise<string> {
  const backup = buildBackup(await readEverything(), now);
  const name = `habitos-${now.toISOString().slice(0, 10)}.json`;

  // SAF: quem escolhe a pasta e o usuario, e o app nao guarda permissao de escrita geral
  const directory = await Directory.pickDirectoryAsync();
  const file = directory.createFile(name, 'application/json');
  file.write(JSON.stringify(backup));

  return name;
}

/** `null` quando o usuario fecha o seletor: desistir nao e erro. */
export async function importBackup(): Promise<ImportSummary | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json'] });
  if (picked.canceled) return null;

  const parsed = parseBackup(await picked.result.text());

  if (!parsed.ok) throw new Error(parsed.reason);

  const local = await readEverything();
  const now = new Date();
  // o dono e sempre o desta sessao: o `user_id` do arquivo pode ser de outra conta, ou de nenhuma
  const { userId } = await readCursor();
  const summary: ImportSummary = { habits: 0, completions: 0, dayNotes: 0 };

  await db.transaction(async (tx) => {
    for (const row of rowsToImport(local.habits, parsed.backup.habits, now)) {
      await tx.delete(habits).where(inArray(habits.id, [row.id]));
      await tx.insert(habits).values({ ...row, userId });
      summary.habits++;
    }

    for (const row of rowsToImport(local.completions, parsed.backup.completions, now)) {
      await tx.delete(completions).where(inArray(completions.id, [row.id]));
      await tx.insert(completions).values(row);
      summary.completions++;
    }

    for (const row of rowsToImport(local.dayNotes, parsed.backup.dayNotes, now)) {
      await tx.delete(dayNotes).where(inArray(dayNotes.id, [row.id]));
      await tx.insert(dayNotes).values(row);
      summary.dayNotes++;
    }
  });

  await rescheduleReminders();
  refreshWidgets();
  return summary;
}
