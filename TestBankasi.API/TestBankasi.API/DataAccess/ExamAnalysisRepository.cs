using Dapper;
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
                    DogruSayisi, 
                    BasariYuzdesi 
                FROM View_DetayliPerformans 
                WHERE KullaniciID = @Uid
                ORDER BY BasariYuzdesi,DersAdi, KonuAdi";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<StudentPerformanceDTO>(query, new { Uid = kullaniciId });
            }
        }

        public async Task<IEnumerable<TopicPreferenceDTO>> GetMostPreferredTopicsAsync(int seviyeId)
        {
            //Ranking topics by preference
            var query = @"
                SELECT KonuAdi, COUNT(*) AS YapilanSayisi
                FROM View_DetayliPerformans
                WHERE SeviyeID = @Sid
                GROUP BY KonuAdi
                ORDER BY YapilanSayisi DESC";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<TopicPreferenceDTO>(query, new { Sid = seviyeId });
            }
        }

        public async Task<IEnumerable<TopicSuccessDTO>> GetHighestScoringTopicsAsync(int seviyeId)
        {
            // Ranking topics by sucess rate
            var query = @"
                SELECT KonuAdi, CAST(AVG(BasariYuzdesi*1.00) AS DECIMAL(5,2)) AS BasariOrani 
                FROM View_DetayliPerformans
                WHERE SeviyeID = @Sid
                GROUP BY KonuAdi
                ORDER BY BasariOrani DESC";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<TopicSuccessDTO>(query, new { Sid = seviyeId });
            }
        }
        public async Task<IEnumerable<TopStudentDTO>> GetTopStudentsAsync(int seviyeId)
        {
            //  student ranking per subject per educational level
            var query = @"
                SELECT
                    KullaniciID,
                    OgrenciIsim,
                    KurumAdi,
                    SeviyeAdi,
                    DersAdi, 
                    CAST(AVG(BasariYuzdesi*1.00) AS DECIMAL(5,2)) AS BasariOrani 
                FROM View_DetayliPerformans
                WHERE SeviyeID = @Sid
                GROUP BY KurumAdi, SeviyeAdi, DersAdi, KullaniciID, OgrenciIsim 
                ORDER BY BasariOrani DESC";

            using (var connection = _context.CreateConnection())
            {
                return await connection.QueryAsync<TopStudentDTO>(query, new { Sid = seviyeId });
            }
        }
    }
}