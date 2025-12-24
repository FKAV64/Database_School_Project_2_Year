using Microsoft.AspNetCore.Authorization; // Needed for [Authorize]
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims; // Needed to read User ID from token
using TestBankasi.API.DataAccess;
using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class QuestionController : ControllerBase
    {
        private readonly IQuestionRepository _questionRepo;

        public QuestionController(IQuestionRepository questionRepo)
        {
            _questionRepo = questionRepo;
        }

        [HttpGet("list")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> GetQuestions([FromQuery] int dersId, [FromQuery] int? konuId)
        {
            // Validation: Teacher must select at least a Lesson
            if (dersId == 0) return BadRequest("Lütfen bir ders seçiniz.");

            var list = await _questionRepo.GetQuestionsByFilterAsync(dersId, konuId);
            return Ok(list);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> GetQuestionDetail(int id)
        {
            var question = await _questionRepo.GetQuestionByIdAsync(id);

            if (question == null)
                return NotFound("Question not found.");

            return Ok(question);
        }

        [HttpGet("difficultyLevels")]
        [Authorize] // Any logged-in user can see this list
        public async Task<IActionResult> GetDifficultyLevels()
        {
            var list = await _questionRepo.GetDifficultyLevelsAsync();
            return Ok(list);
        }

        [HttpPost("add")]
        [Authorize(Roles = "Admin,Ogretmen")] // Only Admin or Teacher can add questions
        public async Task<IActionResult> AddQuestion([FromBody] QuestionCreateDTO questionDto)
        {
            try
            {
                // 1. Get the current User ID from the JWT Token
                // (We don't trust the frontend to send the UserID)
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                {
                    return Unauthorized("Kullanıcı kimliği doğrulanamadı.");
                }
                int userId = int.Parse(userIdClaim);

                // 2. Call the Repository
                int newQuestionId = await _questionRepo.AddQuestionAsync(questionDto, userId);

                // 3. Return Success
                return Ok(new { Message = "Soru başarıyla eklendi.", SoruID = newQuestionId });
            }
            catch (Exception ex)
            {
                // If SQL throws an error (like "Must have 2 options"), we catch it here
                return BadRequest(new { Error = ex.Message });
            }
        }
        // ... (Inside QuestionController Class) ...

        [HttpPut("update")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> UpdateQuestion([FromBody] QuestionUpdateDTO questionDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                await _questionRepo.UpdateQuestionAsync(questionDto, userId);

                return Ok(new { Message = "Soru ve seçenekler başarıyla güncellendi." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpDelete("delete/{id}")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                await _questionRepo.DeleteQuestionAsync(id, userId);

                return Ok(new { Message = "Soru arşive gönderildi (Silindi)." });
            }
            catch (Exception ex)
            {
                // This catches the RAISERROR from SQL if ID is wrong
                return BadRequest(new { Error = ex.Message });
            }
        }

        [HttpPatch("restore/{id}")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> RestoreQuestion(int id)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                await _questionRepo.RestoreQuestionAsync(id, userId);

                return Ok(new { Message = "Soru geri yüklendi ve tekrar aktif." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }
}