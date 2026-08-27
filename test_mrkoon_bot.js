const questions = [
  "1- هل المنصه بتاخد مبلغ عموله مني ضمن سعر الشراء ؟",
  "2- قد ايه  فترة استرداد التأمين اذا لم يرسي عليا المزاد ؟",
  "3- ماهي مسئولية المنصه والدعم الي بتقدمه ليا بعد الشراء ؟",
  "4- هل المنصه مسئوليتها بتنتهي بإستكمال عملية الشراء اقصد في حال وجود اي مشاكل مع البائع بعد اتمام عملية البيع هل تساعد المنصه في حلها ؟",
  "5- ماهي خدمات مع بعد البيع الذي تقدمها المنصه ؟",
  "6- هل عمليات الدفع عن طريق المنصه فقط ام يمكن التحويل علي حساب البائع مباشرة ؟",
  "7- هل مسموح المزايده علي اي مزاد كفرد ام يجب ان يكون لدي سجل تجاري كمؤسسة ؟",
  "8- لو اشتريت عن طريق المنصه ثم وجدت عيوب في البضاعة هل  يمكن اعادتها للبائع واسترداد المبلغ كامل ؟",
  "9- لماذا لا يمكن ان اكون بائع ومشتري بنفس الوقت ؟",
  "10- اذا وضعت مبلغ مالي في المحفظه هل يمكن استرداد المبلغ كامل في اي وقت دون اي خصم ؟",
  "11- اذا كانت البضاعه في مكان بعيد عني هل يجود حلول اخري للمعاينه بدون الذهاب بنفسي ؟",
  "12- مركون بتشتري ولا بتبيع ؟",
  "13- ايه الاستفاده  الي هتعود عليا كتاجر لو اشتريت من خلال المنصه ؟",
  "14- ايه الخدمات الي شركة مركون بتقدمها ؟",
  "15- سعر كراسة الشروط",
  "16- هل مبلغ كراسة الشروط يمكن استرداده في حالة عدم المعاينه",
  "17- تفاصيل المنتج ومكان المعاينه",
  "18- مدة المزاد",
  "19- ممكن البيع مباشر",
  "20- ماهي آليات المزاد ؟",
  "١- وش تفاصيل الصوالح في عسفان",
  "٢- ممكن الموقع في الحقيقه عشان أشوف",
  "٣- أنا ارغب في أشياء كثيره",
  "٤- ارسل الموقع ووقت الدوام",
  "٥- ارسل الموقع لازم أشوف بعيني",
  "٦- ارسل موقع",
  "٧- تفاصيل اكتر عن السكراب",
  "٨- عايز لينك المنتج",
  "٩- ايش الأوراق المطلوبه"
];

const API_KEY = 'kb_live_sk_mrkoon';
const TENANT_SLUG = 'mrkoon';
const API_URL = 'https://kaizech-brain-production.up.railway.app/api/v1/playground/chat';

async function run() {
  const fs = require('fs');
  let md = "# MRKOON Chatbot Test Results\n\n";

  for (const q of questions) {
    console.log(`Testing: ${q}`);
    try {
      const uniqueUserId = 'test-user-' + Math.random().toString(36).substring(7);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': TENANT_SLUG,
          'x-api-key': API_KEY
        },
        body: JSON.stringify({ message: q, userId: uniqueUserId })
      });
      
      const data = await response.json();
      md += `### Q: ${q}\n`;
      if (data.success) {
        md += `**A:** ${data.response}\n\n`;
      } else {
        md += `**Error:** ${JSON.stringify(data)}\n\n`;
      }
    } catch (e) {
      md += `**Exception:** ${e.message}\n\n`;
    }
  }

  fs.writeFileSync('test_results.md', md, 'utf-8');
  console.log("Done! Results written to test_results.md");
}

run();
