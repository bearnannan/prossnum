import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว | Progress Dashboard",
  description: "นโยบายความเป็นส่วนตัวของ Progress Dashboard — การเก็บรวบรวม ใช้ และคุ้มครองข้อมูลส่วนบุคคลของผู้ใช้งาน",
};

export default function PrivacyPolicyPage() {
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
      <div className="border-b border-zinc-200 bg-gradient-to-b from-blue-50 to-white dark:border-zinc-800 dark:from-blue-950/20 dark:to-zinc-950">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            ความเป็นส่วนตัว
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            นโยบายความเป็นส่วนตัว
          </h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-500 dark:text-zinc-400">
            เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ เอกสารนี้อธิบายว่าเราเก็บรวบรวม ใช้ และคุ้มครองข้อมูลของคุณอย่างไร
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-10">

          {/* Section 1 */}
          <Section
            number="1"
            title="ข้อมูลที่เราเก็บรวบรวม"
          >
            <p>เมื่อคุณเข้าสู่ระบบด้วย <strong>LINE Login</strong> (OAuth 2.0) เราจะได้รับข้อมูลดังต่อไปนี้จาก LINE Corporation:</p>
            <ul>
              <li>ชื่อแสดงผล (Display Name) และรูปโปรไฟล์ของ LINE</li>
              <li>LINE User ID ซึ่งเป็นรหัสประจำตัวที่ไม่ซ้ำกัน</li>
              <li>ที่อยู่อีเมล (เฉพาะกรณีที่คุณอนุญาต)</li>
            </ul>
            <p>นอกจากข้อมูลจาก LINE เรายังเก็บ:</p>
            <ul>
              <li>ข้อมูลการใช้งานระบบ เช่น หน้าที่เยี่ยมชม เวลาเข้าใช้งาน และการกระทำที่บันทึกในระบบ</li>
              <li>ข้อมูลตำแหน่งที่ตั้ง (Location) จาก <strong>Vallaris Maps</strong> เฉพาะเมื่อคุณใช้ฟีเจอร์แผนที่และให้สิทธิ์การเข้าถึงตำแหน่ง</li>
              <li>ข้อมูล Log ของการกระทำในระบบ เพื่อวัตถุประสงค์ด้านความปลอดภัย</li>
            </ul>
          </Section>

          {/* Section 2 */}
          <Section number="2" title="วัตถุประสงค์ในการใช้ข้อมูล">
            <p>เราใช้ข้อมูลที่เก็บรวบรวมเพื่อ:</p>
            <ul>
              <li>ยืนยันตัวตนและเข้าสู่ระบบผ่าน LINE Login</li>
              <li>แสดงแดชบอร์ดความก้าวหน้าและรายงานที่ตรงกับสิทธิ์ของแต่ละผู้ใช้</li>
              <li>แสดงข้อมูลตำแหน่งสถานีบนแผนที่ผ่าน Vallaris Maps</li>
              <li>ปรับปรุงประสบการณ์การใช้งานและพัฒนาระบบ</li>
              <li>ดำเนินการตามกฎหมายและข้อกำหนดที่เกี่ยวข้อง</li>
            </ul>
          </Section>

          {/* Section 3 */}
          <Section number="3" title="การแบ่งปันข้อมูลกับบุคคลที่สาม">
            <p>เราไม่ขายหรือเผยแพร่ข้อมูลส่วนบุคคลของคุณให้กับบุคคลที่สามเพื่อวัตถุประสงค์ทางการค้า อย่างไรก็ตาม เราอาจแบ่งปันข้อมูลกับ:</p>
            <InfoCard color="yellow">
              <strong>LINE Corporation</strong> — ผู้ให้บริการ LINE Login (OAuth 2.0) ซึ่งทำหน้าที่เป็นผู้ประมวลผลข้อมูล ข้อมูลของคุณอยู่ภายใต้
              {" "}<a href="https://terms.line.me/line_rules?lang=th" target="_blank" rel="noopener noreferrer" className="underline">นโยบายความเป็นส่วนตัวของ LINE</a>
            </InfoCard>
            <InfoCard color="blue">
              <strong>Vallaris Maps</strong> — ผู้ให้บริการแผนที่ซึ่งอาจรับข้อมูลพิกัดตำแหน่งเพื่อแสดงผลแผนที่ภายในแอปพลิเคชัน
            </InfoCard>
            <p>นอกจากนี้ เราอาจเปิดเผยข้อมูลตามที่กฎหมายไทยกำหนด หรือเพื่อปกป้องสิทธิ์และความปลอดภัยของผู้ใช้</p>
          </Section>

          {/* Section 4 */}
          <Section number="4" title="ระยะเวลาในการเก็บรักษาข้อมูล">
            <p>เราเก็บรักษาข้อมูลส่วนบุคคลของคุณไว้ตราบเท่าที่จำเป็นสำหรับวัตถุประสงค์ที่ระบุไว้ในนโยบายนี้ หรือตามที่กฎหมายกำหนด:</p>
            <ul>
              <li>ข้อมูลบัญชีผู้ใช้ — เก็บตลอด Session และตามระยะเวลา Token ของ LINE</li>
              <li>ข้อมูล Log การใช้งาน — เก็บไม่เกิน 90 วัน</li>
              <li>ข้อมูลรายงานที่บันทึกในระบบ — เก็บตามนโยบายขององค์กร</li>
            </ul>
          </Section>

          {/* Section 5 */}
          <Section number="5" title="สิทธิ์ของเจ้าของข้อมูล">
            <p>ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) พ.ศ. 2562 คุณมีสิทธิ์:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: "👁️", label: "สิทธิ์การเข้าถึงข้อมูล", desc: "ขอดูข้อมูลที่เราเก็บของคุณ" },
                { icon: "✏️", label: "สิทธิ์แก้ไขข้อมูล", desc: "ขอแก้ไขข้อมูลที่ไม่ถูกต้อง" },
                { icon: "🗑️", label: "สิทธิ์ลบข้อมูล", desc: "ขอให้ลบข้อมูลส่วนบุคคล" },
                { icon: "⛔", label: "สิทธิ์คัดค้าน", desc: "คัดค้านการประมวลผลข้อมูล" },
                { icon: "📦", label: "สิทธิ์ขอรับข้อมูล", desc: "ขอรับข้อมูลในรูปแบบอิเล็กทรอนิกส์" },
                { icon: "🔒", label: "สิทธิ์ระงับการใช้", desc: "ขอระงับการประมวลผลชั่วคราว" },
              ].map((right) => (
                <div key={right.label} className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <span className="text-xl">{right.icon}</span>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">{right.label}</div>
                    <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{right.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Section 6 */}
          <Section number="6" title="การรักษาความปลอดภัย">
            <p>เราใช้มาตรการทางเทคนิคและองค์กรที่เหมาะสมเพื่อปกป้องข้อมูลส่วนบุคคลของคุณ ได้แก่:</p>
            <ul>
              <li>การเข้ารหัสการสื่อสารด้วย HTTPS/TLS</li>
              <li>การยืนยันตัวตนผ่าน OAuth 2.0 มาตรฐาน ผ่าน LINE Login</li>
              <li>การจำกัดการเข้าถึงข้อมูลตามสิทธิ์และบทบาทของผู้ใช้</li>
              <li>การตรวจสอบและบันทึก Log กิจกรรมที่สำคัญ</li>
            </ul>
          </Section>

          {/* Section 7 */}
          <Section number="7" title="คุกกี้และเทคโนโลยีติดตาม">
            <p>เราอาจใช้คุกกี้และ Local Storage เพื่อ:</p>
            <ul>
              <li>จดจำ Session การเข้าสู่ระบบและ Token ของ LINE Login</li>
              <li>บันทึกการตั้งค่าการแสดงผล เช่น ธีมสีและภาษา</li>
              <li>แคชข้อมูลเพื่อการทำงานแบบออฟไลน์ (Progressive Web App)</li>
            </ul>
            <p>คุณสามารถปิดการใช้งานคุกกี้ผ่านการตั้งค่าเบราว์เซอร์ได้ แต่อาจส่งผลต่อการทำงานบางส่วนของแอปพลิเคชัน</p>
          </Section>

          {/* Section 8 */}
          <Section number="8" title="การเปลี่ยนแปลงนโยบาย">
            <p>เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว หากมีการเปลี่ยนแปลงที่มีนัยสำคัญ เราจะแจ้งให้ทราบผ่านช่องทางที่เหมาะสม วันที่อัปเดตล่าสุดจะปรากฏที่ด้านบนของหน้านี้</p>
          </Section>

          {/* Section 9 */}
          <Section number="9" title="ติดต่อเรา">
            <p>หากคุณมีคำถามหรือต้องการใช้สิทธิ์ตาม PDPA กรุณาติดต่อเราผ่าน LINE Official Account หรือผู้ดูแลระบบขององค์กรของคุณ</p>
            <InfoCard color="green">
              คำขอใช้สิทธิ์ PDPA จะได้รับการตอบกลับภายใน <strong>30 วัน</strong> นับแต่วันที่ได้รับคำขอ
            </InfoCard>
          </Section>

        </div>

        {/* Footer links */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 border-t border-zinc-200 pt-8 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <Link href="/terms-of-use" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
            ข้อกำหนดการใช้งาน
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
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
          {number}
        </span>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
      </div>
      <div className="prose prose-zinc prose-sm max-w-none space-y-3 text-zinc-600 dark:prose-invert dark:text-zinc-300 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-blue-600 [&_a]:no-underline [&_a:hover]:underline dark:[&_a]:text-blue-400">
        {children}
      </div>
    </section>
  );
}

function InfoCard({
  color,
  children,
}: {
  color: "blue" | "yellow" | "green";
  children: React.ReactNode;
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    yellow: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300",
    green: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${colors[color]}`}>
      {children}
    </div>
  );
}
