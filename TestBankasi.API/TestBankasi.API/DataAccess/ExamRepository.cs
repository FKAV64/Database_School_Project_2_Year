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
        // This means: "I promise (Task) to give you a Read-Only List (IEnumerable) of Lessons."
        public async Task<IEnumerable<LessonDTO>> GetLessonsByLevelAsync(int seviyeId)
        {
            using (var connection = _context.CreateConnection())
            {
                // QueryAsync return a list/collection of lessons
                return await connection.QueryAsync<LessonDTO>(
                    "sp_DersleriGetir", 
                    new { SeviyeID = seviyeId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }

        public async Task<IEnumerable<TopicDTO>> GetTopicsByLessonAsync(int dersId)
        {
            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<TopicDTO>(
                    "sp_KonulariGetir",
                    new { DersID = dersId },
                    commandType: CommandType.StoredProcedure
                );
            }
        }
        public async Task<List<ExamQuestionDTO>> StartExamAsync(int KullaniciId, int DersId, int SoruSayisi, int SureDakika,List<string> Konular = null,int? ZorlukId = null)
        {
            // PART A: Create the Exam Session (INSERT)
            var procedureName = "sp_BaslatSinav";
            var parameters = new DynamicParameters();
            parameters.Add("KullaniciID", KullaniciId);
            parameters.Add("DersID", DersId);

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

                // PART B: Fetches the Questions 

                // Dictionary to track distinct Questions so we don't create duplicates
                var questionDictionary = new Dictionary<int, ExamQuestionDTO>();

                // Dapper Logic: Multiple Map "Input, Input, Output"
                var list = await connection.QueryAsync<ExamQuestionDTO, ExamOptionDTO, ExamQuestionDTO>(
                    "sp_OturumSorulariniGetir",
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

                        return questionEntry; //Actually useless but required for syntax because all is being store in the dict
                    },
                    new { OturumID = examSessionId },
                    splitOn: "SecenekID", // <--- The Border between Question columns and Option columns
                    commandType: CommandType.StoredProcedure
                );

                // Return the clean list of questions
                return questionDictionary.Values.ToList();
            }
        }
        public async Task<ExamResultDTO> SubmitExamAsync(SubmitExamDTO submission, int userId)
        {
            using (var connection = _context.CreateConnection())
            {
                connection.Open();
                //Dapper method used when you expect your SQL query to return exactly one single value
                var isOwner = await connection.ExecuteScalarAsync<int>(
                    "sp_OturumSahibiKontrol",
                    new { OturumID = submission.OturumID, KullaniciID = userId },
                    commandType: CommandType.StoredProcedure
                );

                if (isOwner == 0)
                {
                    throw new UnauthorizedAccessException("Bu sınav oturumu size ait değil!");
                }

                // TRANSACTION (Save Answers)
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
            var query = "SELECT * FROM View_OturumOzet WHERE KullaniciID = @KullaniciID ORDER BY BaslaZaman DESC";

            using (var connection = _context.CreateConnection())
            {
                // Dapper Mapping: We map the C# variable 'kullaniciId' to the SQL parameter '@KullaniciID'
                return await connection.QueryAsync<ExamHistoryDTO>(query, new { KullaniciID = kullaniciId });
            }
        }

        public async Task<ExamReviewDTO>GetExamReviewAsync(int oturumId)
        {
            var query = @"
                SELECT 
                    OturumID,
                    DersAdi,
                    Puan,
                    BaslaZaman,
                    BitirZaman,
                    SureDakika
                FROM View_OturumOzet WHERE OturumID = @OturumID";

            using (var connection = _context.CreateConnection())
            {
                // QueryAsync returns an Array while QuerySingleOrDefaultAsync will return an object
                return await connection.QuerySingleOrDefaultAsync<ExamReviewDTO>(query, new { OturumID = oturumId });
            }
        }
        public async Task<IEnumerable<ReviewQuestionDTO>> GetReviewDetailsAsync(int oturumId)
        {
            var procedure = "sp_GozdenGecirmeSinavi";
            var dictionary = new Dictionary<int, ReviewQuestionDTO>();

            using (var connection = _context.CreateConnection())
            {
                // Multi-Mapping: Question + Option -> Question
                var list = await connection.QueryAsync<ReviewQuestionDTO, ReviewOptionDTO, ReviewQuestionDTO>(
                    procedure,
                    (question, option) =>
                    {
                        // 1. Check if we already have this Question in our dictionary
                        if (!dictionary.TryGetValue(question.SoruID, out var entry))
                        {
                            entry = question;
                            entry.Secenekler = new List<ReviewOptionDTO>();
                            dictionary.Add(entry.SoruID, entry);
                        }

                        // 2. Add the option to the question's list
                        entry.Secenekler.Add(option);
                        return entry;
                    },
                    new { OturumID = oturumId },
                    splitOn: "SecenekID", // <--- The column that separates Question data from Option data
                    commandType: CommandType.StoredProcedure
                );

                return dictionary.Values.ToList();
            }
        }
    }
}
