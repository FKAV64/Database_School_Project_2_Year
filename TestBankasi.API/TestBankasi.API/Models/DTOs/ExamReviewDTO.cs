namespace TestBankasi.API.Models.DTOs
{
    public class ExamReviewDTO
    {
        public int OturumID {  get; set; }
        public int SoruID { get; set; }
        public int SoruSira {  get; set; }
        public string KonuAdi { get; set; }
        public string ZorlukAdi { get; set; }
        public string SoruMetin {  get; set; }
        public string VerilenCevap {  get; set; }
        public string Sonuc {  get; set; }
        public string DogruCevapMetin { get; set; }

    }
}
