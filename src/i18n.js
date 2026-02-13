import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  // --- ENGLISH ---
  en: {
    translation: {
      // General / Display
      "display_title": "Display",
      "text_size": "Text Size",
      "language": "Language",
      "theme": "Theme",
      "current_lang": "English",
      "standard": "Standard",
      "large": "Large",
      "small": "Small",

      // Profile Menu
      "personal_details": "Personal Details",
      "medical_id": "Medical ID",
      "connected_apps": "Connected Apps",
      "devices": "Devices",
      "integrations": "Integrations",
      "features": "Features",
      "notifications": "Notifications",
      "sign_out": "Sign Out",
      "privacy_note": "Your data is encrypted on your device.",

      // Dashboard
      "welcome_message": "Welcome back, {{name}}",
      "loading_data": "Loading your wellness data...",
      "connect_title": "Let's Get Connected",
      "connect_desc": "Connect your wearable device to unlock your personal health dashboard.",
      "connect_btn": "Connect Tracker",
      "activity_ring": "Activity Ring",
      "move": "Move",
      "step_count": "Step Count",
      "distance": "Distance",
      "goals_completed": "Goals Completed",
      "steps": "Steps",
      "exercise": "Exercise",
      "sleep": "Sleep",
      "water": "Water",
      "blood_pressure": "Blood Pressure",
      "health_score": "Health Score",
      "heart": "Heart",
      "heart_rate": "Heart Rate",
      "fight_msg": "Fight For Yourself",
      "recommendations": "Recommendations",
      "rec_tomatoes": "The Health Benefits of Eating Tomatoes",
      "rec_heart": "5 Simple Steps to Better Heart Health",
      "rec_sleep": "Why Sleep is Your Superpower",
      "rec_water": "Hydration Hacks for Daily Life",
      "rec_bp": "Understanding Your Blood Pressure",
      "rec_move": "The Science of Daily Movement",
      "nearby_care": "Find Nearby Care",
      "locating": "Locating...",
      "use_my_location": "Use My Location",
      "location_prompt": "Click \"Use My Location\" to see clinics near you.",
      "view_details": "View Details",

      // Report
      "qr_title": "My Biomarker Data?",
      "scan_here": "Scan Here!",
      "step_1": "Open your camera app.",
      "step_2": "Scan the code to instantly download the PDF Report.",
      "share_provider": "share this to healthcare provider",
      "download_pdf": "Download PDF",

      // Chatbot
      "assistant_title": "CatchUp Assistant",
      "online": "Online",
      "thinking": "Thinking...",
      "type_message": "Type a message...",
      "confirm_clear": "Start a new conversation?",
      "fresh_start": "Fresh start! 🌿 How can I help you,",

      "nav_summary": "Summary",
      "nav_sharing": "Sharing",
      "nav_report": "Report",
      "nav_chat": "Chatbox",

      "chat_disclaimer": "CatchUp Assistant can make mistakes. Information provided is not medical advice."
    }
  },

  // --- CHINESE (ZH) ---
  zh: {
    translation: {
      "display_title": "显示 (Display)",
      "text_size": "文字大小",
      "language": "语言",
      "theme": "主题",
      "current_lang": "中文 (Chinese)",
      "standard": "标准",
      "large": "大",
      "small": "小",

      "personal_details": "个人详细信息",
      "medical_id": "医疗ID",
      "connected_apps": "关联应用",
      "devices": "设备",
      "integrations": "集成",
      "features": "功能",
      "notifications": "通知",
      "sign_out": "登出",
      "privacy_note": "您的数据已在设备上加密。",

      "welcome_message": "欢迎回来, {{name}}",
      "loading_data": "正在加载您的健康数据...",
      "connect_title": "连接设备",
      "connect_desc": "连接您的可穿戴设备以解锁个人健康仪表板。",
      "connect_btn": "连接追踪器",
      "activity_ring": "活动圆环",
      "move": "活动",
      "step_count": "步数",
      "distance": "距离",
      "goals_completed": "完成目标",
      "steps": "步数",
      "exercise": "运动",
      "sleep": "睡眠",
      "water": "水分",
      "blood_pressure": "血压",
      "health_score": "健康评分",
      "heart": "心脏",
      "heart_rate": "心率",
      "fight_msg": "为自己而战",
      "recommendations": "推荐阅读",
      "rec_tomatoes": "吃番茄的健康益处",
      "rec_heart": "改善心脏健康的5个简单步骤",
      "rec_sleep": "为什么睡眠是你的超能力",
      "rec_water": "日常生活的补水技巧",
      "rec_bp": "了解您的血压",
      "rec_move": "日常运动的科学",
      "nearby_care": "寻找附近护理",
      "locating": "定位中...",
      "use_my_location": "使用我的位置",
      "location_prompt": "点击“使用我的位置”查看附近的诊所。",
      "view_details": "查看详情",

      "qr_title": "我的生物标志物数据？",
      "scan_here": "扫描这里！",
      "step_1": "打开相机应用。",
      "step_2": "扫描二维码即刻下载PDF报告。",
      "share_provider": "分享给医疗提供者",
      "download_pdf": "下载 PDF",

      "assistant_title": "CatchUp 助手",
      "online": "在线",
      "thinking": "思考中...",
      "type_message": "输入消息...",
      "confirm_clear": "开始新对话？",
      "fresh_start": "重新开始！🌿 我能为您做什么，",


      "nav_summary": "摘要 (Summary)",
      "nav_sharing": "共享 (Sharing)",
      "nav_report": "报告 (Report)",
      "nav_chat": "聊天 (Chat)",

      "chat_disclaimer": "CatchUp 助手可能会犯错。所提供的信息并非医疗建议。"
    }
  },

  // --- MALAY (MS) ---
  ms: {
    translation: {
      "display_title": "Paparan",
      "text_size": "Saiz Teks",
      "language": "Bahasa",
      "theme": "Tema",
      "current_lang": "Bahasa Melayu",
      "standard": "Biasa",
      "large": "Besar",
      "small": "Kecil",

      "personal_details": "Butiran Peribadi",
      "medical_id": "ID Perubatan",
      "connected_apps": "Aplikasi Bersambung",
      "devices": "Peranti",
      "integrations": "Integrasi",
      "features": "Ciri-ciri",
      "notifications": "Notifikasi",
      "sign_out": "Log Keluar",
      "privacy_note": "Data anda disulitkan pada peranti anda.",

      "welcome_message": "Selamat Kembali, {{name}}",
      "loading_data": "Memuatkan data kesihatan anda...",
      "connect_title": "Mari Berhubung",
      "connect_desc": "Sambungkan peranti boleh pakai anda untuk melihat papan pemuka kesihatan.",
      "connect_btn": "Sambung Penjejak",
      "activity_ring": "Cincin Aktiviti",
      "move": "Gerak",
      "step_count": "Bilangan Langkah",
      "distance": "Jarak",
      "goals_completed": "Matlamat Tercapai",
      "steps": "Langkah",
      "exercise": "Senaman",
      "sleep": "Tidur",
      "water": "Air",
      "blood_pressure": "Tekanan Darah",
      "health_score": "Skor Kesihatan",
      "heart": "Jantung",
      "heart_rate": "Kadar Jantung",
      "fight_msg": "Berjuang Untuk Diri Anda",
      "recommendations": "Cadangan",
      "rec_tomatoes": "Khasiat Kesihatan Makan Tomato",
      "rec_heart": "5 Langkah Mudah untuk Jantung Sihat",
      "rec_sleep": "Kenapa Tidur Adalah Kuasa Anda",
      "rec_water": "Tips Hidrasi untuk Kehidupan Seharian",
      "rec_bp": "Memahami Tekanan Darah Anda",
      "rec_move": "Sains Pergerakan Harian",
      "nearby_care": "Cari Rawatan Berdekatan",
      "locating": "Mengesan...",
      "use_my_location": "Guna Lokasi Saya",
      "location_prompt": "Klik \"Guna Lokasi Saya\" untuk melihat klinik berdekatan.",
      "view_details": "Lihat Butiran",

      "qr_title": "Data Biomarker Saya?",
      "scan_here": "Imbas Sini!",
      "step_1": "Buka aplikasi kamera anda.",
      "step_2": "Imbas kod untuk memuat turun Laporan PDF.",
      "share_provider": "kongsikan ini kepada penyedia kesihatan",
      "download_pdf": "Muat Turun PDF",

      "assistant_title": "Pembantu CatchUp",
      "online": "Dalam Talian",
      "thinking": "Sedang berfikir...",
      "type_message": "Taip mesej...",
      "confirm_clear": "Mula perbualan baru?",
      "fresh_start": "Mula semula! 🌿 Apa yang boleh saya bantu,",

      "nav_summary": "Ringkasan",
      "nav_sharing": "Perkongsian",
      "nav_report": "Laporan",
      "nav_chat": "Sembang",

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