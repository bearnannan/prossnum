import { useState, useMemo, useEffect } from "react";

export function useDashboard(data: any[], activeCategory: 'station' | 'client') {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("All");

  useEffect(() => {
    setSelectedProvince("All");
  }, [activeCategory]);

  const provinces = useMemo(() => Array.from(new Set(data.map(d => d.province).filter(Boolean))) as string[], [data]);
  const districts = useMemo(() => Array.from(new Set(data.map(d => d.district).filter(Boolean))) as string[], [data]);

  const filteredData = useMemo(() => data.filter(item => {
    const matchesSearch = item.stationName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.district || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.province || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDistrict = filterDistrict === "All" || item.district === filterDistrict;
    const matchesProvince = selectedProvince === "All" || item.province === selectedProvince;
    const matchesStatus = filterStatus === "All" || 
                          (filterStatus === "Completed" && (item.endDate && item.endDate !== "-")) || 
                          (filterStatus === "In Progress" && (item.startDate && item.startDate !== "-" && !item.endDate));
    return matchesSearch && matchesDistrict && matchesProvince && matchesStatus;
  }), [data, searchTerm, filterDistrict, selectedProvince, filterStatus]);

  const sortedData = useMemo(() => [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key] ?? "";
    const bVal = b[sortConfig.key] ?? "";
    return sortConfig.direction === "asc" ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
  }), [filteredData, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key: key, direction: prev?.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  const overallProgress = filteredData.length > 0 ? Math.round(filteredData.reduce((acc, d) => {
    const p = activeCategory === 'client' 
      ? (parseFloat(d.electricProgress || 0) + parseFloat(d.groundProgress || 0) + parseFloat(d.feederProgress || 0)) / 3
      : (parseFloat(d.foundationProgress || 0) + parseFloat(d.poleInstallationProgress || 0)) / 2;
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
