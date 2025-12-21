export type SettingsTabKey = "account" | "settings" | "usage" | "help";

export interface SettingsUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}
