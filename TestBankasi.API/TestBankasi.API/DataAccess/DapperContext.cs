using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace TestBankasi.API.DataAccess
{
    // 1. This class is our "Database Connector". 
    // It reads the password from settings and hands out connections.
    public class DapperContext
    {
        // _configuration: The tool that reads appsettings.json
        private readonly IConfiguration _configuration;

        // _connectionString: This string holds "Server=...; User Id=...;"
        private readonly string _connectionString;

        // 2. The Constructor: Runs once when the app starts up.
        public DapperContext(IConfiguration configuration)
        {
            _configuration = configuration;

            // 3. It grabs the text inside "DefaultConnection" from your settings file.
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        // 4. CreateConnection: The method we call whenever we need to run a query.
        // IDbConnection is the datatype of want the function will return
        // It returns a "SqlConnection" object which Dapper uses to talk to SQL Server.
        public IDbConnection CreateConnection()
            => new SqlConnection(_connectionString);
    }
    
}

