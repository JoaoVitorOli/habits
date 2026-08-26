import { inArray } from 'drizzle-orm';
import { Directory, File } from 'expo-file-system';

import { db } from '@/data/db';
import { rescheduleReminders } from '@/data/notifications';
import { completions, dayNotes, habits } from '@/data/schema';
import { buildBackup, parseBackup, rowsToImport, type Backup } from '@/domain/backup';
import { toDay } from '@/domain/calendar';
import { refreshWidgets } from '@/widget/refresh';

export type ImportSummary = {
  habits: number;
  completions: number;
  dayNotes: number;
};

/** O backup leva tudo, inclusive linhas apagadas: senao a exclusao nao viajaria junto. */
export async function readEverything(): Promise<Omit<Backup, 'v' | 'exportedAt'>> {
  const [habitRows, completionRows, noteRows] = await Promise.all([
    db.select().from(habits),
    db.select().from(completions),
    db.select().from(dayNotes),
  ]);

  return { habits: habitRows, completions: completionRows, dayNotes: noteRows };
}

/** `null` quando o usuario fecha o seletor: desistir nao e erro. */
export async function exportBackup(now: Date): Promise<string | null> {
  const backup = buildBackup(await readEverything(), now);

  // SAF: quem escolhe a pasta e o usuario, e o app nao guarda permissao de escrita geral
  const directory = await pickDirectory();
  if (directory === null) return null;

  const file = directory.createFile(`habitos-${toDay(now)}.json`, 'application/json');
  file.write(JSON.stringify(backup));

  // o SAF renomeia sozinho quando o nome ja existe na pasta: quem sabe o nome final e o arquivo
  return file.name;
}

/**
 * Os dois seletores desistem de jeitos diferentes: o de arquivo devolve `canceled`, o de pasta
 * lanca. Sem isso, fechar o seletor de pasta pintava de vermelho a mensagem em ingles do modulo.
 */
async function pickDirectory(): Promise<Directory | null> {
  try {
    return await Directory.pickDirectoryAsync();
  } catch (error) {
    if (isPickerCancelled(error)) return null;
    throw error;
  }
}

function isPickerCancelled(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'ERR_PICKER_CANCELLED'
  );
}

/** `null` quando o usuario fecha o seletor: desistir nao e erro. */
export async function importBackup(): Promise<ImportSummary | null> {
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json'] });
  if (picked.canceled) return null;

  const parsed = parseBackup(await picked.result.text());

  if (!parsed.ok) throw new Error(parsed.reason);

  return applyBackup(parsed.backup, new Date());
}

/** Quem escolhe as linhas e o dominio; aqui e so gravar, contar, reagendar e redesenhar. */
async function applyBackup(backup: Backup, now: Date): Promise<ImportSummary> {
  const local = await readEverything();
  const summary: ImportSummary = { habits: 0, completions: 0, dayNotes: 0 };

  await db.transaction(async (tx) => {
    for (const row of rowsToImport(local.habits, backup.habits, now)) {
      await tx.delete(habits).where(inArray(habits.id, [row.id]));
      // o arquivo pode ter vindo de quando existia login: o dono nao viaja mais junto
      await tx.insert(habits).values({ ...row, userId: null });
      summary.habits++;
    }

    for (const row of rowsToImport(local.completions, backup.completions, now)) {
      await tx.delete(completions).where(inArray(completions.id, [row.id]));
      await tx.insert(completions).values(row);
      summary.completions++;
    }

    for (const row of rowsToImport(local.dayNotes, backup.dayNotes, now)) {
      await tx.delete(dayNotes).where(inArray(dayNotes.id, [row.id]));
      await tx.insert(dayNotes).values(row);
      summary.dayNotes++;
    }
  });

  await rescheduleReminders();
  refreshWidgets();
  return summary;
}
