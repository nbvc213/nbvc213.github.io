import { run, maven } from './maven.mjs';
const mode = process.argv[2];
if (!['full','ui','content'].includes(mode)) throw new Error('Unknown build mode');
await run(process.execPath, ['scripts/sync-content.mjs']);
if (mode === 'full') {
  await run(process.execPath, ['--test', 'scripts/build-guard.test.mjs', 'scripts/sync-content.test.mjs', 'scripts/appearance.test.mjs', 'scripts/release-check.test.mjs', 'scripts/rebuild-queue.test.mjs', 'scripts/personal-data.test.mjs', 'scripts/annotation-locator.test.mjs', 'scripts/panel-widths.test.mjs']);
  await run(process.execPath, ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit']);
}
if (mode !== 'content') await run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
await maven(mode === 'full' ? ['-B','test','compile','exec:java'] : ['-B','-q','compile','exec:java']);
