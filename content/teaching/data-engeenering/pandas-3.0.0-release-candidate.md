# Pandas 3.0.0 Release Candidate: Major Changes & Features

> **ℹ️ More details:**  
> For a comprehensive overview of all changes, see the  
> [Pandas 3.0.0 Release Notes (What’s new in 3.0.0)](https://pandas.pydata.org/docs/dev/whatsnew/v3.0.0.html).

This is a massive release for pandas. Version 3.0.0 marks a significant shift towards better performance, stricter data types, and more predictable memory management. The library is moving heavily towards using **PyArrow** under the hood and enforcing **Copy-on-Write** rules to eliminate the confusion between "views" and "copies."

Here is a summary of the most important changes and features in pandas 3.0.0.

### 1\. Dedicated String Data Type by Default

> **ℹ️ More details:**  
> See the official proposal
> [PDEP-14: Dedicated string data type for pandas 3.0](https://pandas.pydata.org/pdeps/0014-string-dtype.html).

Historically, pandas stored strings in `object` dtype arrays (pointers to Python objects). This was slow and memory-inefficient.

  * **The Change:** Pandas now infers string data as a dedicated `str` dtype by default.
  * **The Backend:** It uses PyArrow if installed; otherwise, it falls back to NumPy object-dtype but wraps it in the new interface.
  * **Behavior:** `str` dtype strictly holds strings (or missing values). Attempting to insert integers into a string column will now fail or require explicit casting.

**Example:**

```python
import pandas as pd
import numpy as np

# Old behavior (pandas 2.x): dtype would be 'object'
# New behavior (pandas 3.0): dtype is 'str'
ser = pd.Series(["apple", "banana", np.nan])
print(ser.dtype)
# Output: str
```

-----

### 2\. Copy-on-Write (CoW) is the New Standard

> **ℹ️ More details:**
> See the official proposal
> [PDEP-7: Consistent copy/view semantics in pandas with Copy-on-Write ](https://pandas.pydata.org/pdeps/0007-copy-on-write.html)

This is perhaps the biggest architectural change. It fundamentally alters how pandas handles data copying and memory.

  * **Predictability:** Any subset or returned Series/DataFrame always behaves as a copy in terms of user API. You can no longer accidentally modify an original DataFrame by modifying a slice of it.
  * **Chained Assignment:** Code like `df["a"][0] = 10` (chained assignment) will **stop working** and will not modify the original DataFrame. You must use `df.loc[0, "a"] = 10`.
  * **Performance:** Under the hood, pandas uses "lazy copies." It shares memory between objects until you actually try to write to one of them, at which point a physical copy is made.

**Example:**

```python
df = pd.DataFrame({'a': [1, 2, 3]})
subset = df[0:2]

# In pandas 3.0, this modification creates a copy on write.
# 'subset' is modified, but 'df' remains untouched.
subset.iloc[0, 0] = 100 

print(df.iloc[0, 0]) 
# Output: 1 (The original is preserved)
```

<details style="border-left: 4px solid #2a9d8f; padding-left: 1em; margin-top: 1em;">

<summary style="cursor: pointer; font-weight: bold; font-size: 1.1em; color: #2a9d8f; margin: 1em 0;">
<h4 style="display: inline-block; transform: translateY(3px)">Click to expand for Deep Dive on Copy-on-Write (CoW)</h4>
</summary>

The core philosophy of pandas 3.0 is simple: **Any DataFrame or Series derived from another is strictly a copy.** You can no longer modify the original object by modifying a subset/slice.

However, to prevent this from destroying performance (by copying gigabytes of data every time you slice a DataFrame), pandas implements **Copy-on-Write**. This describes a "Lazy Copy" mechanism: pandas delays the actual physical copying of data until the moment you try to modify it.

#### 1\. The "Lazy Copy" (Reading is Cheap)

In pandas 3.0, when you slice a DataFrame, rename columns, or reset an index, pandas does **not** copy the underlying data immediately. Instead, the new object creates a reference (a view) to the same memory block as the original.

  * **Benefit:** Operations that used to be expensive (like deep copying a large DataFrame) are now near-instant and consume almost no extra RAM.

**Example: Method Chaining Optimization**
In pandas 2.x, the following chain often triggered multiple expensive data copies. In pandas 3.0, these steps share memory efficiently.

```python
# In pandas 3.0, this entire chain is highly memory efficient.
# No physical data is copied during these steps.
df_clean = (
    df_original
    .rename(columns=str.lower)
    .set_index("id")
    .drop(columns=["temp_col"])
)
```

#### 2\. The "On-Write" Trigger (Mutation separates the objects)

The "Copy" part of Copy-on-Write happens only when you try to change values. Pandas checks if the data you are trying to modify is shared by other objects.

  * **If shared:** Pandas triggers a physical copy of the data *just before* the modification applies. The new object now points to its own unique memory.
  * **If not shared:** The modification happens in-place.

**Example: Subsetting and Modifying**
This resolves the ambiguity of "Case 1" and "Case 2" described in the abstract.

```python
# Setup
df = pd.DataFrame({"A": [1, 2], "B": [3, 4]})

# Step 1: Subsetting
# df2 is technically a view in memory (fast), but behaves as a copy.
df2 = df[["A", "B"]] 

# Step 2: Modification
# Pandas detects df2 shares memory with df. 
# It triggers a copy of df2's data, separates it from df, and THEN modifies df2.
df2.loc[0, "A"] = 100 

print(df2.iloc[0, 0]) # Output: 100 (Modified)
print(df.iloc[0, 0])  # Output: 1   (Original is untouched)
```

#### 3\. The End of `SettingWithCopyWarning` & Chained Assignment

Because the rule is now strict ("subsets never modify parents"), Chained Assignment will **never** work to update the original DataFrame. Consequently, the confusing `SettingWithCopyWarning` is removed entirely.

**The Anti-Pattern (Chained Assignment):**

```python
# This creates a temporary slice, modifies the temporary slice, 
# and throws it away. The original 'df' is NOT changed.
df["A"][df["A"] > 1] = 10 

# Result: ChainedAssignmentError (or similar warning/error in 3.0)
```

**The Correct Pattern:**
You must use `.loc` to modify the original object in a single step.

```python
# This works because it operates directly on the original object
df.loc[df["A"] > 1, "A"] = 10
```

#### 4\. The "Filtered DataFrame" Scenario

A common pain point in older pandas versions was filtering a DataFrame and then trying to add a column to the result. This often triggered a `SettingWithCopyWarning`, forcing users to manually call `.copy()`.

With CoW, the manual `.copy()` is no longer required for safety.

**Old Pandas (Pre-3.0):**

```python
df_filtered = df[df["A"] > 1]
# Raises SettingWithCopyWarning:
df_filtered["new_col"] = 1 
```

**New Pandas (3.0):**

```python
df_filtered = df[df["A"] > 1]
# Perfectly safe. df_filtered automatically creates its own deep copy 
# the moment you add "new_col". No warning. No impact on 'df'.
df_filtered["new_col"] = 1 
```

#### 5\. Constructors and Shallow Copies

CoW changes how constructors and "shallow" copies behave.

  * **Constructors:** `pd.DataFrame(original_df)` previously might have copied data immediately depending on inputs. Now, it uses CoW (lazy copy).
  * **Shallow Copies:** `df.copy(deep=False)` no longer creates a "live" link where modifying the copy updates the original. It creates a CoW link. As soon as you modify one, they split.

**Example: Shallow Copy Behavior**

```python
df = pd.DataFrame({"A": [1, 2]})
df_shallow = df.copy(deep=False)

# In pandas 2.x: This might have updated 'df' (shared memory).
# In pandas 3.0: This triggers a copy. 'df' is preserved.
df_shallow.iloc[0, 0] = 99

print(df.iloc[0, 0]) 
# Output: 1
```

#### Summary of Rules for the User

1.  **Modification is Local:** If you modify an object `df2`, you are *never* modifying `df1`, even if `df2` was created from `df1`.
2.  **Use `.loc`:** If you want to modify a DataFrame, do it directly on that DataFrame object. Do not chain `[]` operations.
3.  **Defensive Copies are Obsolete:** You rarely need to write `.copy()` to avoid `SettingWithCopyWarning`. Pandas handles the copying lazily when needed.

</details>

-----

### 3\. PyArrow Integration & `from_arrow`

Pandas 3.0 embraces the Arrow ecosystem even more tighty.

  * **`from_arrow`:** A new method `DataFrame.from_arrow()` allows you to import any Arrow-compatible data object directly via the Arrow PyCapsule Protocol.
  * **Dtype backends:** Many internal operations now default to using PyArrow backends for speed if available.

-----

### 4\. `pd.col` Syntax for `assign()`

You can now use `pd.col` to reference columns dynamically within methods like `.assign()`, making cleaner code than using lambda functions.

**Example:**

```python
df = pd.DataFrame({'price': [10, 20], 'tax': [1, 2]})

# Old way:
# df.assign(total = lambda x: x['price'] + x['tax'])

# New way with pandas 3.0:
df.assign(total = pd.col('price') + pd.col('tax'))
```

-----

### 5\. Major Breaking Changes & Deprecations

#### A. Datetime Resolution Inference

Pandas no longer forces everything into nanoseconds (`ns`). It now infers resolution (`s`, `ms`, `us`, `ns`) based on the input.

  * **Impact:** If you convert a string like "2024-01-01", it might infer microseconds (`us`) instead of nanoseconds. This is critical if you cast datetimes to integers (the integer values will differ by orders of magnitude).

#### B. `pytz` is now Optional

Pandas now uses the standard library's `zoneinfo` by default for timezones. `pytz` is no longer a required dependency.

  * **Code Update:** `ts.tz` will return a `zoneinfo.ZoneInfo` object instead of a `pytz` object.

#### C. Enforced Deprecation of Frequency Aliases

The old frequency aliases that were deprecated in 2.x are now removed or strictly enforced. You must use the "E" (End) suffix for clarity.

| Old Alias | New Alias (Required) | Meaning    |
| :-------- | :------------------- | :--------- |
| `M`       | **`ME`**             | Month End  |
| `Q`       | **`QE`**             | Quarter End|
| `Y`       | **`YE`**             | Year End   |

#### D. `concat` Sorting Behavior

If you concatenate objects with DatetimeIndexes and do not specify `sort`, pandas will no longer automatically sort the non-concatenation axis. You must specify `sort=True` or `sort=False`.

-----

### 6\. Notable Bug Fixes & Improvements

  * **GroupBy `observed=False`:** Improved handling of unobserved groups in Categorical data. Previously, sums might return 0 while other operations returned NaN; now behavior is consistent.
  * **`value_counts` Sorting:** `DataFrame.value_counts(sort=False)` now respects the input order rather than sorting by index labels.
  * **`offsets.Day`:** Now behaves strictly as a calendar day (preserving time-of-day across Daylight Savings transitions), rather than a fixed 24-hour delta.
