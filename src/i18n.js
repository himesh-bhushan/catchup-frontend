import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  // ==========================================
  // --- ENGLISH (EN) ---
  // ==========================================
  en: {
    translation: {
      // --- General & Display ---
      "display_title": "Display",
      "text_size": "Text Size",
      "language": "Language",
      "theme": "Theme",
      "current_lang": "English",
      "standard": "Standard",
      "large": "Large",
      "small": "Small",
      "save": "Save",
      "cancel": "Cancel",
      "edit": "Edit",

      // --- Navigation ---
      "nav_summary": "Summary",
      "nav_sharing": "Sharing",
      "nav_report": "Report",
      "nav_chat": "Chatbox",

      // --- Profile Menu ---
      "personal_details": "Personal Details",
      "medical_id": "Medical ID",
      "connected_apps": "Connected Apps",
      "devices": "Devices",
      "integrations": "Integrations",
      "features": "Features",
      "notifications": "Notifications",
      "sign_out": "Sign Out",
      "privacy_note": "Your data is encrypted on your device.",

      // --- Dashboard ---
      "welcome_message": "Welcome back, {{name}}",
      "hi_message": "Hi, {{name}}",
      "have_nice_day": "Have a nice day",
      "loading_data": "Loading your wellness data...",
      "last_updated": "Last updated",
      "steps_desc": "Walk 5,000 steps per day",
      "sleep_desc": "7 hours per day",
      "water_desc": "2 Liters",
      
      // Connection Modal
      "connect_title": "Let's Get Connected",
      "connect_desc": "Connect your wearable device to unlock your personal health dashboard.",
      "connect_btn": "Connect Tracker",
      "sync_apple_health": "Sync Apple Health",
      "sync_apple_desc": "Download our secure shortcut to automatically sync your daily activity and close your rings.",
      "email_setup_guide": "Email me the Setup Guide",
      "sending_email": "Sending Email...",
      "skip_dashboard": "Skip & Continue to Dashboard",

      // Dashboard Tiles
      "Activity Ring": "Activity Ring", // Kept exact case for your component
      "move": "Move",
      "step_count": "Step Count",
      "distance": "Distance",
      "Syncing": "Syncing",
      "Water": "Water",
      "Sleep": "Sleep",
      "Goals Completed": "Goals Completed",
      "daily_steps": "Daily Steps",
      "hit_calorie_goal": "Hit daily calorie goal",
      "Blood Pressure": "Blood Pressure",
      "Heart Rate": "Heart Rate",
      "Health Score": "Health Score",
      "Awards": "Awards",

      // Recommendations & Location
      "recommendations": "Recommendations",
      "rec_tomatoes": "Why Tomato is Good For Us",
      "rec_heart": "5 Steps to Better Health",
      "rec_sleep": "Why Sleep is Your Superpower",
      "nearby_care": "Find Nearby Care",
      "locating": "Locating...",
      "use_my_location": "Use My Location",
      "location_prompt": "Click \"Use My Location\" to see clinics near you.",
      "view_details": "View Details",
      "open_now": "Open Now",

      // --- Activity / Daily Goals Page ---
      "daily_activity": "Daily Activity",
      "weekly_progress": "Weekly Progress",
      "calories_burned": "Calories Burned",

      // --- Water Page ---
      "water_intake": "Water Intake",
      "add_water": "Add Water",
      "daily_goal": "Daily Goal",

      // --- Sleep Page ---
      "sleep_analysis": "Sleep Analysis",
      "deep_sleep": "Deep Sleep",
      "light_sleep": "Light Sleep",
      "time_in_bed": "Time in Bed",

      // --- Awards Page ---
      "my_awards": "My Awards",
      "monthly_mover": "Monthly Mover",
      "monthly_mover_desc": "Hit your move goal every day this month.",
      "share": "Share",

      // --- Report Page ---
      "qr_title": "My Biomarker Data?",
      "scan_here": "Scan Here!",
      "step_1": "Open your camera app.",
      "step_2": "Scan the code to instantly download the PDF Report.",
      "share_provider": "share this to healthcare provider",
      "download_pdf": "Download PDF",

      // --- Chatbot ---
      "assistant_title": "CatchUp Assistant",
      "online": "Online",
      "thinking": "Thinking...",
      "type_message": "Type a message...",
      "confirm_clear": "Start a new conversation?",
      "fresh_start": "Fresh start! 🌿 How can I help you,",
      "chat_disclaimer": "CatchUp Assistant can make mistakes. Information provided is not medical advice."
    }
  },

  // ==========================================
  // --- CHINESE (ZH) ---
  // ==========================================
  zh: {
    translation: {
      // --- General & Display ---
      "display_title": "显示",
      "text_size": "文字大小",
      "language": "语言",
      "theme": "主题",
      "current_lang": "中文",
      "standard": "标准",
      "large": "大",
      "small": "小",
      "save": "保存",
      "cancel": "取消",
      "edit": "编辑",

      // --- Navigation ---
      "nav_summary": "摘要",
      "nav_sharing": "共享",
      "nav_report": "报告",
      "nav_chat": "聊天",

      // --- Profile Menu ---
      "personal_details": "个人详细信息",
      "medical_id": "医疗卡",
      "connected_apps": "关联应用",
      "devices": "设备",
      "integrations": "集成",
      "features": "功能",
      "notifications": "通知",
      "sign_out": "登出",
      "privacy_note": "您的数据已在设备上加密。",

      // --- Dashboard ---
      "welcome_message": "欢迎回来, {{name}}",
      "hi_message": "你好, {{name}}",
      "have_nice_day": "祝你有美好的一天",
      "loading_data": "正在加载您的健康数据...",
      "last_updated": "最后更新",
      "steps_desc": "每天步行 5,000 步",
      "sleep_desc": "每天 7 小时",
      "water_desc": "2 升",
      "steps_desc": "每天步行 {{steps}} 步",
      "sleep_desc": "每天 {{hours}} 小时",
      "water_desc": "{{liters}} 升",
      
      // Connection Modal
      "connect_title": "连接设备",
      "connect_desc": "连接您的可穿戴设备以解锁个人健康仪表板。",
      "connect_btn": "连接追踪器",
      "sync_apple_health": "同步 Apple Health",
      "sync_apple_desc": "下载我们的安全捷径，自动同步您的日常活动。",
      "email_setup_guide": "将设置指南发送到我的邮箱",
      "sending_email": "发送邮件中...",
      "skip_dashboard": "跳过并继续前往仪表板",

      // Dashboard Tiles
      "Activity Ring": "活动圆环",
      "move": "活动",
      "step_count": "步数",
      "distance": "距离",
      "Syncing": "同步中",
      "Water": "水分",
      "Sleep": "睡眠",
      "Goals Completed": "完成目标",
      "daily_steps": "每日步数",
      "hit_calorie_goal": "达到每日卡路里目标",
      "Blood Pressure": "血压",
      "Heart Rate": "心率",
      "Health Score": "健康评分",
      "Awards": "奖章",

      // Recommendations & Location
      "recommendations": "推荐阅读",
      "rec_tomatoes": "吃番茄的健康益处",
      "rec_heart": "改善心脏健康的5个简单步骤",
      "rec_sleep": "为什么睡眠是你的超能力",
      "nearby_care": "寻找附近护理",
      "locating": "定位中...",
      "use_my_location": "使用我的位置",
      "location_prompt": "点击“使用我的位置”查看附近的诊所。",
      "view_details": "查看详情",
      "open_now": "营业中",

      // --- Activity / Daily Goals Page ---
      "daily_activity": "日常活动",
      "weekly_progress": "每周进度",
      "calories_burned": "燃烧的卡路里",

      // --- Water Page ---
      "water_intake": "饮水量",
      "add_water": "添加水分",
      "daily_goal": "每日目标",

      // --- Sleep Page ---
      "sleep_analysis": "睡眠分析",
      "deep_sleep": "深度睡眠",
      "light_sleep": "浅度睡眠",
      "time_in_bed": "卧床时间",

      // --- Awards Page ---
      "my_awards": "我的奖章",
      "monthly_mover": "月度运动达人",
      "monthly_mover_desc": "本月每天达到您的活动目标。",
      "share": "分享",

      // --- Report Page ---
      "qr_title": "我的生物标志物数据？",
      "scan_here": "扫描这里！",
      "step_1": "打开相机应用。",
      "step_2": "扫描二维码即刻下载PDF报告。",
      "share_provider": "分享给医疗提供者",
      "download_pdf": "下载 PDF",

      // --- Chatbot ---
      "assistant_title": "CatchUp 助手",
      "online": "在线",
      "thinking": "思考中...",
      "type_message": "输入消息...",
      "confirm_clear": "开始新对话？",
      "fresh_start": "重新开始！🌿 我能为您做什么，",
      "chat_disclaimer": "CatchUp 助手可能会犯错。所提供的信息并非医疗建议。"
    }
  },

  // ==========================================
  // --- MALAY (MS) ---
  // ==========================================
  ms: {
    translation: {
      // --- General & Display ---
      "display_title": "Paparan",
      "text_size": "Saiz Teks",
      "language": "Bahasa",
      "theme": "Tema",
      "current_lang": "Bahasa Melayu",
      "standard": "Biasa",
      "large": "Besar",
      "small": "Kecil",
      "save": "Simpan",
      "cancel": "Batal",
      "edit": "Sunting",

      // --- Navigation ---
      "nav_summary": "Ringkasan",
      "nav_sharing": "Perkongsian",
      "nav_report": "Laporan",
      "nav_chat": "Sembang",

      // --- Profile Menu ---
      "personal_details": "Butiran Peribadi",
      "medical_id": "ID Perubatan",
      "connected_apps": "Aplikasi Bersambung",
      "devices": "Peranti",
      "integrations": "Integrasi",
      "features": "Ciri-ciri",
      "notifications": "Notifikasi",
      "sign_out": "Log Keluar",
      "privacy_note": "Data anda disulitkan pada peranti anda.",

      // --- Dashboard ---
      "welcome_message": "Selamat Kembali, {{name}}",
      "hi_message": "Hai, {{name}}",
      "have_nice_day": "Semoga hari anda indah",
      "loading_data": "Memuatkan data kesihatan anda...",
      "last_updated": "Kemas kini terakhir",
      "steps_desc": "Berjalan 5,000 langkah sehari",
      "sleep_desc": "7 jam sehari",
      "water_desc": "2 Liter",
      "steps_desc": "Berjalan {{steps}} langkah sehari",
      "sleep_desc": "{{hours}} jam sehari",
      "water_desc": "{{liters}} Liter",
      
      // Connection Modal
      "connect_title": "Mari Berhubung",
      "connect_desc": "Sambungkan peranti boleh pakai anda untuk melihat papan pemuka kesihatan.",
      "connect_btn": "Sambung Penjejak",
      "sync_apple_health": "Pautkan Apple Health",
      "sync_apple_desc": "Muat turun pintasan selamat kami untuk memautkan aktiviti harian anda secara automatik.",
      "email_setup_guide": "E-melkan Panduan Persediaan",
      "sending_email": "Menghantar E-mel...",
      "skip_dashboard": "Langkau & Terus ke Papan Pemuka",

      // Dashboard Tiles
      "Activity Ring": "Cincin Aktiviti",
      "move": "Gerak",
      "step_count": "Bilangan Langkah",
      "distance": "Jarak",
      "Syncing": "Menyelaras",
      "Water": "Air",
      "Sleep": "Tidur",
      "Goals Completed": "Matlamat Tercapai",
      "daily_steps": "Langkah Harian",
      "hit_calorie_goal": "Capai matlamat kalori harian",
      "Blood Pressure": "Tekanan Darah",
      "Heart Rate": "Kadar Jantung",
      "Health Score": "Skor Kesihatan",
      "Awards": "Anugerah",

      // Recommendations & Location
      "recommendations": "Cadangan",
      "rec_tomatoes": "Khasiat Kesihatan Makan Tomato",
      "rec_heart": "5 Langkah Mudah untuk Jantung Sihat",
      "rec_sleep": "Kenapa Tidur Adalah Kuasa Anda",
      "nearby_care": "Cari Rawatan Berdekatan",
      "locating": "Mengesan...",
      "use_my_location": "Guna Lokasi Saya",
      "location_prompt": "Klik \"Guna Lokasi Saya\" untuk melihat klinik berdekatan.",
      "view_details": "Lihat Butiran",
      "open_now": "Buka Sekarang",

      // --- Activity / Daily Goals Page ---
      "daily_activity": "Aktiviti Harian",
      "weekly_progress": "Kemajuan Mingguan",
      "calories_burned": "Kalori Dibakar",

      // --- Water Page ---
      "water_intake": "Pengambilan Air",
      "add_water": "Tambah Air",
      "daily_goal": "Matlamat Harian",

      // --- Sleep Page ---
      "sleep_analysis": "Analisis Tidur",
      "deep_sleep": "Tidur Nyenyak",
      "light_sleep": "Tidur Ringan",
      "time_in_bed": "Masa di Tempat Tidur",

      // --- Awards Page ---
      "my_awards": "Anugerah Saya",
      "monthly_mover": "Penggerak Bulanan",
      "monthly_mover_desc": "Capai matlamat pergerakan anda setiap hari bulan ini.",
      "share": "Kongsi",

      // --- Report Page ---
      "qr_title": "Data Biomarker Saya?",
      "scan_here": "Imbas Sini!",
      "step_1": "Buka aplikasi kamera anda.",
      "step_2": "Imbas kod untuk memuat turun Laporan PDF.",
      "share_provider": "kongsikan ini kepada penyedia kesihatan",
      "download_pdf": "Muat Turun PDF",

      // --- Chatbot ---
      "assistant_title": "Pembantu CatchUp",
      "online": "Dalam Talian",
      "thinking": "Sedang berfikir...",
      "type_message": "Taip mesej...",
      "confirm_clear": "Mula perbualan baru?",
      "fresh_start": "Mula semula! 🌿 Apa yang boleh saya bantu,",
      "chat_disclaimer": "Pembantu CatchUp boleh melakukan kesilapan. Maklumat yang diberikan bukan nasihat perubatan."
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;