using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public interface IExamAnalysisRepository
    {
        // Student's personal view
        Task<IEnumerable<StudentPerformanceDTO>> GetStudentPerformanceAsync(int kullaniciId);

        // Teacher's overview (Admin/Teacher only)
        Task<IEnumerable<TopicPreferenceDTO>> GetMostPreferredTopicsAsync(int seviyeId);
        Task<IEnumerable<TopicSuccessDTO>> GetHighestScoringTopicsAsync(int seviyeId);
        Task<IEnumerable<TopStudentDTO>> GetTopStudentsAsync(int seviyeId);
    }
}
