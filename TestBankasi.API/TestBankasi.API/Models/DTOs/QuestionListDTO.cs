namespace TestBankasi.API.Models.DTOs
{
    // The "Light" object for the Grid
    public class QuestionListDTO
    {
        public int SoruID { get; set; }
        public string SoruMetin { get; set; }
        public string KonuAdi { get; set; }
        public string ZorlukAdi { get; set; }
        public DateTime? SilinmeTarihi { get; set; }
    }
}