import { PreferencesClient } from "@/components/settings/preferences-client";

export default function PreferencesPage() {
  return (
    <div>
      <p className="mb-6 text-sm" style={{ color: "var(--txt-3)" }}>
        Appearance and data preferences. Stored locally in your browser.
      </p>
      <PreferencesClient />
    </div>
  );
}
