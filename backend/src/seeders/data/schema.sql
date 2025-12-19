-- Tables
CREATE TABLE IF NOT EXISTS species
(
    id                  UUID                        DEFAULT uuidv7() PRIMARY KEY,
    species             VARCHAR(100)                              NOT NULL,
    name                VARCHAR(100),
    group_species       VARCHAR(100),
    description         TEXT,
    characteristic      TEXT,
    habitas             TEXT,
    impact              TEXT,
    threatened_symbol   VARCHAR(100),                                       -- Enum
    vn_distribution     TEXT,
    global_distribution TEXT,
    phylum              VARCHAR(100),
    class               VARCHAR(100),
    order_species       varchar(100),
    family              VARCHAR(100),
    genus               VARCHAR(100),
    references_text     TEXT,
    created_at          TIMESTAMP(3) WITH TIME ZONE DEFAULT NOW() NOT NULL, -- 3 decimal numbers
    updated_at          TIMESTAMP(3) WITH TIME ZONE DEFAULT NOW() NOT NULL  -- 3 decimal numbers
);

CREATE TABLE IF NOT EXISTS images
(
    public_id  VARCHAR(100) PRIMARY KEY,
    species_id UUID NOT NULL REFERENCES species (id) ON DELETE CASCADE,
    image_url  TEXT NOT NULL,
    is_cover   BOOLEAN DEFAULT FALSE
);

CREATE TABLE points
(
    id         UUID DEFAULT uuidv7() PRIMARY KEY,
    species_id UUID  NOT NULL REFERENCES species (id) ON DELETE CASCADE,
    lat        FLOAT NOT NULL,
    lng        FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin
(
    username VARCHAR(100) NOT NULL UNIQUE PRIMARY KEY,
    password VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS blacklisted_tokens
(
    token           VARCHAR(200) PRIMARY KEY,
    expiration_time TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX idx_species_scientific_name ON species (species);
CREATE INDEX idx_species_name ON species (name);
CREATE INDEX idx_images_species_id ON images (species_id);
CREATE INDEX idx_points_species_id ON points (species_id);

-- Triggers for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_species_updated_at
    BEFORE UPDATE
    ON species
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();