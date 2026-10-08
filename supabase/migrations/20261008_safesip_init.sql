-- SafeSip Production PostgreSQL / PostGIS Database Schema
-- Optimized for Supabase Auth, Row Level Security, and High Performance Geospatial Queries

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Users Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Hardware Devices Table (ESP32 SafeSip Smart Bottles)
CREATE TABLE IF NOT EXISTS public.devices (
    id TEXT PRIMARY KEY, -- e.g. "SafeSip_0012"
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    mac_address TEXT NOT NULL UNIQUE,
    firmware_version TEXT DEFAULT 'v2.1.0-esp32',
    battery_level INT DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Water Sources Table (Community Mapped Natural and Municipal Points)
CREATE TABLE IF NOT EXISTS public.water_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location_name TEXT NOT NULL,
    -- PostGIS Point Geometry: Longitude, Latitude (WGS84 SRID 4326)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    safety_status TEXT NOT NULL CHECK (safety_status IN ('SAFE', 'CAUTION', 'UNSAFE', 'UNVERIFIED')),
    latest_ph NUMERIC(4,2),
    latest_tds INT,
    latest_conductivity INT,
    latest_turbidity NUMERIC(4,2),
    latest_temperature NUMERIC(4,2),
    last_tested_at TIMESTAMPTZ DEFAULT NOW(),
    test_count INT DEFAULT 1,
    image_url TEXT,
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial GIST Index for high speed community map radius bounding-box queries
CREATE INDEX IF NOT EXISTS idx_water_sources_location ON public.water_sources USING GIST (location);

-- 5. Water Tests Table (Physicochemical readings uploaded by SafeSip bottles)
CREATE TABLE IF NOT EXISTS public.water_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT REFERENCES public.devices(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    source_id UUID REFERENCES public.water_sources(id) ON DELETE SET NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    location_name TEXT,
    ph NUMERIC(4,2) NOT NULL,
    tds INT NOT NULL,
    conductivity INT NOT NULL,
    turbidity NUMERIC(4,2) NOT NULL,
    temperature NUMERIC(4,2) NOT NULL,
    safety_status TEXT NOT NULL CHECK (safety_status IN ('SAFE', 'CAUTION', 'UNSAFE')),
    measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_tests_user_id ON public.water_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_water_tests_source_id ON public.water_tests(source_id);
CREATE INDEX IF NOT EXISTS idx_water_tests_measured_at ON public.water_tests(measured_at DESC);

-- 6. Community Auto-Update Trigger
-- Automatically updates latest reading and safety status on water_sources when a new test is logged
CREATE OR REPLACE FUNCTION update_water_source_on_test_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.source_id IS NOT NULL THEN
        UPDATE public.water_sources
        SET 
            latest_ph = NEW.ph,
            latest_tds = NEW.tds,
            latest_conductivity = NEW.conductivity,
            latest_turbidity = NEW.turbidity,
            latest_temperature = NEW.temperature,
            safety_status = NEW.safety_status,
            last_tested_at = NEW.measured_at,
            test_count = test_count + 1
        WHERE id = NEW.source_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_water_test_inserted
AFTER INSERT ON public.water_tests
FOR EACH ROW EXECUTE FUNCTION update_water_source_on_test_insert();

-- 7. View for Dynamic 30-Day Expiration Verification
CREATE OR REPLACE VIEW public.community_water_sources_view AS
SELECT 
    id,
    name,
    location_name,
    ST_Y(location::geometry) AS latitude,
    ST_X(location::geometry) AS longitude,
    CASE 
        WHEN last_tested_at < NOW() - INTERVAL '30 days' THEN 'UNVERIFIED'
        ELSE safety_status
    END AS current_safety_status,
    latest_ph,
    latest_tds,
    latest_conductivity,
    latest_turbidity,
    latest_temperature,
    last_tested_at,
    test_count,
    image_url,
    description
FROM public.water_sources;

-- 8. Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_tests ENABLE ROW LEVEL SECURITY;

-- Public can read water sources for the community map
CREATE POLICY "Allow public read access to community water sources"
    ON public.water_sources FOR SELECT
    USING (true);

-- Authenticated users can insert water sources
CREATE POLICY "Allow authenticated users to create water sources"
    ON public.water_sources FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can read and insert their tests
CREATE POLICY "Allow users to view own tests or public tests"
    ON public.water_tests FOR SELECT
    USING (auth.uid() = user_id OR true);

CREATE POLICY "Allow authenticated users to log water tests"
    ON public.water_tests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Device management
CREATE POLICY "Allow users to manage own paired devices"
    ON public.devices FOR ALL
    USING (auth.uid() = user_id);
