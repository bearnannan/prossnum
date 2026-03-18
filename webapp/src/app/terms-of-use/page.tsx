import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ข้อกำหนดการใช้งาน | Progress Dashboard",
  description: "ข้อกำหนดการใช้งาน Progress Dashboard — เงื่อนไขและข้อตกลงสำหรับการใช้บริการ",
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            กลับหน้าหลัก
          </Link>
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            อัปเดตล่าสุด: 18 มีนาคม 2568
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-zinc-200 bg-gradient-to-b from-violet-50 to-white dark:border-zinc-800 dark:from-violet-950/20 dark:to-zinc-950">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            ข้อกำหนดการใช้งาน
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            ข้อกำหนดการใช้งาน
          </h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-500 dark:text-zinc-400">
            กรุณาอ่านข้อกำหนดเหล่านี้อย่างละเอียดก่อนใช้งาน Progress Dashboard การเข้าใช้งานถือว่าคุณยอมรับข้อกำหนดทั้งหมด
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-10">

          {/* Section 1 */}
          <Section number="1" color="violet" title="การยอมรับข้อกำหนด">
            <p>
              โดยการเข้าถึงหรือใช้งาน <strong>Progress Dashboard</strong> (&ldquo;บริการ&rdquo;) คุณตกลงที่จะผูกพันตามข้อกำหนดการใช้งานนี้
              หากคุณไม่เห็นด้วยกับข้อกำหนดใดๆ กรุณาหยุดการใช้งานทันที
            </p>
            <InfoCard color="amber">
              บริการนี้ให้บริการเฉพาะบุคลากรที่ได้รับอนุญาตขององค์กรเท่านั้น การเข้าถึงโดยไม่ได้รับอนุญาตถือเป็นการละเมิดข้อกำหนดนี้
            </InfoCard>
          </Section>

          {/* Section 2 */}
          <Section number="2" color="violet" title="คำอธิบายบริการ">
            <p>Progress Dashboard เป็นแอปพลิเคชันเว็บ (Progressive Web App) สำหรับติดตามความก้าวหน้าการติดตั้งสถานีสัญญาณ ประกอบด้วย:</p>
            <ul>
              <li>แดชบอร์ดแสดงความก้าวหน้าการดำเนินงานแบบเรียลไทม์</li>
              <li>ระบบจัดการรายงานและเอกสาร</li>
              <li>แผนที่ตำแหน่งสถานีผ่าน <strong>Vallaris Maps</strong></li>
              <li>การเข้าสู่ระบบด้วย <strong>LINE Login</strong> (OAuth 2.0)</li>
              <li>การทำงานแบบออฟไลน์ (Offline-capable)</li>
            </ul>
          </Section>

          {/* Section 3 */}
          <Section number="3" color="violet" title="บัญชีผู้ใช้และการรักษาความปลอดภัย">
            <p>การเข้าสู่ระบบใช้บัญชี LINE ของคุณผ่าน OAuth 2.0 ซึ่งคุณมีหน้าที่:</p>
            <ul>
              <li>รักษาความปลอดภัยของบัญชี LINE ที่ใช้เข้าสู่ระบบ</li>
              <li>ไม่เปิดเผยข้อมูลการเข้าสู่ระบบให้บุคคลอื่น</li>
              <li>แจ้งผู้ดูแลระบบทันทีเมื่อพบการเข้าถึงที่ไม่ได้รับอนุญาต</li>
              <li>ออกจากระบบเมื่อใช้งานเสร็จโดยเฉพาะบนอุปกรณ์สาธารณะ</li>
            </ul>
            <InfoCard color="red">
              หากพบการละเมิดความปลอดภัย ผู้ดูแลระบบมีสิทธิ์ระงับหรือยกเลิกบัญชีของคุณโดยไม่ต้องแจ้งล่วงหน้า
            </InfoCard>
          </Section>

          {/* Section 4 */}
          <Section number="4" color="violet" title="การใช้งานที่ได้รับอนุญาต">
            <p>คุณได้รับอนุญาตให้ใช้บริการนี้เพื่อ:</p>
            <ul>
              <li>ดูข้อมูลความก้าวหน้าของโครงการที่ได้รับมอบหมาย</li>
              <li>อัปเดตข้อมูลสถานภาพงานที่อยู่ในความรับผิดชอบ</li>
              <li>สร้างและดาวน์โหลดรายงานตามสิทธิ์ที่กำหนด</li>
              <li>ดูแผนที่และตำแหน่งสถานีในพื้นที่รับผิดชอบ</li>
            </ul>
          </Section>

          {/* Section 5 */}
          <Section number="5" color="violet" title="การใช้งานที่ต้องห้าม">
            <p>คุณต้องไม่กระทำการดังต่อไปนี้:</p>
            <div className="space-y-2">
              {[
                "แบ่งปัน ขาย หรือถ่ายโอนสิทธิ์การเข้าถึงให้บุคคลอื่น",
                "เข้าถึงข้อมูลที่อยู่นอกเหนือขอบเขตสิทธิ์ที่ได้รับ",
                "พยายาม Hack หรือ Bypass ระบบความปลอดภัย",
                "คัดลอก ดัดแปลง หรือแจกจ่ายซอฟต์แวร์โดยไม่ได้รับอนุญาต",
                "ใช้บริการเพื่อกระทำการที่ผิดกฎหมายหรือสร้างความเสียหาย",
                "รบกวนหรือขัดขวางการทำงานของเซิร์ฟเวอร์และระบบ",
                "เก็บข้อมูลจากบริการโดยใช้วิธีอัตโนมัติ (Scraping/Crawling)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </Section>

          {/* Section 6 */}
          <Section number="6" color="violet" title="ทรัพย์สินทางปัญญา">
            <p>
              บริการและเนื้อหาทั้งหมด รวมถึงซอฟต์แวร์ การออกแบบ กราฟิก และเอกสาร เป็นทรัพย์สินของผู้พัฒนาและองค์กรที่ได้รับอนุญาต
              Protected โดยกฎหมายลิขสิทธิ์และทรัพย์สินทางปัญญาไทย
            </p>
            <ul>
              <li>แผนที่จัดทำโดย <strong>Vallaris Maps</strong> — อยู่ภายใต้เงื่อนไขการใช้งานของ Vallaris</li>
              <li>ระบบยืนยันตัวตนโดย <strong>LINE Login</strong> — อยู่ภายใต้ข้อกำหนดของ LINE Corporation</li>
            </ul>
          </Section>

          {/* Section 7 */}
          <Section number="7" color="violet" title="การยกเว้นความรับผิด">
            <p>บริการนี้ให้บริการตาม &ldquo;สภาพที่เป็นอยู่&rdquo; (As-Is) โดยไม่มีการรับประกันใดๆ ทั้งโดยชัดแจ้งหรือโดยนัย ผู้พัฒนาไม่รับผิดชอบต่อ:</p>
            <ul>
              <li>ความสูญหายของข้อมูลอันเนื่องมาจากเหตุสุดวิสัยหรือความผิดพลาดทางเทคนิค</li>
              <li>การหยุดให้บริการชั่วคราวเพื่อการบำรุงรักษาหรือเหตุอื่น</li>
              <li>ความเสียหายที่เกิดจากการใช้งานผิดวัตถุประสงค์</li>
              <li>ความไม่ถูกต้องของข้อมูลที่ผู้ใช้บันทึกเข้าระบบ</li>
            </ul>
          </Section>

          {/* Section 8 */}
          <Section number="8" color="violet" title="การชดใช้ค่าเสียหาย">
            <p>
              คุณตกลงที่จะชดใช้ค่าเสียหาย ป้องกัน และถือว่าฝ่ายผู้พัฒนาไม่มีความรับผิดชอบสำหรับการเรียกร้อง ความเสียหาย
              หรือค่าใช้จ่ายที่เกิดจากการละเมิดข้อกำหนดนี้หรือการใช้บริการในทางที่ผิด
            </p>
          </Section>

          {/* Section 9 */}
          <Section number="9" color="violet" title="การยุติการให้บริการ">
            <p>เราขอสงวนสิทธิ์ในการ:</p>
            <ul>
              <li>ระงับหรือยกเลิกบัญชีที่ละเมิดข้อกำหนด</li>
              <li>ปรับเปลี่ยนหรือยุติการให้บริการบางส่วนหรือทั้งหมดโดยแจ้งล่วงหน้า</li>
              <li>จำกัดการเข้าถึงในกรณีที่มีกิจกรรมที่น่าสงสัยหรือเป็นอันตราย</li>
            </ul>
          </Section>

          {/* Section 10 */}
          <Section number="10" color="violet" title="กฎหมายที่ใช้บังคับ">
            <p>
              ข้อกำหนดนี้อยู่ภายใต้และตีความตามกฎหมายไทย ข้อพิพาทใดๆ ที่เกิดขึ้นจากหรือเกี่ยวข้องกับข้อกำหนดนี้จะได้รับการแก้ไข
              ในศาลไทยที่มีเขตอำนาจ
            </p>
          </Section>

          {/* Section 11 */}
          <Section number="11" color="violet" title="การแก้ไขข้อกำหนด">
            <p>
              เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดนี้ได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลบังคับใช้ทันทีเมื่อเผยแพร่บนหน้านี้
              การใช้งานต่อเนื่องหลังจากการเปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดที่แก้ไขแล้ว
            </p>
            <InfoCard color="blue">
              วันที่อัปเดตล่าสุดจะแสดงที่ด้านบนของหน้านี้เสมอ กรุณาตรวจสอบเป็นระยะ
            </InfoCard>
          </Section>

          {/* Section 12 */}
          <Section number="12" color="violet" title="ติดต่อเรา">
            <p>
              หากมีข้อสงสัยเกี่ยวกับข้อกำหนดการใช้งาน กรุณาติดต่อผู้ดูแลระบบขององค์กรหรือผ่าน LINE Official Account ที่ได้รับการกำหนด
            </p>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 border-t border-zinc-200 pt-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <Link href="/privacy-policy" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
            นโยบายความเป็นส่วนตัว
          </Link>
          <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({
  number,
  color,
  title,
  children,
}: {
  number: string;
  color: "violet" | "blue";
  title: string;
  children: React.ReactNode;
}) {
  const bgColors = {
    violet: "bg-violet-600",
    blue: "bg-blue-600",
  };
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bgColors[color]} text-xs font-bold text-white`}>
          {number}
        </span>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      <div className="prose prose-zinc prose-sm max-w-none space-y-3 text-zinc-600 dark:prose-invert dark:text-zinc-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </section>
  );
}

function InfoCard({
  color,
  children,
}: {
  color: "blue" | "amber" | "red";
  children: React.ReactNode;
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    amber: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300",
    red: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${colors[color]}`}>
      {children}
    </div>
  );
}
