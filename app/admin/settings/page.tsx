import { IASettings } from '@/components/ia-settings';
import { UploadTrack } from '@/components/upload-track';

export default function SettingsPage() {
  return (
    <div className="container max-w-2xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and upload music
        </p>
      </div>

      <IASettings />
      <UploadTrack />
    </div>
  );
}