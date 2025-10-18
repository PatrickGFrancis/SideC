import { createServerSupabaseClient } from "@/lib/supabase-server";
import { IACredentialsForm } from "@/components/ia-credentials-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get existing credentials
  const { data: credentials } = await supabase
    .from("ia_credentials")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="font-sans text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Account</h2>
            <p className="text-muted-foreground mb-4">Email: {user.email}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2">
              Internet Archive Credentials
            </h2>
            <p className="text-muted-foreground mb-4">
              Your tracks are uploaded to Internet Archive for unlimited free
              storage. You need to provide your IA access credentials.
            </p>

            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="text-sm font-medium mb-2">
                How to get your IA credentials:
              </p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>
                  Go to{" "}
                  <a
                    href="https://archive.org/account/s3.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    archive.org/account/s3.php
                  </a>
                </li>
                <li>Log in or create a free account</li>
                <li>Copy your Access Key and Secret Key</li>
                <li>Paste them below</li>
              </ol>
            </div>

            <IACredentialsForm
              existingAccessKey={credentials?.ia_username}
              existingSecretKey={credentials?.ia_password}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
