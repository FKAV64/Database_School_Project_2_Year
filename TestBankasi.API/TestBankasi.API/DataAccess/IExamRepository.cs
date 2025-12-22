using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public interface IExamRepository
    {
        Task<IEnumerable<LessonDTO>> GetLessonsByLevelAsync(int seviyeId);
        Task<IEnumerable<TopicDTO>> GetTopicsByLessonAsync(int dersId);

        // The contract: "I promise to start an exam and return a list of questions"
        Task<List<ExamQuestionDTO>> StartExamAsync(int userId, int lessonId, int questionCount, int duration, List<string> topics = null, int? difficultyLevel = null);

        // The contract: "I promise to save user answers and return results"
        // Also ensure that the oturumID in question belongs to userID
        Task<ExamResultDTO> SubmitExamAsync(SubmitExamDTO submission, int userId);
        // I provide allow quiz reviews
        Task<IEnumerable<ExamHistoryDTO>> GetStudentHistoryAsync(int kullaniciId);
        Task<IEnumerable<ReviewQuestionDTO>> GetReviewDetailsAsync(int oturumId);
        Task<ExamReviewDTO> GetExamReviewAsync(int oturumId);

    }
}
