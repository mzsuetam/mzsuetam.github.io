# Advanced Database Systems

## AGH PostgreSQL server

https://panel.kis.agh.edu.pl/databases/1

### Connecting to AGH PostgreSQL Server

To connect to the AGH PostgreSQL server, use the following command:

```shell
psql -U <username> -h lab.kis.agh.edu.pl -p 1600 
```

To execute a SQL file on the server, use the following command:

```shell
psql -U <username> -h lab.kis.agh.edu.pl -p 1600 -f <file name>.sql
```

### Useful psql Commands

- `\l` - List all databases
- `\c <database_name>` - Connect to a specific database
- `\dn` - List all schemas in the current database
- `\dt` - List all tables in the current database
- `\dt <schema_name>.*` - List all tables in a specific schema
- `\d <table_name>` - Describe the structure of a specific table
- `\q` - Quit the psql shell