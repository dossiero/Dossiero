import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DossierService } from '../src/main/service.js';

test('creates full related-person dossiers without adding them to the main people list', () => {
  const dataDir=mkdtempSync(join(tmpdir(),'dossier-relations-')); const service=new DossierService(dataDir,false);
  try {
    const target=service.createPerson({name:'Alex'});
    const relationTab=target.tabs.find(tab=>tab.kind==='relation')!;
    const maya=service.createRelatedPerson(target.person.id,relationTab.id,target.person.id,'wife',{name:'Maya'});
    assert.equal(maya.person.type,'related');
    assert.deepEqual(maya.tabs.map(tab=>tab.name),['Info','Media','Links','Relation']);
    assert.deepEqual(service.listPeople().map(person=>person.name),['Alex']);
    assert.deepEqual(
      service.listPeople('', 'active', true).map((person) => person.name),
      ['Maya', 'Alex'],
    );
    const network=service.getPerson(target.person.id)!;
    assert.deepEqual(network.relatedPeople.map(person=>person.name),['Maya']);
    assert.equal(network.relationships[0].relationType,'wife');
  } finally { service.close();rmSync(dataDir,{recursive:true,force:true}); }
});

test('returns chained relationships and persists per-view graph positions', () => {
  const dataDir=mkdtempSync(join(tmpdir(),'dossier-relation-graph-')); const service=new DossierService(dataDir,false);
  try {
    const alex=service.createPerson({name:'Alex'});
    const alexRelations=alex.tabs.find(tab=>tab.kind==='relation')!;
    const maya=service.createRelatedPerson(alex.person.id,alexRelations.id,alex.person.id,'wife',{name:'Maya'});
    const leo=service.createRelatedPerson(alex.person.id,alexRelations.id,maya.person.id,'son',{name:'Leo'});
    const nora=service.createRelatedPerson(alex.person.id,alexRelations.id,leo.person.id,'daughter',{name:'Nora'});
    service.updateRelationPosition(alex.person.id,alexRelations.id,maya.person.id,.2,.8);
    const network=service.getPerson(alex.person.id)!;
    assert.deepEqual(network.relatedPeople.map(person=>person.name),['Maya','Leo','Nora']);
    assert.deepEqual(network.relationships.map(relation=>relation.relationType),['wife','son','daughter']);
    assert.ok(network.relationships.every(relation=>relation.tabId===alexRelations.id));
    assert.deepEqual(network.relationPositions[0],{viewPersonId:alex.person.id,tabId:alexRelations.id,personId:maya.person.id,x:.2,y:.8});
    const mayaNetwork=service.getPerson(maya.person.id)!;
    assert.deepEqual(mayaNetwork.relatedPeople.map(person=>person.name),['Leo','Nora']);
    assert.deepEqual(mayaNetwork.relationships.map(relation=>relation.relationType),['son','daughter']);
    assert.deepEqual(service.getPerson(leo.person.id)!.relatedPeople.map(person=>person.name),['Nora']);
    assert.deepEqual(service.getPerson(nora.person.id)!.relatedPeople,[]);
  } finally { service.close();rmSync(dataDir,{recursive:true,force:true}); }
});

test('keeps people and positions isolated between multiple relation tabs', () => {
  const dataDir=mkdtempSync(join(tmpdir(),'dossier-relation-tabs-')); const service=new DossierService(dataDir,false);
  try {
    const target=service.createPerson({name:'Alex'});
    const familyTab=target.tabs.find(tab=>tab.kind==='relation')!;
    const workTab=service.createTab(target.person.id,{name:'Work network',kind:'relation'});
    const family=service.createRelatedPerson(target.person.id,familyTab.id,target.person.id,'sister',{name:'Maya'});
    const colleague=service.createRelatedPerson(target.person.id,workTab.id,target.person.id,'colleague',{name:'Leo'});
    service.updateRelationPosition(target.person.id,familyTab.id,family.person.id,.2,.3);
    service.updateRelationPosition(target.person.id,workTab.id,colleague.person.id,.8,.7);
    const bundle=service.getPerson(target.person.id)!;
    assert.deepEqual(bundle.relationships.filter(relation=>relation.tabId===familyTab.id).map(relation=>relation.relationType),['sister']);
    assert.deepEqual(bundle.relationships.filter(relation=>relation.tabId===workTab.id).map(relation=>relation.relationType),['colleague']);
    assert.deepEqual(bundle.relationPositions.filter(position=>position.tabId===familyTab.id).map(position=>position.personId),[family.person.id]);
    assert.deepEqual(bundle.relationPositions.filter(position=>position.tabId===workTab.id).map(position=>position.personId),[colleague.person.id]);
  } finally { service.close();rmSync(dataDir,{recursive:true,force:true}); }
});

test('removing a parent connection hides its now-unreachable descendant branch', () => {
  const dataDir=mkdtempSync(join(tmpdir(),'dossier-relation-branch-')); const service=new DossierService(dataDir,false);
  try {
    const target=service.createPerson({name:'Alex'});
    const relationTab=target.tabs.find(tab=>tab.kind==='relation')!;
    const maya=service.createRelatedPerson(target.person.id,relationTab.id,target.person.id,'wife',{name:'Maya'});
    service.createRelatedPerson(target.person.id,relationTab.id,maya.person.id,'son',{name:'Leo'});
    const rootConnection=service.getPerson(target.person.id)!.relationships.find(relation=>relation.relatedPersonId===maya.person.id)!;
    service.deleteRelationship(rootConnection.id);
    const network=service.getPerson(target.person.id)!;
    assert.deepEqual(network.relatedPeople,[]);
    assert.deepEqual(network.relationships,[]);
    assert.deepEqual(service.getPerson(maya.person.id)!.relatedPeople.map(person=>person.name),['Leo']);
    assert.equal(service.listPeople().some(person=>person.name==='Maya'||person.name==='Leo'),false);
  } finally { service.close();rmSync(dataDir,{recursive:true,force:true}); }
});
