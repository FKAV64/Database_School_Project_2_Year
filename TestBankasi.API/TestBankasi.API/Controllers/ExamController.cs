//This handles the HTTP request, checks security, and calls your repository.
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TestBankasi.API.DataAccess; // <--- Pointing to your Repository folder
using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExamController : ControllerBase
    {
        private readonly IExamRepository _examRepository;

        public ExamController(IExamRepository examRepository)
        {
            _examRepository = examRepository;
        }

        [Authorize] // <--- SECURITY: Only logged-in users allowed
        [HttpPost("start")]
        public async Task<IActionResult> StartExam([FromBody] StartExamDTO request)
        {
            try
            {
                // 1. Who is knocking? (Get User ID from the Token)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

                if (userIdClaim == null)
                    return Unauthorized("Token geçersiz. Kullanıcı kimliği bulunamadı.");

                int userId = int.Parse(userIdClaim.Value);

                // 2. Call the Engine
                var examQuestions = await _examRepository.StartExamAsync(
                    userId,
                    request.LessonId,
                    request.QuestionCount,
                    request.DurationMinutes,
                    request.Topics,
                    request.DifficultyLevel
                );

                // 3. Return the Menu (List of Questions with Options)
                return Ok(examQuestions); // HTTP Status Code: 200 (Success)
            }
            catch (Exception ex)
            {
                // In a real app, log this error to a text file or database!
                return StatusCode(500, $"Sunucu Hatası: {ex.Message}");
            }
        }
        [Authorize]
        [HttpPost("submit")] //POST - Create New Resource
        public async Task<IActionResult> SubmitExam([FromBody] SubmitExamDTO submission)
        {
            try
            {
                // 1. Get User ID (The "Who are you?" check)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null) return Unauthorized();
                int userId = int.Parse(userIdClaim.Value);

                // 2. Validate Input
                if (submission == null || submission.Cevaplar == null || !submission.Cevaplar.Any())
                {
                    return BadRequest("Gönderilen sınav verisi boş olamaz.");
                }

                // 3. Call Repository with UserID
                var result = await _examRepository.SubmitExamAsync(submission, userId);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex) // Catch the specific security error
            {
                return Unauthorized(ex.Message); // Return 401 to the user
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Hata: {ex.Message}");
            }
        }
        [HttpGet("my-history")] // GET - Read/Retrieve Data
        [Authorize]
        public async Task<IActionResult> GetMyExamHistory()
        {
            // 1. EXTRACT ID FROM TOKEN (Security Best Practice)
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            int currentUserId = int.Parse(userIdClaim.Value);

            // 2. FETCH DATA
            var history = await _examRepository.GetStudentHistoryAsync(currentUserId);

            return Ok(history);
        }

        [HttpGet("review/{oturumId}")]
        [Authorize]
        public async Task<IActionResult> GetExamReview(int oturumId)
        {
            // 1. EXTRACT ID (Ideally, you should use this to check ownership)
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            // 2. FETCH DATA
            var reviewData = await _examRepository.GetExamReviewAsync(oturumId);

            return Ok(reviewData);
        }
    }
}
