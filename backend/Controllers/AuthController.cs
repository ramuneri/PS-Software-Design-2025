using System.Globalization;
using System.Security.Claims;
using System.Text.RegularExpressions;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.JsonWebTokens;

namespace backend.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController(IAuthService authService, IConfiguration config) : ControllerBase
{
    public record LoginRequest(string Email, string Password);
    public record LogoutRequest(bool AllSessions = false);
    
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto?>> Login([FromBody] LoginRequest request)
    {
        if (!IsValidEmail(request.Email))
            return BadRequest(new { message = "Invalid email format" });

        var result = await authService.Login(request.Email, request.Password);

        if (result == null)
            return Unauthorized(new { message = "Invalid credentials" });
        
        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(int.Parse(config["Jwt:RefreshTokenExpiryDays"]!))
        });

        return Ok(result);
    }
    
    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshTokenDto>> RefreshToken()
    {
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
            return Unauthorized(new { message = "No refresh token" });
        
        var result = await authService.RefreshToken(refreshToken);
        if (result == null)
            return Unauthorized(new { message = "Invalid or expired refresh token" });
        
        Response.Cookies.Append("refreshToken", result.RefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        });

        return Ok(result);
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId == null)
        {
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });
            return NoContent();
        }

        Request.Cookies.TryGetValue("refreshToken", out var refreshToken);
    
        await authService.Logout(userId, request.AllSessions ? null : refreshToken, request.AllSessions);

        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/"
        });

        return NoContent();
    }
    
    private static bool IsValidEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        try
        {
            // Normalize the domain
            email = Regex.Replace(email, @"(@)(.+)$", DomainMapper,
                RegexOptions.None, TimeSpan.FromMilliseconds(200));

            // Examines the domain part of the email and normalizes it.
            string DomainMapper(Match match)
            {
                // Use IdnMapping class to convert Unicode domain names.
                var idn = new IdnMapping();

                // Pull out and process domain name (throws ArgumentException on invalid)
                string domainName = idn.GetAscii(match.Groups[2].Value);

                return match.Groups[1].Value + domainName;
            }
        }
        catch (RegexMatchTimeoutException e)
        {
            return false;
        }
        catch (ArgumentException e)
        {
            return false;
        }

        try
        {
            return Regex.IsMatch(email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
                RegexOptions.IgnoreCase, TimeSpan.FromMilliseconds(250));
        }
        catch (RegexMatchTimeoutException)
        {
            return false;
        }
    }
}