//displaying the choices.
namespace TestBankasi.API.Models.DTOs
{
    public class ExamQuestionDTO
    {
        public int OturumID { get; set; }
        public int SoruID { get; set; } // Critical for dictionary lookup
        public int SoruSira { get; set; }
        public string SoruMetin { get; set; }

        // The container for the 4 options coming from the JOIN
        public List<ExamOptionDTO> Secenekler { get; set; } = new List<ExamOptionDTO>();
    }
}
