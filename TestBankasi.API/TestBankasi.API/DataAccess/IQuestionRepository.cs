using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public interface IQuestionRepository
    {
        // Change GetAllQuestionsAsync to this:
        Task<IEnumerable<QuestionListDTO>> GetQuestionsByFilterAsync(int dersId, int? konuId);
        Task<QuestionDetailDTO> GetQuestionByIdAsync(int id);
        // We return an 'int' (the new Question ID) so the frontend knows it was created
        // Add this line inside the Interface
        Task<IEnumerable<DifficultyLevelsDTO>> GetDifficultyLevelsAsync();
        Task<int> AddQuestionAsync(QuestionCreateDTO questionDto, int userId);

        Task UpdateQuestionAsync(QuestionUpdateDTO questionDto, int userId);
        Task DeleteQuestionAsync(int questionId, int userId);
        Task RestoreQuestionAsync(int questionId, int userId);
    }
}