-- Migration 002: Create trips table with Row Level Security
-- Destination: Supabase PostgreSQL
-- Description: Stores saved itineraries and trip details associated with authenticated users.

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    destination VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days >= 1 AND duration_days <= 30),
    budget NUMERIC(12, 2) NOT NULL CHECK (budget > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    travellers INTEGER NOT NULL CHECK (travellers >= 1 AND travellers <= 50),
    travel_style VARCHAR(50) NOT NULL,
    starting_city VARCHAR(100),
    travel_preferences JSONB DEFAULT '{}'::jsonb,
    itinerary_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'completed', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);

-- 3. Attach updated_at trigger
DROP TRIGGER IF EXISTS trigger_trips_updated_at ON public.trips;
CREATE TRIGGER trigger_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view their own trips"
    ON public.trips
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trips"
    ON public.trips
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips"
    ON public.trips
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trips"
    ON public.trips
    FOR DELETE
    USING (auth.uid() = user_id);

