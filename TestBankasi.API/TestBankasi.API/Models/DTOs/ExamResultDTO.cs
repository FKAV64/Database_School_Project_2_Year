//3. Output DTOs (The Responses)
//These files define what you show the user. They hide sensitive data.
namespace TestBankasi.API.Models.DTOs
{
    public class ExamResultDTO
    {
        public int OturumID { get; set; }
        public int Dogru { get; set; }
        public int Toplam { get; set; }
        public int Puan { get; set; }
        public DateTime BitirZaman { get; set; }
    }
}
