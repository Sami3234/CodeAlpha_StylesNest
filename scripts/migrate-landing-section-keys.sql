-- Run once on Neon / Postgres after deploying renamed landing sections:
-- purse → jewelry (homepage collage section)
-- lace → clothes (former lace flip-card section)

UPDATE landing_images SET section = 'jewelry' WHERE section = 'purse';
UPDATE landing_images SET section = 'clothes' WHERE section = 'lace';
