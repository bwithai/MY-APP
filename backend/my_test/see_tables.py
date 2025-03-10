import sqlite3

# Connect to your SQLite database
conn = sqlite3.connect('CFMS.sqlite')  # Replace with your database file path

# Create a cursor object
cursor = conn.cursor()

# Query to fetch all table names and their schemas
cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table';")

# Fetch all rows (tables and their schemas)
tables = cursor.fetchall()

# Print the table names and their schema
print("List of tables and their creation statements:")
for table in tables:
    table_name, schema = table
    print(f"\nTable: {table_name}")
    print(f"Schema: {schema}")

# Close the connection
conn.close()
