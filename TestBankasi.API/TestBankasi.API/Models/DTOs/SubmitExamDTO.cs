//The Frontend will send us a "Package" containing the Session ID and a list of answers.
namespace TestBankasi.API.Models.DTOs
{
    public class SubmitExamDTO
    {
        public int OturumID { get; set; } // Which exam is this?
        public List<SubmitAnswerDTO> Cevaplar { get; set; } = new List<SubmitAnswerDTO>();
    }
}

