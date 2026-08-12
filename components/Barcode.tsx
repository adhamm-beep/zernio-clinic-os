"use client";

const patterns:Record<string,string>={"0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn","A":"wnnnnwnnw","B":"nnwnnwnnw","C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn","F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn","I":"nnwnnwwnn","J":"nnnnwwwnn","K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww","O":"wnnnwnnwn","P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn","U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn","Z":"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","*":"nwnnwnwnn"};

export default function Barcode({value,className=""}:{value:string;className?:string}){
 const clean=value.toUpperCase().replace(/[^0-9A-Z. -]/g,"-");const encoded=`*${clean}*`;let x=8;const bars:Array<{x:number;width:number}>=[];
 for(const char of encoded){const pattern=patterns[char]??patterns["-"];for(let i=0;i<pattern.length;i++){const width=pattern[i]==="w"?3:1;if(i%2===0)bars.push({x,width});x+=width;}x+=1;}
 return <svg className={className} viewBox={`0 0 ${x+8} 58`} role="img" aria-label={`Barcode ${clean}`} preserveAspectRatio="none"><rect width="100%" height="100%" fill="white"/>{bars.map((bar,i)=><rect key={i} x={bar.x} y="4" width={bar.width} height="38" fill="#020617"/>)}<text x={(x+8)/2} y="54" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#020617">{clean}</text></svg>;
}
