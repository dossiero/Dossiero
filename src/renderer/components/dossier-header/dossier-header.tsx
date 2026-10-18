import {
  Archive,
  ArrowLeft,
  Edit3,
  Menu,
  MoreHorizontal,
} from 'lucide-react';
import type { Person } from '@shared/types';
import { shortId } from '@/lib/identifier-format';
import { Button } from '@/components/button/button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
} from '@/components/dropdown-menu/dropdown-menu';
import { Title } from '@/components/title/title';
import './dossier-header.css';

interface DossierHeaderProps {
  person: Person;
  profileUrl?: string;
  onEdit: () => void;
  onDelete: () => void;
  onMenu: () => void;
  backTargetName?: string;
  onBack?: () => void;
}

export function DossierHeader({
  person,
  profileUrl,
  onEdit,
  onDelete,
  onMenu,
  backTargetName,
  onBack,
}: DossierHeaderProps) {
  const initials = person.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="dossier-header">
      <div className="mobile-titlebar">
        <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Open subjects">
          <Menu size={18}/>
        </Button>
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label={`Back to ${backTargetName}`}
          >
            <ArrowLeft size={17}/>
          </Button>
        )}
        <span>DOSSIER / {shortId(person.id)}</span>
      </div>
      {onBack && (
        <Button className="dossier-return" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={13}/> Back to {backTargetName}
        </Button>
      )}
      <div className="header-main">
        <div className={`scanner-avatar ${profileUrl ? 'has-photo' : 'panel-brackets'}`}>
          {profileUrl
            ? <img src={profileUrl} alt={`${person.name} profile`} draggable={false}/>
            : <span>{initials}</span>}
        </div>
        <div className="subject-identity">
          <div className="subject-code">TARGET // <span>{shortId(person.id)}</span></div>
          <Title level={1}>{person.name}</Title>
          <div className="alias-line">
            {person.aliases.length
              ? <>ALIASES: {person.aliases.join(' / ')}</>
              : 'ALIASES: // NONE LOGGED'}
          </div>
          <p>{person.summary || '// Summary channel is empty. Add a concise subject overview.'}</p>
        </div>
        <div className="header-actions">
          <Button variant="signal" size="sm" onClick={onEdit}>
            <Edit3 size={13}/> Edit
          </Button>
          <Dropdown>
            <DropdownTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More subject actions">
                <MoreHorizontal size={17}/>
              </Button>
            </DropdownTrigger>
            <DropdownContent>
              <DropdownItem onSelect={onDelete} danger>
                <Archive size={13}/> Archive
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
