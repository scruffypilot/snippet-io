import psycopg2

connection = psycopg2.connect(
    database="game-data",
    user="postgres",
    password="liveshark",
    host="localhost",
    port="5432"
)

print("Connected successfully!")

connection.close()