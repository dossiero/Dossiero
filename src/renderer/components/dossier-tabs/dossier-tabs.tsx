import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import type { PersonTab } from '@shared/types';
import { Button } from '@/components/button/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/context-menu/context-menu';
import { Tooltip } from '@/components/tooltip/tooltip';
import { defaultTabIcon, tabIcons } from '@/lib/tab-icons';
import './dossier-tabs.css';

type DropTarget = { id: string; edge: 'before' | 'after' } | null;

interface DossierTabsProps {
  tabs: PersonTab[];
  active: string | null;
  onActive: (id: string) => void;
  onAdd: () => void;
  onEdit: (tab: PersonTab) => void;
  onDelete: (tab: PersonTab) => void;
  onReorder: (tabs: PersonTab[]) => void;
}

export function DossierTabs({
  tabs,
  active,
  onActive,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: DossierTabsProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [compactAdd, setCompactAdd] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const addActionsRef = useRef<HTMLDivElement>(null);
  const fullAddWidthRef = useRef(0);

  const updateOverflowState = useCallback(() => {
    const nav = navRef.current;
    const rail = railRef.current;
    const addActions = addActionsRef.current;
    if (!nav || !rail || !addActions) return;

    if (!compactAdd) {
      fullAddWidthRef.current = addActions.getBoundingClientRect().width;
    }

    const navStyle = window.getComputedStyle(nav);
    const horizontalPadding = Number.parseFloat(navStyle.paddingLeft) +
      Number.parseFloat(navStyle.paddingRight);
    const actionsStyle = window.getComputedStyle(addActions);
    const actionsMargin = Number.parseFloat(actionsStyle.marginLeft);
    const tabWidth = Array.from(rail.children).reduce(
      (total, tab) => total + tab.getBoundingClientRect().width,
      0,
    );
    const fullAddWidth = fullAddWidthRef.current || addActions.getBoundingClientRect().width;
    const availableWidth = nav.clientWidth - horizontalPadding;

    setCompactAdd(tabWidth + fullAddWidth + actionsMargin > availableWidth);

    const maximumScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setCanScrollLeft(rail.scrollLeft > 1);
    setCanScrollRight(rail.scrollLeft < maximumScroll - 1);
  }, [compactAdd]);

  useLayoutEffect(() => {
    const rail = railRef.current;
    const nav = navRef.current;
    if (!rail || !nav) return;

    updateOverflowState();
    const observer = new ResizeObserver(updateOverflowState);
    observer.observe(nav);
    observer.observe(rail);
    rail.addEventListener('scroll', updateOverflowState, { passive: true });

    return () => {
      observer.disconnect();
      rail.removeEventListener('scroll', updateOverflowState);
    };
  }, [tabs, updateOverflowState]);

  const scrollTabs = (direction: 'left' | 'right') => {
    const rail = railRef.current;
    if (!rail) return;

    const distance = Math.max(160, rail.clientWidth * 0.65);
    rail.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  const moveTab = (id: string, targetId: string, edge: 'before' | 'after') => {
    if (id === targetId) return;
    const moving = tabs.find(tab => tab.id === id);
    if (!moving) return;
    const remaining = tabs.filter(tab => tab.id !== id);
    const targetIndex = remaining.findIndex(tab => tab.id === targetId);
    if (targetIndex < 0) return;
    remaining.splice(targetIndex + (edge === 'after' ? 1 : 0), 0, moving);
    if (remaining.some((tab, index) => tab.id !== tabs[index]?.id)) onReorder(remaining);
  };

  const dropEdge = (event: DragEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left + bounds.width / 2 ? 'before' : 'after';
  };

  const moveWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const destination = event.key === 'ArrowLeft' ? index - 1 : index + 1;
    if (destination < 0 || destination >= tabs.length) return;
    const reordered = [...tabs];
    const [moving] = reordered.splice(index, 1);
    reordered.splice(destination, 0, moving);
    onReorder(reordered);
  };

  return (
    <nav ref={navRef} className="dossier-tabs" aria-label="Dossier sections">
      <div
        className={`tab-viewport${canScrollLeft ? ' can-scroll-left' : ''}` +
          `${canScrollRight ? ' can-scroll-right' : ''}`}
      >
        <div
          ref={railRef}
          className={`tab-rail ${draggedId ? 'is-reordering' : ''}`}
        >
          {tabs.map((tab, index) => {
            const Icon = tabIcons[tab.icon] ?? tabIcons[defaultTabIcon(tab.kind)];
            const marker = dropTarget?.id === tab.id ? ` drop-${dropTarget.edge}` : '';
            return (
              <ContextMenu key={tab.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={`tab-wrap${draggedId === tab.id ? ' is-dragging' : ''}${marker}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setDropTarget({ id: tab.id, edge: dropEdge(event) });
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const sourceId = draggedId ?? event.dataTransfer.getData('text/plain');
                      moveTab(sourceId, tab.id, dropEdge(event));
                      setDraggedId(null);
                      setDropTarget(null);
                    }}
                  >
                    <button
                      draggable
                      className={`dossier-tab ${active === tab.id ? 'is-active' : ''}`}
                      onDragStart={(event) => {
                        setDraggedId(tab.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', tab.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDropTarget(null);
                      }}
                      onClick={() => onActive(tab.id)}
                      onKeyDown={(event) => moveWithKeyboard(event, index)}
                      aria-label={`${tab.name}, tab ${index + 1} of ${tabs.length}. ` +
                        `${index < 9 ? `Press Alt+${index + 1} to open. ` : ''}` +
                        'Drag to reorder or press Alt and an arrow key.'}
                    >
                      <span className="tab-key">{index + 1}</span>
                      <Icon size={13}/>
                      {tab.name}
                    </button>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onSelect={() => onEdit(tab)}>
                    <Pencil size={13}/> Edit tab
                  </ContextMenuItem>
                  <ContextMenuSeparator/>
                  <ContextMenuItem onSelect={() => onDelete(tab)} danger>
                    <Trash2 size={13}/> Remove tab
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
        {canScrollLeft && (
          <div className="tab-scroll-zone tab-scroll-zone--left">
            <button
              type="button"
              className="tab-scroll-button"
              onClick={() => scrollTabs('left')}
              aria-label="Scroll tabs left"
            >
              <ChevronLeft size={16}/>
            </button>
          </div>
        )}
        {canScrollRight && (
          <div className="tab-scroll-zone tab-scroll-zone--right">
            <button
              type="button"
              className="tab-scroll-button"
              onClick={() => scrollTabs('right')}
              aria-label="Scroll tabs right"
            >
              <ChevronRight size={16}/>
            </button>
          </div>
        )}
      </div>
      <div
        ref={addActionsRef}
        className={`dossier-tab-actions${compactAdd ? ' is-compact' : ''}`}
      >
        <Tooltip label="Create a dossier tab">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            aria-label="Add tab"
          >
            <Plus size={13}/>
            <span>Add tab</span>
          </Button>
        </Tooltip>
      </div>
    </nav>
  );
}
