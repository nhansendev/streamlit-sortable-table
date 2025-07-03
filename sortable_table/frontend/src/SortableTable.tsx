import { range } from "lodash"
import React, {
  Fragment,
  useEffect,
  useState,
} from "react"
import {
  ArrowTable,
  ComponentProps,
  Streamlit,
  withStreamlitConnection,
} from "streamlit-component-lib"

// Props for the Table component, expects an ArrowTable element
interface TableProps {
  element: ArrowTable
  maxPage?: number
  initialPage?: number
  paginated?: boolean
  columnWidths?: (number | string)[]
  maxHeight?: string
  styleOverrides?: React.CSSProperties
}

const DEFAULT_MAX_PAGE = 99999

const Table: React.FC<TableProps> = ({ element, maxPage = DEFAULT_MAX_PAGE, initialPage = 0 , paginated=true, columnWidths, maxHeight='600px', styleOverrides}) => {
  // State for current page, initialized from props or 0
  const [page, setPage] = useState(initialPage)

  // State to keep track of current sort column and direction
  const [sortState, setSortState] = useState<{ column: string; direction: "asc" | "desc" } | null>(null)

  // Send combined state to Streamlit on change
  useEffect(() => {
    Streamlit.setComponentValue({
      page,
      sort: sortState,
    })
  }, [page, sortState])

  // Handles sorting logic when a header is clicked
  const handleSort = (column: string) => {
    if (!sortState || sortState.column !== column) {
      // Not sorted or sorting a new column: start with ascending
      setSortState({ column, direction: "asc" })
    } else if (sortState.direction === "asc") {
      // Was ascending: switch to descending
      setSortState({ column, direction: "desc" })
    } else if (sortState.direction === "desc") {
      // Was descending: remove sort (unsorted)
      setSortState(null)
    }
  }

  function parseStyleOverrides(styleOverrides?: string): Record<string, string> {
    if (!styleOverrides) return {};
    return styleOverrides
      .split(";")
      .map(s => s.trim())
      .filter(Boolean)
      .reduce((acc, curr) => {
        const [key, value] = curr.split(":").map(s => s.trim());
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    }

  // Table metadata
  const table = element
  const hasHeader = table.headerRows > 0
  const hasData = table.dataRows > 0
  const id = table.uuid ? "T_" + table.uuid : undefined

  // Exclude index column, accounting for empty dataframes
  const nonIndexColumns = table.rows > 1 ? range(1, table.columns) : range(0, table.columns);

  return (
    <>
      <div className="streamlit-table stDataFrame"
      style={parseStyleOverrides(styleOverrides as any)}
      >
        {/* Inline CSS for theming and table styling */}
        <style>
          {`
            :root {
              --header-color: #222222;
              --header-bg:rgb(177, 177, 177);
              --header-sort:rgb(211, 211, 211);
              --body-color: #000000;
              --body-bg:rgb(245, 245, 245);
              --highlight-color:rgb(0, 0, 0);
              --highlight-bg:rgb(211, 211, 211);
              --border-color:rgb(56, 56, 56);
              --font-size: 12px;
            }

            @media (prefers-color-scheme: dark) {
              :root {
                --header-color:rgb(221, 221, 221);
                --header-bg:rgb(34, 33, 44);
                --header-sort:rgb(88, 88, 88);
                --body-color:rgb(255, 255, 255);
                --body-bg:rgb(18, 18, 24);
                --highlight-color:rgb(255, 255, 255);
                --highlight-bg:rgb(61, 61, 61);
                --border-color:rgb(61, 61, 61);
                --font-size: 12px;
              }
            }
            
            table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              background-color: var(--body-bg);
              border none;
              font-family: var(--font);
              font-size: var(--font-size);
            }

            .stDataFrameContainer {
              overflow-x: auto;
              overflow-y: auto;
              border-radius: 12px;
              border: 1px solid var(--border-color);
            }

            .table thead th {
              background-color: var(--header-bg);  
              border: none;
              position: sticky;
              top: 0;
              z-index: 10;
              outline: 1px solid var(--border-color);
              outline-offset: -1px;
            }

            th, td {
              padding: 1rem 1.5rem;
              border: 1px solid var(--border-color);
              font-size: 14px;
              text-align: left;
              color: var(--body-color);
              font-size: var(--font-size);
            }

            thead th:hover {
              background-color: var(--highlight-bg);
              color: var(--highlight-color);
              // text-decoration: underline;
            }

            // tbody tr:nth-child(even) {
            //   background-color: var(--secondary-background-color);
            // }

            .sorted-column {
              background-color: var(--header-sort);
              // color: var(--highlight-color);
            }

            tbody tr:hover {
              background-color: var(--highlight-bg);
              color: var(--highlight-color);
              // transition: background 0.1s;
            }

            tbody tr:hover th,
            tbody tr:hover td {
              color: var(--highlight-color);
            }

            .pagination-footer, .pagination-footer * {
              font-size: var(--font-size);
            }
          `}
        </style>

        {/* Table container with scroll and rounded corners */}
        <div className="stDataFrameContainer" style={{ overflowX: "auto", maxHeight: maxHeight, overflowY: "auto" }}>
          <table
            id={id}
            className="table"
            style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}
            key={JSON.stringify(columnWidths)}
          >
            {/* Add colgroup for column widths */}
            {columnWidths && (
              <colgroup>
                {nonIndexColumns.map((colIdx, i) => (
                  <col
                    key={colIdx}
                    style={{
                      width: typeof columnWidths[i] === "number"
                        ? `${columnWidths[i]}px`
                        : columnWidths[i] || undefined,
                    }}
                  />
                ))}
              </colgroup>
            )}
            {hasHeader && (
              <thead>
                {/* Remove formatCell prop */}
                <TableRows isHeader={true} table={table} sortState={sortState ?? undefined} onSort={handleSort} />
              </thead>
            )}
            <tbody>
              {hasData ? (
                // Remove formatCell prop
                <TableRows isHeader={false} table={table} />
              ) : (
                // Show "empty" if no data
                <tr>
                  <td colSpan={table.columns || 1}>empty</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination footer (external control) */}
        {paginated && (
          <div className="pagination-footer" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 8 }}>
            <button onClick={() => setPage(0)} disabled={page === 0}>&laquo;</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ marginLeft: 4 }}>&lsaquo;</button>
            <span style={{ margin: "0 8px" }}>
              {page + 1}
            </span>
            <button onClick={() => setPage(p => Math.min(maxPage - 1, p + 1))} disabled={page >= maxPage - 1} style={{ marginRight: 4 }}>&rsaquo;</button>
            <button onClick={() => setPage(maxPage - 1)} disabled={page >= maxPage - 1}>&raquo;</button>
          </div>
        )}
      </div>
    </>
  )
}

// Props for TableRows: controls header/data rendering and sorting
interface TableRowsProps {
  isHeader: boolean
  table: ArrowTable
  sortState?: { column: string; direction: "asc" | "desc" }
  onSort?: (column: string) => void
}

interface TableRowProps {
  rowIndex: number
  table: ArrowTable
  sortState?: { column: string; direction: "asc" | "desc" }
  onSort?: (column: string) => void
}

// Update TableRows and TableRow to not expect formatCell
const TableRows: React.FC<TableRowsProps> = (props) => {
  const { isHeader, table, sortState, onSort } = props
  const { headerRows, rows } = table
  const startRow = isHeader ? 0 : headerRows
  const endRow = isHeader ? headerRows : rows

  // Map each row index to a <tr> with its cells
  const tableRows = range(startRow, endRow).map((rowIndex) => (
    <tr key={rowIndex}>
      <TableRow
        rowIndex={rowIndex}
        table={table}
        sortState={sortState}
        onSort={onSort}
      />
    </tr>
  ))

  return <Fragment>{tableRows}</Fragment>
}

// Props for a single table row
interface TableRowProps {
  rowIndex: number
  table: ArrowTable
  sortState?: { column: string; direction: "asc" | "desc" }
  onSort?: (column: string) => void
}

// Renders a single table row (header or data)
const TableRow: React.FC<TableRowProps> = (props) => {
  const { rowIndex, table, sortState, onSort } = props
  const { columns } = table

  // Exclude index column, accounting for empty dataframes
  const nonIndexColumns = table.rows > 1 ? range(1, columns) : range(0, columns);

  const columnNames = table.headerRows > 0
    ? nonIndexColumns.map(colIdx => table.getCell(0, colIdx).content?.toString() ?? "")
    : nonIndexColumns.map(colIdx => colIdx.toString());

  // Render each cell in the row
  const cells = nonIndexColumns.map((columnIndex, i) => {
    const { classNames, content, id, type } = table.getCell(
      rowIndex,
      columnIndex
    )
    // Replace empty content with empty string, or convert content to string
    const formattedContent = (content ?? "").toString()
    const colName = columnNames[i];

    // Determine if this column is currently sorted
    const isSorted = sortState?.column === colName
    const arrow = isSorted ? (sortState?.direction === "asc" ? " ▲" : " ▼") : " ▲▼"

    switch (type) {
      case "blank":
        // Render blank header cell
        return <th key={columnIndex} className={classNames} />
      case "columns":
        // Render header cell with sorting
        return (
          <th
            key={columnIndex}
            scope="col"
            id={id}
            className={`${classNames} ${isSorted ? "sorted-column" : ""}`}
            onClick={() => onSort?.(colName)}
            style={{ cursor: "pointer", userSelect: "none" }}
            title={`Sort by ${colName}`}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") onSort?.(colName)
            }}
          >
            {colName + arrow}
          </th>
        )
      case "data":
        // Render data cell
        return (
          <td key={columnIndex} id={id} className={classNames}>
            {formattedContent}
          </td>
        )
      default:
        throw new Error(`Cannot parse type "${type}".`)
    }
  })

  return <Fragment>{cells}</Fragment>
}

// Main component for Streamlit integration
const SortableTable: React.FC<ComponentProps> = (props) => {
  // Resize Streamlit iframe to fit content
  useEffect(() => {
    Streamlit.setFrameHeight()
  })

  // Pass maxPage and initialPage from props.args if provided
  return (
    <Table
      element={props.args.data}
      maxPage={props.args.maxPage}
      initialPage={props.args.initialPage}
      paginated={props.args.paginated}
      columnWidths={props.args.columnWidths}
      maxHeight={props.args.maxHeight}
      styleOverrides={props.args.styleOverrides}
    />
  )
}

export default withStreamlitConnection(SortableTable)
