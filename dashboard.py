import streamlit as st
import pandas as pd
import plotly.express as px
import folium
from streamlit_folium import st_folium

# --- 1. การตั้งค่าหน้าเว็บ ---
st.set_page_config(
    page_title="รายงานก่อสร้างสถานี 9 เมตร",
    page_icon="📊",
    layout="wide"
)

st.title("📊 Dashboard รายงานความคืบหน้าก่อสร้างเสาสัญญาณ")
st.markdown("ข้อมูลอัปเดตงานก่อสร้างฐานรากและติดตั้งเสาสัญญาณ 9 เมตร (จ.กาญจนบุรี เขต 11)")

# --- 2. ดึงข้อมูลจาก Google Sheets (ผ่านลิงก์ CSV อัตโนมัติ) ---

# TODO: นำ URL ของ Google Sheets ที่ได้รับมาใส่ตรงนี้
# วิธีทำ: 
# 1. ไปที่ Google Sheets -> ไฟล์ (File) -> แชร์ (Share) -> เผยแพร่ทางเว็บ (Publish to web)
# 2. เลือก 'ทั้งเอกสาร' (Entire Document) และ 'ค่าที่คั่นด้วยคอมมา (.csv)' (Comma-separated values (.csv))
# 3. กด 'เผยแพร่' (Publish) แล้วก๊อปปี้ลิงก์มาใส่เป็นค่าของตัวแปร SHEET_CSV_URL ด้านล่างนี้
SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS-x6wrhvu6tQUCeY4AHFlDPeHE2Jjkrrry5paIxNC4_McE8YYEFAOfAZowFurEsf-lyyVrkozKp4OE/pub?output=csv" # ดึงข้อมูลจาก Google Sheets (Export to CSV)

@st.cache_data(ttl=60) # จำข้อมูลไว้ 60 วินาที จะได้ไม่ต้องโหลดจากเน็ตใหม่ทุกครั้งที่กดฟิลเตอร์
def load_data(url):
    try:
        # โหลดข้อมูลจาก CSV
        df = pd.read_csv(url)
        
        # ป้องกันกรณีมีค่าว่าง (NaN) ในบางช่อง
        df = df.fillna({
            "ความคืบหน้าฐานราก (%)": 0, 
            "งานติดตั้งเสา (%)": 0,
            "Type": "-"
        })
        
        return df
    except Exception as e:
        st.error(f"❌ ไม่สามารถดึงข้อมูลจาก Google Sheets ได้: {e}")
        return pd.DataFrame() # คืนค่าเป็นตารางเปล่าถ้าเกิดข้อผิดพลาด

# นำข้อมูลเข้าสู่ Pandas DataFrame
df = load_data(SHEET_CSV_URL)

# ถ้าระบบโหลดข้อมูลไม่ได้ ให้หยุดการทำงานของหน้าเว็บ
if df.empty:
    st.stop()

# --- 3. แถบเครื่องมือด้านข้าง (Sidebar) สำหรับตัวกรองข้อมูล (Filters) ---
st.sidebar.header("🔍 ตัวกรองข้อมูล (Filters)")

# ดึงรายการอำเภอและประเภทสถานีออกมาเพื่อทำเป็นชุดกรองตัวเลือก
districts = df["อำเภอ"].unique().tolist()
types = df["Type"].unique().tolist()

# กล่องเลือกอำเภอ (เลือกได้หลายอัน)
selected_districts = st.sidebar.multiselect(
    "เลือกอำเภอ",
    options=districts,
    default=districts # ค่าเริ่มต้นให้แสดงทุกอำเภอ
)

# กล่องเลือกประเภทสถานี
selected_types = st.sidebar.multiselect(
    "เลือก Type สถานี",
    options=types,
    default=types
)

# สไลเดอร์ความคืบหน้าขั้นต่ำ
min_foundation_progress = st.sidebar.slider(
    "ความคืบหน้าฐานรากขั้นต่ำ (%)",
    min_value=0,
    max_value=100,
    value=0,
    step=5
)

# --- 4. กรองข้อมูลตามที่ผู้ใช้เลือกใน Sidebar ---
# ฟิลเตอร์ตามค่าที่ถูกเลือก
filtered_df = df[
    (df["อำเภอ"].isin(selected_districts)) &
    (df["Type"].isin(selected_types)) &
    (df["ความคืบหน้าฐานราก (%)"] >= min_foundation_progress)
]

# --- 5. แสดงผลลัพธ์บนหน้าเว็บ (Main Content) ---

# ถ้ารายการกรองออกมาแล้วไม่มีข้อมูล
if filtered_df.empty:
    st.warning("⚠️ ไม่มีข้อมูลสถานีที่ตรงกับเงื่อนไขการค้นหาของคุณ")
else:
    # 5.1 แสดงตัวเลขสรุปภาพรวม (KPI Metrics)
    st.subheader("📌 สรุปภาพรวม (KPI)")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric(label="จำนวนสถานีทั้งหมดที่พบ", value=f"{len(filtered_df)} สถานี")
    with col2:
        avg_foundation = filtered_df["ความคืบหน้าฐานราก (%)"].mean()
        st.metric(label="ความคืบหน้าฐานราก (เฉลี่ย)", value=f"{avg_foundation:.1f}%")
    with col3:
        avg_post = filtered_df["งานติดตั้งเสา (%)"].mean()
        st.metric(label="งานติดตั้งเสา (เฉลี่ย)", value=f"{avg_post:.1f}%")
        
    st.divider() # ขีดเส้นกั้น

    # 5.2 กราฟพาย (Pie Chart) - สรุปความคืบหน้าเฉลี่ยรายอำเภอ
    st.subheader("📈 สัดส่วนและกราฟเปรียบเทียบ")
    
    chart_col1, chart_col2 = st.columns(2)
    
    with chart_col1:
        # หากมีการเลือกไว้หลายอำเภอ จะแสดงการกระจายตัว
        avg_by_district = filtered_df.groupby("อำเภอ")["ความคืบหน้าฐานราก (%)"].mean().reset_index()
        fig_pie = px.pie(
            avg_by_district, 
            values='ความคืบหน้าฐานราก (%)', 
            names='อำเภอ', 
            title='ค่าเฉลี่ยความคืบหน้าฐานราก แบ่งตามอำเภอ',
            hole=0.4 # ทำช่องว่างตรงกลางให้เป็นแบบ Donut chart
        )
        st.plotly_chart(fig_pie, use_container_width=True)
        
    with chart_col2:
        # 5.3 กราฟแท่ง (Bar Chart) - เปรียบเทียบสถานีรายชื่อ
        fig_bar = px.bar(
            filtered_df, 
            x="ชื่อสถานีลูกข่าย", 
            y=["ความคืบหน้าฐานราก (%)", "งานติดตั้งเสา (%)"],
            title="ความคืบหน้าของแต่ละสถานี",
            barmode="group" # จัดแท่งกราฟไว้ข้างๆ กัน
        )
        # จัดระเบียบการเรียงตัวอักษรของแกน x ถ้ามีชื่อสถานีเยอะ
        fig_bar.update_layout(xaxis_tickangle=-45)
        st.plotly_chart(fig_bar, use_container_width=True)

    st.divider()

    # 5.4 แผนที่ตำแหน่งจุดติดตั้งสถานี (Folium Map)
    st.subheader("🗺️ แผนที่พิกัดสถานี")
    
    # คำนวณจุดกึ่งกลางของแผนที่จากข้อมูลที่กรองแล้ว
    map_center = [filtered_df['lat'].mean(), filtered_df['lon'].mean()]
    m = folium.Map(location=map_center, zoom_start=11)

    # วนลูปเพื่อปักหมุด
    for idx, row in filtered_df.iterrows():
        # กำหนดเงื่อนไขสีตามความคืบหน้าฐานราก
        progress_val = row["ความคืบหน้าฐานราก (%)"]
        if progress_val > 80:
            marker_color = "green"
        elif progress_val <= 25:
            marker_color = "red"
        else:
            marker_color = "orange"
        
        # ใส่ชื่อและเปอร์เซ็นต์เวลากดหมุด
        popup_text = f"<b>{row['ชื่อสถานีลูกข่าย']}</b><br>Type: {row['Type']}<br>ฐานราก: {progress_val}%<br>ติดตั้งเสา: {row['งานติดตั้งเสา (%)']}%"
        
        folium.Marker(
            location=[row['lat'], row['lon']],
            popup=folium.Popup(popup_text, max_width=300),
            tooltip=row['ชื่อสถานีลูกข่าย'],
            icon=folium.Icon(color=marker_color, icon="info-sign")
        ).add_to(m)

    # แสดงแผนที่ในหน้าเว็บ (สามารถปรับความกว้างได้)
    st_data = st_folium(m, width=900, height=500)

    st.divider()

    # 5.5 ตารางข้อมูลดิบที่กรองแล้ว
    st.subheader("📋 ตารางรายชื่อสถานี (ข้อมูลอัปเดต)")
    st.dataframe(
        filtered_df[["อำเภอ", "ชื่อสถานีลูกข่าย", "Type", "ความคืบหน้าฐานราก (%)", "งานติดตั้งเสา (%)", "lat", "lon"]],
        use_container_width=True,
        hide_index=True 
    )
