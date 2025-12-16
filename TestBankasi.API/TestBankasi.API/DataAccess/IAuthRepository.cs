//Why do we use interfaces
/*
Imagine you go to a restaurant. You look at the Menu (The Interface).

The Menu says: "Burger - $10".

You order the Burger.

You don't care who the Chef is.

You don't care if the Chef uses a gas stove, an electric stove, or a microwave.

You just want what the Menu promised.

In Code: The Controlleris a Customer. It only looks at IAuthRepository (The Menu).
It doesn't know—and shouldn't know—that AuthRepository uses Dapper or SQL.

The Major Advantage: If tomorrow you decide to switch from Dapper to Entity Framework,
or if you want to save users to a text file instead of a database, you only change the Chef (Repository).
You don't have to change the Menu (Interface) or the Customer (Controller). This decouples your code.

2. Testing (The "Fake" Database)
This is the biggest reason. Later, you will want to test if your "Sign Up"
logic works without actually saving junk data into your real database.

*/


using TestBankasi.API.Models;
using TestBankasi.API.Models.DTOs;

namespace TestBankasi.API.DataAccess
{
    public interface IAuthRepository
    {
        // The Task<> means this is Asynchronous (it runs in the background).
        // It takes the DTO we made in Models.DTOs, and returns the new User's ID (int).
        Task<int> RegisterUser(UserRegisterDTO userDTO);

        // It returns a "User" object (if found) or null
        Task<User> GetUserByEmail(string email);
        Task<IEnumerable<EducationLevelDTO>> GetEducationLevelsAsync();
    }
}
