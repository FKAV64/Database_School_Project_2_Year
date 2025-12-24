namespace TestBankasi.API.Models.DTOs
{
    // 1. For "Most Preferred Topics"
    public class TopicPreferenceDTO
    {
        public string KonuAdi { get; set; }
        public int YapilanSayisi { get; set; }
    }

    // 2. For "Highest Scoring Topics"
    public class TopicSuccessDTO
    {
        public string KonuAdi { get; set; }
        public decimal BasariOrani { get; set; }
    }

    // 3. For "Highest Scoring Students"
    public class TopStudentDTO
    {
        public int KullaniciID { get; set; }
        public string OgrenciIsim { get; set; }
        public string? DersAdi { get; set; }
        public decimal BasariOrani { get; set; }
    }
}