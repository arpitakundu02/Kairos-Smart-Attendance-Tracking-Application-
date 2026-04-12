# Supabase Setup

1. Open your Supabase project SQL editor.
2. Run `supabase/schema.sql`.
3. Create at least one teacher profile:
   - In `profiles`, set `role = 'teacher'` for that user's `id`.
4. Create classes and enroll students using `classes` and `class_enrollments`.

The app expects these env vars:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
