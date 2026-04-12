insert into public.question_cases (
  specialty,
  modality,
  difficulty,
  description,
  options,
  correct_answer,
  explanation,
  image_url,
  source_name,
  source_url,
  reviewer_name,
  review_status,
  is_active,
  metadata
)
values
  (
    '胸部',
    'X 光',
    'easy',
    '35岁男性，进行入职前筛查。无呼吸道症状。',
    '["肺炎", "正常胸部 X 光片", "心脏扩大", "胸腔积液"]'::jsonb,
    '正常胸部 X 光片',
    '肺野清晰，心脏轮廓大小正常（心胸比 <50%），肋膈角锐利。未见急性病变。',
    'https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg',
    'Wikipedia Commons',
    'https://upload.wikimedia.org/wikipedia/commons/a/a1/Normal_posteroanterior_%28PA%29_chest_radiograph_%28X-ray%29.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '神经',
    'MRI',
    'easy',
    '28岁女性，有偏头痛史。矢状面 T1 加权序列。',
    '["胶质母细胞瘤", "多发性硬化症", "正常脑部 MRI", "脑积水"]'::jsonb,
    '正常脑部 MRI',
    '包括胼胝体、脑干和小脑在内的正中矢状结构表现正常。未观察到占位效应或异常信号强度。',
    'https://upload.wikimedia.org/wikipedia/commons/5/5f/MRI_head_side.jpg',
    'Wikipedia Commons',
    'https://upload.wikimedia.org/wikipedia/commons/5/5f/MRI_head_side.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '病理',
    '组织病理学',
    'hard',
    '一名丙型肝炎肝硬化患者的肝活检，显示不规则的小梁结构。',
    '["肝脂肪变性", "肝细胞癌", "正常肝组织", "肝血管瘤"]'::jsonb,
    '肝细胞癌',
    '切片显示肝细胞小梁增厚（超过 3 个细胞厚）和细胞异型性，这是肝细胞癌 (HCC) 的特征。',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Hepatocellular_carcinoma_histopathology_%282%29.jpg/640px-Hepatocellular_carcinoma_histopathology_%282%29.jpg',
    'Wikipedia Commons',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Hepatocellular_carcinoma_histopathology_%282%29.jpg/640px-Hepatocellular_carcinoma_histopathology_%282%29.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '骨科',
    'X 光',
    'medium',
    '60岁女性，摔倒时手掌着地。腕部疼痛且畸形。',
    '["舟骨骨折", "Colles 骨折", "Smith 骨折", "Galeazzi 骨折"]'::jsonb,
    'Colles 骨折',
    '桡骨远端横行骨折，远端碎片向背侧移位，这是典型的 Colles 骨折。',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Colles_fracture.jpg/600px-Colles_fracture.jpg',
    'Wikipedia Commons',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Colles_fracture.jpg/600px-Colles_fracture.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '眼科',
    '眼底照相',
    'medium',
    '55岁糖尿病患者。眼底照相显示点状和斑块状出血。',
    '["青光眼", "糖尿病视网膜病变", "黄斑变性", "视网膜脱离"]'::jsonb,
    '糖尿病视网膜病变',
    '微动脉瘤、点状和斑块状出血以及硬性渗出的存在是非增殖性糖尿病视网膜病变的标志性体征。',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Diabetic_retinopathy.jpg/600px-Diabetic_retinopathy.jpg',
    'Wikipedia Commons',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Diabetic_retinopathy.jpg/600px-Diabetic_retinopathy.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '神经',
    'CT',
    'medium',
    '70岁男性，突然出现左侧肢体无力。头部平扫 CT。',
    '["蛛网膜下腔出血", "缺血性脑卒中 (MCA 区域)", "硬膜下血肿", "正常头部 CT"]'::jsonb,
    '缺血性脑卒中 (MCA 区域)',
    '右侧大脑中动脉 (MCA) 区域出现低密度影，灰白质分界模糊，符合急性缺血性脑卒中。',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/MCA_Territory_Infarct.jpg/600px-MCA_Territory_Infarct.jpg',
    'Wikipedia Commons',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/MCA_Territory_Infarct.jpg/600px-MCA_Territory_Infarct.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  );

insert into public.app_users (id, display_name, avatar_url, is_guest)
values
  ('00000000-0000-0000-0000-000000000101', '豪斯医生', '👨‍⚕️', false),
  ('00000000-0000-0000-0000-000000000102', '神经忍者', '🧠', false),
  ('00000000-0000-0000-0000-000000000103', '扫描大师', '🔬', false),
  ('00000000-0000-0000-0000-000000000104', '格蕾医生', '👩‍⚕️', false),
  ('00000000-0000-0000-0000-000000000105', '病理逻辑', '🧬', false)
on conflict (id) do nothing;

insert into public.daily_challenges (id, challenge_date, title, status)
values (
  '00000000-0000-0000-0000-000000000201',
  current_date,
  '今日医影挑战',
  'published'
)
on conflict (challenge_date) do nothing;

insert into public.daily_challenge_questions (challenge_id, question_id, order_index, points)
select
  '00000000-0000-0000-0000-000000000201',
  seeded_questions.id,
  seeded_questions.order_index,
  1000
from (
  select
    id,
    row_number() over (order by created_at asc) as order_index
  from public.question_cases
  where metadata ->> 'seed_tag' = 'initial_mock_seed'
  order by created_at asc
  limit 5
) as seeded_questions
on conflict (challenge_id, order_index) do nothing;

insert into public.daily_challenge_attempts (
  id,
  challenge_id,
  user_id,
  status,
  score,
  correct_count,
  total_questions,
  total_time_ms,
  submitted_at
)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'completed', 4700, 5, 5, 41000, now()),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', 'completed', 4500, 5, 5, 43800, now()),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000103', 'completed', 3900, 4, 5, 47200, now()),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000104', 'completed', 3200, 4, 5, 52000, now()),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000105', 'completed', 2500, 3, 5, 61000, now())
on conflict (challenge_id, user_id) do nothing;

insert into public.solo_runs (
  id,
  user_id,
  status,
  streak_count,
  correct_count,
  total_answered,
  total_time_ms,
  ended_reason,
  ended_at
)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', 'completed', 18, 18, 18, 128000, 'completed', now()),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000102', 'completed', 15, 15, 15, 116000, 'completed', now()),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000103', 'completed', 12, 12, 12, 99000, 'completed', now()),
  ('00000000-0000-0000-0000-000000000404', '00000000-0000-0000-0000-000000000104', 'completed', 10, 10, 10, 91000, 'completed', now()),
  ('00000000-0000-0000-0000-000000000405', '00000000-0000-0000-0000-000000000105', 'completed', 8, 8, 8, 85000, 'completed', now())
on conflict do nothing;
