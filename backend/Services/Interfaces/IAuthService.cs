using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IAuthService
{
    public Task<LoginResponseDto?> Login(string email, string password);
    public Task<RefreshTokenDto?> RefreshToken(string refreshToken);
    public Task Logout(string userId, string? refreshToken, bool allSessions = false);
}