using Microsoft.AspNetCore.Mvc;
using TestBankasi.API.DataAccess; // Import our Interface
using TestBankasi.API.Models.DTOs; // Import our DTO

namespace TestBankasi.API.Controllers
{
    [Route("api/[controller]")] // This defines the URL: localhost/api/auth
    [ApiController] // This tells .NET "This class handles HTTP API requests"
    public class AuthController : ControllerBase
    {
        private readonly IAuthRepository _authRepo;
        private readonly ITokenService _tokenService;

        // 1. Dependency Injection
        // We ask the framework: "Give me the Chef (Repository) we registered in Program.cs"
        public AuthController(IAuthRepository authRepo, ITokenService tokenService)
        {
            _authRepo = authRepo;
            _tokenService = tokenService;
        }

        // =================================================================
        // Register ENDPOINT
        // =================================================================
        // HTTP POST method because we are SENDING data to create a resource
        [HttpPost("register")] // URL: localhost/api/auth/register
        // IActionResult means this function can return any type ok, unauthorized
        public async Task<IActionResult> Register(UserRegisterDTO userDTO)
        {
            try
            {
                // The framework has already converted the JSON into userDTO for us!

                // Call the repository to save the user
                // await is from AuthRepository
                var newId = await _authRepo.RegisterUser(userDTO);

                // Return 200 OK with the new ID
                return Ok(new { Message = "Student registered successfully!", UserId = newId });
            }
            catch (Exception ex)
            {
                // If SQL throws an error (like "Email already exists"), catch it here
                return BadRequest(new { Error = ex.Message });
            }
        }
        // =================================================================
        // LOGIN ENDPOINT
        // =================================================================
        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDTO loginDTO)
        {
            // 1. Check if user exists in DB
            var user = await _authRepo.GetUserByEmail(loginDTO.Email);

            if (user == null)
            {
                // Yes it should only be Invalid email yh but it will help hackers and bots know all emails we have on the DB
                return Unauthorized(new { Error = "Invalid email or password" });
            }

            // 2. Check Password
            // We verify the plain text input against the Hashed password from DB
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDTO.Sifre, user.Sifre);

            if (!isPasswordValid)
            {
                return Unauthorized(new { Error = "Invalid email or password" });
            }

            // 3. Create Token
            // If we get here, the user is who they say they are. Give them a badge.
            var tokenString = _tokenService.CreateToken(user);

            return Ok(new { Token = tokenString, Message = "Login Successful" });
        }
        
        [HttpGet("education-levels")]
        public async Task<IActionResult> GetEducationLevels()
        {
            var levels = await _authRepo.GetEducationLevelsAsync();
            return Ok(levels);
        }
    }
}
