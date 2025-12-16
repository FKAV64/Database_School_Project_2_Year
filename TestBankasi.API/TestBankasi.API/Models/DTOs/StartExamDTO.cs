// Defines what the frontend sents to us
namespace TestBankasi.API.Models.DTOs
{
    public class StartExamDTO
    {
        public int LessonId { get; set; }
        public int QuestionCount { get; set; }
        public int DurationMinutes { get; set; }

        // Optional filters (Nullable because the user might want a "General Exam")
        public List<string>? Topics { get; set; }
        public int? DifficultyLevel { get; set; }
    }
}
