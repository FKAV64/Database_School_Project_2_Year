//Entities (The Storage)
//This file mirrors the SQL Tables exactly. They live in the Core layer and map 1-to-1 to the columns.
namespace TestBankasi.API.Models
{
    public class User
    {
        public int KullaniciID { get; set; }
        public string Ad { get; set; }
        public string Soyad { get; set; }
        public string Email { get; set; }
        public string Sifre { get; set; } // The Hash
        public int RolID { get; set; }
        public string RolAdi { get; set; }
        public int SeviyeID { get; set; }
    }
}
