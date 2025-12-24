namespace TestBankasi.API.Models.DTOs
{
    public class QuestionDetailDTO
    {
        public int SoruID { get; set; }
        public string SoruMetin { get; set; }
        public int KonuID { get; set; }
        public int DersID { get; set; } // Matches K.DersID
        public int ZorlukID { get; set; }

        // The list of options
        public List<OptionDetailDTO> Secenekler { get; set; } = new List<OptionDetailDTO>();
    }

    public class OptionDetailDTO
    {
        public int SecenekID { get; set; }
        public string SecenekMetin { get; set; }
        public bool DogruMu { get; set; }
    }
}