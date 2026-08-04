# ⚡ PayRoute Financial Engine & Utility Billing Architecture

> **An Enterprise-Grade Full-Stack Fintech Platform featuring Electricity Bill Payments (NESCO, DESCO, DPDC, BREB), Firebase Firestore Database, Gemini AI Anomaly Detection, Open Banking API, Passport Virtual Cards, and Google Workspace Gmail Integration.**

---

<p align="center">
  <img src="/payroute_banner.jpg" alt="PayRoute Financial Engine Banner" width="100%" style="border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.3);" />
</p>

---

## 🇧🇩 বাংলা বিবরণ (Bengali Overview)

**PayRoute** হলো একটি বাণিজ্যিক-গ্রেড ফিনটেক ও পেমেন্ট গেটওয়ে ইঞ্জিনের সোর্স কোড প্ল্যাটফর্ম। এটি বাংলাদেশে বিদ্যুৎ বিল পরিশোধ (NESCO Prepaid, DESCO, DPDC, Palli Bidyut), রিয়েল-টাইম টোকেন জেনারেট, ফায়ারবেস ডাটাবেসে ডাটা সংরক্ষণ, আর্টিফিশিয়াল ইন্টেলিজেন্স (Gemini AI) দ্বারা ফ্রড ডিটেকশন এবং গুগল জিমেলেই API এর মাধ্যমে ইমেইল নোটিফিকেশন পাঠানোর মতো জটিল ব্যাংকিং সুবিধা প্রদান করে।

---

## 📸 প্ল্যাটফর্ম গ্যালারি ও আর্কিটেকচার ভিউ (Platform Visual Gallery)

### 1. ⚡ ইউটিলিটি বিল পেমেন্ট ও এআই ফ্রড গার্ড (Electricity Bill Engine & Gemini AI Security)
<p align="center">
  <img src="/payroute_utility_ai.jpg" alt="Utility Bill Engine and Gemini AI Security" width="100%" style="border-radius: 10px; border: 1px solid rgba(52, 211, 153, 0.3);" />
  <br/>
  <em>চিত্র ১: এনইএসসিও (NESCO), ডেসকো (DESCO) প্রিপেইড ২০-ডিজিট টোকেন জেনারেটর এবং জেমিনী এআই অ্যানোমালি ফ্রড গার্ড অডিট।</em>
</p>

### 2. 📱 P2P ওয়ালেট পেয়ার-টু-পেয়ার কিউআর কোড স্ক্যান ও ইনস্ট্যান্ট ট্রান্সফার (Dynamic P2P QR Code Transfer)
<p align="center">
  <img src="/payroute_p2p_qr.jpg" alt="Dynamic P2P QR Code Transfer Engine" width="100%" style="border-radius: 10px; border: 1px solid rgba(129, 140, 248, 0.3);" />
  <br/>
  <em>চিত্র ২: রিয়েল-টাইম P2P QR Code জেনারেটর, লাইভ ক্যামেরা স্ক্যানার এবং ডাবল-এন্ট্রি ACID ট্রান্সফার।</em>
</p>

---

## 🚀 মূল সুবিধাসমূহ (Key Features)

### 1. ⚡ বিদ্যুৎ বিল পেমেন্ট ও টোকেন জেনারেটর (Electricity Bill Payment & Token Engine)
- **মাল্টি-ইউটিলিটি সাপোর্ট:** NESCO Prepaid, DESCO Prepaid, DPDC Prepaid, BREB Palli Bidyut এবং WZPDCL Prepaid।
- **তাতক্ষণিক টোকেন:** ডাবল-এন্ট্রি ভ্যালিডেশন নিশ্চিত করে ২০-ডিজিটের প্রিপেইড রিচার্জ টোকেন তৈরি করে (যেমন: `6922-5068-9748-0048-7465`)।
- **অফিসিয়াল এসএমএস ও জিমেলেই রসিদ:** এসএমএস ফরম্যাটিং এবং গুগল জিমেলেই API ব্যবহার করে গ্রাহকের ইমেইলে ইমেইল রসিদ প্রেরণ।

### 2. 📱 P2P ওয়ালেট কিউআর কোড ট্রান্সফার (Dynamic P2P QR Code Scanner & Generator)
- **ডায়নামিক QR জেনারেটর:** গ্রাহকের ওয়ালেট আইডি, অ্যাকাউন্টের বিবরণ এবং পরিমাণ নির্ধারণ করে রিয়েল-টাইম QR কোড তৈরি।
- **ক্যামেরা ও ইমেজ স্ক্যানার:** সরাসরি ক্যামেরা ভিউ বা গ্যালারি থেকে QR কোড স্ক্যান করে তাৎক্ষণিক লেজার ট্রান্সফার ফরম ফিলাপ।

### 3. 🔥 ফায়ারবেস অথেন্টিকেশন ও ফায়ারস্টোর ডাটাবেস (Firebase Auth & Firestore)
- **গুগল সাইন-ইন:** Firebase Authentication এর মাধ্যমে সুরক্ষিত পেমেন্ট প্রোফাইল।
- **রিয়েল-টাইম ডাটাবেস:** Firestore ক্লাউড ডাটাবেসে সকল বিল পেমেন্ট ও লেজার রেকর্ডের তাৎক্ষণিক সিঙ্ক।

### 4. 🏦 ডাবল-এন্ট্রি এসিআইডি লেজার (ACID Wallet Ledger)
- **জিরো ড্রিফ্ট গ্যারান্টি:** প্রতি লেনদেনে Debit/Credit সামঞ্জস্য রেখে আর্থিক অসঙ্গতি প্রতিরোধ।
- **মাল্টি-কারেন্সি ওয়ালেট:** BDT, USD এবং EUR কারেন্সি সাপোর্ট।

### 5. 💳 পাসপোর্টেবল ভার্চুয়াল মাস্টারকার্ড (Passport Virtual Cards)
- **ফরেন কারেন্সি এন্ডোর্সমেন্ট:** বাংলাদেশীদের জন্য অফিসিয়াল পাসপোর্ট নম্বরের সাথে ভার্চুয়াল মাস্টারকার্ড লিংক করা।
- **ফরেন কনভার্সন:** BDT থেকে USD লাইভ কারেন্সি কনভার্সন ইঞ্জিন।

### 6. 🤖 জেমিনী এআই অ্যানোমালি ও ফ্রড অডিট (Gemini AI Audit)
- **ফ্রড ডিটেকশন:** আর্টিফিশিয়াল ইন্টেলিজেন্স দ্বারা অ্যাকাউন্ট হ্যাকিং ও ভুয়া ট্রানজ্যাকশন রিপ্রেজেন্টেশন স্ক্যান।

### 7. 🔔 গুগল জিমেলেই API ও ব্যাকএন্ড ওয়েবহুক (Gmail API & Webhooks)
- **মেইল নোটিফিকেশন:** Google Workspace OAuth2 & Gmail API v1 ইন্টিগ্রেশন।
- **অ্যাসিঙ্ক কিউ:** এক্সপোনেনশিয়াল ব্যাকঅফ ডিলেসহ মার্চেন্ট ওয়েবহুক রিট্রাই ইন্টিগ্রেশন।

---

## 💼 বাণিজ্যিক সম্ভাবনা ও ভ্যালুয়েশন গাইড (Business Valuation & Licensing)

| স্তর (Level) | অবস্থা (Category) | আনুমানিক মূল্য (BDT) | USD Value |
| :--- | :--- | :--- | :--- |
| **Level 1** | সোর্স কোড ও এমভিপি (Code Only) | ৳২৫,০০,০০০ - ৳৩৫,০০,০০০ | $20,000 - $30,000 USD |
| **Level 2** | ইন্টিগ্রেটেড সলিউশন (Full Software Package) | ৳৫০,০০,০০০ - ৳১,০০,০০,০০০ | $40,000 - $80,000 USD |
| **Level 3** | রিয়েল মার্চেন্ট ও ইউজারসহ (Live Commercial Platform) | ৳১.৫ কোটি - ৳৩.০ কোটি | $120,000 - $250,000 USD |

### 💰 উপার্জনের উপায়সমূহ (Revenue Streams):
1. **বিল পেমেন্ট সার্ভিস চার্জ:** প্রতি বিদ্যুৎ রিচার্জে ৳৫ - ৳১৫ টাকা ফি বা ১% কমিশন।
2. **মার্চেন্ট গেটওয়ে MDR ফি:** ই-কমার্স পেমেন্টে ১.৫% - ২.৫% সার্ভিস ফি।
3. **হোয়াইট-লেবেল SaaS সাবস্ক্রিপশন:** আইটি বা ফিনটেক কোম্পানিকে মাসে ৳২৫,০০০ - ৳৫০,০০০ টাকায় ভাড়া প্রদান।
4. **এককালীন সোর্স কোড লাইসেন্স বিক্রি:** ব্যাংক বা পেমেন্ট এগ্রিগেটর কোম্পানির কাছে ৳১৫ লাখ - ৳৫০ লাখ টাকায় বিক্রি।
5. **ভার্চুয়াল কার্ড ইস্যুয়েন্স:** প্রতি ভার্চুয়াল কার্ড ইস্যু ফি (৳৫০০) ও ১%-২% ফরেক্স স্প্রেড।

---

## 🛠️ টেকনোলজি স্ট্যাক (Tech Stack)

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Motion Animation.
- **Backend:** Node.js, Express.js (Port 3000 container proxy).
- **Database:** Firebase Firestore, Local JSON State Fallback.
- **Authentication:** Firebase Auth (Google OAuth2).
- **AI Engine:** Google Gemini AI (@google/genai SDK).
- **Workspace APIs:** Google Gmail API v1, Google Drive API.

---

## 📂 প্রজেক্ট ইনস্টলেশন ও রান নির্দেশিকা (Local Setup Guide)

```bash
# ১. ডিপেন্ডেন্সি ইনস্টল করুন
npm install

# ২. ডেভেলপার সার্ভার রান করুন (Port 3000)
npm run dev

# ৩. প্রডাকশন বিল্ড তৈরি করুন
npm run build

# ৪. প্রডাকশন রান
npm start
```

---

## 🔒 সিকিউরিটি ও লাইসেন্স (Security & Licensing)

All rights reserved by **PayRoute Financial Engine**. Commercial enterprise licenses and white-label rights available upon agreement.
