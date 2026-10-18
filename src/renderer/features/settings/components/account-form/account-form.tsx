import type { FormEvent } from "react";
import type { SocialAccountInput, SocialPlatform } from "@shared/types";
import { Button } from "@/components/button/button";
import { Input } from "@/components/form-control/form-control";
import { platformLabel, SOCIAL_PLATFORMS } from "@/features/settings/settings.logic";
import "./account-form.css";

interface AccountFormProps {
  account: SocialAccountInput;
  busy: boolean;
  passwordStored: boolean;
  onChange: (account: SocialAccountInput) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
}

export function AccountForm({
  account,
  busy,
  passwordStored,
  onChange,
  onCancel,
  onSubmit,
}: AccountFormProps) {
  return (
    <form className="account-form" onSubmit={onSubmit}>
      <div className="account-form-head">
        <strong>{account.id ? "Edit account" : "Add account"}</strong>
        <small>
          {account.id && passwordStored
            ? "Leave password blank to keep the saved password."
            : "Enter the credentials used for this service."}
        </small>
      </div>
      <label>
        <span>Service</span>
        <select
          className="ui-input"
          value={account.platform}
          onChange={(event) => onChange({
            ...account,
            platform: event.target.value as SocialPlatform,
          })}
        >
          {SOCIAL_PLATFORMS.map((platform) => (
            <option value={platform} key={platform}>
              {platformLabel(platform)}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Login / username</span>
        <Input
          autoFocus
          value={account.login}
          onChange={(event) => onChange({ ...account, login: event.target.value })}
          placeholder="username"
        />
      </label>
      <label>
        <span>Email</span>
        <Input
          type="email"
          value={account.email}
          onChange={(event) => onChange({ ...account, email: event.target.value })}
          placeholder="name@example.com"
        />
      </label>
      <label>
        <span>Password</span>
        <Input
          type="password"
          value={account.password ?? ""}
          onChange={(event) => onChange({ ...account, password: event.target.value })}
          placeholder={passwordStored ? "•••••••• (unchanged)" : "Password"}
        />
      </label>
      <div className="account-form-actions">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="signal"
          size="sm"
          disabled={busy || (!account.login.trim() && !account.email.trim())}
        >
          {busy ? "Saving…" : "Save account"}
        </Button>
      </div>
    </form>
  );
}
