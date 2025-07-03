import os
import streamlit.components.v1 as components

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
_RELEASE = True

if not _RELEASE:
    _sortable_table = components.declare_component(
        "sortable_table",
        url="http://localhost:3001",
    )
else:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _sortable_table = components.declare_component("sortable_table", path=build_dir)


def sortable_table(
    data,
    sort_column: str = None,
    sort_direction: str = "asc",
    paginated: bool = True,
    max_page: int = 99999,
    column_widths: list | None = None,
    retrigger: bool = False,
    max_height: str = "600px",
    style_overrides: str = "",
    cell_tooltips: dict | None = None,
    key=None,
):
    """
    Display a custom sortable table component with external pagination.

    Args:
        data (pd.DataFrame): Data to display.
        sort_column (str, optional): Column to sort by.
        sort_direction (str, optional): "asc" or "desc".
        paginated (bool, optional): Show the pagination controls
        max_page (int, optional): Maximum number of pages.
        column_widths (list, optional): set the widths of each column using pixels, CSS, etc.
        retrigger (bool, optional): toggle to trigger a frontend update
        max_height: (str, optional): Limits the max height of the table
        style_overrides: (str, optional): set style values to override defaults
        cell_tooltips: (dict, optional): Add tooltips in the format {col: [row1, row2, ...]}
        key: Streamlit component key.

    Returns:
        dict: {"column": str, "direction": "asc" | "desc"} when a column header is clicked,
                or None if nothing was clicked.
        int: The current page number (if changed by user).
    """

    # Convert DataFrame to ArrowTable (Streamlit handles this automatically)
    result = _sortable_table(
        data=data,
        sortColumn=sort_column,
        sortDirection=sort_direction,
        paginated=paginated,
        maxPage=max_page,
        columnWidths=column_widths or [],
        retrigger=retrigger,
        maxHeight=max_height,
        styleOverrides=style_overrides,
        cellTooltips=cell_tooltips or {},
        key=key,
    )

    # Always return a dict with both page and sort
    if isinstance(result, dict) and "page" in result:
        return result
    # If backend returns only int, wrap it
    return {"page": result, "sort": None}
