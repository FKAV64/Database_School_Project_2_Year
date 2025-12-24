using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TestBankasi.API.DataAccess;

namespace TestBankasi.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StatsController : ControllerBase
    {
        // CLEAN DESIGN: We inject the specific repo for analytics
        private readonly IExamAnalysisRepository _analysisRepository;

        public StatsController(IExamAnalysisRepository analysisRepository)
        {
            _analysisRepository = analysisRepository;
        }

        [HttpGet("my-performance")]
        [Authorize]
        public async Task<IActionResult> GetMyPerformance()
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();
            int userId = int.Parse(userIdClaim.Value);

            var stats = await _analysisRepository.GetStudentPerformanceAsync(userId);
            return Ok(stats);
        }

        // ---------------------------------------------------------
        // ADMIN / TEACHER DASHBOARD ENDPOINTS
        // ---------------------------------------------------------

        [HttpGet("dashboard/preferred-topics")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> GetPreferredTopics([FromQuery] int? dersId)
        {
            // 1 Line validation
            if (CurrentSeviyeID == 0) return Unauthorized("Token geçersiz. Tekrar giriş yapın.");

            // Clean call
            var data = await _analysisRepository.GetMostPreferredTopicsAsync(CurrentSeviyeID, dersId);
            return Ok(data);
        }

        [HttpGet("dashboard/high-scores")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> GetHighScoringTopics([FromQuery] int? dersId)
        {
            if (CurrentSeviyeID == 0) return Unauthorized("Token geçersiz. Tekrar giriş yapın.");

            var data = await _analysisRepository.GetHighestScoringTopicsAsync(CurrentSeviyeID, dersId);
            return Ok(data);
        }

        [HttpGet("dashboard/top-students")]
        [Authorize(Roles = "Admin,Ogretmen")]
        public async Task<IActionResult> GetTopStudents([FromQuery] int? dersId)
        {
            if (CurrentSeviyeID == 0) return Unauthorized("Token geçersiz. Tekrar giriş yapın.");

            var data = await _analysisRepository.GetTopStudentsAsync(CurrentSeviyeID, dersId);
            return Ok(data);
        }
        // Helper Property: Extracts seveyiID safely. Returns 0 if missing.
        private int CurrentSeviyeID
        {
            get
            {
                var claim = User.FindFirst("SeviyeID");
                // If claim exists, parse it. If null, return 0.
                return claim != null ? int.Parse(claim.Value) : 0;
            }
        }
    }
}