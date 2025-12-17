using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public interface IQuestionRepository
    {
        // We return an 'int' (the new Question ID) so the frontend knows it was created
        Task<int> AddQuestionAsync(QuestionCreateDTO questionDto, int userId);

        Task UpdateQuestionAsync(QuestionUpdateDTO questionDto, int userId);
        Task DeleteQuestionAsync(int questionId, int userId);
        Task RestoreQuestionAsync(int questionId, int userId);
    }
}