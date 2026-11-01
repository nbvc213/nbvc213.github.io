import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export function run(command, args, options = {}) {
  return new Promise((ok, fail) => {
    const p = spawn(command, args, { stdio: 'inherit', ...options });
    p.on('error', fail); p.on('exit', code => code === 0 ? ok() : fail(new Error(`${command} exited ${code}`)));
  });
}

export async function maven(args) {
  const version = '3.9.9';
  const local = resolve(`.tools/apache-maven-${version}`);
  let home = process.env.NOTES_MAVEN_HOME || (existsSync(join(local, 'boot')) ? local : null);
  if (!home) {
    mkdirSync('.tools', { recursive: true });
    const url = `https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/${version}/apache-maven-${version}-bin.zip`;
    console.log('Preparing project-local Maven…');
    const r = await fetch(url, { signal: AbortSignal.timeout(60000) }); if (!r.ok || !r.body) throw new Error(`Maven download failed: ${r.status}`);
    const archive = resolve('.tools/maven.zip');
    await pipeline(Readable.fromWeb(r.body), createWriteStream(archive));
    const expected = '8beac8d11ef208f1e2a8df0682b9448a9a363d2ad13ca74af43705549e72e74c9378823bf689287801cbbfc2f6ea9596201d19ccacfdfb682ee8a2ff4c4418ba';
    if (createHash('sha512').update(readFileSync(archive)).digest('hex') !== expected) throw new Error('Maven archive checksum mismatch');
    const javaHome = process.env.JAVA_HOME;
    await run(javaHome ? join(javaHome, 'bin', process.platform === 'win32' ? 'jar.exe' : 'jar') : 'jar', ['xf', archive], { cwd: resolve('.tools') });
    home = local;
  }
  const javaHome = process.env.JAVA_HOME;
  const java = javaHome ? join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
  const { readdirSync } = await import('node:fs');
  const boot = readdirSync(join(home, 'boot')).find(x => x.startsWith('plexus-classworlds-') && x.endsWith('.jar'));
  await run(java, ['-classpath', join(home, 'boot', boot), `-Dmaven.home=${home}`, `-Dclassworlds.conf=${join(home, 'bin/m2.conf')}`, `-Dmaven.multiModuleProjectDirectory=${process.cwd()}`, '-Dfile.encoding=UTF-8', 'org.codehaus.plexus.classworlds.launcher.Launcher', ...args]);
}
