using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IAuthService
{
    public Task<LoginResponseDto?> Login(string email, string password);
    public Task<RefreshTokenDto> RefreshToken(string refreshToken);
    public void Logout();
}