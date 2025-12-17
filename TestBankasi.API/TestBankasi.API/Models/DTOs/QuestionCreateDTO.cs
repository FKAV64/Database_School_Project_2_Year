namespace TestBankasi.API.Models.DTOs
{
    // The main object representing the Question
    public class QuestionCreateDTO
    {
        public int KonuID { get; set; }
        public int ZorlukID { get; set; }
        public string SoruMetin { get; set; }

        // The list of options belonging to this question
        public List<OptionCreateDTO> Secenekler { get; set; }
    }

    // A helper object for the Options inside the list
    public class OptionCreateDTO
    {
        // This MUST match the JSON key in your stored procedure sp_SoruVeSecenekEkle
        public string SecenekMetin { get; set; }
        public bool DogruMu { get; set; }
    }
}