import streamlit as st
import pandas as pd
from sortable_table import sortable_table

df = pd.read_parquet(
    r"D:\Atom\streamlit_component\SortableTable\sortable_table\res.pkt"
)

PAGE_SIZE = 25
st.set_page_config(layout="wide")

# Session state to remember sort
if "sort_col" not in st.session_state:
    st.session_state.sort_col = None
    st.session_state.sort_dir = "asc"
    st.session_state.page = 0
    st.session_state.rerun_flag = False
    st.session_state.retrigger = 0

# Sort DataFrame before sending it back
if st.session_state.sort_col:
    df.sort_values(
        by=st.session_state.sort_col,
        ascending=st.session_state.sort_dir == "asc",
        inplace=True,
    )

data = df.reset_index(drop=True)
data = data.iloc[
    st.session_state.page * PAGE_SIZE : (st.session_state.page + 1) * PAGE_SIZE
]

# Apply formatting
data["Qty"] = data["Qty"].apply(lambda x: f"{x:.5f}").astype(str)
data["Rating (W)"] = data["Rating (W)"].apply(lambda x: f"{x:.3f}").astype(str)

st.session_state.retrigger = not st.session_state.retrigger

mx = int(len(df) / PAGE_SIZE) + 1
pge = st.number_input("Page:", 1, mx, mx)
max_page = pge
print(max_page)

# Show the component and capture sort interaction
sort_event = sortable_table(
    data=data,
    sort_column=st.session_state.sort_col,
    sort_direction=st.session_state.sort_dir,
    max_page=max_page,
    column_widths=["10%", "30%", 100, 200, 100],
    retrigger=st.session_state.retrigger,
    max_height="300px",
    style_overrides="--table-font-size: 15px;",
    cell_tooltips={"Qty": ("A\nB\nC\n" + data["Qty"]).tolist()},
    key=f"custom_df",
)

sortable_table(
    data=pd.DataFrame({"Data": [], "Data2": []}), key="test1", paginated=False
)
sortable_table(
    data=pd.DataFrame({"Data": list(range(10)), "Data2": list(range(10))}), key="test2"
)

print("Ret:", sort_event["page"])

if st.session_state.page != sort_event["page"]:
    st.session_state.page = sort_event["page"]
    st.session_state.rerun_flag = True

sort_info = sort_event["sort"]
if sort_info:
    if (
        sort_info["column"] != st.session_state.sort_col
        or sort_info["direction"] != st.session_state.sort_dir
    ):
        st.session_state.sort_col = sort_info["column"]
        st.session_state.sort_dir = sort_info["direction"]
        st.session_state.rerun_flag = True
else:
    if st.session_state.sort_col:
        st.session_state.sort_col = None
        st.session_state.rerun_flag = True

if st.session_state.rerun_flag:
    st.session_state.rerun_flag = False
    st.rerun()
