//1. Input DTOs (The Requests)
//These files define what the user sends to the API. They usually contain Validation attributes (e.g., [Required]).
using System.ComponentModel.DataAnnotations;

namespace TestBankasi.API.Models.DTOs
{
    public class UserRegisterDTO
    {
        // DataAnnotations ([Required]) validate the input automatically. 
        // If the user sends a blank Name, the API rejects it before it even reaches your code.

        [Required]
        public string Ad { get; set; }

        [Required]
        public string Soyad { get; set; }

        [Required]
        public DateTime DogumTarihi { get; set; }

        [Required]
        public int SeviyeID { get; set; }

        [Required]
        [EmailAddress] // Ensures it actually looks like an email
        public string Email { get; set; }

        [Required]
        [MinLength(6)] // meaningful security rule
        public string Sifre { get; set; }
    }
}
