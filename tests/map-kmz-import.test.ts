import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import test from 'node:test';
import { readKmzDocument } from '../src/renderer/features/map/logic/import.js';

test('extracts a deflated KML document from a KMZ archive', async () => {
  const kml='<kml><Placemark><name>Lisbon</name><Point><coordinates>-9.1393,38.7223,0</coordinates></Point></Placemark></kml>';
  const archive=kmzWithDocument(kml);
  const extracted=await readKmzDocument({arrayBuffer:async()=>archive.buffer.slice(archive.byteOffset,archive.byteOffset+archive.byteLength) as ArrayBuffer});
  assert.equal(extracted,kml);
});

function kmzWithDocument(source:string):Buffer{
  const name=Buffer.from('doc.kml');const content=Buffer.from(source);const compressed=deflateRawSync(content);
  const local=Buffer.alloc(30+name.length);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(content.length,22);local.writeUInt16LE(name.length,26);name.copy(local,30);
  const central=Buffer.alloc(46+name.length);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(8,10);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(content.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(0,42);name.copy(central,46);
  const eocd=Buffer.alloc(22);eocd.writeUInt32LE(0x06054b50,0);eocd.writeUInt16LE(1,8);eocd.writeUInt16LE(1,10);eocd.writeUInt32LE(central.length,12);eocd.writeUInt32LE(local.length+compressed.length,16);
  return Buffer.concat([local,compressed,central,eocd]);
}
