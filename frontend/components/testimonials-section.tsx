import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Priya Sharma",
    location: "Kathmandu",
    avatar: "/nepali-woman-portrait.jpg",
    content:
      "The AI chatbot predicted my career change accurately! The Janma Kundali analysis was very detailed and helpful.",
    rating: 5,
  },
  {
    name: "Rajesh Thapa",
    location: "Pokhara",
    avatar: "/nepali-man-portrait.jpg",
    content:
      "Finally, an astrology app that uses Nepali planet names! The Gochar predictions have been spot on for my business decisions.",
    rating: 5,
  },
  {
    name: "Sunita Gurung",
    location: "Biratnagar",
    avatar: "/young-nepali-woman.jpg",
    content:
      "The remedies suggested helped me overcome difficulties in my relationship. Highly recommend the Dasha analysis!",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-foreground">Trusted by </span>
            <span className="gradient-text">Thousands</span>
          </h2>
          <p className="text-lg text-muted-foreground">See what our users say about their cosmic journey with us.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card/50 border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">{`"${testimonial.content}"`}</p>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
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
