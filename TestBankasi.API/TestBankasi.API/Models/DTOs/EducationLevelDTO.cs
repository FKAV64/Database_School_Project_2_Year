namespace TestBankasi.API.Models.DTOs
{
    public class EducationLevelDTO
    {
        public int SeviyeID { get; set; }
        public int KurumID { get; set; }
        public string KurumAdi { get; set; }  // "Fen Lisesi"
        public string SeviyeAdi { get; set; }
    }
}
