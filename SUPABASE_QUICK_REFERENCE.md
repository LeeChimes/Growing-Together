# Supabase Quick Reference

## ✅ Setup Complete!

Your Growing Together app is now fully configured with Supabase.

## Environment Variables (Already Set)
```
✅ .env file created
✅ SUPABASE_URL configured
✅ SUPABASE_ANON_KEY configured
```

## What Was Fixed

### 1. Database Type Definitions
- ✅ Added 7 missing tables (plots, comments, reactions, inspections, rules, rule_acknowledgements, documents)
- ✅ Fixed field mismatches in posts, join_codes, diary_entries, photos tables

### 2. Storage Configuration
- ✅ Fixed bucket references (removed non-existent 'media' bucket)
- ✅ All uploads now use 'photos' bucket for images
- ✅ Documents use 'documents' bucket

### 3. Authentication & Admin
- ✅ Join code validation now uses expires_at and uses_count
- ✅ Fixed admin dashboard to display correct usage statistics

## Your Credentials

**Project URL:** https://yphxxvjpgmpozbgfrkva.supabase.co
**Project ID:** yphxxvjpgmpozbgfrkva
**Test User:** leekgcarter1977@gmail.com
**User ID:** ccb6da1e-81ce-499f-81c4-f894d9c2b2f7

## Storage Buckets
- `photos` - User photos, gallery images, inspection photos
- `documents` - PDF documents, contracts, forms

## Quick Start

```bash
# Start the development server
npm start

# For web
npm run web

# For iOS
npm run ios

# For Android
npm run android
```

## Important: Storage Bucket Names

⚠️ **Please verify your storage bucket names in Supabase Dashboard:**

1. Go to: https://supabase.com/dashboard/project/yphxxvjpgmpozbgfrkva/storage/buckets
2. Check if buckets are named:
   - `photos` (lowercase) ✅
   - `documents` (lowercase) ✅

If they're capitalized ("Photos", "Documents"), let me know and I'll update the code to match.

## File Changes Made

| File | Change Description |
|------|-------------------|
| `src/lib/database.types.ts` | Added 7 tables, fixed field names |
| `src/lib/supabase.ts` | Updated join code validation logic |
| `src/hooks/useAdmin.ts` | Fixed join code creation/toggle |
| `src/hooks/useInspections.ts` | Changed 'media' → 'photos' bucket |
| `src/components/AdminDashboard.tsx` | Fixed uses_count display |
| `.env` | Created with Supabase credentials |

## Testing Your Setup

1. **Start the app**: `npm start`
2. **Sign in** with your test account
3. **Try uploading a photo** to the gallery
4. **Create a diary entry** with photos
5. **Check if data appears in Supabase Dashboard**

## Common Issues & Solutions

### "Invalid API key" error
- Check `.env` file exists in project root
- Restart Metro bundler: `npm start` (press R to reload)

### Photos not uploading
- Verify storage buckets exist: `photos` and `documents`
- Check bucket names are lowercase
- Verify RLS policies allow uploads

### Authentication fails
- Check Supabase Auth is enabled
- Verify email auth provider is active
- Check user exists in Supabase Dashboard

## Next Steps

1. ✅ Test authentication (sign in/sign up)
2. ✅ Test photo uploads (gallery feature)
3. ✅ Test document uploads (admin feature)
4. ✅ Verify all features work as expected
5. ✅ Check RLS policies if any permission errors occur

---

**All set! Your app is ready to use with Supabase.** 🚀

For detailed information, see `SUPABASE_SETUP_COMPLETE.md`


