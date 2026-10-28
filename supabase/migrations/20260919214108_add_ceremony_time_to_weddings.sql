/*
# Add ceremony time to weddings

1. Modified Tables
- `weddings`: add `ceremony_time`, a nullable time value storing the ceremony start time selected by the couple.

2. Security
- No new table or policy is introduced. Existing owner-scoped policies on `weddings` continue to protect this field.

3. Important Notes
- The field is nullable so existing weddings remain valid and continue to show the empty state until the couple chooses a time.
- Existing wedding data is preserved.
*/

ALTER TABLE public.weddings
  ADD COLUMN IF NOT EXISTS ceremony_time time;
