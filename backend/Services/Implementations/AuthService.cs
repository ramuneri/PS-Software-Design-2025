
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Data.Models;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;


namespace backend.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly UserManager<User> _userManager;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;
    
    public AuthService(UserManager<User> userManager, IConfiguration config, ApplicationDbContext context)
    {
        _userManager = userManager;
        _config = config;
        _context = context;
    }
    
    public async Task<LoginResponseDto?> Login(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, password))
            return null;

        var accessToken = GenerateJwt(user);
        var refreshToken = GenerateRefreshToken();
        
        var refreshTokenEntity= new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_config["Jwt:RefreshTokenExpiryDays"]!))
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new LoginResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
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

    public async Task<RefreshTokenDto?> RefreshToken(string refreshToken)
    {
        var tokenEntity = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == refreshToken && !t.IsRevoked);

        if (tokenEntity == null || tokenEntity.ExpiresAt < DateTime.UtcNow)
            return null;

        var user = await _userManager.FindByIdAsync(tokenEntity.UserId);
        if (user == null)
            return null;
        
        tokenEntity.IsRevoked = true;

        var newRefreshToken = GenerateRefreshToken();
        var newRefreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "7"))
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync();

        var newAccessToken = GenerateJwt(user);

        return new RefreshTokenDto(
            AccessToken: newAccessToken,
            RefreshToken: newRefreshToken,
            ExpiresIn: int.Parse(_config["Jwt:AccessTokenExpiryMinutes"]!) * 60,
            TokenType: "Bearer"
        );
    }

    public async Task Logout(string userId, string? refreshToken, bool allSessions)
    {
        var query = _context.RefreshTokens
            .Where(t => t.UserId == userId && !t.IsRevoked);

        if (!allSessions && refreshToken != null)
        {
            query = query.Where(t => t.Token == refreshToken);
        }

        var tokens = await query.ToListAsync();
        if (tokens.Count == 0) return;

        foreach (var token in tokens)
            token.IsRevoked = true;

        await _context.SaveChangesAsync();
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
    
    private string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        RandomNumberGenerator.Create().GetBytes(randomBytes);
        
        return Convert.ToBase64String(randomBytes);
    }
}