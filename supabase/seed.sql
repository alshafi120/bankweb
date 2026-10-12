-- ==============================================================================
-- Withaq / Al Salam Capital Bank - Supabase Initial Seed Data
-- ==============================================================================

-- 1. Seed Cards (البطاقات المصرفية)
INSERT INTO public.cards (slug, name_ar, name_en, summary_ar, summary_en, network, tone, image_url, features_ar, features_en, fees_ar, fees_en, position)
VALUES
(
    'debit',
    'بطاقة الخصم المباشر',
    'Debit Card',
    'مرتبطة بحسابك مباشرة للسحب والشراء والدفع الذكي.',
    'Linked directly to your account for cash withdrawals and purchases.',
    'Visa',
    'jade',
    '/demo/img/card_debit.jpg',
    '["سحب مجاني من كافة صرافات البنك", "دفع لاتلامسي NFC", "إدارة البطاقة وتجميدها عبر تطبيق السلام موبايلي", "إشعار فوري عبر الرسائل"]'::jsonb,
    '["Free withdrawals at our ATMs", "Contactless NFC payments", "Freeze card instantly via Salam Mobile", "Instant SMS alerts"]'::jsonb,
    'الإصدار مجاني · التجديد 3,000 ر.ي سنوياً',
    'Free issuance · YER 3,000 annual renewal',
    1
),
(
    'prepaid',
    'بطاقة مسبقة الدفع',
    'Prepaid Card',
    'اشحنها بالمبلغ الذي تريده وتحكّم بإنفاقك وتسوّق بأمان.',
    'Top up what you need and control spending for safe online shopping.',
    'Mastercard',
    'lapis',
    '/demo/img/card_prepaid.jpg',
    '["لا تتطلب فتح حساب بنكي مسبق", "مثالية للتسوق عبر الإنترنت والاشتراكات", "شحن فوري من المحفظة أو الوكلاء"]'::jsonb,
    '["No bank account required", "Ideal for online purchases and subscriptions", "Instant top-ups from agents or wallet"]'::jsonb,
    'الإصدار 2,000 ر.ي · الشحن مجاني من التطبيق',
    'YER 2,000 issuance · free top-ups from app',
    2
),
(
    'credit',
    'البطاقة الائتمانية',
    'Credit Card',
    'سقف ائتماني متوافق مع أحكام الشريعة مع مزايا سفر راقية.',
    'Sharia-compliant credit limit with premium travel and lounge benefits.',
    'Visa',
    'saffron',
    '/demo/img/card_credit.jpg',
    '["سقف حتى 3 أضعاف الراتب", "تأمين سفر تكافلي مجاني", "دخول صالات كبار الشخصيات بالمطارات", "بدون فوائد ربوية على الرصيد"]'::jsonb,
    '["Limit up to 3x salary", "Free takaful travel insurance", "Airport lounge access", "Zero interest on balance"]'::jsonb,
    'رسم شهري رمزي ثابت · لا فوائد على الرصيد',
    'Fixed monthly fee · zero interest',
    3
),
(
    'business-card',
    'بطاقة الشركات',
    'Business Card',
    'إدارة مصاريف المؤسسات والموظفين بسقوف مخصصة وتقارير دقيقة.',
    'Corporate expense management with customized per-employee limits.',
    'Mastercard',
    'graphite',
    '/demo/img/card_business.jpg',
    '["تحديد سقف إنفاق لكل موظف", "تقارير وتحليلات مصاريف دورية", "إيقاف وتفعيل فوري من لوحة التحكم"]'::jsonb,
    '["Custom limit per employee", "Detailed expense reporting", "Instant control from company portal"]'::jsonb,
    '5,000 ر.ي لكل بطاقة سنوياً',
    'YER 5,000 per card per year',
    4
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed Services (الخدمات الرقمية والمصرفية)
INSERT INTO public.services (slug, icon, title_ar, title_en, summary_ar, summary_en, href, position)
VALUES
('salam-mobile', 'mobile', 'السلام موبايلي', 'Salam Mobile', 'تطبيقك المصرفي الذكي لإدارة الحسابات وتنفيذ المعاملات بسهولة على مدار الساعة.', 'Smart banking app to manage accounts and transactions 24/7.', '/digital#mobile', 1),
('salam-wallet', 'wallet', 'سلام Wallet', 'Salam Wallet', 'محفظتك الرقمية الذكية تعمل أونلاين وأوفلاين لإرسال واستقبال الأموال.', 'Smart digital wallet working online and offline.', '/digital#wallet', 2),
('salam-cash', 'transfer', 'سلام كاش', 'Salam Cash', 'شبكة التحويلات المحلية الموثوقة والربط المباشر مع الشبكة الموحدة UNMoney.', 'Local remittance network with unified national UNMoney integration.', '/transfers', 3),
('salam-pay', 'qr', 'سلام باي', 'Salam Pay', 'حلول دفع ذكية بتقنية رمز الاستجابة السريع QR لدى المتاجر والشركاء.', 'Smart QR code payment solutions for merchants and customers.', '/digital#pay', 4),
('salam-sadad', 'payment', 'سلام سداد', 'Salam Sadad', 'سداد فواتير الاتصالات، الإنترنت، الكهرباء، والمياه فورياً.', 'Instant utility and telecom bill payments directly from your phone.', '/digital#sadad', 5),
('salam-money', 'digital', 'سلام موني', 'Salam Money', 'السحب النقدي من أجهزة الصراف الآلي بكل سهولة وبدون الحاجة لبطاقة.', 'Cardless cash withdrawal from ATMs.', '/digital#money', 6)
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed Sample Todos (لتجربة الربط الفوري لصفحة الاختبار)
INSERT INTO public.todos (name, is_complete)
VALUES
('ربط مشروع بنك السلام كابيتال مع Supabase بنجاح', true),
('إطلاق تطبيق السلام موبايلي ومحفظة سلام Wallet', true),
('تفعيل بوابات الدفع الإلكتروني والـ QR', false)
ON CONFLICT DO NOTHING;
