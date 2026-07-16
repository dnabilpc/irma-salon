"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string | React.ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number | boolean | Date;
  render?: (item: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  searchableKeys?: (keyof T | string)[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyMessage?: string;
  headerRightElement?: React.ReactNode;
  rowKey?: keyof T | ((item: T) => string | number);
  loading?: boolean;
  onRefresh?: () => void;
  isRevalidating?: boolean;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Cari data...",
  searchableKeys,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 10,
  emptyMessage = "Tidak ada data yang ditemukan.",
  headerRightElement,
  rowKey,
  loading = false,
  onRefresh,
  isRevalidating = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 1. Filtered Data (Search)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const q = searchQuery.toLowerCase().trim();

    return data.filter((item) => {
      if (searchableKeys && searchableKeys.length > 0) {
        return searchableKeys.some((k) => {
          const val = item[k as string];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        });
      }

      // Default: search all string/number properties
      return Object.values(item).some(
        (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, searchableKeys]);

  // 2. Sorted Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = col.sortValue ? col.sortValue(a) : a[sortKey];
      let valB = col.sortValue ? col.sortValue(b) : b[sortKey];

      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";

      if (typeof valA === "string" && typeof valB === "string") {
        const comp = valA.localeCompare(valB, "id", { sensitivity: "base" });
        return sortDirection === "asc" ? comp : -comp;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // 3. Paginated Data
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const paginatedData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  // Handle Sort Toggle
  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Reset page when search or page size changes
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div style={{ width: "100%", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Page Size Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#6B3A2A" }}>
          <span>Tampilkan</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #EDD8CC",
              background: "white",
              color: "#2C1A0E",
              fontSize: "0.82rem",
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>entries per halaman</span>
        </div>

        {/* Right Section: Search Input + Action Elements */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "220px" }}>
            <span
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "0.85rem",
                color: "#C9922A",
                pointerEvents: "none",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "8px",
                border: "1px solid #EDD8CC",
                background: "white",
                color: "#2C1A0E",
                fontSize: "0.82rem",
                outline: "none",
                transition: "border-color 0.2s",
                boxShadow: "0 1px 3px rgba(107,58,42,0.05)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C4788A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
            />
          </div>

          {isRevalidating && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.72rem", color: "#C9922A", background: "rgba(201,146,42,0.1)", border: "1px solid rgba(201,146,42,0.25)", padding: "4px 10px", borderRadius: "12px", fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ display: "inline-block", animation: "spin 1.5s linear infinite" }}>🔄</span>
              <span>Memperbarui...</span>
            </div>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Data dari DB"
              style={{
                background: "white",
                border: "1px solid #EDD8CC",
                color: "#6B3A2A",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.82rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C9922A")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EDD8CC")}
            >
              🔄 Refresh
            </button>
          )}

          {headerRightElement}
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #F0E0E6",
          boxShadow: "0 4px 16px rgba(196,120,138,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #FDF8F3, #FDF0F4)", borderBottom: "1.5px solid #F0E0E6" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key, col.sortable)}
                  style={{
                    padding: "12px 16px",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    color: "#7A5C50",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    width: col.width,
                    textAlign: col.align || "left",
                    cursor: col.sortable ? "pointer" : "default",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      justifyContent:
                        col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
                      width: "100%",
                    }}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span style={{ color: sortKey === col.key ? "#C4788A" : "#C4B0A8", flexShrink: 0 }}>
                        {sortKey === col.key ? (
                          sortDirection === "asc" ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          )
                        ) : (
                          <ArrowUpDown size={13} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "48px 16px", textAlign: "center", color: "#8B6A5A" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
                    <span>⏳ Memuat data...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: "48px 16px", textAlign: "center", color: "#8B6A5A" }}>
                  <div style={{ fontSize: "0.88rem" }}>{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => {
                const rKey = rowKey
                  ? typeof rowKey === "function"
                    ? rowKey(item)
                    : item[rowKey as string]
                  : item.id ?? startIndex + idx;

                return (
                  <tr
                    key={String(rKey)}
                    style={{
                      borderBottom: "1px solid #F5EBF0",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#FDF8F5")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: "12px 16px",
                          fontSize: "0.82rem",
                          color: "#2C1A0E",
                          textAlign: col.align || "left",
                          verticalAlign: "middle",
                        }}
                      >
                        {col.render ? col.render(item, startIndex + idx) : item[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info & Instant Pagination Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "16px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        {/* Entries Counter Info */}
        <div style={{ fontSize: "0.8rem", color: "#7A5C50", fontWeight: 500 }}>
          {totalEntries === 0 ? (
            "Menampilkan 0 data"
          ) : (
            <>
              Menampilkan <strong>{startIndex + 1}</strong> hingga <strong>{endIndex}</strong> dari{" "}
              <strong>{totalEntries}</strong> data
              {searchQuery && ` (difilter dari ${data.length} total data)`}
            </>
          )}
        </div>

        {/* Page Buttons Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={validCurrentPage <= 1}
            title="Halaman Pertama"
            style={btnPageStyle(false, validCurrentPage <= 1)}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={validCurrentPage <= 1}
            title="Halaman Sebelumnya"
            style={btnPageStyle(false, validCurrentPage <= 1)}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Dynamic Page Number Buttons */}
          {getPageNumbers(validCurrentPage, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} style={{ padding: "0 6px", color: "#B09080", fontSize: "0.8rem" }}>
                ...
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => setCurrentPage(p as number)}
                style={btnPageStyle(validCurrentPage === p, false)}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={validCurrentPage >= totalPages}
            title="Halaman Selanjutnya"
            style={btnPageStyle(false, validCurrentPage >= totalPages)}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={validCurrentPage >= totalPages}
            title="Halaman Terakhir"
            style={btnPageStyle(false, validCurrentPage >= totalPages)}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Button Style Helper
function btnPageStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "32px",
    height: "32px",
    padding: "0 6px",
    borderRadius: "6px",
    border: `1px solid ${active ? "#C4788A" : "#F0E0E6"}`,
    background: active ? "#C4788A" : "white",
    color: active ? "white" : disabled ? "#D0C0C8" : "#2C1A0E",
    fontSize: "0.78rem",
    fontWeight: active ? 700 : 500,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
  };
}

// Generate Page Numbers Array
function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  pages.push(1);

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);
  return pages;
}
