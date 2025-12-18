// Defines what the frontend sents to us
namespace TestBankasi.API.Models.DTOs
{
    public class StartExamDTO
    {
        public int DersID { get; set; }
        public int SoruSayisi { get; set; }
        public int SureDakika { get; set; }

        // Optional filters (Nullable because the user might want a "General Exam")
        public List<string>? Konular { get; set; }
        public int? ZorlukID { get; set; }
    }
}
