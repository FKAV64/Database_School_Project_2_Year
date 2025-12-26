namespace TestBankasi.API.Models.DTOs
{
    public class StudentPerformanceDTO
    {
        public string DersAdi { get; set; }
        public string KonuAdi { get; set; }
        public string ZorlukAdi { get; set; }
        public int ToplamSoru { get; set; }
        public int DogruSayisi { get; set; }
    }
}
