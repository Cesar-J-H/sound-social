CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(30) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  display_name  VARCHAR(80),
  bio           TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────
CREATE TABLE follows (
  follower_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ─────────────────────────────────────────
-- ARTISTS
-- ─────────────────────────────────────────
CREATE TABLE artists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mbid          VARCHAR(100) UNIQUE NOT NULL,
  name          VARCHAR(255) NOT NULL,
  image_url     TEXT,
  genres        TEXT[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ALBUMS
-- ─────────────────────────────────────────
CREATE TABLE albums (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mbid          VARCHAR(100) UNIQUE NOT NULL,
  artist_id     UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  cover_url     TEXT,
  release_date  DATE,
  album_type    VARCHAR(30),
  total_tracks  INT,
  avg_rating    NUMERIC(3,2) DEFAULT 0,
  rating_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- TRACKS
-- ─────────────────────────────────────────
CREATE TABLE tracks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mbid          VARCHAR(100) UNIQUE NOT NULL,
  album_id      UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  artist_id     UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  duration_ms   INT,
  track_number  INT,
  avg_rating    NUMERIC(3,2) DEFAULT 0,
  rating_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- RATINGS
-- ─────────────────────────────────────────
CREATE TABLE ratings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type   VARCHAR(10) NOT NULL CHECK (entity_type IN ('album', 'track')),
  entity_id     UUID NOT NULL,
  rating        NUMERIC(3,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 10.0),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type   VARCHAR(10) NOT NULL CHECK (entity_type IN ('album', 'track')),
  entity_id     UUID NOT NULL,
  body          TEXT NOT NULL,
  like_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────
CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type   VARCHAR(10) NOT NULL CHECK (entity_type IN ('album', 'track', 'review', 'list')),
  entity_id     UUID NOT NULL,
  parent_id     UUID REFERENCES comments(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  like_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LIKES
-- ─────────────────────────────────────────
CREATE TABLE likes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type   VARCHAR(10) NOT NULL CHECK (entity_type IN ('review', 'comment', 'list')),
  entity_id     UUID NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

-- ─────────────────────────────────────────
-- LISTS
-- ─────────────────────────────────────────
CREATE TABLE lists (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  is_ranked     BOOLEAN DEFAULT FALSE,
  is_public     BOOLEAN DEFAULT TRUE,
  like_count    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LIST ITEMS
-- ─────────────────────────────────────────
CREATE TABLE list_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id       UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  entity_type   VARCHAR(10) NOT NULL CHECK (entity_type IN ('album', 'track')),
  entity_id     UUID NOT NULL,
  position      INT NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (list_id, entity_type, entity_id)
);

-- ─────────────────────────────────────────
-- USER FAVORITES
-- ─────────────────────────────────────────
CREATE TABLE user_favorites (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type   VARCHAR(10) NOT NULL CHECK (entity_type IN ('album', 'track', 'artist')),
  entity_id     UUID NOT NULL,
  position      INT NOT NULL CHECK (position BETWEEN 1 AND 4),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, entity_type, position)
);