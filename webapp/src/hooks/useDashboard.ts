import { useState, useMemo } from "react";

export interface DashboardItem {
  id?: string | number;
  province?: string;
  district?: string;
  stationName?: string;
  startDate?: string;
  endDate?: string;
  remark?: string;
  electricProgress?: string | number;
  groundProgress?: string | number;
  feederProgress?: string | number;
  foundationProgress?: string | number;
  poleInstallationProgress?: string | number;
  [key: string]: unknown;
}

export function useDashboard(
  data: DashboardItem[], 
  activeCategory: 'station' | 'client', 
  searchTerm: string,
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>,
  deferredSearchTerm: string
) {
  const currentSearchTerm = deferredSearchTerm;
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("All");

  const [prevCategory, setPrevCategory] = useState(activeCategory);
  if (activeCategory !== prevCategory) {
    setPrevCategory(activeCategory);
    setSelectedProvince("All");
  }

  const provinces = useMemo(() => Array.from(new Set(data.map(d => d.province).filter(Boolean))) as string[], [data]);
  const districts = useMemo(() => Array.from(new Set(data.map(d => d.district).filter(Boolean))) as string[], [data]);

  const filteredData = useMemo(() => data.filter(item => {
    const term = currentSearchTerm.toLowerCase();
    const matchesSearch = !term || 
                          (item.stationName || "").toLowerCase().includes(term) || 
                          (item.district || "").toLowerCase().includes(term) ||
                          (item.province || "").toLowerCase().includes(term);
    const matchesDistrict = filterDistrict === "All" || item.district === filterDistrict;
    const matchesProvince = selectedProvince === "All" || item.province === selectedProvince;
    const matchesStatus = filterStatus === "All" || 
                          (filterStatus === "Completed" && (item.endDate && item.endDate !== "-")) || 
                          (filterStatus === "In Progress" && (item.startDate && item.startDate !== "-" && !item.endDate));
    return matchesSearch && matchesDistrict && matchesProvince && matchesStatus;
  }), [data, currentSearchTerm, filterDistrict, selectedProvince, filterStatus]);

  const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = String(a[sortConfig.key] ?? "");
    const bVal = String(b[sortConfig.key] ?? "");
    return sortConfig.direction === "asc" ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
  }), [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key: key, direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  const overallProgress = filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => {
    const p = activeCategory === 'client' 
      ? (parseFloat(String(d.electricProgress || 0)) + parseFloat(String(d.groundProgress || 0)) + parseFloat(String(d.feederProgress || 0))) / 3
      : (parseFloat(String(d.foundationProgress || 0)) + parseFloat(String(d.poleInstallationProgress || 0))) / 2;
    return acc + p;
  }, 0) / filteredData.length) : 0;

  return {
    searchTerm, setSearchTerm,
    filterDistrict, setFilterDistrict,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    sortConfig, setSortConfig,
    selectedProvince, setSelectedProvince,
    provinces, districts,
    filteredData, sortedData,
    handleSort,
    overallProgress
  };
}
