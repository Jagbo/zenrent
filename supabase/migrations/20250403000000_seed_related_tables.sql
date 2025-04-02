-- Seed tenants
INSERT INTO public.tenants (
    id,
    user_id,
    name,
    email,
    phone,
    status,
    created_at,
    updated_at,
    metadata
) VALUES 
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '7a2e1487-f17b-4ceb-b6d1-56934589025b',
    'John Doe',
    'john.doe@example.com',
    '+44123456789',
    'active',
    NOW(),
    NOW(),
    jsonb_build_object('import_method', 'manual')
),
(
    'b5c67c9d-8f4e-4a1a-b251-8f8e1b91f92e',
    'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
    'Jane Smith',
    'jane.smith@example.com',
    '+44987654321',
    'active',
    NOW(),
    NOW(),
    jsonb_build_object('import_method', 'manual')
);

-- Seed leases
INSERT INTO public.leases (
    id,
    tenant_id,
    property_id,
    start_date,
    end_date,
    rent_amount,
    rent_frequency,
    deposit_amount,
    deposit_protection_scheme,
    status,
    created_at,
    updated_at
) VALUES 
(
    'e2a8f9c6-7d4b-4e5a-9f3c-1d2b8e7a9c4d',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '7a2e1487-f17b-4ceb-b6d1-56934589025b',
    '2024-01-01',
    '2024-12-31',
    1200.00,
    'monthly',
    1400.00,
    'DPS',
    'active',
    NOW(),
    NOW()
),
(
    'd1c4e7b8-9a2f-4d6e-8b3c-5a7d9e2f1b8a',
    'b5c67c9d-8f4e-4a1a-b251-8f8e1b91f92e',
    'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
    '2024-02-01',
    '2025-01-31',
    1500.00,
    'monthly',
    1750.00,
    'DPS',
    'active',
    NOW(),
    NOW()
);

-- Seed issues
INSERT INTO public.issues (
    id,
    title,
    description,
    property_id,
    status,
    priority,
    type,
    tenant_id,
    is_emergency,
    created_at,
    updated_at
) VALUES 
(
    'a1b2c3d4-e5f6-4a5b-9c8d-7e6f5a4b3c2d',
    'Leaking Faucet',
    'Kitchen sink faucet is dripping continuously',
    '7a2e1487-f17b-4ceb-b6d1-56934589025b',
    'Todo',
    'Medium',
    'Bug',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    false,
    NOW(),
    NOW()
),
(
    'b2c3d4e5-f6a7-4a5b-9c8d-7e6f5a4b3c2e',
    'Heating Issue',
    'Radiator in living room not heating properly',
    'bd8e3211-2403-47ac-9947-7a4842c5a4e3',
    'Todo',
    'High',
    'Bug',
    'b5c67c9d-8f4e-4a1a-b251-8f8e1b91f92e',
    true,
    NOW(),
    NOW()
),
(
    'c3d4e5f6-a7b8-4a5b-9c8d-7e6f5a4b3c2f',
    'Roof Inspection',
    'Regular maintenance check for roof condition',
    'dfe98af6-7b35-4eb1-a75d-b9cb279d86d8',
    'Todo',
    'Low',
    'Bug',
    NULL,
    false,
    NOW(),
    NOW()
); 