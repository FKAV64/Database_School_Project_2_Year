using System.ComponentModel.DataAnnotations;

namespace TestBankasi.API.Models.DTOs
{
    public class UserLoginDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Sifre { get; set; }
    }
}
