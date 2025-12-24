using Dapper;
using System.Data;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public class ExamAnalysisRepository : IExamAnalysisRepository
    {
        private readonly DapperContext _context;

        public ExamAnalysisRepository(DapperContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StudentPerformanceDTO>> GetStudentPerformanceAsync(int kullaniciId)
        {
            var query = @"
                SELECT 
                    DersAdi, 
                    KonuAdi, 
                    ZorlukAdi, 
                    ToplamSoru, 
                    DogruSayisi
                FROM View_DetayliPerformans 
                WHERE KullaniciID = @Uid";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<StudentPerformanceDTO>(query, new { Uid = kullaniciId});
            }
        }

        public async Task<IEnumerable<TopicPreferenceDTO>> GetMostPreferredTopicsAsync(int seviyeId, int? dersId = null)
        {
            //Ranking topics by preference
            var query = @"
                SELECT KonuAdi, COUNT(*) AS YapilanSayisi
                FROM View_DetayliPerformans
                WHERE SeviyeID = @Sid AND (@Did IS NULL OR DersID = @Did)
                GROUP BY KonuAdi
                ORDER BY YapilanSayisi DESC";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<TopicPreferenceDTO>(query, new { Sid = seviyeId, Did = dersId });
            }
        }

        public async Task<IEnumerable<TopicSuccessDTO>> GetHighestScoringTopicsAsync(int seviyeId, int? dersId = null)
        {
            // Ranking topics by sucess rate
            var query = @"
                SELECT KonuAdi, CAST(AVG(BasariYuzdesi*1.00) AS DECIMAL(5,2)) AS BasariOrani 
                FROM View_DetayliPerformans
                WHERE SeviyeID = @Sid AND (@Did IS NULL OR DersID = @Did)
                GROUP BY KonuAdi
                ORDER BY BasariOrani DESC";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<TopicSuccessDTO>(query, new { Sid = seviyeId, Did = dersId });
            }
        }
        public async Task<IEnumerable<TopStudentDTO>> GetTopStudentsAsync(int seviyeId, int? dersId = null)
        {
            //  student ranking per subject per educational level
            string query;

            if (dersId.HasValue)
            {
                // CASE A: Specific Lesson -> Rank by that lesson
                query = @"
                    SELECT
                        KullaniciID,
                        OgrenciIsim,
                        DersAdi,
                        CAST(AVG(BasariYuzdesi * 1.00) AS DECIMAL(5, 2)) AS BasariOrani
                    FROM View_DetayliPerformans
                    WHERE SeviyeID = @Sid AND DersID = @Did
                    GROUP BY KullaniciID, OgrenciIsim, DersAdi
                    ORDER BY BasariOrani DESC";
            }
            else
            {
                // CASE B: Mixed Mode -> Rank by Global Average (GPA)
                query = @"
                    SELECT
                        KullaniciID,
                        OgrenciIsim,
                        
                        CAST(AVG(BasariYuzdesi*1.00) AS DECIMAL(5,2)) AS BasariOrani
                    FROM View_DetayliPerformans
                    WHERE SeviyeID = @Sid
                    GROUP BY KullaniciID, OgrenciIsim
                    ORDER BY BasariOrani DESC";
            }

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<TopStudentDTO>(query, new { Sid = seviyeId, Did = dersId });
            }
        }
    }
}