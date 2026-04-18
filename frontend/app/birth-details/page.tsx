"use client" 

// importing react hooks for state, side effects, refs and callbacks
import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
// importing router to redirect the user to another page after saving
import { useRouter } from "next/navigation"
// importing dynamic to load the map component only in the browser, not on the server
import dynamic from "next/dynamic"
// importing the dashboard layout wrapper component
import { DashboardLayout } from "@/components/dashboard-layout"
// importing card components to show information boxes
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// importing ui components for the form
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// importing icons used in the form labels and buttons
import { Calendar, Clock, MapPin, User, Loader2, Sparkles, Navigation, Search, X } from "lucide-react"
// importing auth guard to make sure only logged in users can see this page
import { AuthGuard } from "@/components/auth-guard"
// importing language context to show text in the right language
import { useLanguage } from "@/contexts/LanguageContext"

// loading the map picker component only in the browser because leaflet does not work on the server
// shows a loading spinner while the map is being loaded
const MapPicker = dynamic(
  () => import("@/components/map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] rounded-lg border border-border bg-secondary flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    ),
  }
)

// the backend api url — uses environment variable or falls back to localhost
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
// the key used to get the auth token from local storage
const TOKEN_KEY = "auth_token"

// BS calendar data — stores how many days are in each month for each BS year

const BS_MONTHS_DATA: Record<number, number[]> = {
  2000:[30,32,31,32,31,30,30,30,29,30,29,31],2001:[31,31,32,31,31,31,30,29,30,29,30,30],
  2002:[31,31,32,32,31,30,30,29,30,29,30,30],2003:[31,32,31,32,31,30,30,30,29,29,30,31],
  2004:[30,32,31,32,31,30,30,30,29,30,29,31],2005:[31,31,32,31,31,31,30,29,30,29,30,30],
  2006:[31,31,32,32,31,30,30,29,30,29,30,30],2007:[31,32,31,32,31,30,30,30,29,29,30,31],
  2008:[31,31,31,32,31,31,29,30,30,29,29,31],2009:[31,31,32,31,31,31,30,29,30,29,30,30],
  2010:[31,31,32,32,31,30,30,29,30,29,30,30],2011:[31,32,31,32,31,30,30,30,29,29,30,31],
  2012:[31,31,31,32,31,31,29,30,30,29,30,30],2013:[31,31,32,31,31,31,30,29,30,29,30,30],
  2014:[31,31,32,32,31,30,30,29,30,29,30,30],2015:[31,32,31,32,31,30,30,30,29,29,30,31],
  2016:[31,31,31,32,31,31,29,30,30,29,30,30],2017:[31,31,32,31,31,31,30,29,30,29,30,30],
  2018:[31,32,31,32,31,30,30,29,30,29,30,30],2019:[31,32,31,32,31,30,30,30,29,30,29,31],
  2020:[31,31,31,32,31,31,30,29,30,29,30,30],2021:[31,31,32,31,31,31,30,29,30,29,30,30],
  2022:[31,32,31,32,31,30,30,30,29,29,30,30],2023:[31,32,31,32,31,30,30,30,29,30,29,31],
  2024:[31,31,31,32,31,31,30,29,30,29,30,30],2025:[31,31,32,31,31,31,30,29,30,29,30,30],
  2026:[31,32,31,32,31,30,30,30,29,29,30,31],2027:[30,32,31,32,31,30,30,30,29,30,29,31],
  2028:[31,31,32,31,31,31,30,29,30,29,30,30],2029:[31,31,32,31,32,30,30,29,30,29,30,30],
  2030:[31,32,31,32,31,30,30,30,29,29,30,31],2031:[31,31,31,32,31,31,30,29,30,29,30,30],
  2032:[31,31,32,31,31,31,30,29,30,29,30,30],2033:[31,32,31,32,31,30,30,30,29,29,30,30],
  2034:[31,32,31,32,31,30,30,30,29,30,29,31],2035:[31,31,31,32,31,31,29,30,30,29,29,31],
  2036:[31,31,32,31,31,31,30,29,30,29,30,30],2037:[31,32,31,32,31,30,30,29,30,29,30,30],
  2038:[31,32,31,32,31,30,30,30,29,29,30,31],2039:[31,31,31,32,31,31,30,29,30,29,30,30],
  2040:[31,31,32,31,31,31,30,29,30,29,30,30],2041:[31,32,31,32,31,30,30,29,30,29,30,30],
  2042:[31,32,31,32,31,30,30,30,29,30,29,31],2043:[31,31,31,32,31,31,30,29,30,29,30,30],
  2044:[31,31,32,31,31,31,30,29,30,29,30,30],2045:[31,32,31,32,31,30,30,29,30,29,30,30],
  2046:[31,32,31,32,31,30,30,30,29,29,30,31],2047:[31,31,31,32,31,31,30,29,30,29,30,30],
  2048:[31,31,32,31,31,31,30,29,30,29,30,30],2049:[31,32,31,32,31,30,30,30,29,29,30,30],
  2050:[31,32,31,32,31,30,30,30,29,30,29,31],2051:[31,31,31,32,31,31,29,30,30,29,29,31],
  2052:[31,31,32,31,31,31,30,29,30,29,30,30],2053:[31,32,31,32,31,30,30,29,30,29,30,30],
  2054:[31,32,31,32,31,30,30,30,29,29,30,31],2055:[31,31,31,32,31,31,30,29,30,29,30,30],
  2056:[31,31,32,31,31,31,30,29,30,29,30,30],2057:[31,32,31,32,31,30,30,30,29,29,30,30],
  2058:[31,32,31,32,31,30,30,30,29,30,29,31],2059:[31,31,31,32,31,31,29,30,30,29,29,31],
  2060:[31,31,32,31,31,31,30,29,30,29,30,30],2061:[31,31,32,31,31,31,30,29,30,29,30,30],
  2062:[31,32,31,32,31,30,30,30,29,29,30,31],2063:[31,31,31,32,31,31,30,29,30,29,30,30],
  2064:[31,31,32,31,31,30,30,30,29,30,29,31],2065:[31,32,31,32,31,30,30,29,30,29,30,30],
  2066:[31,31,32,31,31,31,30,29,30,29,30,30],2067:[31,32,31,32,31,30,30,30,29,29,30,31],
  2068:[31,31,31,32,31,31,30,29,30,29,30,30],2069:[31,31,32,31,31,30,30,30,29,30,29,31],
  2070:[31,32,31,32,31,30,30,29,30,29,30,30],2071:[31,31,32,31,31,31,30,29,30,29,30,30],
  2072:[31,32,31,32,31,30,30,30,29,29,30,31],2073:[31,31,31,32,31,31,30,29,30,29,30,30],
  2074:[31,31,32,31,31,30,30,30,29,30,29,31],2075:[31,32,31,32,31,30,30,29,30,29,30,30],
  2076:[31,31,32,31,31,31,30,29,30,29,30,30],2077:[31,32,31,32,31,30,30,30,29,29,30,31],
  2078:[31,31,31,32,31,31,30,29,30,29,30,30],2079:[31,31,32,31,31,30,30,30,29,30,29,31],
  2080:[31,32,31,32,31,30,30,29,30,29,30,30],2081:[31,31,32,31,31,31,30,29,30,29,30,30],
  2082:[31,32,31,32,31,30,30,30,29,29,30,31],2083:[31,31,31,32,31,31,30,29,30,29,30,30],
  2084:[31,31,32,31,31,30,30,30,29,30,29,31],2085:[31,32,31,32,31,30,30,29,30,29,30,30],
}

// nepali month names in nepali and english
const BS_MONTHS_NP  = ["बैशाख","जेठ","असार","श्रावण","भाद्र","आश्विन","कार्तिक","मंसिर","पुष","माघ","फाल्गुन","चैत्र"]
const BS_MONTHS_EN  = ["Baishakh","Jestha","Ashar","Shrawan","Bhadra","Ashwin","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"]
// the starting day offset used to convert BS dates to AD dates
const AD_START_DAYS = Date.UTC(1943, 3, 14) / 86400000


// helper to convert english numbers to nepali numerals when language is nepali
const NP_DIGITS = ["०","१","२","३","४","५","६","७","८","९"]
function toNpNum(val: string | number, np: boolean): string {
  // if language is not nepali, just return the number as a string
  if (!np) return String(val)
  // replace each english digit with the matching nepali digit
  return String(val).replace(/[0-9]/g, d => NP_DIGITS[+d])
}


// district data — nepali names and lat/lng coordinates for all 77 districts
const DISTRICT_NAMES_NP: Record<string, string> = {
  achham:"अछाम", arghakhanchi:"अर्घाखाँची", baglung:"बागलुङ", baitadi:"बैतडी",
  bajhang:"बाजहाङ", bajura:"बाजुरा", banke:"बाँके", bara:"बारा",
  bardiya:"बर्दिया", bhaktapur:"भक्तपुर", bhojpur:"भोजपुर", chitwan:"चितवन",
  dadeldhura:"डडेल्धुरा", dailekh:"दैलेख", dang:"डाङ", darchula:"दार्चुला",
  dhading:"धादिङ", dhankuta:"धनकुटा", dhanusha:"धनुषा", dolakha:"दोलखा",
  dolpa:"डोल्पा", doti:"डोटी", "eastern rukum":"पूर्वी रुकुम", gorkha:"गोर्खा",
  gulmi:"गुल्मी", humla:"हुम्ला", ilam:"इलाम", jajarkot:"जाजरकोट",
  jhapa:"झापा", jumla:"जुम्ला", kailali:"कैलाली", kalikot:"कालिकोट",
  kanchanpur:"कञ्चनपुर", kapilvastu:"कपिलवस्तु", kaski:"कास्की", kathmandu:"काठमाडौं",
  kavrepalanchok:"काभ्रेपलाञ्चोक", khotang:"खोटाङ", lalitpur:"ललितपुर", lamjung:"लमजुङ",
  mahottari:"महोत्तरी", makwanpur:"मकवानपुर", manang:"मनाङ", morang:"मोरङ",
  mugu:"मुगु", mustang:"मुस्ताङ", myagdi:"म्याग्दी", "nawalparasi east":"नवलपरासी पूर्व",
  "nawalparasi west":"नवलपरासी पश्चिम", nuwakot:"नुवाकोट", okhaldhunga:"ओखलढुङ्गा",
  palpa:"पाल्पा", panchthar:"पाँचथर", parbat:"पर्वत", parsa:"पर्सा",
  pyuthan:"प्युठान", ramechhap:"रामेछाप", rasuwa:"रसुवा", rautahat:"रौतहट",
  rolpa:"रोल्पा", rupandehi:"रुपन्देही", salyan:"सल्यान",
  sankhuwasabha:"सङ्खुवासभा", saptari:"सप्तरी", sarlahi:"सर्लाही",
  sindhuli:"सिन्धुली", sindhupalchok:"सिन्धुपाल्चोक", siraha:"सिरहा",
  solukhumbu:"सोलुखुम्बु", sunsari:"सुनसरी", surkhet:"सुर्खेत", syangja:"स्याङ्जा",
  taplejung:"ताप्लेजुङ", terhathum:"तेह्रथुम", udayapur:"उदयपुर",
  "western rukum":"पश्चिम रुकुम",
}

// latitude and longitude coordinates for each district — used to center the map
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  achham:{lat:29.0000,lng:81.3667}, arghakhanchi:{lat:27.9500,lng:83.1333},
  baglung:{lat:28.2667,lng:83.5833}, baitadi:{lat:29.5333,lng:80.4167},
  bajhang:{lat:29.5500,lng:81.1833}, bajura:{lat:29.3667,lng:81.4833},
  banke:{lat:28.0500,lng:81.6167}, bara:{lat:27.0167,lng:85.0167},
  bardiya:{lat:28.3333,lng:81.5000}, bhaktapur:{lat:27.6710,lng:85.4298},
  bhojpur:{lat:27.1667,lng:87.0500}, chitwan:{lat:27.6833,lng:84.4333},
  dadeldhura:{lat:29.3000,lng:80.5833}, dailekh:{lat:28.8333,lng:81.7167},
  dang:{lat:28.0000,lng:82.3000}, darchula:{lat:29.8500,lng:80.5500},
  dhading:{lat:27.8667,lng:84.9167}, dhankuta:{lat:26.9833,lng:87.3500},
  dhanusha:{lat:26.7288,lng:85.9266}, dolakha:{lat:27.6667,lng:86.1667},
  dolpa:{lat:29.0000,lng:82.9667}, doti:{lat:29.2667,lng:80.9500},
  "eastern rukum":{lat:28.5500,lng:82.6500}, gorkha:{lat:28.0000,lng:84.6333},
  gulmi:{lat:28.0667,lng:83.2667}, humla:{lat:30.1333,lng:81.9000},
  ilam:{lat:26.9167,lng:87.9333}, jajarkot:{lat:28.7000,lng:82.1833},
  jhapa:{lat:26.6500,lng:87.9000}, jumla:{lat:29.2833,lng:82.1833},
  kailali:{lat:28.6833,lng:80.5833}, kalikot:{lat:29.1333,lng:81.6333},
  kanchanpur:{lat:28.8333,lng:80.3500}, kapilvastu:{lat:27.5500,lng:83.0500},
  kaski:{lat:28.2096,lng:83.9856}, kathmandu:{lat:27.7172,lng:85.3240},
  kavrepalanchok:{lat:27.5667,lng:85.6833}, khotang:{lat:27.1667,lng:86.8333},
  lalitpur:{lat:27.6644,lng:85.3188}, lamjung:{lat:28.1500,lng:84.3833},
  mahottari:{lat:26.6500,lng:85.9167}, makwanpur:{lat:27.4167,lng:85.0333},
  manang:{lat:28.6667,lng:84.0167}, morang:{lat:26.6500,lng:87.4667},
  mugu:{lat:29.6667,lng:82.3333}, mustang:{lat:28.9833,lng:83.8500},
  myagdi:{lat:28.4000,lng:83.5667}, "nawalparasi east":{lat:27.5667,lng:84.3833},
  "nawalparasi west":{lat:27.7000,lng:83.7333}, nuwakot:{lat:27.9167,lng:85.1667},
  okhaldhunga:{lat:27.3167,lng:86.5000}, palpa:{lat:27.8667,lng:83.5500},
  panchthar:{lat:27.1333,lng:87.7833}, parbat:{lat:28.2333,lng:83.7000},
  parsa:{lat:27.0167,lng:84.8333}, pyuthan:{lat:28.1000,lng:82.8667},
  ramechhap:{lat:27.3333,lng:86.0833}, rasuwa:{lat:28.3667,lng:85.3667},
  rautahat:{lat:27.0000,lng:85.2333}, rolpa:{lat:28.2333,lng:82.6500},
  rupandehi:{lat:27.5000,lng:83.4500}, salyan:{lat:28.3667,lng:82.1667},
  sankhuwasabha:{lat:27.3500,lng:87.3333}, saptari:{lat:26.6500,lng:86.9167},
  sarlahi:{lat:27.0000,lng:85.5833}, sindhuli:{lat:27.2500,lng:85.9667},
  sindhupalchok:{lat:27.9500,lng:85.6833}, siraha:{lat:26.6500,lng:86.2000},
  solukhumbu:{lat:27.6833,lng:86.6667}, sunsari:{lat:26.6500,lng:87.1667},
  surkhet:{lat:28.6000,lng:81.6167}, syangja:{lat:28.0833,lng:83.8667},
  taplejung:{lat:27.3500,lng:87.6667}, terhathum:{lat:27.1167,lng:87.5500},
  udayapur:{lat:26.9167,lng:86.5167}, "western rukum":{lat:28.6167,lng:82.3667},
}

// list of all district names in english — used for the search dropdown
const ALL_DISTRICTS = [
  "Achham","Arghakhanchi","Baglung","Baitadi","Bajhang","Bajura","Banke","Bara",
  "Bardiya","Bhaktapur","Bhojpur","Chitwan","Dadeldhura","Dailekh","Dang","Darchula",
  "Dhading","Dhankuta","Dhanusha","Dolakha","Dolpa","Doti","Eastern Rukum","Gorkha",
  "Gulmi","Humla","Ilam","Jajarkot","Jhapa","Jumla","Kailali","Kalikot","Kanchanpur",
  "Kapilvastu","Kaski","Kathmandu","Kavrepalanchok","Khotang","Lalitpur","Lamjung",
  "Mahottari","Makwanpur","Manang","Morang","Mugu","Mustang","Myagdi","Nawalparasi East",
  "Nawalparasi West","Nuwakot","Okhaldhunga","Palpa","Panchthar","Parbat","Parsa",
  "Pyuthan","Ramechhap","Rasuwa","Rautahat","Rolpa","Rupandehi","Salyan",
  "Sankhuwasabha","Saptari","Sarlahi","Sindhuli","Sindhupalchok","Siraha","Solukhumbu",
  "Sunsari","Surkhet","Syangja","Taplejung","Terhathum","Udayapur","Western Rukum",
]

// helper to get the display name of a district in the correct language
function districtDisplay(key: string, np: boolean): string {
  if (!key) return ""
  // if nepali, return the nepali name from the map, otherwise return the english name
  if (np) return DISTRICT_NAMES_NP[key.toLowerCase()] || key
  return ALL_DISTRICTS.find(d => d.toLowerCase() === key.toLowerCase()) || key
}

// BS date helper functions
// converts a BS date (year, month, day) to an AD date string 
function bsToAD(y: number, m: number, d: number): string {
  try {
    let total = 0
    // add up all the days from BS year 2000 up to the given year
    for (let yr = 2000; yr < y; yr++) { const md = BS_MONTHS_DATA[yr]; if (!md) return ""; total += md.reduce((a,b)=>a+b,0) }
    const months = BS_MONTHS_DATA[y]; if (!months) return ""
    // add up the days for each month before the given month
    for (let mo = 1; mo < m; mo++) total += months[mo-1]
    // add the remaining days
    total += d - 1
    // convert total days offset to an actual date
    const dt = new Date((AD_START_DAYS + total) * 86400000)
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`
  } catch { return "" }
}

// returns the number of days in a specific BS month and year
function getDaysInBSMonth(y: number, m: number): number { return BS_MONTHS_DATA[y]?.[m-1] ?? 30 }

// converts an AD date string like "1999-04-14" back to BS year, month, day
function adToBSParts(adDate: string): {year:number;month:number;day:number}|null {
  if (!adDate) return null
  try {
    const [y,m,d] = adDate.split("-").map(Number)
    // calculate how many days have passed since the BS start date
    let diff = Math.round(Date.UTC(y,m-1,d)/86400000 - AD_START_DAYS)
    if (diff < 0) return null
    let bsY=2000,bsM=1,bsD=1
    // count forward through BS months until we use up all the days
    while (diff > 0) {
      const md = BS_MONTHS_DATA[bsY]; if (!md) return null
      const left = md[bsM-1] - bsD
      if (diff <= left) { bsD += diff; diff=0 }
      else { diff -= left+1; bsD=1; bsM++; if (bsM>12){bsM=1;bsY++} }
    }
    return {year:bsY,month:bsM,day:bsD}
  } catch { return null }
}

// list of BS years from 2000 to 2085 used in the year dropdown
const BS_YEARS      = Array.from({length:86},(_,i)=>2000+i)
// list of month numbers 1 to 12 used in the month dropdown
const BS_MONTHS_ARR = Array.from({length:12},(_,i)=>i+1)

// type definition for the birth details form fields
interface FormState {
  fullName:string; gender:string; bsYear:string; bsMonth:string
  bsDay:string; birthTime:string; birthPlace:string; latitude:string; longitude:string
}
// empty form state used when the page first loads
const EMPTY_FORM: FormState = { fullName:"",gender:"",bsYear:"",bsMonth:"",bsDay:"",birthTime:"",birthPlace:"",latitude:"",longitude:"" }

// district search combobox component — lets users search and select a district
function DistrictSearch({ value, onChange, placeholder, np }:{value:string;onChange:(v:string)=>void;placeholder:string;np:boolean}) {
  // state for the text the user is typing in the search box
  const [query,setQuery] = useState("")
  // state to control whether the dropdown list is visible or hidden
  const [open,setOpen]   = useState(false)
  // ref to detect when the user clicks outside the dropdown to close it
  const wrapRef = useRef<HTMLDivElement>(null)
  // filter the district list based on what the user typed — works in both english and nepali
  const filtered = ALL_DISTRICTS.filter(d =>
    d.toLowerCase().includes(query.toLowerCase()) || (DISTRICT_NAMES_NP[d.toLowerCase()]||"").includes(query)
  )
  // get the display name for the currently selected district
  const displayValue = value ? districtDisplay(value,np) : ""
  // close the dropdown when the user clicks anywhere outside this component
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(wrapRef.current&&!wrapRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown",h); return ()=>document.removeEventListener("mousedown",h)
  },[])
  return (
    // outer wrapper div used to detect outside clicks
    <div ref={wrapRef} className="relative">
      <div className="relative">
        {/* search icon on the left side of the input */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
        {/* search input — shows the typed query when open, or the selected value when closed */}
        <Input value={open?query:displayValue} onChange={e=>{setQuery(e.target.value);setOpen(true)}}
          onFocus={()=>{setQuery("");setOpen(true)}} placeholder={placeholder}
          className="bg-secondary border-border pl-9 pr-8"/>
        {/* clear button — shown only when a district is selected and dropdown is closed */}
        {displayValue&&!open&&(
          <button type="button" onClick={()=>{onChange("");setQuery("")}}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5"/>
          </button>
        )}
      </div>
      {/* dropdown list — shown only when the search box is focused */}
      {open&&(
        <div className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {/* show a message if no districts match the search */}
          {filtered.length===0
            ?<div className="px-3 py-2 text-sm text-muted-foreground">{np?"कुनै नतिजा छैन":"No results"}</div>
            // show each matching district as a clickable button
            :filtered.map(d=>(
              <button key={d} type="button"
                onClick={()=>{onChange(d.toLowerCase());setQuery("");setOpen(false)}}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${value===d.toLowerCase()?"text-primary font-medium bg-primary/10":"text-foreground"}`}>
                {/* show nepali name if language is nepali, otherwise show english name */}
                {np?(DISTRICT_NAMES_NP[d.toLowerCase()]||d):d}
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

// main birth details page component
export default function BirthDetailsPage() {
  // router used to redirect to kundali page after saving
  const router = useRouter()
  // get translation function and current language
  const { t, language } = useLanguage()
  // shorthand to check if current language is nepali
  const np = language === "nepali"

  // state for all form field values
  const [form,setForm]             = useState<FormState>(EMPTY_FORM)
  // state to show loading spinner when form is being submitted
  const [isLoading,setIsLoading]   = useState(false)
  // state to show loading spinner while existing data is being fetched
  const [isFetching,setIsFetching] = useState(true)
  // state to show an error message if something goes wrong
  const [error,setError]           = useState<string|null>(null)
  // state to show a success message after saving
  const [success,setSuccess]       = useState<string|null>(null)
  // state to track if the user already has saved birth details
  const [isExisting,setIsExisting] = useState(false)

  // convert the selected BS date to an AD date string for sending to the api
  const adDate = (form.bsYear&&form.bsMonth&&form.bsDay)
    ? bsToAD(+form.bsYear,+form.bsMonth,+form.bsDay) : ""

  // generate the list of valid days for the selected BS year and month
  const BS_DAYS = Array.from({length:(form.bsYear&&form.bsMonth)
    ?getDaysInBSMonth(+form.bsYear,+form.bsMonth):32},(_,i)=>i+1)

  // parse the latitude and longitude from the form as numbers for the map
  const mapLat = parseFloat(form.latitude)
  const mapLng = parseFloat(form.longitude)

  // this runs once when the page loads — fetches any existing birth details from the api
  useEffect(()=>{
    const token = localStorage.getItem(TOKEN_KEY)
    // if no token found, stop fetching and show the empty form
    if (!token){setIsFetching(false);return}
    fetch(`${API}/birth/`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>{if(r.status===404)return null;if(!r.ok)throw new Error(`${r.status}`);return r.json()})
      .then(json=>{
        if(!json?.birth_detail)return
        // fill the form with the existing birth details from the api
        const d=json.birth_detail; const bs=adToBSParts(d.birth_date)
        setForm({fullName:d.full_name,gender:d.gender,
          bsYear:bs?String(bs.year):"",bsMonth:bs?String(bs.month):"",bsDay:bs?String(bs.day):"",
          birthTime:d.birth_time.slice(0,5),birthPlace:d.birth_place,
          latitude:String(d.latitude),longitude:String(d.longitude)})
        // mark that the user already has existing data so we show "update" instead of "save"
        setIsExisting(true)
      })
      .catch(err=>{if(err.message!=="404")setError(np?"सर्भरसँग जोड्न सकिएन।":"Could not connect to server.")})
      .finally(()=>setIsFetching(false))
  },[])

  // called when user selects a district — also updates lat/lng from the district coords map
  const handleBirthPlaceChange = (value:string)=>{
    const coords = DISTRICT_COORDS[value.toLowerCase()]
    setForm(p=>({...p,birthPlace:value,
      latitude:coords?String(coords.lat):"",longitude:coords?String(coords.lng):""}))
  }

  // called when the user moves the map marker — updates lat/lng in the form
  // wrapped in useCallback so the function reference does not change on every render
  const handleMapMove = useCallback((lat:number,lng:number)=>{
    setForm(p=>({...p,latitude:String(lat),longitude:String(lng)}))
  },[])

  // called when the user submits the form — sends birth details to the api
  const handleSubmit = async(e:React.FormEvent)=>{
    e.preventDefault(); setError(null); setSuccess(null); setIsLoading(true)
    // stop if the BS date could not be converted to a valid AD date
    if(!adDate){setError(np?"कृपया मान्य BS मिति छान्नुहोस्।":"Please select a valid BS date.");setIsLoading(false);return}
    try {
      const token=localStorage.getItem(TOKEN_KEY)
      // stop if no auth token is found
      if(!token) throw new Error(np?"लगइन गर्नुहोस्।":"Not authenticated — please log in again.")
      // send the birth details to the api using POST
      const res=await fetch(`${API}/birth/`,{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
        body:JSON.stringify({fullName:form.fullName.trim(),gender:form.gender,birthDate:adDate,
          birthTime:form.birthTime,birthPlace:form.birthPlace,
          latitude:parseFloat(form.latitude),longitude:parseFloat(form.longitude)}),
      })
      const json=await res.json()
      // throw an error if the api returned a non-ok status
      if(!res.ok) throw new Error(json.error??(np?"केही गल्ती भयो":"Something went wrong"))
      // show success message and redirect to kundali page after 1.2 seconds
      setSuccess(isExisting?(np?"जन्म विवरण अपडेट भयो!":"Birth details updated!"):(np?"जन्म विवरण सेभ भयो!":"Birth details saved!"))
      setIsExisting(true)
      setTimeout(()=>router.push("/janma-kundali"),1200)
    } catch(err:unknown){
      setError(err instanceof Error?err.message:(np?"अनपेक्षित गल्ती":"Unexpected error"))
    } finally{setIsLoading(false)}
  }

  // show a full page loading spinner while existing data is being fetched
  if(isFetching) return (
    <AuthGuard><DashboardLayout title={t("nav.birthDetails")}>
      <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary"/></div>
    </DashboardLayout></AuthGuard>
  )

  return (
    // auth guard makes sure only logged in users can see this page
    <AuthGuard>
      <DashboardLayout title={t("nav.birthDetails")}>
        <div className="max-w-2xl mx-auto">

          {/* main form card */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="text-center">
              {/* sparkles icon at the top of the card */}
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary"/>
              </div>
              {/* card title — shows "update" if user already has data, otherwise shows "enter" */}
              <CardTitle className="text-2xl gradient-text">
                {isExisting?(np?"जन्म विवरण अपडेट गर्नुहोस्":"Update Birth Details"):(np?"जन्म विवरण भर्नुहोस्":"Enter Birth Details")}
              </CardTitle>
              <CardDescription className="text-lg">{np?"जन्म विवरण भर्नुहोस्":"Fill in your birth details"}</CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                {np?"सटीक वैदिक ज्योतिष गणनाको लागि सही जन्म विवरण आवश्यक छ।":"Accurate birth details are essential for precise Vedic astrology calculations"}
              </p>
            </CardHeader>

            <CardContent>
              {/* error message box — shown only when there is an error */}
              {error   &&<div className="mb-4 rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">{error}</div>}
              {/* success message box — shown only after successful save */}
              {success &&<div className="mb-4 rounded-md bg-green-500/15 px-4 py-3 text-sm text-green-600">✅ {success}</div>}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* full name input field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary"/>{np?"पूरा नाम":"Full Name"}
                  </Label>
                  <Input id="fullName" type="text" placeholder={np?"तपाईंको पूरा नाम लेख्नुहोस्":"Enter your full name"}
                    className="bg-secondary border-border" value={form.fullName}
                    onChange={e=>setForm(p=>({...p,fullName:e.target.value}))} required/>
                </div>

                {/* gender dropdown */}
                <div className="space-y-2">
                  <Label className="text-foreground">{np?"लिङ्ग":"Gender"}</Label>
                  <Select value={form.gender} onValueChange={v=>setForm(p=>({...p,gender:v}))}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder={np?"लिङ्ग छान्नुहोस्":"Select gender"}/>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="male">{np?"पुरुष":"Male"}</SelectItem>
                      <SelectItem value="female">{np?"महिला":"Female"}</SelectItem>
                      <SelectItem value="other">{np?"अन्य":"Other"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* birth date section — three dropdowns for BS year, month and day */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary"/>{np?"जन्म मिति — बि.सं.":"Date of Birth — BS"}
                  </Label>
                  <div className="grid grid-cols-3 gap-3">

                    {/* BS year dropdown */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{np?"वर्ष":"Year"}</p>
                      <Select value={form.bsYear} onValueChange={v=>setForm(p=>({...p,bsYear:v,bsDay:""}))}>
                        <SelectTrigger className="bg-secondary border-border">
                          {/* show selected year in nepali numerals if language is nepali */}
                          {form.bsYear?<span>{toNpNum(form.bsYear,np)}</span>:<span className="text-muted-foreground">{np?"वर्ष":"Year"}</span>}
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-60">
                          {BS_YEARS.map(y=><SelectItem key={y} value={String(y)}>{toNpNum(y,np)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* BS month dropdown */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{np?"महिना":"Month"}</p>
                      <Select value={form.bsMonth} onValueChange={v=>setForm(p=>({...p,bsMonth:v,bsDay:""}))}>
                        <SelectTrigger className="bg-secondary border-border">
                          {/* show selected month name in the correct language */}
                          {form.bsMonth
                            ?<span>{np?BS_MONTHS_NP[+form.bsMonth-1]:BS_MONTHS_EN[+form.bsMonth-1]}</span>
                            :<span className="text-muted-foreground">{np?"महिना":"Month"}</span>}
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-60">
                          {BS_MONTHS_ARR.map(m=>(
                            <SelectItem key={m} value={String(m)}>
                              {toNpNum(String(m).padStart(2,"0"),np)} — {np?BS_MONTHS_NP[m-1]:BS_MONTHS_EN[m-1]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* BS day dropdown — days change based on selected year and month */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{np?"गते":"Day"}</p>
                      <Select value={form.bsDay} onValueChange={v=>setForm(p=>({...p,bsDay:v}))}>
                        <SelectTrigger className="bg-secondary border-border">
                          {form.bsDay?<span>{toNpNum(String(form.bsDay).padStart(2,"0"),np)}</span>:<span className="text-muted-foreground">{np?"गते":"Day"}</span>}
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border max-h-60">
                          {BS_DAYS.map(d=><SelectItem key={d} value={String(d)}>{toNpNum(String(d).padStart(2,"0"),np)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* show the selected BS date and its converted AD date below the dropdowns */}
                  {form.bsYear&&form.bsMonth&&form.bsDay&&(
                    <div className="flex items-center justify-between px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary"/>
                        <span className="text-sm font-semibold text-primary">
                          {toNpNum(form.bsYear,np)}/{toNpNum(String(form.bsMonth).padStart(2,"0"),np)}/{toNpNum(String(form.bsDay).padStart(2,"0"),np)} {np?"बि.सं.":"BS"}
                        </span>
                      </div>
                      {/* show the equivalent AD date on the right side */}
                      {adDate&&<span className="text-xs text-muted-foreground">{np?"इ.सं.:":"AD:"} {toNpNum(adDate,np)}</span>}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{np?"बिक्रम सम्वत् (बि.सं.) मिति छान्नुहोस्":"Select Bikram Sambat (BS) date"}</p>
                </div>

                {/* birth time input — uses a time picker */}
                <div className="space-y-2">
                  <Label htmlFor="birthTime" className="text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary"/>{np?"जन्म समय":"Birth Time"}
                  </Label>
                  <div className="relative">
                    {/* hide the default time input text and overlay nepali numerals on top */}
                    <Input id="birthTime" type="time"
                      className={`bg-secondary border-border ${np&&form.birthTime?"text-transparent":""}`}
                      value={form.birthTime} onChange={e=>setForm(p=>({...p,birthTime:e.target.value}))} required/>
                    {/* nepali numeral overlay shown only when language is nepali and time is selected */}
                    {np&&form.birthTime&&(
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                        <span className="text-sm text-foreground">{toNpNum(form.birthTime,true)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{np?"लग्न गणनाको लागि सही समय अत्यावश्यक छ।":"Accurate time is crucial for Lagna calculation"}</p>
                </div>

                {/* birth place — district search combobox */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary"/>{np?"जन्म स्थान":"Birth Place"}
                  </Label>
                  <DistrictSearch value={form.birthPlace} onChange={handleBirthPlaceChange}
                    placeholder={np?"जिल्ला खोज्नुहोस्...":"Search district..."} np={np}/>
                  {/* show the selected district name below the search box */}
                  {form.birthPlace&&<p className="text-xs text-primary">✓ {districtDisplay(form.birthPlace,np)}</p>}
                </div>

                {/* interactive map — user can click or drag the marker to set exact location */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary"/>
                    {np?"नक्सामा सटीक स्थान छान्नुहोस्":"Pick exact location on map"}
                    <span className="ml-auto text-xs text-muted-foreground font-normal">
                      {np?"click वा marker तान्नुहोस्":"Click or drag marker"}
                    </span>
                  </Label>
                  {/* map centers on the selected district, or defaults to center of Nepal */}
                  <MapPicker
                    lat={isNaN(mapLat)?28.3949:mapLat}
                    lng={isNaN(mapLng)?84.124:mapLng}
                    label={districtDisplay(form.birthPlace,np)}
                    onMove={handleMapMove}
                  />
                  <p className="text-xs text-muted-foreground">
                    {np
                      ?"जिल्ला छान्दा नक्सा स्वत: त्यहाँ जान्छ। नक्सामा click गरेर वा marker तानेर सटीक ठाउँ छान्नुहोस्।"
                      :"Selecting a district auto-centers the map. Click or drag the marker for exact coordinates."}
                  </p>
                </div>

                {/* latitude and longitude fields — auto-filled from the map */}
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary"/>
                    {np?"निर्देशांक":"Coordinates"}
                    <span className="ml-auto text-xs text-muted-foreground font-normal">
                      {np?"नक्साबाट स्वत: भरिन्छ":"Auto-filled from map"}
                    </span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">

                    {/* latitude input */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{np?"अक्षांश":"Latitude"}</p>
                      <div className="relative">
                        <Input type="number" step="0.0001" min="-90" max="90" placeholder="e.g. 27.7172"
                          className={`bg-secondary border-border ${np&&form.latitude?"text-transparent":""}`}
                          value={form.latitude} onChange={e=>setForm(p=>({...p,latitude:e.target.value}))} required/>
                        {/* nepali numeral overlay for latitude */}
                        {np&&form.latitude&&(
                          <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                            <span className="text-sm text-foreground">{toNpNum(form.latitude,true)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* longitude input */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{np?"देशान्तर":"Longitude"}</p>
                      <div className="relative">
                        <Input type="number" step="0.0001" min="-180" max="180" placeholder="e.g. 85.3240"
                          className={`bg-secondary border-border ${np&&form.longitude?"text-transparent":""}`}
                          value={form.longitude} onChange={e=>setForm(p=>({...p,longitude:e.target.value}))} required/>
                        {/* nepali numeral overlay for longitude */}
                        {np&&form.longitude&&(
                          <div className="absolute inset-0 flex items-center px-3 pointer-events-none">
                            <span className="text-sm text-foreground">{toNpNum(form.longitude,true)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* submit button — shows a spinner and different text while loading */}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={isLoading}>
                  {isLoading
                    // show spinner and loading text while the form is being submitted
                    ?<><Loader2 className="mr-2 h-5 w-5 animate-spin"/>
                        {isExisting?(np?"अपडेट हुँदैछ...":"Updating..."):(np?"कुण्डली बनाउँदैछ...":"Generating Kundali...")}
                      </>
                    // show sparkles icon and action text when form is ready to submit
                    :<><Sparkles className="mr-2 h-5 w-5"/>
                        {isExisting?(np?"जन्म विवरण अपडेट गर्नुहोस्":"Update Birth Details"):(np?"जन्म कुण्डली बनाउनुहोस्":"Generate Janma Kundali")}
                      </>
                  }
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* info card at the bottom explaining why accurate birth details are important */}
          <Card className="mt-6 bg-primary/10 border-primary/30">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-foreground mb-2">
                {np?"सही जन्म विवरण किन महत्वपूर्ण छ?":"Why accurate birth details matter?"}
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                {/* show bullet points in nepali or english based on current language */}
                {np?(
                  <>
                    <li>• जन्म समयले तपाईंको लग्न निर्धारण गर्छ</li>
                    <li>• स्थान र निर्देशांकले ग्रह स्थितिलाई असर गर्छ</li>
                    <li>• सही तथ्यांकले सटीक दशा भविष्यवाणी सुनिश्चित गर्छ</li>
                    <li>• सबै वैदिक गणनाहरू सटीक समय र भूगोलमा निर्भर छन्</li>
                  </>
                ):(
                  <>
                    <li>• Birth time determines your Ascendant (Lagna)</li>
                    <li>• Location &amp; coordinates affect planetary positions</li>
                    <li>• Accurate data ensures precise Dasha predictions</li>
                    <li>• All Vedic calculations depend on exact timing &amp; geography</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>

        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}