import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";
import { logAction } from "@/lib/audit";

// ── TS 5.3: Discriminated union for dataset routing ────────────────────────
type DatasetType = "station" | "client";

function parseDatasetType(raw: string | null): DatasetType {
    switch (raw) {
        case "client": return "client";
        default:       return "station";
    }
}

// ── Supabase raw row helpers (eliminates item: any) ────────────────────────
interface SupabaseStationRow {
    id: string;
    province: string | null;
    district: string;
    station_name: string;
    base_type: string | null;
    type: string;
    foundation_progress: number;
    pole_progress: number;
    latitude: number;
    longitude: number;
    pole_height: string | null;
    start_date: string | null;
    end_date: string | null;
    remark: string | null;
    updated_at: string;
}

interface SupabaseClientRow {
    id: string;
    province: string | null;
    district: string;
    station_name: string;
    latitude: number;
    longitude: number;
    pole_height: string;
    electric_progress: number;
    electric_main: string;
    ground_progress: number;
    ground_ac: string;
    ground_equip: string;
    feeder_progress: number;
    yagi_no: string;
    sn: string | null;
    feed_distance: string;
    tower_progress: number;
    radio_progress: number;
    radio_sn: string | null;
    battery_sn: string;
    rssi: string;
    remark: string | null;
    start_date: string | null;
    end_date: string | null;
    mount_type: string | null;
    angle: string | null;
    test_feeder: string | null;
    meter_request: string | null;
    meter_installed: boolean;
    pea_user_no: string | null;
    meter_no: string | null;
    updated_at: string;
}

// ── Exported data interfaces (TS 5.3: strict literal unions) ──────────────
export interface StationData {
    id?: string;
    province?: string;
    district: string;
    stationName: string;
    baseType?: "แผ่" | "เข็ม";        // strict literal union
    type: "A" | "B" | "C";            // strict literal union
    foundationProgress: number;
    poleInstallationProgress: number;
    lat: number;
    lon: number;
    poleHeight?: string;
    startDate?: string;
    endDate?: string;
    remark?: string;
    updated_at?: string;
}

export interface ClientSystemData {
    id?: string;
    province?: string;
    district: string;
    stationName: string;
    lat: number;
    lon: number;
    poleHeight: string;
    electricProgress: number;
    electricMain: string;
    groundProgress: number;
    groundAC: string;
    groundEquip: string;
    feederProgress: number;
    yagiNo: string;
    sn: string;
    feedDistance: string;
    towerProgress: number;
    radioProgress: number;
    radioSN: string;
    batterySN: string;
    rssi: string;
    remark?: string;
    startDate?: string;
    endDate?: string;
    mountType?: string;
    angle?: string;
    testFeeder?: "ยังไม่ได้เก็บ" | "เก็บแล้ว" | string; // loose for flexibility
    meterRequest?: "ยังไม่ได้ยื่น" | "รออนุมัติ" | "ติดตั้งแล้ว" | string;
    meterInstalled?: boolean;
    peaUserNo?: string;
    meterNo?: string;
    updated_at?: string;
}

// ── Mappers ────────────────────────────────────────────────────────────────
function mapStation(item: SupabaseStationRow): StationData {
    return {
        id: item.id,
        province: item.province ?? "",
        district: item.district,
        stationName: item.station_name,
        baseType: (item.base_type as StationData["baseType"]) ?? undefined,
        type: (item.type as StationData["type"]) ?? "C",
        foundationProgress: item.foundation_progress,
        poleInstallationProgress: item.pole_progress,
        lat: item.latitude,
        lon: item.longitude,
        poleHeight: item.pole_height ?? undefined,
        startDate: item.start_date ?? undefined,
        endDate: item.end_date ?? undefined,
        remark: item.remark ?? undefined,
        updated_at: item.updated_at,
    };
}

function mapClient(item: SupabaseClientRow): ClientSystemData {
    return {
        id: item.id,
        province: item.province ?? "",
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
        sn: item.sn ?? "",
        feedDistance: item.feed_distance,
        towerProgress: item.tower_progress,
        radioProgress: item.radio_progress,
        radioSN: item.radio_sn ?? "",
        batterySN: item.battery_sn,
        rssi: item.rssi,
        remark: item.remark ?? undefined,
        startDate: item.start_date ?? undefined,
        endDate: item.end_date ?? undefined,
        mountType: item.mount_type ?? undefined,
        angle: item.angle ?? undefined,
        testFeeder: item.test_feeder ?? undefined,
        meterRequest: item.meter_request ?? undefined,
        meterInstalled: item.meter_installed,
        peaUserNo: item.pea_user_no ?? "",
        meterNo: item.meter_no ?? "",
        updated_at: item.updated_at,
    };
}

// ── Route Handlers ─────────────────────────────────────────────────────────
export async function GET(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const datasetType = parseDatasetType(searchParams.get("dataset"));

        // TS 5.3: Switch-case narrowing — compiler knows exact type in each branch
        switch (datasetType) {
            case "client": {
                const { data, error } = await supabase
                    .from("client_systems")
                    .select("*")
                    .order("created_at", { ascending: false });
                if (error) throw error;
                const mappedData = (data as SupabaseClientRow[]).map(mapClient);
                return NextResponse.json({ data: mappedData }, { headers: { "Cache-Control": "no-store, max-age=0" } });
            }
            case "station": {
                const { data, error } = await supabase
                    .from("stations")
                    .select("*")
                    .order("created_at", { ascending: false });
                if (error) throw error;
                const mappedData = (data as SupabaseStationRow[]).map(mapStation);
                return NextResponse.json({ data: mappedData }, { headers: { "Cache-Control": "no-store, max-age=0" } });
            }
        }
    } catch (error: unknown) {
        // TS 5.3: error: unknown — must narrow before accessing .message
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in GET /api/dashboard-data:", error);
        return NextResponse.json({ error: "Failed to fetch data from Supabase", details: message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const datasetType = parseDatasetType(searchParams.get("dataset"));
        const body = await req.json() as Record<string, unknown>;

        switch (datasetType) {
            case "client": {
                const data = body as unknown as ClientSystemData;
                const { data: dataInsert, error } = await supabase.from("client_systems").insert([{
                    province: data.province,
                    district: data.district,
                    station_name: data.stationName,
                    latitude: Number(data.lat),
                    longitude: Number(data.lon),
                    pole_height: data.poleHeight,
                    electric_progress: Number(data.electricProgress),
                    electric_main: data.electricMain,
                    ground_progress: Number(data.groundProgress),
                    ground_ac: data.groundAC,
                    ground_equip: data.groundEquip,
                    feeder_progress: Number(data.feederProgress),
                    yagi_no: data.yagiNo,
                    sn: data.sn,
                    feed_distance: data.feedDistance,
                    tower_progress: Number(data.towerProgress),
                    radio_progress: Number(data.radioProgress),
                    radio_sn: data.radioSN,
                    battery_sn: data.batterySN,
                    rssi: data.rssi,
                    remark: data.remark,
                    start_date: data.startDate || null,
                    end_date: data.endDate || null,
                    mount_type: data.mountType,
                    angle: data.angle,
                    test_feeder: data.testFeeder,
                    meter_request: data.meterRequest,
                    meter_installed: data.meterInstalled ?? false,
                    pea_user_no: data.peaUserNo || "",
                    meter_no: data.meterNo || "",
                }]).select().single();
                if (error) throw error;
                if (dataInsert) {
                    await logAction({
                        userId: session.user?.id || "unknown",
                        userName: session.user?.name || undefined,
                        action: "CREATE",
                        tableName: "client_systems",
                        recordId: dataInsert.id,
                        payload: body,
                    });
                }
                break;
            }
            case "station": {
                const data = body as unknown as StationData;
                const { data: dataInsert, error } = await supabase.from("stations").insert([{
                    province: data.province,
                    district: data.district,
                    station_name: data.stationName,
                    base_type: data.baseType,
                    type: data.type,
                    foundation_progress: Number(data.foundationProgress),
                    pole_progress: Number(data.poleInstallationProgress),
                    latitude: Number(data.lat),
                    longitude: Number(data.lon),
                    pole_height: data.poleHeight,
                    start_date: data.startDate || null,
                    end_date: data.endDate || null,
                    remark: data.remark,
                }]).select().single();
                if (error) throw error;
                if (dataInsert) {
                    await logAction({
                        userId: session.user?.id || "unknown",
                        userName: session.user?.name || undefined,
                        action: "CREATE",
                        tableName: "stations",
                        recordId: dataInsert.id,
                        payload: body,
                    });
                }
                break;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in POST /api/dashboard-data:", error);
        return NextResponse.json({ error: "Failed to insert data into Supabase", details: message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const datasetType = parseDatasetType(searchParams.get("dataset"));
        const body = await req.json() as Record<string, unknown>;

        if (!body.id) {
            return NextResponse.json({ error: "Missing ID for update operation" }, { status: 400 });
        }

        switch (datasetType) {
            case "client": {
                const data = body as unknown as ClientSystemData;
                const { error } = await supabase.from("client_systems").update({
                    province: data.province,
                    district: data.district,
                    station_name: data.stationName,
                    latitude: Number(data.lat),
                    longitude: Number(data.lon),
                    pole_height: data.poleHeight,
                    electric_progress: Number(data.electricProgress),
                    electric_main: data.electricMain,
                    ground_progress: Number(data.groundProgress),
                    ground_ac: data.groundAC,
                    ground_equip: data.groundEquip,
                    feeder_progress: Number(data.feederProgress),
                    yagi_no: data.yagiNo,
                    sn: data.sn,
                    feed_distance: data.feedDistance,
                    tower_progress: Number(data.towerProgress),
                    radio_progress: Number(data.radioProgress),
                    radio_sn: data.radioSN,
                    battery_sn: data.batterySN,
                    rssi: data.rssi,
                    remark: data.remark,
                    start_date: data.startDate || null,
                    end_date: data.endDate || null,
                    mount_type: data.mountType,
                    angle: data.angle,
                    test_feeder: data.testFeeder,
                    meter_request: data.meterRequest,
                    meter_installed: data.meterInstalled ?? false,
                    pea_user_no: data.peaUserNo || "",
                    meter_no: data.meterNo || "",
                }).eq("id", body.id as string);
                if (error) throw error;
                await logAction({
                    userId: session.user?.id || "unknown",
                    userName: session.user?.name || undefined,
                    action: "UPDATE",
                    tableName: "client_systems",
                    recordId: body.id as string,
                    payload: body,
                });
                break;
            }
            case "station": {
                const data = body as unknown as StationData;
                const { error } = await supabase.from("stations").update({
                    province: data.province,
                    district: data.district,
                    station_name: data.stationName,
                    base_type: data.baseType,
                    type: data.type,
                    foundation_progress: Number(data.foundationProgress),
                    pole_progress: Number(data.poleInstallationProgress),
                    latitude: Number(data.lat),
                    longitude: Number(data.lon),
                    pole_height: data.poleHeight,
                    start_date: data.startDate || null,
                    end_date: data.endDate || null,
                    remark: data.remark,
                }).eq("id", body.id as string);
                if (error) throw error;
                await logAction({
                    userId: session.user?.id || "unknown",
                    userName: session.user?.name || undefined,
                    action: "UPDATE",
                    tableName: "stations",
                    recordId: body.id as string,
                    payload: body,
                });
                break;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in PUT /api/dashboard-data:", error);
        return NextResponse.json({ error: "Failed to update data in Supabase", details: message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const datasetType = parseDatasetType(searchParams.get("dataset"));
        const body = await req.json() as { id?: string };

        if (!body.id) {
            return NextResponse.json({ error: "Missing ID for delete operation" }, { status: 400 });
        }

        const tableName = datasetType === "client" ? "client_systems" : "stations";
        const { error } = await supabase.from(tableName).delete().eq("id", body.id);
        if (error) throw error;

        await logAction({
            userId: session.user?.id || "unknown",
            userName: session.user?.name || undefined,
            action: "DELETE",
            tableName: tableName,
            recordId: body.id,
        });

        return NextResponse.json({ success: true, message: "Record deleted successfully" });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error in DELETE /api/dashboard-data:", error);
        return NextResponse.json({ error: "Failed to delete data from Supabase", details: message }, { status: 500 });
    }
}
