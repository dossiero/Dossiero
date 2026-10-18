import { Database, FolderOpen, Pin, Plus, Trash2, UserRoundSearch, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { CaseSummary, Person } from '@shared/types';
import { Button } from '@/components/button/button';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { Tooltip } from '@/components/tooltip/tooltip';
import { PersonListItem } from '@/features/people/components/person-list-item/person-list-item';
import { CaseSelector } from '@/features/cases/components/case-selector/case-selector';
import './person-sidebar.css';

interface PersonSidebarProps {
  cases: CaseSummary[];
  selectedCaseId: string | null;
  people: Person[];
  selectedId: string | null;
  onCaseSelect: (caseId: string) => void;
  onCaseAdd: () => void;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (person: Person) => void;
  onPin: (person: Person) => void;
  onArchive: (person: Person) => void;
  onBackup: () => void;
  onFolder: () => void;
  onTrash: () => void;
  trashActive: boolean;
  archivedCount: number;
  avatarUrl: (person: Person) => string | undefined;
  browserFallback: boolean;
  compact?: boolean;
  compactClose?: () => void;
}

export function PersonSidebar({
  cases,
  selectedCaseId,
  people,
  selectedId,
  onCaseSelect,
  onCaseAdd,
  onSelect,
  onEdit,
  onPin,
  onArchive,
  onAdd,
  onBackup,
  onFolder,
  onTrash,
  trashActive,
  archivedCount,
  avatarUrl,
  browserFallback,
  compact = false,
  compactClose,
}: PersonSidebarProps) {
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated');
  const groupedPeople = useMemo(() => {
    const sorted = [...people].sort((a, b) => {
    const nameOrder = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    if (sortBy === 'name') return nameOrder || a.id.localeCompare(b.id);
    const field = sortBy === 'created' ? 'createdAt' : 'updatedAt';
    return Date.parse(b[field]) - Date.parse(a[field]) || nameOrder || a.id.localeCompare(b.id);
    });
    return { pinned: sorted.filter((person) => person.pinned), others: sorted.filter((person) => !person.pinned) };
  }, [people, sortBy]);
  const renderPerson = (person: Person, index: number) => <PersonListItem key={person.id} person={person} avatarUrl={avatarUrl(person)} selected={!trashActive&&person.id === selectedId} onClick={() => onSelect(person.id)} onEdit={()=>onEdit(person)} onPin={()=>onPin(person)} onArchive={()=>onArchive(person)} index={index}/>;

  return <aside className={`person-sidebar panel${compact ? ' is-compact' : ''}`}>
    {compactClose && <div className="sidebar-sheet-head"><span>SUBJECTS</span><Button variant="ghost" size="icon" className="sidebar-close" onClick={compactClose} aria-label="Close subject list"><X size={17}/></Button></div>}
    <CaseSelector
      cases={cases}
      selectedCaseId={selectedCaseId}
      compact={compact}
      onSelect={onCaseSelect}
      onAdd={onCaseAdd}
    />
    {!compact && <div className="target-label">
      <span>{people.length} {people.length === 1 ? 'TARGET' : 'TARGETS'}</span>
      <label className="person-sort"><span>SORT</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} aria-label="Sort people">
        <option value="updated">LAST EDITED</option>
        <option value="created">DATE ADDED</option>
        <option value="name">NAME A–Z</option>
      </select></label>
    </div>}
    <ScrollArea className="person-scroll">
      <div className="person-list" role="listbox" aria-label="People">
        {people.length ? <>
          {groupedPeople.pinned.length > 0 && <div className="person-group-label"><Pin size={10}/>{!compact&&<span>PINNED</span>}</div>}
          {groupedPeople.pinned.map((person, index) => renderPerson(person, index))}
          {groupedPeople.pinned.length > 0 && groupedPeople.others.length > 0 && <div className="person-group-label is-all">{!compact&&<span>ALL PEOPLE</span>}</div>}
          {groupedPeople.others.map((person, index) => renderPerson(person, groupedPeople.pinned.length + index))}
        </> : <div className="sidebar-empty"><UserRoundSearch size={22}/>{!compact&&<span>// NO MATCHING TARGETS</span>}</div>}
      </div>
    </ScrollArea>
    {compact ? <footer className="sidebar-footer sidebar-compact-footer"><Tooltip label="Add person"><Button variant="ghost" size="icon" className="sidebar-compact-add" onClick={onAdd} aria-label="Add person"><Plus size={22}/></Button></Tooltip></footer> : <footer className="sidebar-footer">
      {browserFallback && <div className="fallback-notice"><span>△ TRANSIENT MODE</span><small>Dev server not detected</small></div>}
      <div className="sidebar-add-person"><Button variant="signal" onClick={onAdd}><Plus size={14}/><span className="sidebar-add-label">Add <span className="sidebar-add-person-word">person</span></span></Button></div>
      <div className="footer-actions">
        <Tooltip label="Export database and media backup">
          <Button
            size="icon"
            variant="ghost"
            onClick={onBackup}
            aria-label="Export backup"
          >
            <Database size={15}/>
          </Button>
        </Tooltip>
        <Tooltip label="Open media vault"><Button size="icon" variant="ghost" onClick={onFolder} aria-label="Open media folder"><FolderOpen size={15}/></Button></Tooltip>
        <Tooltip label={`Trash (${archivedCount})`}><Button className={trashActive?'is-active':''} size="icon" variant="ghost" onClick={onTrash} aria-label={`Open trash, ${archivedCount} archived people`}><Trash2 size={15}/></Button></Tooltip>
      </div>
    </footer>}
  </aside>;
}
