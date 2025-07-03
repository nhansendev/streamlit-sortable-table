![image](https://github.com/user-attachments/assets/30b1e922-8a8b-4043-aa34-ec15df3e9cf5)

# streamlit-sortable-table
A custom streamlit component table that's useful for large datasets where manual pagination and sorting make more sense than trying to add the entire dataset to an `st.dataframe`.

Please let me know of any obvious improvements can be made.

## Features
- Sorting and pagination are manual: what you pass to the table is what you see
- Headers provide sort settings without affecting the data
- Optional pagination controls
- Adds vertical slider when height would exceed max height
- Configurable column widths
- Override style settings with "style_overrides"

## Usage
The component depends on the consistent memory of session states to keep track of page and sort parameters.

Recommended session states:
- st.session_state.sort_params
  - Tracks the `["sorted column", "asc" | "desc"]` pair
- st.session_state.page
  - Tracks the current paginated page
- st.session_state.retrigger
  - Forces frontend updates if needed (some dataframe updates do not trigger frontend updates)
 
Example implementation:
```
def main_table(df, max_page):
    # Toggle the retrigger state each rerun
    st.session_state.retrigger = not st.session_state.retrigger

    # If no sort_params are defined
    if not st.session_state.sort_params:
        # Use placeholders
        sort_col = None
        sort_dir = "asc"
    else:
        sort_col, sort_dir = st.session_state.sort_params

    sort_event = sortable_table(
        data=df, # a dataframe
        sort_column=sort_col,
        sort_direction=sort_dir,
        max_page=max_page,
        column_widths=[
            "5%",
            "12%",
            "12%",
            "10%",
            "8%",
            "4%",
            "10%",
            "4%",
            "",
            "4%",
            "4%",
        ], # values in pixels or pct
        key="custom_df",
        max_height="700px",
        retrigger=st.session_state.retrigger,
        style_overrides="--font-size: 12px;",
    )

    # Check if returned page has changed
    if st.session_state.page != sort_event["page"]:
        st.session_state.page = sort_event["page"]
        st.session_state.rerun_flag = True

    # Check if returned sort parameters have changed
    sort_info = sort_event["sort"]
    if sort_info:
        info = [sort_info["column"], sort_info["direction"]]
        if info != st.session_state.sort_params:
            st.session_state.sort_params = info
            st.session_state.rerun_flag = True
    else:
        # No sort was chosen, so reset to None
        if st.session_state.sort_params:
            st.session_state.sort_params = None
            st.session_state.rerun_flag = True
```

## Installation
TODO: pip release

For now a wheel can be found in the dist folder and installed via:

```pip install streamlit_sortable_table-0.0.1-py3-none-any.whl```

Uninstall:

```pip uninstall streamlit-sortable-table```


## Function Info
```
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
```
