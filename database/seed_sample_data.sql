-- LogicForge Sample Data for Manual Testing
-- This script inserts sample users, programs, and related data.

-- 1. Insert a Test User (linked to the generic 'LogicForge Demo' org)
-- NOTE: In production, users are created via Supabase Auth.
-- This manual insert is only for local testing if Supabase isn't connected,
-- OR to ensure the DB has a user record matching a potential Supabase ID.
-- We will use a placeholder UUID for the user.

DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_program_id UUID;
    v_model_id UUID;
BEGIN
    -- Get the default organization ID
    SELECT id INTO v_org_id FROM organizations WHERE name = 'LogicForge Demo' LIMIT 1;

    -- Create 'Demo User' if not exists
    INSERT INTO users (email, full_name, role, organization_id)
    VALUES ('demo@logicforge.ai', 'Demo User', 'program_manager', v_org_id)
    ON CONFLICT (email) DO UPDATE SET full_name = 'Demo User'
    RETURNING id INTO v_user_id;

    RAISE NOTICE 'User ID: %', v_user_id;

    -- 2. Create a Sample Program: "FLN Improvement Initiative"
    INSERT INTO programs (user_id, organization_id, title, description, status, current_step)
    VALUES (
        v_user_id,
        v_org_id,
        'Foundational Literacy & Numeracy Boost',
        'A comprehensive program to improve reading and math skills for Grades 1-3 in rural districts.',
        'in_progress',
        3
    )
    RETURNING id INTO v_program_id;

    RAISE NOTICE 'Program ID: %', v_program_id;

    -- 3. Step 1: Problem Statement
    INSERT INTO problem_statements (program_id, challenge_text, refined_text, theme, is_completed)
    VALUES (
        v_program_id,
        'Students in rural areas are falling behind in reading skills.',
        'Grade 3 students in 50 target rural schools show 40% deficit in reading fluency compared to state averages due to lack of age-appropriate reading materials and untrained teachers.',
        'FLN',
        TRUE
    );

    -- 4. Step 2: Stakeholders
    INSERT INTO stakeholders (program_id, name, role, engagement_strategy, priority) VALUES
    (v_program_id, 'District Education Officer', 'Decision Maker', 'Monthly progress reviews and alignment meetings.', 'high'),
    (v_program_id, 'School Headmasters', 'Implementer', 'Weekly monitoring and resource distribution.', 'high'),
    (v_program_id, 'Parents', 'Beneficiary', 'Community reading melas and SMS updates.', 'medium');

    -- 5. Step 3: Proven Models (Linking 'Teaching at the Right Level')
    SELECT id INTO v_model_id FROM proven_models WHERE name = 'Teaching at the Right Level (TaRL)' LIMIT 1;

    IF v_model_id IS NOT NULL THEN
        INSERT INTO program_proven_models (program_id, proven_model_id, notes)
        VALUES (v_program_id, v_model_id, 'We will adapt the TaRL grouping strategy for our after-school sessions.');
    END IF;

    -- 6. Step 4: Outcomes & Indicators
    WITH new_outcome AS (
        INSERT INTO outcomes (program_id, description, theme, timeframe)
        VALUES (v_program_id, 'Improved Reading Fluency', 'FLN', '12 months')
        RETURNING id
    )
    INSERT INTO indicators (outcome_id, type, description, measurement_method, target_value, baseline_value, frequency)
    SELECT
        id,
        'outcome',
        '% of students able to read Grade 2 text',
        'ASER Tool Assessment',
        '70%',
        '30%',
        'Quarterly'
    FROM new_outcome;

    RAISE NOTICE 'Sample data inserted successfully!';
END $$;
