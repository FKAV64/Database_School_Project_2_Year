//This is the heavy lifter. It does the Multi-Mapping (Splitting SQL rows into C# Objects).
using Dapper;
using System.Data;
using TestBankasi.API.DataAccess; // Ensure this matches your namespace for DapperContext
using TestBankasi.API.Models;
using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public class ExamRepository : IExamRepository
    {
        private readonly DapperContext _context;

        public ExamRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<List<ExamQuestionDTO>> StartExamAsync(int KullaniciId, int DersId, int SoruSayisi, int SureDakika,List<string> Konular = null,int? ZorlukId = null)
        {
            // PART A: Create the Exam Session (INSERT)
            var procedureName = "sp_BaslatSinav";
            var parameters = new DynamicParameters();
            parameters.Add("KullaniciID", KullaniciId);
            parameters.Add("DersID", DersId);

            // Hardcoded to NULL for now (General Exam logic)
            // Later we will let the user choose specific Konular

            // LOGIC: Convert List<string> to "1,2,3" string for SQL
            // If list is null or empty, send NULL to SQL (which means "All Topics")
            // Null means the object doesn't exist in memory, Empty means the list was created with an empty value that why we use .Any()
            string topicListString = (Konular != null && Konular.Any())
                                     ? string.Join(",", Konular)
                                     : null;
            parameters.Add("KonuListesi", topicListString);
            parameters.Add("ZorlukID", ZorlukId);

            parameters.Add("SoruSayisi", SoruSayisi);
            parameters.Add("SureDakika", SureDakika);

            int examSessionId;

            using (var connection = _context.CreateConnection())
            {
                // Execute sp_BaslatSinav and get the new ID
                examSessionId = await connection.QuerySingleAsync<int>(
                    procedureName,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                // PART B: Fetch the Questions (SELECT + JOIN)
                var sql = "sp_OturumSorulariniGetir";
                var getParams = new DynamicParameters();
                getParams.Add("OturumID", examSessionId);

                // Dictionary to track distinct Questions so we don't create duplicates
                var questionDictionary = new Dictionary<int, ExamQuestionDTO>();

                // Dapper Logic: Map <Question, Option, Result>
                var list = await connection.QueryAsync<ExamQuestionDTO, ExamOptionDTO, ExamQuestionDTO>(
                    sql,
                    (question, option) =>
                    {
                        // 1. Check if we already created this Question object
                        if (!questionDictionary.TryGetValue(question.SoruID, out var questionEntry))
                        {
                            questionEntry = question;
                            questionEntry.Secenekler = new List<ExamOptionDTO>();
                            questionDictionary.Add(questionEntry.SoruID, questionEntry);
                        }

                        // 2. Add the current option to the question's list
                        // Note: If option is null (shouldn't happen with inner join), we skip
                        if (option != null)
                        {
                            questionEntry.Secenekler.Add(option);
                        }

                        return questionEntry;
                    },
                    getParams,
                    splitOn: "SecenekID", // <--- The Border between Question columns and Option columns
                    commandType: CommandType.StoredProcedure
                );

                // Return the clean list of questions
                return questionDictionary.Values.ToList();
            }
        }
        public async Task<ExamResultDTO> SubmitExamAsync(SubmitExamDTO submission, int userId)
        {
            // OPEN CONNECTION ONCE
            using (var connection = _context.CreateConnection())
            {
                connection.Open();

                // 1. SECURITY CHECK (Via Stored Procedure)
                // We now call sp_OturumSahibiKontrol instead of writing SELECT * FROM...
                var isOwner = await connection.ExecuteScalarAsync<int>(
                    "sp_OturumSahibiKontrol",
                    new { OturumID = submission.OturumID, KullaniciID = userId },
                    commandType: CommandType.StoredProcedure
                );

                if (isOwner == 0)
                {
                    throw new UnauthorizedAccessException("Bu sınav oturumu size ait değil!");
                }

                // 2. TRANSACTION (Save Answers)
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        foreach (var answer in submission.Cevaplar)
                        {
                            await connection.ExecuteAsync(
                                "sp_CevapKaydet",
                                new
                                {
                                    OturumID = submission.OturumID,
                                    SoruID = answer.SoruID,
                                    SecenekID = answer.SecenekID
                                },
                                transaction: transaction,
                                commandType: CommandType.StoredProcedure
                            );
                        }
                        transaction.Commit();
                    }
                    catch
                    {
                        transaction.Rollback();
                        throw;
                    }
                }

                // 3. GRADE EXAM (Calculate Score)
                // We reuse the SAME connection
                var result = await connection.QuerySingleAsync<ExamResultDTO>(
                    "sp_TamamlaSinav",
                    new { OturumID = submission.OturumID },
                    commandType: CommandType.StoredProcedure
                );

                return result;
            }
        }
        public async Task<IEnumerable<ExamHistoryDTO>> GetStudentHistoryAsync(int kullaniciId)
        {
            // READABILITY WIN: We use @KullaniciID so it is obvious what the parameter is.
            var query = "SELECT * FROM View_OturumOzet WHERE KullaniciID = @KullaniciID ORDER BY BaslaZaman DESC";

            using (var connection = _context.CreateConnection())
            {
                // Dapper Mapping: We map the C# variable 'kullaniciId' to the SQL parameter '@KullaniciID'
                return await connection.QueryAsync<ExamHistoryDTO>(query, new { KullaniciID = kullaniciId });
            }
        }

        public async Task<IEnumerable<ExamReviewDTO>> GetExamReviewAsync(int oturumId)
        {
            var query = "SELECT * FROM View_DetayliAnaliz WHERE OturumID = @OturumID ORDER BY SoruSira ASC";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<ExamReviewDTO>(query, new { OturumID = oturumId });
            }
        }
    }
}
