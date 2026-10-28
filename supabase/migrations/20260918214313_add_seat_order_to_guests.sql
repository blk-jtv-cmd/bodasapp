/*
# Add seat_order column to guests

1. Modified Tables
- `guests`: added `seat_order` (integer, default 0) to store the seating order of guests within a table.
2. Security
- No policy changes; existing RLS policies already cover the guests table.
3. Notes
- The column is nullable with a default of 0 so existing rows are unaffected.
- Frontend will use this to let couples reorder seated guests via drag-and-drop.
*/

ALTER TABLE guests ADD COLUMN IF NOT EXISTS seat_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_guests_table_seat_order ON guests (table_number, seat_order);