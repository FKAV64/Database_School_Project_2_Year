namespace TestBankasi.API.Models.DTOs
{
    public class ReviewQuestionDTO
    {
        public int SoruID { get; set; }
        public string KonuAdi { get; set; }
        public string ZorlukAdi { get; set; }
        public string SoruMetin { get; set; }
        public int SoruSira { get; set; }
        // Nested list of options for this question
        public List<ReviewOptionDTO> Secenekler { get; set; } = new List<ReviewOptionDTO>();
    }

    public class ReviewOptionDTO
    {
        public int SecenekID { get; set; }
        public string SecenekMetin { get; set; }
        public bool IsCorrect { get; set; }  // "The Truth"
        public bool IsSelected { get; set; } // "The User's Choice"
    }
}