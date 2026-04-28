-- Seed default About-page copy. The storefront falls back to its hardcoded
-- HTML if D1 ever goes quiet, so these values are mainly the starting point
-- Max edits from. Keys map to data-content-key attributes in about.html.

DELETE FROM site_content;

INSERT INTO site_content (key, value) VALUES
  ('about_eyebrow', 'Meet the maker'),
  ('about_h1_main', 'Max White,'),
  ('about_h1_em',   'in his element.'),
  ('about_tagline', 'Bring the world to your walls.'),
  ('about_lede',    'A small workshop in Gordonvale, the smell of resin curing in the Far North Queensland heat, and a stubborn idea — that a wall mount could feel as alive as the fish itself.'),
  ('about_meta_workshop', 'Gordonvale, FNQ'),
  ('about_meta_craft',    'Resin · Hardwood · Print'),
  ('about_meta_runby',    'Max & P. White'),

  ('about_story_h2',   'The story behind <em>Crystal Brook.</em>'),
  ('about_story_p1',   'The brand takes its name from <strong>Crystal Brook</strong> — a freshwater creek that winds out of the Atherton Tableland and runs through the cane country south of Cairns. It''s the same water that gave Max the original spark: a fish, a slab of timber, and the question of how to make one feel as permanent as the other.'),
  ('about_story_p2',   'The studio sits in <strong>Gordonvale</strong>, half an hour''s drive south of Cairns. It''s a one-and-a-half-person operation — Max does the cutting, the mounting and the resin work, and his partner P. helps run the shop side. Workshop visits are by appointment — drop a message or give him a ring and he''ll set a time.'),
  ('about_story_pull', '"Each one is its own piece. No two come out the same — which is the whole point."'),
  ('about_story_p3',   'The product range is deliberately narrow: resin-coated cut-out archival prints mounted on Australian hardwood. <strong>Six categories</strong>, no spillover into homewares or trinkets. Reef fish from the Great Barrier Reef. Freshwater natives from the rivers that feed it. Aussie-built classic cars. Working dogs, wildlife and family pets. Aussie birds. And montages — multi-subject pieces mounted on Australia or Queensland-shaped hardwood backings.'),
  ('about_story_p4',   'What unites them is the finish — every piece spends 48 hours under jewellery-grade epoxy that locks the print, the mount and the maker''s mark under a single lens of glass-clear resin. It''s the kind of thing that looks expensive because it <em>is</em> the kind of thing that lasts a lifetime. A hundred years, if the inks are anything to go by.'),

  ('shipping_eyebrow',      'Shipping'),
  ('shipping_h2',           'Australia-wide. Free, always.'),
  ('shipping_card1_title',  'Free Australia-wide shipping'),
  ('shipping_card1_body',   'Every order ships free to your door, anywhere in Australia. No threshold, no surcharge for the far corners — same delivery to Cairns or Hobart, on us.'),
  ('shipping_card2_title',  'Production: 4–6 weeks'),
  ('shipping_card2_body',   'Each piece is made to order in the Gordonvale workshop. Print, cut, mount, three resin pours, 48-hour cure, signed and numbered. We don''t rush the resin.'),
  ('shipping_card3_title',  'Transit: 3–5 business days'),
  ('shipping_card3_body',   'Once Max packs it (in a custom timber crate for anything over 80 cm), it ships via Australia Post tracked. Tracking link emailed the moment it leaves the workshop.'),
  ('shipping_card4_title',  'International? Drop us a line'),
  ('shipping_card4_body',   'We''ve shipped to NZ, Singapore and the UK. Ask for a quote at <a href="mailto:mandpwhite@optusnet.com.au">mandpwhite@optusnet.com.au</a> with your suburb and the piece you''re after.'),
  ('shipping_callout',      '<strong>Big pieces.</strong> Anything over 100 × 70 cm goes road freight (still tracked, still insured) — allow an extra few days, and we''ll co-ordinate a delivery window with you. Lift gate available on request.');
