export type SettingsTabKey =
  | "account"
  | "settings"
  | "organization"
  | "usage"
  | "recurring"
  | "mail"
  | "data"
  | "browser"
  | "connector"
  | "integration"
  | "help";

export interface SettingsUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
