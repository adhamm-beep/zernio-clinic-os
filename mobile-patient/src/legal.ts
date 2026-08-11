export type LegalLanguage="ar"|"en";

export const legalVersion="2026-08-09.2";

export const privacySections={
  en:[
    ["Who we are","Panthera Clinics provides clinical, aesthetic, booking, payment and patient-support services. This notice applies to the Panthera Patient application."],
    ["Data we collect","We process identity and contact details, verified mobile number, appointments, treatments, medical records, allergies, medicines, invoices and payments, consent records, support messages, device and push token information, and progress photos only when authorized."],
    ["Why we use it","We use data to create and secure your account, provide care, manage bookings and payments, send care notifications, maintain legally required clinical records, improve service quality, prevent fraud and comply with applicable law."],
    ["Sharing and processors","Access is limited to authorized Panthera staff and contracted technology providers needed to operate authentication, hosting, notifications and payments. We do not sell patient data. Medical text and patient identity are not sent to the clinic's AI service."],
    ["Storage and security","Data is protected using access controls, tenant isolation, row-level security, encrypted transport, audit records and private media storage. Retention follows clinical, financial and legal requirements; data no longer required is securely deleted or anonymized."],
    ["Your private progress photos","Progress photos you choose to capture and upload yourself are stored in a private area intended for your account only and are not shown to reception or general staff. Authorized technical access may occur only when strictly required for security, support, a legal obligation or at your documented request. Clinical records and care-team images are separate and may be accessed only by authorized healthcare professionals when needed to provide safe care."],
    ["Your rights","Subject to applicable Saudi law, you may request information, access, a readable copy, correction, completion, updating or destruction of personal data when legally permitted, and may withdraw optional consent without affecting prior lawful processing."],
    ["Account deletion","You can initiate deletion from Privacy & account inside the app. We disable app access and process deletion while retaining only records that Panthera must keep for healthcare, financial, legal or dispute purposes."],
    ["Contact and complaints","Submit a privacy request from the app or contact Panthera Clinics through the Support page. You may also use the complaint channels provided by the competent Saudi data-protection authority."],
  ],
  ar:[
    ["من نحن","تقدم عيادات بانثيرا خدمات الرعاية والإجراءات التجميلية والحجز والدفع ودعم المرضى. ينطبق هذا الإشعار على تطبيق مريض بانثيرا."],
    ["البيانات التي نجمعها","نعالج بيانات الهوية والتواصل ورقم الجوال المتحقق منه والمواعيد والإجراءات والسجلات الطبية والحساسيات والأدوية والفواتير والمدفوعات والموافقات ورسائل الدعم وبيانات الجهاز ورمز الإشعارات وصور متابعة النتائج عند وجود موافقة."],
    ["أغراض الاستخدام","نستخدم البيانات لإنشاء الحساب وحمايته، وتقديم الرعاية، وإدارة الحجوزات والمدفوعات، وإرسال تنبيهات العناية، وحفظ السجلات الطبية المطلوبة نظامًا، وتحسين الجودة، ومنع الاحتيال، والالتزام بالأنظمة."],
    ["المشاركة ومقدمو الخدمة","يقتصر الوصول على موظفي بانثيرا المصرح لهم ومقدمي التقنية المتعاقد معهم واللازمين للتشغيل والاستضافة والتحقق والإشعارات والمدفوعات. لا نبيع بيانات المرضى، ولا نرسل النصوص الطبية أو هوية المريض إلى خدمة الذكاء الاصطناعي الخاصة بالعيادة."],
    ["الحفظ والحماية","تُحمى البيانات بصلاحيات الوصول وعزل العيادات وسياسات مستوى الصف والاتصال المشفر وسجلات التدقيق والتخزين الخاص للصور. تحدد مدة الحفظ وفق المتطلبات الطبية والمالية والنظامية، ثم تُتلف أو تُخفى هوية البيانات التي لم تعد لازمة بأمان."],
    ["صور المتابعة الخاصة بك","تُحفظ صور المتابعة التي تختارين تصويرها ورفعها بنفسك في مساحة خاصة مخصصة لحسابك، ولا تظهر لموظفي الاستقبال أو الموظفين العامين. ولا يحدث وصول تقني مخوّل إليها إلا عند الضرورة القصوى للأمان أو الدعم أو تنفيذ التزام نظامي أو بناءً على طلب موثق منك. أما السجل الطبي والصور التي ينشئها فريق الرعاية فهي منفصلة، ولا يصل إليها إلا الممارس الصحي المخوّل عند الحاجة لتقديم رعاية آمنة."],
    ["حقوقك","وفق الأنظمة السعودية المطبقة، يمكنك طلب العلم بالمعالجة والوصول إلى بياناتك والحصول عليها بصيغة واضحة وطلب تصحيحها أو إكمالها أو تحديثها أو إتلافها عندما يسمح النظام، وسحب الموافقات الاختيارية دون التأثير في المعالجة السابقة المشروعة."],
    ["حذف الحساب","يمكنك بدء طلب حذف الحساب من مركز الخصوصية والحساب داخل التطبيق. نوقف وصول التطبيق ونعالج الطلب، مع الاحتفاظ فقط بالسجلات التي يجب حفظها لأغراض صحية أو مالية أو نظامية أو لتسوية النزاعات."],
    ["التواصل والشكاوى","أرسل طلب خصوصية من داخل التطبيق أو تواصل مع عيادات بانثيرا من صفحة الدعم. ويمكنك استخدام قنوات الشكاوى لدى الجهة السعودية المختصة بحماية البيانات الشخصية."],
  ]
} as const;

export const termsSections={
  en:[
    ["Using the app","The app supports account access, booking, payments, notifications and viewing your Panthera care information. Keep your phone and verification codes secure and provide accurate information."],
    ["Not emergency care","The app is not an emergency service and does not replace medical assessment. For urgent symptoms, contact the appropriate emergency service immediately."],
    ["Bookings and payments","A request is not final until confirmed by Panthera. Prices shown for fixed services may change before confirmation where legally permitted. Doctor consultation fees are deducted from the related procedure according to the clinic's stated policy."],
    ["Medical decisions","Automated summaries and recommendations are operational support only. Diagnosis, eligibility, products, quantities and treatment decisions are made by qualified clinicians."],
    ["Intellectual property","The Panthera name, logos, application design, content and software are owned by or licensed to Panthera Clinics and may not be copied, modified, redistributed or commercially used without written permission."],
    ["Availability and updates","We work to keep the service reliable and secure, but maintenance, connectivity or third-party services may cause interruptions. Material changes to these terms or the privacy notice will be presented for renewed acceptance."],
  ],
  ar:[
    ["استخدام التطبيق","يدعم التطبيق الدخول إلى الحساب والحجز والمدفوعات والإشعارات وعرض معلومات رحلة العناية في بانثيرا. حافظ على أمان هاتفك ورموز التحقق وقدّم معلومات صحيحة."],
    ["ليس لخدمات الطوارئ","التطبيق ليس خدمة طوارئ ولا يغني عن التقييم الطبي. عند وجود أعراض عاجلة تواصل فورًا مع خدمة الطوارئ المناسبة."],
    ["الحجوزات والمدفوعات","لا يصبح طلب الموعد نهائيًا قبل تأكيده من بانثيرا. قد تتغير أسعار الخدمات الثابتة قبل التأكيد عندما يسمح النظام. وتُخصم رسوم استشارة الطبيبة من الإجراء المرتبط وفق سياسة العيادة المعلنة."],
    ["القرارات الطبية","الملخصات والتوصيات الآلية أدوات دعم تشغيلية فقط. التشخيص والملاءمة والمواد والكميات والقرارات العلاجية يحددها الممارس الصحي المؤهل."],
    ["حقوق الملكية الفكرية","اسم بانثيرا وشعاراتها وتصميم التطبيق والمحتوى والبرمجيات مملوكة أو مرخصة لعيادات بانثيرا، ولا يجوز نسخها أو تعديلها أو إعادة توزيعها أو استخدامها تجاريًا دون إذن كتابي."],
    ["التوفر والتحديثات","نعمل على موثوقية الخدمة وأمانها، وقد تحدث انقطاعات بسبب الصيانة أو الاتصال أو خدمات الأطراف الأخرى. ستُعرض التغييرات الجوهرية في الشروط أو سياسة الخصوصية للحصول على موافقة جديدة."],
  ]
} as const;
