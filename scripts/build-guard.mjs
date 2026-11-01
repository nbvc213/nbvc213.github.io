import { join, resolve } from 'node:path';
import { run } from './maven.mjs';
export const javaCommand = process.env.JAVA_HOME ? join(process.env.JAVA_HOME,'bin',process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
export async function guardedBuild(mode) {
  if (!['full','ui','content'].includes(mode)) throw new Error('Unknown build mode');
  console.log('构建已排队，等待当前任务完成后开始。');
  await run(javaCommand, [resolve('scripts/BuildGuard.java'), resolve('.tools/build-pipeline.lock'), process.execPath, resolve('scripts/build-task.mjs'), mode]);
}
