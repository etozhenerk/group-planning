import {readFile} from 'node:fs/promises';
const shared='/private/tmp/somewhere-navigation/PageBack';
export const backPlugin={name:'shared-mobile-back',setup(build){
 build.onLoad({filter:/(MeetingHeader|AlbumHeader|CreatePreview|MapHeader|InfoDialogs|Onboarding|InfoSurface)\.tsx$/},async args=>{
 let s=await readFile(args.path,'utf8'),before=s;
 if(args.path.endsWith('/MeetingHeader.tsx'))s=s.replace(/      <Link[\s\S]*?      <\/Link>/,'      <PageBack label="К моим встречам" href="../calendar-r7/frame.html?view=list" />');
 if(args.path.endsWith('/AlbumHeader.tsx'))s=s.replace(/        <a[\s\S]*?        <\/a>/,'        <PageBack label="К моим встречам" href="../calendar-r7/frame.html?view=list&amp;period=past" />');
 if(args.path.endsWith('/CreatePreview.tsx'))s=s.replace(/<button className=\{styles.back\}[\s\S]*?<\/button>/,'<PageBack label="К моим встречам" onClick={()=>window.dispatchEvent(new Event("preview-cancel"))} />');
 if(args.path.endsWith('/MapHeader.tsx'))s=s.replace(/      <button[\s\S]*?      <\/button>/,'      <PageBack label={label} onClick={back} />');
 if(args.path.endsWith('/InfoDialogs.tsx'))s=s.replace(/      <button className=\{styles.back\}[\s\S]*?      <\/button>/,'      <PageBack label="К деталям встречи" onClick={() => m.setChild(null)} />');
 if(args.path.endsWith('/Onboarding.tsx'))s=s.replace(/<button type="button" className=\{styles.back\}[\s\S]*?<\/button>/,'<span style={{visibility:page===0?"hidden":"visible"}}><PageBack label="Предыдущий шаг" disabled={auth==="busy"} onClick={()=>go(page-1)} /></span>');
 if(args.path.endsWith('/InfoSurface.tsx'))s=s.replace('../chat-r7-avatars/frame.html','../nav-chat/frame.html');
 if(s===before)return;
 return {contents:'import {PageBack} from "'+shared+'";\n'+s,loader:'tsx',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))};
 });
}};
