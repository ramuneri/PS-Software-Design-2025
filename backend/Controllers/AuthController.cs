using System.Globalization;
using System.Text.RegularExpressions;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    public record LoginRequest(string Email, string Password);
    public record RefreshRequest(string RefreshToken);
    public record LogoutRequest(bool AllSessions = false);
    
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto?>> Login([FromBody] LoginRequest request)
    {
        if (!IsValidEmail(request.Email))
            return BadRequest(new { message = "Invalid email format" });

        var result = await authService.Login(request.Email, request.Password);

        if (result == null)
            return Unauthorized(new { message = "Invalid credentials" });

        return Ok(result);
    }
    
    [HttpPost("refresh")]
    public async Task<ActionResult<RefreshTokenDto>> RefreshToken([FromBody] RefreshRequest request)
    {
        throw new NotImplementedException();
    }
    
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
    {
        throw new NotImplementedException();
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