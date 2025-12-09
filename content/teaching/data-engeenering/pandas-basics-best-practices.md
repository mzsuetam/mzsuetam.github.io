# Data Engineering Best Practices: Code Quality and Performance

This guide synthesizes common challenges and offers a set of best practices to write efficient, readable, and robust Python code, especially when working with **Pandas** and **NumPy**.

## 1. Vectorization and Performance Optimization

The core principle for high-performance data manipulation in Pandas is to **avoid explicit Python loops** in favor of **vectorized operations**.

* **Good Practice:** **Embrace Vectorization**
   * Prioritize using built-in Pandas and NumPy vectorized operations (e.g., direct column arithmetic, boolean indexing, `np.where`, `np.select`, `df.agg()`, `df.apply(axis=0)`).
   * Use Pandas' string accessor (`.str`) methods (e.g., `.str.contains()`, `.str.extract()`, `.str.fullmatch()`) for all string manipulations.
   * **Example:** Use `df['col'].isnull().mean()` to calculate the proportion of missing values, instead of a manual loop summing nulls and dividing by the length.
* **Bad Practice (Anti-Pattern):** **Unvectorized Operations**
   * Avoid using `for` loops to iterate over DataFrame rows (`df.iterrows()`) or columns for calculations that can be handled by vectorized methods. This leads to massive performance degradation (up to 100x slower on large datasets).

---

## 2. Idiomatic and Efficient Pandas Usage

Pandas provides high-level methods for common tasks. Using these methods makes code concise, readable, and often more efficient than manual implementation.

* **Good Practice:** **Leverage Built-in Pandas Methods**
   * Use **`df.describe(include='all')`** for a consolidated summary of all column types (numeric, non-numeric, and all). Manually calculating statistics by type is redundant.
   * Utilize **`df.rename()`** with a function or dictionary for column renaming, which is cleaner than reassigning `df.columns` with a new list.
   * Use **`pd.to_numeric()`** with `errors='coerce'` and the `decimal` parameter for robust numerical conversion, automatically handling malformed entries by converting them to `NaN`.
   * For one-to-one value transformations, use **`pd.Series.map()`** with a dictionary, and reserve **`pd.Series.replace()`** for broader pattern-based or multiple value replacements.
   * Use **`df.select_dtypes()`** to efficiently filter columns by data type (e.g., `'object'`, `'number'`) instead of manual type checking in loops.
   * For creating DataFrames, use **dictionaries of lists/arrays** or NumPy arrays directly in the constructor, avoiding slow, iterative row appending.
   * **Tip:** When checking data types, use the direct **`.dtype`** attribute or **`pd.api.types`** functions on the original Series for the most robust check. Avoid checking dtypes on dropped NA values.
* **Good Practice:** **Master Pandas Indexing**
   * **Use `.loc` for label-based indexing** and **`.iloc` for integer-location based indexing** consistently.
   * **Avoid Chained Indexing** (e.g., `df[condition]['column'] = value`) as it often leads to the **`SettingWithCopyWarning`** and unpredictable behavior regarding whether the original DataFrame or a temporary copy is being modified.
   * **Best Practice:** Combine row and column selection in a single operation: `df.loc[row_condition, 'column_label'] = value`.
   * For creating simple sequential integer indices, prefer **`pd.RangeIndex(start, stop, step)`** over `np.arange` or `range` followed by `pd.Index`.
* **Good Practice:** **Handle MultiIndex Effectively**
   * Use dedicated functions like **`pd.MultiIndex.from_arrays()`**, **`.set_index(..., append=True)`**, **`.stack()`**, and **`.unstack()`** for creation and manipulation.

---

## 3. Data Loading and File Handling

Efficiently managing file input/output (I/O) is crucial for performance and reliability.

* **Good Practice:** **Proper File Handling**
   * Use the **`with open(...) as f:`** statement for all file operations (that are not loading data to the DataFrame). The `with` statement automatically handles file closing, making explicit `f.close()` redundant.
   * **Avoid opening/closing files within loops** (especially for JSON output) as this leads to inefficient file I/O and potential data overwriting. Write the entire structure at the end.
* **Good Practice:** **Direct Output Methods**
   * Utilize DataFrame methods like **`df.to_json(orient='records', indent=4)`** or **`df.to_markdown(na_rep='')`** for efficient and formatted output. Avoid manual JSON string construction.
   * **Tip:** Be mindful of JSON serialization errors (like `DTypePromotionError`) when converting DataFrames with mixed data types (e.g., from `describe(include='all')`). Pre-convert types or handle potential `NaN` values.

---

## 4. Code Robustness and Readability

Clean, modular, and well-named code is easier to debug, maintain, and collaborate on.

* **Good Practice:** **Modularize Code**
   * Break down complex logic into smaller, well-defined functions with clear inputs and outputs. This improves readability and promotes code reusability.
* **Good Practice:** **Clear Variable Naming**
   * Use **descriptive variable names** that clearly indicate the content or purpose (e.g., `normalized_columns`, `filtered_data`).
   * **Avoid Shadowing Built-in Names:** Never use variable names that conflict with Python's built-in functions and types (e.g., `dict`, `list`, `sum`).
* **Good Practice:** **Robust Regular Expressions (Regex)**
   * Craft specific and robust regular expressions for extraction and validation. Fully understand the role of quantifiers (*, +, ?) and grouping. 
   * *r* in `r"my_regex"` stands for RAW not REGEX :)
* **Good Practice:** **Reproducible Randomness**
   * For generating random numbers, use **`np.random.default_rng()`** or set a seed using **`np.random.seed()`** once at the beginning of the script for reproducibility.
* **Good Practice:** **Efficient Boolean Logic**
   * When filtering, use direct string methods like **`.str.startswith()`** instead of complex regex matches with list comprehensions for simpler string pattern checks.
   * Understand the difference between checking if **any** value is in a set vs. checking if **all** values (subset logic) are in a set, which often requires `df['col'].isin(set_of_values).all()`.

---

## 5. Avoiding Common Misunderstandings

Clear understanding of function behavior is key to writing correct code.

* **Issue:** **`np.arange` and `range` Behavior**
   * **Reminder:** The `stop` value in `np.arange(start, stop)` and Python's `range(stop)` is **exclusive**. This is a common pitfall leading to incorrect index ranges.
* **Issue:** **Pandas `mean()` on Booleans**
   * **Reminder:** Calling `.mean()` directly on a **boolean Series** (e.g., the output of `df['col'].isnull()`) computes the **proportion of `True` values** (which are treated as 1s). This is the fastest way to calculate missing value percentages.
* **Issue:** **JSON Handling**
   * **Reminder:** **`pd.json_normalize()`** can often handle loaded JSON data (Python dictionary/list) directly. Converting data *back* to a dictionary after loading it into a DataFrame is an unnecessary and redundant step.
* **Issue:** **`np.random.randint` vs. `np.random.choice`**
   * **Reminder:**
      * `np.random.randint(low, high, size)`: generates integers. The `high` value is **exclusive**.
      * `np.random.choice(np.arange(low, high), size)`: generates integers by sampling from the explicitly created range.