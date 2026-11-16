// Deterministic ZIP of the tracked PNGs, contact sheets and catalogs. No external dependencies.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../public/healing/custom-icons');
const table=Uint32Array.from({length:256},(_,value)=>{let crc=value;for(let bit=0;bit<8;bit++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;return crc>>>0});
function checksum(data){let crc=0xffffffff;for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]).filter(file=>file.endsWith('.png')||['catalog.json','catalog.csv','contact-sheet.jpg'].includes(path.basename(file)))}
function writeZip(filename,entries){
const local=[],central=[];let offset=0,count=0;
for(const entry of entries){
 const name=Buffer.from(entry.name),data=entry.data,crc=checksum(data),date=(46<<9)|(1<<5)|1;
 const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(date,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);
 local.push(header,name,data);
 const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);record.writeUInt16LE(0x800,8);record.writeUInt16LE(date,14);record.writeUInt32LE(crc,16);record.writeUInt32LE(data.length,20);record.writeUInt32LE(data.length,24);record.writeUInt16LE(name.length,28);record.writeUInt32LE(offset,42);central.push(record,name);
 offset+=header.length+name.length+data.length;count++;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(count,8);end.writeUInt16LE(count,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const bytes=Buffer.concat([...local,directory,end]);
if(bytes.length>25*1024*1024)throw Error('Icon ZIP exceeds Sites file limit: '+filename);
fs.writeFileSync(path.join(root,filename),bytes);return bytes.length;
}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8')),parts=[];
for(const category of ['spells','equipment']){
 const categorySets=catalog.sets.filter(set=>(set.category??'spells')===category),chunk=category==='equipment'?4:3;
 let number=0;
 for(let offset=0;offset<categorySets.length;offset+=chunk){
  const sets=categorySets.slice(offset,offset+chunk),ids=new Set(sets.map(s=>s.id)),icons=catalog.icons.filter(i=>ids.has(i.set));
  const prefixes=sets.map(set=>(set.directory??set.id)+'/');
  const entries=files(root).filter(file=>prefixes.some(prefix=>path.relative(root,file).split(path.sep).join('/').startsWith(prefix))).map(file=>({name:path.relative(root,file).split(path.sep).join('/'),data:fs.readFileSync(file)}));
  entries.push({name:'catalog.json',data:Buffer.from(JSON.stringify({version:1,category,sets,icons},null,2)+'\n')});
  const columns=['id','set','number','row','column','name','path','width','height'];
  const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
  entries.push({name:'catalog.csv',data:Buffer.from([columns.join(','),...icons.map(icon=>columns.map(key=>quote(icon[key])).join(','))].join('\n')+'\n')});
  const index=++number,filename=category==='equipment'?'equipment-icons-part-'+index+'.zip':index===1?'healing-and-mana-icons.zip':index===2?'nature-icons.zip':'icon-library-part-'+index+'.zip';
  const sizeBytes=writeZip(filename,entries);parts.push({category,part:index,path:filename,iconCount:icons.length,sizeBytes,sets:sets.map(s=>s.title)});
 }
}
fs.writeFileSync(path.join(root,'downloads.json'),JSON.stringify({totalIcons:catalog.icons.length,parts},null,2)+'\n');
