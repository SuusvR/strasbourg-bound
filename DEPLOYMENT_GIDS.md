# 🛤️ Strasbourg Bound — Deployment Gids
### Gratis live zetten in ~30 minuten, geen codeerkennis nodig

---

## Wat je nodig hebt
- Een computer met browser
- Je 7 teamfoto's (zitten al in de map `/public/photos`)
- ~30 minuten

---

## Stap 1 — GitHub account aanmaken (5 min)

1. Ga naar **github.com**
2. Klik "Sign up" rechtsboven
3. Kies een gebruikersnaam, e-mail en wachtwoord
4. Bevestig je e-mail

---

## Stap 2 — Supabase account + database (10 min)

1. Ga naar **supabase.com**
2. Klik "Start for free" → inloggen met je GitHub account
3. Klik "New project"
   - Name: `strasbourg-bound`
   - Database Password: klik "Generate" (hoef je niet te onthouden)
   - Region: kies "West EU (Ireland)"
4. Wacht ~2 minuten tot het project klaar is
5. Klik links op **"SQL Editor"**
6. Klik "New query"
7. Kopieer de VOLLEDIGE inhoud van het bestand `SETUP_DATABASE.sql` en plak het in het venster
8. Klik de groene **"Run"** knop
9. Je ziet "Success. No rows returned" — dat is goed! ✅
10. Ga naar **Project Settings → API** (tandwiel-icoontje links)
11. Kopieer de **"Project URL"** (begint met https://...)
12. Kopieer de **"anon public"** key (lange string van letters)
13. Bewaar deze twee waardes (even in een notitie plakken)

---

## Stap 3 — Vercel account + deployen (10 min)

1. Ga naar **vercel.com**
2. Klik "Sign Up" → "Continue with GitHub"
3. Klik op je profielnaam rechts → "Add New Project"
4. Klik "Browse" of sleep de **strasbourg-bound map** erin
   (de map met alle bestanden die je hebt ontvangen)
5. Vercel detecteert automatisch dat het een Next.js project is
6. Voordat je klikt op Deploy: klik op **"Environment Variables"**
7. Voeg toe:
   - Name: `NEXT_PUBLIC_SUPABASE_URL` → Value: (de URL uit stap 2)
   - Klik "Add"
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Value: (de key uit stap 2)
   - Klik "Add"
8. Klik **"Deploy"**
9. Wacht ~2 minuten
10. Je krijgt een URL zoals `strasbourg-bound.vercel.app` ✅

---

## Stap 4 — Testen (5 min)

1. Ga op je laptop naar: `jouw-url.vercel.app/host`
2. Je ziet het host-scherm met een kamercode (bijv. STR7)
3. Open op je telefoon: `jouw-url.vercel.app`
4. Vul je naam in + de kamercode
5. Je zou jezelf moeten zien verschijnen op het host-scherm ✅

---

## Op de dag zelf

1. Open `jouw-url.vercel.app/host` op je laptop
2. Deel je scherm via Teams/Zoom/Google Meet
3. Laat iedereen de QR-code scannen of de URL intypen
4. Klik "Start game" wanneer iedereen er is
5. Jij klikt als host door de rondes — spelers doen alles op hun telefoon

---

## Iets werkt niet?

Stuur een screenshot naar Claude (AI) in claude.ai — dan wordt het stap voor stap opgelost!

---

*Strasbourg Bound — BouwApp Team Game*
