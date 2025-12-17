namespace TestBankasi.API.Models.DTOs
{
    public class QuestionUpdateDTO
    {
        public int SoruID { get; set; } // Critical: We need to know WHICH question to edit
        public string SoruMetin { get; set; }
        public int ZorlukID { get; set; }

        public List<OptionUpdateDTO> Secenekler { get; set; }
    }

    public class OptionUpdateDTO
    {
        public int SecenekID { get; set; } // Critical: Match this specific option
        public string SecenekMetin { get; set; }
        public bool DogruMu { get; set; }
    }
}