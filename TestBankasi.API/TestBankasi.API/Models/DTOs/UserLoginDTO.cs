using System.ComponentModel.DataAnnotations;

namespace TestBankasi.API.Models.DTOs
{
    public class UserLoginDTO
    {
        [Required]
        [EmailAddress]
        // ⚠️ NEW: This Regex enforces "text" + "@" + "text" + "." + "text"
        [RegularExpression(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", ErrorMessage = "Email must contain a valid domain (e.g., .com, .net).")]
        public string Email { get; set; }

        [Required]
        public string Sifre { get; set; }
    }
}
