import { z } from 'zod';
import type { IpcChannel } from '../shared/ipc.js';
import {
  caseInputSchema,
  idSchema,
  linkInputSchema,
  mapInputSchema,
  mediaUpdateSchema,
  mediaUploadPayloadSchema,
  personInputSchema,
  relationTypeSchema,
  settingsSchema,
  tabIconSchema,
  tabInputSchema,
  textInputSchema,
} from '../shared/schemas.js';
import type { DossierService } from './service.js';

const idPayload = z.object({ id: idSchema });

export function dispatchCore(service: DossierService, channel: IpcChannel, raw: unknown): unknown {
  switch (channel) {
    case 'cases:list': return service.listCases();
    case 'cases:create': return service.createCase(caseInputSchema.parse(raw));
    case 'people:list': {
      const { query, status, includeRelated, caseId } = z.object({
        query: z.string().max(300).optional(),
        status: z.enum(['active', 'archived']).optional(),
        includeRelated: z.boolean().optional(),
        caseId: idSchema.optional(),
      }).parse(raw);
      return service.listPeople(query, status, includeRelated, caseId);
    }
    case 'people:get': return service.getPerson(idPayload.parse(raw).id);
    case 'people:create': {
      const value = z.object({ input: personInputSchema, caseId: idSchema.optional() }).parse(raw);
      return service.createPerson(value.input, value.caseId);
    }
    case 'people:update': {
      const value = z.object({ id: idSchema, input: personInputSchema }).parse(raw);
      return service.updatePerson(value.id, value.input);
    }
    case 'people:profile-photo': {
      const value = z.object({ personId: idSchema, mediaId: idSchema }).parse(raw);
      return service.setProfilePhoto(value.personId, value.mediaId);
    }
    case 'people:archive': {
      const value = z.object({ id: idSchema, archived: z.boolean() }).parse(raw);
      return service.setPersonArchived(value.id, value.archived);
    }
    case 'people:pin': {
      const value = z.object({ id: idSchema, pinned: z.boolean() }).parse(raw);
      return service.setPersonPinned(value.id, value.pinned);
    }
    case 'people:delete': service.deletePerson(idPayload.parse(raw).id); return null;
    case 'relations:create-person': {
      const value = z.object({ viewPersonId: idSchema, tabId: idSchema, ownerPersonId: idSchema, relationType: relationTypeSchema, input: personInputSchema }).parse(raw);
      return service.createRelatedPerson(value.viewPersonId, value.tabId, value.ownerPersonId, value.relationType, value.input);
    }
    case 'relations:update': {
      const value = z.object({ id: idSchema, relationType: relationTypeSchema }).parse(raw);
      return service.updateRelationship(value.id, value.relationType);
    }
    case 'relations:delete': service.deleteRelationship(idPayload.parse(raw).id); return null;
    case 'relations:position': {
      const value = z.object({ viewPersonId: idSchema, tabId: idSchema, personId: idSchema, x: z.number().finite(), y: z.number().finite() }).parse(raw);
      return service.updateRelationPosition(value.viewPersonId, value.tabId, value.personId, value.x, value.y);
    }
    case 'tabs:create': {
      const value = z.object({ personId: idSchema, input: tabInputSchema }).parse(raw);
      return service.createTab(value.personId, value.input);
    }
    case 'tabs:update': {
      const value = z.object({ id: idSchema, input: z.object({ name: z.string().trim().min(1).max(80).optional(), icon: tabIconSchema.optional(), position: z.number().int().min(0).optional() }) }).parse(raw);
      return service.updateTab(value.id, value.input);
    }
    case 'tabs:delete': service.deleteTab(idPayload.parse(raw).id); return null;
    case 'text:save': return service.saveTextDocument(textInputSchema.parse(raw));
    case 'maps:save': return service.saveMapDocument(mapInputSchema.parse(raw));
    case 'media:upload': {
      const value = mediaUploadPayloadSchema.parse(raw);
      return service.uploadMedia(value.personId, value.tabId, value.files);
    }
    case 'media:update': {
      const value = z.object({ id: idSchema, input: mediaUpdateSchema }).parse(raw);
      return service.updateMedia(value.id, value.input);
    }
    case 'media:delete': service.deleteMedia(idPayload.parse(raw).id); return null;
    case 'media:read': {
      const data = service.readMedia(idPayload.parse(raw).id);
      if (!data) throw new Error('Media file not found');
      return new Uint8Array(data);
    }
    case 'links:create': return service.createLink(linkInputSchema.parse(raw));
    case 'links:update': {
      const value = z.object({ id: idSchema, input: linkInputSchema.omit({ personId: true, tabId: true }) }).parse(raw);
      return service.updateLink(value.id, value.input);
    }
    case 'links:delete': service.deleteLink(idPayload.parse(raw).id); return null;
    case 'search': {
      const value = z.object({
        query: z.string().max(300),
        caseId: idSchema.optional(),
      }).parse(raw);
      return service.search(value.query, value.caseId);
    }
    case 'settings:get': return service.getSettings();
    case 'settings:update': return service.updateSettings(settingsSchema.parse(raw));
    default: throw new Error(`Channel ${channel} requires a native handler`);
  }
}
