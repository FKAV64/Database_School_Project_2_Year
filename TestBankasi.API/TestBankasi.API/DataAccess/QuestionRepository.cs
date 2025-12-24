using Dapper;
using System.Data;
using System.Text.Json; // We use this to turn the list into a string
using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public class QuestionRepository : IQuestionRepository
    {
        private readonly DapperContext _context;

        public QuestionRepository(DapperContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<QuestionListDTO>> GetQuestionsByFilterAsync(int dersId, int? konuId)
        {
            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<QuestionListDTO>(
                    "sp_SorulariListele",
                    new { DersID = dersId, KonuID = konuId }, // Pass params
                    commandType: CommandType.StoredProcedure
                );
            }
        }

        public async Task<QuestionDetailDTO> GetQuestionByIdAsync(int id)
        {
            // Dictionary is needed because Dapper returns 1 row per Option (4 rows total)
            // We want to collapse them into 1 Question object with a list of 4 options.
            var dictionary = new Dictionary<int, QuestionDetailDTO>();

            using (var connection = _context.CreateConnection())
            {
                var list = await connection.QueryAsync<QuestionDetailDTO, OptionDetailDTO, QuestionDetailDTO>(
                    "sp_SoruDetayGetir",
                    (question, option) =>
                    {
                        if (!dictionary.TryGetValue(question.SoruID, out var entry))
                        {
                            entry = question;
                            entry.Secenekler = new List<OptionDetailDTO>();
                            dictionary.Add(entry.SoruID, entry);
                        }

                        // Add the option to the list
                        entry.Secenekler.Add(option);
                        return entry;
                    },
                    new { SoruID = id },
                    splitOn: "SecenekID", // Tells Dapper where the Option columns start
                    commandType: CommandType.StoredProcedure
                );

                return dictionary.Values.FirstOrDefault();
            }
        }

        public async Task<IEnumerable<DifficultyLevelsDTO>> GetDifficultyLevelsAsync()
        {
            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<DifficultyLevelsDTO>(
                    "sp_ZorlukSeviyeleriGetir",
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<int> AddQuestionAsync(QuestionCreateDTO questionDto, int userId)
        {
            var procedureName = "sp_SoruVeSecenekleriEkle";

            // 1. Convert C# List to JSON String
            // This turns the list into: '[{"SecenekMetin":"A","DogruMu":true}, ...]'
            string optionsJson = JsonSerializer.Serialize(questionDto.Secenekler);

            var parameters = new DynamicParameters();
            parameters.Add("KullaniciID", userId);
            parameters.Add("KonuID", questionDto.KonuID);
            parameters.Add("ZorlukID", questionDto.ZorlukID);
            parameters.Add("SoruMetin", questionDto.SoruMetin);

            // 2. Send the JSON string to SQL
            parameters.Add("SeceneklerJSON", optionsJson);

            using (var connection = _context.CreateConnection())
            {
                // We expect a single integer back (the New ID)
                return await connection.QuerySingleAsync<int>(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task UpdateQuestionAsync(QuestionUpdateDTO questionDto, int userId)
        {
            var procedureName = "sp_SoruVeSecenekleriGuncelle";

            // 1. Serialize Options to JSON
            // We send the ID, Text, and Correct Status for every option
            string optionsJson = JsonSerializer.Serialize(questionDto.Secenekler);

            var parameters = new DynamicParameters();
            parameters.Add("KullaniciID", userId);
            parameters.Add("SoruID", questionDto.SoruID);
            parameters.Add("YeniMetin", questionDto.SoruMetin);
            parameters.Add("YeniZorlukID", questionDto.ZorlukID);

            // 2. Pass the JSON payload
            parameters.Add("SeceneklerJSON", optionsJson);

            using (var connection = _context.CreateConnection())
            {
                // 3. Single Call -> Atomic Update
                await connection.ExecuteAsync(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task DeleteQuestionAsync(int questionId, int userId)
        {
            // This calls sp_SoruSil, which performs a "Soft Delete" (Updates SilinmeTarihi)
            var procedureName = "sp_SoruSil";

            using (var connection = _context.CreateConnection())
            {
                await connection.ExecuteAsync(
                    procedureName,
                    new
                    {
                        KullaniciID = userId,
                        SoruID = questionId
                    },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task RestoreQuestionAsync(int questionId, int userId)
        {
            // This calls sp_SoruGeriYukle, which sets SilinmeTarihi back to NULL
            var procedureName = "sp_SoruGeriYukle";

            using (var connection = _context.CreateConnection())
            {
                await connection.ExecuteAsync(
                    procedureName,
                    new
                    {
                        KullaniciID = userId,
                        SoruID = questionId
                    },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
}