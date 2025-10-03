## 📘 Growing Together – Full Master Specification & Workflow Pack

Expanded for admins and members, with practical step-by-step use.

---

## 1. Plain-English Summary

- **What**: A friendly, garden-themed allotment community app.
- **Why**: Make allotment life easier, more fun, and more connected.
- **Who**:
  - **Members**: Plot holders, families, visitors.
  - **Admins**: Committee members (4–5 people).
- **Where**: Runs on iPhone, Android, and Web.
- **Goal**: Everything works offline and syncs when connected.

---

## 2. Branding

- **Theme**: Fun, friendly, community garden.
- **Colours**:
  - Leaf Green 🌱 `#4CAF50`
  - Soil Brown 🌾 `#795548`
  - Sky Blue ☁️ `#03A9F4`
  - Sunshine Yellow 🌞 `#FFEB3B`
  - White + greys
- **Fonts**: Rounded & friendly (Poppins/Nunito).
- **Icons**: Garden imagery (trowel, seeds, watering can).

---

## 3. Feature Set – With Detailed User Workflows

### 👩‍🌾 For Members (Plot Holders)

1) **Home Dashboard**

- On open: Greeting (e.g., “Hello Sarah 🌱”).
- Card 1: Weekly Tasks (auto-generated + admin-broadcast).
- Card 2: Next Event (e.g., “BBQ under Willow Tree – Sat 2pm”).
- Floating “+” to add a diary entry instantly.
- **How they use it**: Weekly snapshot of what’s important without digging.

2) **Community Calendar**

- View all upcoming events (BBQs, meetings, workshops).
- Tap an event → full details.
- Button → “Add to My Device Calendar.”
- **How they use it**: Keeps everyone aligned; replaces messy chat reminders.

3) **Plant / Plot Diary**

- Tap “+” → New Diary Entry.
- Add photo(s), notes (e.g., “Planted carrots today”), and tags (e.g., “Potatoes,” “Greenhouse”).
- Works offline; entries sync later when online.
- **How they use it**: Personal allotment journal; choose to share or keep private.

4) **AI Plant Assistant**

- Simple chatbox: “Ask our AI Gardener.”
- Type or upload photo (e.g., “What’s wrong with my tomato leaves?”).
- AI responds with actionable advice (watering, pests, soil, etc.).
- **How they use it**: Quick garden help without searching the web.

5) **Weekly Tasks Generator**

- Tasks appear automatically each week (seasonal + site-wide).
- Example: “🌱 Sow lettuce now – perfect time of year.”
- Admin tasks appear here too (e.g., “Please weed communal path this week”).
- **How they use it**: Clear, timely, allotment-specific actions.

6) **Recipes & Ideas**

- Shared recipe wall for harvest cooking ideas.
- Add photo + steps; saved to community cookbook.
- **How they use it**: Share and discover ways to use produce.

7) **Community Chat & Announcements**

- Light chat for friendly discussion.
- Announcements with admin-pinned posts at top (e.g., “Plot Inspections this Sunday”).
- **How they use it**: Chat freely; pinned official info is always visible.

8) **Rules & Contracts**

- Tab: “Allotment Rules” with plain-English do’s/don’ts.
- Each member can access their signed contract and admin-shared files.
- **How they use it**: Rules are always accessible; no confusion.

---

### 🛠️ For Admins (Committee Team)

Admins see everything above plus an Admin Dashboard tab with tools.

1) **Admin Dashboard (Main Menu)**

- Buttons: Events, Announcements, Members, Documents, Plot Inspections, Tasks Generator.

2) **Create & Manage Events**

- Tap “Add Event” → Title, Date, Time, Location, Description.
- Option: “Send push notification now.”
- Event appears instantly in Member Calendar.
- **How admins use it**: Announce BBQs, meetings, work days quickly.

3) **Broadcast Announcements**

- Tap “New Announcement” → Title + Body.
- Options: Pin to top; send push notification.
- Members see it immediately in Announcement Feed.
- **How admins use it**: Share urgent notices (e.g., “Water supply off today”).

4) **Manage Members**

- View list of all registered members.
- Approve/decline new sign-ups.
- Edit member details (plot no, email, contract).
- Remove inactive members.
- **How admins use it**: Keep membership tidy and authentic.

5) **Upload Documents**

- Upload PDFs/Word docs (stored in Supabase).
- Members can access under “Documents & Rules.”
- Examples: Rulebook, Site Map, Emergency Contacts.
- **How admins use it**: Centralised document store; no lost copies.

6) **Plot Inspections (Important)**

- Start Plot Inspection → choose plot number.
- Tick boxes: Plot in use? Maintained?
- Add notes + photos.
- Inspection saved and logged against member.
- Option to generate PDF report.
- **How admins use it**: Formal record; evidence for enforcing rules.

7) **Tasks Generator (Broadcast)**

- Choose task (e.g., “Weed communal area”).
- Assign to: Everyone or individual member/plot.
- Appears in member dashboards under “This Week’s Tasks.”
- **How admins use it**: Keep members engaged in site upkeep.

---

## 4. Technical Setup (For Developer)

- **Stack**: Expo 51, React Native 0.74, Supabase backend, Zustand + TanStack Query for state, expo-router for navigation.
- **Offline**: SQLite cache with sync to Supabase.
- **Image Uploads**: expo-image-picker + Supabase storage.
- **Push Notifications**: Expo Notifications.
- **Environment** (`.env`):
  - `EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxx`
  - `EXPO_PUBLIC_WEATHER_API_KEY=xxxx`

---

## 5. Admin vs Member Quick View

| Feature | Members (Plot Holders) | Admins (Committee) |
|---|---|---|
| Dashboard | Tasks + Events snapshot | Same + “Admin Tools” button |
| Calendar | View & RSVP | Create / edit events |
| Diary | Add personal plant notes/photos | Same; optional moderation if shared |
| AI Assistant | Garden Q&A | Garden Q&A (same as members) |
| Weekly Tasks | See generated & admin tasks | Create & broadcast tasks |
| Recipes | Browse + add recipes | Moderate/remove if needed |
| Announcements | Read pinned notices | Create pinned notices & send push alerts |
| Chat | Post & reply | Moderate chat |
| Rules/Docs | View rulebook + their contract | Upload/manage documents |
| Members | – | Approve/remove/edit members |
| Plot Inspections | – | Record inspection results, notes, photos |

---

✅ This provides full, detailed workflows for admins and members with plain-English steps.


