namespace backend.Dtos;

public record RefreshTokenDto(string AccessToken, string RefreshToken, int ExpiresIn, string TokenType);