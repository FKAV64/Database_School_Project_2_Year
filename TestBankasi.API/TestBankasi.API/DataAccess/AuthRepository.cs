using Dapper;
using System.Data;
using TestBankasi.API.Models;
using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    // This class IMPLEMENTS the Interface (The Chef cooks the Menu) Chef -> AuthRespository Menu -> IAuthRepository
    public class AuthRepository : IAuthRepository
    {
        private readonly DapperContext _context;

        // 1. Dependency Injection: We ask for the "Telephone Line" (Context)
        public AuthRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<int> RegisterUser(UserRegisterDTO userDTO)
        {
            // 2. Security: HASH the password here (in C#)
            // This turns "123456" into "$2a$11$Z5..."
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(userDTO.Sifre);

            // 3. Prepare the SQL logic
            // We use the Stored Procedure name exactly as it is in SQL
            var procedureName = "sp_KullaniciKayit";

            // 4. Map the C# properties to the SQL @Parameters
            var parameters = new DynamicParameters();
            parameters.Add("Ad", userDTO.Ad);
            parameters.Add("Soyad", userDTO.Soyad);
            parameters.Add("DogumTarihi", userDTO.DogumTarihi);
            parameters.Add("Email", userDTO.Email);
            // Notice: We send the HASH, not the plain text password
            parameters.Add("HashedPassword", passwordHash);
            parameters.Add("@SeviyeID", userDTO.SeviyeID);

            // 5. Connect and Execute
            using (var connection = _context.CreateConnection())
            {
                // QuerySingleAsync: We expect exactly ONE result (the new ID)
                // CommandType.StoredProcedure: Tells Dapper this isn't a normal SELECT query
                var newId = await connection.QuerySingleAsync<int>(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                return newId;
            }
        }
        public async Task<IEnumerable<EducationLevelDTO>> GetEducationLevelsAsync()
        {
            // LOGIC: Fetch Levels joined with their School Name.
            // Ordered by School Name first, then by Grade Level (9, 10, 11...)
            var query = @"
            SELECT 
               SeviyeID, 
               KurumAdi, 
               SeviyeAdi 
            FROM View_EgitimSeviyeleri
            ORDER BY KurumID, SeviyeSira";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<EducationLevelDTO>(query);
            }
        }
        public async Task<User> GetUserByEmail(string email)
        {
            var procedureName = "sp_KullaniciGirisBilgi";
            var parameters = new DynamicParameters();
            parameters.Add("Email", email);

            using (var connection = _context.CreateConnection())
            {
                // QueryFirstOrDefaultAsync: Returns the User or null if email doesn't exist
                return await connection.QueryFirstOrDefaultAsync<User>(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
}