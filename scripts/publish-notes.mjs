import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
const checkOnly=process.argv.includes('--check-only');
function git(args, allowed=[0]){const r=spawnSync('git',args,{encoding:'utf8'});if(r.error)throw r.error;if(!allowed.includes(r.status))throw new Error((r.stderr||r.stdout||'Git执行失败').trim());return {text:(r.stdout||'').trim(),code:r.status};}
function npmTask(command){console.log('执行：npm '+command);const r=process.platform==='win32'?spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm.cmd '+command],{stdio:'inherit'}):spawnSync('npm',command.split(' '),{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)throw new Error('本地检查失败：npm '+command);}
try{
 if(git(['rev-parse','--show-toplevel']).text.replaceAll('\\','/').toLowerCase()!==root.replaceAll('\\','/').toLowerCase())throw new Error('请将BAT和scripts目录放在仓库根目录。');
 const remote=git(['remote','get-url','origin']).text;
 if(!/^(?:https:\/\/github\.com\/|git@github\.com:)nbvc213\/nbvc213\.github\.io(?:\.git)?\/?$/.test(remote))throw new Error('origin不是预期的nbvc213.github.io仓库，已停止。');
 const branch=git(['branch','--show-current']).text;
 const defaultRef=git(['symbolic-ref','--short','refs/remotes/origin/HEAD']).text;
 const defaultBranch=defaultRef.replace(/^origin\//,'');
 if(!branch||branch!==defaultBranch)throw new Error('请先切换到默认分支：'+defaultBranch);
 if(!checkOnly&&git(['diff','--cached','--quiet'],[0,1]).code===1)throw new Error('存在预先暂存的修改，请先完成或取消暂存后重试。');
 if(!existsSync('node_modules'))npmTask('ci');
 npmTask('run build');npmTask('run test:content');npmTask('run check:release');
 if(checkOnly){console.log('检查完成：未提交、未推送、未触发部署。');process.exit(0);}
 console.log('检查远端更新……');git(['fetch','origin',defaultBranch]);
 if(Number(git(['rev-list','--count','HEAD..origin/'+defaultBranch]).text)>0)throw new Error('远端有新提交。请先处理本地修改并同步远端，再重试；脚本不会自动合并。');
 const paths=['content','public','config','web','src','scripts','package.json','package-lock.json','pom.xml','.github/workflows/site.yml','scripts/publish-notes.mjs','publish-notes.bat','docs/一键更新笔记.md','docs/发布与回退.md','README.md'].filter(p=>existsSync(p));
 git(['add','-A','--',...paths]);
 if(git(['diff','--cached','--quiet'],[0,1]).code===1){
  console.log(git(['diff','--cached','--stat']).text);
  git(['commit','-m','Update notes '+new Date().toISOString()]);
 }else console.log('没有新的笔记修改；仍将尝试推送，便于重试上次失败的提交。');
 git(['push','origin',branch]);
 console.log('推送完成。若有新提交，GitHub将自动构建并发布；这里不代表线上部署已完成。');
 console.log('请查看：https://github.com/nbvc213/nbvc213.github.io/actions');
 console.log('网站：https://nbvc213.github.io/');
}catch(error){console.error('操作停止：'+error.message);console.error('没有强制推送或丢弃修改。网络错误时请确认代理正在运行；修复后可再次双击。');process.exitCode=1;}
