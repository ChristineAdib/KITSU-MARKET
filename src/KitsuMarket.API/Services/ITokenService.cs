using KitsuMarket.API.Data.Entities;

namespace KitsuMarket.API.Services;

public interface ITokenService
{
    (string Token, DateTime ExpiresAtUtc) GenerateToken(ApplicationUser user, IList<string> roles);
}
