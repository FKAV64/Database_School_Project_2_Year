namespace TestBankasi.API.Models.DTOs
{
    public class ExamReviewDTO
    {
        public int OturumID { get; set; }
        public string DersAdi { get; set; }
        public int Puan { get; set; }
        public DateTime BaslaZaman { get; set; }
        public DateTime? BitirZaman { get; set; }
        public int SureDakika { get; set; }

    }
}
