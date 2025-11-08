
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;


namespace backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _config;
    
    public AuthService(UserManager<User> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }
    
    public async Task<LoginResponseDto?> Login(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, password))
            return null;

        var accessToken = GenerateJwt(user);

        return new LoginResponseDto(
            AccessToken: accessToken,
            RefreshToken: "", // TODO: generate refresh tokens
            ExpiresIn: int.Parse(_config["Jwt:AccessTokenExpiryMinutes"]!) * 60,
            TokenType: "Bearer",
            User: new UserDto(
                Id: user.Id,
                MerchantId: "placeholder",
                Email: user.Email ?? "",
                Name: "Vardenis",
                Surname: "Pavardenis",
                PhoneNumber: user.PhoneNumber ?? "",
                Role: "Employee",
                IsSuperAdmin: false,
                IsActive: true,
                LastLoginAt: DateTime.UtcNow,
                CreatedAt: DateTime.UtcNow,
                UpdatedAt: DateTime.UtcNow
            )
        );
    }

    public Task<RefreshTokenDto> RefreshToken(string refreshToken)
    {
        throw new NotImplementedException();
    }

    public void Logout()
    {
        throw new NotImplementedException();
    }
    
    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email!),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:AccessTokenExpiryMinutes"]!)),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}