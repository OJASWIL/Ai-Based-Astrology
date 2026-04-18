"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings, User, Globe, Shield,
  Loader2, CheckCircle2, AlertCircle,
  Trash2, KeyRound, Eye, EyeOff,
} from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function Banner({ s }: { s: { type: "success" | "error"; message: string } | null }) {
  if (!s) return null;
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border",
      s.type === "success"
        ? "bg-green-500/10 border-green-500/30 text-green-400"
        : "bg-red-500/10 border-red-500/30 text-red-400"
    )}>
      {s.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {s.message}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, className }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn("bg-secondary border-border pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const {
    data, loading, saving, status,
    accountDeleted,
    updateProfile, changePassword,
    updatePreferences, deleteAccount,
  } = useSettings();

  const { setLanguage, t } = useLanguage();

  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [pwForm, setPwForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [prefForm, setPrefForm] = useState({
    language: "nepali", timezone: "asia-kathmandu",
  });
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!data) return;
    setProfileForm({ name: data.name, email: data.email });
    setPrefForm({ language: data.language, timezone: data.timezone });
    setLanguage(data.language as "english" | "nepali");
  }, [data]);

  const handleLanguageChange = (val: string) => {
    setPrefForm(f => ({ ...f, language: val }));
    setLanguage(val as "english" | "nepali");
  };

  const pwMismatch = pwForm.newPassword && pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword;

  // Account deleted screen — pure Nepali
  if (accountDeleted) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
        <div className="flex flex-col items-center text-center space-y-4">
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(239,68,68,0.12)",
            border: "2px solid rgba(239,68,68,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(239,68,68,0.25)",
            animation: "popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}>
            <Trash2 style={{ width: 34, height: 34, color: "#ef4444" }} />
          </div>

          <div style={{ animation: "fadeUp 0.4s ease 0.3s both" }}>
            <h2 style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              color: "#ef4444",
              margin: 0,
              fontFamily: "system-ui, sans-serif",
            }}>
              {t("settings.deleteSuccessTitle")}
            </h2>
            <p style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.4)",
              marginTop: 8,
              fontFamily: "system-ui, sans-serif",
            }}>
              {t("settings.deleteSuccessMessage")}
            </p>
          </div>
        </div>

        <style>{`
          @keyframes popIn {
            from { transform: scale(0); opacity: 0; }
            to   { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeUp {
            from { transform: translateY(12px); opacity: 0; }
            to   { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (loading) return (
    <AuthGuard>
      <DashboardLayout title={t("settings.title")}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );

  return (
    <AuthGuard>
      <DashboardLayout title={t("settings.title")}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              {t("settings.title")}
            </h2>
            <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
              <TabsTrigger value="preferences">{t("settings.preferences")}</TabsTrigger>
              <TabsTrigger value="danger">{t("settings.dangerZone")}</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> Profile Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Banner s={status.profile} />
                  <div className="space-y-2">
                    <Label>{t("settings.fullName")}</Label>
                    <Input
                      value={profileForm.name}
                      onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.email")}</Label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <Button
                    onClick={() => updateProfile(profileForm)}
                    disabled={saving.profile || !profileForm.name || !profileForm.email}
                  >
                    {saving.profile && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t("settings.saveProfile")}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-primary" /> Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Banner s={status.password} />
                  <div className="space-y-2">
                    <Label>{t("settings.currentPassword")}</Label>
                    <PasswordInput
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.newPassword")}</Label>
                    <PasswordInput
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.confirmPassword")}</Label>
                    <PasswordInput
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={pwMismatch ? "border-red-500" : ""}
                    />
                    {pwMismatch && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Passwords do not match
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => changePassword(pwForm)}
                    disabled={saving.password || !!pwMismatch || !pwForm.currentPassword || !pwForm.newPassword || pwForm.newPassword.length < 8}
                  >
                    {saving.password && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t("settings.updatePassword")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" /> App Preferences
                  </CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Banner s={status.preferences} />
                  <div className="space-y-2">
                    <Label>{t("settings.language")}</Label>
                    <Select value={prefForm.language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nepali">नेपाली (Nepali)</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("settings.timezone")}</Label>
                    <Select value={prefForm.timezone} onValueChange={v => setPrefForm(f => ({ ...f, timezone: v }))}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia-kathmandu">Asia/Kathmandu (NST +5:45)</SelectItem>
                        <SelectItem value="asia-kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                        <SelectItem value="utc">UTC +0:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => updatePreferences(prefForm)}
                    disabled={saving.preferences}
                  >
                    {saving.preferences && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {t("settings.savePreferences")}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Danger Zone Tab */}
            <TabsContent value="danger">
              <Card className="bg-card/50 border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <Shield className="w-5 h-5" /> {t("settings.dangerZone")}
                  </CardTitle>
                  <CardDescription>Irreversible actions — proceed with caution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">{t("settings.deleteAccount")}</p>
                    <p className="text-xs text-muted-foreground">{t("settings.deleteWarning")}</p>

                    <AlertDialog
                      open={deleteDialogOpen}
                      onOpenChange={(open) => {
                        setDeleteDialogOpen(open);
                        if (!open) setDeletePassword("");
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          {t("settings.deleteAccount")}
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("settings.areYouSure")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("settings.deleteConfirm")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <div className="space-y-2 py-2">
                          <Label className="text-sm text-foreground">
                            Confirm your password
                          </Label>
                          <PasswordInput
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </div>

                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletePassword("")}>
                            {t("settings.cancel")}
                          </AlertDialogCancel>
                          <Button
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                            disabled={saving.delete || !deletePassword.trim()}
                            onClick={async () => {
                              setDeleteDialogOpen(false);
                              await deleteAccount(deletePassword);
                              setDeletePassword("");
                            }}
                          >
                            {saving.delete && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {t("settings.yesDelete")}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}