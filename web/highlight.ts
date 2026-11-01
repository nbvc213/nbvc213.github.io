import hljs from 'highlight.js/lib/common';
import xml from 'highlight.js/lib/languages/xml';
import powershell from 'highlight.js/lib/languages/powershell';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('vue', api => {
  const base = xml(api);
  return { ...base, name:'Vue', aliases:['vue-html'], contains:[
    {begin:/\{\{/,end:/\}\}/,subLanguage:'typescript'},
    ...(base.contains || []).map(mode => {
      if(typeof mode !== 'object') return mode;
      if(mode.begin?.toString().includes('<script')) return {...mode,starts:{...mode.starts,subLanguage:'typescript'}};
      if(mode.begin?.toString().includes('<style')) return {...mode,starts:{...mode.starts,subLanguage:'scss'}};
      return mode;
    })
  ]};
});
hljs.registerAliases(['vue3','vuejs'],{languageName:'vue'});
export default hljs;
