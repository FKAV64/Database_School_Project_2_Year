namespace TestBankasi.API.Models.DTOs
{
    public class ExamHistoryDTO
    {
        public int KullaniciID { get; set; }
        public int OturumID { get; set; }
        public string OgrenciIsim { get; set; }
        public string DersAdi { get; set; }
        public string Konu {  get; set; }
        public string Zorluk { get; set; }
        public int SoruSayisi { get; set; }
        public int? Puan {  get; set; }
        public string Durum {  get; set; }
        public int SureDakika { get; set; }
        public DateTime BaslaZaman { get; set; }
        public DateTime BitisZaman { get; set; }
    }
}
