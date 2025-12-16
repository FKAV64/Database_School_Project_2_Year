using TestBankasi.API.Models;

namespace TestBankasi.API.DataAccess
{
    public interface ITokenService
    {
        // It takes a User object and prints out a string (The Token)
        string CreateToken(User user);
    }
}
