"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Settings, User, Globe, Shield,
  Loader2, CheckCircle2, AlertCircle,
  Trash2, KeyRound, Eye, EyeOff,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useSettings } from "@/hooks/use-settings"
import { cn } from "@/lib/utils"

function Banner({ s }: { s: { type: "success" | "error"; message: string } | null }) {
  if (!s) return null
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border",
      s.type === "success"
        ? "bg-green-500/10 border-green-500/30 text-green-400"
        : "bg-red-500/10 border-red-500/30 text-red-400"
    )}>
      {s.type === "success"
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle  className="w-4 h-4 shrink-0" />}
      {s.message}
    </div>
  )
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}) {
  const [show, setShow] = useState(false)
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
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const {
    data, loading, saving, status,
    updateProfile, changePassword,
    updatePreferences, deleteAccount,
  } = useSettings()

  const [profileForm, setProfileForm] = useState({ name: "", email: "" })
  const [pwForm, setPwForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  })
  const [prefForm, setPrefForm] = useState({
    language: "nepali", timezone: "asia-kathmandu",
  })

  useEffect(() => {
    if (!data) return
    setProfileForm({ name: data.name, email: data.email })
    setPrefForm({ language: data.language, timezone: data.timezone })
  }, [data])

  const pwMismatch =
    pwForm.newPassword &&
    pwForm.confirmPassword &&
    pwForm.newPassword !== pwForm.confirmPassword

  if (loading) return (
    <AuthGuard>
      <DashboardLayout title="Settings">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )

  return (
    <AuthGuard>
      <DashboardLayout title="Settings">
        <div className="max-w-3xl mx-auto space-y-6">

          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              Settings
              <span className="text-muted-foreground text-lg font-normal">(सेटिङ्हरू)</span>
            </h2>
            <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-secondary border border-border">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            {/* ── PROFILE ───────────────────────────────────────────── */}
            <TabsContent value="profile" className="space-y-4">

              {/* Profile Info */}
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
                    <Label>Full Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                      className="bg-secondary border-border"
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={profileForm.email}
                      onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                      className="bg-secondary border-border"
                      placeholder="you@example.com"
                    />
                  </div>

                  <Button
                    onClick={() => updateProfile(profileForm)}
                    className="bg-primary hover:bg-primary/90"
                    disabled={saving.profile || !profileForm.name || !profileForm.email}
                  >
                    {saving.profile && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Change Password */}
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
                    <Label>Current Password</Label>
                    <PasswordInput
                      value={pwForm.currentPassword}
                      onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <PasswordInput
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      placeholder="Min. 8 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <PasswordInput
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className={pwMismatch ? "border-red-500/60" : ""}
                    />
                    {pwMismatch && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Passwords do not match
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => changePassword(pwForm)}
                    className="bg-primary hover:bg-primary/90"
                    disabled={
                      saving.password || !!pwMismatch ||
                      !pwForm.currentPassword || !pwForm.newPassword ||
                      pwForm.newPassword.length < 8
                    }
                  >
                    {saving.password && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Update Password
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── PREFERENCES ────────────────────────────────────────── */}
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
                    <Label>Language (भाषा)</Label>
                    <Select
                      value={prefForm.language}
                      onValueChange={v => setPrefForm(f => ({ ...f, language: v }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="nepali">नेपाली (Nepali)</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="hindi">हिन्दी (Hindi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={prefForm.timezone}
                      onValueChange={v => setPrefForm(f => ({ ...f, timezone: v }))}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="asia-kathmandu">Asia/Kathmandu (NST +5:45)</SelectItem>
                        <SelectItem value="asia-kolkata">Asia/Kolkata (IST +5:30)</SelectItem>
                        <SelectItem value="utc">UTC +0:00</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => updatePreferences(prefForm)}
                    className="bg-primary hover:bg-primary/90"
                    disabled={saving.preferences}
                  >
                    {saving.preferences && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── DANGER ZONE ────────────────────────────────────────── */}
            <TabsContent value="danger">
              <Card className="bg-card/50 border-red-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <Shield className="w-5 h-5" /> Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions — proceed with caution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delete Account</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Permanently delete your account, all Kundali charts, chat history
                        and subscription data. This cannot be undone.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" /> Delete My Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete your account and all associated data.
                            This action <strong>cannot be undone</strong>.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary border-border">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={deleteAccount}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {saving.delete && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Yes, Delete My Account
                          </AlertDialogAction>
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
  )
}