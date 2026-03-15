-- Seed Data for Onesign Display
-- Assumes auth.users is populated or we insert manually if using local supabase

-- 1. Create a Demo Client
INSERT INTO public.clients (id, name, slug)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Onesign Demo Client', 'onesign-demo')
ON CONFLICT DO NOTHING;

-- 2. Create a Store
INSERT INTO public.stores (id, client_id, name)
VALUES
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'HQ Flagship')
ON CONFLICT DO NOTHING;

-- 3. Create a Screen Set
INSERT INTO public.screen_sets (id, store_id, name)
VALUES
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Lobby Menu Board')
ON CONFLICT DO NOTHING;

-- 4. Create Screens (4 Landscape, 1 Portrait)
INSERT INTO public.screens (id, store_id, screen_set_id, name, index_in_set, orientation, display_type, pairing_code, player_token)
VALUES
  -- Screen 1
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d44', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 1 (Left)', 1, 'landscape', 'pc', '111111', 'token-screen-1'),
  -- Screen 2
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d45', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 2', 2, 'landscape', 'pc', '222222', 'token-screen-2'),
  -- Screen 3
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d46', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 3', 3, 'landscape', 'android', '333333', 'token-screen-3'),
  -- Screen 4
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d47', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Screen 4 (Right)', 4, 'landscape', 'firestick', '444444', 'token-screen-4'),
  -- Screen 5 (Portrait)
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380d48', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Promo Vertical', 1, 'portrait', 'pc', '555555', 'token-screen-5')
ON CONFLICT DO NOTHING;
