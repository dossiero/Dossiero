import type { GeoJsonPosition, MapFeature, MapFeatureProperties, MapGeometry } from '@shared/types';
import { sanitizeInlineRichText } from '@/lib/rich-text';

const maxKmzEntrySize = 50 * 1024 * 1024;

export async function importMapFile(file: File): Promise<MapFeature[]> {
  const extension=file.name.split('.').pop()?.toLowerCase();
  if(extension==='kmz'||file.type==='application/vnd.google-earth.kmz')return parseKml(await readKmzDocument(file));
  if(extension==='kml'||file.type==='application/vnd.google-earth.kml+xml')return parseKml(await file.text());
  return normalizeGeoJson(JSON.parse(await file.text()));
}

export function normalizeGeoJson(value: unknown): MapFeature[] {
  const root=value as {type?:unknown;features?:unknown[]};
  const candidates=root?.type==='FeatureCollection'&&Array.isArray(root.features)?root.features:root?.type==='Feature'?[root]:[];
  return candidates.flatMap((candidate,index)=>{
    const feature=candidate as {id?:unknown;type?:unknown;geometry?:MapGeometry;properties?:MapFeatureProperties};
    if(feature.type!=='Feature'||!feature.geometry||!['Point','LineString','Polygon'].includes(feature.geometry.type))return[];
    return[{type:'Feature' as const,id:typeof feature.id==='string'?feature.id:`import-${crypto.randomUUID()}-${index}`,geometry:feature.geometry,properties:{...(feature.properties??{}),color:validColor(feature.properties?.color)?feature.properties!.color:'#f0a52b'}}];
  });
}

export async function readKmzDocument(file:Pick<File,'arrayBuffer'>):Promise<string>{
  const bytes=new Uint8Array(await file.arrayBuffer());
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const eocd=findSignature(view,0x06054b50,Math.max(0,bytes.length-65557),bytes.length-22);
  if(eocd<0)throw new Error('Invalid KMZ archive');
  const entryCount=view.getUint16(eocd+10,true);const centralOffset=view.getUint32(eocd+16,true);
  let offset=centralOffset;let selected:{method:number;compressedSize:number;uncompressedSize:number;localOffset:number;name:string}|null=null;
  for(let index=0;index<entryCount;index++){
    if(offset+46>bytes.length||view.getUint32(offset,true)!==0x02014b50)throw new Error('Invalid KMZ directory');
    const flags=view.getUint16(offset+8,true);if(flags&1)throw new Error('Encrypted KMZ files are not supported');
    const method=view.getUint16(offset+10,true),compressedSize=view.getUint32(offset+20,true),uncompressedSize=view.getUint32(offset+24,true);
    const nameLength=view.getUint16(offset+28,true),extraLength=view.getUint16(offset+30,true),commentLength=view.getUint16(offset+32,true),localOffset=view.getUint32(offset+42,true);
    const name=new TextDecoder().decode(bytes.subarray(offset+46,offset+46+nameLength));
    if(name.toLowerCase().endsWith('.kml')&&(!selected||name.toLowerCase().endsWith('/doc.kml')||name.toLowerCase()==='doc.kml'))selected={method,compressedSize,uncompressedSize,localOffset,name};
    offset+=46+nameLength+extraLength+commentLength;
  }
  if(!selected)throw new Error('KMZ does not contain a KML document');
  if(selected.uncompressedSize>maxKmzEntrySize)throw new Error('KML document exceeds the 50MB import limit');
  const local=selected.localOffset;if(local+30>bytes.length||view.getUint32(local,true)!==0x04034b50)throw new Error('Invalid KMZ entry');
  const nameLength=view.getUint16(local+26,true),extraLength=view.getUint16(local+28,true),start=local+30+nameLength+extraLength,end=start+selected.compressedSize;
  if(end>bytes.length)throw new Error('Truncated KMZ entry');
  const compressed=bytes.slice(start,end);let content:Uint8Array;
  if(selected.method===0)content=compressed;
  else if(selected.method===8){
    try{const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));content=new Uint8Array(await new Response(stream).arrayBuffer())}
    catch{throw new Error('Could not decompress the KMZ document')}
  }else throw new Error(`Unsupported KMZ compression method ${selected.method}`);
  if(content.byteLength>maxKmzEntrySize)throw new Error('KML document exceeds the 50MB import limit');
  return new TextDecoder().decode(content);
}

function parseKml(source:string):MapFeature[]{
  const xml=new DOMParser().parseFromString(source,'application/xml');
  if(xml.getElementsByTagName('parsererror').length)throw new Error('Invalid KML document');
  const styles=new Map<string,string>();
  for(const style of Array.from(xml.getElementsByTagNameNS('*','Style'))){const id=style.getAttribute('id');const color=kmlStyleColor(style);if(id&&color)styles.set(`#${id}`,color)}
  const features:MapFeature[]=[];
  for(const placemark of Array.from(xml.getElementsByTagNameNS('*','Placemark'))){
    const label=childText(placemark,'name');const description=sanitizeInlineRichText(childText(placemark,'description'));
    const styleUrl=childText(placemark,'styleUrl');const color=kmlStyleColor(directChild(placemark,'Style'))??styles.get(styleUrl)??'#f0a52b';
    const base:MapFeatureProperties={label,description,color};
    const geometries=geometryChildren(placemark);
    geometries.forEach((geometry,index)=>features.push({type:'Feature',id:`${placemark.getAttribute('id')||crypto.randomUUID()}-${index}`,geometry,properties:{...base,shape:geometry.type==='Point'?'pin':geometry.type==='LineString'?'line':'polygon',icon:geometry.type==='Point'?'pin':undefined}}));
  }
  if(!features.length)throw new Error('No supported placemarks found in the KML document');
  return features;
}

function geometryChildren(placemark:Element):MapGeometry[]{
  const result:MapGeometry[]=[];
  const visit=(node:Element)=>{for(const child of Array.from(node.children)){const name=child.localName;if(name==='Point'){const points=parseCoordinates(childText(child,'coordinates'));if(points[0])result.push({type:'Point',coordinates:points[0]})}else if(name==='LineString'){const points=parseCoordinates(childText(child,'coordinates'));if(points.length>=2)result.push({type:'LineString',coordinates:points})}else if(name==='Polygon'){const rings=Array.from(child.getElementsByTagNameNS('*','LinearRing')).map(ring=>closeRing(parseCoordinates(childText(ring,'coordinates')))).filter(ring=>ring.length>=4);if(rings.length)result.push({type:'Polygon',coordinates:rings})}else if(name==='MultiGeometry')visit(child)}};
  visit(placemark);return result;
}
function parseCoordinates(value:string):GeoJsonPosition[]{return value.trim().split(/\s+/).flatMap(token=>{const [lon,lat]=token.split(',').map(Number);return Number.isFinite(lon)&&Number.isFinite(lat)&&lon>=-180&&lon<=180&&lat>=-90&&lat<=90?[[lon,lat] as GeoJsonPosition]:[]})}
function closeRing(points:GeoJsonPosition[]){if(!points.length)return points;const first=points[0],last=points.at(-1)!;return first[0]===last[0]&&first[1]===last[1]?points:[...points,first]}
function directChild(node:Element,name:string):Element|null{return Array.from(node.children).find(child=>child.localName===name)??null}
function childText(node:Element,name:string):string{return directChild(node,name)?.textContent?.trim()??''}
function kmlStyleColor(style:Element|null):string|null{if(!style)return null;const value=style.getElementsByTagNameNS('*','color')[0]?.textContent?.trim();if(!value||!/^([0-9a-f]{8}|[0-9a-f]{6})$/i.test(value))return null;const rgb=value.length===8?value.slice(2):value;return`#${rgb.slice(4,6)}${rgb.slice(2,4)}${rgb.slice(0,2)}`.toLowerCase()}
function validColor(value:unknown):value is string{return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)}
function findSignature(view:DataView,signature:number,min:number,start:number){for(let offset=Math.min(start,view.byteLength-4);offset>=min;offset--)if(view.getUint32(offset,true)===signature)return offset;return-1}
