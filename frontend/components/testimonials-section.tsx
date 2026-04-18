"use client" 

// importing card components to wrap each testimonial
import { Card, CardContent } from "@/components/ui/card"
// importing avatar components to show user profile pictures
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// importing star icon to show the 5 star rating
import { Star } from "lucide-react"
// importing language hook to show text in the right language
import { useLanguage } from "@/contexts/LanguageContext"

// list of all 3 users who gave testimonials — name, city, and photo path
const testimonialMeta = [
  { name: "Priya Sharma",  location: "Kathmandu",  avatar: "/nepali-woman-portrait.jpg" },
  { name: "Rajesh Thapa",  location: "Pokhara",    avatar: "/nepali-man-portrait.jpg" },
  { name: "Sunita Gurung", location: "Biratnagar", avatar: "/young-nepali-woman.jpg" },
]

// this component shows the testimonials section on the homepage
export function TestimonialsSection() {
  // get the translation function to show text in current language
  const { t } = useLanguage()

  return (
    // outer section with top and bottom padding
    <section className="relative py-24">
      {/* main content area with max width and horizontal padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* section heading in the center */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" suppressHydrationWarning>
            {/* first part of heading — normal color */}
            <span className="text-foreground">{t("home.testimonials.title1")}</span>
            {/* second part of heading — gradient color */}
            <span className="gradient-text">{t("home.testimonials.title2")}</span>
          </h2>
          {/* small description below the heading */}
          <p className="text-lg text-muted-foreground" suppressHydrationWarning>
            {t("home.testimonials.subtitle")}
          </p>
        </div>

        {/* grid layout — 1 column on mobile, 3 columns on tablet and above */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* loop through each user and show a testimonial card */}
          {testimonialMeta.map((meta, index) => (
            // one testimonial card
            <Card key={index} className="bg-card/50 border-border">
              <CardContent className="pt-6">

                {/* 5 star rating icons at the top of the card */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>

                {/* the testimonial quote text — fetched from translation file using index */}
                <p className="text-muted-foreground mb-6" suppressHydrationWarning>
                  {`"${t(`home.testimonials.items.${index}.content`)}"`}
                </p>

                {/* user info row, avatar photo and name,city */}
                <div className="flex items-center gap-3">
                  {/* user profile picture — shows first letter of name if photo not found */}
                  <Avatar>
                    <AvatarImage src={meta.avatar} alt={meta.name} />
                    <AvatarFallback>{meta.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    {/* user full name */}
                    <p className="font-medium text-foreground">{meta.name}</p>
                    {/* user city */}
                    <p className="text-sm text-muted-foreground">{meta.location}</p>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  )
}







