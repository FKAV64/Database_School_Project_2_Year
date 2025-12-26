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
        [HttpGet("lessons")]
        public async Task<IActionResult> GetLessons()
        {
            var seviyeClaim = User.FindFirst("SeviyeID");
            if (seviyeClaim == null) return BadRequest("Seviye ID bulunamadı.");
            //Here we are retrieving the user's level from his token 
            int seviyeId = int.Parse(seviyeClaim.Value);
            var lessons = await _examRepository.GetLessonsByLevelAsync(seviyeId);

            return Ok(lessons);
        }

        [Authorize]
        [HttpGet("topics/{dersId}")]
        public async Task<IActionResult> GetTopics(int dersId)
        {
            var topics = await _examRepository.GetTopicsByLessonAsync(dersId);
            return Ok(topics);
        }

        [Authorize] 
        [HttpPost("start")]
        //[FromBody] activates the JSON Deserializer to convert that raw JSON text(sent by the frontend) into your C# StartExamDTO object.
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
                    request.DersID,
                    request.SoruSayisi,
                    request.SureDakika,
                    request.Konular,
                    request.ZorlukID
                );

                // 3. Returns List of Questions with Options
                return Ok(examQuestions); // HTTP Status Code: 200 (Success)
            }
            catch (Exception ex)
            {
                // In a real app, log this error to a text file or database!
                return StatusCode(500, $"Sunucu Hatası: {ex.Message}");
            }
        }
        [Authorize]
        [HttpPost("submit")]
        public async Task<IActionResult> SubmitExam([FromBody] SubmitExamDTO submission)
        {
            try
            {
                // 1. BASIC VALIDATION (Protect against nulls)
                if (submission == null || submission.Cevaplar == null)
                {
                    return BadRequest("Geçersiz veri.");
                }

                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

                // 2. REPOSITORY CALL
                // If OturumID is wrong/belongs to someone else, this throws UnauthorizedAccessException
                var result = await _examRepository.SubmitExamAsync(submission, userId);

                return Ok(result);
            }
            // -------------------------------------------------------------
            // CATCH 1: LOGIC ERRORS (Repo threw this explicitly)
            // -------------------------------------------------------------
            catch (UnauthorizedAccessException ex)
            {
                // CASE: Frontend sent Wrong OturumID or OturumID belonging to another user
                return Unauthorized(new { Error = "Yetkisiz Erişim", Message = ex.Message });
            }
            // -------------------------------------------------------------
            // CATCH 2: DATABASE ERRORS (SQL threw this)
            // -------------------------------------------------------------
            catch (Microsoft.Data.SqlClient.SqlException ex)
            {
                // CASE: Time is Up (We threw THROW 51000 in Trigger)
                if (ex.Number == 51000)
                {
                    return StatusCode(409, new { Error = "Süre Doldu", Message = "Sınav süresi bitti." });
                }

                // CASE: Invalid IDs (Foreign Key Violation)
                // Error 547 = "The INSERT statement conflicted with the FOREIGN KEY constraint"
                // This happens if Frontend sends a SoruID or SecenekID that doesn't exist in DB.
                if (ex.Number == 547)
                {
                    return BadRequest(new { Error = "Geçersiz Veri", Message = "Gönderilen Soru veya Seçenek ID'si hatalı." });
                }

                // CASE: Custom Logic from sp_CevapKaydet (RAISERROR 16)
                // If sp_CevapKaydet says "This question does not belong to this exam"
                // Standard RAISERROR (Severity 16) usually shows up as Error Number 50000
                if (ex.Number == 50000)
                {
                    return BadRequest(new { Error = "Veri Hatası", Message = ex.Message });
                }

                // CASE: Real Crash (Connection failed, Syntax error, etc.)
                return StatusCode(500, $"Veritabanı Hatası (Kod {ex.Number}): {ex.Message}");
            }
            // -------------------------------------------------------------
            // CATCH 3: SERVER CRASHES (NullReference, FormatException, etc.)
            // -------------------------------------------------------------
            catch (Exception ex)
            {
                return StatusCode(500, $"Sunucu Hatası: {ex.Message}");
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

        [HttpGet("result-summary/{oturumId}")]
        [Authorize]
        public async Task<IActionResult> GetExamReviewAsync(int oturumId)
        {
            // 1. EXTRACT ID FROM TOKEN (Security Best Practice)
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            var summary = await _examRepository.GetExamReviewAsync(oturumId);

            if (summary == null) return NotFound("Exam session not found.");

            return Ok(summary);
        }
        [Authorize]
        [HttpGet("review-details/{oturumId}")]
        public async Task<IActionResult> GetReviewDetails(int oturumId)
        {
            // 1. EXTRACT ID (Ideally, you should use this to check ownership)
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            // 2. FETCH DATA
            var data = await _examRepository.GetReviewDetailsAsync(oturumId);
            return Ok(data);
        }
    }
}
