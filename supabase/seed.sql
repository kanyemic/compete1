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
  ),
  (
    '胸部',
    'X 光',
    'medium',
    '24岁瘦高男性，突发胸痛伴气促。立位胸片可见右侧肺野透亮度增高。',
    '["大叶性肺炎", "胸腔积液", "自发性气胸", "肺水肿"]'::jsonb,
    '自发性气胸',
    '患侧胸膜线清晰、外周肺纹理消失，符合自发性气胸表现。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chest%20X-ray%20of%20pneumothorax.png',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Chest_X-ray_of_pneumothorax.png',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '胸部',
    'X 光',
    'easy',
    '61岁男性，发热、咳嗽 3 天。胸片见局灶性肺实变影。',
    '["肺炎", "正常胸片", "肺栓塞", "慢阻肺"]'::jsonb,
    '肺炎',
    '肺实变伴气支气管征倾向感染性浸润，最符合肺炎影像表现。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pneumonia_x-ray.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Pneumonia_x-ray.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '神经',
    'CT',
    'medium',
    '52岁女性，渐进性头痛。增强扫描见边界清楚、强化明显的硬膜外占位。',
    '["脑膜瘤", "脑梗死", "蛛网膜囊肿", "正常增强 CT"]'::jsonb,
    '脑膜瘤',
    '边界较清、明显强化且常与硬膜相连，是脑膜瘤的典型影像线索。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Contrast%20enhanced%20meningioma.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Contrast_enhanced_meningioma.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '神经',
    'CT',
    'medium',
    '76岁老人跌倒后意识模糊。平扫 CT 见新月形高密度影沿大脑半球表面分布。',
    '["脑内出血", "硬膜下血肿", "蛛网膜下腔出血", "脑梗死"]'::jsonb,
    '硬膜下血肿',
    '新月形、可跨越缝合线的高密度积血影是急性硬膜下血肿常见表现。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ct-scan%20of%20the%20brain%20with%20an%20subdural%20hematoma.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Ct-scan_of_the_brain_with_an_subdural_hematoma.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '消化',
    '超声',
    'medium',
    '19岁男性，右下腹痛伴反跳痛。超声见盲端管状结构增粗、不可压缩。',
    '["肠套叠", "急性阑尾炎", "克罗恩病", "正常阑尾"]'::jsonb,
    '急性阑尾炎',
    '增粗、不可压缩的阑尾并伴周围炎性改变，是急性阑尾炎的关键超声表现。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Appendicitis%20ultrasound.png',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Appendicitis_ultrasound.png',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '消化',
    '超声',
    'medium',
    '47岁女性，右上腹绞痛。超声见胆囊颈部强回声并伴后方声影。',
    '["胆囊息肉", "胆囊结石并胆囊炎倾向", "肝囊肿", "胆总管囊肿"]'::jsonb,
    '胆囊结石并胆囊炎倾向',
    '结石强回声伴声影，若合并胆囊壁增厚则提示急性胆囊炎可能。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gallstones.PNG',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Gallstones.PNG',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '消化',
    '超声',
    'hard',
    '66岁男性，黄疸。胆道超声见扩张胆管内强回声灶，后方伴声影。',
    '["胆总管结石", "肝门胆管癌", "胰头癌", "门静脉血栓"]'::jsonb,
    '胆总管结石',
    '胆管内强回声伴声影，且用多普勒可与血管结构区分，符合胆总管结石。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ultrasonography%20of%20common%20bile%20duct%20stone%2C%20with%20arrow.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Ultrasonography_of_common_bile_duct_stone,_with_arrow.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '妇科',
    '超声',
    'easy',
    '32岁女性，体检发现附件区囊性包块。超声示边界清楚的囊性病灶。',
    '["异位妊娠", "良性卵巢囊肿", "卵巢扭转", "卵巢恶性肿瘤"]'::jsonb,
    '良性卵巢囊肿',
    '边界清楚、以液性回声为主的附件区囊性病灶更支持良性卵巢囊肿。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Benign%20Ovarian%20Cyst.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Benign_Ovarian_Cyst.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '妇科',
    '超声',
    'medium',
    '26岁女性，月经稀发。超声见卵巢体积增大，周边分布多个小卵泡。',
    '["正常卵巢", "黄体囊肿", "多囊卵巢改变", "卵巢巧克力囊肿"]'::jsonb,
    '多囊卵巢改变',
    '卵巢周边多发小卵泡、呈“项链征”分布时，要考虑多囊卵巢改变。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/PCOS.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:PCOS.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '乳腺',
    '钼靶',
    'medium',
    '58岁女性，筛查性乳腺摄影发现一侧局灶性高密度异常影。',
    '["乳腺癌倾向", "单纯乳腺增生", "乳房脂肪坏死", "正常乳腺钼靶"]'::jsonb,
    '乳腺癌倾向',
    '乳腺摄影中局灶性异常高密度灶、结构扭曲或可疑钙化要警惕恶性病变。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mammo%20breast%20cancer.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Mammo_breast_cancer.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '骨科',
    'X 光',
    'medium',
    '69岁女性跌倒后肩部疼痛，活动明显受限。X 光见肱骨近端骨折。',
    '["肩关节脱位", "肱骨近端骨折", "锁骨骨折", "正常肩关节 X 光"]'::jsonb,
    '肱骨近端骨折',
    '肱骨头邻近可见明确骨皮质连续性中断和骨折线，符合肱骨近端骨折。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Humerus%20fracture%201300272.JPG',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Humerus_fracture_1300272.JPG',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '骨科',
    'X 光',
    'easy',
    '63岁男性，慢性膝痛。X 光见关节间隙变窄并伴边缘骨赘形成。',
    '["类风湿关节炎", "膝骨关节炎", "化脓性关节炎", "正常膝关节 X 光"]'::jsonb,
    '膝骨关节炎',
    '关节间隙狭窄、软骨下硬化和边缘骨赘是骨关节炎的典型影像学表现。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Osteoarthritis%20of%20the%20knee.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Osteoarthritis_of_the_knee.jpg',
    '内容初审组',
    'approved',
    true,
    '{"seed_tag":"initial_mock_seed"}'::jsonb
  ),
  (
    '病理',
    '组织病理学',
    'hard',
    '肾脏肿瘤切片可见透明胞浆细胞成巢状排列，间质血管丰富。',
    '["肾透明细胞癌", "肾嗜酸细胞瘤", "肾盂尿路上皮癌", "正常肾组织"]'::jsonb,
    '肾透明细胞癌',
    '透明胞浆、丰富毛细血管网和巢状结构是肾透明细胞癌常见病理表现。',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Histopathology%20of%20renal%20clear%20cell%20carcinoma.jpg',
    'Wikimedia Commons',
    'https://commons.wikimedia.org/wiki/File:Histopathology_of_renal_clear_cell_carcinoma.jpg',
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
