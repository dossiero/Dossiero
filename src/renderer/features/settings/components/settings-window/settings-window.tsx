import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AtSign, Check, KeyRound, Palette, Pencil, Plus, Settings2, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { AppSettings, DossierApi, SocialAccount, SocialAccountInput, ThemeName } from '@shared/types';
import { cn } from '@/lib/class-names';
import { Button } from '@/components/button/button';
import { AccountForm } from '@/features/settings/components/account-form/account-form';
import { BrowserPreference } from '@/features/settings/components/browser-preference/browser-preference';
import { SettingsHeading } from '@/features/settings/components/settings-heading/settings-heading';
import { SettingsPaneButton } from '@/features/settings/components/settings-pane-button/settings-pane-button';
import { SettingsSwitchRow } from '@/features/settings/components/settings-switch-row/settings-switch-row';
import { ThemeCard } from '@/features/settings/components/theme-card/theme-card';
import { accountSecurityLabel, platformLabel } from '@/features/settings/settings.logic';
import './settings-window.css';

type Pane = 'appearance' | 'general' | 'accounts';
const accountSettingsVisible = false;

function initialPane(): Pane {
  const storedPane = localStorage.getItem('dossier-settings-pane');
  return storedPane === 'general' ? 'general' : 'appearance';
}

export function SettingsWindow({ open, onOpenChange, api, settings, onUpdate }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: DossierApi;
  settings: AppSettings;
  onUpdate: (input: Partial<AppSettings>) => Promise<void>;
}) {
  const [pane, setPane] = useState<Pane>(initialPane);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [editing, setEditing] = useState<SocialAccountInput | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { localStorage.setItem('dossier-settings-pane', pane); }, [pane]);
  useEffect(() => {
    if (!accountSettingsVisible || !open || !api.capabilities.secureCredentialStorage) return;
    void api.listSocialAccounts().then(setAccounts).catch((error) => toast.error(error instanceof Error ? error.message : 'Could not load accounts'));
  }, [api, open]);

  const selectTheme = (theme: ThemeName) => void onUpdate({ theme });
  let title = 'Social Accounts';
  if (pane === 'appearance') {
    title = 'Appearance';
  } else if (pane === 'general') {
    title = 'General';
  }
  const saveAccount = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      await api.saveSocialAccount(editing);
      setAccounts(await api.listSocialAccounts());
      setEditing(null);
      toast.success('Account saved securely');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save account');
    } finally { setBusy(false); }
  };

  const editAccount = (account: SocialAccount) => setEditing({ id: account.id, platform: account.platform, login: account.login, email: account.email, password: '' });
  const removeAccount = async (id: string) => {
    try {
      await api.deleteSocialAccount(id);
      setAccounts((current) => current.filter((account) => account.id !== id));
      if (editing?.id === id) setEditing(null);
      toast.success('Account removed');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not remove account'); }
  };

  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="ui-overlay settings-overlay"/>
      <DialogPrimitive.Content className="settings-window" aria-describedby={undefined}>
        <header className="settings-titlebar">
          <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild><button className="settings-close" aria-label="Close settings"><X size={15}/></button></DialogPrimitive.Close>
        </header>
        <nav className="settings-toolbar" aria-label="Settings sections">
          <SettingsPaneButton active={pane === 'appearance'} onClick={() => setPane('appearance')} icon={<Palette size={20}/>} label="Appearance"/>
          <SettingsPaneButton active={pane === 'general'} onClick={() => setPane('general')} icon={<SlidersHorizontal size={20}/>} label="General"/>
          {accountSettingsVisible && (
            <SettingsPaneButton
              active={pane === 'accounts'}
              onClick={() => setPane('accounts')}
              icon={<AtSign size={20}/>}
              label="Accounts"
            />
          )}
        </nav>
        <div className="settings-content">
          {pane === 'appearance' && <section className="settings-pane">
            <SettingsHeading title="Theme" subtitle="Choose the visual language. Every theme supports light and dark appearances."/>
            <div className="theme-grid">
              <ThemeCard name="terminal" selected={settings.theme === 'terminal'} onClick={() => selectTheme('terminal')} title="Terminal" description="Dense, technical, and signal-forward."/>
            </div>
            <div className="settings-group appearance-choice">
              <div><strong>Appearance</strong><small>The bottom sidebar switch remains available for quick changes.</small></div>
              <div className="segmented-control" role="group" aria-label="Appearance">
                {(['light','dark','system'] as const).map((value) => <button key={value} className={settings.appearance === value ? 'is-active' : ''} onClick={() => void onUpdate({ appearance: value })}>{value}</button>)}
              </div>
            </div>
          </section>}
          {pane === 'general' && <section className="settings-pane">
            <SettingsHeading
              title="General"
              subtitle="Sidebar and system integration options."
            />
            <div className="settings-group settings-rows">
              <SettingsSwitchRow
                title="Show related people in the sidebar"
                description="Include people created from relationship tabs in the main sidebar."
                checked={settings.showRelatedPeopleInSidebar}
                onChange={(checked) => void onUpdate({
                  showRelatedPeopleInSidebar: checked,
                })}
              />
              <SettingsSwitchRow
                title="Open Dossiero at login"
                description="Start the app when you sign in to your Mac."
                checked={settings.startAtLogin}
                disabled={!api.capabilities.loginItems}
                onChange={(checked) => void onUpdate({ startAtLogin: checked })}
              />
              <SettingsSwitchRow
                title="Show Dossiero in the menu bar"
                description="Keep a small icon in the macOS menu bar for quick access."
                checked={settings.showMenuBarIcon}
                disabled={!api.capabilities.menuBarIcon}
                onChange={(checked) => void onUpdate({ showMenuBarIcon: checked })}
              />
            </div>
            <BrowserPreference
              api={api}
              preference={settings.externalBrowser}
              onUpdate={onUpdate}
            />
            {api.capabilities.platform !== 'darwin' && <p className="settings-note"><Settings2 size={14}/> These integrations are available in the macOS desktop app.</p>}
          </section>}
          {accountSettingsVisible && pane === 'accounts' && <section className="settings-pane accounts-pane">
            <SettingsHeading title="Social accounts" subtitle="Store credentials now so future private-account connections can authenticate as you." action={api.capabilities.secureCredentialStorage && !editing ? <Button size="sm" onClick={() => setEditing({ platform: 'instagram', login: '', email: '', password: '' })}><Plus size={14}/> Add account</Button> : undefined}/>
            {!api.capabilities.secureCredentialStorage ? <div className="secure-empty"><KeyRound size={24}/><strong>Desktop app required</strong><p>Passwords are only accepted where operating-system credential encryption is available.</p></div> : <>
              <div className="secure-banner"><KeyRound size={16}/><span>Passwords are encrypted by the operating system before they are stored. Saved passwords are never shown again.</span></div>
              {editing && <AccountForm account={editing} busy={busy} passwordStored={Boolean(editing.id && accounts.find((account) => account.id === editing.id)?.passwordStored)} onChange={setEditing} onCancel={() => setEditing(null)} onSubmit={saveAccount}/>} 
              <div className="account-list">
                {accounts.map((account) => <article className="account-row" key={account.id}>
                  <div className={`platform-mark platform-${account.platform}`}>{account.platform.slice(0,1).toUpperCase()}</div>
                  <div><strong>{platformLabel(account.platform)}</strong><span>{account.login || account.email}</span><small>{account.email && account.login ? account.email : accountSecurityLabel(Boolean(account.email && account.login), account.passwordStored)}</small></div>
                  <span className={cn('credential-state', account.passwordStored && 'is-stored')}>{account.passwordStored ? <><Check size={12}/> secured</> : 'no password'}</span>
                  <button onClick={() => editAccount(account)} aria-label={`Edit ${platformLabel(account.platform)} account`}><Pencil size={14}/></button>
                  <button className="danger-icon" onClick={() => void removeAccount(account.id)} aria-label={`Delete ${platformLabel(account.platform)} account`}><Trash2 size={14}/></button>
                </article>)}
                {!accounts.length && !editing && <div className="account-empty"><AtSign size={24}/><strong>No accounts yet</strong><p>Add a social account to prepare for future authenticated access.</p></div>}
              </div>
            </>}
          </section>}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
