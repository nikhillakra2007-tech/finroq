import psycopg2

conn = psycopg2.connect(host='localhost', port=5432, user='postgres', password='postgres', database='postgres')
conn.autocommit = True
cur = conn.cursor()
cur.execute("SELECT 1 FROM pg_database WHERE datname = 'finroq'")
result = cur.fetchone()
if result:
    print('Database finroq exists')
else:
    cur.execute('CREATE DATABASE finroq')
    print('Database finroq created')
cur.close()
conn.close()