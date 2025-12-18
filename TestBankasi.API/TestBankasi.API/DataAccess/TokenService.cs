using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TestBankasi.API.Models;

namespace TestBankasi.API.DataAccess
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;
        private readonly SymmetricSecurityKey _key;

        public TokenService(IConfiguration config)
        {
            _config = config;
            // 1. We grab the Secret Key from appsettings.json
            // Encoding.UTF8.GetBytes converts the string into a byte array for encryption
            _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        }

        public string CreateToken(User user)
        {
            // 2. Create "Claims" (The info written ON the badge)
            // We store the ID, Name, and Role inside the token so we don't need to ask the DB later.

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.KullaniciID.ToString()), // Stores ID
                new Claim(ClaimTypes.Name, user.Email),              // Stores Email
                new Claim(ClaimTypes.Role, user.RolAdi),           // Stores Role names (Admin, Ogrenci,Ogretmen)
                new Claim("SeviyeID", user.SeviyeID.ToString())
            };

            // 3. Create the Credentials (The Signature)
            // We sign it using our Key and the HmacSha512 algorithm (very secure)
            var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha512Signature);

            // 4. Describe the Token
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(1), // The badge is valid for 1 day
                SigningCredentials = creds
            };

            // 5. Build and Write the Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token); // Returns the weird string "eyJhbGciOi..."
        }
    }
}