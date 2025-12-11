/*
  # Emoji Survivors Game Database Schema

  ## New Tables
  
  ### `player_profiles`
  - `id` (uuid, primary key) - Unique player identifier
  - `player_name` (text) - Player's chosen name
  - `language` (text) - Selected language (ru/en/es/zh)
  - `total_coins` (integer) - Accumulated currency
  - `total_deaths` (integer) - Death counter for ghost hero unlock
  - `total_damage_dealt` (bigint) - Cumulative damage for rock star unlock
  - `max_survival_time` (integer) - Best survival time in seconds
  - `boss_defeated` (boolean) - Boss victory flag for techno-bot unlock
  - `max_upgrades_in_run` (integer) - Most upgrades in single run
  - `unlocked_heroes` (jsonb) - Array of unlocked hero emojis
  - `selected_hero` (text) - Currently selected hero emoji
  - `created_at` (timestamptz) - Account creation time
  - `updated_at` (timestamptz) - Last update time
  
  ### `game_history`
  - `id` (uuid, primary key) - Unique run identifier
  - `player_id` (uuid, foreign key) - References player_profiles
  - `seed` (text) - Map generation seed
  - `game_mode` (text) - Mode played (survival/arena/maze/etc)
  - `hero_used` (text) - Hero emoji used
  - `duration_seconds` (integer) - How long survived
  - `level_reached` (integer) - Highest level achieved
  - `coins_earned` (integer) - Money collected
  - `enemies_killed` (integer) - Total kills
  - `damage_dealt` (bigint) - Total damage output
  - `upgrades_taken` (jsonb) - Array of upgrade choices
  - `played_at` (timestamptz) - When the game was played
  
  ## Security
  - Enable RLS on all tables
  - Players can only access their own data
  - Authenticated users can create and update their profiles
*/

CREATE TABLE IF NOT EXISTS player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  language text DEFAULT 'ru',
  total_coins integer DEFAULT 0,
  total_deaths integer DEFAULT 0,
  total_damage_dealt bigint DEFAULT 0,
  max_survival_time integer DEFAULT 0,
  boss_defeated boolean DEFAULT false,
  max_upgrades_in_run integer DEFAULT 0,
  unlocked_heroes jsonb DEFAULT '["🙂"]'::jsonb,
  selected_hero text DEFAULT '🙂',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES player_profiles(id) ON DELETE CASCADE,
  seed text NOT NULL,
  game_mode text NOT NULL,
  hero_used text NOT NULL,
  duration_seconds integer DEFAULT 0,
  level_reached integer DEFAULT 1,
  coins_earned integer DEFAULT 0,
  enemies_killed integer DEFAULT 0,
  damage_dealt bigint DEFAULT 0,
  upgrades_taken jsonb DEFAULT '[]'::jsonb,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can view own profile"
  ON player_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Players can insert own profile"
  ON player_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Players can update own profile"
  ON player_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Players can view own history"
  ON game_history FOR SELECT
  TO authenticated
  USING (player_id = auth.uid());

CREATE POLICY "Players can insert own history"
  ON game_history FOR INSERT
  TO authenticated
  WITH CHECK (player_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_game_history_player ON game_history(player_id);
CREATE INDEX IF NOT EXISTS idx_game_history_played_at ON game_history(played_at DESC);