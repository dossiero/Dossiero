import { Command } from 'cmdk';
import { useEffect, useRef, useState } from 'react';
import { Cog, FileText, MoonStar, Search, SunMedium, UserRound, X } from 'lucide-react';
import type { SearchResult } from '@shared/types';
import brandMark from '@/assets/dossier-brand-mark.png';
import { Button } from '@/components/button/button';
import { Tooltip } from '@/components/tooltip/tooltip';
import './app-toolbar.css';

interface AppToolbarProps {
  query: string;
  results: SearchResult[];
  onQuery: (value: string) => void;
  onSelect: (personId: string) => void;
  appearance: 'dark' | 'light';
  onAppearance: () => void;
  onSettings: () => void;
}

export function AppToolbar({
  query,
  results,
  onQuery,
  onSelect,
  appearance,
  onAppearance,
  onSettings,
}: AppToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRoot = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const selectResult = (personId: string) => {
    onSelect(personId);
    onQuery('');
    setSearchOpen(false);
    searchInput.current?.blur();
  };

  useEffect(()=>{const onPointerDown=(event:PointerEvent)=>{if(!searchRoot.current?.contains(event.target as Node))setSearchOpen(false)};document.addEventListener('pointerdown',onPointerDown);return()=>document.removeEventListener('pointerdown',onPointerDown)},[]);
  useEffect(()=>{const onKeyDown=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();searchInput.current?.focus();setSearchOpen(true)}};window.addEventListener('keydown',onKeyDown,{capture:true});return()=>window.removeEventListener('keydown',onKeyDown,{capture:true})},[]);

  const personResults=results.filter(result=>result.source==='person');
  const textResults=results.filter(result=>result.source==='text');
  return <header className="app-toolbar">
    <div className="toolbar-brand" aria-label="Dossiero">
      <img className="toolbar-brand-mark" src={brandMark} alt="" />
      <span className="toolbar-wordmark">
        DOSS<span>IERO</span>
      </span>
    </div>
    <div className="toolbar-search-shell" ref={searchRoot}>
      <Command className="toolbar-command" shouldFilter={false}>
        <div className="toolbar-search">
          <Search size={17}/>
          <Command.Input ref={searchInput} value={query} onValueChange={value=>{onQuery(value);setSearchOpen(true)}} onFocus={()=>setSearchOpen(true)} placeholder="Search dossiers, notes and evidence" aria-label="Global search"/>
          {query?<button type="button" className="toolbar-search-clear" onClick={()=>{onQuery('');searchInput.current?.focus()}} aria-label="Clear search"><X size={14}/></button>:<kbd>⌘K</kbd>}
        </div>
        {searchOpen&&query.trim()&&<Command.List className="toolbar-search-results">
          <Command.Empty>// NO MATCHES IN LOCAL INDEX</Command.Empty>
          {personResults.length>0&&<Command.Group heading="SUBJECTS">{personResults.map(result=><Command.Item key={`person-${result.personId}`} value={`person-${result.personId}`} onSelect={()=>selectResult(result.personId)}><UserRound size={14}/><span><strong>{result.title}</strong><small>{result.excerpt||result.personName}</small></span><kbd>open ↵</kbd></Command.Item>)}</Command.Group>}
          {textResults.length>0&&<Command.Group heading="INTELLIGENCE HITS">{textResults.map((result,index)=><Command.Item key={`text-${result.personId}-${index}`} value={`text-${result.personId}-${index}`} onSelect={()=>selectResult(result.personId)}><FileText size={14}/><span><strong>{result.title}</strong><small>{result.personName} · {result.excerpt}</small></span></Command.Item>)}</Command.Group>}
        </Command.List>}
      </Command>
    </div>
    <div className="toolbar-actions">
      <Tooltip label={`Switch to ${appearance === 'dark' ? 'Light' : 'Dark'} appearance`}>
        <Button
          size="icon"
          variant="ghost"
          onClick={onAppearance}
          aria-label="Switch appearance"
        >
          {appearance === 'dark' ? <SunMedium size={17}/> : <MoonStar size={17}/>}
        </Button>
      </Tooltip>
      <Tooltip label="Settings (Command+,)"><Button size="icon" variant="ghost" onClick={onSettings} aria-label="Open settings"><Cog size={17}/></Button></Tooltip>
    </div>
  </header>;
}
