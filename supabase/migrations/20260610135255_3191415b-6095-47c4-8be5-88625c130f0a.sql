
-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'attendant' CHECK (role IN ('attendant','manager')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth users update profiles" ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth users insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

-- CUSTOMERS
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text UNIQUE,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EQUIPMENTS
CREATE TABLE public.equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('computer','console')),
  specs text,
  hourly_rate numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free','in_use','maintenance')),
  last_maintenance timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipments TO authenticated;
GRANT ALL ON public.equipments TO service_role;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users equipments" ON public.equipments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SESSIONS
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid NOT NULL REFERENCES public.equipments,
  equipment_name text,
  equipment_type text,
  customer_id uuid REFERENCES public.customers,
  customer_name text,
  attendant_id uuid NOT NULL REFERENCES public.profiles,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  ended_at timestamptz,
  duration_minutes int NOT NULL,
  hourly_rate numeric(10,2),
  value numeric(10,2) NOT NULL,
  discount numeric(5,2) NOT NULL DEFAULT 0,
  payment_method text CHECK (payment_method IN ('cash','pix','credit','debit')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','finished','cancelled'))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users sessions" ON public.sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- WAITING LIST
CREATE TABLE public.waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers,
  customer_name text,
  entered_at timestamptz NOT NULL DEFAULT now(),
  position int NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waiting_list TO authenticated;
GRANT ALL ON public.waiting_list TO service_role;
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users waiting_list" ON public.waiting_list FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto criar profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendant'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.equipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.waiting_list;

ALTER TABLE public.equipments REPLICA IDENTITY FULL;
ALTER TABLE public.sessions REPLICA IDENTITY FULL;
ALTER TABLE public.customers REPLICA IDENTITY FULL;
ALTER TABLE public.waiting_list REPLICA IDENTITY FULL;

-- Seed equipamentos
INSERT INTO public.equipments (name, type, specs, hourly_rate) VALUES
  ('PC-01','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-02','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-03','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-04','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-05','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-06','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-07','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-08','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-09','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PC-10','computer','Ryzen 5 / 16GB RAM / SSD',5.00),
  ('PS5-01','console','PlayStation 5',3.00),
  ('PS5-02','console','PlayStation 5',3.00),
  ('XBOX-01','console','Xbox Series S',3.00),
  ('XBOX-02','console','Xbox Series S',3.00);

-- Seed clientes
INSERT INTO public.customers (name, cpf, phone, email) VALUES
  ('João Silva','12345678901','11987654321','joao@example.com'),
  ('Maria Souza','23456789012','11976543210','maria@example.com'),
  ('Pedro Santos','34567890123','11965432109','pedro@example.com'),
  ('Ana Oliveira','45678901234','11954321098','ana@example.com'),
  ('Carlos Lima','56789012345','11943210987','carlos@example.com');
