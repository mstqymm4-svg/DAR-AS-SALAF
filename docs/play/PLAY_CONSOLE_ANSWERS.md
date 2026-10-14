# Google Play Console answers (based on the actual code, Android build)

Verified facts:
- Base44 setting `public_without_login` means no sign-in is needed.
- Base44 analytics are disabled in the Android build (`VITE_BASE44_ANALYTICS=false`).
- Favourites, progress and offline books are stored in IndexedDB/localStorage on the device only.
- The only data sent to the developer is the Contact form (name, email, message) → Base44 function `sendContactMessage`.
- The only permission is INTERNET. There are no ads SDKs.

## Data safety
| Question | Answer |
|---|---|
| Does your app collect or share any required user data types? | **Yes** |
| Is all user data encrypted in transit? | **Yes** (HTTPS only) |
| Do you provide a way for users to request deletion? | **Yes**: by email (see privacy policy) |
| **Personal info → Name** | Collected, not shared. Optional. Purpose: **Developer communications** |
| **Personal info → Email address** | Collected, not shared. Optional. Purpose: **Developer communications** |
| **Messages → Other in-app messages** | Collected, not shared. Optional. Purpose: **Developer communications** |
| Processed ephemerally? | No |
| Location, financial, health, contacts, photos, files, app activity, device IDs | **Not collected** |

## App content declarations
- **Privacy policy URL:** host `PRIVACY_POLICY.md` as a public web page, for example on the existing Vercel site, then paste the link. This needs your approval because it changes the live site. A free GitHub Gist or Google Sites page also works.
- **App access:** "All functionality is available without special access".
- **Ads:** No.
- **Account deletion:** not applicable. The app has no user account creation. If Play still asks, answer that the app does not allow account creation.
- **Content rating (IARC):** Reference / education. No violence, sexual content, gambling or user-to-user interaction. Expected rating: Everyone / PEGI 3.
- **Target audience:** 13+ (choosing under 13 triggers the Families policy).
- **News app:** No. **Government app:** No. **Financial features:** None. **Health:** No.
- **Data deletion URL:** optional. Use the privacy policy link.
- **Category:** Books & Reference.

## Store listing
**App name:** دار العلوم - Dar ul Uloom

**Short description (AR, ≤80):** مكتبة إسلامية رقمية: كتب PDF ودروس مرئية وقراءة دون اتصال
**Short description (EN, ≤80):** Islamic digital library: PDF books, video lessons and offline reading

**Full description (AR):**
دار العلوم مكتبة إسلامية رقمية تجمع لك الكتب والدروس في مكان واحد، بواجهة عربية سهلة.
• تصفح الكتب حسب التصنيف والمؤلف واللغة
• قارئ PDF مريح مع حفظ موضع القراءة تلقائيًا
• احفظ الكتب للقراءة دون اتصال بالإنترنت
• أضف كتبك المفضلة للوصول السريع
• شاهد الدروس والقنوات والبث المباشر عبر YouTube
• يُضاف محتوى جديد باستمرار دون الحاجة لتحديث التطبيق
• بدون إعلانات وبدون تسجيل دخول

**Full description (EN):**
Dar-ul-Uloom is an Islamic digital library that brings books and lessons together in one simple, Arabic-first app.
• Browse books by category, author and language
• Comfortable PDF reader that remembers your page
• Save books for offline reading
• Keep your favourite books one tap away
• Watch lessons, channels and live streams via YouTube
• New content is added regularly, with no app update needed
• No ads, no sign-in required

**Graphics still needed from you:**
- 512×512 icon (`assets/logo.jpg` can be used)
- 1024×500 feature graphic
- at least 2 phone screenshots
