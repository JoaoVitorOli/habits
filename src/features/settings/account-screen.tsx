import { SettingsPage } from '@/features/settings/settings-page';
import { SyncCard } from '@/features/settings/sync-card';

export function AccountScreen() {
  return (
    <SettingsPage title="Conta">
      <SyncCard />
    </SettingsPage>
  );
}
