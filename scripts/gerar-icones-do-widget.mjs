/**
 * O widget desenha com SVG, e os icones do lucide sao componentes React — inuteis fora da
 * arvore do app. Este script extrai a geometria de cada icone usado em src/ui/icons.ts e
 * escreve src/widget/lucide-paths.ts. O arquivo gerado vai para o git: assim o build nao
 * depende de rodar nada, e um upgrade do lucide vira um diff visivel.
 *
 *   node scripts/gerar-icones-do-widget.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ICONS_FILE = 'src/ui/icons.ts';
const OUTPUT_FILE = 'src/widget/lucide-paths.ts';
const LUCIDE_DIR = 'node_modules/lucide-react-native/dist/esm/icons';

const names = [...readFileSync(ICONS_FILE, 'utf8').matchAll(/^ {2}'([a-z0-9-]+)':/gm)].map((match) => match[1]);

if (names.length === 0) throw new Error(`nenhum icone encontrado em ${ICONS_FILE}`);

function nodeOf(name) {
  const source = readFileSync(`${LUCIDE_DIR}/${name}.mjs`, 'utf8');
  const start = source.indexOf('[', source.indexOf('createLucideIcon('));
  const end = source.lastIndexOf(']);');

  if (start === -1 || end === -1) throw new Error(`nao consegui ler a geometria de ${name}`);

  return new Function(`return ${source.slice(start, end + 1)}`)();
}

function kebab(attribute) {
  return attribute.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function svgBodyOf(name) {
  return nodeOf(name)
    .map(([tag, attributes]) => {
      const props = Object.entries(attributes)
        .filter(([attribute]) => attribute !== 'key')
        .map(([attribute, value]) => `${kebab(attribute)}="${value}"`)
        .join(' ');

      return `<${tag} ${props}/>`;
    })
    .join('');
}

const entries = names.map((name) => `  '${name}': '${svgBodyOf(name).replace(/'/g, "\\'")}',`).join('\n');

writeFileSync(
  OUTPUT_FILE,
  `/* Gerado por scripts/gerar-icones-do-widget.mjs. Nao edite a mao. */

/** So a geometria: o traco e a cor entram na hora de montar o SVG do widget. */
export const lucidePaths: Record<string, string> = {
${entries}
};
`,
);

console.log(`${names.length} icones em ${OUTPUT_FILE}`);
