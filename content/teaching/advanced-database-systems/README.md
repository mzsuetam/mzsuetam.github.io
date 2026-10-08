# Advanced Database Systems

You can connect to the KIS PostgreSQL server from your own device. If you do not want to install psql on your device, you can use the KIS lab server to connect to the KIS PostgreSQL server.

## KIS lab server

https://panel.kis.agh.edu.pl:3000/ssh/1

To connect to the KIS lab server, use the following command:

```bash
ssh <ssh_username>@lab.kis.agh.edu.pl
# will ask you about ssh password
```

To copy files to the server, use the following command:

```bash
scp <file name> <ssh_username>@lab.kis.agh.edu.pl:~/
# all after the : is the path on the server where the file will be copied (~ is the home folder), as you should already know from the UNIX course at the very first semester of your studies :)
# will ask you about ssh password
```

## KIS PostgreSQL server

https://panel.kis.agh.edu.pl/databases/1

### Connecting to KIS PostgreSQL Server

To connect to the KIS PostgreSQL server, use the following command:

```bash
psql -U <db_username> -h lab.kis.agh.edu.pl -p 1600 
# will ask you about db password
```

To execute a SQL file on the server, use the following command:

```bash
psql -U <db_username> -h lab.kis.agh.edu.pl -p 1600 -f <file name>.sql
# will ask you about db password
```

### Useful psql Commands

- `\l` - List all databases
- `\c <database_name>` - Connect to a specific database
- `\dn` - List all schemas in the current database
- `\dt` - List all tables in the current database
- `\dt <schema_name>.*` - List all tables in a specific schema
- `\d <table_name>` - Describe the structure of a specific table
- `\q` - Quit the psql shell