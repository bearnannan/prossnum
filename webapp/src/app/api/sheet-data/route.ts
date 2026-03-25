import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export interface StationData {
    id?: string;            // UUID from Supabase
    district: string;       // อำเภอ
    stationName: string;   // ชื่อสถานีลูกข่าย
    type: string;          // Type
    foundationProgress: number; // ความคืบหน้าฐานราก (%)
    poleInstallationProgress: number; // งานติดตั้งเสา (%)
    lat: number;           // lat
    lon: number;           // lon
    poleHeight?: string;   // ความสูงเสา
    startDate?: string;    // วันที่เริ่มงาน
    endDate?: string;      // วันที่เสร็จงาน
    remark?: string;       // หมายเหตุ
}

export interface ClientSystemData {
    id?: string;            // UUID from Supabase
    district: string;       // อำเภอ
    stationName: string;   // ชื่อสถานีลูกข่าย
    lat: number;            // lat
    lon: number;            // lon
    poleHeight: string;     // ความสูงเสา
    electricProgress: number; // ระบบไฟฟ้า (%)
    electricMain: string;   // ระยะสาย Main
    groundProgress: number;   // ระบบกราวด์ (%)
    groundAC: string;       // AC Ω
    groundEquip: string;    // Equip Ω
    feederProgress: number; // สาย Feeder (%)
    yagiNo: string;         // Yagi No
    sn: string;             // SN
    feedDistance: string;   // ระยะ feed
    towerProgress: number;  // การติดตั้งอุปกรณ์บนเสา (%)
    radioProgress: number;  // การติดตั้งเครื่องวิทยุฯ (%)
    linkProgress: number;   // การทดสอบสัญญาณ (%)
    radioSN: string;        // SN เครื่องวิทยุ MT680 Plus
    batterySN: string;      // SN แบตเตอรี่ 50AH
    rssi: string;           // ค่า RSSI dBm
    remark?: string;        // งานเพิ่มเติม / ปัญหาอุปสรรค
    startDate?: string;     // วันที่เริ่มงาน
    endDate?: string;       // วันที่เสร็จงาน
    mountType?: string;     // ขาติดตั้ง
    angle?: string;         // องศา
    testFeeder?: string;    // ค่า Test Feeder
    meterRequest?: string;  // ยื่นขอมิเตอร์
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";

        if (sheetType === "client") {
            const { data, error } = await supabase
                .from('client_systems')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData: ClientSystemData[] = data.map((item: any) => ({
                id: item.id,
                district: item.district,
                stationName: item.station_name,
                lat: item.latitude,
                lon: item.longitude,
                poleHeight: item.pole_height,
                electricProgress: item.electric_progress,
                electricMain: item.electric_main,
                groundProgress: item.ground_progress,
                groundAC: item.ground_ac,
                groundEquip: item.ground_equip,
                feederProgress: item.feeder_progress,
                yagiNo: item.yagi_no,
                sn: item.sn,
                feedDistance: item.feed_distance,
                towerProgress: item.tower_progress,
                radioProgress: item.radio_progress,
                linkProgress: item.link_progress,
                radioSN: item.radio_sn,
                batterySN: item.battery_sn,
                rssi: item.rssi,
                remark: item.remark,
                startDate: item.start_date,
                endDate: item.end_date,
                mountType: item.mount_type,
                angle: item.angle,
                testFeeder: item.test_feeder,
                meterRequest: item.meter_request
            }));

            return NextResponse.json({ data: mappedData }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
        } else {
            const { data, error } = await supabase
                .from('stations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedData: StationData[] = data.map((item: any) => ({
                id: item.id,
                district: item.district,
                stationName: item.station_name,
                type: item.type,
                foundationProgress: item.foundation_progress,
                poleInstallationProgress: item.pole_progress,
                lat: item.latitude,
                lon: item.longitude,
                poleHeight: item.pole_height,
                startDate: item.start_date,
                endDate: item.end_date,
                remark: item.remark
            }));

            return NextResponse.json({ data: mappedData }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
        }
    } catch (error: any) {
        console.error("Error in GET /api/sheet-data:", error);
        return NextResponse.json({ error: "Failed to fetch data from Supabase", details: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";
        const body = await req.json();

        if (sheetType === "client") {
            const data = body as ClientSystemData;
            const { error } = await supabase.from('client_systems').insert([{
                district: data.district,
                station_name: data.stationName,
                latitude: data.lat,
                longitude: data.lon,
                pole_height: data.poleHeight,
                electric_progress: data.electricProgress,
                electric_main: data.electricMain,
                ground_progress: data.groundProgress,
                ground_ac: data.groundAC,
                ground_equip: data.groundEquip,
                feeder_progress: data.feederProgress,
                yagi_no: data.yagiNo,
                sn: data.sn,
                feed_distance: data.feedDistance,
                tower_progress: data.towerProgress,
                radio_progress: data.radioProgress,
                link_progress: data.linkProgress || 0,
                radio_sn: data.radioSN,
                battery_sn: data.batterySN,
                rssi: data.rssi,
                remark: data.remark,
                start_date: data.startDate || null,
                end_date: data.endDate || null,
                mount_type: data.mountType,
                angle: data.angle,
                test_feeder: data.testFeeder,
                meter_request: data.meterRequest
            }]);
            if (error) throw error;
        } else {
            const data = body as StationData;
            const { error } = await supabase.from('stations').insert([{
                district: data.district,
                station_name: data.stationName,
                type: data.type,
                foundation_progress: data.foundationProgress,
                pole_progress: data.poleInstallationProgress,
                latitude: data.lat,
                longitude: data.lon,
                pole_height: data.poleHeight,
                start_date: data.startDate || null,
                end_date: data.endDate || null,
                remark: data.remark
            }]);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in POST /api/sheet-data:", error);
        return NextResponse.json({ error: "Failed to insert data into Supabase", details: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: "Missing ID for update operation" }, { status: 400 });
        }

        if (sheetType === "client") {
            const data = body as ClientSystemData;
            const { error } = await supabase.from('client_systems').update({
                district: data.district,
                station_name: data.stationName,
                latitude: data.lat,
                longitude: data.lon,
                pole_height: data.poleHeight,
                electric_progress: data.electricProgress,
                electric_main: data.electricMain,
                ground_progress: data.groundProgress,
                ground_ac: data.groundAC,
                ground_equip: data.groundEquip,
                feeder_progress: data.feederProgress,
                yagi_no: data.yagiNo,
                sn: data.sn,
                feed_distance: data.feedDistance,
                tower_progress: data.towerProgress,
                radio_progress: data.radioProgress,
                link_progress: data.linkProgress || 0,
                radio_sn: data.radioSN,
                battery_sn: data.batterySN,
                rssi: data.rssi,
                remark: data.remark,
                start_date: data.startDate || null,
                end_date: data.endDate || null,
                mount_type: data.mountType,
                angle: data.angle,
                test_feeder: data.testFeeder,
                meter_request: data.meterRequest
            }).eq('id', body.id);
            if (error) throw error;
        } else {
            const data = body as StationData;
            const { error } = await supabase.from('stations').update({
                district: data.district,
                station_name: data.stationName,
                type: data.type,
                foundation_progress: data.foundationProgress,
                pole_progress: data.poleInstallationProgress,
                latitude: data.lat,
                longitude: data.lon,
                pole_height: data.poleHeight,
                start_date: data.startDate || null,
                end_date: data.endDate || null,
                remark: data.remark
            }).eq('id', body.id);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error in PUT /api/sheet-data:", error);
        return NextResponse.json({ error: "Failed to update data in Supabase", details: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sheetType = searchParams.get("sheet") || "station";
        const body = await req.json();

        if (!body.id) {
            return NextResponse.json({ error: "Missing ID for delete operation" }, { status: 400 });
        }

        const tableName = sheetType === "client" ? "client_systems" : "stations";
        const { error } = await supabase.from(tableName).delete().eq('id', body.id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: "Record deleted successfully" });
    } catch (error: any) {
        console.error("Error in DELETE /api/sheet-data:", error);
        return NextResponse.json({ error: "Failed to delete data from Supabase", details: error.message }, { status: 500 });
    }
}

