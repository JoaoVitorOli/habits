/**
 * O widget vive fora da arvore do app: o Android chama o task handler sem tela aberta e abre
 * a tela de configuracao numa Activity propria. Os dois precisam estar registrados antes de
 * qualquer render, entao o entry do expo-router deixa de ser o entry do bundle.
 */
import 'expo-router/entry';
import { registerWidgetConfigurationScreen, registerWidgetTaskHandler } from 'react-native-android-widget';

import { WidgetConfigurationScreen } from '@/widget/configuration-screen';
import { widgetTaskHandler } from '@/widget/task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
registerWidgetConfigurationScreen(WidgetConfigurationScreen);
