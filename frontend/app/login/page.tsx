"use client";
// importing link component to navigate to other pages
import Link from "next/link";
// importing navbar component to show the top navigation bar
import { Navbar } from "@/components/navbar";
// importing starfield component to show the animated stars in the background
import { Starfield } from "@/components/starfield";
// importing the login form component that has email and password fields
import { LoginForm } from "@/components/login-form";
// importing sparkles icon for the logo
import { Sparkles } from "lucide-react";
// importing language hook to show text in the right language
import { useLanguage } from "@/contexts/LanguageContext";
import { Suspense } from "react";

// this is the login page — users come here to sign in to their account
export default function LoginPage() {
  // t() function gives us the right text based on current language
  const { t } = useLanguage();

  return (
    // outer div that covers the full screen height with a dark background
    <div className="min-h-screen bg-background relative">
      {/* animated stars in the background */}
      <Starfield />

      {/* top navigation bar */}
      <Navbar />

      {/* main content area — everything is centered on the screen */}
      <main className="min-h-screen flex items-center justify-center pt-16 px-4">
        {/* inner container with a max width so the form does not get too wide */}
        <div className="relative z-10 w-full max-w-md">
          {/* header section — logo, title and subtitle */}
          <div className="text-center mb-8">
            {/* clicking the logo icon goes back to the homepage */}
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
            </Link>

            {/* page title in gradient color */}
            <h1
              className="text-3xl font-bold gradient-text mb-2"
              suppressHydrationWarning
            >
              {t("login.title")}
            </h1>

            {/* small subtitle text below the title */}
            <p className="text-muted-foreground mt-1" suppressHydrationWarning>
              {t("login.subtitle")}
            </p>
          </div>

          {/* the actual login form with email and password fields */}
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>

          {/* link at the bottom for users who do not have an account yet */}
          <p
            className="text-center text-sm text-muted-foreground mt-6"
            suppressHydrationWarning
          >
            {t("login.noAccount")}{" "}
            {/* clicking this link takes the user to the signup page */}
            <Link
              href="/signup"
              className="text-primary hover:underline"
              suppressHydrationWarning
            >
              {t("login.signUp")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
