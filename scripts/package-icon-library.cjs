// Deterministic ZIP of the tracked PNGs, contact sheets and catalogs. No external dependencies.
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'../public/healing/custom-icons');
const table=Uint32Array.from({length:256},(_,value)=>{let crc=value;for(let bit=0;bit<8;bit++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;return crc>>>0});
function checksum(data){let crc=0xffffffff;for(const byte of data)crc=table[(crc^byte)&255]^(crc>>>8);return(crc^0xffffffff)>>>0}
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name)).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]).filter(file=>file.endsWith('.png')||['catalog.json','catalog.csv','contact-sheet.jpg'].includes(path.basename(file)))}
const local=[],central=[];let offset=0,count=0;
for(const file of files(root)){
 const name=Buffer.from(path.relative(root,file).split(path.sep).join('/')),data=fs.readFileSync(file),crc=checksum(data),date=(46<<9)|(1<<5)|1;
 const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(date,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(data.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);
 local.push(header,name,data);
 const record=Buffer.alloc(46);record.writeUInt32LE(0x02014b50);record.writeUInt16LE(20,4);record.writeUInt16LE(20,6);record.writeUInt16LE(0x800,8);record.writeUInt16LE(date,14);record.writeUInt32LE(crc,16);record.writeUInt32LE(data.length,20);record.writeUInt32LE(data.length,24);record.writeUInt16LE(name.length,28);record.writeUInt32LE(offset,42);central.push(record,name);
 offset+=header.length+name.length+data.length;count++;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(count,8);end.writeUInt16LE(count,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
fs.writeFileSync(path.join(root,'healing-and-mana-icons.zip'),Buffer.concat([...local,directory,end]));
