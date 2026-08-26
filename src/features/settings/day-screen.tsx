import { PreferencesCard } from '@/features/settings/preferences-card';
import { SettingsPage } from '@/features/settings/settings-page';

export function DayScreen() {
  return (
    <SettingsPage title="Dia e semana">
      <PreferencesCard />
    </SettingsPage>
  );
}
