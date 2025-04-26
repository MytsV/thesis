import io
from datetime import datetime
from typing import Dict, Any, Literal, List

import numpy as np
import pandas as pd
from pydantic import BaseModel


class ParsedColumn(BaseModel):
    column_name: str
    column_type: Literal["int", "float", "string", "boolean", "datetime"]


class ParsedFile(BaseModel):
    columns: List[ParsedColumn]
    rows: List[Dict[str, Any]]


def __parse_dataframe(df: pd.DataFrame) -> ParsedFile:
    """Parse a pandas DataFrame into a ParsedFile object."""
    df = __convert_datetime_columns(df)

    columns = __extract_columns(df)

    rows = __extract_rows(df)

    return ParsedFile(columns=columns, rows=rows)


def __convert_datetime_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Try to convert object columns to datetime."""
    df_copy = df.copy()
    for col in df_copy.columns:
        if df_copy[col].dtype == object:
            try:
                df_copy[col] = pd.to_datetime(df_copy[col])
            except ValueError:
                pass
    return df_copy


def __extract_columns(df: pd.DataFrame) -> List[ParsedColumn]:
    """Extract schema information from DataFrame."""
    columns = []

    type_mapping = {
        "is_integer_dtype": "int",
        "is_float_dtype": "float",
        "is_bool_dtype": "boolean",
        "is_datetime64_dtype": "datetime",
    }

    for column_name, dtype in df.dtypes.items():
        column_type = "string"

        for dtype_check, our_type in type_mapping.items():
            check_function = getattr(pd.api.types, dtype_check)
            if check_function(dtype):
                column_type = our_type
                break

        columns.append(ParsedColumn(column_name=column_name, column_type=column_type))

    return columns


def __convert_value(value):
    """Convert a pandas/numpy value to a Python native type."""
    if pd.isna(value):
        return None

    type_conversions = {
        np.integer: int,
        np.floating: float,
        np.bool_: bool,
        pd.Timestamp: lambda x: x.isoformat(),
        datetime: lambda x: x.isoformat(),
    }

    for val_type, converter in type_conversions.items():
        if isinstance(value, val_type):
            return converter(value)

    # Default: return as is
    return value


def __extract_rows(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Extract rows from DataFrame as dictionaries with Python native types."""
    rows = []

    for _, row in df.iterrows():
        row_dict = {col_name: __convert_value(value) for col_name, value in row.items()}
        rows.append(row_dict)

    return rows


def parse_csv(content: str) -> ParsedFile:
    csv_file = io.StringIO(content)
    df = pd.read_csv(csv_file)
    return __parse_dataframe(df)


def parse_excel(content: bytes) -> ParsedFile:
    file_bytes = io.BytesIO(content)
    excel_file = pd.ExcelFile(file_bytes)
    sheet_name = excel_file.sheet_names[0]
    df = excel_file.parse(sheet_name)
    return __parse_dataframe(df)
